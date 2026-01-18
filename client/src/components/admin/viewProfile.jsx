import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ViewProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const accountId = location?.state?.accountId;
    const source = location?.state?.source;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultMessage, setResultMessage] = useState({ type: '', message: '' });
    const [showLicenseModal, setShowLicenseModal] = useState(false);




    useEffect(() => {
        if (accountId) {
            fetchViewProfile();
        }
    }, [accountId]);



    const fetchViewProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/viewProfile/${accountId}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message); 



            setProfile(data.profile);
            setError(null);
        } catch (error) {
            console.log("Error: ", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (action) => {
        setSelectedAction(action);
        setShowActionModal(true);
    };

    

    const handleVerificationAction = async () => {
        try {
            setActionLoading(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/updateVerification/${accountId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({ 
                        verification: selectedAction === 'approve' ? 'verified' : 'rejected' 
                    })
                }
            );
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            // Close action modal
            setShowActionModal(false);
            
            // Show success result modal
            setResultMessage({
                type: 'success',
                message: `${source === 'seller' ? 'Farmer' : 'Rider'} ${selectedAction}d successfully!`
            });
            setShowResultModal(true);
            
            // Auto close after 2 seconds
            setTimeout(() => {
                setShowResultModal(false);
                setResultMessage({ type: '', message: '' });
            }, 2000);
            
            // Refresh profile
            await fetchViewProfile();
            
        } catch (error) {
            console.log("Error: ", error.message);
            
            // Close action modal
            setShowActionModal(false);
            
            // Show error result modal
            setResultMessage({
                type: 'error',
                message: error.message || 'Something went wrong'
            });
            setShowResultModal(true);
            
            // Auto close after 2 seconds
            setTimeout(() => {
                setShowResultModal(false);
                setResultMessage({ type: '', message: '' });
            }, 2000);
            
        } finally {
            setActionLoading(false);
            setSelectedAction(null);
        }
    };











    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
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

    const getVerificationBadge = (verification) => {
        const badges = {
            verified: 'bg-success',
            pending: 'bg-warning',
            rejected: 'bg-danger'
        };
        return badges[verification] || 'bg-secondary';
    };

    if (loading) {
        return (
            <div className="p-3">
                <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-3">
                <div className="bg-white rounded shadow-sm border p-5 text-center">
                    <i className="fa fa-exclamation-triangle text-danger mb-3" style={{ fontSize: "48px" }}></i>
                    <h5 className="text-danger mb-3">Error Loading Profile</h5>
                    <p className="text-muted mb-4">{error || "Profile not found"}</p>
                    <button 
                        className="btn btn-success"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa fa-arrow-left me-2"></i>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const InfoRow = ({ label, value, lowercase, uppercase, capitalize }) => (
        <div className="mb-3">
            <p className="text-muted mb-1 small">{label}</p>
            <p className={`m-0 ${lowercase ? 'text-lowercase' : ''} ${uppercase ? 'text-uppercase' : ''} ${capitalize ? 'text-capitalize' : ''}`}>
                {value || "N/A"}
            </p>
        </div>
    );

    const getFullName = () => {
        if (!profile.firstname || !profile.lastname) return "N/A";
        return `${profile.firstname} ${profile.lastname}`;
    };

    const SectionTitle = ({ icon, title }) => (
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className={`${icon} text-success`}></i>
            <h6 className="m-0 fw-semibold text-success">{title}</h6>
        </div>
    );

    // Image Modal Component
    const ImageModal = () => (
        <>
            {showImageModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content bg-transparent border-0">
                            <div className="modal-header border-0 pb-0">
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white ms-auto" 
                                    onClick={() => setShowImageModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body text-center p-0">
                                <img 
                                    src={profile.imagePlateNumber}
                                    alt="Plate Number" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: "80vh", width: "auto" }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const LicenseModal = () => (
        <>
            {showLicenseModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowLicenseModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content bg-transparent border-0">
                            <div className="modal-header border-0 pb-0">
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white ms-auto" 
                                    onClick={() => setShowLicenseModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body text-center p-0">
                                <img 
                                    src={profile.licenseImage}
                                    alt="Driver's License" 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: "80vh", width: "auto" }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );


    // Result Modal Component
 

    // Action Modal Component
    const ActionModal = () => (
        <>
            {showActionModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">
                                    {selectedAction === 'approve' ? 'Approve' : 'Reject'} {source === 'seller' ? 'Farmer' : 'Rider'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => {
                                        setShowActionModal(false);
                                        setSelectedAction(null);
                                    }}
                                    disabled={actionLoading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center py-3">
                                    <i className={`fa ${selectedAction === 'approve' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} mb-3`} 
                                    style={{ fontSize: "64px" }}></i>
                                    <h6 className="mb-3">
                                        Are you sure you want to {selectedAction} this {source === 'seller' ? 'farmer' : 'rider'}?
                                    </h6>
                                    <p className="text-muted mb-0">
                                        This action will update the verification status of <strong>{getFullName()}</strong>.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowActionModal(false);
                                        setSelectedAction(null);
                                    }}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${selectedAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                    onClick={handleVerificationAction}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className={`fa ${selectedAction === 'approve' ? 'fa-check' : 'fa-times'} me-2`}></i>
                                            {selectedAction === 'approve' ? 'Approve' : 'Reject'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const ResultModal = () => (
        <>
            {showResultModal && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content">
                            <div className="modal-body text-center py-4">
                                <i className={`fa ${resultMessage.type === 'success' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} mb-3`} 
                                style={{ fontSize: "64px" }}></i>
                                <h6 className="mb-0">{resultMessage.message}</h6>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );








    // Render based on account type
    const renderUserProfile = () => (
        <>
            {/* Basic Information */}
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-user" title="Basic Information" />
                <div className="row g-3">
                    <div className="col-md-6">
                        <InfoRow label="Account ID" value={profile.accountId} />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Buyer Name" value={getFullName()} capitalize />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Email" value={profile.email} lowercase />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Created At" value={formatDate(profile.createdAt)} />
                    </div>
                </div>
            </div>

            {/* Billing Address */}
            {profile.billingAddress && Object.keys(profile.billingAddress).some(key => profile.billingAddress[key]) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Billing Address" />
                    <div className="row g-3">
                        <div className="col-md-6">
                            <InfoRow label="First Name" value={profile.billingAddress.firstname} capitalize />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Last Name" value={profile.billingAddress.lastname} capitalize />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Email" value={profile.billingAddress.email} lowercase />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Contact" value={profile.billingAddress.contact} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="Province" value={profile.billingAddress.province} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="City" value={profile.billingAddress.city} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="Barangay" value={profile.billingAddress.barangay} />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Zip Code" value={profile.billingAddress.zipCode} />
                        </div>
                        <div className="col-12">
                            <InfoRow label="Detailed Address" value={profile.billingAddress.detailAddress} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const renderSellerProfile = () => (
        <>
            {/* Basic Information */}
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-store" title="Farmer Information" />
                <div className="row g-3">
                    <div className="col-md-6">
                        <InfoRow label="Account ID" value={profile.accountId} />
                    </div>
                    <div className="col-md-6">
                        <div className="mb-3">
                            <p className="text-muted mb-1 small">Verification Status</p>
                            <span className={`badge ${getVerificationBadge(profile.verification)}`}>
                                {profile.verification ? profile.verification.toUpperCase() : "PENDING"}
                            </span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Farmer Name" value={getFullName()} capitalize />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Email" value={profile.email} lowercase />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Contact" value={profile.contact} />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Created At" value={formatDate(profile.createdAt)} />
                    </div>
                </div>
            </div>

            {/* E-Wallet Information */}
            {profile.e_WalletAcc && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-wallet" title="E-Wallet Account" />
                    <div className="row g-3">
                        <div className="col-md-6">
                            <InfoRow label="Wallet Type" value={profile.e_WalletAcc.type} uppercase />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Account Number" value={profile.e_WalletAcc.number} />
                        </div>
                    </div>
                </div>
            )}

            {/* Seller Address */}
            {profile.sellerAddress && Object.keys(profile.sellerAddress).some(key => profile.sellerAddress[key]) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Business Address" />
                    <div className="row g-3">
                        <div className="col-md-4">
                            <InfoRow label="Province" value={profile.sellerAddress.province} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="City" value={profile.sellerAddress.city} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="Barangay" value={profile.sellerAddress.barangay} />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Zip Code" value={profile.sellerAddress.zipCode} />
                        </div>
                        <div className="col-12">
                            <InfoRow label="Detailed Address" value={profile.sellerAddress.detailAddress} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    const renderRiderProfile = () => (
        <>
            {/* Basic Information */}
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-bicycle" title="Rider Information" />
                <div className="row g-3">
                    <div className="col-md-6">
                        <InfoRow label="Account ID" value={profile.accountId} />
                    </div>
                    <div className="col-md-6">
                        <div className="mb-3">
                            <p className="text-muted mb-1 small">Verification Status</p>
                            <span className={`badge ${getVerificationBadge(profile.verification)}`}>
                                {profile.verification ? profile.verification.toUpperCase() : "PENDING"}
                            </span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Rider Name" value={getFullName()} capitalize />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Email" value={profile.email} lowercase />
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Contact" value={profile.contact} />
                    </div>
                    <div className="col-md-6">
                        <div className="mb-3">
                            <p className="text-muted mb-1 small">Delivery Status</p>
                            <span className={`badge ${
                                profile.status === 'available' ? 'bg-success' : 
                                profile.status === 'on delivery' ? 'bg-primary' : 'bg-secondary'
                            }`}>
                                {profile.status?.toUpperCase() || 'OFFLINE'}
                            </span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <InfoRow label="Created At" value={formatDate(profile.createdAt)} />
                    </div>
                </div>
            </div>
            {/* Rider Address */}
            {profile.riderAddress && Object.keys(profile.riderAddress).some(key => profile.riderAddress[key]) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Rider Address" />
                    <div className="row g-3">
                        <div className="col-md-4">
                            <InfoRow label="Province" value={profile.riderAddress.province} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="City" value={profile.riderAddress.city} />
                        </div>
                        <div className="col-md-4">
                            <InfoRow label="Barangay" value={profile.riderAddress.barangay} />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Zip Code" value={profile.riderAddress.zipCode} />
                        </div>
                        <div className="col-12">
                            <InfoRow label="Detailed Address" value={profile.riderAddress.detailAddress} />
                        </div>
                    </div>
                </div>
            )}

            {/* E-Wallet Information */}
            {profile.e_WalletAcc && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-wallet" title="E-Wallet Account" />
                    <div className="row g-3">
                        <div className="col-md-6">
                            <InfoRow label="Wallet Type" value={profile.e_WalletAcc.type} uppercase />
                        </div>
                        <div className="col-md-6">
                            <InfoRow label="Account Number" value={profile.e_WalletAcc.number} />
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicle Information */}
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-motorcycle" title="Vehicle Information" />
                <div className="row g-3">
                    <div className="col-md-6">
                        <InfoRow label="Plate Number" value={profile.plateNumber} uppercase />
                    </div>
                    {profile.imagePlateNumber && (
                        <div className="col-12">
                            <p className="text-muted mb-2 small">Plate Number Image</p>
                            <div 
                                className="w-100 border rounded shadow-sm p-2 position-relative" 
                                style={{
                                    maxWidth: "200px",
                                    cursor: "pointer"
                                }}
                                onClick={() => setShowImageModal(true)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div className="border shadow-sm rounded" 
                                        style={{ 
                                            width: "45px", 
                                            height: "45px", 
                                            overflow: "hidden",
                                            flexShrink: 0
                                        }}
                                    >
                                        <img
                                            src={profile.imagePlateNumber}
                                            alt="Plate Number"
                                            className="h-100 w-100"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div className="flex-grow-1" style={{minWidth: 0}}>
                                        <p className="m-0 fw-bold text-truncate"
                                            style={{fontSize: "0.75rem"}}
                                        >
                                            {profile.imagePlateNumber?.split('/').pop() || 'plate_image.jpg'}
                                        </p>
                                        <p className="m-0 text-muted" style={{fontSize: "0.65rem"}}>Image</p>
                                    </div>
                                </div>
                            </div>
                            <small className="text-muted d-block mt-2" style={{fontSize: "0.7rem"}}>
                                <i className="fa fa-info-circle me-1"></i>
                                Click to view full size
                            </small>
                        </div>
                    )}


                    {profile.licenseImage && (
                        <div className="col-12">
                            <p className="text-muted mb-2 small">Driver's License Image</p>
                            <div 
                                className="w-100 border rounded shadow-sm p-2 position-relative" 
                                style={{
                                    maxWidth: "200px",  
                                    cursor: "pointer"
                                }}
                                onClick={() => setShowLicenseModal(true)}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div className="border shadow-sm rounded" 
                                        style={{ 
                                            width: "45px", 
                                            height: "45px", 
                                            overflow: "hidden",
                                            flexShrink: 0
                                        }}
                                    >
                                        <img
                                            src={profile.licenseImage}
                                            alt="Driver's License"
                                            className="h-100 w-100"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div className="flex-grow-1" style={{minWidth: 0}}>
                                        <p className="m-0 fw-bold text-truncate"
                                            style={{fontSize: "0.75rem"}}
                                        >
                                            {profile.licenseImage?.split('/').pop() || 'license_image.jpg'}
                                        </p>
                                        <p className="m-0 text-muted" style={{fontSize: "0.65rem"}}>Image</p>
                                    </div>
                                </div>
                            </div>
                            <small className="text-muted d-block mt-2" style={{fontSize: "0.7rem"}}>
                                <i className="fa fa-info-circle me-1"></i>
                                Click to view full size
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderAdminProfile = () => (
        <div className="bg-white rounded shadow-sm border p-4 mb-3">
            <SectionTitle icon="fa fa-user-shield" title="Admin Information" />
            <div className="row g-3">
                <div className="col-md-6">
                    <InfoRow label="Account ID" value={profile.accountId} />
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <p className="text-muted mb-1 small">Admin Type</p>
                        <span className={`badge ${profile.adminType === 'main' ? 'bg-success' : 'bg-secondary'}`}>
                            {profile.adminType ? profile.adminType.toUpperCase() : "SUB"}
                        </span>
                    </div>
                </div>
                <div className="col-md-6">
                    <InfoRow label="Email" value={profile.email} lowercase />
                </div>
                <div className="col-md-6">
                    <InfoRow label="Contact" value={profile.contact} />
                </div>
                <div className="col-md-6">
                    <InfoRow label="Created At" value={formatDate(profile.createdAt)} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-3">
            {/* Header */}
            <div className="bg-white rounded shadow-sm border mb-3 p-3">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            className="btn btn-outline-success"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <div>
                            <h5 className="m-0 fw-bold">
                                {source === 'user' ? 'Buyer' : 
                                source === 'seller' ? 'Farmer' :
                                source === 'rider' ? 'Rider' : 'Admin'} Profile
                            </h5>
                            <p className="m-0 small text-muted">View account information</p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {/* Action Buttons for Seller and Rider */}
                        {(source === 'seller' || source === 'rider') && profile.verification === 'pending' && (
                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn-success btn-sm"
                                    onClick={() => openActionModal('approve')}
                                >
                                    <i className="fa fa-check me-2"></i>
                                    Approve
                                </button>
                                <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => openActionModal('reject')}
                                >
                                    <i className="fa fa-times me-2"></i>
                                    Reject
                                </button>
                            </div>
                        )}
                        
                        {/* Profile Image */}
                        {profile.imageFile && (
                            <img 
                                src={profile.imageFile} 
                                alt="Profile" 
                                className="rounded-circle border-success border-2 "
                                style={{ width: "70px", height: "70px", objectFit: "cover" }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            {source === 'user' && renderUserProfile()}
            {source === 'seller' && renderSellerProfile()}
            {source === 'rider' && renderRiderProfile()}
            {source === 'admin' && renderAdminProfile()}

            {/* Image Modal */}
            <ImageModal />
            <LicenseModal />
            <ActionModal />
            <ResultModal />
        </div>
    );
};

export default ViewProfile;