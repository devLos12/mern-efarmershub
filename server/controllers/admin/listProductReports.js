import Product from "../../models/products.js";
import Order from "../../models/order.js";




export const getListProducts = async (req, res) => {
    try {
        const { period, dateFrom, dateTo } = req.query;
        
        // Get all approved products with seller info
        const products = await Product.find({ statusApprove: "approved" })
            .populate('seller', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate date range based on period (in UTC)
        const now = new Date();
        let startDate, endDate;

        switch(period) {
            case "today":
                startDate = new Date(now);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setUTCHours(23, 59, 59, 999);
                break;
            
            case "yesterday":
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(yesterday);
                endDate.setUTCHours(23, 59, 59, 999);
                break;
                
            case "weekly":
                const dayOfWeek = now.getUTCDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startDate = new Date(now);
                startDate.setDate(now.getDate() + diff);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setUTCHours(23, 59, 59, 999);
                break;
                
            case "monthly":
                startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
                endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
                break;
                
            case "yearly":
                startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
                endDate = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
                break;
            
            case "custom":
                if (dateFrom && dateTo) {
                    startDate = new Date(dateFrom);
                    startDate.setUTCHours(0, 0, 0, 0);
                    endDate = new Date(dateTo);
                    endDate.setUTCHours(23, 59, 59, 999);
                } else {
                    startDate = new Date(now);
                    startDate.setUTCHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setUTCHours(23, 59, 59, 999);
                }
                break;
                
            default:
                startDate = new Date(now);
                startDate.setUTCHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setUTCHours(23, 59, 59, 999);
        }



        // Get DELIVERED/COMPLETE orders within the time period
        const orders = await Order.find({
            paymentStatus: "paid",
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();


        // Map products with sold count
        const productsWithSales = products.map(product => {
            let soldCount = 0;
            
            orders.forEach(order => {
                order.orderItems.forEach(orderProduct => {
                    const productId = product._id.toString();
                    const orderProdId = orderProduct.prodId?.toString();
                    
                    if (orderProdId === productId) {
                        soldCount += orderProduct.quantity || 0;
                    }
                });
            });

            return {
                ...product,
                soldToday: soldCount,
            };
        });


        res.status(200).json(productsWithSales);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: error.message });
    }
};