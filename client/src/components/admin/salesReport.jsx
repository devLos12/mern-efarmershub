import { useEffect, useState, useRef, useMemo, useContext } from "react";
import html2pdf from 'html2pdf.js';
import { appContext } from "../../context/appContext";
import Toast from "../toastNotif.jsx";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';












const CustomRangeModal = ({ 
    show, 
    onClose, 
    onApply, 
    initialStartDate = '', 
    initialEndDate = '',
    showNotification 
}) => {
    const [tempStartDate, setTempStartDate] = useState(initialStartDate);
    const [tempEndDate, setTempEndDate] = useState(initialEndDate);
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');
    
    const today = new Date().toISOString().split('T')[0];
    


    // ✅ Get human-readable duration text
    const getDurationText = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date().toISOString().split('T')[0];
        
        // ✅ Special case: Same day and it's today
        if (startDate === endDate && startDate === today) {
            return "Today";
        }
        
        // ✅ Special case: Same day but not today
        if (startDate === endDate) {
            return "1 day";
        }
        
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const startYear = start.getFullYear();
        const startMonth = start.getMonth();
        const endYear = end.getFullYear();
        const endMonth = end.getMonth();
        
        const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
        
        // Exact month(s)
        if (monthsDiff >= 1 && start.getDate() === end.getDate()) {
            return monthsDiff === 1 ? "1 month" : `${monthsDiff} months`;
        }
        
        // Approximately 1 month
        if (diffDays >= 28 && diffDays <= 32 && monthsDiff === 1) {
            return "~1 month";
        }
        
        // Weeks
        if (diffDays % 7 === 0 && diffDays <= 28) {
            const weeks = diffDays / 7;
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
        }
        
        // Days with context
        if (diffDays <= 7) {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
        } else if (diffDays < 28) {
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            if (remainingDays === 0) {
                return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
            }
            return `${diffDays} days`;
        } else {
            const months = Math.floor(diffDays / 30);
            if (months >= 1) {
                return `~${months} ${months === 1 ? 'month' : 'months'} (${diffDays} days)`;
            }
            return `${diffDays} days`;
        }
    };






    // ✅ Validate Start Date
    const validateStartDate = (dateValue = tempStartDate) => {
        if (!dateValue) {
            setStartDateError('');
            return true;
        }
        
        const selectedDate = new Date(dateValue);
        const todayDate = new Date(today);
        
        if (selectedDate > todayDate) {
            setStartDateError('Start date cannot be in the future');
            return false;
        }
        
        setStartDateError('');
        return true;
    };
    
    // ✅ Validate End Date
    const validateEndDate = (endValue = tempEndDate, startValue = tempStartDate) => {
        if (!endValue) {
            setEndDateError('');
            return true;
        }
        
        const selectedDate = new Date(endValue);
        const todayDate = new Date(today);
        const startDateObj = startValue ? new Date(startValue) : null;
        
        if (selectedDate > todayDate) {
            setEndDateError('End date cannot be in the future');
            return false;
        } else if (startDateObj && selectedDate < startDateObj) {
            setEndDateError('End date must be after start date');
            return false;
        }
        
        setEndDateError('');
        return true;
    };







    const handleApply = () => {
        if (!tempStartDate || !tempEndDate) {
            showNotification("Please select both start and end dates", "error");
            return;
        }
        
        const isStartValid = validateStartDate(tempStartDate);
        const isEndValid = validateEndDate(tempEndDate, tempStartDate);
        
        if (!isStartValid || !isEndValid) {
            showNotification("Please fix the date errors before applying", "error");
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        if (tempStartDate > today) {
            showNotification("Start date cannot be in the future", "error");
            return;
        }
        
        if (tempEndDate > today) {
            showNotification("End date cannot be in the future", "error");
            return;
        }
        
        if (tempStartDate > tempEndDate) {
            showNotification("Start date must be before end date", "error");
            return;
        }
        
        onApply(tempStartDate, tempEndDate);
        
        setStartDateError('');
        setEndDateError('');
    };













    
    
    // ✅ Handle Cancel
    const handleCancel = () => {
        setStartDateError('');
        setEndDateError('');
        onClose();
    };
    
    if (!show) return null;
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="modal-backdrop fade show"
                onClick={handleCancel}
            />
            
            {/* Modal */}
            <div 
                className="modal fade show"
                style={{ display: 'block' }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-calendar-days text-success me-2"></i>
                                Custom Date Range
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={handleCancel}
                            />
                        </div>
                        
                        <div className="modal-body pt-2">
                            <p className="text-muted small mb-3">
                                Select a custom date range for your sales report
                            </p>
                            
                            {/* Start Date */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                    <i className="fa-regular fa-calendar me-1"></i>
                                    Start Date
                                </label>
                                <input 
                                    type="date"
                                    className={`form-control ${startDateError ? 'is-invalid' : ''}`}
                                    value={tempStartDate}
                                    onChange={(e) => setTempStartDate(e.target.value)}
                                    onBlur={() => {
                                        validateStartDate(tempStartDate);
                                        if (tempEndDate) {
                                            validateEndDate(tempEndDate, tempStartDate);
                                        }
                                    }}
                                    max={today}
                                />
                                {startDateError && (
                                    <div className="invalid-feedback d-block">
                                        {startDateError}
                                    </div>
                                )}
                            </div>
                            
                            {/* End Date */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                    <i className="fa-regular fa-calendar me-1"></i>
                                    End Date
                                </label>
                                <input 
                                    type="date"
                                    className={`form-control ${endDateError ? 'is-invalid' : ''}`}
                                    value={tempEndDate}
                                    onChange={(e) => setTempEndDate(e.target.value)}
                                    onBlur={() => validateEndDate(tempEndDate, tempStartDate)}
                                    max={today}
                                    min={tempStartDate}
                                />
                                {endDateError && (
                                    <div className="invalid-feedback d-block">
                                        {endDateError}
                                    </div>
                                )}
                            </div>
                            
                            {/* Error Alert */}
                            {(startDateError || endDateError) && (
                                <div className="alert alert-danger alert-sm py-2 px-3 mb-3">
                                    <i className="fa-solid fa-exclamation-triangle me-2"></i>
                                    <small>
                                        <strong>Invalid dates selected.</strong> Please correct the errors above.
                                    </small>
                                </div>
                            )}
                            
                            {/* Success Preview */}
                            {tempStartDate && tempEndDate && !startDateError && !endDateError && (() => {
                                const today = new Date().toISOString().split('T')[0];
                                const isToday = tempStartDate === today && tempEndDate === today;
                                
                                return (
                                    <div className="alert alert-success alert-sm py-2 px-3 mb-0">
                                        <i className="fa-solid fa-check-circle me-2"></i>
                                        <small>
                                            <strong>Selected Range:</strong> {' '}
                                            {isToday ? (
                                                <strong className="text-success">Today</strong>
                                            ) : (
                                                <>
                                                    {new Date(tempStartDate).toLocaleDateString('en-PH', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                    {' '}-{' '}
                                                    {new Date(tempEndDate).toLocaleDateString('en-PH', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                    {' '}
                                                    ({getDurationText(tempStartDate, tempEndDate)})
                                                </>
                                            )}
                                        </small>
                                    </div>
                                );
                            })()}






                        </div>
                        
                        <div className="modal-footer border-0 pt-0">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-light"
                                onClick={handleCancel}
                            >
                                <i className="fa-solid fa-times me-1"></i>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-success"
                                onClick={handleApply}
                                disabled={!tempStartDate || !tempEndDate || !!startDateError || !!endDateError}
                            >
                                <i className="fa-solid fa-check me-1"></i>
                                Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};








const SalesReport = () => {
    const { 
        showToast,
        toastMessage,
        toastType,
        showNotification,
        setShowToast,
    } = useContext(appContext);

    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Graph states
    const [graphData, setGraphData] = useState([]);
    const [graphPeriod, setGraphPeriod] = useState('thisweek'); // ✅ Changed from 'today' to 'thisweek'
    const [graphLoading, setGraphLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Custom Range Modal states
    const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false);
    
    const printRef = useRef();

    // ✅ Fetch data when period or refresh changes
    useEffect(() => {
        getSalesData();
    }, [refresh, graphPeriod]);

    useEffect(() => {
        fetchGraphData();
    }, [graphPeriod, refresh]);

    // ✅ Reset states when period changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
        setIsAllSelected(false);
    }, [graphPeriod]);

    // ✅ Debounced search
    useEffect(() => {
        const result = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return () => clearTimeout(result);
    }, [search]);

    // ✅ Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // ✅ Get Sales Data
    const getSalesData = async() => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            
            let url = `${import.meta.env.VITE_API_URL}/api/getSalesData?period=${graphPeriod}`;
            
            if (graphPeriod === 'custom' && customStartDate && customEndDate) {
                url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }
            
            const res = await fetch(url, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            if(data.success){
                const { salesData } = data;
                setSalesData(salesData);
            }
            
        } catch (error) {
            console.log("Error: ", error.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }

    // ✅ Fetch Graph Data
    const fetchGraphData = async() => {
        try {
            setGraphLoading(true);
            
            let url = `${import.meta.env.VITE_API_URL}/api/getSalesGraphData?period=${graphPeriod}`;
            
            if (graphPeriod === 'custom' && customStartDate && customEndDate) {
                url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }
            
            const res = await fetch(url, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.success) {
                setGraphData(data.graphData);
            }
            
        } catch (error) {
            console.error("Error:", error.message);
        } finally {
            setGraphLoading(false);
        }
    };

    // ✅ Filtered sales data
    const filteredSales = useMemo(() => {
        let filtered = salesData;

        if (debouncedSearch) {
            filtered = filtered.filter((sale) => {
                const saleId = (sale.saleId || "").toLowerCase();
                const customerName = (sale.customerName || "").toLowerCase();
                const productName = (sale.productId?.name || "").toLowerCase();
                const productId = (sale.productId?.prodId || "").toLowerCase();
                
                return saleId.includes(debouncedSearch) || 
                       customerName.includes(debouncedSearch) || 
                       productName.includes(debouncedSearch) ||
                       productId.includes(debouncedSearch);
            });
        }

        return filtered;
    }, [salesData, debouncedSearch]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

    // ✅ Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // ✅ Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    
    // ✅ Get period label
    const getPeriodLabel = () => {
        switch(graphPeriod) {
            case "thisweek": return "This Week";
            case "thismonth": return "This Month";
            case "thisyear": return "This Year";
            case "custom": 
                if (customStartDate && customEndDate) {
                    const today = new Date().toISOString().split('T')[0];
                    
                    // ✅ Check if both dates are the same AND equal to today
                    if (customStartDate === today && customEndDate === today) {
                        return "Today";
                    }
                    
                    // ✅ Check if both dates are the same but NOT today
                    if (customStartDate === customEndDate) {
                        return `${new Date(customStartDate).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}`;
                    }
                    
                    // ✅ Different dates - show range
                    return `Custom Range (${new Date(customStartDate).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric'
                    })} - ${new Date(customEndDate).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })})`;
                }
                return "Custom Range";
            default: return "";
        }
    };



    const getEmptyStateMessage = () => {
        const now = new Date();
        const today = new Date().toISOString().split('T')[0];
        
        switch(graphPeriod) {
            case "thisweek": {
                const dayOfWeek = now.getDay();
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - dayOfWeek);
                return `this week (${weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })})`;
            }
            case "thismonth": 
                return `this month (${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })})`;
            case "thisyear": 
                return `this year (${now.getFullYear()})`;
            case "custom":
                if (customStartDate && customEndDate) {
                    // ✅ Check if both dates are the same AND equal to today
                    if (customStartDate === today && customEndDate === today) {
                        return "today";
                    }
                    
                    // ✅ Check if both dates are the same but NOT today
                    if (customStartDate === customEndDate) {
                        return `for ${new Date(customStartDate).toLocaleDateString('en-PH', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        })}`;
                    }
                    
                    // ✅ Different dates - show range
                    return `for ${new Date(customStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                }
                return "for selected period";
            default: 
                return "for selected period";
        }
    };




    // ✅ Custom Tooltip for Graph
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-success shadow-sm rounded p-2">
                    <p className="m-0 fw-bold text-success small">{label}</p>
                    <p className="m-0 small mt-1">
                        <span className="fw-semibold">Sales:</span> {formatCurrency(payload[0].value)}
                    </p>
                    <p className="m-0 small">
                        <span className="fw-semibold">Orders:</span> {payload[0].payload.orders}
                    </p>
                </div>
            );
        }
        return null;
    };

    // ✅ Select/Deselect handlers
    const toggleSelectAll = () => {
        setIsAllSelected((prev) => {
            const newValue = !prev;
            if (newValue) {
                const allIds = new Set(filteredSales.map((sale) => sale._id));
                setSelectedIds(allIds);
            } else {
                setSelectedIds(new Set());
            }
            return newValue;
        });
    }

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            setIsAllSelected(updated.size === filteredSales.length);
            return updated;
        });
    }

    // ✅ Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        setRefresh((prev) => !prev);
    };

    // ✅ Handle delete
    const handleDelete = async() => {
        if(selectedIds.size === 0) {
            showNotification("No sales selected yet", "error");
            return;
        }

        const sendData = [...selectedIds];
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteSales`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ items: sendData }),
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            setSalesData((prev) => prev.filter((item) => !selectedIds.has(item._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);    
            
            showNotification(data.message, 'success');
        } catch (error) {
            console.log("Error: ", error.message);
            showNotification(error.message || 'Failed to delete sales', 'error');
        }
    }

    // ✅ Handle print
    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        const windowPrint = window.open('', '', 'width=900,height=650');

        windowPrint.document.write(`
            <html>
                <head>
                    <title>Sales Report - ${getPeriodLabel()}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 12px;
                            text-align: left;
                            font-size: 12px;
                        }
                        th {
                            background-color: #198754;
                            color: white;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .header h2 {
                            margin: 0;
                            color: #198754;
                        }
                        .header p {
                            margin: 5px 0;
                            color: #666;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Sales Report</h2>
                        <p><strong>Period:</strong> ${getPeriodLabel()}</p>
                        <p>Generated: ${new Date().toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                        <p>Total Records: ${filteredSales.length}</p>
                    </div>
                    ${printContent.innerHTML}
                    <script>
                        window.onload = function() { 
                            window.print(); 
                            window.onafterprint = function() { window.close(); }
                        }
                    </script>
                </body>
            </html>
        `);
        
        windowPrint.document.close();
    };

    // ✅ Handle download PDF
    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Sales Report</h2>
                <p style="margin: 5px 0; color: #666;"><strong>Period:</strong> ${getPeriodLabel()}</p>
                <p style="margin: 5px 0; color: #666;">Generated: ${new Date().toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p style="margin: 5px 0; color: #666;">Total Records: ${filteredSales.length}</p>
            </div>
        `;
        wrapper.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `sales_report_${graphPeriod}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(wrapper).save();
    };

    // ✅ Handle Custom Range Apply
    const handleCustomRangeApply = (startDate, endDate) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        setGraphPeriod('custom');
        setIsCustomRange(true);
        setShowCustomRangeModal(false);
        setRefresh(prev => !prev);
    };

    // ✅ Handle Custom Range Close
    const handleCustomRangeClose = () => {
        setShowCustomRangeModal(false);
        if (!isCustomRange) {
            setGraphPeriod('thisweek'); // ✅ Changed from 'today' to 'thisweek'
        }
    };



    // ✅ Loading state
    if (loading) {
        return (
            <div className="p-4 d-flex justify-content-center align-items-center flex-column vh-100">
                <div className="spinner-border text-success" role="status"></div>
                <p className="text-capitalize m-0 mt-2 text-muted fs-6">Loading sales..</p>
            </div>
        );
    }

    return (
        <>
        <div className="p-2">
            <div className="row g-0 bg-white rounded mb-5 position-relative overflow-hidden">
                {/* Loading Overlay */}
                {isRefreshing && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" 
                        style={{ zIndex: 10 }}>
                        <div className="text-center">
                            <div className="spinner-border text-success mb-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="small text-muted mb-0">Refreshing sales data...</p>
                        </div>
                    </div>
                )}

                {/* Header with Period Filter */}
                <div className="col-12 p-3 p-md-4 border-bottom bg-light">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-auto">
                            <div className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-calendar text-success"></i>
                                <span className="fw-semibold small text-nowrap">Time Period:</span>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ minWidth: "150px" }}
                                    value={graphPeriod}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setShowCustomRangeModal(true);
                                        } else {
                                            setGraphPeriod(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="thisweek">This Week</option>
                                    <option value="thismonth">This Month</option>
                                    <option value="thisyear">This Year</option>
                                    <option value="custom">Custom </option>
                                </select>
                            </div>
                        </div>

                        <div className="col-12 col-md-auto ms-auto">
                            <div className="d-flex align-items-center justify-content-end">
                                <span className="text-muted small">
                                    <i className="fa-solid fa-chart-line me-1"></i>
                                    {getPeriodLabel()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Graph */}
                <div className="col-12 p-3 p-md-4 border-bottom">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="m-0 fw-bold">
                            <i className="bx bx-bar-chart-alt-2 me-2"></i>
                            Sales Overview
                        </h6>
                        <button 
                            className="btn btn-sm btn-success ms-auto d-flex gap-2 align-items-center"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Refresh Data"
                        >
                            <i className={`fa fa-refresh ${isRefreshing ? 'fa-spin' : ''}`}></i>
                            {isRefreshing? "Refreshing.." : "Refresh"}
                        </button>
                    </div>
                    <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                        Revenue trends based on paid orders
                    </p>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis 
                                dataKey="label" 
                                tick={{ fontSize: 12 }}
                                stroke="#666"
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                stroke="#666"
                                tickFormatter={(value) => {
                                    if (value === 0) return '₱0';
                                    if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
                                    return `₱${value}`;
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="sales" 
                                fill="#10b981"
                                maxBarSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>



                    {graphData.length === 0 && !graphLoading && (
                        <div className="text-center py-4">
                            <i className="fa-solid fa-chart-line text-muted mb-2" style={{fontSize: "2rem"}}></i>
                            <p className="text-muted small mb-0">No sales data available for this period</p>
                        </div>
                    )}

                </div>

                {/* Search and Actions */}
                <div className="col-12 p-3 p-md-4 border-bottom">
                    <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-6">
                            <div className="position-relative">
                                <i className="fa-solid fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                <input 
                                    type="search" 
                                    placeholder="Search Sale ID, Customer, Product..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="form-control form-control-sm ps-5"
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-6">
                            <div className="d-flex justify-content-end gap-2">
                                {selectedIds.size > 0 && (
                                    <button 
                                        className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                        onClick={handleDelete}
                                    >
                                        <i className="bx bx-trash"></i>
                                        <span className="d-none d-lg-inline">Delete</span>
                                    </button>
                                )}

                                <button 
                                    className={`btn btn-sm ${isSelect ? "btn-dark" : "btn-success"} d-flex align-items-center gap-1`}
                                    onClick={() => {
                                        setIsAllSelected(false);
                                        setSelectedIds(new Set());
                                        setIsSelect((prev) => !prev);
                                    }}
                                >   
                                    <i className={`bx ${isSelect ? "bx-x" : "bx-check-circle"}`}></i>
                                    <span className="d-none d-lg-inline">{isSelect ? "Cancel" : "Select"}</span>
                                </button>
                            </div>
                            <p className="m-0 small text-muted text-end mt-1">
                                {selectedIds.size} selected from {filteredSales.length} Total
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="col-12 p-3 p-md-4">
                    {filteredSales.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fa-solid fa-inbox text-muted mb-3" style={{ fontSize: "3rem" }}></i>
                            <p className="text-muted fw-semibold mb-1">No sales found</p>
                            <p className="text-muted small">
                                {search 
                                    ? `No results matching "${search}" in ${getPeriodLabel().toLowerCase()}`
                                    : `No sales recorded ${getEmptyStateMessage()}`
                                }
                            </p>
                        </div>
                    ) : (
                        <div ref={printRef} className="table-responsive"
                        
                        style={{overflow: "auto"}}>
                            <table className="table table-hover">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-uppercase small text-success">#</th>
                                        <th className="text-uppercase small text-success">Sale ID</th>
                                        <th className="text-uppercase small text-success">Order ID</th>
                                        <th className="text-uppercase small text-success">Customer</th>
                                        <th className="text-uppercase small text-success">Product</th>
                                        <th className="text-uppercase small text-success">Category</th>
                                        <th className="text-uppercase small text-success">Qty</th>
                                        <th className="text-uppercase small text-success">Price</th>
                                        <th className="text-uppercase small text-success">Total</th>
                                        <th className="text-uppercase small text-success">Payment</th>
                                        <th className="text-uppercase small text-success">Status</th>
                                        <th className="text-uppercase small text-success">Date</th>
                                        
                                        {isSelect && (
                                            <th className="text-uppercase small text-success text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <span>All</span>
                                                    <input 
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={toggleSelectAll}
                                                        style={{cursor: "pointer"}}
                                                    />
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((sale, i) => (
                                        <tr key={sale._id}>
                                            <td className="align-middle small">{indexOfFirstItem + i + 1}</td>
                                            <td className="align-middle small fw-bold">{sale.saleId}</td>
                                            <td className="align-middle small fw-bold">{sale.orderId?.orderId}</td>
                                            <td className="align-middle small text-capitalize">{sale.customerName}</td>
                                            
                                            <td className="align-middle small">
                                                <div className="d-flex align-items-center gap-2">
                                                    {sale.productId?.imageFile ? (
                                                        <img
                                                            src={sale.productId.imageFile}
                                                            alt={sale.productId.name}
                                                            className="rounded"
                                                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" 
                                                            style={{ width: "40px", height: "40px" }}>
                                                            <i className="fa fa-image text-muted"></i>
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <p className="m-0 fw-semibold text-truncate" style={{maxWidth: "150px"}}>
                                                            {sale.productId?.name || 'N/A'}
                                                        </p>
                                                        <small className="text-muted">
                                                            ID: {sale.productId?.prodId || 'N/A'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="align-middle small text-capitalize">{sale.category}</td>
                                            <td className="align-middle small text-center">
                                                <span className="badge bg-light text-dark">{sale.quantity}</span>
                                            </td>
                                            <td className="align-middle small">{formatCurrency(sale.price)}</td>
                                            <td className="align-middle small fw-bold">{formatCurrency(sale.totalAmount)}</td>
                                            <td className="align-middle small text-capitalize">
                                                {sale.paymentMethod.replace(/-/g, ' ')}
                                            </td>
                                            <td className="align-middle small text-capitalize">{sale.status}</td>
                                            <td className="align-middle small">{formatDate(sale.saleDate)}</td>
                                        
                                            {isSelect && (
                                                <td className="align-middle text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedIds.has(sale._id)}
                                                        onChange={() => toggleSelect(sale._id)}
                                                        style={{ cursor: "pointer" }}           
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {filteredSales.length > 0 && (
                    <div className="col-12 px-3 px-md-4 pb-3">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-top pt-3">
                            <div className="text-muted small">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length} sales
                            </div>
                            
                            <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
                                <button 
                                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                    onClick={handleDownloadPDF}
                                    title="Download as PDF"
                                >
                                    <i className="fa fa-file-pdf"></i>
                                    <span className="d-none d-lg-inline">PDF</span>
                                </button>

                                <button 
                                    className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
                                    onClick={handlePrint}
                                    title="Print Sales Report"
                                >
                                    <i className="fa fa-print"></i>
                                    <span className="d-none d-lg-inline">Print</span>
                                </button>

                                <button 
                                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <i className="fa fa-chevron-left"></i>
                                    <span className="ms-2 small d-none d-lg-inline">Previous</span>
                                </button>
                                
                                <div className="d-flex gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        if (pageNumber === 1 || pageNumber === totalPages || 
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`}
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    style={{ minWidth: "35px" }}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                            return <span key={pageNumber} className="px-2">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                <button 
                                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="me-2 small d-none d-lg-inline">Next</span>
                                    <i className="fa fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ✅ Clean Modal Usage */}
        <CustomRangeModal 
            show={showCustomRangeModal}
            onClose={handleCustomRangeClose}
            onApply={handleCustomRangeApply}
            initialStartDate={customStartDate}
            initialEndDate={customEndDate}
            showNotification={showNotification}
        />

        <Toast 
            show={showToast}
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
        />
        </>
    );
}

export default SalesReport;








