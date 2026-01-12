import React, { useState, useEffect, useMemo } from 'react';

const DamageLog = () => {
    const [damageLogs, setDamageLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Success modal animation
    useEffect(() => {
        if (showSuccessModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);

    // Debounce search
    useEffect(() => {
        const result = setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return () => clearTimeout(result);
    }, [search]);

    // Fetch damage logs
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getDamageLogs`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            setDamageLogs(data.damageLogs || []);
        })
        .catch((err) => {
            console.log("Error:", err.message);
            setErrorMessage("Failed to fetch damage logs: " + err.message);
            setShowErrorModal(true);
        });
    }, [refresh]);

    // Filter damage logs
    const filteredDamageLogs = useMemo(() => {
        if(!debouncedSearch) return damageLogs;

        return damageLogs.filter((log) => {
            const firstname = (log.rider?.firstname || "").toLowerCase();
            const lastname = (log.rider?.lastname || "").toLowerCase();
            const fullName = `${firstname} ${lastname}`.toLowerCase();
            const riderEmail = (log.rider?.email || "").toLowerCase();
            const order = (log.order || "").toLowerCase();

            return fullName.includes(debouncedSearch) || 
                   firstname.includes(debouncedSearch) ||
                   lastname.includes(debouncedSearch) ||
                   riderEmail.includes(debouncedSearch) ||
                   order.includes(debouncedSearch);
        });
    }, [damageLogs, debouncedSearch]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDamageLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDamageLogs.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Toggle select all
    const toggleSelectAll = () => {
        setIsAllSelected((prev) => {
            const newValue = !prev;
            if(newValue) {
                const allIds = new Set(filteredDamageLogs.map((log) => log._id));
                setSelectedIds(allIds);
            } else {
                setSelectedIds(new Set());
            }
            return newValue;
        });
    };

    // Toggle select individual
    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            setIsAllSelected(updated.size === filteredDamageLogs.length);
            return updated;
        });
    };

    // Delete selected
    const handleDeleteClick = () => {
        if(selectedIds.size === 0) return alert("No items selected");
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async() => {
        setIsDeleting(true);
        const sendData = [...selectedIds];

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deleteDamageLogs`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ items: sendData }),
                credentials: "include"
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            setShowDeleteModal(false);
            setDamageLogs((prev) => prev.filter((log) => !selectedIds.has(log._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);
            
            setSuccessMessage(data.message);
            setShowSuccessModal(true);
        } catch (error) {
            console.log("Error:", error.message);
            setShowDeleteModal(false);
            setErrorMessage("Failed to delete damage logs: " + error.message);
            setShowErrorModal(true);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mt-1">
            {/* Success Modal */}
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
                        <p className="small text-muted mb-0">{successMessage}</p>
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
                            width: "90%"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-times-circle text-danger" style={{ fontSize: "60px" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2 text-danger">
                            Error!
                        </h5>
                        <p className="small text-muted mb-3">{errorMessage}</p>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setShowErrorModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div 
                    className="modal fade show d-block" 
                    style={{backgroundColor: "rgba(0,0,0,0.5)"}}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">
                                    <i className="fa fa-trash text-danger me-2"></i>
                                    Confirm Delete
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="m-0">
                                    Are you sure you want to delete {selectedIds.size} damage log{selectedIds.size > 1 ? 's' : ''}?
                                </p>
                                <p className="m-0 small text-muted mt-2">
                                    <i className="fa fa-exclamation-triangle me-1"></i>
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-trash me-2"></i>
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Actions Bar */}
            <div className="row g-0 bg-white border rounded p-2 px-2 px-lg-4 gap-2 mb-2">
                <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                    <input 
                        type="search" 
                        placeholder="Search Rider, Order..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-control border-2"
                        style={{outline: "none", fontSize: "14px"}}
                    />
                </div>
                <div className="col">
                    <div>
                        <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                            {selectedIds.size > 0 && (
                                <button 
                                    className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm"
                                    onClick={handleDeleteClick}
                                    style={{cursor: "pointer"}}
                                >
                                    delete
                                </button>
                            )}

                            <button 
                                className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1"
                                onClick={() => setRefresh((prev) => !prev)}
                            >
                                <i className="fa fa-sync small text-dark"></i>
                                <p className="m-0 small text-capitalize">refresh</p>
                            </button>

                            <button 
                                className="btn-dark text-white small p-1 text-capitalize rounded border-0 shadow-sm"
                                onClick={() => {
                                    setIsAllSelected(false);
                                    setSelectedIds(new Set());
                                    setIsSelect((prev) => !prev);
                                }}
                                style={{cursor: "pointer", width: "100px"}}
                            >
                                {isSelect ? "hide select" : "show select"}
                            </button>
                        </div>
                        <p className="m-0 small opacity-50 text-end mt-2">
                            {`${selectedIds.size} selected from ${filteredDamageLogs.length} Total`}
                        </p>
                    </div>
                </div>
            </div>

                                
            {/* Table */}
            <div className="bg-white rounded shadow-sm border" style={{height: "calc(100vh - 250px)", overflow: "auto"}}>
                {filteredDamageLogs.length === 0 ? (
                    <div className="mt-5">
                        <p className="m-0 text-capitalize text-center small opacity-75">no damage logs found</p>
                    </div>
                ) : (
                    <table className="w-100">
                        <thead className="position-sticky top-0 z-1 bg-white">
                            <tr>
                                {["#", "Rider Name", "Order ID", "Item Damaged", "Damage Value", "Rider Liability", 
                                "Notes", "Date Created"].map((header, i) => (
                                    <th 
                                        key={i}
                                        className={`text-capitalize p-3 text-success small ${i === 0 && "text-center"}`}
                                    >
                                        {header}
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
                                                    style={{cursor: "pointer"}}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((log, i) => (
                                <tr key={log._id}>
                                    <td className="text-center p-3 small">{indexOfFirstItem + i + 1}</td>
                                    <td className="text-capitalize p-3 small">
                                        {`${log.rider?.firstname || ""} ${log.rider?.lastname || ""}`.trim() || "N/A"}
                                        <p className="m-0 text-lowercase opacity-75 small">{log.rider?.email || ""}</p>
                                    </td>
                                    <td className="p-3 small">{log.order}</td>
                                    <td className="p-3 small">{log.itemDamaged}</td>
                                    <td className="p-3 small">
                                        ₱{log.damageValue.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                    <td className="p-3 small">
                                        ₱{log.riderLiability.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                    {/* <td className="text-capitalize p-3 small">
                                        <span className={`badge ${
                                            log.status === 'pending' ? 'bg-warning' :
                                            log.status === 'paid' ? 'bg-success' :
                                            'bg-secondary'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td> */}
                                    <td className="p-3 small" style={{maxWidth: "200px"}}>
                                        <p className="m-0 text-truncate" title={log.notes}>
                                            {log.notes || "-"}
                                        </p>
                                    </td>
                                    <td className="p-3 small">
                                        {new Date(log.createdAt).toLocaleDateString('en-PH', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    {isSelect && (
                                        <td className="p-3">
                                            <div className="d-flex align-items-center justify-content-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedIds.has(log._id)}
                                                    onChange={() => toggleSelect(log._id)}
                                                    style={{cursor: "pointer"}}
                                                />
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {filteredDamageLogs.length > 0 && (
                <div className="d-flex justify-content-between align-items-center border-top p-3 bg-white mt-2">
                    <div className="text-muted small">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDamageLogs.length)} of {filteredDamageLogs.length} damage logs
                    </div>
                    
                    <div className="d-flex gap-2 align-items-center">
                        <button 
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
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
                            <span className="me-2 small d-none d-lg-block">Next</span>
                            <i className="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DamageLog;