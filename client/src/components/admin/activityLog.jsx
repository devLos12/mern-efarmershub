import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const ActivityLog = () => {
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
    
    // Select functionality
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);

    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Socket.IO connection
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.on('new activity', () => {
            console.log('New activity logged - refreshing...');
            getActivityLogs();
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Handle modal animation
    useEffect(() => {
        if (showSuccessModal || showErrorModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            // Auto-close after 2 seconds for success
            if (showSuccessModal) {
                const timer = setTimeout(() => {
                    setIsModalVisible(false);
                    setTimeout(() => {
                        setShowSuccessModal(false);
                    }, 300);
                }, 2000);
                
                return () => clearTimeout(timer);
            }
        }
    }, [showSuccessModal, showErrorModal]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const loadInitialLogs = async () => {
            await getActivityLogs();
            setTimeout(() => {
                setLoading(false);
            }, 500);
        };
        loadInitialLogs();
    }, []);

    const getActivityLogs = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getActivityLogs`, {
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

    const getStatusColor = (status) => {
        return status === "success" ? "success" : "danger";
    };

    const getAdminTypeBadge = (type) => {
        return type === "main" ? "primary" : "secondary";
    };

    // Select functions
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
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            setIsAllSelected(updated.size === filteredLogs.length);
            return updated;
        });
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) {
            setModalMessage("No logs selected yet");
            setShowErrorModal(true);
            return;
        }

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

            console.log(data.message);
            setActivityLogs((prev) => prev.filter((item) => !selectedIds.has(item._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);
            setModalMessage(data.message || `Successfully deleted ${sendData.length} log(s)`);
            setShowSuccessModal(true);
        } catch (error) {
            console.log("Error: ", error.message);
            setModalMessage(error.message || "Failed to delete logs");
            setShowErrorModal(true);
        }
    };

    // Filtering
    const filteredLogs = activityLogs?.filter(log => {
        const statusMatch = statusFilter === "all" || log.status === statusFilter;
        const adminTypeMatch = adminTypeFilter === "all" || log.adminType === adminTypeFilter;
        
        if (!debouncedSearch) return statusMatch && adminTypeMatch;

        const action = (log.action || "").toLowerCase();
        const description = (log.description || "").toLowerCase();
        const username = (log.performedBy?.username || "").toLowerCase();

        const searchMatch = action.includes(debouncedSearch) || 
                          description.includes(debouncedSearch) || 
                          username.includes(debouncedSearch);

        return statusMatch && adminTypeMatch && searchMatch;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, adminTypeFilter, searchQuery]);

    if (loading) return <p></p>;

    return (
        <>
            {/* Success Modal with Animation */}
            {showSuccessModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
                >
                    <div
                        className="bg-white rounded shadow p-4 text-center"
                        style={{
                            maxWidth: "400px",
                            width: "90%",
                            transform: isModalVisible ? "scale(1)" : "scale(0.7)",
                            opacity: isModalVisible ? 1 : 0,
                            transition: "all 0.3s ease-in-out"
                        }}
                    >
                        <div className="mb-3">
                            <i className="fa fa-check-circle text-success" style={{ fontSize: "60px" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2 text-success">
                            Success!
                        </h5>
                        <p className="small text-muted mb-0">{modalMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
                    onClick={() => setShowErrorModal(false)}
                >
                    <div
                        className="bg-white rounded shadow p-4 text-center"
                        style={{
                            maxWidth: "400px",
                            width: "90%",
                            transform: isModalVisible ? "scale(1)" : "scale(0.7)",
                            opacity: isModalVisible ? 1 : 0,
                            transition: "all 0.3s ease-in-out"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-times-circle text-danger" style={{ fontSize: "60px" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2 text-danger">
                            Error!
                        </h5>
                        <p className="small text-muted mb-3">{modalMessage}</p>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                                setIsModalVisible(false);
                                setTimeout(() => setShowErrorModal(false), 300);
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="p-2">
                <div className="border row g-0 bg-white rounded shadow-sm p-2 px-2 px-lg-4 mt-1 gap-2">
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

                    <div className="col">
                        <div>
                            <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                                {selectedIds.size > 0 && (
                                    <button 
                                        className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm"
                                        onClick={handleDelete}
                                        style={{ cursor: "pointer" }}
                                    >
                                        delete
                                    </button>
                                )}

                                <button 
                                    className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1"
                                    onClick={handleRefresh}
                                >
                                    <i className={`fa fa-sync small text-dark ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                    <p className="m-0 small text-capitalize">refresh</p>
                                </button>

                                <button 
                                    className="btn-dark text-white small p-1 text-capitalize rounded border-0 shadow-sm"
                                    onClick={() => {
                                        setIsAllSelected(false);
                                        setSelectedIds(new Set());
                                        setIsSelect((prev) => !prev);
                                    }}
                                    style={{ cursor: "pointer", width: "100px" }}
                                >
                                    {isSelect ? "hide select" : "show select"}
                                </button>
                            </div>
                            <p className="m-0 small opacity-50 text-end mt-2">
                                {`${selectedIds.size} selected from ${filteredLogs.length} Total`}
                            </p>
                        </div>
                    </div>

                    <div className="col-12 d-flex flex-column flex-md-row gap-2">
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
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" 
                                    style={{ zIndex: 10 }}>
                                    <div className="text-center">
                                        <div className="spinner-border text-success mb-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="small text-muted mb-0">Refreshing logs...</p>
                                    </div>
                                </div>
                            )}
                            
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
                                                        <input 
                                                            type="checkbox"
                                                            checked={isAllSelected}
                                                            onChange={toggleSelectAll}
                                                            style={{ cursor: "pointer" }}
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((log, i) => (
                                        <tr key={i}>
                                            <td className="p-3 small text-center">
                                                {indexOfFirstItem + i + 1}
                                            </td>
                                            <td className="p-3 small" style={{ whiteSpace: "nowrap" }}>
                                                <span className="text-dark">
                                                    {log.performedBy?.email || "Unknown"}
                                                </span>
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
                                                <p className="m-0 small">
                                                    {new Date(log.createdAt).toLocaleDateString('en-PH', {
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="m-0 small text-muted">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </p>
                                            </td>
                                            {isSelect && (
                                                <td className="p-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedIds.has(log._id)}
                                                            onChange={() => toggleSelect(log._id)}
                                                            style={{ cursor: "pointer" }}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top p-3 bg-white">
                            <div className="text-muted small">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} logs
                            </div>
                            
                            <div className="d-flex gap-2 align-items-center">
                                <button 
                                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}>
                                    <i className="fa fa-chevron-left"></i>
                                    <span className="ms-2 small d-none d-lg-block">Previous</span>
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
                                    <span className="me-2 small d-none d-lg-block">Next</span>
                                    <i className="fa fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mt-5 bg-white border rounded shadow-sm p-5">
                        <p className="m-0 text-capitalize text-center small opacity-75">
                            {activityLogs.length === 0 ? "No activity logs yet" : "No logs match the selected filters"}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActivityLog;