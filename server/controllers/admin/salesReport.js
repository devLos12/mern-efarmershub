import Order from "../../models/order.js";
import SalesList from "../../models/salesReport.js";



export const getSalesData = async(req, res) => {
    try {
        const { period = 'today', startDate, endDate } = req.query;
        
        const now = new Date();
        let queryStartDate, queryEndDate;

        // ✅ Handle custom range
        if (period === 'custom' && startDate && endDate) {
            queryStartDate = new Date(startDate);
            queryStartDate.setHours(0, 0, 0, 0);
            
            queryEndDate = new Date(endDate);
            queryEndDate.setHours(23, 59, 59, 999);
        } else {
            // ✅ COMPLETE switch case for all periods
            switch(period) {
                case "today":
                    queryStartDate = new Date(now);
                    queryStartDate.setHours(0, 0, 0, 0);
                    queryEndDate = new Date(now);
                    queryEndDate.setHours(23, 59, 59, 999);
                    break;
                
                case "yesterday":
                    queryStartDate = new Date(now);
                    queryStartDate.setDate(queryStartDate.getDate() - 1);
                    queryStartDate.setHours(0, 0, 0, 0);
                    queryEndDate = new Date(now);
                    queryEndDate.setDate(queryEndDate.getDate() - 1);
                    queryEndDate.setHours(23, 59, 59, 999);
                    break;
                
               case "thisweek":
                    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
                    
                    // ✅ Calculate days from Monday (Monday = start of week)
                    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    
                    queryStartDate = new Date(now);
                    queryStartDate.setDate(queryStartDate.getDate() - daysFromMonday);
                    queryStartDate.setHours(0, 0, 0, 0);
                    
                    queryEndDate = new Date(now);
                    queryEndDate.setHours(23, 59, 59, 999);
                    break;
                    
                case "thismonth":
                    queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    queryStartDate.setHours(0, 0, 0, 0);
                    queryEndDate = new Date(now);
                    queryEndDate.setHours(23, 59, 59, 999);
                    break;
                    
                case "thisyear":
                    queryStartDate = new Date(now.getFullYear(), 0, 1);
                    queryStartDate.setHours(0, 0, 0, 0);
                    queryEndDate = new Date(now);
                    queryEndDate.setHours(23, 59, 59, 999);
                    break;
                    
                default:
                    // Default to today
                    queryStartDate = new Date(now);
                    queryStartDate.setHours(0, 0, 0, 0);
                    queryEndDate = new Date(now);
                    queryEndDate.setHours(23, 59, 59, 999);
            }
        }

        const salesData = await SalesList.find({
            saleDate: { $gte: queryStartDate, $lte: queryEndDate }
        })
        .populate('productId', 'name prodId imageFile')
        .populate('orderId', 'orderId')
        .sort({ saleDate: -1 });

        return res.status(200).json({ 
            success: true, 
            salesData: salesData,
            period: period,
            dateRange: {
                start: queryStartDate,
                end: queryEndDate
            }
        });
    } catch (error) {
        console.error("Error in getSalesData:", error.message);
        return res.status(500).json({ message: error.message});
    }
}


export const getSalesGraphData = async(req, res) => {
    try {
        const { period = 'today', startDate: customStart, endDate: customEnd } = req.query;
        
        const now = new Date();
        let startDate, endDate;
        let groupedData = [];

        // ✅ Handle custom range
        if (period === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Calculate date range based on period
            switch(period) {
                case "today":
                    startDate = new Date(now);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                
                case "yesterday":
                    startDate = new Date(now);
                    startDate.setDate(startDate.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setDate(endDate.getDate() - 1);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                
                case "thisweek":
                    const dayOfWeek = now.getDay();
                    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // ✅ FIX
                    
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - daysFromMonday); // ✅ FIX
                    startDate.setHours(0, 0, 0, 0);
                    
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break; // ✅ BREAK LANG, WALANG RETURN!
                    
                case "thismonth":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                    
                case "thisyear":
                    startDate = new Date(now.getFullYear(), 0, 1);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                    
                default:
                    startDate = new Date(now);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
            }
        }

        // ✅ GET PAID ORDERS ONLY
        const paidOrders = await Order.find({
            paymentStatus: "paid",
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();

        // ✅ Determine grouping logic based on period OR custom range duration
        const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Group data based on period or custom range duration
        if (period === 'today' || period === 'yesterday' || (period === 'custom' && daysDifference <= 1)) {
            // HOURLY BREAKDOWN (for single day)
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
            
        } else if (period === 'thisweek' || (period === 'custom' && daysDifference <= 7)) {
            // DAILY BREAKDOWN (for week or up to 7 days)
            for (let i = 0; i <= daysDifference; i++) {
                const dayStart = new Date(startDate);
                dayStart.setDate(dayStart.getDate() + i);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                
                if (dayEnd > endDate) break;
                
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
            
        } else if (period === 'thismonth' || (period === 'custom' && daysDifference <= 31)) {
            // DAILY BREAKDOWN for month
            let currentDay = new Date(startDate);
            
            while (currentDay <= endDate) {
                const dayStart = new Date(currentDay);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(currentDay);
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
                
                currentDay.setDate(currentDay.getDate() + 1);
            }
            
        } else {
            // MONTHLY BREAKDOWN (for year or longer periods)
            const monthsMap = new Map();
            
            paidOrders.forEach(order => {
                const orderDate = new Date(order.createdAt);
                const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
                
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        date: new Date(orderDate.getFullYear(), orderDate.getMonth(), 1),
                        sales: 0,
                        orders: 0
                    });
                }
                
                const monthData = monthsMap.get(monthKey);
                monthData.sales += order.totalPrice || 0;
                monthData.orders += 1;
            });
            
            // Convert to array and sort
            groupedData = Array.from(monthsMap.values())
                .sort((a, b) => a.date - b.date)
                .map(item => ({
                    label: item.date.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
                    sales: item.sales,
                    orders: item.orders
                }));
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