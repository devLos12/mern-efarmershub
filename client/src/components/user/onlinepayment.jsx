import React, { useContext, useRef, useState, useEffect } from "react";
import { useBreakpoint } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";

// ViewModal Component
const ViewModal = ({ isOpen, onClose, imageSrc, title, source }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const fileName = source === "gcash" ? "gcash-qr.png" : "maya-qr.png";
        const link = document.createElement("a");
        link.href = imageSrc;
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
            <div className="position-relative w-100" style={{maxHeight: "90vh"}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between px-5 align-items-center mb-3">
                    <h5 className="text-white m-0">{title}</h5>
                    <div className="d-flex align-items-center gap-2">
                        {source && (
                            <button type="button" className="btn btn-dark rounded-circle" onClick={handleDownload} style={{width: "40px", height: "40px"}}>
                                <i className="fa-solid fa-download text-white"></i>
                            </button>
                        )}
                        <button className="btn btn-light rounded-circle" onClick={onClose} style={{width: "40px", height: "40px"}}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
                <div className="d-flex w-100 justify-content-center">
                    <img src={imageSrc} alt={title} className="img-fluid rounded shadow-lg bg-white" style={{maxHeight: "80vh", width: "auto"}}/>
                </div>
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

    // ✅ BAGONG STATES PARA SA AI VALIDATION
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null); // { isValid, reason }

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
        setCheckoutForm((prev) => ({ ...prev, [name]: value }));
    };


    
    // ✅ AI VALIDATION — i-call ang backend route
    const validateReceipt = async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("paymentMethod", checkoutForm.payment); // ← dagdag ito — "gcash" or "maya"

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/validate-receipt`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        return await response.json();
    };


    // ✅ UPDATED handleFileChange — may AI validation na
    const handleFileChange = async (e) => {
        const { name } = e.target;
        const file = e.target.files[0];
        if (!file) return;

        // File type check
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type! Please upload PNG or JPG only.');
            if (fileUploadRef.current) fileUploadRef.current.value = null;
            return;
        }

        // File size check
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size too large! Maximum size is 5MB.');
            if (fileUploadRef.current) fileUploadRef.current.value = null;
            return;
        }

        // Show preview agad habang nagva-validate
        const reader = new FileReader();
        reader.onload = (ev) => setImgPreview(ev.target.result);
        reader.readAsDataURL(file);

        // Start AI validation
        setValidating(true);
        setValidationResult(null);

        try {
            const result = await validateReceipt(file);

            if (!result.isValid) {
                // ❌ Hindi valid — i-reject at i-clear
                setValidationResult({ isValid: false, reason: result.reason });
                setImgPreview(null);
                setCheckoutForm((prev) => ({ ...prev, image: "" }));
                if (fileUploadRef.current) fileUploadRef.current.value = null;
            } else {
                // ✅ Valid receipt — i-accept
                setValidationResult({ isValid: true, reason: result.reason });
                setCheckoutForm((prev) => ({ ...prev, [name]: file }));
            }
        } catch (error) {
            // Kung mag-error ang AI (network issue etc.), i-allow na lang
            console.error("AI Validation error:", error);
            setValidationResult(null);
            setCheckoutForm((prev) => ({ ...prev, [name]: file }));
        } finally {
            setValidating(false);
        }
    };

    const handleFileRemove = () => {
        setImgPreview(null);
        setValidationResult(null);
        setCheckoutForm((prev) => ({ ...prev, image: "" }));
        if (fileUploadRef.current) fileUploadRef.current.value = null;
    };

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
                                    <span className={`badge bg-${paymentColor} me-2`} style={{fontSize: "10px", minWidth: "20px"}}>{i + 1}</span>
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

                    {/* ✅ AI VALIDATING INDICATOR */}
                    {validating && (
                        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{fontSize: "12px"}}>
                            <div className="spinner-border spinner-border-sm text-info" role="status">
                                <span className="visually-hidden">Validating...</span>
                            </div>
                            <span>Validating your receipt via AI, please wait...</span>
                        </div>
                    )}

                    {/* ✅ VALIDATION RESULT — success or error badge */}
                    {!validating && validationResult && (
                        <div
                            className={`alert py-2 px-3 mb-3 d-flex align-items-center gap-2 ${validationResult.isValid ? "alert-success" : "alert-danger"}`}
                            style={{fontSize: "12px"}}
                        >
                            <i className={`fa-solid ${validationResult.isValid ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
                            <span>
                                <strong>{validationResult.isValid ? "Valid receipt!" : "Invalid image!"}</strong>
                                {" "}{validationResult.reason}
                            </span>
                        </div>
                    )}

                    {/* Upload area */}
                    {!imgPreview ? (
                        <div className="text-center mb-3">
                            <div className="card p-4 bg-light shadow-sm rounded">
                                <p className="m-0 text-capitalize opacity-75" style={{fontSize: "13px"}}>
                                    Upload your file
                                </p>
                                <div className="fa-solid fa-cloud-arrow-up opacity-75 w-100 mt-2" style={{fontSize: "32px"}}></div>
                                <label 
                                    htmlFor="inputFile" 
                                    className={`m-0 mt-2 rounded p-1 px-2 text-capitalize text-light bg-${paymentColor} ${validating ? "opacity-50 pe-none" : ""}`}
                                    style={{fontSize: "13px", cursor: validating ? "not-allowed" : "pointer"}}
                                >
                                    {validating ? "Validating..." : "Browse file"}
                                </label>
                            </div>
                        </div>
                    ) : (
                        /* Preview card — thumbnail + filename */
                        <div
                            className="d-flex align-items-center gap-3 bg-light rounded p-2 mb-3 shadow-sm border"
                            style={{cursor: "pointer"}}
                            onClick={() => setViewFilePreview(true)}
                            title="Click to view"
                        >
                            {/* Thumbnail */}
                            <div className="rounded overflow-hidden flex-shrink-0 border" style={{width: "56px", height: "56px"}}>
                                <img
                                    src={imgPreview}
                                    alt="receipt preview"
                                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                                />
                            </div>

                            {/* Filename + hint */}
                            <div className="flex-grow-1 overflow-hidden">
                                <p className="m-0 fw-semibold text-truncate" style={{fontSize: "12px"}}>
                                    {checkoutForm.image?.name || "payment-proof.jpg"}
                                </p>
                                <p className="m-0 text-muted" style={{fontSize: "11px"}}>
                                    Click to view • Ready to submit
                                </p>
                            </div>

                            {/* Remove */}
                            <button
                                className="btn btn-sm btn-outline-danger rounded-circle p-0 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); handleFileRemove(); }}
                                style={{width: "30px", height: "30px"}}
                                title="Remove"
                            >
                                <i className="fa-solid fa-xmark" style={{fontSize: "12px"}}></i>
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
                        accept="image/png, image/jpg, image/jpeg"
                        disabled={validating}
                    />

                    {/* Notes */}
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
    );
};

export default OnlinePayment;