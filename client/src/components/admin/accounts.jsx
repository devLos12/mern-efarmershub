import React, { useContext } from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { adminContext } from "../../context/adminContext.jsx";
import { useBreakpointHeight } from "../../components/breakpoint.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import AddAccount from "./addAccount.jsx";
import { appContext } from "../../context/appContext.jsx";
import Toast from "../toastNotif.jsx";
import html2pdf from 'html2pdf.js';


const Accounts = () => {
    const {
        showToast,
        toastMessage,
        toastType,
        setShowToast,
    } = useContext(appContext);

    const { setText, setId, setAccountsModal, accountsData, setAccountsData } = useContext(adminContext);
    const [error, setError] = useState(null);
    const { trigger } = useContext(adminContext);
    const height = useBreakpointHeight();
    const [loading, setLoading] = useState(true);
    const location = useLocation() || "no data";
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRefs = useRef({});
    const buttonRefs = useRef({});
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const printRef = useRef();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
    };

    useEffect(() => {
        const result = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(result);
    }, [search]);

    const filteredAccounts = useMemo(() => {
        let filtered = accountsData;
        if (debouncedSearch) {
            filtered = filtered.filter((account) => {
                const firstname = (account.firstname || "").toLowerCase();
                const lastname = (account.lastname || "").toLowerCase();
                const email = (account.email || "").toLowerCase();
                const accountId = (account.accountId || "").toLowerCase();
                return firstname.includes(debouncedSearch) ||
                    lastname.includes(debouncedSearch) ||
                    email.includes(debouncedSearch) ||
                    accountId.includes(debouncedSearch);
            });
        }
        if ((location.state?.source === "seller" || location.state?.source === "rider") && verificationFilter !== 'all') {
            filtered = filtered.filter((account) => account.verification === verificationFilter);
        }
        return filtered;
    }, [accountsData, debouncedSearch, verificationFilter, location.state?.source]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

    const getVerificationBadge = (status) => {
        const badges = {
            'pending':  { bg: 'bg-warning',  text: 'Pending',  icon: 'fa-clock' },
            'verified': { bg: 'bg-success',  text: 'Verified', icon: 'fa-check-circle' },
            'rejected': { bg: 'bg-danger',   text: 'Rejected', icon: 'fa-times-circle' }
        };
        const badge = badges[status] || badges['pending'];
        return (
            <span className={`badge ${badge.bg} d-flex align-items-center gap-1`} style={{ width: 'fit-content' }}>
                <i className={`fa ${badge.icon} small`}></i>
                {badge.text}
            </span>
        );
    };

    const showVerificationFilter = location.state?.source === "seller" || location.state?.source === "rider";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openMenuId) return;
            const menuEl = menuRefs.current[openMenuId];
            const buttonEl = buttonRefs.current[openMenuId];
            if (menuEl && buttonEl && !menuEl.contains(event.target) && !buttonEl.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [openMenuId]);

    const handleChat = async (e) => {
        try {
            const sendData = { receiverId: e._id, receiverRole: location.state?.source };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAdminChatId`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sendData),
                credentials: "include"
            });
            const data = await res.json();
            if (!data.chatId || !data.senderId) return;
            navigate("/admin/messages", {
                state: {
                    source: location.state?.source,
                    chatId: data.chatId,
                    senderId: data.senderId,
                    credentials: { id: e._id, name: `${e.firstname} ${e.lastname}`, email: e.email, role: location.state?.source }
                }
            });
        } catch (err) { console.log("Error: ", err.message); }
    };

    const handleViewProfile = (id) => {
        navigate(`/admin/profile`, { state: { accountId: id, source: location.state?.source } });
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAccounts`, { method: "GET", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setError(null);
            if (location.state?.source === "user")   setAccountsData(data.user.reverse());
            if (location.state?.source === "seller") setAccountsData(data.seller.reverse());
            if (location.state?.source === "rider")  setAccountsData(data.rider.reverse());
            if (location.state?.source === "admin")  setAccountsData(data.admin.reverse());
        } catch (err) { setError(err.message); console.log("Error: ", err.message); }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchAccounts();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) { console.log("Refresh error:", error.message); }
        finally { setIsRefreshing(false); }
    };

    // ── PRINT ──────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        printContent.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const total = cells.length;
            if (total >= 2) { cells[total - 1].remove(); cells[total - 2].remove(); }
        });
        const table = printContent.querySelector('table');
        if (table) {
            table.setAttribute('style', 'width:100%;border-collapse:collapse;margin-top:20px;');
            table.querySelectorAll('th').forEach(th => {
                th.setAttribute('style', 'background-color:#198754;color:white;padding:10px 12px;font-size:12px;border:1px solid #ddd;text-align:left;font-weight:bold;');
            });
            table.querySelectorAll('td').forEach(td => {
                td.setAttribute('style', 'padding:10px 12px;font-size:12px;border:1px solid #ddd;text-align:left;');
            });
            table.querySelectorAll('.badge').forEach(badge => {
                let bg = '#ffc107'; let color = '#000';
                if (badge.classList.contains('bg-success')) { bg = '#198754'; color = '#fff'; }
                if (badge.classList.contains('bg-danger'))  { bg = '#dc3545'; color = '#fff'; }
                badge.setAttribute('style', `background-color:${bg};color:${color};padding:3px 8px;border-radius:4px;font-size:11px;display:inline-block;`);
            });
        }
        const windowPrint = window.open('', '', 'width=900,height=650');
        windowPrint.document.write(`
            <html><head><title>Print Accounts</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 12px; }
                    th { background-color: #198754 !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h2 { margin: 0; color: #198754; }
                    .header p { margin: 5px 0; color: #666; }
                    .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; display: inline-block; }
                    .bg-warning { background-color: #ffc107 !important; color: #000; }
                    .bg-success { background-color: #198754 !important; color: white; }
                    .bg-danger  { background-color: #dc3545 !important; color: white; }
                    @media print { body { margin: 0; } }
                </style>
            </head><body>
                <div class="header">
                    <h2>Accounts Report</h2>
                    <p>Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>Total Accounts: ${filteredAccounts.length}</p>
                    ${verificationFilter !== 'all' ? `<p>Status Filter: ${verificationFilter}</p>` : ''}
                </div>
                ${printContent.innerHTML}
                <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
            </body></html>
        `);
        windowPrint.document.close();
    };

    // ── DOWNLOAD PDF ───────────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        printContent.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const total = cells.length;
            if (total >= 2) { cells[total - 1].remove(); cells[total - 2].remove(); }
        });
        const table = printContent.querySelector('table');
        if (table) {
            table.setAttribute('style', 'width:100%;border-collapse:collapse;margin-top:20px;');
            table.querySelectorAll('th').forEach(th => {
                th.setAttribute('style', 'background-color:#198754;color:white;padding:10px 12px;font-size:12px;border:1px solid #ddd;text-align:left;font-weight:bold;');
            });
            table.querySelectorAll('td').forEach((td, idx) => {
                const bg = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
                td.setAttribute('style', `padding:10px 12px;font-size:12px;border:1px solid #ddd;text-align:left;background-color:${bg};`);
            });
            table.querySelectorAll('.badge').forEach(badge => {
                let bg = '#ffc107'; let color = '#000';
                if (badge.classList.contains('bg-success')) { bg = '#198754'; color = '#fff'; }
                if (badge.classList.contains('bg-danger'))  { bg = '#dc3545'; color = '#fff'; }
                badge.setAttribute('style', `background-color:${bg};color:${color};padding:3px 8px;border-radius:4px;font-size:11px;display:inline-block;`);
            });
        }
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align:center;margin-bottom:20px;font-family:Arial,sans-serif;">
                <h2 style="margin:0;color:#198754;">Accounts Report</h2>
                <p style="margin:5px 0;color:#666;">Date: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin:5px 0;color:#666;">Total Accounts: ${filteredAccounts.length}</p>
                ${verificationFilter !== 'all' ? `<p style="margin:5px 0;color:#666;">Status Filter: ${verificationFilter}</p>` : ''}
            </div>
        `;
        wrapper.appendChild(printContent);
        const opt = {
            margin: 10,
            filename: `accounts_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(wrapper).save();
    };

    const remove = (id) => {
        setText("do you want to delete?");
        setAccountsModal((prev) => ({ ...prev, isShow: true, id: id }));
        setId({ account: id });
    };

    const Height = () => { return height < 574 ? height : height - 152; };

    useEffect(() => { setCurrentPage(1); }, [verificationFilter, debouncedSearch, location.state?.source]);

    useEffect(() => {
        const loadInitialAccounts = async () => {
            setVerificationFilter('all');
            setIsRefreshing(true);
            await fetchAccounts();
            setTimeout(() => { setLoading(false); setIsRefreshing(false); }, 500);
        };
        loadInitialAccounts();
    }, [location.state?.source]);

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ height: Height() }}>
            <div className="text-center">
                <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="small text-muted mb-0">Loading accounts...</p>
            </div>
        </div>
    );

    // ── REUSABLE ACTION MENU ───────────────────────────────────────────────────
    // popUp: opens the dropdown ABOVE the button (for last rows to avoid cutoff)
    const ActionMenu = ({ data, popUp }) => {
        const isMenuOpen = openMenuId === data._id;
        return (
            <div
                ref={(el) => (buttonRefs.current[data._id] = el)}
                className="position-relative mx-auto d-flex align-items-center justify-content-center shadow-sm border rounded-circle bg-white"
                onClick={() => setOpenMenuId(isMenuOpen ? null : data._id)}
                style={{ cursor: "pointer", width: "32px", height: "32px" }}>
                <i className="fa fa-ellipsis"></i>
                {isMenuOpen && (
                    <div
                        ref={(el) => (menuRefs.current[data._id] = el)}
                        className="card p-2 border border-success border-opacity-25"
                        style={{
                            width: "220px",
                            cursor: "default",
                            boxShadow: "0px 2px 10px rgba(0,0,0,0.25)",
                            position: "absolute",
                            right: 0,
                            zIndex: 99,
                            // ✅ Pop UP for last rows, DOWN for everything else
                            top:    popUp ? "auto"  : "110%",
                            bottom: popUp ? "110%"  : "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        <div
                            className="px-2 rounded text-capitalize p-2 d-flex align-items-center gap-2"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => { handleViewProfile(data._id); setOpenMenuId(null); }}>
                            <i className="fa fa-user text-primary"></i>
                            <p className="m-0 small text-primary">view profile</p>
                        </div>
                        <div
                            className="px-2 rounded text-capitalize p-2 d-flex align-items-center gap-2"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => { remove(data._id); setOpenMenuId(null); }}>
                            <i className="bx bx-trash text-danger"></i>
                            <p className="m-0 small text-danger">delete</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="p-2">
                {/* Header Tabs */}
                <div className="row g-0 bg-white border flex-column shadow-sm rounded d-flex align-items-center p-2 px-3 px-lg-4">
                    <div className="col">
                        <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2">
                                {[
                                    { source: "user",   icon: "fa-user",    label: "buyer" },
                                    { source: "seller", icon: "fa-store",   label: "farmer" },
                                    { source: "rider",  icon: "fa-bicycle", label: "rider" },
                                ].map(({ source, icon, label }) => (
                                    <div key={source}
                                        className={`text-capitalize rounded p-2 px-3 d-flex align-items-center ${location.state?.source === source ? "bg-success text-white shadow-sm" : "bg-white text-success border border-success border-opacity-25"}`}
                                        style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                                        onClick={() => navigate("/admin/accounts", { state: { source } })}>
                                        <i className={`fa ${icon} me-2 small`}></i>
                                        <p className="m-0 small fw-bold d-none d-md-flex">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="d-flex align-items-center px-3 py-2 shadow-sm border-0 gap-2 rounded bg-success text-white"
                                onClick={() => setShowAddModal(true)}
                                style={{ transition: "all 0.2s ease" }}>
                                <i className="fa fa-plus small"></i>
                                <p className="m-0 small text-capitalize fw-semibold d-none d-md-flex">add account</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Actions Bar */}
                <div className="row g-0 bg-white border border-success border-opacity-25 rounded p-2 px-2 px-lg-4 mt-2 shadow-sm">
                    <div className="col-12 col-md-5">
                        <div className="position-relative">
                            <i className="fa fa-search position-absolute text-success opacity-50" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}></i>
                            <input type="search"
                                placeholder="Search by name, email or Account ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-control border-success border-opacity-25 ps-5 small"
                                style={{ outline: "none" }} />
                        </div>
                    </div>
                    <div className="col">
                        <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                            {showVerificationFilter && (
                                <select
                                    className="form-select form-select-sm border-success border-opacity-25 small"
                                    style={{ width: "auto" }}
                                    value={verificationFilter}
                                    onChange={(e) => setVerificationFilter(e.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            )}
                            <button
                                className="d-flex align-items-center px-3 py-1 shadow-sm border gap-2 rounded"
                                onClick={handleRefresh}
                                disabled={isRefreshing}>
                                <i className={`fa fa-sync small ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                <p className="m-0 small text-capitalize">{isRefreshing ? 'Refreshing...' : 'Refresh'}</p>
                            </button>
                        </div>
                        <p className="m-0 small text-end text-muted mt-2 opacity-50 fw-semibold">
                            <i className="fa fa-filter me-1"></i>
                            {`${filteredAccounts.length} from ${accountsData.length} Total`}
                        </p>
                    </div>
                </div>

                {/* Table */}
                {filteredAccounts.length > 0 ? (
                    <>
                        <div className="mt-2 bg-white rounded shadow-sm border border-success border-opacity-25 position-relative"
                            style={{ overflowY: "auto"}}>
                            {isRefreshing && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" style={{ zIndex: 10 }}>
                                    <div className="text-center">
                                        <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                                        <p className="small text-muted mb-0">Refreshing accounts...</p>
                                    </div>
                                </div>
                            )}

                            <div ref={printRef} className="table-responsive " 
                            style={{height: filteredAccounts.length <= 9 ? "320px" : "" }}
                            >
                                <table className="table table-hover" 
                                style={{ minWidth: "800px"}}>
                                    <thead className="bg-light">
                                        <tr>
                                            {location.state?.source === "admin" &&
                                                ["Account ID", "Email", "Contact Number", "Admin Type", "Created At", "Action"].map((col, i) => (
                                                    <th key={i} className={`text-uppercase small text-success ${i === 5 ? "text-center" : ""}`}>{col}</th>
                                                ))
                                            }
                                            {location.state?.source === "user" &&
                                                ["Account ID", "Buyer Name", "Email", "Created At", "Message", "Action"].map((col, i) => (
                                                    <th key={i} className={`text-uppercase small text-success ${i >= 4 ? "text-center" : ""}`}>{col}</th>
                                                ))
                                            }
                                            {location.state?.source === "seller" &&
                                                ["Verification Status", "Account ID", "Farmer Name", "Email", "Created At", "Message", "Action"].map((col, i) => (
                                                    <th key={i} className={`text-uppercase small text-success ${i >= 5 ? "text-center" : ""}`}>{col}</th>
                                                ))
                                            }
                                            {location.state?.source === "rider" &&
                                                ["Verification Status", "Account ID", "Rider Name", "Email", "Created At", "Message", "Action"].map((col, i) => (
                                                    <th key={i} className={`text-uppercase small text-success ${i >= 5 ? "text-center" : ""}`}>{col}</th>
                                                ))
                                            }
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((data, i) => {
                                            const isAdmin = location.state?.source === "admin";
                                            const needsVerification = location.state?.source === "seller" || location.state?.source === "rider";
                                            // ✅ Pop UP for last 2 rows so menu doesn't get clipped
                                            const popUp = i === 0 ? 0 : currentItems.length - 2;

                                            return (
                                                <tr key={i}>
                                                    {isAdmin ? (
                                                        <>
                                                            <td className="align-middle small fw-bold">{data.accountId || "N/A"}</td>
                                                            <td className="align-middle small text-lowercase">{data.email}</td>
                                                            <td className="align-middle small">{data.contact || "N/A"}</td>
                                                            <td className="align-middle small">
                                                                <span className={`badge ${data.adminType === 'main' ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {data.adminType ? data.adminType.toUpperCase() : "SUB"}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle small">{data.createdAt ? formatDate(data.createdAt) : "N/A"}</td>
                                                            <td className="align-middle text-center">
                                                                <ActionMenu data={data} popUp={popUp} />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {needsVerification && (
                                                                <td className="align-middle small">
                                                                    {getVerificationBadge(data.verification || "pending")}
                                                                </td>
                                                            )}
                                                            <td className="align-middle small fw-bold">{data.accountId || "N/A"}</td>
                                                            <td className="align-middle small text-capitalize">{`${data.firstname} ${data.lastname}`}</td>
                                                            <td className="align-middle small text-lowercase">{data.email}</td>
                                                            <td className="align-middle small">{data.createdAt ? formatDate(data.createdAt) : "N/A"}</td>
                                                            <td className="align-middle text-center">
                                                                <button
                                                                    className="text-capitalize px-3 py-1 bg-primary shadow-sm border-0 text-white small text-nowrap"
                                                                    style={{ outline: "none", borderRadius: "20px", transition: "all 0.2s ease" }}
                                                                    onClick={() => handleChat(data)}>
                                                                    <i className="fa fa-comment me-1 small"></i>
                                                                    chat
                                                                </button>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <ActionMenu data={data} popUp={popUp} />
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination + PDF/Print — same layout as Orders.jsx */}
                        <div className="row g-0 bg-white rounded border shadow-sm">
                            <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                                <div className="text-muted small">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAccounts.length)} of {filteredAccounts.length} accounts
                                </div>
                            </div>
                            <div className="col-12 col-lg-8 p-3">
                                <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleDownloadPDF} title="Download as PDF">
                                        <i className="fa fa-file-pdf small"></i>
                                        <span className="small d-none d-sm-block">PDF</span>
                                    </button>
                                    <button className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1" onClick={handlePrint} title="Print Accounts">
                                        <i className="fa fa-print small"></i>
                                        <span className="small d-none d-sm-block">Print</span>
                                    </button>
                                    <div className="d-none d-md-block border-start" style={{ height: "30px" }}></div>
                                    <button className="btn btn-sm btn-outline-success d-flex align-items-center"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}>
                                        <i className="fa fa-chevron-left"></i>
                                        <span className="ms-2 small d-none d-lg-block">Previous</span>
                                    </button>
                                    <div className="d-flex gap-1 flex-wrap justify-content-center">
                                        {[...Array(totalPages)].map((_, index) => {
                                            const pageNumber = index + 1;
                                            if (pageNumber === 1 || pageNumber === totalPages ||
                                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                                return (
                                                    <button key={pageNumber}
                                                        className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`}
                                                        onClick={() => setCurrentPage(pageNumber)}
                                                        style={{ minWidth: "35px" }}>
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
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}>
                                        <span className="me-2 small d-none d-lg-block">Next</span>
                                        <i className="fa fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="row shadow-sm border border-success border-opacity-25 justify-content-center align-items-center bg-white rounded g-0 p-5 mt-2">
                        <div className="col-md-4 text-center">
                            <div className="mb-3">
                                <i className="fa fa-inbox text-success opacity-25" style={{ fontSize: "48px" }}></i>
                            </div>
                            <p className="m-0 text-capitalize text-success fw-semibold">
                                {search ? "no accounts found" : error ?? "no accounts"}
                            </p>
                            {search && <p className="m-0 small text-success opacity-75 mt-2">Try adjusting your search terms</p>}
                        </div>
                    </div>
                )}
            </div>

            <AddAccount isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => handleRefresh()} />
            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
        </>
    );
};

export default Accounts;