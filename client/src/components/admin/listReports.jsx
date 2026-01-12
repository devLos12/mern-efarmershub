import React, { useEffect, useState, useRef } from "react";
import html2pdf from 'html2pdf.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';




const ListReports = () => {
    const [listProducts, setListProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [timePeriod, setTimePeriod] = useState("today");
    const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");
    const [productTypeFilter, setProductTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortOrder, setSortOrder] = useState(null);
    const [priceSortOrder, setPriceSortOrder] = useState(null);
    const [stocksSortOrder, setStocksSortOrder] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const printRef = useRef();



    useEffect(() => {
        const loadData = async () => {
            setIsRefreshing(true);
            await getAdminListProducts();
            await new Promise(resolve => setTimeout(resolve, 500));
            setIsRefreshing(false);
        };
        loadData();
    }, [timePeriod, customDateFrom, customDateTo]);




    const getAdminListProducts = async () => {
        try {
            // Remove setLoading(true) dito since handled na sa useEffect
            
            let url = `${import.meta.env.VITE_API_URL}/api/getListProducts?period=${timePeriod}`;
            
            if (timePeriod === "custom" && customDateFrom && customDateTo) {
                url += `&dateFrom=${customDateFrom}&dateTo=${customDateTo}`;
            }
            
            const res = await fetch(url, {
                method: "GET",
                credentials: "include"
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setListProducts(data);
        } catch (error) {
            console.error("Error:", error.message);
            setListProducts([]);
        }
    };







    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await getAdminListProducts();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const filteredProducts = listProducts.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.productType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProductType = productTypeFilter === "all" || product.productType?.toLowerCase() === productTypeFilter.toLowerCase();
        const matchesCategory = categoryFilter === "all" || product.category?.toLowerCase() === categoryFilter.toLowerCase();
        
        return matchesSearch && matchesProductType && matchesCategory;

    }).sort((a, b) => {
        // Sort by Sold
        if (sortOrder === 'asc') {
            return (b.soldToday || 0) - (a.soldToday || 0);
        } else if (sortOrder === 'desc') {
            return (a.soldToday || 0) - (b.soldToday || 0);
        }
        
        // Sort by Price
        if (priceSortOrder === 'asc') {
            return (b.price || 0) - (a.price || 0);
        } else if (priceSortOrder === 'desc') {
            return (a.price || 0) - (b.price || 0);
        }
        
        // Sort by Stocks
        if (stocksSortOrder === 'asc') {
            return (b.stocks || 0) - (a.stocks || 0);
        } else if (stocksSortOrder === 'desc') {
            return (a.stocks || 0) - (b.stocks || 0);
        }
        
        return 0;
    });

    const uniqueProductTypes = [...new Set(listProducts.map(p => p.productType))];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);




    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, timePeriod, productTypeFilter, categoryFilter, customDateFrom, customDateTo, sortOrder, priceSortOrder, stocksSortOrder]);

    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        
        const images = printContent.querySelectorAll('img');
        images.forEach(img => {
            const td = img.closest('td');
            if (td) {
                const productName = td.querySelector('.fw-semibold')?.textContent || '';
                const productId = td.querySelector('.text-muted')?.textContent || '';
                td.innerHTML = `<div><p class="m-0 fw-semibold">${productName}</p><p class="m-0 small text-muted">${productId}</p></div>`;
            }
        });
        
        const windowPrint = window.open('', '', 'width=900,height=650');
        
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Product List</title>
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
                        .badge {
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 11px;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Product List Report</h2>
                        <p>Date: ${new Date().toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                        <p>Period: ${getPeriodLabel()}</p>
                        <p>Date Range: ${getDateRangeText()}</p>
                        <p>Total Products: ${filteredProducts.length}</p>
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
        
        const images = printContent.querySelectorAll('img');
        images.forEach(img => {
            const td = img.closest('td');
            if (td) {
                const productName = td.querySelector('.fw-semibold')?.textContent || '';
                const productId = td.querySelector('.text-muted')?.textContent || '';
                td.innerHTML = `<div><p class="m-0 fw-semibold">${productName}</p><p class="m-0 small text-muted">${productId}</p></div>`;
            }
        });

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Product List Report</h2>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p style="margin: 5px 0; color: #666;">Period: ${getPeriodLabel()}</p>
                <p style="margin: 5px 0; color: #666;">Date Range: ${getDateRangeText()}</p>
                <p style="margin: 5px 0; color: #666;">Total Products: ${filteredProducts.length}</p>
            </div>
        `;
        wrapper.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `product_list_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(wrapper).save();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStockColor = (stocks) => {
        if (stocks === 0) return "text-danger";
        if (stocks <= 5) return "text-warning";
        return "text-dark";
    };

    const getStockPercentage = (currentStock, totalStock) => {
        if (!totalStock || totalStock === 0) return 0;
        return Math.round((currentStock / totalStock) * 100);
    };

    const getStockPercentageColor = (percentage) => {
        if (percentage === 0) return "danger";
        if (percentage <= 25) return "danger";
        if (percentage <= 50) return "warning";
        return "success";
    };

    const getDateRangeText = () => {
        const now = new Date();
        
        switch(timePeriod) {
            case "today":
                return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            case "yesterday":
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                return yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            case "weekly":
                const startOfWeek = new Date(now);
                const dayOfWeek = now.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(now.getDate() + diff);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            case "monthly":
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            case "yearly":
                return now.getFullYear().toString();
            
            case "custom":
                if (customDateFrom && customDateTo) {
                    const from = new Date(customDateFrom);
                    const to = new Date(customDateTo);
                    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }
                return "Select date range";
            
            default:
                return "";
        }
    };

    const getPeriodLabel = () => {
        switch(timePeriod) {
            case "today": return "Today";
            case "yesterday": return "Yesterday";
            case "weekly": return "This Week";
            case "monthly": return "This Month";
            case "yearly": return "This Year";
            case "custom": return "Custom Range";
            default: return "";
        }
    };


    return (
        <div className="row g-0 bg-white rounded mb-5 position-relative overflow-hidden">
            {isRefreshing && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" 
                    style={{ zIndex: 10 }}>
                    <div className="text-center">
                        <div className="spinner-border text-success mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="small text-muted mb-0">Refreshing products...</p>
                    </div>
                </div>
            )}

            <div className="col-12 p-3 p-md-4 border-bottom bg-light">
                <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-auto">
                        <div className="d-flex align-items-center gap-2">
                            <i className="fa-solid fa-calendar text-success"></i>
                            <span className="fw-semibold small text-nowrap">Time Period:</span>
                            <select
                                className="form-select form-select-sm"
                                style={{ minWidth: "150px" }}
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="weekly">This Week</option>
                                <option value="monthly">This Month</option>
                                <option value="yearly">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                    </div>

                    {timePeriod === "custom" && (
                        <div className="col-12 col-md">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <label className="small fw-semibold text-nowrap">From:</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    style={{ maxWidth: "160px" }}
                                    value={customDateFrom}
                                    onChange={(e) => setCustomDateFrom(e.target.value)}
                                />
                                <label className="small fw-semibold text-nowrap">To:</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    style={{ maxWidth: "160px" }}
                                    value={customDateTo}
                                    onChange={(e) => setCustomDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="col-12 col-md-auto ms-auto">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                            <span className="text-muted small">
                                <i className="fa-solid fa-calendar-day me-1"></i>
                                {getDateRangeText()}
                            </span>
                            <button 
                                className="btn btn-sm btn-success d-flex align-items-center gap-2"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title="Refresh Data">
                                <i className={`fa fa-refresh ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                <span className="small">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                          
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-success bg-opacity-10 rounded p-2">
                                    <i className="fa-solid fa-box text-success" style={{ fontSize: "1.2rem" }}></i>
                                </div>
                                <span className="text-muted small">Total Products</span>
                            </div>
                            <h3 className="mb-0 fw-bold">{listProducts.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-warning bg-opacity-10 rounded p-2">
                                    <i className="fa-solid fa-users text-warning" style={{ fontSize: "1.2rem" }}></i>
                                </div>
                                <span className="text-muted small">Total Farmers</span>
                            </div>
                            <h3 className="mb-0 fw-bold">
                                {[...new Set(listProducts.map(p => p.seller?._id || p.seller?.name).filter(Boolean))].length}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-primary bg-opacity-10 rounded p-2">
                                    <i className="fa-solid fa-chart-line text-primary" style={{ fontSize: "1.2rem" }}></i>
                                </div>
                                <span className="text-muted small">Total Sold ({getPeriodLabel()})</span>
                            </div>
                            <h3 className="mb-0 fw-bold">
                                {listProducts.reduce((sum, p) => sum + (p.soldToday || 0), 0)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="bg-danger bg-opacity-10 rounded p-2">
                                    <i className="fa-solid fa-triangle-exclamation text-danger" style={{ fontSize: "1.2rem" }}></i>
                                </div>
                                <span className="text-muted small">Low Stock Items</span>
                            </div>
                            <h3 className="mb-0 fw-bold">
                                {listProducts.filter(p => {
                                    const percentage = getStockPercentage(p.stocks, p.totalStocks);
                                    return percentage <= 50 && p.stocks > 0;
                                }).length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>



            


            {/* Top 5 Best-Selling Products Chart - Compact & Responsive */}
            <div className="col-12 p-1 p-md-5 border-bottom">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <h6 className="m-0 fw-bold">Top 5 Best-Selling Products {getPeriodLabel()}</h6>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                    Highest demand products for immediate inventory decisions
                </p>

                <ResponsiveContainer width="90%" height={280}>
                    <BarChart
                        data={listProducts
                            .sort((a, b) => (b.soldToday || 0) - (a.soldToday || 0))
                            .slice(0, 5)
                            .map(p => ({
                                name: p.productType,
                                sold: p.soldToday || 0
                            }))
                        }
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis 
                            type="number" 
                            tick={{ fontSize: 11 }}
                            axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={80}
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: '#e0e0e0' }}
                            style={{textTransform: "capitalize"}}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                padding: '8px 12px'
                            }}
                            formatter={(value) => [`${value.toLocaleString()} sold`, 'Quantity']}
                            cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                        />
                        <Bar 
                            dataKey="sold" 
                            radius={[0, 6, 6, 0]}
                            maxBarSize={35}
                        >
                            {listProducts.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#10b981" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>



            <div className="col-12 p-3 p-md-4" >
                <div className="row g-2 mb-3">
                    <div className="col-12 col-lg-6">
                        <div className="position-relative">
                            <i className="fa-solid fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                            <input
                                type="text"
                                className="form-control form-control-sm ps-5"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-6 col-lg-3">
                        <select
                            className="form-select form-select-sm text-capitalize"
                            value={productTypeFilter}
                            onChange={(e) => setProductTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {uniqueProductTypes.map((type, i) => (
                                <option key={i} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-6 col-lg-3">
                        <select
                            className="form-select form-select-sm text-capitalize"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="fruit">Fruit</option>
                            <option value="vegetable">Vegetable</option>
                            <option value="fertilizer">Fertilizer</option>
                        </select>
                    </div>
                </div>
                
                <div ref={printRef} style={{overflow: "auto"}}>
                    <table className="table table-hover">
                        <thead className="bg-light">
                            <tr>
                                <th className="text-uppercase small text-success text-capitalize">Product</th>
                                <th className="text-uppercase small text-success text-capitalize">Type</th>
                                <th className="text-uppercase small text-success text-capitalize">Category</th>
                                <th className="text-uppercase small text-success text-capitalize">
                                    <div className="d-flex align-items-center gap-2">
                                        <span>Price</span>
                                        <div className="d-flex flex-column" style={{ gap: "2px" }}>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${priceSortOrder === 'asc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setPriceSortOrder(priceSortOrder === 'asc' ? null : 'asc');
                                                    setSortOrder(null);
                                                    setStocksSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Price Ascending">
                                                <i className="fa fa-caret-up"></i>
                                            </button>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${priceSortOrder === 'desc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setPriceSortOrder(priceSortOrder === 'desc' ? null : 'desc');
                                                    setSortOrder(null);
                                                    setStocksSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Price Descending">
                                                <i className="fa fa-caret-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th className="text-uppercase small text-success text-capitalize">
                                    <div className="d-flex align-items-center gap-2">
                                        <span>Stocks</span>
                                        <div className="d-flex flex-column" style={{ gap: "2px" }}>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${stocksSortOrder === 'asc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setStocksSortOrder(stocksSortOrder === 'asc' ? null : 'asc');
                                                    setSortOrder(null);
                                                    setPriceSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Stocks Ascending">
                                                <i className="fa fa-caret-up"></i>
                                            </button>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${stocksSortOrder === 'desc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setStocksSortOrder(stocksSortOrder === 'desc' ? null : 'desc');
                                                    setSortOrder(null);
                                                    setPriceSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Stocks Descending">
                                                <i className="fa fa-caret-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th className="text-uppercase small text-success text-capitalize">Farmer</th>
                                <th className="text-uppercase small text-success text-capitalize">
                                    <div className="d-flex align-items-center gap-2">
                                        <div>
                                            <div className="mb-1">Sold ({getPeriodLabel()})</div>
                                            <div className="text-muted fw-normal" style={{ fontSize: "0.65rem", textTransform: "none" }}>
                                                {getDateRangeText()}
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column" style={{ gap: "2px" }}>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${sortOrder === 'asc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setSortOrder(sortOrder === 'asc' ? null : 'asc');
                                                    setPriceSortOrder(null);
                                                    setStocksSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Ascending">
                                                <i className="fa fa-caret-up"></i>
                                            </button>
                                            <button 
                                                className={`btn btn-sm p-0 border-0 ${sortOrder === 'desc' ? 'text-success' : 'text-muted'}`}
                                                onClick={() => {
                                                    setSortOrder(sortOrder === 'desc' ? null : 'desc');
                                                    setPriceSortOrder(null);
                                                    setStocksSortOrder(null);
                                                }}
                                                style={{ fontSize: "0.7rem", lineHeight: "1", background: "transparent" }}
                                                title="Sort Descending">
                                                <i className="fa fa-caret-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th className="text-uppercase small text-muted text-capitalize">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((product, i) => {
                                    const stockPercentage = getStockPercentage(product.stocks, product.totalStocks);
                                    const percentageColor = getStockPercentageColor(stockPercentage);
                                    const isLowStock = stockPercentage <= 50 && product.stocks > 0;
                                    
                                    return (
                                        <tr key={i}>
                                            <td className="small">
                                                <div className="d-flex align-items-center gap-2">
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/api/Uploads/${product.imageFile}`}
                                                        alt={product.name}
                                                        className="rounded"
                                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                    />
                                                    <div>
                                                        <p className="m-0 fw-semibold text-truncate text-capitalize" style={{ maxWidth: "150px" }}>
                                                            {product.name}
                                                        </p>
                                                        <p className="m-0 small text-muted">
                                                            ID: {product.prodId || product._id?.slice(-4)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="align-middle small text-capitalize">{product.productType}</td>

                                            <td className="align-middle small">
                                                <span className={`badge bg-opacity-10 text-capitalize ${
                                                    product.category === "fruit" ? "bg-warning text-warning" :
                                                    product.category === "vegetable" ? "bg-success text-success" :
                                                    product.category === "root crops" ? "bg-secondary text-secondary" :
                                                    "bg-warning text-warning"
                                                }`}>
                                                    {product.category}
                                                </span>
                                            </td>

                                            <td className="align-middle fw-semibold small">
                                                ₱{product.price.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </td>

                                            <td className="align-middle small">
                                                <div className="d-flex flex-column align-items-start gap-1" style={{ minWidth: "100px" }}>
                                                    {product.stocks === 0 ? (
                                                        <span className="badge bg-danger" style={{ fontSize: "0.65rem" }}>Out of Stock</span>
                                                    ) : (
                                                        <>
                                                            <div className="d-flex align-items-center gap-2 w-100">
                                                                <span className={`fw-semibold text-${percentageColor}`}>
                                                                    {product.stocks}/{product.totalStocks}
                                                                </span>
                                                            </div>
                                                            <div className="w-100">
                                                                <div className="progress" style={{ height: "4px", width: "100%" }}>
                                                                    <div 
                                                                        className={`progress-bar bg-${percentageColor}`}
                                                                        role="progressbar"
                                                                        style={{ width: `${stockPercentage}%` }}
                                                                        aria-valuenow={stockPercentage}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isLowStock && (
                                                                <span className="badge bg-warning text-dark" style={{ fontSize: "0.6rem" }}>
                                                                    Low Stocks
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="align-middle small text-capitalize">
                                                <span className="text-truncate" style={{ maxWidth: "120px" }}>
                                                    {product.seller?.name || "N/A"}
                                                </span>
                                            </td>

                                            <td className="align-middle small">
                                                <span className="text-success fw-semibold">
                                                    {product.soldToday || 0}
                                                </span>
                                            </td>

                                            <td className="align-middle small text-muted text-capitalize">
                                                {product.createdAt ? formatDate(product.createdAt) : "N/A"}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <i className="fa-solid fa-inbox text-muted mb-3" style={{ fontSize: "3rem" }}></i>
                                        <p className="text-muted">No products found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredProducts.length > 0 && (
                <div className="col-12 px-3 px-md-4 pb-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-top pt-3">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                        </div>
                        
                        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
                            <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                onClick={handleDownloadPDF}
                                title="Download as PDF">
                                <i className="fa fa-file-pdf small"></i>
                                <span className="small d-none d-lg-inline">PDF</span>
                            </button>

                            <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
                                onClick={handlePrint}
                                title="Print Products">
                                <i className="fa fa-print small"></i>
                                <span className="small d-none d-lg-inline">Print</span>
                            </button>

                            <button 
                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}>
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
                                                style={{ minWidth: "35px" }}>
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
                                disabled={currentPage === totalPages}>
                                <span className="me-2 small d-none d-lg-inline">Next</span>
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListReports;