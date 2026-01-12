import Product from "../models/products.js";
import Order from "../models/order.js";




// Get Best Seller Products (All-Time)
export const getBestSellers = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Get all approved products with seller info
        const products = await Product.find({ statusApprove: "approved" })
            .populate('seller.id', 'name email')
            .sort({ createdAt: -1 })
            .lean();

    
        // Get ALL delivered/completed orders (all-time, no date filter)
        const orders = await Order.find({
            // statusDelivery: { $in: ["delivered", "completed", "complete"] },
            "statusHistory.status": "delivered"
        }).lean();

        // Calculate total sold for each product
        const productsWithSales = products.map(product => {
            let totalSold = 0;
            
            orders.forEach(order => {
                order.orderItems.forEach(orderItem => {
                    const productId = product._id.toString();
                    const orderProdId = orderItem.prodId?.toString();
                    
                    if (orderProdId === productId) {
                        totalSold += orderItem.quantity || 0;
                    }
                });
            });

            return {
                ...product,
                totalSold
            };
        });

        // Filter products that have sales and sort by totalSold (descending)
        const bestSellers = productsWithSales
            .filter(p => p.totalSold > 0)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            count: bestSellers.length,
            data: bestSellers
        });

    } catch (error) {
        console.error("Error fetching best sellers:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch best sellers",
            error: error.message 
        });
    }
};





// Get Top Best Seller (Single Product)
export const getTopBestSeller = async (req, res) => {
    try {
        // Get all approved products
        const products = await Product.find({ statusApprove: "approved" })
            .populate('seller.id', 'name email')
            .lean();

        // Get ALL delivered/completed orders
        const orders = await Order.find({
            statusDelivery: { $in: ["delivered", "completed", "complete"] }
        }).lean();

        // Calculate total sold for each product
        const productsWithSales = products.map(product => {
            let totalSold = 0;
            
            orders.forEach(order => {
                order.orderItems.forEach(orderItem => {
                    const productId = product._id.toString();
                    const orderProdId = orderItem.prodId?.toString();
                    
                    if (orderProdId === productId) {
                        totalSold += orderItem.quantity || 0;
                    }
                });
            });

            return {
                ...product,
                totalSold
            };
        });

        // Get the top seller
        const topSeller = productsWithSales
            .filter(p => p.totalSold > 0)
            .sort((a, b) => b.totalSold - a.totalSold)[0];

        if (!topSeller) {
            return res.status(404).json({
                success: false,
                message: "No best seller found"
            });
        }

        res.status(200).json({
            success: true,
            data: topSeller
        });

    } catch (error) {
        console.error("Error fetching top best seller:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch top best seller",
            error: error.message 
        });
    }
};