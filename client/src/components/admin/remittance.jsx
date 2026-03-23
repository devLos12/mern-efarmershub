import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import io from "socket.io-client";
import html2pdf from "html2pdf.js";
import Toast from "../toastNotif";
import { appContext } from "../../context/appContext";

// ─── Custom Range Modal ────────────────────────────────────────────────────────
const CustomRangeModal = ({ show, onClose, onApply, initialStartDate = "", initialEndDate = "", showNotification }) => {
    const [tempStartDate, setTempStartDate] = useState(initialStartDate);
    const [tempEndDate, setTempEndDate] = useState(initialEndDate);
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const today = new Date().toISOString().split("T")[0];

    const getDurationText = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const todayStr = new Date().toISOString().split("T")[0];
        if (startDate === endDate && startDate === todayStr) return "Today";
        if (startDate === endDate) return "1 day";
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (monthsDiff >= 1 && start.getDate() === end.getDate()) return monthsDiff === 1 ? "1 month" : `${monthsDiff} months`;
        if (diffDays >= 28 && diffDays <= 32 && monthsDiff === 1) return "~1 month";
        if (diffDays % 7 === 0 && diffDays <= 28) { const w = diffDays / 7; return `${w} ${w === 1 ? "week" : "weeks"}`; }
        if (diffDays <= 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
        if (diffDays < 28) return `${diffDays} days`;
        const months = Math.floor(diffDays / 30);
        return months >= 1 ? `~${months} ${months === 1 ? "month" : "months"} (${diffDays} days)` : `${diffDays} days`;
    };

    const validateStartDate = (v = tempStartDate) => {
        if (!v) { setStartDateError(""); return true; }
        if (new Date(v) > new Date(today)) { setStartDateError("Start date cannot be in the future"); return false; }
        setStartDateError(""); return true;
    };

    const validateEndDate = (ev = tempEndDate, sv = tempStartDate) => {
        if (!ev) { setEndDateError(""); return true; }
        if (new Date(ev) > new Date(today)) { setEndDateError("End date cannot be in the future"); return false; }
        if (sv && new Date(ev) < new Date(sv)) { setEndDateError("End date must be after start date"); return false; }
        setEndDateError(""); return true;
    };

    const handleApply = () => {
        if (!tempStartDate || !tempEndDate) { showNotification("Please select both start and end dates", "error"); return; }
        if (!validateStartDate(tempStartDate) || !validateEndDate(tempEndDate, tempStartDate)) { showNotification("Please fix the date errors before applying", "error"); return; }
        if (tempStartDate > tempEndDate) { showNotification("Start date must be before end date", "error"); return; }
        onApply(tempStartDate, tempEndDate);
        setStartDateError(""); setEndDateError("");
    };

    const handleCancel = () => { setStartDateError(""); setEndDateError(""); onClose(); };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={handleCancel} />
            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-calendar-days text-success me-2"></i>Custom Date Range
                            </h5>
                            <button type="button" className="btn-close" onClick={handleCancel} />
                        </div>
                        <div className="modal-body pt-2">
                            <p className="text-muted small mb-3">Select a custom date range to filter remittances</p>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold"><i className="fa-regular fa-calendar me-1"></i>Start Date</label>
                                <input type="date" className={`form-control ${startDateError ? "is-invalid" : ""}`} value={tempStartDate}
                                    onChange={(e) => setTempStartDate(e.target.value)}
                                    onBlur={() => { validateStartDate(tempStartDate); if (tempEndDate) validateEndDate(tempEndDate, tempStartDate); }}
                                    max={today} />
                                {startDateError && <div className="invalid-feedback d-block">{startDateError}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-semibold"><i className="fa-regular fa-calendar me-1"></i>End Date</label>
                                <input type="date" className={`form-control ${endDateError ? "is-invalid" : ""}`} value={tempEndDate}
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
                                            <strong>Selected Range:</strong>{" "}
                                            {isToday ? <strong className="text-success">Today</strong> : (
                                                <>
                                                    {new Date(tempStartDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                                    {" - "}
                                                    {new Date(tempEndDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                                    {" "}({getDurationText(tempStartDate, tempEndDate)})
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


// ─── Update Status Modal ───────────────────────────────────────────────────────
const UpdateStatusModal = ({ show, remittance, onClose, onConfirm, isProcessing }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);


    const [showFullView, setShowFullView] = useState(false);


    useEffect(() => {
        if (!show) {
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = null;
        }
    }, [show]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleConfirm = () => {
        if (!imageFile) return;
        onConfirm(remittance._id, imageFile);
    };

    if (!show || !remittance) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={!isProcessing ? onClose : undefined} />
            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-check-circle text-success me-2"></i>Mark as Remitted
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={isProcessing} />
                        </div>
                        <div className="modal-body pt-2">
                            <p className="text-muted small mb-3">You are about to mark this remittance record as <strong className="text-success">Remitted</strong>.</p>

                            {/* Info */}
                            <div className="bg-light rounded p-3 small mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Order ID:</span>
                                    <span className="fw-semibold">{remittance.orderId?.orderId || "N/A"}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Rider:</span>
                                    <span className="fw-semibold text-capitalize">
                                        {remittance.riderId ? `${remittance.riderId.firstname} ${remittance.riderId.lastname}` : "N/A"}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Expected Amount:</span>
                                    <span className="fw-bold text-success">₱{remittance.expectedAmount?.toLocaleString("en-PH")}.00</span>
                                </div>
                            </div>

                            {/* Image upload */}
                            <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                    <i className="fa fa-image me-1 text-success"></i>
                                    Proof of Remittance <span className="text-danger">*</span>
                                </label>
                                {imagePreview ? (
                                    <div className="border rounded p-3 d-flex align-items-center gap-3">
                                        <div
                                            className="border rounded bg-light d-flex align-items-center justify-content-center"
                                            style={{ 
                                                width: "50px", 
                                                height: "50px", 
                                                minWidth: "50px", 
                                                overflow: "hidden",
                                                cursor: "pointer"

                                            }}
                                            onClick={() => setShowFullView(true)}
                                        >
                                            <img src={imagePreview} alt="Preview" 
                                            className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="m-0 fw-bold small text-truncate"><i className="fa fa-file-image me-2 text-success"></i>{imageFile?.name}</p>
                                            <p className="m-0 small text-muted">Ready to upload</p>
                                        </div>
                                        <button className="btn btn-sm btn-outline-danger" onClick={handleRemoveFile} disabled={isProcessing}>
                                            <i className="fa fa-trash"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border border-dashed rounded p-4 text-center">
                                        <i className="fa fa-cloud-upload-alt fs-1 text-muted mb-2 d-block"></i>
                                        <p className="m-0 mb-3 text-muted small text-capitalize">Upload proof of remittance (photo of cash/receipt)</p>
                                        <label htmlFor="remittanceProofFile" className="btn btn-outline-success btn-sm" style={{ cursor: "pointer" }}>
                                            <i className="fa fa-paperclip me-2"></i>Choose File
                                        </label>
                                        <input
                                            id="remittanceProofFile"
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleFileChange}
                                            ref={fileInputRef}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="alert alert-warning py-2 px-3 mb-0 small">
                                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                This action cannot be undone. Confirm only when cash has been collected.
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button type="button" className="btn btn-sm btn-light" onClick={onClose} disabled={isProcessing}>
                                <i className="fa-solid fa-times me-1"></i>Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-success d-flex align-items-center gap-2"
                                onClick={handleConfirm}
                                disabled={!imageFile || isProcessing}>
                                {isProcessing
                                    ? <><span className="spinner-border spinner-border-sm" role="status"></span><span>Processing...</span></>
                                    : <>
                                        <i className="fa-solid fa-check"></i>
                                        <span>Confirm Remitted</span>
                                    </>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showFullView && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ 
                        backgroundColor: "rgba(0,0,0,0.85)", 
                        zIndex: 9999,
                    }}
                    onClick={() => setShowFullView(false)}>
                    <i className="bx bx-x fs-1 rounded-circle position-absolute top-0 end-0 m-4 text-white"
                    style={{ cursor: "pointer" }}
                    ></i>
                    <img 
                    className="bg-white"
                    src={imagePreview} alt="Full view"
                    style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} 
                    />
                </div>
            )}
        </>
    );
};
// ──────────────────────────────────────────────────────────────────────────────


const RiderRemittances = () => {
    const { showToast, toastMessage, toastType, showNotification, setShowToast } = useContext(appContext);

    // ── State ───────────────────────────────────────────────────────────────────
    const [remittances, setRemittances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [period, setPeriod] = useState("today");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // ── Select mode (Transactions-style) ────────────────────────────────────────
    const [isSelect, setIsSelect] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // ───────────────────────────────────────────────────────────────────────────

    // Update status modal
    const [updateModal, setUpdateModal] = useState({ show: false, remittance: null });
    const [isProcessing, setIsProcessing] = useState(false);

    // Print ref
    const printRef = useRef();
    const socketRef = useRef(null);
    // ───────────────────────────────────────────────────────────────────────────



    const [showFullView, setShowFullView] = useState(false);
    const [imagePrev, setImagePrev] = useState('');



    
    const handleRemitProof = (imageFile) => {
        setImagePrev(imageFile);
        setShowFullView(true);
    }

    
    // ── Period label ────────────────────────────────────────────────────────────
    const getPeriodLabel = () => {
        switch (period) {
            case "today": return "Today";
            case "all": return "All Time";
            case "thisweek": return "This Week";
            case "thismonth": return "This Month";
            case "thisyear": return "This Year";
            case "custom":
                if (customStartDate && customEndDate) {
                    const today = new Date().toISOString().split("T")[0];
                    if (customStartDate === today && customEndDate === today) return "Today";
                    if (customStartDate === customEndDate) return new Date(customStartDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
                    return `Custom (${new Date(customStartDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} - ${new Date(customEndDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })})`;
                }
                return "Custom Range";
            default: return "";
        }
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Socket ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.on("remittance update", () => { fetchRemittances(); });
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, []);
    // ───────────────────────────────────────────────────────────────────────────


    // ── Fetch ───────────────────────────────────────────────────────────────────
    const fetchRemittances = async () => {
        let queryParams = `period=${period}`;
        if (period === "custom" && customStartDate && customEndDate) {
            queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getRemittances?${queryParams}`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            if (data.success) {
                setRemittances(data.data ? [...data.data] : []);
            }
        } catch (err) {
            setRemittances([]);
            console.log("fetchRemittances error:", err.message);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchRemittances();
            setTimeout(() => setLoading(false), 500);
        };
        load();
    }, [period, customStartDate, customEndDate]);
    // ───────────────────────────────────────────────────────────────────────────


    // ── Custom range handlers ───────────────────────────────────────────────────
    const handleCustomRangeApply = (startDate, endDate) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        setPeriod("custom");
        setIsCustomRange(true);
        setShowCustomRangeModal(false);
    };

    const handleCustomRangeClose = () => {
        setShowCustomRangeModal(false);
        if (!isCustomRange) setPeriod("today");
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Refresh ─────────────────────────────────────────────────────────────────
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchRemittances();
        } finally {
            setIsRefreshing(false);
        }
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Update status (single) ──────────────────────────────────────────────────
    const handleUpdateStatus = async (remittanceId, imageFile) => {
        if (!imageFile) { showNotification("Proof of remittance is required.", "error"); return; }
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append("status", "remitted");
            formData.append("image", imageFile);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateRemittanceStatus/${remittanceId}`, {
                method: "PATCH",
                credentials: "include",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUpdateModal({ show: false, remittance: null });
            showNotification(data.message || "Status updated successfully.", "success");
            await fetchRemittances();
        } catch (err) {
            showNotification(err.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Batch delete ─────────────────────────────────────────────────────────────
    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) { showNotification("No records selected.", "error"); return; }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteRemittances`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [...selectedIds] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSelectedIds(new Set());
            setIsAllSelected(false);
            setIsSelect(false);
            setShowDeleteModal(false);
            showNotification(data.message || `${selectedIds.size} record(s) deleted.`, "success");
            await fetchRemittances();
        } catch (err) {
            showNotification(err.message, "error");
        }
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Filtering ────────────────────────────────────────────────────────────────
    const availableStatuses = useMemo(() => {
        const s = new Set();
        remittances.forEach((r) => { if (r.status) s.add(r.status); });
        return Array.from(s).sort();
    }, [remittances]);

    const filteredRemittances = useMemo(() => {
        return remittances.filter((r) => {
            const statusMatch = statusFilter === "all" || r.status === statusFilter;
            const orderId = r.orderId?.orderId || "";
            const riderName = `${r.riderId?.firstname || ""} ${r.riderId?.lastname || ""}`;
            const searchMatch = searchQuery === "" ||
                orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                riderName.toLowerCase().includes(searchQuery.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [remittances, statusFilter, searchQuery]);
    // ───────────────────────────────────────────────────────────────────────────


    // ── Pagination ───────────────────────────────────────────────────────────────
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRemittances.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRemittances.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, searchQuery, period]);
    // ───────────────────────────────────────────────────────────────────────────


    // ── Select handlers (Transactions-style) ─────────────────────────────────────
    const toggleSelectAll = () => {
        setIsAllSelected((prev) => {
            const newVal = !prev;
            if (newVal) {
                setSelectedIds(new Set(filteredRemittances.map((r) => r._id)));
            } else {
                setSelectedIds(new Set());
            }
            return newVal;
        });
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) updated.delete(id);
            else updated.add(id);
            setIsAllSelected(updated.size === filteredRemittances.length);
            return updated;
        });
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Status badge color ───────────────────────────────────────────────────────
    const getStatusColor = (status) => {
        const colors = { pending: "warning", remitted: "success", failed: "danger", processing: "info" };
        return colors[status] || "secondary";
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Print ────────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        const win = window.open("", "", "width=900,height=650");
        win.document.write(`
            <html><head><title>Rider Remittances Report</title>
            <style>
                body{font-family:Arial,sans-serif;padding:20px}
                table{width:100%;border-collapse:collapse;margin-top:20px}
                th,td{border:1px solid #ddd;padding:12px;text-align:left;font-size:12px}
                th{background-color:#198754;color:#fff;font-weight:700}
                tr:nth-child(even){background-color:#f9f9f9}
                .header{text-align:center;margin-bottom:20px}
                .header h2{margin:0;color:#198754}
                .header p{margin:5px 0;color:#666}
                button{display:none!important}
                input[type=checkbox]{display:none!important}
                @media print{body{margin:0}}
            </style></head>
            <body>
                <div class="header">
                    <h2>Rider Remittances Report</h2>
                    <p>Period: ${getPeriodLabel()}</p>
                    <p>Date: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p>Total Records: ${filteredRemittances.length}</p>
                    ${statusFilter !== "all" ? `<p>Status: ${statusFilter}</p>` : ""}
                </div>
                ${printContent.innerHTML}
                <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
            </body></html>
        `);
        win.document.close();
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Download PDF ─────────────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
            <div style="text-align:center;margin-bottom:20px">
                <h2 style="margin:0;color:#198754">Rider Remittances Report</h2>
                <p style="margin:5px 0;color:#666">Period: ${getPeriodLabel()}</p>
                <p style="margin:5px 0;color:#666">Date: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p style="margin:5px 0;color:#666">Total Records: ${filteredRemittances.length}</p>
                ${statusFilter !== "all" ? `<p style="margin:5px 0;color:#666">Status: ${statusFilter}</p>` : ""}
            </div>
        `;
        wrapper.appendChild(printContent);
        html2pdf().set({
            margin: 10,
            filename: `remittances_${period}_${Date.now()}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        }).from(wrapper).save();
    };
    // ───────────────────────────────────────────────────────────────────────────


    // ── Summary stats ────────────────────────────────────────────────────────────
    const summaryStats = useMemo(() => {
        const totalExpected = filteredRemittances.reduce((acc, r) => acc + (r.expectedAmount || 0), 0);
        const totalRemitted = filteredRemittances.filter((r) => r.status === "remitted").reduce((acc, r) => acc + (r.expectedAmount || 0), 0);
        const pendingCount = filteredRemittances.filter((r) => r.status === "pending").length;
        const remittedCount = filteredRemittances.filter((r) => r.status === "remitted").length;
        return { totalExpected, totalRemitted, pendingCount, remittedCount };
    }, [filteredRemittances]);
    // ───────────────────────────────────────────────────────────────────────────
    





    if (loading) return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="text-center">
                <div className="spinner-border text-success mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="small text-muted mb-0 text-capitalize">Loading track remit...</p>
            </div>
        </div>
    );


    return (
        <>
        <div className="mb-5">

            {/* ── Header & Filters ─────────────────────────────────────────────── */}
            <div className="row g-0 bg-white border rounded p-2 mt-1 gap-2">

                {/* Summary cards */}
                <div className="col-12">
                    <div className="row g-2">
                        <div className="col-6 col-md-3">
                            <div className="border rounded p-2 text-center bg-light">
                                <p className="m-0 small text-muted">Total Expected</p>
                                <p className="m-0 fw-bold text-success">₱{summaryStats.totalExpected.toLocaleString("en-PH")}.00</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="border rounded p-2 text-center bg-light">
                                <p className="m-0 small text-muted">Total Remitted</p>
                                <p className="m-0 fw-bold text-success">₱{summaryStats.totalRemitted.toLocaleString("en-PH")}.00</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="border rounded p-2 text-center bg-light">
                                <p className="m-0 small text-muted">Pending</p>
                                <p className="m-0 fw-bold text-warning">{summaryStats.pendingCount}</p>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="border rounded p-2 text-center bg-light">
                                <p className="m-0 small text-muted">Remitted</p>
                                <p className="m-0 fw-bold text-success">{summaryStats.remittedCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                    <input
                        type="search"
                        placeholder="Search by Order ID or Rider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-control border-2"
                        style={{ outline: "none", fontSize: "14px" }}
                    />
                </div>

                {/* Right controls */}
                <div className="col">
                    <div>
                        <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2 flex-wrap">

                            {/* Period filter */}
                            <div className="d-flex align-items-center gap-2">
                                <i className="fa fa-calendar text-success small"></i>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ minWidth: "145px", maxWidth: "180px", fontSize: "14px" }}
                                    value={period}
                                    onChange={(e) => {
                                        if (e.target.value === "custom") { setShowCustomRangeModal(true); }
                                        else { setPeriod(e.target.value); setIsCustomRange(false); }
                                    }}
                                >
                                    <option value="today">Today</option>
                                    <option value="thisweek">This Week</option>
                                    <option value="thismonth">This Month</option>
                                    <option value="thisyear">This Year</option>
                                    <option value="custom">Custom</option>
                                </select>
                                {period === "custom" && customStartDate && customEndDate && (
                                    <span className="badge bg-success-subtle text-success border border-success border-opacity-25 small text-nowrap">
                                        <i className="fa fa-calendar-check me-1"></i>{getPeriodLabel()}
                                    </span>
                                )}
                            </div>

                            {/* Status filter */}
                            <select
                                className="form-select form-select-sm text-capitalize"
                                style={{ fontSize: "14px", maxWidth: "150px" }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                {availableStatuses.map((s) => (
                                    <option key={s} value={s} className="text-capitalize">{s}</option>
                                ))}
                            </select>

                            {/* Delete — visible only when in select mode and has selection */}
                            {isSelect && selectedIds.size > 0 && (
                                <button
                                    className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm d-flex align-items-center gap-1"
                                    onClick={() => setShowDeleteModal(true)}
                                    style={{ cursor: "pointer" }}>
                                    <i className="bx bx-trash fs-6"></i> delete
                                </button>
                            )}

                            {/* Refresh */}
                            <button
                                disabled={isRefreshing}
                                className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1"
                                onClick={handleRefresh}>
                                <i className={`fa fa-sync small text-dark ${isRefreshing ? "fa-spin opacity-50" : ""}`}></i>
                                <p className="m-0 small text-capitalize">{isRefreshing ? "refreshing..." : "refresh"}</p>
                            </button>

                            {/* Select toggle */}
                            <button
                                className={`btn ${isSelect ? "btn-dark" : "btn-success"} btn-sm text-capitalize rounded-3 shadow-sm d-flex align-items-center gap-1`}
                                onClick={() => { setIsAllSelected(false); setSelectedIds(new Set()); setIsSelect((prev) => !prev); }}
                                style={{ cursor: "pointer" }}>
                                <i className={`bx ${isSelect ? "bx-x fs-6" : "bx-check-circle fs-6"}`}></i>
                                {isSelect ? "cancel" : "select"}
                            </button>
                        </div>
                        <p className="m-0 small opacity-50 text-end mt-2">{`${selectedIds.size} selected from ${filteredRemittances.length} Total`}</p>
                    </div>
                </div>
            </div>
            {/* ──────────────────────────────────────────────────────────────────── */}


            <div className="mt-1 bg-white rounded shadow-sm border position-relative" style={{ overflow: "auto" }}>
                {isRefreshing && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" style={{ zIndex: 10 }}>
                        <div className="text-center">
                            <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                            <p className="small text-muted mb-0">Refreshing remittances...</p>
                        </div>
                    </div>
                )}

                {filteredRemittances.length === 0 ? (
                    <div className="mt-5 pb-5 text-center">
                        <i className="fa-solid fa-money-bill-transfer text-muted opacity-50" style={{ fontSize: "60px" }}></i>
                        <p className="mt-3 text-capitalize text-center opacity-75 fw-semibold">
                            {remittances.length === 0 ? "No remittance records yet" : "No records match the selected filters"}
                        </p>
                        <p className="text-muted small">
                            {remittances.length === 0
                                ? "Remittance records will appear once riders complete their deliveries."
                                : `No records found for ${getPeriodLabel()}. Try adjusting your filters.`}
                        </p>
                        {filteredRemittances.length === 0 && remittances.length > 0 && (
                            <button className="btn btn-sm btn-outline-success mt-2"
                                onClick={() => { setStatusFilter("all"); setSearchQuery(""); setPeriod("today"); setIsCustomRange(false); }}>
                                <i className="fa fa-filter-circle-xmark me-2"></i>Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div ref={printRef}>
                        <table className="w-100">
                            <thead className="position-sticky top-0 z-1">
                                <tr className="bg-white">
                                    {["#", "Order ID", "Rider", "Expected Amount", "Status","Image Proof","Remitted At", "Created At", "Actions"].map((col, i) => (
                                        <th key={i} className={`text-uppercase p-3 text-success small ${i === 7 ? "text-center" : ""}`}>
                                            {col}
                                        </th>
                                    ))}
                                    {isSelect && (
                                        <th className="p-3">
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="d-flex gap-2">
                                                    <p className="m-0 text-success text-capitalize small">all</p>
                                                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                                                </div>
                                            </div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((data, i) => {
                                    const rowNumber = indexOfFirstItem + i + 1;
                                    return (
                                        <tr key={data._id} className={selectedIds.has(data._id) ? "table-success" : ""}>
                                            <td className="p-3 small">{rowNumber}</td>
                                            <td className="p-3 small fw-bold">{data.orderId?.orderId || "N/A"}</td>
                                            <td className="p-3 small text-capitalize">
                                                {data.riderId ? `${data.riderId.firstname} ${data.riderId.lastname}` : <span className="text-muted fst-italic">N/A</span>}
                                                {data.riderId?.email && <p className="m-0 text-lowercase opacity-75 small">{data.riderId.email}</p>}
                                            </td>
                                            <td className="p-3 small fw-semibold text-success">₱{(data.expectedAmount || 0).toLocaleString("en-PH")}.00</td>
                                            <td className="p-3 small text-capitalize">
                                                <span className={`badge bg-${getStatusColor(data.status)}`}>{data.status || "N/A"}</span>
                                            </td>
                                            <td>
                                                {data.imageFile ? (
                                                    <div 
                                                        className="w-100 border rounded shadow-sm p-2 position-relative" 
                                                        style={{ maxWidth: "120px", cursor: "pointer" }} 
                                                        onClick={()=> handleRemitProof(data.imageFile)}>
                                                            <div 
                                                            className="d-flex align-items-center gap-2">
                                                                <div 
                                                                className="border shadow-sm rounded" 
                                                                style={{ width: "40px", height: "40px", overflow: "hidden", flexShrink: 0 }}>
                                                                    <img src={data.imageFile} alt={data.imageFile} 
                                                                    className="h-100 w-100" 
                                                                    style={{ objectFit: "cover" }} />
                                                                </div>
                                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                                    <p className="m-0 fw-bold text-truncate" 
                                                                    style={{ fontSize: "0.75rem" }}>
                                                                        {data?.imageFile?.split('/').pop()}
                                                                    </p>
                                                                    <p className="m-0 text-muted" 
                                                                    style={{ fontSize: "0.65rem" }}>Image</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                ) : (
                                                    <p className="m-0 small text-muted text-capitalize"
                                                    >
                                                        no image proof yet.
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-3 small">
                                                {data.remittedAt ? (
                                                    <>
                                                        <p className="m-0">{new Date(data.remittedAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                                                        <p className="m-0 text-muted">{new Date(data.remittedAt).toLocaleTimeString()}</p>
                                                    </>
                                                ) : (
                                                    <span className="text-muted fst-italic small">Not yet</span>
                                                )}
                                            </td>
                                            <td className="p-3 small">
                                                <p className="m-0">{new Date(data.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</p>
                                                <p className="m-0 text-muted">{new Date(data.createdAt).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="p-3 small text-center">
                                                <button
                                                    className="btn btn-sm btn-success d-flex align-items-center gap-1 mx-auto"
                                                    onClick={() => setUpdateModal({ show: true, remittance: data })}
                                                    disabled={data.status === "remitted"}>
                                                    <i className="fa fa-check small"></i> Remitted
                                                </button>
                                            </td>
                                            {isSelect && (
                                                <td className="p-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(data._id)}
                                                            onChange={() => toggleSelect(data._id)}
                                                            style={{ cursor: "pointer" }}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {filteredRemittances.length > 0 && (
                <div className="row g-0 border-top bg-white">
                    <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRemittances.length)} of {filteredRemittances.length} records
                        </div>
                    </div>
                    <div className="col-12 col-lg-8 p-3">
                        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                            <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handleDownloadPDF}>
                                <i className="fa fa-file-pdf small text-danger"></i>
                                <p className="m-0 small text-capitalize d-none d-sm-block">PDF</p>
                            </button>
                            <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handlePrint}>
                                <i className="fa fa-print small text-dark"></i>
                                <p className="m-0 small text-capitalize d-none d-sm-block">print</p>
                            </button>
                            <div className="d-none d-md-block border-start" style={{ height: "30px" }}></div>
                            <button className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                                <i className="fa fa-chevron-left"></i>
                                <span className="ms-2 small d-none d-lg-block">Previous</span>
                            </button>
                            <div className="d-flex gap-1 flex-wrap justify-content-center">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                        return (
                                            <button key={pageNumber}
                                                className={`btn btn-sm ${currentPage === pageNumber ? "btn-success" : "btn-outline-success"}`}
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
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                                <span className="me-2 small d-none d-lg-block">Next</span>
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>


        {/* ── Batch Delete Confirm Modal ──────────────────────────────────────── */}
        {showDeleteModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                <div className="bg-white rounded p-4 shadow" style={{ maxWidth: "400px" }}>
                    <h5 className="mb-3"><i className="fa fa-trash text-danger me-2"></i>Delete Remittance{selectedIds.size > 1 ? "s" : ""}</h5>
                    <p className="text-muted small">
                        Are you sure you want to delete <strong>{selectedIds.size}</strong> record{selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
                    </p>
                    <div className="d-flex gap-2 justify-content-end mt-3">
                        <button className="btn btn-sm btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        <button className="btn btn-sm btn-danger" onClick={handleBatchDelete}>
                            <i className="fa fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ── Update Status Modal ─────────────────────────────────────────────── */}
        <UpdateStatusModal
            show={updateModal.show}
            remittance={updateModal.remittance}
            onClose={() => { if (!isProcessing) setUpdateModal({ show: false, remittance: null }); }}
            onConfirm={handleUpdateStatus}
            isProcessing={isProcessing}
        />

        {/* ── Custom Range Modal ──────────────────────────────────────────────── */}
        <CustomRangeModal
            show={showCustomRangeModal}
            onClose={handleCustomRangeClose}
            onApply={handleCustomRangeApply}
            initialStartDate={customStartDate}
            initialEndDate={customEndDate}
            showNotification={showNotification}
        />

        <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
        
        {showFullView && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ 
                    backgroundColor: "rgba(0,0,0,0.85)", 
                    zIndex: 9999,
                }}
                onClick={() => setShowFullView(false)}>
                <i className="bx bx-x fs-1 rounded-circle position-absolute top-0 end-0 m-4 text-white"
                style={{ cursor: "pointer" }}
                ></i>
                <img 
                className="bg-white"
                src={imagePrev} alt="Full view"
                style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} 
                />
            </div>
        )}
        
        </>
    );
};

export default RiderRemittances;