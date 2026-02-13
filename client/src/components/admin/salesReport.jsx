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
    const [graphPeriod, setGraphPeriod] = useState('today');
    const [graphLoading, setGraphLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const printRef = useRef();

    useEffect(() => {
        getSalesData();
    }, [refresh]);

    useEffect(() => {
        fetchGraphData();
    }, [graphPeriod, refresh]);

    const getSalesData = async() => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSalesData`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            if(data.success){
                const { salesData } = data;
                setSalesData(salesData.reverse());
            }
            
        } catch (error) {
            console.log("Error: ", error.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }

    const fetchGraphData = async() => {
        try {
            setGraphLoading(true);
            
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getSalesGraphData?period=${graphPeriod}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

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

    // Debounced search
    useEffect(() => {
        const result = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return () => clearTimeout(result);
    }, [search]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Filtered data
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    const getPeriodLabel = () => {
        switch(graphPeriod) {
            case "today": return "Today's Sales (Hourly)";
            case "yesterday": return "Yesterday's Sales (Hourly)";
            case "thisweek": return "This Week";
            case "thismonth": return "This Month";
            case "thisyear": return "This Year";
            default: return "";
        }
    };

    // Custom Tooltip for Graph
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

    // Select/Deselect handlers
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setRefresh((prev) => !prev);
    };

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

    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        const windowPrint = window.open('', '', 'width=900,height=650');

        windowPrint.document.write(`
            <html>
                <head>
                    <title>Sales Report</title>
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
                        <p>Date: ${new Date().toLocaleDateString('en-PH', {
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

    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Sales Report</h2>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', {
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
            filename: `sales_report_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(wrapper).save();
    };

    if (loading) {
        return (
            <div className="p-4 d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="p-2">
            <div className="row g-0 bg-white rounded mb-5 position-relative overflow-hidden">
                {/* Loading Overlay with Refresh Trigger */}
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
                                    onChange={(e) => setGraphPeriod(e.target.value)}
                                >
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="thisweek">This Week</option>
                                    <option value="thismonth">This Month</option>
                                    <option value="thisyear">This Year</option>
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
                                fill="#198754" 
                                radius={[8, 8, 0, 0]}
                                maxBarSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>
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
                            <p className="text-muted">No sales data found</p>
                        </div>
                    ) : (
                        <div ref={printRef} style={{overflow: "auto"}}>
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