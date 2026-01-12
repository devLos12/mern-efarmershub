import User from "../../models/user.js";

const TotalUser = async (req, res) => {
    try {
        const { year, month } = req.query;
        const selectedYear = year ? parseInt(year) : new Date().getFullYear();
        const selectedMonth = month !== undefined ? parseInt(month) : null;

        // Get total users for the selected year
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

        const totalusers = await User.countDocuments({
            createdAt: { $gte: startOfYear, $lte: endOfYear }
        });

        // Get users per month for the selected year
        const usersPerMonth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
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

        usersPerMonth.forEach((entry) => {
            monthlyData[entry._id - 1] = entry.count;
        });

        // Final rendering for UI chartData
        const chartData = monthlyData.map((count, index) => ({
            id: index,
            month: new Date(selectedYear, index, 1).toLocaleString("default", { month: "short" }),
            users: count
        }));

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

        // Get previous month users
        let prevUsers = 0;
        
        if (prevMonthYear === selectedYear) {
            // Previous month is in the same year
            const prevData = chartData.find((data) => data.id === previousMonth);
            prevUsers = prevData?.users || 0;
        } else {
            // Previous month is in the previous year (December of previous year)
            const prevYearDecStart = new Date(prevMonthYear, 11, 1);
            const prevYearDecEnd = new Date(prevMonthYear, 11, 31, 23, 59, 59);
            
            const prevYearDecUsers = await User.countDocuments({
                createdAt: { $gte: prevYearDecStart, $lte: prevYearDecEnd }
            });
            
            prevUsers = prevYearDecUsers;
        }

        const currData = chartData.find((data) => data.id === currentMonth);
        const currUsers = currData?.users || 0;

        const lineColor = currUsers >= prevUsers ? "green" : "red";

        // Compute percentage change
        let userGrowthRate = 0;

        if (prevUsers === 0 && currUsers > 0) {
            userGrowthRate = 100;
        } else if (currUsers === 0 && prevUsers > 0) {
            userGrowthRate = -100;
        } else if (currUsers === 0 && prevUsers === 0) {
            userGrowthRate = 0;
        } else {
            userGrowthRate = ((currUsers - prevUsers) / prevUsers) * 100;
        }

        userGrowthRate = parseFloat(userGrowthRate.toFixed(2));

        res.status(200).json({
            totalUsers: totalusers,
            currUsers,
            prevUsers,
            chartData,
            lineColor,
            userGrowthRate,
            selectedYear,
            selectedMonth: currentMonth,
            previousMonthYear: prevMonthYear // Para alam ng frontend kung previous year yung prev month
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export default TotalUser;