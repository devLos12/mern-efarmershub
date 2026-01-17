import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import img from "../assets/images/nodata.png";
import { useBreakpointHeight } from "./breakpoint";
import { appContext } from "../context/appContext";
import { sellerContext } from "../context/sellerContext";
import { adminContext } from "../context/adminContext";
import io from "socket.io-client";
import html2pdf from 'html2pdf.js';



const Orders = () => {
    const { role } = useContext(appContext);
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


    // Dynamic status options based on existing orders
    const availableStatuses = useMemo(() => {
        const statuses = new Set();
        orders.forEach(order => {
            if (order.statusDelivery) {
                statuses.add(order.statusDelivery);
            }
        });
        return Array.from(statuses).sort();
    }, [orders]);

    // Dynamic order method options based on existing orders
    const availableOrderMethods = useMemo(() => {
        const methods = new Set();
        orders.forEach(order => {
            if (order.orderMethod) {
                methods.add(order.orderMethod);
            }
        });
        return Array.from(methods).sort();
    }, [orders]);


    // Socket.IO connection and listener
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.on('new order', () => {
            console.log('New order received - refreshing...');
            fetchOrders();
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);
    



    const handlePrint = () => {
        const printContent = printRef.current.cloneNode(true);
        
        // Remove action buttons and ellipsis
        const actionsToRemove = printContent.querySelectorAll('td:last-child');
        actionsToRemove.forEach(td => {
            td.innerHTML = '<span class="text-muted small">-</span>';
        });
        
        const windowPrint = window.open('', '', 'width=900,height=650');
        
        windowPrint.document.write(`
            <html>
                <head>
                    <title>Print Orders</title>
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
                        <h2>Orders Report</h2>
                        <p>Date: ${new Date().toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                        <p>Total Orders: ${filteredOrders.length}</p>
                        ${statusFilter !== 'all' ? `<p>Status Filter: ${statusFilter}</p>` : ''}
                        ${orderMethodFilter !== 'all' ? `<p>Method Filter: ${orderMethodFilter}</p>` : ''}
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
        
        // Remove action buttons and ellipsis
        const actionsToRemove = printContent.querySelectorAll('td:last-child');
        actionsToRemove.forEach(td => {
            td.innerHTML = '<span class="text-muted small">-</span>';
        });

        // Create wrapper with header
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Orders Report</h2>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p style="margin: 5px 0; color: #666;">Total Orders: ${filteredOrders.length}</p>
                ${statusFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Status Filter: ${statusFilter}</p>` : ''}
                ${orderMethodFilter !== 'all' ? `<p style="margin: 5px 0; color: #666;">Method Filter: ${orderMethodFilter}</p>` : ''}
            </div>
        `;
        wrapper.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `orders_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(wrapper).save();
    };







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
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId]);



    const fetchOrders = async () => {
        const endPoint = role === "admin"
            ? (showArchived ? "getArchivedOrders" : "getOrders")
            : (showArchived ? "getArchivedSellerOrders" : "getSellerOrders");

        try {
            const fetchUrl = `${import.meta.env.VITE_API_URL}/api/${endPoint}`;
            const res = await fetch(fetchUrl, { method: "GET", credentials: "include" });
            console.log("Response from orders: ", res.status);
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



    useEffect(() => {
        const loadInitialOrders = async () => {
            await fetchOrders();
            setTimeout(() => {
                setLoading(false);
            }, 500);
        };
        loadInitialOrders();
    }, [showArchived])


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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`, {
                method: "POST",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to archive");
            await fetchOrders();
            setArchiveOrderModal({ isShow: false, id: null });
        } catch (error) {
            console.error("Archive error:", error);
        }
    };

    const handleUnarchive = async (orderId) => {
        const endPoint = role === "admin" ? "unarchiveOrder" : "unarchiveSellerOrder";
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`, {
                method: "POST",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to unarchive");
            await fetchOrders();
        } catch (error) {
            console.error("Unarchive error:", error);
        }
    };




    const handleViewDetails = (orderId) => {
        if(role === "admin")  return navigate("orderdetails", { state : { orderId }});
        if(role === "seller") return navigate("/seller/orderdetails", { state : { orderId }});
    }

    const getStatusColor = (status) => {
        const colors = {
            "pending": "warning",
            "confirmed": "info",
            "confirm": "info",
            "packing": "primary",
            "ready to deliver": "success",
            "ready for pick up": "success",
            "in transit": "info",
            "delivered": "success",
            "complete": "success",
            "completed": "success",
            "cancelled": "danger",
            "refund requested": "warning",
            "refund processing": "info",
            "refund completed": "success",
            "refund rejected": "danger"
        };
        return colors[status] || "secondary";
    };

    const filteredOrders = orders.filter(order => {
        const statusMatch = statusFilter === "all" || order.statusDelivery === statusFilter;
        const methodMatch = orderMethodFilter === "all" || order.orderMethod === orderMethodFilter;
        const searchMatch = searchQuery === "" || 
            order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.firstname + " " + order.lastname).toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && methodMatch && searchMatch;
    });




    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, orderMethodFilter, searchQuery]);


    
    if(loading) return <p></p>
    

    return (    
        <>
        <div className={role === "seller" ? "p-2" : "p-0"}>
        <div className="border row g-0 bg-white rounded shadow-sm justify-content-center">
            <div className="col-12">
                <p className="text-capitalize fw-bold py-2 text-center m-0">order summary</p>
            </div>
            <div className="col-12">
                <div className="d-flex flex-column gap-2 p-2 flex-md-row  justify-content-md-between">
                    <div className="position-relative w-50">
                        <input 
                            type="text"
                            className="form-control form-control-sm ps-4"
                            placeholder="Search by Order ID or Buyers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ fontSize: "14px" }}
                        />
                        <i className="fa fa-search position-absolute text-muted " 
                            style={{ left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px" }}></i>
                    </div>

                    <div className="d-flex flex-column gap-2 flex-md-row">
                        <div className="d-flex align-items-center gap-2">
                            <select 
                                className="form-select form-select-sm "
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
                                className="form-select form-select-sm "
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
                            {/* <i className={`fa ${showArchived ? 'fa-inbox' : 'fa-archive'}`}></i> */}
                            {showArchived ? 'Unarchived' : 'Archived'}
                        </button> 



                        <button 
                            className="btn btn-sm btn-success d-flex align-items-center gap-2 "
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
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" 
                        style={{ zIndex: 10 }}>
                        <div className="text-center">
                            <div className="spinner-border text-success mb-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="small text-muted mb-0">Refreshing orders...</p>
                        </div>
                    </div>
                )}
                
                {/* Added overflow wrapper */}
                <div ref={printRef} style={{ overflowX: "auto" }}>
                    <table className="w-100" >
                    <thead className="bg-white border-bottom shadow-sm"> 
                        <tr>
                        {["Order Id", "Buyer Name", "Total Payment", "Status", "Rider", "Date/Time", "Action"].map((data, i) => {
                            return(
                                <th key={i} className={`p-3 text-success small ${[3,4,6].includes(i) && "text-center"}`}>
                                    {data}
                                </th>
                            )
                        })} 
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((data, i) => {
                            const isMenuOpen = openMenuId === data._id;
                            return (
                            <tr key={i}>
                                {[
                                {data : data.orderId || "N/A", isBold: true},
                                {data : data.firstname + " " + data.lastname},
                                {data : "₱"+data.totalPrice.toLocaleString('en-PH')+".00"},
                                {data : data.statusDelivery === 'confirm' ? 'confirmed' : data.statusDelivery},
                                {data : data.riderName},
                                {data : { 
                                    date: new Date(data.createdAt).toLocaleDateString('en-PH',{
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric'
                                    }), 
                                    time: new Date(data.createdAt).toLocaleTimeString(), 
                                }}].map((e, j) => {
                                    return (
                                        <td key={j} className={`p-3 text-capitalize small`} style={{ whiteSpace: "nowrap" }}>
                                            {j === 3 ? (
                                                <div className="d-flex justify-content-center">
                                                    <span className={`bg-${getStatusColor(e.data)} bg-opacity-10 text-${getStatusColor(e.data)} fw-bold small`}
                                                        style={{ padding: "4px 12px", borderRadius: "4px", display: "inline-block" }}>
                                                        {e.data}
                                                    </span>
                                                </div>
                                            ) : j === 4 ? (
                                                <div className="d-flex justify-content-center">
                                                    {data.orderMethod === "pick up" ? (
                                                        <span className="text-muted small fst-italic">N/A</span>
                                                    ) : e.data && e.data.trim() ? (
                                                        <span className="fw-bold text-dark small">{e.data}</span>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">Not assigned</span>
                                                    )}
                                                </div>
                                            ) : j === 5 ? (
                                                <div>
                                                    <p className="m-0 small">{e.data?.date}</p>
                                                    <p className="m-0 small text-muted">{e.data?.time}</p>
                                                </div>
                                            ) : j === 0 ? (
                                                <span className="fw-bold text-dark">{e.data}</span>
                                            ) : (
                                                <span className="opacity-75">{e.data}</span>
                                            )}
                                        </td>
                                    )
                                })}
                                <td className="p-3 position-relative">
                                    <div 
                                    ref={(el) => (buttonRefs.current[data._id] = el )}
                                    className="position-relative mx-auto d-flex align-items-center justify-content-center shadow-sm border rounded-circle"
                                    onClick={(e) => {
                                        setOpenMenuId(isMenuOpen ? null: data._id);
                                    }}
                                    style={{cursor: "pointer", width: "30px", height: "30px"}}>
                                        <i className="fa fa-ellipsis"></i>
                                     {isMenuOpen && (
                                            <div 
                                            ref={(el) => (menuRefs.current[data._id] = el)} 
                                            className="card position-absolute top-100 end-0 p-2 z-1"
                                            style={{width: "220px", cursor: "default", boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)"}}
                                            onClick={(e)=> e.stopPropagation()}>
                                                <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                style={{cursor: "pointer"}}
                                                onClick={()=> {
                                                    handleViewDetails(data._id);
                                                    setOpenMenuId(null);
                                                }}>
                                                    <i className="fa fa-list small"></i>
                                                    <p className="m-0 capitalize small">view details</p>
                                                </div>

                                                {!showArchived ? (
                                                    <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                    style={{cursor: "pointer"}}
                                                    onClick={()=> {
                                                        setArchiveOrderModal({ isShow: true, id: data._id });
                                                        setOpenMenuId(null);
                                                    }}>
                                                        <i className="fa fa-archive small text-warning"></i>
                                                        <p className="m-0 capitalize small text-warning">archive</p>
                                                    </div>
                                                ) : (
                                                    <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                    style={{cursor: "pointer"}}
                                                    onClick={()=> {
                                                        handleUnarchive(data._id);
                                                        setOpenMenuId(null);
                                                    }}>
                                                        <i className="fa fa-inbox small text-info"></i>
                                                        <p className="m-0 capitalize small text-info">unarchive</p>
                                                    </div>
                                                )}
{/* 
                                                <div className="px-2 bg-hover rounded text-capitalize p-1 d-flex align-items-center gap-2"
                                                style={{cursor: "pointer"}}
                                                onClick={()=> {
                                                    setDeleteOrderModal((prev) => ({...prev, isShow: true, id: data._id}));
                                                    setText("do you want to delete?");
                                                    setOpenMenuId(null);
                                                }}>
                                                    <i className="fa fa-trash small text-danger"></i>
                                                    <p className="m-0 capitalize small text-danger">delete</p>
                                                </div> */}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                    </table>
                </div>
            </div>

            <div className="row g-0 bg-white rounded border shadow-sm">
                {/* Left Column - Showing info */}
                <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                    <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                </div>
                
                {/* Right Column - Actions and Pagination */}
                <div className="col-12 col-lg-8 p-3">
                    <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                        {/* PDF Download Button */}
                        <button 
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={handleDownloadPDF}
                            title="Download as PDF"
                        >
                            <i className="fa fa-file-pdf small"></i>
                            <span className="small d-none d-sm-block">PDF</span>
                        </button>

                        {/* Print Button */}
                        <button 
                            className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
                            onClick={handlePrint}
                            title="Print Orders"
                        >
                            <i className="fa fa-print small"></i>
                            <span className="small d-none d-sm-block">Print</span>
                        </button>

                        {/* Divider (hidden on mobile) */}
                        <div className="d-none d-md-block border-start" style={{height: "30px"}}></div>

                        {/* Previous Button */}
                        <button 
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <i className="fa fa-chevron-left"></i>
                            <span className="ms-2 small d-none d-lg-block">Previous</span>
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="d-flex gap-1 flex-wrap justify-content-center">
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
                                    return <span key={pageNumber} className="px-2 d-flex align-items-center">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        
                        {/* Next Button */}
                        <button 
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <span className="me-2 small d-none d-lg-block">Next</span>
                            <i className="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
            </>
        ) : (
           <div className="row g-0 bg-white border rounded shadow-sm mt-1 justify-content-center align-items-center" 
                style={{height: 336}}>
                    <div className="col-md-5 text-center">
                        <div className="mb-3">
                            <i className="fa-solid fa-shopping-bag text-muted opacity-50" 
                                style={{ fontSize: "80px" }}></i>
                        </div>
                        <p className="mt-3 text-capitalize text-center opacity-75 fw-semibold">
                            {orders.length === 0 ? "No orders yet" : "No orders match the selected filters"}
                        </p>
                        <p className="text-muted small">
                            {orders.length === 0 
                                ? "Orders will appear here once buyers start placing them" 
                                : "Try adjusting your filters to see more results"}
                        </p>
                        {filteredOrders.length === 0 && orders.length > 0 && (
                            <button 
                                className="btn btn-sm btn-outline-success mt-2"
                                onClick={() => {
                                    setStatusFilter("all");
                                    setOrderMethodFilter("all");
                                    setSearchQuery("");
                                }}>
                                <i className="fa fa-filter-circle-xmark me-2"></i>
                                Clear Filters
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
                        <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setArchiveOrderModal({ isShow: false, id: null })}>
                            Cancel
                        </button>
                        <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => handleArchive(archiveOrderModal.id)}>
                            Archive
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Orders;