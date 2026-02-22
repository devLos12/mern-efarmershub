import React, { useContext, useRef, useState } from "react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBreakpointHeight } from "./breakpoint";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import html2pdf from 'html2pdf.js';
import DamageLog from "./admin/damageLog";
import imageCompression from 'browser-image-compression';
import Toast from "./toastNotif";


// ─── Custom Range Modal ────────────────────────────────────────────────────────
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

    const getDurationText = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const todayStr = new Date().toISOString().split('T')[0];

        if (startDate === endDate && startDate === todayStr) return "Today";
        if (startDate === endDate) return "1 day";

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

        if (monthsDiff >= 1 && start.getDate() === end.getDate())
            return monthsDiff === 1 ? "1 month" : `${monthsDiff} months`;
        if (diffDays >= 28 && diffDays <= 32 && monthsDiff === 1) return "~1 month";
        if (diffDays % 7 === 0 && diffDays <= 28) {
            const weeks = diffDays / 7;
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
        }
        if (diffDays <= 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
        if (diffDays < 28) return `${diffDays} days`;
        const months = Math.floor(diffDays / 30);
        if (months >= 1) return `~${months} ${months === 1 ? 'month' : 'months'} (${diffDays} days)`;
        return `${diffDays} days`;
    };

    const validateStartDate = (dateValue = tempStartDate) => {
        if (!dateValue) { setStartDateError(''); return true; }
        if (new Date(dateValue) > new Date(today)) {
            setStartDateError('Start date cannot be in the future');
            return false;
        }
        setStartDateError('');
        return true;
    };

    const validateEndDate = (endValue = tempEndDate, startValue = tempStartDate) => {
        if (!endValue) { setEndDateError(''); return true; }
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
        if (tempStartDate > today || tempEndDate > today) {
            showNotification("Dates cannot be in the future", "error");
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

    const handleCancel = () => {
        setStartDateError('');
        setEndDateError('');
        onClose();
    };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={handleCancel} />
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fa-solid fa-calendar-days text-success me-2"></i>
                                Custom Date Range
                            </h5>
                            <button type="button" className="btn-close" onClick={handleCancel} />
                        </div>

                        <div className="modal-body pt-2">
                            <p className="text-muted small mb-3">Select a custom date range for transactions</p>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                    <i className="fa-regular fa-calendar me-1"></i> Start Date
                                </label>
                                <input
                                    type="date"
                                    className={`form-control ${startDateError ? 'is-invalid' : ''}`}
                                    value={tempStartDate}
                                    onChange={(e) => setTempStartDate(e.target.value)}
                                    onBlur={() => { validateStartDate(tempStartDate); if (tempEndDate) validateEndDate(tempEndDate, tempStartDate); }}
                                    max={today}
                                />
                                {startDateError && <div className="invalid-feedback d-block">{startDateError}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-semibold">
                                    <i className="fa-regular fa-calendar me-1"></i> End Date
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
                                {endDateError && <div className="invalid-feedback d-block">{endDateError}</div>}
                            </div>

                            {(startDateError || endDateError) && (
                                <div className="alert alert-danger py-2 px-3 mb-3">
                                    <i className="fa-solid fa-exclamation-triangle me-2"></i>
                                    <small><strong>Invalid dates selected.</strong> Please correct the errors above.</small>
                                </div>
                            )}

                            {tempStartDate && tempEndDate && !startDateError && !endDateError && (() => {
                                const isToday = tempStartDate === today && tempEndDate === today;
                                return (
                                    <div className="alert alert-success py-2 px-3 mb-0">
                                        <i className="fa-solid fa-check-circle me-2"></i>
                                        <small>
                                            <strong>Selected Range:</strong>{' '}
                                            {isToday ? (
                                                <strong className="text-success">Today</strong>
                                            ) : (
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
                            <button type="button" className="btn btn-sm btn-light" onClick={handleCancel}>
                                <i className="fa-solid fa-times me-1"></i> Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={handleApply}
                                disabled={!tempStartDate || !tempEndDate || !!startDateError || !!endDateError}
                            >
                                <i className="fa-solid fa-check me-1"></i> Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// ──────────────────────────────────────────────────────────────────────────────


const Transactions = () => {
    const { role, showNotification, showToast, toastMessage, toastType, setShowToast } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);

    const location = useLocation();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const height = useBreakpointHeight();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [imageFile, setImageFile] = useState({});
    const [imagePrev, setImagePrev] = useState({});
    const [source, setSource] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Payout Modal states
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // ── Date Filter States ──────────────────────────────────────────────────────
    const [period, setPeriod] = useState('thisweek');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
    // ───────────────────────────────────────────────────────────────────────────

    const fileUploadRef = useRef({});
    const printRef = useRef();
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);


    // ── Period Label ────────────────────────────────────────────────────────────
    const getPeriodLabel = () => {
        switch (period) {
            case "thisweek": return "This Week";
            case "thismonth": return "This Month";
            case "thisyear": return "This Year";
            case "custom":
                if (customStartDate && customEndDate) {
                    const today = new Date().toISOString().split('T')[0];
                    if (customStartDate === today && customEndDate === today) return "Today";
                    if (customStartDate === customEndDate) {
                        return new Date(customStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                    }
                    return `Custom (${new Date(customStartDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                }
                return "Custom Range";
            default: return "";
        }
    };

    // ── Custom Range Handlers ───────────────────────────────────────────────────
    const handleCustomRangeApply = (startDate, endDate) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        setPeriod('custom');
        setIsCustomRange(true);
        setShowCustomRangeModal(false);
        setRefresh(prev => !prev);
    };

    const handleCustomRangeClose = () => {
        setShowCustomRangeModal(false);
        if (!isCustomRange) setPeriod('thisweek');
    };
    // ───────────────────────────────────────────────────────────────────────────


    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);

        const elementsToRemove = printContent.querySelectorAll('img, input[type="file"], label[for*="inputFile"]');
        elementsToRemove.forEach(el => {
            const td = el.closest('td');
            if (td) td.innerHTML = '<span class="text-muted small">-</span>';
        });

        const imageContainers = printContent.querySelectorAll('.border.rounded.shadow-sm');
        imageContainers.forEach(container => {
            const td = container.closest('td');
            if (td) td.innerHTML = '<span class="text-muted small">-</span>';
        });

        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Transactions</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
                        th { background-color: #198754; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h2 { margin: 0; color: #198754; }
                        .header p { margin: 5px 0; color: #666; }
                        button { display: none !important; }
                        img { display: none !important; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Transaction Report</h2>
                        <p>Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p>Period: ${getPeriodLabel()}</p>
                        <p>Type: ${source === 'payout/seller' ? 'Farmer Payout' : source === 'payout/rider' ? 'Rider Payout' : source === 'payout' ? 'Payout' : 'Payment'}</p>
                        <p>Total Records: ${filteredTransactions.length}</p>
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

        const elementsToRemove = printContent.querySelectorAll('img, input[type="file"], label[for*="inputFile"]');
        elementsToRemove.forEach(el => {
            const td = el.closest('td');
            if (td) td.innerHTML = '<span class="text-muted small">-</span>';
        });
        const imageContainers = printContent.querySelectorAll('.border.rounded.shadow-sm');
        imageContainers.forEach(container => {
            const td = container.closest('td');
            if (td) td.innerHTML = '<span class="text-muted small">-</span>';
        });

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Transaction Report</h2>
                <p style="margin: 5px 0; color: #666;">Period: ${getPeriodLabel()}</p>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0; color: #666;">Type: ${source === 'payout/seller' ? 'Farmer Payout' : source === 'payout/rider' ? 'Rider Payout' : source === 'payout' ? 'Payout' : 'Payment'}</p>
                <p style="margin: 5px 0; color: #666;">Total Records: ${filteredTransactions.length}</p>
            </div>
        `;
        wrapper.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `transactions_${period}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(wrapper).save();
    };

    const toggleSelectAll = () => {
        setIsAllSelected((prev) => {
            const newValue = !prev;
            if (newValue) {
                const allIds = new Set(filteredTransactions.map((t) => t._id));
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
            setIsAllSelected(updated.size === filteredTransactions.length);
            return updated;
        });
    };

    const filteredTransactions = useMemo(() => {
        if (!debouncedSearch) return transactions;
        return transactions.filter((t) => {
            const name = (t.sellerName || t.riderName || "").toLowerCase();
            const email = (t.sellerEmail || t.riderEmail || "").toLowerCase();
            return name.includes(debouncedSearch) || email.includes(debouncedSearch);
        });
    }, [transactions, debouncedSearch]);

    useEffect(() => {
        const result = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(result);
    }, [search]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    const riderTab = location.state?.riderTab || 'delivered';

    useEffect(() => {
        setCurrentPage(1);
    }, [search, source, period]);

    const handleRemoveFile = (id) => {
        setImageFile(prev => { const n = { ...prev }; delete n[id]; return n; });
        if (fileUploadRef.current[id]) fileUploadRef.current[id].value = null;
    };

    const handleFile = async (e, id) => {
        const { name } = e.target;
        const file = e.target.files[0];
        if (!file) return;
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setImageFile((prev) => ({ ...prev, [id]: { [name]: compressedFile, preview: compressedFile?.name } }));
            if (compressedFile) {
                const reader = new FileReader();
                reader.onload = (e) => setImagePrev((prev) => ({ ...prev, [id]: e.target.result }));
                reader.readAsDataURL(compressedFile);
            }
        } catch (error) {
            console.error("Error compressing image:", error);
            alert('Failed to compress image');
        }
    };

    const openImageModal = (imageSrc, title) => {
        setModalImage(imageSrc);
        setModalTitle(title);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalImage('');
        setModalTitle('');
    };

    const openPayoutModal = (transaction) => {
        setSelectedTransaction(transaction);
        setShowPayoutModal(true);
    };

    const closePayoutModal = () => {
        setShowPayoutModal(false);
        setSelectedTransaction(null);
    };

    const handlePayout = async (id) => {
        if (!imageFile[id]?.preview) {
            showNotification("Receipt file is required", "error");
            return;
        }
        if (isProcessingPayout) return;
        setIsProcessingPayout(true);
        setTransactions((items) => items.map((item) => item._id === id ? ({ ...item, status: "paid" }) : item));

        const formData = new FormData();
        formData.append("id", id);
        formData.append("image", imageFile[id]?.image);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updatePayout`, {
                method: "PATCH",
                body: formData,
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setImageFile(prev => { const n = { ...prev }; delete n[id]; return n; });
            if (fileUploadRef.current[id]) fileUploadRef.current[id].value = null;
            closePayoutModal();
            setRefresh(prev => !prev);
            showNotification(data.message || "Payout completed successfully!", "success");
        } catch (error) {
            showNotification(error.message || "Failed to process payout", "error");
        } finally {
            setIsProcessingPayout(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            setRefresh((prev) => !prev);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) {
            showNotification("No transactions selected yet", "error");
            return;
        }
        const sendData = [...selectedIds];
        let endPoint = '';
        if (role === "admin") {
            endPoint = source === "payout/seller" || source === "payout/rider" ? "deletePayout" : "deletePayment";
        } else {
            endPoint = source === "payout" ? "sellerDeletePayout" : "sellerDeletePayment";
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: source === "payout/seller" || source === "payout/rider" || source === "payout" ? "PATCH" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: sendData }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTransactions((prev) => prev.filter((item) => !selectedIds.has(item._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);
            showNotification(data.message || `Successfully deleted ${sendData.length} transaction(s)`, "success");
        } catch (error) {
            showNotification(error.message || "Failed to delete transactions", "error");
        }
    };

    // ── Fetch Transactions (with period + custom date query params) ──────────────
    useEffect(() => {
        const fetchTransactions = async () => {
            const endPoint = role === "admin" ? "getTransactions" : "getSellerTransactions";

            // Build query string with period filter
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

                let transactions = [];

                if (location?.state?.source === `payout${role === "admin" ? "/seller" : ""}`) {
                    transactions = data.payout?.reverse() || [];
                    setSource(`payout${role === "admin" ? "/seller" : ""}`);
                }
                if (location?.state?.source === `payout/rider`) {
                    transactions = data.riderPayout?.reverse() || [];
                    setSource(`payout${role === "admin" ? "/rider" : ""}`);
                }
                if (location?.state?.source === "payment") {
                    transactions = data.payment?.reverse() || [];
                    setSource("payment");
                }

                setTransactions(transactions);
            } catch (err) {
                console.log("Error:", err.message);
            }
        };
        fetchTransactions();
    }, [location?.state?.source, refresh, period, customStartDate, customEndDate]);
    // ───────────────────────────────────────────────────────────────────────────

    const Height = () => {
        if (height < 574) return height;
        return height - 152;
    };

    const taxPercentage = selectedTransaction?.totalAmount > 0
        ? ((selectedTransaction?.taxAmount / selectedTransaction?.totalAmount) * 100).toFixed(0)
        : 0;

    return (
        <>
            {/* Payout Modal */}
            {showPayoutModal && selectedTransaction && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10001 }}
                    onClick={closePayoutModal}
                >
                    <div
                        className="bg-white rounded shadow-lg"
                        style={{ maxWidth: "600px", width: "90%", maxHeight: "90vh", overflow: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-bottom p-3 d-flex justify-content-between align-items-center sticky-top bg-white">
                            <h5 className="m-0 fw-bold text-success">
                                {role === "admin"
                                    ? (selectedTransaction.status === 'paid' ? 'Payout Details' : 'Process Payout')
                                    : 'Payout Details'
                                }
                            </h5>
                            <button className="btn-close" onClick={closePayoutModal}></button>
                        </div>

                        <div className="p-4">
                            <div className="mb-4">
                                <h6 className="fw-bold text-muted mb-3">Transaction Information</h6>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <p className="m-0 small text-muted">{selectedTransaction?.orders ? 'Total Orders' : 'Total Delivery'}</p>
                                        <p className="m-0 fw-bold small">
                                            {selectedTransaction?.orders
                                                ? (selectedTransaction.orders.length === 1 ? `${selectedTransaction.orders.length} Order` : `${selectedTransaction.orders.length} Orders`)
                                                : (selectedTransaction?.totalDelivery === 1 ? `${selectedTransaction.totalDelivery} Delivery` : `${selectedTransaction.totalDelivery} Deliveries`)}
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <p className="m-0 small text-muted">Date Payout</p>
                                        <p className="m-0">{new Date(selectedTransaction.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <div className="col-6 mt-3">
                                        <p className="m-0 small text-muted">Name</p>
                                        <p className="m-0 fw-bold text-capitalize">{selectedTransaction.sellerName || selectedTransaction.riderName}</p>
                                    </div>
                                    <div className="col-6 mt-3">
                                        <p className="m-0 small text-muted">Email</p>
                                        <p className="m-0 small">{selectedTransaction.sellerEmail || selectedTransaction.riderEmail}</p>
                                    </div>
                                    <div className="col-6 mt-3">
                                        <p className="m-0 small text-muted">E-Wallet</p>
                                        <p className="m-0 fw-bold">{selectedTransaction.e_WalletAcc?.number}</p>
                                        <p className="m-0 small text-capitalize text-muted">{selectedTransaction.e_WalletAcc?.type}</p>
                                    </div>
                                    <div className="col-6 mt-3">
                                        <p className="m-0 small text-muted">Status</p>
                                        <span className={`badge text-capitalize ${selectedTransaction.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                                            {selectedTransaction.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 bg-light rounded p-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Total Amount:</span>
                                    <span className="fw-bold">₱{selectedTransaction.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tax Amount:</span>
                                    <div className="text-end">
                                        <span className="text-danger d-block">- ₱{(selectedTransaction?.taxAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        <span className="small text-muted">({taxPercentage}%)</span>
                                    </div>
                                </div>
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold">Net Amount:</span>
                                    <span className="fw-bold text-success fs-5">₱{selectedTransaction.netAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <hr />

                            <div className="mb-4">
                                <h6 className="fw-bold text-muted mb-3">Payment Receipt</h6>
                                {selectedTransaction.imageFile ? (
                                    <div className="border rounded p-3 d-flex align-items-center gap-3" style={{ cursor: "pointer" }} onClick={() => openImageModal(selectedTransaction.imageFile, selectedTransaction.imageFile)}>
                                        <div className="border rounded bg-light d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", minWidth: "50px", overflow: "hidden" }}>
                                            <img src={selectedTransaction.imageFile} alt="Receipt" className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="m-0 fw-bold small">{selectedTransaction.imageFile}</p>
                                            <p className="m-0 small text-muted"><i className="fa fa-search-plus me-1"></i>Click to view full size</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {role === "admin" ? (
                                            <div>
                                                {imageFile[selectedTransaction._id]?.preview ? (
                                                    <div className="border rounded p-3 d-flex align-items-center gap-3">
                                                        <div className="border rounded bg-light d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", minWidth: "50px", overflow: "hidden", cursor: "pointer" }} onClick={() => openImageModal(imagePrev[selectedTransaction._id], imageFile[selectedTransaction._id]?.preview)}>
                                                            <img src={imagePrev[selectedTransaction._id]} alt="Preview" className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <p className="m-0 fw-bold small"><i className="fa fa-file-image me-2 text-success"></i>{imageFile[selectedTransaction._id]?.preview}</p>
                                                            <p className="m-0 small text-muted">Ready to upload</p>
                                                        </div>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveFile(selectedTransaction._id)}><i className="fa fa-trash"></i></button>
                                                    </div>
                                                ) : (
                                                    <div className="border border-dashed rounded p-4 text-center">
                                                        <i className="fa fa-cloud-upload-alt fs-1 text-muted mb-3"></i>
                                                        <p className="m-0 mb-3 text-muted text-capitalize small">Upload payment receipt</p>
                                                        <label htmlFor={`modalInputFile-${selectedTransaction._id}`} className="btn btn-outline-success btn-sm" style={{ cursor: "pointer" }}>
                                                            <i className="fa fa-paperclip me-2"></i>Choose File
                                                        </label>
                                                        <input id={`modalInputFile-${selectedTransaction._id}`} name="image" type="file" accept="image/*" hidden onChange={(e) => handleFile(e, selectedTransaction._id)} ref={(el) => (fileUploadRef.current[selectedTransaction._id] = el)} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 bg-light rounded">
                                                <i className="fa fa-receipt fs-1 text-muted mb-3"></i>
                                                <p className="m-0 text-muted fw-bold">No payment receipt yet</p>
                                                <p className="m-0 small text-muted mt-2">Receipt will be uploaded once admin processes the payout</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {role === "admin" && selectedTransaction.status === 'pending' ? (
                                <div className="d-flex gap-2 justify-content-end">
                                    <button className="btn btn-secondary btn-sm" onClick={closePayoutModal} disabled={isProcessingPayout}>Cancel</button>
                                    <button className="btn btn-success btn-sm d-flex align-items-center gap-2" onClick={() => handlePayout(selectedTransaction._id)} disabled={!imageFile[selectedTransaction._id]?.preview || isProcessingPayout}>
                                        {isProcessingPayout ? (<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Processing...</span></>) : (<><i className="fa fa-check"></i><span>Process Payout</span></>)}
                                    </button>
                                </div>
                            ) : (
                                <div className="d-flex justify-content-end">
                                    <button className="btn btn-secondary btn-sm" onClick={closePayoutModal} disabled={isProcessingPayout}>Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2220000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeModal}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{modalTitle}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body text-center p-0">
                                <img src={modalImage} alt={modalTitle} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />

            <div className="p-2 mb-5">
                <div className="row g-0 bg-white border rounded p-2 px-2 px-lg-4 mt-1 gap-2">
                    {(source === "payout/seller" || source === "payout/rider") && role === "admin" && (
                        <>
                            <div className="col-12">
                                <div className="d-flex align-items-center gap-2">
                                    <div className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${location.state?.source === "payout/seller" ? "bg-success text-white shadow-sm" : "bg-white text-success border border-success border-opacity-25"}`} style={{ cursor: "pointer", transition: "all 0.2s ease" }} onClick={() => navigate('/admin/payout/seller', { state: { source: 'payout/seller' } })}>
                                        <i className="fa fa-store me-2 small"></i>
                                        <p className="m-0 small fw-bold">Farmer</p>
                                    </div>
                                    <div className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${location.state?.source === "payout/rider" ? "bg-success text-white shadow-sm" : "bg-white text-success border border-success border-opacity-25"}`} style={{ cursor: "pointer", transition: "all 0.2s ease" }} onClick={() => navigate('/admin/payout/rider', { state: { source: 'payout/rider' } })}>
                                        <i className="fa fa-bicycle me-2 small"></i>
                                        <p className="m-0 small fw-bold">rider</p>
                                    </div>
                                </div>
                            </div>

                            {source === "payout/rider" && (
                                <div className="d-flex align-items-center gap-4 mt-3 border-bottom">
                                    <div className={`pb-2 ${riderTab === "delivered" ? "border-bottom border-success border-3 text-success" : "text-muted"}`} style={{ cursor: "pointer", transition: "all 0.2s ease" }} onClick={() => navigate('/admin/payout/rider', { state: { source: 'payout/rider', riderTab: 'delivered' } })}>
                                        <p className="m-0 small">Delivered</p>
                                    </div>
                                    <div className={`pb-2 ${riderTab === "damage-log" ? "border-bottom border-success border-3 text-success" : "text-muted"}`} style={{ cursor: "pointer", transition: "all 0.2s ease" }} onClick={() => navigate('/admin/payout/rider', { state: { source: 'payout/rider', riderTab: 'damage-log' } })}>
                                        <p className="m-0 small">Damage Log</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!(source === "payout/rider" && riderTab === "damage-log") && (
                        <>
                            {/* ── Date Filter Row ─────────────────────────────────────────────── */}
                            <div className="col-12">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <i className="fa fa-calendar text-success small"></i>
                                    <span className="small fw-semibold text-nowrap">Period:</span>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ minWidth: "145px", maxWidth: "180px" }}
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
                                        <option value="thisweek">This Week</option>
                                        <option value="thismonth">This Month</option>
                                        <option value="thisyear">This Year</option>
                                        <option value="custom">Custom </option>
                                    </select>

                                    {period === 'custom' && customStartDate && customEndDate && (
                                        <span className="badge bg-success-subtle text-success border border-success border-opacity-25 small">
                                            <i className="fa fa-calendar-check me-1"></i>
                                            {getPeriodLabel()}
                                        </span>
                                    )}

                                    {period !== 'custom' && (
                                        <span className="text-muted small">
                                            <i className="fa fa-chart-line me-1"></i>
                                            {getPeriodLabel()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* ────────────────────────────────────────────────────────────────── */}

                            <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                                <input
                                    type="search"
                                    placeholder="Search Name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="form-control border-2"
                                    style={{ outline: "none", fontSize: "14px" }}
                                />
                            </div>
                            <div className="col">
                                <div>
                                    <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                                        {selectedIds.size > 0 && (
                                            <button className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm d-flex align-items-center gap-1" onClick={handleDelete} style={{ cursor: "pointer" }}>
                                                <i className="bx bx-trash fs-6"></i> delete
                                            </button>
                                        )}
                                        <button className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1" onClick={handleRefresh}>
                                            <i className={`fa fa-sync small text-dark ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                            <p className="m-0 small text-capitalize">refresh</p>
                                        </button>
                                        <button className={`btn ${isSelect ? "btn-dark" : "btn-success"} btn-sm text-capitalize rounded-3 shadow-sm d-flex align-items-center gap-1`} onClick={() => { setIsAllSelected(false); setSelectedIds(new Set()); setIsSelect((prev) => !prev); }} style={{ cursor: "pointer" }}>
                                            <i className={`bx ${isSelect ? "bx-x fs-6" : "bx-check-circle fs-6"}`}></i>
                                            {`${isSelect ? "cancel" : "select"}`}
                                        </button>
                                    </div>
                                    <p className="m-0 small opacity-50 text-end mt-2">{`${selectedIds.size} selected from ${filteredTransactions.length} Total`}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {source === "payout/rider" && riderTab === "damage-log" ? (
                    <DamageLog />
                ) : (
                    <>
                        <div className="mt-1 bg-white rounded shadow-sm border position-relative" style={{ overflow: "auto" }}>
                            {isRefreshing && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" style={{ zIndex: 10 }}>
                                    <div className="text-center">
                                        <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                                        <p className="small text-muted mb-0">Refreshing transactions...</p>
                                    </div>
                                </div>
                            )}

                            {filteredTransactions?.length === 0 ? (
                                <div className="mt-5" style={{ height: height - 240 }}>
                                    <p className="m-0 text-capitalize text-center small opacity-75">no transaction found for {getPeriodLabel()}</p>
                                </div>
                            ) : (
                                <div ref={printRef}>
                                    <table className="w-100">
                                        <thead className="position-sticky top-0 z-1">
                                            <tr className="bg-white">
                                                {role === "admin" && source === "payout/seller"
                                                    && ["#", "sellers name", "total orders", "gross amount", "tax amount", "e-wallet", "status", "date payout", "actions"]
                                                        .map((data, i) => (
                                                            <th key={i} className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 7 && "text-center"} ${i === 0 && "text-center"} small`}>
                                                                {data}
                                                                {i === 4 && <span className="small ms-2">(5%)</span>}
                                                            </th>
                                                        ))}

                                                {role === "admin" && source === "payout/rider"
                                                    && ["#", "rider name", "total delivery", "gross amount", "tax amount", "e-wallet", "status", "date payout", "actions"]
                                                        .map((data, i) => (
                                                            <th key={i} className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 7 && "text-center"} ${i === 0 && "text-center"} small`}>
                                                                {data}
                                                                {i === 4 && <span className="small ms-2">(5%)</span>}
                                                            </th>
                                                        ))}

                                                {role === "seller" && source === "payout"
                                                    && ["#", "sellers name", "total orders", "gross amount", "tax amount", "e-wallet", "status", "date payout", "actions"]
                                                        .map((data, i) => (
                                                            <th key={i} className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 0 && "text-center"} small`}>{data}</th>
                                                        ))}

                                                {source === "payment" && role === "admin"
                                                    && ["reference id", "account name", "total amount", "payment method", "status", "date paid", 'payment receipt', "type of transaction"]
                                                        .map((data, i) => (
                                                            <th key={i} className={`text-capitalize p-3 text-success small`}>{data}</th>
                                                        ))}

                                                {source === "payment" && role === "seller"
                                                    && ["reference id", "account name", "total amount", "payment method", "status", "date paid", "type of transaction"]
                                                        .map((data, i) => (
                                                            <th key={i} className={`text-capitalize p-3 text-success small`}>{data}</th>
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
                                            {currentItems?.map((data, i) => (
                                                <tr key={i}>
                                                    {role === "admin" && source === "payout/seller" &&
                                                        [
                                                            { data: indexOfFirstItem + i + 1 },
                                                            { data: { name: data.sellerName, email: data.sellerEmail } },
                                                            { data: data.orders.length },
                                                            { data: `₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                            { data: `₱${data.taxAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` ?? 0 },
                                                            { data: { type: data?.e_WalletAcc?.type, number: data?.e_WalletAcc?.number } },
                                                            { data: data.status },
                                                            { data: new Date(data.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                                                            { data: { transaction: data } }
                                                        ].map((info, i) => (
                                                            <td key={i} className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}>
                                                                {i === 1 ? (<>{info.data.name}<p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p></>)
                                                                    : i === 5 ? (<>{info.data.number}<p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p></>)
                                                                        : i === 8 ? (
                                                                            <div className="d-flex align-items-center justify-content-center">
                                                                                <button className={`btn btn-sm d-flex align-items-center justify-content-center ${info.data.transaction.status === 'paid' ? 'btn-outline-success' : 'btn-success'}`} onClick={() => openPayoutModal(info.data.transaction)} style={{ width: "120px" }}>
                                                                                    <i className={`fa ${info.data.transaction.status === 'paid' ? 'fa-eye' : 'fa-edit'} me-1`}></i>
                                                                                    {info.data.transaction.status === 'paid' ? 'View Details' : 'Process'}
                                                                                </button>
                                                                            </div>
                                                                        ) : info.data}
                                                            </td>
                                                        ))}

                                                    {role === "admin" && source === "payout/rider" &&
                                                        [
                                                            { data: indexOfFirstItem + i + 1 },
                                                            { data: { name: data.riderName, email: data.riderEmail } },
                                                            { data: data.totalDelivery },
                                                            { data: `₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                            { data: `₱${data.taxAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` ?? 0 },
                                                            { data: { type: data?.e_WalletAcc?.type, number: data?.e_WalletAcc?.number } },
                                                            { data: data.status },
                                                            { data: new Date(data.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                                                            { data: { transaction: data } }
                                                        ].map((info, i) => (
                                                            <td key={i} className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}>
                                                                {i === 1 ? (<>{info.data.name}<p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p></>)
                                                                    : i === 5 ? (<>{info.data.number}<p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p></>)
                                                                        : i === 8 ? (
                                                                            <div className="d-flex align-items-center justify-content-center">
                                                                                <button className={`btn btn-sm ${info.data.transaction.status === 'paid' ? 'btn-outline-success' : 'btn-success'}`} onClick={() => openPayoutModal(info.data.transaction)}>
                                                                                    <i className={`fa ${info.data.transaction.status === 'paid' ? 'fa-eye' : 'fa-edit'} me-1`}></i>
                                                                                    {info.data.transaction.status === 'paid' ? 'View Details' : 'Process'}
                                                                                </button>
                                                                            </div>
                                                                        ) : info.data}
                                                            </td>
                                                        ))}

                                                    {role === "seller" && source === "payout" &&
                                                        [
                                                            { data: indexOfFirstItem + i + 1 },
                                                            { data: { name: data.sellerName, email: data.sellerEmail } },
                                                            { data: data.orders.length },
                                                            { data: `₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                            { data: `₱${data.taxAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` ?? 0 },
                                                            { data: { type: data?.e_WalletAcc?.type, number: data?.e_WalletAcc?.number } },
                                                            { data: data.status },
                                                            { data: new Date(data.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                                                            { data: { transaction: data } }
                                                        ].map((info, i) => (
                                                            <td key={i} className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}>
                                                                {i === 1 ? (<>{info.data.name}<p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p></>)
                                                                    : i === 5 ? (<>{info.data.number}<p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p></>)
                                                                        : i === 8 ? (
                                                                            <div className="d-flex align-items-center justify-content-center">
                                                                                <button className="btn btn-sm btn-outline-success" onClick={() => openPayoutModal(info.data.transaction)}>
                                                                                    <i className="fa fa-eye me-1"></i> View Details
                                                                                </button>
                                                                            </div>
                                                                        ) : info.data}
                                                            </td>
                                                        ))}

                                                    {source === "payment" && role === "admin" && (
                                                        [
                                                            { data: data.refNo },
                                                            { data: { name: data.accountName, email: data.accountEmail } },
                                                            { data: `₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                            { data: data.paymentMethod },
                                                            { data: data.status },
                                                            { data: { date: data.paidAt.date, time: data.paidAt.time } },
                                                            { data: data.imageFile },
                                                            { data: data.type },
                                                        ].map((info, i) => (
                                                            <td key={i} className={`text-capitalize p-3 small`}>
                                                                {i === 1 ? (<>{info.data.name}<p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p></>)
                                                                    : i === 5 ? (<><p className="m-0 small">{new Date(info.data.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p><p className="m-0 small">{info.data.time}</p></>)
                                                                        : i === 6 ? (
                                                                            !info?.data ? <p className="m-0 text-muted small">no image</p> : (
                                                                                <div className="w-100 border rounded shadow-sm p-2 position-relative" style={{ maxWidth: "120px", cursor: "pointer" }} onClick={() => openImageModal(info.data)}>
                                                                                    <div className="d-flex align-items-center gap-2">
                                                                                        <div className="border shadow-sm rounded" style={{ width: "40px", height: "40px", overflow: "hidden", flexShrink: 0 }}>
                                                                                            <img src={info.data} alt={info?.data} className="h-100 w-100" style={{ objectFit: "cover" }} />
                                                                                        </div>
                                                                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                                                            <p className="m-0 fw-bold text-truncate" style={{ fontSize: "0.75rem" }}>{info?.data.split('/').pop()}</p>
                                                                                            <p className="m-0 text-muted" style={{ fontSize: "0.65rem" }}>Image</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        ) : info.data}
                                                            </td>
                                                        ))
                                                    )}

                                                    {source === "payment" && role === "seller" && (
                                                        [
                                                            { data: data.refNo },
                                                            { data: { name: data.accountName, email: data.accountEmail } },
                                                            { data: `₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                            { data: data.paymentMethod },
                                                            { data: data.status },
                                                            { data: { date: data.paidAt.date, time: data.paidAt.time } },
                                                            { data: data.type },
                                                        ].map((info, i) => (
                                                            <td key={i} className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}>
                                                                {i === 1 ? (<>{info.data.name}<p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p></>)
                                                                    : i === 5 ? (<><p className="m-0 small">{new Date(info.data.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p><p className="m-0 small">{info.data.time}</p></>)
                                                                        : info.data}
                                                            </td>
                                                        ))
                                                    )}

                                                    {isSelect && (
                                                        <td className="p-3">
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <input type="checkbox" checked={selectedIds.has(data._id)} onChange={() => toggleSelect(data._id)} style={{ cursor: "pointer" }} />
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {filteredTransactions.length > 0 && (
                            <div className="row g-0 border-top bg-white">
                                <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                                    <div className="text-muted small">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                    </div>
                                </div>
                                <div className="col-12 col-lg-8 p-3">
                                    <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                                        <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handleDownloadPDF} title="Download as PDF">
                                            <i className="fa fa-file-pdf small text-danger"></i>
                                            <p className="m-0 small text-capitalize d-none d-sm-block">PDF</p>
                                        </button>
                                        <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handlePrint} title="Print Transactions">
                                            <i className="fa fa-print small text-dark"></i>
                                            <p className="m-0 small text-capitalize d-none d-sm-block">print</p>
                                        </button>
                                        <div className="d-none d-md-block border-start" style={{ height: "30px" }}></div>
                                        <button className="btn btn-sm btn-outline-success d-flex align-items-center" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                            <i className="fa fa-chevron-left"></i>
                                            <span className="ms-2 small d-none d-lg-block">Previous</span>
                                        </button>
                                        <div className="d-flex gap-1 flex-wrap justify-content-center">
                                            {[...Array(totalPages)].map((_, index) => {
                                                const pageNumber = index + 1;
                                                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                                    return (
                                                        <button key={pageNumber} className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setCurrentPage(pageNumber)} style={{ minWidth: "35px" }}>
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                                    return <span key={pageNumber} className="px-2 d-flex align-items-center">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                        <button className="btn btn-sm btn-outline-success d-flex align-items-center" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                            <span className="me-2 small d-none d-lg-block">Next</span>
                                            <i className="fa fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
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

export default Transactions;