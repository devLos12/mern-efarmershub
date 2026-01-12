import React, { useEffect, useState } from "react";
import { ResponsiveContainer, Line, LineChart, Tooltip } from "recharts";

const TotalSales = () => {
    const [totalSales, setTotalSales] = useState(0);
    const [currSales, setCurrSales] = useState(0);
    const [prevSales, setPrevSales] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [lineColor, setLineColor] = useState("green");
    const [salesGrowthRate, setSalesGrowthRate] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null); // null means use current month
    const [availableYears, setAvailableYears] = useState([]);

    useEffect(() => {
        // Generate years from 2022 to current year
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2022; year <= currentYear; year++) {
            years.push(year);
        }
        setAvailableYears(years);
    }, []);

    useEffect(() => {
        const monthParam = selectedMonth !== null ? `&month=${selectedMonth}` : '';
        fetch(`${import.meta.env.VITE_API_URL}/api/totalsales?year=${selectedYear}${monthParam}`, {
            method: "GET",
            credentials: "include"
        })
            .then((res) => res.json())
            .then((data) => {
                setTotalSales(data.totalSales);
                setCurrSales(data.currSales);
                setPrevSales(data.prevSales);
                setChartData(data.chartData);
                setLineColor(data.lineColor);
                setSalesGrowthRate(data.salesGrowthRate);
            })
            .catch((err) => console.error("Error: ", err.message));
    }, [selectedYear, selectedMonth]);

    // Handle chart click
    const handleChartClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const clickedData = data.activePayload[0].payload;
            setSelectedMonth(clickedData.id); // id is the month index (0-11)
        }
    };

    // Reset to current month
    const handleReset = () => {
        setSelectedMonth(null);
    };

    // Get display text for selected month
    const getSelectedMonthText = () => {
        if (selectedMonth === null) {
            const now = new Date();
            const isCurrentYear = selectedYear === now.getFullYear();
            if (isCurrentYear) {
                return new Date(selectedYear, now.getMonth()).toLocaleString("default", { month: "short" });
            } else {
                return "Dec";
            }
        }
        return new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "short" });
    };

    const getPrevMonthText = () => {
        if (selectedMonth === null) {
            const now = new Date();
            const isCurrentYear = selectedYear === now.getFullYear();
            const currentMonth = isCurrentYear ? now.getMonth() : 11;
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? selectedYear - 1 : selectedYear;
            const monthName = new Date(prevYear, prevMonth).toLocaleString("default", { month: "short" });
            return currentMonth === 0 ? `${monthName} ${prevYear}` : monthName;
        } else {
            const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
            const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
            const monthName = new Date(prevYear, prevMonth).toLocaleString("default", { month: "short" });
            return selectedMonth === 0 ? `${monthName} ${prevYear}` : monthName;
        }
    };

    return (
        <div className="card-body">
            {/* Header with Year Filter */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <i className="fa-solid fa-chart-line me-2 text-primary bg-primary p-2 rounded-circle bg-opacity-10"></i>
                    <p className="m-0 fw-bold text-primary">Sales</p>
                </div>
                
                {/* Year Filter Dropdown */}
                <div className="d-flex align-items-center gap-2 ">
                    <p className="m-0 text-muted text-capitalize fw-semibold d-none d-xl-block"
                    style={{fontSize: "12px"}}
                    >time period: </p>

                    <select 
                        className="form-select form-select-sm" 
                        style={{ width: "auto", fontSize: "12px" }}
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(Number(e.target.value));
                            setSelectedMonth(null); // Reset selected month when year changes
                        }}
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>

                    {selectedMonth !== null && (
                        <button 
                            className="btn btn-sm btn-outline-secondary border-0"
                            onClick={handleReset}
                            title="Reset to current month"
                        >
                            <i className="fa-solid fa-rotate-left "></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div className="d-flex justify-content-between align-items-center rounded p-1">
                <div className="rounded">
                    <p className="m-0">₱{totalSales?.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className="m-0 text-capitalize opacity-75" style={{ fontSize: "12px" }}>
                        total sales
                    </p>
                </div>
                <div className="rounded">
                    <p className="m-0">₱{prevSales?.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className="m-0 text-capitalize opacity-75" style={{ fontSize: "12px" }}>
                        {getPrevMonthText()}
                    </p>
                </div>
                <div className="rounded">
                    <p className="m-0">₱{currSales?.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className="m-0 text-capitalize opacity-75" style={{ fontSize: "12px" }}>
                        {getSelectedMonthText()}
                    </p>
                </div>
            </div>

            {/* Growth Rate & Chart */}
            <div className="d-flex justify-content-between align-items-center rounded mt-2 p-1">
                <div className="flex-column">
                    <p className="m-0">
                        {salesGrowthRate > 0 ? `+${salesGrowthRate}%` : `${salesGrowthRate}%`}
                    </p>
                    <p className="m-0 text-capitalize opacity-75" style={{ fontSize: "12px" }}>
                        monthly rate
                    </p>
                </div>
                <ResponsiveContainer width="60%" height={50}>
                    <LineChart 
                        data={chartData}
                        style={{cursor: "pointer"}}
                        onClick={handleChartClick}
                    >
                        <Tooltip 
                            contentStyle={{ 
                                fontSize: "12px", 
                                backgroundColor: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                color: "green"
                            }}
                            labelStyle={{ color: "black", fontWeight: "bold" }}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    const month = payload[0].payload.month;
                                    return `${month} ${selectedYear}`;
                                }
                                return label;
                            }}
                            formatter={(value) => [`₱${value.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, "Sales"]}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="totalSales" 
                            stroke={lineColor} 
                            strokeWidth={2} 
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TotalSales;