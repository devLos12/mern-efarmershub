import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";




const SellerPaymentTransactions = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { sellerId, payoutDate } = location?.state || {};

    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const printRef = useRef();

    useEffect(() => {
        if (!sellerId || !payoutDate) return;
        handleLoading();
    }, [sellerId, payoutDate]);

    const fetchTransactions = async () => {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/seller/payment-transactions?sellerId=${sellerId}&payoutDate=${payoutDate}`,
            { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setTransactions(data.transactions);
    };

    const handleLoading = async () => {
        setIsLoading(true);
        try { await fetchTransactions(); }
        catch (e) { console.error(e.message); }
        finally { setIsLoading(false); }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try { await fetchTransactions(); }
        catch (e) { console.error(e.message); }
        finally { setIsRefreshing(false); }
    };

    const formattedDate = payoutDate
        ? new Date(payoutDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
        : "";

    const filteredTransactions = transactions.filter((t) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            (t.accountName || "").toLowerCase().includes(q) ||
            (t.accountEmail || "").toLowerCase().includes(q) ||
            (t.refNo || "").toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => { setCurrentPage(1); }, [search]);

    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        const windowPrint = window.open("", "", "width=900,height=650");
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Payment Transactions</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                        th { background-color: #198754; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h2 { margin: 0; color: #198754; }
                        .header p { margin: 5px 0; color: #666; }
                        button { display: none !important; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Payment Transactions Report</h2>
                        <p>Payout Date: ${formattedDate}</p>
                        <p>Generated: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                        <p>Total Records: ${filteredTransactions.length}</p>
                        <p>Total Amount: ₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Payment Transactions Report</h2>
                <p style="margin: 5px 0; color: #666;">Payout Date: ${formattedDate}</p>
                <p style="margin: 5px 0; color: #666;">Generated: ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p style="margin: 5px 0; color: #666;">Total Records: ${filteredTransactions.length}</p>
                <p style="margin: 5px 0; color: #666;">Total Amount: ₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        `;
        wrapper.appendChild(printContent);
        html2pdf().set({
            margin: 10,
            filename: `seller_transactions_${payoutDate}_${new Date().getTime()}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
        }).from(wrapper).save();
    };

    if (isLoading) return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="text-center">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="small text-muted mt-2">Loading transactions...</p>
            </div>
        </div>
    );

    return (
        <div className="p-2 mb-5">

            {/* ── Top Controls ── */}
            <div className="row g-0 bg-white border rounded p-2 px-2 px-lg-4 mt-1 gap-2">


                <div className="d-flex gap-3 align-items-center">
                    
                    <button
                        className="btn  btn-outline-success"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa fa-arrow-left small"></i>
                    </button>
                    
                    <div>
                        <p className="m-0 fw-semibold text-success">
                            <i className="fa fa-receipt me-1"></i> Payment Transactions
                        </p>
                        <p className="m-0 text-muted">Payout Date: <strong>{formattedDate}</strong></p>
                    </div>
                
                </div>


                <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                    <input
                        type="search"
                        placeholder="Search name, email, ref no..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-control border-2"
                        style={{ fontSize: "14px" }}
                    />
                </div>
                <div className="col">
                    <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                        <button
                            className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1"
                            onClick={handleRefresh}
                        >
                            <i className={`fa fa-sync small text-dark ${isRefreshing ? "fa-spin" : ""}`}></i>
                            <p className="m-0 small text-capitalize">refresh</p>
                        </button>
                    </div>
                    <p className="m-0 small opacity-50 text-end mt-2">
                        {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
                    </p>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="mt-1 bg-white rounded shadow-sm border position-relative" style={{ overflow: "auto" }}>
                {isRefreshing && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" style={{ zIndex: 10 }}>
                        <div className="text-center">
                            <div className="spinner-border text-success mb-2" role="status"><span className="visually-hidden">Loading...</span></div>
                            <p className="small text-muted mb-0">Refreshing transactions...</p>
                        </div>
                    </div>
                )}

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-5 text-muted small">
                        <i className="fa fa-inbox fs-1 d-block mb-2 opacity-25"></i>
                        No transactions found.
                    </div>
                ) : (
                    <div ref={printRef}>
                        <table className="w-100">
                            <thead className="position-sticky top-0 z-1">
                                <tr className="bg-white">
                                    {["#", "Ref No", "Account Name", "Payment Method", "Total Amount", "Status", "Date Paid"].map((h, i) => (
                                        <th key={i} className={`text-success small p-3 text-capitalize ${i === 0 ? "text-center" : ""}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((t, i) => (
                                    <tr key={t._id}>
                                        <td className="p-3 small text-center">{indexOfFirstItem + i + 1}</td>
                                        <td className="p-3 small">{t.refNo || "—"}</td>
                                        <td className="p-3 small">
                                            {t.accountName}
                                            <p className="m-0 text-lowercase opacity-75" style={{ fontSize: "11px" }}>{t.accountEmail}</p>
                                        </td>
                                        <td className="p-3 small text-capitalize">{t.paymentMethod}</td>
                                        <td className="p-3 small">
                                            ₱{t.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 small text-capitalize">
                                            {t.status}
                                        </td>
                                        <td className="p-3 small">
                                            {new Date(t.paidAt.date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                                            <p className="m-0 opacity-75" style={{ fontSize: "11px" }}>{t.paidAt.time}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Bottom Nav ── */}
            {filteredTransactions.length > 0 && (
                <div className="row g-0 border-top bg-white">
                    <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                            <span className="ms-2 fw-bold text-success">
                                · Total: ₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <div className="col-12 col-lg-8 p-3">
                        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                            <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handleDownloadPDF} title="Download as PDF">
                                <i className="fa fa-file-pdf small text-danger"></i>
                                <p className="m-0 small text-capitalize d-none d-sm-block">PDF</p>
                            </button>
                            <button className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1" onClick={handlePrint} title="Print">
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
                                            <button key={pageNumber} className={`btn btn-sm ${currentPage === pageNumber ? "btn-success" : "btn-outline-success"}`} onClick={() => setCurrentPage(pageNumber)} style={{ minWidth: "35px" }}>
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
        </div>
    );
};

export default SellerPaymentTransactions;