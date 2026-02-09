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
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [customYear, setCustomYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearsToShow = 5;
        const years = [];
        
        // Generate last 5 years in ascending order
        for (let i = yearsToShow - 1; i >= 0; i--) {
            years.push(currentYear - i);
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

    const handleChartClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const clickedData = data.activePayload[0].payload;
            setSelectedMonth(clickedData.id);
        }
    };

    const handleReset = () => {
        setSelectedMonth(null);
    };

    const handleYearChange = (e) => {
        const value = e.target.value;
        if (value === "custom") {
            setCustomYear(selectedYear); // Sync current year before opening
            setShowModal(true);
        } else {
            setSelectedYear(Number(value));
            setSelectedMonth(null);
        }
    };

    const handleCustomYearSelect = () => {
        setSelectedYear(customYear);
        setSelectedMonth(null);
        
        // Add custom year to available years if not already included
        if (!availableYears.includes(customYear)) {
            setAvailableYears(prev => [...prev, customYear].sort((a, b) => a - b));
        }
        
        setShowModal(false);
    };

    // Generate years for modal (2000 to current year only - no future)
    const generateAllYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2000; year <= currentYear; year++) {
            years.push(year);
        }
        return years.reverse(); // Descending sa modal para latest nauna
    };

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
        <>
            <div className="card-body">
                {/* Header with Year Filter */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-chart-line me-2 text-primary bg-primary p-2 rounded-circle bg-opacity-10"></i>
                        <p className="m-0 fw-bold text-primary">Sales</p>
                    </div>
                    
                    {/* Year Filter Dropdown */}
                    <div className="d-flex align-items-center gap-2">
                        <p className="m-0 text-muted text-capitalize fw-semibold d-none d-xl-block"
                        style={{fontSize: "12px"}}
                        >time period: </p>

                        <select 
                            className="form-select form-select-sm" 
                            style={{ width: "auto", fontSize: "12px" }}
                            value={availableYears.includes(selectedYear) ? selectedYear : "custom"}
                            onChange={handleYearChange}
                        >

                            <option value="custom">Custom</option>

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
                                <i className="fa-solid fa-rotate-left"></i>
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

            {/* Custom Year Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select Custom Year</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div 
                                    style={{
                                        maxHeight: "300px",
                                        overflowY: "auto",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px"
                                    }}
                                >
                                    {generateAllYears().map((year) => (
                                        <div
                                            key={year}
                                            className={`p-3 ${customYear === year ? 'bg-primary text-white' : ''}`}
                                            style={{
                                                cursor: "pointer",
                                                borderBottom: "1px solid #dee2e6"
                                            }}
                                            onClick={() => setCustomYear(year)}
                                        >
                                            {year}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleCustomYearSelect}
                                >
                                    Select
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TotalSales;