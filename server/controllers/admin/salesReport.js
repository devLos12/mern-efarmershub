import Order from "../../models/order.js";
import SalesList from "../../models/salesReport.js";

export const getSalesData = async(req, res) => {
    try {
        const salesData = await SalesList.find()
            .populate('productId', 'name prodId imageFile')
            .populate('orderId', 'orderId');

        return res.status(200).json({ success: true, salesData: salesData });
    } catch (error) {
        return res.status(500).json({ message: error.message});
    }
}

export const getSalesGraphData = async(req, res) => {
    try {
        const { period = 'today' } = req.query;
        
        const now = new Date();
        let startDate, endDate;
        let groupedData = [];

        // Calculate date range based on period
        switch(period) {
            case "today":
                // Today from 12 AM to current time
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            
            case "yesterday":
                // Yesterday 12 AM to 11:59 PM
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setDate(endDate.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            
            case "thisweek":
                // Current week (Sunday to Saturday)
                const dayOfWeek = now.getDay();
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
                
            case "thismonth":
                // Current month from day 1
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
                
            case "thisyear":
                // Current year from January 1
                startDate = new Date(now.getFullYear(), 0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
                
            default:
                // Default to today
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
        }

        // ✅ GET PAID ORDERS ONLY
        const paidOrders = await Order.find({
            paymentStatus: "paid",
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();

        // Group data based on period
        if (period === 'today' || period === 'yesterday') {
            // HOURLY BREAKDOWN (12 AM to 11 PM = 24 hours)
            for (let hour = 0; hour < 24; hour++) {
                const hourStart = new Date(startDate);
                hourStart.setHours(hour, 0, 0, 0);
                
                const hourEnd = new Date(startDate);
                hourEnd.setHours(hour, 59, 59, 999);
                
                const hourOrders = paidOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= hourStart && orderDate <= hourEnd;
                });
                
                const totalSales = hourOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                // Format: 12 AM, 1 AM, 2 AM... 11 PM
                const hourLabel = hour === 0 ? '12 AM' : 
                                 hour < 12 ? `${hour} AM` : 
                                 hour === 12 ? '12 PM' : 
                                 `${hour - 12} PM`;
                
                groupedData.push({
                    label: hourLabel,
                    sales: totalSales,
                    orders: hourOrders.length
                });
            }
            
        } else if (period === 'thisweek') {
            // DAILY BREAKDOWN for current week (7 days)
            const dayOfWeek = now.getDay();
            
            for (let i = 0; i <= dayOfWeek; i++) {
                const dayStart = new Date(startDate);
                dayStart.setDate(dayStart.getDate() + i);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dayOrders = paidOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= dayStart && orderDate <= dayEnd;
                });
                
                const totalSales = dayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                groupedData.push({
                    label: dayStart.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
                    sales: totalSales,
                    orders: dayOrders.length
                });
            }
            
        } else if (period === 'thismonth') {
            // DAILY BREAKDOWN for current month
            const daysInMonth = now.getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dayOrders = paidOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= dayStart && orderDate <= dayEnd;
                });
                
                const totalSales = dayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                groupedData.push({
                    label: dayStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
                    sales: totalSales,
                    orders: dayOrders.length
                });
            }
            
        } else if (period === 'thisyear') {
            // MONTHLY BREAKDOWN for current year
            const currentMonth = now.getMonth();
            
            for (let month = 0; month <= currentMonth; month++) {
                const monthStart = new Date(now.getFullYear(), month, 1);
                monthStart.setHours(0, 0, 0, 0);
                
                const monthEnd = new Date(now.getFullYear(), month + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                
                const monthOrders = paidOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= monthStart && orderDate <= monthEnd;
                });
                
                const totalSales = monthOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                groupedData.push({
                    label: monthStart.toLocaleDateString('en-PH', { month: 'short' }),
                    sales: totalSales,
                    orders: monthOrders.length
                });
            }
        }

        // Summary stats
        const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalOrders = paidOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return res.status(200).json({
            success: true,
            period,
            graphData: groupedData,
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue
            }
        });

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const deleteSales = async(req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items to delete" });
        }

        const result = await SalesList.deleteMany({ 
            _id: { $in: items } 
        });

        return res.status(200).json({ 
            message: `Successfully deleted ${result.deletedCount} sale(s)`
        });
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
}