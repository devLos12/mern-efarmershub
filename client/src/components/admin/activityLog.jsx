import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import Toast from "../toastNotif.jsx";
import { appContext } from "../../context/appContext.jsx";
import html2pdf from 'html2pdf.js';


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
                            <p className="text-muted small mb-3">Select a custom date range to filter activity logs</p>
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


const ActivityLog = () => {
    const { showNotification, showToast, toastMessage, toastType, setShowToast } = useContext(appContext);

    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [adminTypeFilter, setAdminTypeFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const socketRef = useRef(null);
    const printRef = useRef(); // ← ref for print/PDF table

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);

    // ── Date Filter States ──────────────────────────────────────────────────────
    const [period, setPeriod] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
    // ───────────────────────────────────────────────────────────────────────────

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

    // ── Print handler ───────────────────────────────────────────────────────────
    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        // Remove the select checkbox column from print
        printContent.querySelectorAll('th:last-child, td:last-child').forEach(el => {
            if (el.querySelector('input[type="checkbox"]') || el.querySelector('.form-check')) el.remove();
        });
        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Activity Logs</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #198754; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h2 { margin: 0; color: #198754; }
                        .header p { margin: 5px 0; color: #666; }
                        .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; display: inline-block; }
                        .badge-success { background-color: #d1e7dd; color: #0f5132; }
                        .badge-danger  { background-color: #f8d7da; color: #842029; }
                        .badge-primary { background-color: #cfe2ff; color: #084298; }
                        .badge-secondary { background-color: #e2e3e5; color: #41464b; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Activity Logs Report</h2>
                        <p>Period: ${getPeriodLabel()}</p>
                        <p>Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p>Total Logs: ${filteredLogs.length}</p>
                        ${statusFilter !== 'all' ? `<p>Status: ${statusFilter}</p>` : ''}
                        ${adminTypeFilter !== 'all' ? `<p>Admin Type: ${adminTypeFilter}</p>` : ''}
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
    // ───────────────────────────────────────────────────────────────────────────

    // ── Download PDF handler ────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        // Remove checkbox column if select mode is active
        printContent.querySelectorAll('th:last-child, td:last-child').forEach(el => {
            if (el.querySelector('input[type="checkbox"]') || el.querySelector('.form-check')) el.remove();
        });
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Activity Logs Report</h2>
                <p style="margin: 5px 0; color: #666;">Period: ${getPeriodLabel()}</p>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0; color: #666;">Total Logs: ${filteredLogs.length}</p>
                ${statusFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Status: ${statusFilter}</p>` : ''}
                ${adminTypeFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Admin Type: ${adminTypeFilter}</p>` : ''}
            </div>
        `;
        wrapper.appendChild(printContent);
        html2pdf().set({
            margin: 10,
            filename: `activity_logs_${period}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(wrapper).save();
    };
    // ───────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.on('new activity', () => {
            getActivityLogs();
        });
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ── Re-fetch when period or custom dates change ─────────────────────────────
    useEffect(() => {
        const loadInitialLogs = async () => {
            await getActivityLogs();
            setTimeout(() => { setLoading(false); }, 500);
        };
        loadInitialLogs();
    }, [period, customStartDate, customEndDate]);
    // ───────────────────────────────────────────────────────────────────────────

    // ── getActivityLogs — passes period query params to backend ─────────────────
    const getActivityLogs = async () => {
        try {
            let queryParams = `period=${period}`;
            if (period === 'custom' && customStartDate && customEndDate) {
                queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getActivityLogs?${queryParams}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setActivityLogs(data);
        } catch (error) {
            console.log("Error", error.message);
            setActivityLogs([]);
        }
    };
    // ───────────────────────────────────────────────────────────────────────────

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await getActivityLogs();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusColor = (status) => status === "success" ? "success" : "danger";
    const getAdminTypeBadge = (type) => type === "main" ? "primary" : "secondary";

    const toggleSelectAll = () => {
        setIsAllSelected((prev) => {
            const newValue = !prev;
            if (newValue) {
                const allIds = new Set(filteredLogs.map((log) => log._id));
                setSelectedIds(allIds);
            } else {
                setSelectedIds(new Set());
            }
            return newValue;
        });
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) updated.delete(id);
            else updated.add(id);
            setIsAllSelected(updated.size === filteredLogs.length);
            return updated;
        });
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) { showNotification("No logs selected yet", "error"); return; }
        const sendData = [...selectedIds];
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteActivityLogs`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: sendData }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setActivityLogs((prev) => prev.filter((item) => !selectedIds.has(item._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);
            showNotification(data.message || `Successfully deleted ${sendData.length} log(s)`, "success");
        } catch (error) {
            showNotification(error.message || "Failed to delete logs", "error");
        }
    };

    // Frontend filtering — status, adminType, search only (date handled by backend)
    const filteredLogs = activityLogs?.filter(log => {
        const statusMatch = statusFilter === "all" || log.status === statusFilter;
        const adminTypeMatch = adminTypeFilter === "all" || log.adminType === adminTypeFilter;

        if (!debouncedSearch) return statusMatch && adminTypeMatch;

        const action = (log.action || "").toLowerCase();
        const description = (log.description || "").toLowerCase();
        const username = (log.performedBy?.email || "").toLowerCase();

        const searchMatch = action.includes(debouncedSearch) || description.includes(debouncedSearch) || username.includes(debouncedSearch);

        return statusMatch && adminTypeMatch && searchMatch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, adminTypeFilter, searchQuery, period]);

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="text-center">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="small text-muted mt-2">Loading activity logs...</p>
            </div>
        </div>
    );

    return (
        <>
            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />

            <div className="p-2">
                <div className="border row g-0 bg-white rounded shadow-sm p-2 px-2 px-lg-4 mt-1 gap-2">

                    {/* Search */}
                    <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                        <input
                            type="search"
                            placeholder="Search action, description, or admin..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-control border-2"
                            style={{ outline: "none", fontSize: "14px" }}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="col">
                        <div>
                            <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                                {selectedIds.size > 0 && (
                                    <button className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm"
                                        onClick={handleDelete} style={{ cursor: "pointer" }}>
                                        delete
                                    </button>
                                )}
                                <button className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1" onClick={handleRefresh}>
                                    <i className={`fa fa-sync small text-dark ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                    <p className="m-0 small text-capitalize">refresh</p>
                                </button>
                                <button className="btn-dark text-white small p-1 text-capitalize rounded border-0 shadow-sm"
                                    onClick={() => { setIsAllSelected(false); setSelectedIds(new Set()); setIsSelect((prev) => !prev); }}
                                    style={{ cursor: "pointer", width: "100px" }}>
                                    {isSelect ? "hide select" : "show select"}
                                </button>
                            </div>
                            <p className="m-0 small opacity-50 text-end mt-2">
                                {`${selectedIds.size} selected from ${filteredLogs.length} Total`}
                            </p>
                        </div>
                    </div>

                    {/* Filters row */}
                    <div className="col-12 d-flex flex-column flex-md-row gap-2 flex-wrap align-items-center">

                        {/* ── Date Period Filter ────────────────────────────── */}
                        <div className="d-flex align-items-center gap-2">
                            <i className="fa fa-calendar text-success small"></i>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "100%", maxWidth: "150px", fontSize: "14px" }}
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
                                <option value="custom">Custom Range</option>
                            </select>
                            {period === 'custom' && customStartDate && customEndDate && (
                                <span className="badge bg-success-subtle text-success border border-success border-opacity-25 small text-nowrap">
                                    <i className="fa fa-calendar-check me-1"></i>
                                    {getPeriodLabel()}
                                </span>
                            )}
                        </div>
                        {/* ───────────────────────────────────────────────────── */}

                        <select
                            className="form-select form-select-sm"
                            style={{ width: "100%", maxWidth: "150px", fontSize: "14px" }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            className="form-select form-select-sm"
                            style={{ width: "100%", maxWidth: "150px", fontSize: "14px" }}
                            value={adminTypeFilter}
                            onChange={(e) => setAdminTypeFilter(e.target.value)}
                        >
                            <option value="all">All Admin Types</option>
                            <option value="main">Main Admin</option>
                            <option value="sub">Sub Admin</option>
                        </select>
                    </div>
                </div>

                {filteredLogs.length > 0 ? (
                    <>
                        <div className="mt-1 bg-white rounded shadow-sm border position-relative" style={{ overflow: "auto" }}>
                            {isRefreshing && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 10 }}>
                                    <div className="text-center">
                                        <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                                        <p className="small text-muted mb-0">Refreshing logs...</p>
                                    </div>
                                </div>
                            )}

                            {/* ↓ printRef wraps the table so print/PDF captures it */}
                            <div ref={printRef}>
                                <table className="w-100">
                                    <thead className="position-sticky top-0 z-1">
                                        <tr className="bg-white">
                                            {["#", "Admin", "Type", "Action", "Description", "IP Address", "Status", "Date/Time"].map((data, i) => (
                                                <th key={i} className={`p-3 text-success small ${[0, 2, 6].includes(i) && "text-center"}`}>
                                                    {data}
                                                </th>
                                            ))}
                                            {isSelect && (
                                                <th className="p-3">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <div className="d-flex gap-2">
                                                            <p className="m-0 text-success text-capitalize">all</p>
                                                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((log, i) => (
                                            <tr key={i}>
                                                <td className="p-3 small text-center">{indexOfFirstItem + i + 1}</td>
                                                <td className="p-3 small" style={{ whiteSpace: "nowrap" }}>
                                                    <span className="text-dark">{log.performedBy?.email || "Unknown"}</span>
                                                </td>
                                                <td className="p-3 small text-center">
                                                    <span className={`bg-${getAdminTypeBadge(log.adminType)} bg-opacity-10 text-${getAdminTypeBadge(log.adminType)} fw-bold small text-capitalize`}
                                                        style={{ padding: "4px 12px", borderRadius: "4px", display: "inline-block" }}>
                                                        {log.adminType}
                                                    </span>
                                                </td>
                                                <td className="p-3 small text-capitalize">
                                                    <span className="opacity-75 small">{log.action}</span>
                                                </td>
                                                <td className="p-3 small" style={{ maxWidth: "300px" }}>
                                                    <span className="opacity-75">{log.description}</span>
                                                </td>
                                                <td className="p-3 small text-muted" style={{ whiteSpace: "nowrap" }}>
                                                    {log.ipAddress || "N/A"}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`bg-${getStatusColor(log.status)} bg-opacity-10 text-${getStatusColor(log.status)} fw-bold small text-capitalize`}
                                                        style={{ padding: "4px 12px", borderRadius: "4px", display: "inline-block" }}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="p-3" style={{ whiteSpace: "nowrap" }}>
                                                    <p className="m-0 small">{new Date(log.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                    <p className="m-0 small text-muted">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                                </td>
                                                {isSelect && (
                                                    <td className="p-3">
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <input type="checkbox" checked={selectedIds.has(log._id)} onChange={() => toggleSelect(log._id)} style={{ cursor: "pointer" }} />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* ↑ end printRef */}
                        </div>

                        {/* ── Pagination + Print/PDF buttons ── */}
                        <div className="row g-0 bg-white rounded border shadow-sm">
                            <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                                <div className="text-muted small">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
                                </div>
                            </div>
                            <div className="col-12 col-lg-8 p-3">
                                <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">

                                    {/* PDF & Print buttons */}
                                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleDownloadPDF}>
                                        <i className="fa fa-file-pdf small"></i>
                                        <span className="small d-none d-sm-block">PDF</span>
                                    </button>
                                    <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={handlePrint}>
                                        <i className="fa fa-print small"></i>
                                        <span className="small d-none d-sm-block">Print</span>
                                    </button>

                                    <div className="d-none d-md-block border-start" style={{ height: "30px" }}></div>

                                    {/* Pagination */}
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
                        {/* ── end Pagination + Print/PDF ── */}
                    </>
                ) : (
                    <div className="mt-2 bg-white border rounded shadow-sm p-5">
                        <p className="m-0 text-capitalize text-center small opacity-75">
                            {activityLogs.length === 0
                                ? "No activity logs yet"
                                : `No logs found for ${getPeriodLabel()}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Custom Range Modal */}
            <CustomRangeModal
                show={showCustomRangeModal}
                onClose={handleCustomRangeClose}
                onApply={handleCustomRangeApply}
                initialStartDate={customStartDate}
                initialEndDate={customEndDate}
                showNotification={showNotification}
            />
        </>
    );
};

export default ActivityLog;