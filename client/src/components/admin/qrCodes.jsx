import React, { useState, useEffect } from "react";
import Model from "../modal";
import imageCompression from 'browser-image-compression';



const QrCodes = () => {
    const [gcashQr, setGcashQr] = useState(null);
    const [mayaQr, setMayaQr] = useState(null);
    const [gcashPreview, setGcashPreview] = useState(null);
    const [mayaPreview, setMayaPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);



    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'gcash' or 'maya'



    // Function para mag-open ng delete confirmation
    const confirmDelete = (type) => {
        setDeleteType(type);
        setShowDeleteModal(true);
    };

    // Function para sa "No" button
    const handleDeleteNo = () => {
        setShowDeleteModal(false);
        setDeleteType(null);
    };

    // Function para sa "Yes" button
    const handleDeleteYes = () => {
        setShowDeleteModal(false);
        removeImage(deleteType);
    };


    useEffect(() => {
        fetchQrCodes();
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

    const fetchQrCodes = async () => {
        try {
            setFetchLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/getQrCodes`, {
                method: "GET",
                credentials: "include"
            });
            const data = await response.json();
            
            if (data.success) {
                const { gcashQr, mayaQr } = data.data;
                if (gcashQr) setGcashPreview(gcashQr);
                if (mayaQr) setMayaPreview(mayaQr);
            }
        } catch (error) {
            console.error('Failed to fetch QR codes:', error);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'gcash') {
                    setGcashQr(file);
                    setGcashPreview(reader.result);
                } else {
                    setMayaQr(file);
                    setMayaPreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = async (type) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/deleteQr/${type}`, 
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            const data = await response.json();
            
            if (data.success) {
                if (type === 'gcash') {
                    setGcashQr(null);
                    setGcashPreview(null);
                } else {
                    setMayaQr(null);
                    setMayaPreview(null);
                }
                setModalMessage(data.message || 'QR Code removed successfully!');
                setShowSuccessModal(true);
            } else {
                setModalMessage(data.message || 'Failed to remove QR Code');
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Delete error:', error);
            setModalMessage('An error occurred while removing the QR Code');
            setShowErrorModal(true);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            const formData = new FormData();
            if (gcashQr) formData.append('gcashQr', gcashQr);
            if (mayaQr) formData.append('mayaQr', mayaQr);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/updateQrCodes`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if(!response.ok) throw new Error(data.message);

            if (data.success) {
                setGcashQr(null);
                setMayaQr(null);
                setModalMessage(data.message || 'QR Codes saved successfully!');
                setShowSuccessModal(true);
            } 
        } catch (error) {
            console.error('Save error:', error);
            setModalMessage(error.message || 'Failed to save QR Codes');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const getImageSrc = (preview) => {
        if (!preview) return null;
        if (preview.startsWith('data:')) return preview;

        return preview;
    };

    if (fetchLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                <div className="text-center">
                    <div className="spinner-border text-success" role="status">     
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="small text-muted mt-2">Loading qr codes...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showDeleteModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex: 10000 }}>
                    <Model 
                        textModal={`Do you want to remove this ${deleteType === 'gcash' ? 'GCash' : 'Maya'} QR code?`}
                        handleClickNo={handleDeleteNo}
                        handleClickYes={handleDeleteYes}
                    />
                </div>
            )}


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

            <div className="min-vh-100 bg-light py-5">
                <div className="container">
                    {/* Header */}
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                            <i className="fa-solid fa-qrcode text-success" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                        <p className="m-0 fw-bold text-dark mb-2 fs-4">Payment QR Codes</p>
                        <p className="text-muted mb-0">Upload and manage your payment QR codes</p>
                    </div>

                    {/* QR Cards */}
                    <div className="row g-4 justify-content-center mb-4">
                        {/* GCash Card */}
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden">
                                <div className="card-body p-4">
                                    {/* Header */}
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                                            style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' }}>
                                            <span className="text-white fw-bold fs-3">G</span>
                                        </div>
                                        <div>
                                            <h5 className="mb-0 fw-bold text-dark">GCash</h5>
                                            <small className="text-muted">E-Wallet Payment</small>
                                        </div>
                                    </div>

                                    {/* Upload Area */}
                                    {!gcashPreview ? (
                                        <label className=" border-2 border-primary border-dashed rounded-3 p-5 d-flex flex-column align-items-center text-center position-relative overflow-hidden" 
                                            style={{ cursor: 'pointer', backgroundColor: '#f8fbff', transition: 'all 0.3s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e7f3ff'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fbff'}>
                                            <div className="mb-3">
                                                <i className="fa-solid fa-cloud-arrow-up text-primary" style={{ fontSize: '3.5rem' }}></i>
                                            </div>
                                            <p className="fw-semibold text-dark mb-2">Upload GCash QR Code</p>
                                            <p className="text-muted small mb-0">PNG, JPG up to 5MB</p>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleFileSelect(e, 'gcash')}
                                                className="d-none"
                                            />
                                        </label>
                                    ) : (
                                        <div>
                                            <div className="rounded-3 overflow-hidden mb-3" style={{ backgroundColor: '#f8fbff' }}>
                                                <img 
                                                    src={getImageSrc(gcashPreview)} 
                                                    alt="GCash QR" 
                                                    className="img-fluid w-100"
                                                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => confirmDelete('gcash')}
                                                className="btn btn-sm text-danger w-100 d-flex align-items-center justify-content-center gap-2"
                                                style={{ border: 'none', background: 'transparent' }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                                <span>Remove QR Code</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Maya Card */}
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 overflow-hidden">
                                <div className="card-body p-4">
                                    {/* Header */}
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                                            style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #198754 0%, #146c43 100%)' }}>
                                            <span className="text-white fw-bold fs-3">M</span>
                                        </div>
                                        <div>
                                            <h5 className="mb-0 fw-bold text-dark">Maya</h5>
                                            <small className="text-muted">E-Wallet Payment</small>
                                        </div>
                                    </div>

                                    {/* Upload Area */}
                                    {!mayaPreview ? (
                                        <label className="border-2 border-success border-dashed rounded-3 p-5 d-flex flex-column align-items-center text-center position-relative overflow-hidden" 
                                            style={{ cursor: 'pointer', backgroundColor: '#f0fdf4', transition: 'all 0.3s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                                            <div className="mb-3">
                                                <i className="fa-solid fa-cloud-arrow-up text-success" style={{ fontSize: '3.5rem' }}></i>
                                            </div>
                                            <p className="fw-semibold text-dark mb-2">Upload Maya QR Code</p>
                                            <p className="text-muted small mb-0">PNG, JPG up to 5MB</p>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleFileSelect(e, 'maya')}
                                                className="d-none"
                                            />
                                        </label>
                                    ) : (
                                        <div>
                                            <div className="rounded-3 overflow-hidden mb-3" style={{ backgroundColor: '#f0fdf4' }}>
                                                <img 
                                                    src={getImageSrc(mayaPreview)} 
                                                    alt="Maya QR" 
                                                    className="img-fluid w-100"
                                                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => confirmDelete('maya')}
                                                className="btn btn-sm text-danger w-100 d-flex align-items-center justify-content-center gap-2"
                                                style={{ border: 'none', background: 'transparent' }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                                <span>Remove QR Code</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button - Show only if there are NEW uploads (File objects) */}
                    {(gcashQr || mayaQr) && (
                        <div className="text-center" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-success btn-small p-2 rounded-4 shadow-sm fw-semibold"
                                style={{ minWidth: '200px', transition: 'all 0.3s ease' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check-circle me-2"></i>
                                        Save QR Codes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default QrCodes;