import Order from "../../models/order.js";

const TotalSales = async (req, res) => {
    try {
        const { year, month } = req.query;
        const { id } = req.account;
        const selectedYear = year ? parseInt(year) : new Date().getFullYear();
        const selectedMonth = month !== undefined ? parseInt(month) : null;

        // Get total sales for the selected year
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

        const baseQuery = {
            paymentStatus: "paid",
            createdAt: { $gte: startOfYear, $lte: endOfYear },
            "deletedBy.id": { $ne: id }
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

        // Check if there are any sales matching the baseQuery
        const totalSalesCount = await Order.countDocuments(baseQuery);

        // Early return if no sales found
        if (totalSalesCount === 0) {
            const chartData = Array.from({ length: 12 }, (_, index) => ({
                id: index,
                month: new Date(selectedYear, index, 1).toLocaleString("default", { month: "short" }),
                totalSales: 0
            }));

            return res.status(200).json({
                totalSales: 0,
                currSales: 0,
                prevSales: 0,
                chartData,
                lineColor: "green",
                salesGrowthRate: 0,
                selectedYear,
                selectedMonth: currentMonth,
                previousMonthYear: prevMonthYear
            });
        }

        // Get sales per month for the selected year (only if there are sales)
        const salesPerMonth = await Order.aggregate([
            {
                $match: baseQuery
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate total sales for the year from aggregation result
        const totalSales = salesPerMonth.reduce((acc, month) => acc + month.totalSales, 0);

        // Initialize array for all 12 months
        let monthlyData = new Array(12).fill(0);

        salesPerMonth.forEach((entry) => {
            monthlyData[entry._id - 1] = entry.totalSales;
        });

        // Final rendering for UI chartData
        const chartData = monthlyData.map((sales, index) => ({
            id: index,
            month: new Date(selectedYear, index, 1).toLocaleString("default", { month: "short" }),
            totalSales: sales
        }));

        // Get previous month sales
        let prevSales = 0;
        
        if (prevMonthYear === selectedYear) {
            // Previous month is in the same year
            const prevData = chartData.find((data) => data.id === previousMonth);
            prevSales = prevData?.totalSales || 0;
        }
        // Note: If prevMonthYear !== selectedYear, prevSales stays 0
        // We don't query previous year since there's no point comparing to previous year when current year has sales

        const currData = chartData.find((data) => data.id === currentMonth);
        const currSales = currData?.totalSales || 0;

        const lineColor = currSales >= prevSales ? "green" : "red";

        // Compute percentage change
        let salesGrowthRate = 0;

        if (prevSales === 0 && currSales > 0) {
            salesGrowthRate = 100;
        } else if (currSales === 0 && prevSales > 0) {
            salesGrowthRate = -100;
        } else if (currSales === 0 && prevSales === 0) {
            salesGrowthRate = 0;
        } else {
            salesGrowthRate = ((currSales - prevSales) / prevSales) * 100;
        }

        salesGrowthRate = parseFloat(salesGrowthRate.toFixed(2));

        res.status(200).json({
            totalSales,
            currSales,
            prevSales,
            chartData,
            lineColor,
            salesGrowthRate,
            selectedYear,
            selectedMonth: currentMonth,
            previousMonthYear: prevMonthYear
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export default TotalSales;