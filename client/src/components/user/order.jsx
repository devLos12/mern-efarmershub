import React, { useContext, useState, useRef, useEffect } from "react";
import { useBreakpointHeight } from "../../components/breakpoint";
import { useNavigate } from "react-router-dom";
import { userContext } from "../../context/userContext";

const Order = () => {
    const { orders, error, setOrders,  setTrigger } = useContext(userContext);
    const height = useBreakpointHeight();
    const navigate = useNavigate();
    
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [otherReason, setOtherReason] = useState("");
    
    // Refund details states
    const [refundMethod, setRefundMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [qrCode, setQrCode] = useState(null);
    
    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    const fileInputRef = useRef(null);

    const cancelReasons = [
        "Changed my mind",
        "Found a better price elsewhere",
        "Ordered by mistake",
        "Delivery time too long",
        "Product no longer needed",
        "Other"
    ];

    // Handle modal animation
    useEffect(() => {
        if (showSuccessModal || showErrorModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowSuccessModal(false);
                    setShowErrorModal(false);
                }, 300);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal, showErrorModal]);

    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setShowCancelModal(true);
    };

    const handleQrCodeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrCode(file);
        }
    };

    const handleRemoveQrCode = () => {
        setQrCode(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const showError = (message) => {
        setModalMessage(message);
        setShowErrorModal(true);
    };

    const showSuccess = (message) => {
        setModalMessage(message);
        setShowSuccessModal(true);
    };

    const handleCancelSubmit = async () => {
        const finalReason = cancelReason === "Other" ? otherReason : cancelReason;
        
        if (!finalReason.trim()) {
            showError("Please provide a cancellation reason");
            return;
        }

        const isCashOnDelivery = selectedOrder.paymentType?.toLowerCase() === "cash on delivery";

        // Validation for non-COD orders (need refund details)
        if (!isCashOnDelivery) {
            if (!refundMethod) {
                showError("Please select a refund method");
                return;
            }
            if (!accountName.trim()) {
                showError("Please provide account name");
                return;
            }
            if (!accountNumber.trim()) {
                showError("Please provide account number");
                return;
            }
        }

        try {
            const formData = new FormData();
            formData.append('reason', finalReason);
            // Add refund details only if not COD
            if (!isCashOnDelivery) {
                formData.append('refundMethod', refundMethod);
                formData.append('accountName', accountName);
                formData.append('accountNumber', accountNumber);
                
                if (qrCode) {
                    formData.append('qrCode', qrCode);
                }
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cancelOrder/${selectedOrder._id}`, {
                method: 'POST',
                body: formData,
                credentials: "include"
            });
            
            const data = await response.json();
            if(!response.ok) throw new Error(data.message);

            if (data.success) {
                showSuccess(data.message);
                resetModal();
                setOrders((prev) => ({
                    ...prev, 
                    trigger: !prev.trigger
                }));
                setTrigger((prev) => !prev);
            } 

        } catch (error) {
            showError(error.message);
        }
    };

    const resetModal = () => {
        setShowCancelModal(false);
        setCancelReason("");
        setOtherReason("");
        setRefundMethod("");
        setAccountName("");
        setAccountNumber("");
        setQrCode(null);
        setSelectedOrder(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const closeModal = () => {
        resetModal();
    };

    const isCashOnDelivery = selectedOrder?.paymentType?.toLowerCase() === "cash on delivery";

    return (
        <>
            {orders.data?.length > 0 ? (
                <div className="container-fluid rounded">
                    <div className="row">
                        <div className="col-12 d-flex justify-content-between align-items-center">
                            <p className="m-0 fs-4 p-2 text-success fw-bold text-capitalize">my order</p>
                        </div>
                    </div>
                    <div className="row" style={{ height: height - 150, overflowY: "auto", overflowX: "" }}>
                        {orders.data?.map((data, i) => {
                            const currentStatus = data.statusHistory.find((item) => item.status === data.statusDelivery);
                            const isPending = data.statusDelivery.toLowerCase() === "pending";

                            return (
                                <div key={i} className="py-4 px-3 border-top border-2">
                                    <div className="row g-0 bg p-2 rounded px-3">
                                        <div className="d-flex align-items-center">
                                            <div className="fa fa-truck me-2 small"></div>
                                            <p className="fw-bold m-0 text-capitalize small">{currentStatus.status}</p>
                                        </div>
                                        <span className="m-0 text-capitalize opacity-75 small">{currentStatus.description}</span>
                                    </div>

                                    {data.orderItems.map((item, i) => {
                                        if (i === 0) {
                                            return (
                                                <div key={i} className="row position-relative mt-4">
                                                    <div className="col-5">
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL}/api/uploads/${item.imageFile}`}
                                                            alt={data.imageFile}
                                                            className="rounded img-fluid shadow-sm border"
                                                        />
                                                    </div>

                                                    <div className="col">
                                                        <div>
                                                            <p className="m-0 fw-bold text-capitalize">{item.prodName}</p>
                                                            <p className="m-0 opacity-75 text-capitalize small">{item.prodDisc}</p>
                                                            <p className="m-0 fw-bold opacity-75" style={{ fontSize: "14px" }}>
                                                                {item.quantity + "x"}
                                                            </p>
                                                            <div className="d-flex justify-content-end">
                                                                <div className="d-flex small">
                                                                    <p className="m-0 text-capitalize">total: </p>
                                                                    <p className="m-0 ms-2 text-end opacity-75 text-capitalize bold fw-bold">
                                                                        {`₱${data.totalPrice.toLocaleString("en-PH") + ".00"}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}

                                    {data.orderItems.length > 1 && (
                                        <p className="m-0 text-capitalize fs-6">
                                            {data.orderItems.length - 1} more item{data.orderItems.length - 1 > 1 ? "s" : ""}
                                        </p>
                                    )}

                                    <div className="d-flex gap-2 mt-3">
                                        <button
                                            className="p-2 rounded bg-dark text-white text-capitalize flex-grow-1 small border-0"
                                            onClick={() => {
                                                navigate("orderdetails", { state: { orderId: data._id } });
                                            }}
                                        >
                                            view details
                                        </button>

                                        {/* {isPending && (
                                            <button
                                                className="p-2 rounded bg-danger text-white text-capitalize small border-0"
                                                style={{ width: "100px" }}
                                                onClick={() => handleCancelClick(data)}
                                                disabled={data.statusDelivery === "cancelled"}
                                            >
                                                cancel
                                            </button>
                                        )} */}
                                    </div>
                                </div>
                            );
                                        })}
                    </div>
                </div>
            ) : (
                <div className="row rounded h-100 d-flex align-items-center">
                    <div className="col-12">
                        <p className="m-0 text-center opacity-75 text-capitalize">{error.order}</p>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded shadow d-flex flex-column"
                        style={{ maxWidth: "500px", width: "90%", maxHeight: "85vh" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed */}
                        <div className="p-4 border-bottom">
                            <h5 className="fw-bold text-capitalize mb-0">cancel order</h5>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-4 overflow-auto flex-grow-1">
                            <p className="small opacity-75 mb-3">Please select a reason for cancellation:</p>

                            <div className="mb-3">
                                {cancelReasons.map((reason, i) => (
                                    <div key={i} className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="cancelReason"
                                            id={`reason-${i}`}
                                            value={reason}
                                            checked={cancelReason === reason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                        />
                                        <label className="form-check-label small" htmlFor={`reason-${i}`}>
                                            {reason}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {cancelReason === "Other" && (
                                <textarea
                                    className="form-control mb-3 small"
                                    rows="3"
                                    placeholder="Please specify your reason..."
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                />
                            )}

                            {/* Refund Details Section - Only show if NOT Cash on Delivery */}
                            {!isCashOnDelivery && (
                                <div className="border-top pt-3 mt-3">
                                    <h6 className="fw-bold text-capitalize mb-3 small">refund details</h6>
                                    <p className="small opacity-75 mb-3">Your payment will be refunded. Please provide your account details:</p>

                                    {/* Refund Method Dropdown */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Refund Method *</label>
                                        <select
                                            className="form-select small"
                                            value={refundMethod}
                                            onChange={(e) => setRefundMethod(e.target.value)}
                                            disabled={!cancelReason || (cancelReason === "Other" && !otherReason.trim())}
                                        >
                                            <option value="">Select refund method</option>
                                            <option value="GCash">GCash</option>
                                            <option value="Maya">Maya</option>
                                        </select>
                                    </div>

                                    {/* Account Name */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Account Name *</label>
                                        <input
                                            type="text"
                                            className="form-control small"
                                            placeholder="Enter account name"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            disabled={!refundMethod}
                                        />
                                    </div>

                                    {/* Account Number */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Account Number *</label>
                                        <div className="input-group">
                                            <span className="input-group-text small">+63</span>
                                            <input
                                                type="text"
                                                className="form-control small"
                                                placeholder="9XXXXXXXXX"
                                                value={accountNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    if (value.length <= 10) {
                                                        setAccountNumber(value);
                                                    }
                                                }}
                                                disabled={!refundMethod}
                                                maxLength="10"
                                            />
                                        </div>
                                        <small className="text-muted d-block mt-1">Enter 10-digit mobile number (without +63)</small>
                                    </div>

                                    {/* QR Code Upload (Optional) */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">QR Code (Optional)</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="form-control small"
                                            accept="image/*"
                                            onChange={handleQrCodeChange}
                                            disabled={!refundMethod}
                                        />
                                        {qrCode && (
                                            <div className="mt-3">
                                                <div className="d-flex align-items-start gap-2">
                                                    <img 
                                                        src={URL.createObjectURL(qrCode)} 
                                                        alt="QR Code Preview" 
                                                        className="img-fluid rounded border"
                                                        style={{ width: "150px", height: "150px", objectFit: "cover" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={handleRemoveQrCode}
                                                    >
                                                        <i className="fa fa-times"></i>
                                                    </button>
                                                </div>
                                                <small className="text-success d-block mt-2">
                                                    {qrCode.name}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-4 border-top">
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-secondary text-capitalize flex-grow-1 small"
                                    onClick={closeModal}
                                >
                                    back
                                </button>
                                <button
                                    className="btn btn-danger text-capitalize flex-grow-1 small"
                                    onClick={handleCancelSubmit}
                                    disabled={
                                        !cancelReason || 
                                        (cancelReason === "Other" && !otherReason.trim()) ||
                                        (!isCashOnDelivery && (!refundMethod || !accountName.trim() || !accountNumber.trim()))
                                    }
                                >
                                    confirm cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        <h5 className="fw-bold text-capitalize mb-2">success!</h5>
                        <p className="small text-muted mb-0">{modalMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
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
                            <i className="fa fa-times-circle text-danger" style={{ fontSize: "60px" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2">error!</h5>
                        <p className="small text-muted mb-0">{modalMessage}</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default Order;