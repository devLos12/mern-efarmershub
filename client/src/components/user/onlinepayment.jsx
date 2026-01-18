import React, { useContext, useRef, useState, useEffect } from "react";
import { useBreakpoint } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";

// ViewModal Component
const ViewModal = ({ isOpen, onClose, imageSrc, title, source }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const url = imageSrc;
        const fileName = source === "gcash" ? "gcash-qr.png" : "maya-qr.png";
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999}}
            onClick={onClose}
        >
            <div className="position-relative" 
            style={{maxWidth: "90%", maxHeight: "90vh"}} 
            onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-3 ">
                    <h5 className="text-white m-0">{title}</h5>

                    <div className="d-flex align-items-center gap-2">
                        {source && (
                            <button
                                type="button"
                                className="btn btn-dark rounded-circle"
                                onClick={handleDownload}
                                style={{width: "40px", height: "40px"}}
                            >
                                <i className="fa-solid fa-download text-white"></i>
                            </button>
                        )}

                        <button
                            className="btn btn-light rounded-circle"
                            onClick={onClose}
                            style={{width: "40px", height: "40px"}}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
                <img 
                    src={imageSrc} 
                    alt={title}
                    className="img-fluid rounded shadow-lg bg-white"
                    style={{maxHeight: "80vh", width: "auto"}}
                />
            </div>
        </div>
    );
};



const OnlinePayment = () => {
    const {checkoutForm, setCheckoutForm} = useContext(userContext);
    const [imgPreview, setImgPreview] = useState(null);
    const [viewFilePreview, setViewFilePreview] = useState(false);
    const [viewQrModal, setViewQrModal] = useState(false);
    const [gcashQr, setGcashQr] = useState(null);
    const [mayaQr, setMayaQr] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const fileUploadRef = useRef(null);
    const width = useBreakpoint();

    useEffect(() => {
        fetchQrCodes();
    }, []);
    
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
                if (gcashQr) setGcashQr(gcashQr.startsWith("https") ? gcashQr : `${import.meta.env.VITE_API_URL}/api/uploads/${gcashQr}`);
                if (mayaQr) setMayaQr(mayaQr.startsWith("https") ? mayaQr : `${import.meta.env.VITE_API_URL}/api/uploads/${mayaQr}`);
            }
        } catch (error) {
            console.error('Failed to fetch QR codes:', error);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleTextChange = (e) => {
        const {name, value} = e.target;
        setCheckoutForm((prev) => ({
           ...prev,
           [name]: value 
        }))
    }

    const handleFileChange = (e) => {
        const {name} = e.target;
        setCheckoutForm({
            ...checkoutForm,
            [name]: e.target.files[0]
        }) 

        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onload = (e) => {
                setImgPreview(e.target.result)
            }
            reader.readAsDataURL(file);
        }
    }

    const handleFileRemove = () => {
        setImgPreview(null);
        setCheckoutForm((prev) => ({
            ...prev,
            image: ""
        }));
        
        if(fileUploadRef.current){
            fileUploadRef.current.value = null;
        }
    }

    const handleFileClick = () => {
        if(imgPreview){
            setViewFilePreview(true);
        }
    }

    const paymentName = checkoutForm.payment === "gcash" ? "GCash" : "Maya";
    const paymentColor = checkoutForm.payment === "gcash" ? "primary" : "success";
    const currentQr = checkoutForm.payment === "gcash" ? gcashQr : mayaQr;

    if (fetchLoading) {
        return (
            <div className="container-fluid p-0 mt-2">
                <div className="text-center py-5">
                    <div className="spinner-border text-success mb-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted small">Loading QR Code...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0 mt-2">
            {/* Header */}
            <div className={`bg-${paymentColor} bg-opacity-10 rounded p-3 mb-3`}>
                <h6 className="m-0 fw-bold text-capitalize">
                    <i className={`fa-solid fa-${checkoutForm.payment === "gcash" ? "mobile" : "wallet"} me-2`}></i>
                    Complete {paymentName} Payment
                </h6>
            </div>

            {/* QR Code Section */}
            <div className="card shadow-sm mb-3">
                <div className="card-body p-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-6 col-md-7">
                            <p className="fw-bold mb-2 text-uppercase" style={{fontSize: "13px", letterSpacing: "0.5px"}}>
                                Payment Steps:
                            </p>
                            {[
                                `Open your ${paymentName} app`,
                                "Scan the QR code",
                                "Complete the payment",
                                "Upload screenshot as proof"
                            ].map((step, i) => (
                                <div key={i} className="d-flex align-items-start mb-2">
                                    <span className={`badge bg-${paymentColor} me-2`} style={{fontSize: "10px", minWidth: "20px"}}>
                                        {i + 1}
                                    </span>
                                    <span style={{fontSize: "13px"}}>{step}</span>
                                </div>
                            ))}
                            
                            <div className="alert alert-warning py-2 px-3 mb-0 mt-3" style={{fontSize: "11px"}}>
                                <i className="fa-solid fa-circle-info me-1"></i>
                                <strong>Tip:</strong> Click the QR code to view in full screen. You can also download it for easier scanning.
                            </div>
                        </div>
                        
                        <div className="col-6 col-md-5 text-center">
                            {currentQr ? (
                                <div className="position-relative d-inline-block">
                                    <img 
                                        src={currentQr}
                                        alt={`${paymentName} QR Code`}
                                        className="img-fluid rounded shadow" 
                                        onClick={() => setViewQrModal(true)} 
                                        style={{cursor: "pointer", maxHeight: "200px", border: "3px solid #f8f9fa"}}
                                    />
                                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2">
                                        <span className="badge bg-dark bg-opacity-75 px-3 py-2" style={{fontSize: "10px"}}>
                                            <i className="fa-solid fa-expand me-1"></i>
                                            Click to enlarge
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning" style={{fontSize: "12px"}}>
                                    <i className="fa-solid fa-exclamation-triangle me-1"></i>
                                    QR Code not available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Proof of Payment Section */}
            <div className="card shadow-sm">
                <div className="card-body p-3">
                    <p className="fw-bold mb-3 text-uppercase" style={{fontSize: "13px", letterSpacing: "0.5px"}}>
                        <i className="fa-solid fa-file-arrow-up me-2"></i>
                        Proof of Payment:
                    </p>
                    
                    {/* Upload Section */}
                    {!imgPreview ? (
                        <div className="text-center mb-3">
                            <div className="card p-4 bg-light shadow-sm rounded">
                                <p className="m-0 text-capitalize opacity-75" style={{fontSize: "13px"}}>
                                    Upload your file
                                </p>
                                <div className="fa-solid fa-cloud-arrow-up opacity-75 w-100 mt-2" 
                                style={{fontSize: "32px"}}></div>
                                
                                <label 
                                    htmlFor="inputFile" 
                                    className={`m-0 mt-2 rounded p-1 px-2 text-capitalize text-light bg-${paymentColor}`}
                                    style={{fontSize: "13px", cursor: "pointer"}}
                                >
                                    Browse file
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="d-flex align-items-center justify-content-between bg-light rounded p-3 mb-3 shadow-sm"
                            onClick={handleFileClick}
                            style={{cursor: "pointer"}}
                            title="Click to view"
                        >
                            <div className="d-flex align-items-center flex-grow-1">
                                <i className="fa-solid fa-file-image text-success me-3" style={{fontSize: "24px"}}></i>
                                <div className="flex-grow-1">
                                    <p className="m-0 fw-semibold text-break" 
                                        style={{
                                            fontSize: "12px",
                                            wordBreak: "break-word",
                                            overflowWrap: "break-word"
                                        }}>
                                        {checkoutForm.image?.name || "payment-proof.jpg"}
                                    </p>
                                    <p className="m-0 text-muted small" style={{fontSize: "11px"}}>
                                        Click to view • Ready to submit
                                    </p>
                                </div>
                            </div>
                            <button
                                className="btn btn-sm btn-outline-danger rounded-circle p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileRemove();
                                }}
                                style={{width: "32px", height: "32px"}}
                                title="Remove file"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    )}
                    
                    <input 
                        className="d-none"
                        ref={fileUploadRef} 
                        onChange={handleFileChange}
                        type="file"
                        id="inputFile" 
                        name="image"
                        accept="image/*,.pdf"
                    />

                    {/* Notes Section */}
                    <div>
                        <label className="form-label fw-semibold mb-2" style={{fontSize: "12px"}}>
                            <i className="fa-solid fa-note-sticky me-1"></i>
                            Additional Notes (Optional)
                        </label>
                        <textarea 
                            className="form-control border bg-light shadow-sm" 
                            style={{resize: "none", fontSize: "13px"}}
                            name="text" 
                            onChange={handleTextChange}
                            placeholder="Leave a note here..."
                            rows="4"
                        />
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {currentQr && (
                <ViewModal 
                    isOpen={viewQrModal}
                    onClose={() => setViewQrModal(false)}
                    imageSrc={currentQr}
                    title={`${paymentName} QR Code`}
                    source={checkoutForm?.payment}
                />
            )}

            {/* File Preview Modal */}
            <ViewModal 
                isOpen={viewFilePreview}
                onClose={() => setViewFilePreview(false)}
                imageSrc={imgPreview}
                title="Payment Proof Preview"
            />
        </div>
    )
}

export default OnlinePayment;