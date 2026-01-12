import Order from "../../models/order.js";

const totalOrders = async (req, res) => {
    try {
        const { year, month } = req.query;
        const { id } = req.account;
        const selectedYear = year ? parseInt(year) : new Date().getFullYear();
        const selectedMonth = month !== undefined ? parseInt(month) : null;

        // Get total orders for the selected year
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

        const baseQuery = {
            createdAt: { $gte: startOfYear, $lte: endOfYear },
            "deletedBy.id": { $ne: id },
            "statusHistory.status": "delivered"
        };

        // Determine current and previous month based on selection
        let currentMonth, previousMonth, prevMonthYear;
        
        if (selectedMonth !== null) {
            // User clicked a specific month
            currentMonth = selectedMonth;
            if (currentMonth === 0) {
                // January - get December from previous year
                previousMonth = 11;
                prevMonthYear = selectedYear - 1;
            } else {
                previousMonth = currentMonth - 1;
                prevMonthYear = selectedYear;
            }
        } else {
            // Default behavior: use actual current month or December for past years
            const now = new Date();
            const isCurrentYear = selectedYear === now.getFullYear();
            currentMonth = isCurrentYear ? now.getMonth() : 11;
            
            if (currentMonth === 0) {
                previousMonth = 11;
                prevMonthYear = selectedYear - 1;
            } else {
                previousMonth = currentMonth - 1;
                prevMonthYear = selectedYear;
            }
        }

        // Check if there are any orders matching the baseQuery
        const totalorders = await Order.countDocuments(baseQuery);

        // Early return if no orders found
        if (totalorders === 0) {
            const chartData = Array.from({ length: 12 }, (_, index) => ({
                id: index,
                month: new Date(selectedYear, index, 1).toLocaleString("default", { month: "short" }),
                orders: 0
            }));

            return res.status(200).json({
                totalOrders: 0,
                currOrders: 0,
                prevOrders: 0,
                chartData,
                lineColor: "green",
                orderGrowthRate: 0,
                selectedYear,
                selectedMonth: currentMonth,
                previousMonthYear: prevMonthYear
            });
        }

        // Get orders per month for the selected year (only if there are orders)
        const ordersPerMonth = await Order.aggregate([
            {
                $match: baseQuery
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);


        // Initialize array for all 12 months
        let monthlyData = new Array(12).fill(0);

        ordersPerMonth.forEach((entry) => {
            monthlyData[entry._id - 1] = entry.count;
        });

        // Final rendering for UI chartData
        const chartData = monthlyData.map((count, index) => ({
            id: index,
            month: new Date(selectedYear, index, 1).toLocaleString("default", { month: "short" }),
            orders: count
        }));

        // Get previous month orders
        let prevOrders = 0;
        
        if (prevMonthYear === selectedYear) {
            // Previous month is in the same year
            const prevData = chartData.find((data) => data.id === previousMonth);
            prevOrders = prevData?.orders || 0;
        } else {
            // Previous month is in the previous year (December of previous year)
            const prevYearDecStart = new Date(prevMonthYear, 11, 1);
            const prevYearDecEnd = new Date(prevMonthYear, 11, 31, 23, 59, 59);
            
            const prevYearDecOrders = await Order.countDocuments({
                createdAt: { $gte: prevYearDecStart, $lte: prevYearDecEnd },
                "deletedBy.id": { $ne: id }
            });
            
            prevOrders = prevYearDecOrders;
        }

        const currData = chartData.find((data) => data.id === currentMonth);
        const currOrders = currData?.orders || 0;

        const lineColor = currOrders >= prevOrders ? "green" : "red";

        // Compute percentage change
        let orderGrowthRate = 0;

        if (prevOrders === 0 && currOrders > 0) {
            orderGrowthRate = 100;
        } else if (currOrders === 0 && prevOrders > 0) {
            orderGrowthRate = -100;
        } else if (currOrders === 0 && prevOrders === 0) {
            orderGrowthRate = 0;
        } else {
            orderGrowthRate = ((currOrders - prevOrders) / prevOrders) * 100;
        }

        orderGrowthRate = parseFloat(orderGrowthRate.toFixed(2));

        res.status(200).json({
            totalOrders: totalorders,
            currOrders,
            prevOrders,
            chartData,
            lineColor,
            orderGrowthRate,
            selectedYear,
            selectedMonth: currentMonth,
            previousMonthYear: prevMonthYear
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export default totalOrders;