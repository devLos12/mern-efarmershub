import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import img from "../assets/images/nodata.png";
import { useBreakpointHeight } from "./breakpoint";
import { appContext } from "../context/appContext";
import { sellerContext } from "../context/sellerContext";
import { adminContext } from "../context/adminContext";
import io from "socket.io-client";
import html2pdf from 'html2pdf.js';
import Toast from "./toastNotif";


// ─── Custom Range Modal ────────────────────────────────────────────────────────
const CustomRangeModal = ({ show, onClose, onApply, initialStartDate = '', initialEndDate = '', showNotification }) => {
    const [tempStartDate, setTempStartDate] = useState(initialStartDate);
    const [tempEndDate, setTempEndDate] = useState(initialEndDate);
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');
    const today = new Date().toISOString().split('T')[0];

    const getDurationText = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const todayStr = new Date().toISOString().split('T')[0];
        if (startDate === endDate && startDate === todayStr) return "Today";
        if (startDate === endDate) return "1 day";
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (monthsDiff >= 1 && start.getDate() === end.getDate()) return monthsDiff === 1 ? "1 month" : `${monthsDiff} months`;
        if (diffDays >= 28 && diffDays <= 32 && monthsDiff === 1) return "~1 month";
        if (diffDays % 7 === 0 && diffDays <= 28) { const w = diffDays / 7; return `${w} ${w === 1 ? 'week' : 'weeks'}`; }
        if (diffDays <= 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
        if (diffDays < 28) return `${diffDays} days`;
        const months = Math.floor(diffDays / 30);
        return months >= 1 ? `~${months} ${months === 1 ? 'month' : 'months'} (${diffDays} days)` : `${diffDays} days`;
    };

    const validateStartDate = (v = tempStartDate) => {
        if (!v) { setStartDateError(''); return true; }
        if (new Date(v) > new Date(today)) { setStartDateError('Start date cannot be in the future'); return false; }
        setStartDateError(''); return true;
    };

    const validateEndDate = (ev = tempEndDate, sv = tempStartDate) => {
        if (!ev) { setEndDateError(''); return true; }
        if (new Date(ev) > new Date(today)) { setEndDateError('End date cannot be in the future'); return false; }
        if (sv && new Date(ev) < new Date(sv)) { setEndDateError('End date must be after start date'); return false; }
        setEndDateError(''); return true;
    };

    const handleApply = () => {
        if (!tempStartDate || !tempEndDate) { showNotification("Please select both start and end dates", "error"); return; }
        if (!validateStartDate(tempStartDate) || !validateEndDate(tempEndDate, tempStartDate)) { showNotification("Please fix the date errors before applying", "error"); return; }
        if (tempStartDate > tempEndDate) { showNotification("Start date must be before end date", "error"); return; }
        onApply(tempStartDate, tempEndDate);
        setStartDateError(''); setEndDateError('');
    };

    const handleCancel = () => { setStartDateError(''); setEndDateError(''); onClose(); };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={handleCancel} />
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-calendar-days text-success me-2"></i>Custom Date Range
                            </h5>
                            <button type="button" className="btn-close" onClick={handleCancel} />
                        </div>
                        <div className="modal-body pt-2">
                            <p className="text-muted small mb-3">Select a custom date range to filter orders</p>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold"><i className="fa-regular fa-calendar me-1"></i>Start Date</label>
                                <input type="date" className={`form-control ${startDateError ? 'is-invalid' : ''}`} value={tempStartDate}
                                    onChange={(e) => setTempStartDate(e.target.value)}
                                    onBlur={() => { validateStartDate(tempStartDate); if (tempEndDate) validateEndDate(tempEndDate, tempStartDate); }}
                                    max={today} />
                                {startDateError && <div className="invalid-feedback d-block">{startDateError}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold"><i className="fa-regular fa-calendar me-1"></i>End Date</label>
                                <input type="date" className={`form-control ${endDateError ? 'is-invalid' : ''}`} value={tempEndDate}
                                    onChange={(e) => setTempEndDate(e.target.value)}
                                    onBlur={() => validateEndDate(tempEndDate, tempStartDate)}
                                    max={today} min={tempStartDate} />
                                {endDateError && <div className="invalid-feedback d-block">{endDateError}</div>}
                            </div>
                            {(startDateError || endDateError) && (
                                <div className="alert alert-danger py-2 px-3 mb-3">
                                    <i className="fa-solid fa-exclamation-triangle me-2"></i>
                                    <small><strong>Invalid dates.</strong> Please correct the errors above.</small>
                                </div>
                            )}
                            {tempStartDate && tempEndDate && !startDateError && !endDateError && (() => {
                                const isToday = tempStartDate === today && tempEndDate === today;
                                return (
                                    <div className="alert alert-success py-2 px-3 mb-0">
                                        <i className="fa-solid fa-check-circle me-2"></i>
                                        <small>
                                            <strong>Selected Range:</strong>{' '}
                                            {isToday ? <strong className="text-success">Today</strong> : (
                                                <>
                                                    {new Date(tempStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {' - '}
                                                    {new Date(tempEndDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {' '}({getDurationText(tempStartDate, tempEndDate)})
                                                </>
                                            )}
                                        </small>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-sm btn-light" onClick={handleCancel}><i className="fa-solid fa-times me-1"></i>Cancel</button>
                            <button type="button" className="btn btn-sm btn-success" onClick={handleApply}
                                disabled={!tempStartDate || !tempEndDate || !!startDateError || !!endDateError}>
                                <i className="fa-solid fa-check me-1"></i>Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// ──────────────────────────────────────────────────────────────────────────────


const Orders = () => {
    const { role, showToast, toastMessage, toastType, showNotification, setShowToast, setOrderBadge } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller;
    const { orders, loading, error, setError, setDeleteOrderModal, setText, setOrders, setLoading } = context;
    const navigate = useNavigate();
    const height = useBreakpointHeight();
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRefs = useRef({});
    const buttonRefs = useRef({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [orderMethodFilter, setOrderMethodFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const socketRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const printRef = useRef();
    const [showArchived, setShowArchived] = useState(false);
    const [archiveOrderModal, setArchiveOrderModal] = useState({ isShow: false, id: null });

    // ── Date Filter States ──────────────────────────────────────────────────────
    const [period, setPeriod] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
    // ───────────────────────────────────────────────────────────────────────────

    const availableStatuses = useMemo(() => {
        const statuses = new Set();
        orders.forEach(order => { if (order.statusDelivery) statuses.add(order.statusDelivery); });
        return Array.from(statuses).sort();
    }, [orders]);

    const availableOrderMethods = useMemo(() => {
        const methods = new Set();
        orders.forEach(order => { if (order.orderMethod) methods.add(order.orderMethod); });
        return Array.from(methods).sort();
    }, [orders]);

    // ── Period label ────────────────────────────────────────────────────────────
    const getPeriodLabel = () => {
        switch (period) {
            case "all": return "All Time";
            case "thisweek": return "This Week";
            case "thismonth": return "This Month";
            case "thisyear": return "This Year";
            case "custom":
                if (customStartDate && customEndDate) {
                    const today = new Date().toISOString().split('T')[0];
                    if (customStartDate === today && customEndDate === today) return "Today";
                    if (customStartDate === customEndDate) return new Date(customStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                    return `${new Date(customStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                }
                return "Custom Range";
            default: return "";
        }
    };

    // ── Custom Range handlers ───────────────────────────────────────────────────
    const handleCustomRangeApply = (startDate, endDate) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        setPeriod('custom');
        setIsCustomRange(true);
        setShowCustomRangeModal(false);
    };

    const handleCustomRangeClose = () => {
        setShowCustomRangeModal(false);
        if (!isCustomRange) setPeriod('all');
    };
    // ───────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.on('new order', () => { fetchOrders(); });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);

    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        const actionsToRemove = printContent.querySelectorAll('td:last-child');
        actionsToRemove.forEach(td => { td.innerHTML = '<span class="text-muted small">-</span>'; });
        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Orders</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
                        th { background-color: #198754; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h2 { margin: 0; color: #198754; }
                        .header p { margin: 5px 0; color: #666; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Orders Report</h2>
                        <p>Period: ${getPeriodLabel()}</p>
                        <p>Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p>Total Orders: ${filteredOrders.length}</p>
                        ${statusFilter !== 'all' ? `<p>Status: ${statusFilter}</p>` : ''}
                        ${orderMethodFilter !== 'all' ? `<p>Method: ${orderMethodFilter}</p>` : ''}
                    </div>
                    ${printContent.innerHTML}
                    <script>
                        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }
                    </script>
                </body>
            </html>
        `);
        windowPrint.document.close();
    };

    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        const actionsToRemove = printContent.querySelectorAll('td:last-child');
        actionsToRemove.forEach(td => { td.innerHTML = '<span class="text-muted small">-</span>'; });
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Orders Report</h2>
                <p style="margin: 5px 0; color: #666;">Period: ${getPeriodLabel()}</p>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0; color: #666;">Total Orders: ${filteredOrders.length}</p>
                ${statusFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Status: ${statusFilter}</p>` : ''}
                ${orderMethodFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Method: ${orderMethodFilter}</p>` : ''}
            </div>
        `;
        wrapper.appendChild(printContent);
        html2pdf().set({
            margin: 10,
            filename: `orders_${period}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(wrapper).save();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openMenuId) return;
            const menuEl = menuRefs.current[openMenuId];
            const buttonEl = buttonRefs.current[openMenuId];
            if (menuEl && buttonEl && !menuEl.contains(event.target) && !buttonEl.contains(event.target)) setOpenMenuId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [openMenuId]);

    // ── fetchOrders — now passes period query params to backend ─────────────────
    const fetchOrders = async () => {
        const endPoint = role === "admin"
            ? (showArchived ? "getArchivedOrders" : "getOrders")
            : (showArchived ? "getArchivedSellerOrders" : "getSellerOrders");

        // Build query string
        let queryParams = `period=${period}`;
        if (period === 'custom' && customStartDate && customEndDate) {
            queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}?${queryParams}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setError((prev) => ({ ...prev, orders: null }));
            setOrders(data.reverse());
        } catch (err) {
            setOrders([]);
            setError((prev) => ({ ...prev, orders: err.message }));
            console.log("Error: ", err.message);
        }
    };
    // ───────────────────────────────────────────────────────────────────────────

    // Re-fetch when showArchived, period, or custom dates change
    useEffect(() => {
        const loadInitialOrders = async () => {
            await fetchOrders();
            setTimeout(() => { setLoading(false); }, 500);
        };
        loadInitialOrders();
    }, [showArchived, period, customStartDate, customEndDate]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchOrders();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleArchive = async (orderId) => {
        const endPoint = role === "admin" ? "archiveOrder" : "archiveSellerOrder";
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            await fetchOrders();
            setArchiveOrderModal({ isShow: false, id: null });
            showNotification(data.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleUnarchive = async (orderId) => {
        const endPoint = role === "admin" ? "unarchiveOrder" : "unarchiveSellerOrder";
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            await fetchOrders();
            showNotification(data.message, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleViewDetails = (orderId) => {
        if (role === "admin") return navigate("orderdetails", { state: { orderId } });
        if (role === "seller") return navigate("/seller/orderdetails", { state: { orderId } });
    };

    const getStatusColor = (status) => {
        const colors = {
            "pending": "warning", "confirmed": "info", "confirm": "info",
            "packing": "primary", "ready to deliver": "success", "ready for pick up": "success",
            "in transit": "info", "delivered": "success", "complete": "success",
            "completed": "success", "cancelled": "danger", "refund requested": "warning",
            "refund processing": "info", "refund completed": "success", "refund rejected": "danger"
        };
        return colors[status] || "secondary";
    };

    // ── Frontend filtering — status, method, search only (date already handled by backend) ──
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const statusMatch = statusFilter === "all" || order.statusDelivery === statusFilter;
            const methodMatch = orderMethodFilter === "all" || order.orderMethod === orderMethodFilter;
            const searchMatch = searchQuery === "" ||
                order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.firstname + " " + order.lastname).toLowerCase().includes(searchQuery.toLowerCase());
            return statusMatch && methodMatch && searchMatch;
        });
    }, [orders, statusFilter, orderMethodFilter, searchQuery]);
    // ───────────────────────────────────────────────────────────────────────────

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, orderMethodFilter, searchQuery, period]);

    if (loading) return <p></p>;

    return (
        <>
        <div className={role === "seller" ? "p-2" : "p-0"}>
        <div className="border row g-0 bg-white rounded shadow-sm justify-content-center">
            <div className="col-12">
                <p className="text-capitalize fw-bold py-2 text-center m-0">order summary</p>
            </div>
            <div className="col-12">
                <div className="d-flex flex-column gap-2 p-2 flex-md-row justify-content-md-between flex-wrap">

                    {/* Search */}
                    <div className="position-relative" style={{ minWidth: "200px", maxWidth: "300px" }}>
                        <input
                            type="text"
                            className="form-control form-control-sm ps-4"
                            placeholder="Search by Order ID or Buyers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ fontSize: "14px" }}
                        />
                        <i className="fa fa-search position-absolute text-muted"
                            style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px" }}></i>
                    </div>

                    <div className="d-flex flex-column gap-2 flex-md-row flex-wrap">

                        {/* ── Date Period Filter ──────────────────────────────── */}
                        <div className="d-flex align-items-center gap-2">
                            <i className="fa fa-calendar text-success small"></i>
                            <select
                                className="form-select form-select-sm"
                                style={{ fontSize: "14px", minWidth: "140px" }}
                                value={period}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setShowCustomRangeModal(true);
                                    } else {
                                        setPeriod(e.target.value);
                                        setIsCustomRange(false);
                                    }
                                }}
                            >
                                <option value="all">All Time</option>
                                <option value="thisweek">This Week</option>
                                <option value="thismonth">This Month</option>
                                <option value="thisyear">This Year</option>
                                <option value="custom">Custom</option>
                            </select>

                            {period === 'custom' && customStartDate && customEndDate && (
                                <span className="badge bg-success-subtle text-success border border-success border-opacity-25 small text-nowrap">
                                    <i className="fa fa-calendar-check me-1"></i>
                                    {getPeriodLabel()}
                                </span>
                            )}
                        </div>
                        {/* ───────────────────────────────────────────────────── */}

                        <div className="d-flex align-items-center gap-2">
                            <select
                                className="form-select form-select-sm"
                                style={{ fontSize: "14px" }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                {availableStatuses.map((status) => (
                                    <option key={status} value={status} className="text-capitalize">
                                        {status === 'confirm' ? 'Confirmed' : status}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select form-select-sm"
                                style={{ fontSize: "14px" }}
                                value={orderMethodFilter}
                                onChange={(e) => setOrderMethodFilter(e.target.value)}
                            >
                                <option value="all">All Methods</option>
                                {availableOrderMethods.map((method) => (
                                    <option key={method} value={method} className="text-capitalize">
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className={`btn btn-sm ${showArchived ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center gap-2`}
                            onClick={() => setShowArchived(!showArchived)}
                            style={{ fontSize: "14px" }}>
                            {showArchived ? 'Unarchived' : 'Archived'}
                        </button>

                        <button
                            className="btn btn-sm btn-success d-flex align-items-center gap-2"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            style={{ fontSize: "14px" }}
                        >
                            <i className={`fa fa-refresh ${isRefreshing ? 'fa-spin' : ''}`}></i>
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {filteredOrders.length > 0 ? (
            <>
            <div className="rounded border shadow-sm mt-1 bg-white position-relative overflow-hidden">
                {isRefreshing && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" style={{ zIndex: 10 }}>
                        <div className="text-center">
                            <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                            <p className="small text-muted mb-0">Refreshing orders...</p>
                        </div>
                    </div>
                )}

                <div ref={printRef} className="table-responsive" style={{ overflow: "auto" }}>
                    <table className="table table-hover">
                        <thead className="bg-light">
                            <tr>
                                <th className="text-uppercase small text-success">#</th>
                                <th className="text-uppercase small text-success">Order Id</th>
                                <th className="text-uppercase small text-success">Buyer Name</th>
                                <th className="text-uppercase small text-success">Total Payment</th>
                                <th className="text-uppercase small text-success text-center">Status</th>
                                <th className="text-uppercase small text-success text-center">Rider</th>
                                <th className="text-uppercase small text-success">Date/Time</th>
                                <th className="text-uppercase small text-success text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((data, i) => {
                                const isMenuOpen = openMenuId === data._id;
                                const rowNumber = indexOfFirstItem + i + 1;
                                const popUp = i >= currentItems.length - 2;

                                return (
                                    <tr key={i}>
                                        <td className="align-middle small">{rowNumber}</td>
                                        <td className="align-middle small fw-bold">{data.orderId || "N/A"}</td>
                                        <td className="align-middle small text-capitalize">{data.firstname + " " + data.lastname}</td>
                                        <td className="align-middle small">₱{data.totalPrice.toLocaleString('en-PH')}.00</td>
                                        <td className="align-middle small text-center text-capitalize">
                                            <span className={`badge bg-${getStatusColor(data.statusDelivery === 'confirm' ? 'confirmed' : data.statusDelivery)}`}>
                                                {data.statusDelivery === 'confirm' ? 'confirmed' : data.statusDelivery}
                                            </span>
                                        </td>
                                        <td className="align-middle small text-center">
                                            {data.orderMethod === "pick up" ? (
                                                <span className="text-muted fst-italic">N/A</span>
                                            ) : data.riderName && data.riderName.trim() ? (
                                                <span className="fw-semibold">{data.riderName}</span>
                                            ) : (
                                                <span className="text-muted fst-italic">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="align-middle small">
                                            <p className="m-0">{new Date(data.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            <p className="m-0 text-muted">{new Date(data.createdAt).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="align-middle text-center">
                                            <div
                                                ref={(el) => (buttonRefs.current[data._id] = el)}
                                                className="position-relative mx-auto d-flex align-items-center justify-content-center shadow-sm border rounded-circle"
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : data._id)}
                                                style={{ cursor: "pointer", width: "30px", height: "30px" }}
                                            >
                                                <i className="fa fa-ellipsis"></i>
                                                {isMenuOpen && (
                                                    <div
                                                        ref={(el) => (menuRefs.current[data._id] = el)}
                                                        className="card position-absolute p-2 z-1"
                                                        style={{
                                                            width: "220px", cursor: "default",
                                                            boxShadow: "0px 2px 10px rgba(0,0,0,0.25)",
                                                            right: 0,
                                                            top: popUp ? "auto" : "100%",
                                                            bottom: popUp ? "100%" : "auto",
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => { handleViewDetails(data._id); setOpenMenuId(null); }}>
                                                            <i className="fa fa-list small"></i>
                                                            <p className="m-0 capitalize small">view details</p>
                                                        </div>

                                                        {!showArchived ? (
                                                            <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => { setArchiveOrderModal({ isShow: true, id: data._id }); setOpenMenuId(null); }}>
                                                                <i className="fa fa-archive small text-warning"></i>
                                                                <p className="m-0 capitalize small text-warning">archive</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                                    style={{ cursor: "pointer" }}
                                                                    onClick={() => { handleUnarchive(data._id); setOpenMenuId(null); }}>
                                                                    <i className="fa fa-inbox small text-info"></i>
                                                                    <p className="m-0 capitalize small text-info">unarchive</p>
                                                                </div>
                                                                <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                                    style={{ cursor: "pointer" }}
                                                                    onClick={() => { setDeleteOrderModal((prev) => ({ ...prev, isShow: true, id: data._id })); setText("do you want to delete?"); setOpenMenuId(null); }}>
                                                                    <i className="fa fa-trash small text-danger"></i>
                                                                    <p className="m-0 capitalize small text-danger">delete</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="row g-0 bg-white rounded border shadow-sm">
                <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                    <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                </div>
                <div className="col-12 col-lg-8 p-3">
                    <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                        <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleDownloadPDF}>
                            <i className="fa fa-file-pdf small"></i><span className="small d-none d-sm-block">PDF</span>
                        </button>
                        <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={handlePrint}>
                            <i className="fa fa-print small"></i><span className="small d-none d-sm-block">Print</span>
                        </button>
                        <div className="d-none d-md-block border-start" style={{ height: "30px" }}></div>
                        <button className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                            <i className="fa fa-chevron-left"></i>
                            <span className="ms-2 small d-none d-lg-block">Previous</span>
                        </button>
                        <div className="d-flex gap-1 flex-wrap justify-content-center">
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                    return (
                                        <button key={pageNumber}
                                            className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`}
                                            onClick={() => setCurrentPage(pageNumber)} style={{ minWidth: "35px" }}>
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                    return <span key={pageNumber} className="px-2 d-flex align-items-center">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <button className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                            <span className="me-2 small d-none d-lg-block">Next</span>
                            <i className="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
            </>
        ) : (
            <div className="row g-0 bg-white border rounded shadow-sm mt-1 justify-content-center align-items-center" style={{ height: 336 }}>
                <div className="col-md-5 text-center">
                    <div className="mb-3">
                        <i className="fa-solid fa-shopping-bag text-muted opacity-50" style={{ fontSize: "80px" }}></i>
                    </div>
                    <p className="mt-3 text-capitalize text-center opacity-75 fw-semibold">
                        {orders.length === 0 ? "No orders yet" : "No orders match the selected filters"}
                    </p>
                    <p className="text-muted small">
                        {orders.length === 0
                            ? "Orders will appear here once buyers start placing them"
                            : `No orders found for ${getPeriodLabel()}. Try adjusting your filters.`}
                    </p>
                    {filteredOrders.length === 0 && orders.length > 0 && (
                        <button className="btn btn-sm btn-outline-success mt-2"
                            onClick={() => { setStatusFilter("all"); setOrderMethodFilter("all"); setSearchQuery(""); setPeriod("all"); setIsCustomRange(false); }}>
                            <i className="fa fa-filter-circle-xmark me-2"></i>Clear Filters
                        </button>
                    )}
                </div>
            </div>
        )}
        </div>

        {archiveOrderModal.isShow && (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                <div className="bg-white rounded p-4 shadow" style={{ maxWidth: "400px" }}>
                    <h5 className="mb-3">Archive Order</h5>
                    <p>Are you sure you want to archive this order?</p>
                    <div className="d-flex gap-2 justify-content-end mt-3">
                        <button className="btn btn-sm btn-secondary" onClick={() => setArchiveOrderModal({ isShow: false, id: null })}>Cancel</button>
                        <button className="btn btn-sm btn-warning" onClick={() => handleArchive(archiveOrderModal.id)}>Archive</button>
                    </div>
                </div>
            </div>
        )}

        {/* Custom Range Modal */}
        <CustomRangeModal
            show={showCustomRangeModal}
            onClose={handleCustomRangeClose}
            onApply={handleCustomRangeApply}
            initialStartDate={customStartDate}
            initialEndDate={customEndDate}
            showNotification={showNotification}
        />

        <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
        </>
    );
};

export default Orders;