import { useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext.jsx";

// ViewModal Component
const ViewModal = ({ isOpen, onClose, imageSrc, title }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999}}
            onClick={onClose}
        >
            <div className="position-relative" 
                style={{maxWidth: "90%", maxHeight: "90vh"}} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-white m-0">{title}</h5>
                    <button
                        className="btn btn-light rounded-circle"
                        onClick={onClose}
                        style={{width: "40px", height: "40px"}}
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
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




const OrderDetails = () => {
    const { role } = useContext(appContext);
    const location = useLocation();
    const orderId = location.state?.orderId || null;
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState({ id: "", name: "" });
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [viewProofModal, setViewProofModal] = useState(false);
    const [viewQRModal, setViewQRModal] = useState(false);
    const [refundReceipt, setRefundReceipt] = useState(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

    // Cancellation/Rejection Modal States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelAction, setCancelAction] = useState(null); // 'cancel-order' or 'reject-refund'
    const [cancelReason, setCancelReason] = useState("");
    const [cancelProofImage, setCancelProofImage] = useState(null);
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [cancelImagePreview, setCancelImagePreview] = useState(null); // NEW
    const cancelFileInputRef = useRef(null); // NEW - add sa imports: import { useRef }


    const [isModalVisible, setIsModalVisible] = useState(false);



    // Replacement Request States
    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [selectedItemsForReplacement, setSelectedItemsForReplacement] = useState([]);
    const [replacementData, setReplacementData] = useState({});
    const [isSubmittingReplacement, setIsSubmittingReplacement] = useState(false);

        // Add new state for view mode
    const [isViewMode, setIsViewMode] = useState(false);
    

    const [isUpdatingReplacement, setIsUpdatingReplacement] = useState(false);


    // After existing states, add these:
    const [replacementReview, setReplacementReview] = useState({});
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");









    
    useEffect(() => {
        if (!orderId) {
            navigate("/", { replace: true });
        }
    }, [orderId, navigate]);



    // Helper function: Check if order can show replacement section
    const canShowReplacementSection = () => {
        if (!orderData?.statusDelivery) return false;
        
        const hasAnyReplacementRequest = orderData.orderItems?.some(
            item => item.replacement?.isRequested === true
        );
        
        // For admin: show if may replacement request
        if (role === "admin") {
            return hasAnyReplacementRequest;
        }
        
        // For user: show if delivered OR may replacement request
        if (role === "user") {
            const isDelivered = orderData.statusDelivery.toLowerCase() === "delivered";
            return isDelivered || hasAnyReplacementRequest;
        }
        
        return false;
    };


    // Update the condition to show different button based on replacement status
    const hasReplacementRequest = orderData?.orderItems?.some(
        item => item.replacement?.isRequested === true
    );





    // Function to open modal in view mode
    const handleViewReplacementRequest = () => {
        setIsViewMode(true);
        
        const itemsWithReplacement = orderData.orderItems.filter(
            item => item.replacement?.isRequested === true
        );
        
        setSelectedItemsForReplacement([]);
        
        const reviewData = {};
        itemsWithReplacement.forEach(item => {
            reviewData[item._id] = {
                decision: item.replacement.status === 'approved' ? 'approve' : 
                        item.replacement.status === 'rejected' ? 'reject' : '',
                faultAssignedTo: item.replacement.fault?.assignedTo || '',
                faultDetails: item.replacement.fault?.details || '',
                notes: item.replacement.notes || ''
            };
        });
        
        setReplacementReview(reviewData);
        setShowReplacementModal(true);
    };




    // Function to open modal in request mode
    const handleRequestReplacement = () => {
        setIsViewMode(false);
        setSelectedItemsForReplacement([]);
        setReplacementData({});
        setShowReplacementModal(true);
    };





    const isWithin24Hours = () => {
        if (orderData.statusDelivery !== "delivered") return false;
        
        const deliveredStatus = orderData.statusHistory.find(
            item => item.status === "delivered"
        );
        
        if (!deliveredStatus) return false;
        
        // ✅ ADD CURRENT YEAR
        const currentYear = new Date().getFullYear();
        const dateString = `${deliveredStatus.date} ${currentYear} ${deliveredStatus.timestamp}`;
        
        
        const deliveredDate = new Date(dateString);
        
        if (isNaN(deliveredDate.getTime())) {
            return false;
        }
        
        
        const now = new Date();
        const hoursDiff = (now - deliveredDate) / (1000 * 60 * 60);
        
        
        return hoursDiff <= 24;
    };





    // Handle item selection for replacement
    const handleToggleItemForReplacement = (item) => {
        const itemId = item._id || item.prodId;
        
        if (selectedItemsForReplacement.includes(itemId)) {
            // Remove item
            setSelectedItemsForReplacement(prev => prev.filter(id => id !== itemId));
            setReplacementData(prev => {
                const newData = {...prev};
                delete newData[itemId];
                return newData;
            });
        } else {
            // Add item
            setSelectedItemsForReplacement(prev => [...prev, itemId]);
            setReplacementData(prev => ({
                ...prev,
                [itemId]: {
                    reason: "",
                    description: "",
                    images: []
                }
            }));
        }
    };

    // Handle replacement data change
    const handleReplacementDataChange = (itemId, field, value) => {
        setReplacementData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };


    // NEW function - add after handleReplacementDataChange
    const handleReviewDataChange = (itemId, field, value) => {
        setReplacementReview(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };






    // Handle image upload for replacement
    const handleReplacementImageUpload = (itemId, files) => {
        const fileArray = Array.from(files);
        setReplacementData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                images: [...(prev[itemId].images || []), ...fileArray]
            }
        }));
    };


    // Remove replacement image
    const handleRemoveReplacementImage = (itemId, index) => {
        setReplacementData(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                images: prev[itemId].images.filter((_, i) => i !== index)
            }
        }));
    };


    
    // Submit replacement request
    const handleSubmitReplacementRequest = async () => {
        // Validate
        for (let itemId of selectedItemsForReplacement) {
            if (!replacementData[itemId]?.reason?.trim()) {
                alert("Please provide a reason for each selected item");
                return;
            }
        }
        
        setIsSubmittingReplacement(true);
        
        try {
            const formData = new FormData();
            formData.append("orderId", orderData._id);
            formData.append("replacementItems", JSON.stringify(
                selectedItemsForReplacement.map(itemId => ({
                    itemId,
                    reason: replacementData[itemId].reason,
                    description: replacementData[itemId].description
                }))
            ));
            
            // Append images
            selectedItemsForReplacement.forEach(itemId => {
                const images = replacementData[itemId]?.images || [];
                images.forEach((img, idx) => {
                    formData.append(`replacement_images_${itemId}`, img);
                });
            });
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/requestReplacement`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            // Success
            setShowReplacementModal(false);
            setSuccessMessage("Replacement request submitted successfully!");
            setShowSuccessModal(true);
            
            // Reset states
            setSelectedItemsForReplacement([]);
            setReplacementData({});
            
            // Refresh order details
            fetchOrderDetails();
            
        } catch (error) {
            console.log(error.message);
            alert("Failed to submit replacement request: " + error.message);
        } finally {
            setIsSubmittingReplacement(false);
        }
    };



    // NEW function - add after handleSubmitReplacementRequest
    const handleSubmitReplacementReview = async () => {

        

        // Validate that all items have decisions
        for (let itemId of selectedItemsForReplacement) {
            if (!replacementReview[itemId]?.decision) {
                alert("Please make a decision (Approve/Reject) for all items");
                return;
            }
            
            // If approved, fault assignment is required
            if (replacementReview[itemId].decision === 'approve' && 
                !replacementReview[itemId].faultAssignedTo) {
                alert("Please assign fault for approved items");
                return;
            }
        }
        
        setIsSubmittingReview(true);
        
        try {
            const reviewItems = selectedItemsForReplacement.map(itemId => ({
                itemId,
                decision: replacementReview[itemId].decision,
                faultAssignedTo: replacementReview[itemId].faultAssignedTo || 'none',
                faultDetails: replacementReview[itemId].faultDetails || '',
                notes: replacementReview[itemId].notes || ''
            }));
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviewReplacement`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId: orderData._id,
                    reviewItems
                }),
                credentials: "include"
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            // Success
            setShowReplacementModal(false);
            setSuccessMessage("Replacement review submitted successfully!");
            setShowSuccessModal(true);
            
            // Reset states
            setReplacementReview({});
            
            // Refresh order details
            fetchOrderDetails();
            
        } catch (error) {
            console.log(error.message);
            setErrorMessage("Failed to submit review: " + error.message);
            setShowErrorModal(true);
        } finally {
            setIsSubmittingReview(false);
        }
    };







    // Get replacement status label
    const getReplacementStatusLabel = (status) => {
        const labels = {
            "replacement requested": "Pending Review",
            "replacement confirmed": "Confirmed",
            "packing": "Packing",
            "ready to deliver": "Ready to Deliver",
            "ready for pick up": "Ready for Pick Up",
            "in transit": "In Transit",
            "delivered": "Delivered",
            "completed": "Completed",
            "complete": "Complete"
        };
        return labels[status] || status;
    };



    // Get replacement status flow
    const getReplacementStatusFlow = () => {
        // After "replacement confirmed", use normal statuses
        if (orderData.orderMethod === "delivery") {
            return ["replacement requested", "replacement confirmed", "packing", "ready to deliver"];
        } else {
            return ["replacement requested", "replacement confirmed", "packing", "ready for pick up"];
        }
    };


    // Get current replacement step index
    const getCurrentReplacementStepIndex = () => {
        const status = orderData.statusDelivery;
        const flow = getReplacementStatusFlow();
        const index = flow.indexOf(status);
        
        if (index !== -1) return index;
        
        // Normal statuses mean replacement is done
        if (status === "in transit" || status === "delivered" || 
            status === "completed" || status === "complete") {
            return flow.length - 1;
        }
        
        return 0;
    };



    

    // Get next replacement status
    const getNextReplacementStatus = () => {
        const flow = getReplacementStatusFlow();
        const currentIndex = getCurrentReplacementStepIndex();
        
        if (currentIndex >= flow.length - 1) return null;
        if (orderData.statusDelivery === "replacement in transit" || 
            orderData.statusDelivery === "replacement completed") return null;
        
        return flow[currentIndex + 1] || null;
    };

    // Check if can proceed replacement
    const canProceedReplacement = () => {
        const nextStatus = getNextReplacementStatus();
        if (!nextStatus) return false;
        
        // Check rider assignment if moving to ready to deliver
        if (nextStatus === "replacement ready to deliver" && 
            orderData.orderMethod === "delivery" && 
            !selectedRider?.id) {
            return false;
        }
        
        return true;
    };




    // Handle replacement status update
    const handleReplacementStatusUpdate = async (newStatus) => {
        // Validate rider assignment for delivery orders
        if (newStatus === "ready to deliver" && !selectedRider?.id.trim() && orderData.orderMethod === "delivery") {
            return alert("Please select a rider first");
        }

        setIsUpdatingReplacement(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateStatusDelivery`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId: orderData._id,
                    newStatus,
                    assignRider: selectedRider
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Show success modal
            setSuccessMessage(`Replacement status updated to "${getReplacementStatusLabel(newStatus)}"`);
            setShowSuccessModal(true);

            // Refresh order details
            fetchOrderDetails();

        } catch (error) {
            console.log(error.message);
            alert("Failed to update replacement status: " + error.message);
        } finally {
            setIsUpdatingReplacement(false);
        }
    };











    // Handle opening cancel/reject modal
    const handleOpenCancelModal = (actionType) => {
        setCancelAction(actionType);
        setCancelReason("");
        setCancelProofImage(null);
        setCancelImagePreview(null); // NEW
        setShowCancelModal(true);
    };

    // NEW - Handle image file change with preview
    const handleCancelImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCancelProofImage(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setCancelImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // NEW - Handle remove image
    const handleRemoveCancelImage = () => {
        setCancelProofImage(null);
        setCancelImagePreview(null);
        if (cancelFileInputRef.current) {
            cancelFileInputRef.current.value = ""; // Clear input file value
        }
    };

    // Handle cancel/reject submission
    const handleSubmitCancelAction = async () => {
        if (!cancelReason.trim()) {
            return alert("Please provide a reason");
        }

        setIsSubmittingCancel(true);

        try {
            const formData = new FormData();
            formData.append("orderId", orderData._id);
            formData.append("reason", cancelReason);
            
            if (cancelProofImage) {
                formData.append("image", cancelProofImage); // Changed from 'proofImage' to 'image'
            }

            let endpoint = "";
            let successMsg = "";

            if (cancelAction === "cancel-order") {
                endpoint = "cancelStatusDelivery"; // Updated endpoint
                formData.append('newStatus', "cancelled");
                successMsg = "Order has been cancelled successfully";

            } else if (cancelAction === "reject-refund") {
                endpoint = "rejectfundStatus";
                formData.append("refundStatus", "refund rejected");
                successMsg = "Refund request has been rejected";
            }


            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, {
                method: "PATCH",
                body: formData,
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Close modal and show success
            setShowCancelModal(false);
            setSuccessMessage(data.message);
            setShowSuccessModal(true);

            // Clear states
            handleRemoveCancelImage();
            
            // Refresh order details
            fetchOrderDetails();

        } catch (error) {
            console.log(error.message);
            alert("Failed to process action: " + error.message);
        } finally {
            setIsSubmittingCancel(false);
        }
    };










    // Fetch riders
    useEffect(() => {
        if (role === "admin") {
            fetch(`${import.meta.env.VITE_API_URL}/api/availableRider`, {
                method: "GET",
                credentials: "include"
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    return data;
                })
                .then((data) => {
                    setRiders(data);
                })
                .catch((error) => console.log("Error: ", error.message));
        }
    }, [role]);





    // Handle success modal animation
    useEffect(() => {
        if (showSuccessModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            // Auto-close after 2 seconds
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowSuccessModal(false);
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);



    
    const fetchOrderDetails = () => {
        const endPoint = role === "admin" ? "getOrderDetails"
            : role === "seller" ? "getSellerOrderDetails"
                : "getUserOrderDetails";

        fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`, {
            method: "GET",
            credentials: "include"
        })
            .then(async (res) => {
                if (res.status === 404) {
                    navigate("/", { replace: true });
                }
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                return data;
            })
            .then((data) => {
                setLoading(false);
                setOrderData(data);
                // Set initial rider if already assigned
                if (data.riderName) {
                    setSelectedRider({ id: data.riderId || "", name: data.riderName });
                }
            })
            .catch((err) => {
                setLoading(false);
                console.log(err.message);
            });
    };



    useEffect(() => {
        fetchOrderDetails();
    }, [orderId, role, navigate]);





    const handleStatusUpdate = async (newStatus) => {
        // Validate rider assignment for delivery orders
        if (newStatus === "ready to deliver" && !selectedRider?.id.trim() && orderData.orderMethod === "delivery") {
            return alert("Please select a rider first");
        }

        setIsUpdating(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateStatusDelivery`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId: orderData._id,
                    newStatus,
                    assignRider: selectedRider
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Show success modal
            setSuccessMessage(`Order status successfully updated to "${getStatusLabel(newStatus)}"`);
            setShowSuccessModal(true);

            // Refresh order details to get updated data
            fetchOrderDetails();

        } catch (error) {
            console.log(error.message);
            alert("Failed to update status: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };


    const handleRefundStatusUpdate = async (newRefundStatus) => {
        setIsUpdating(true);   


        try {
            const formData = new FormData();
            formData.append("orderId", orderData._id);
            formData.append("refundStatus", newRefundStatus);
            
            // If moving to processing and there's a receipt, upload it
            if (newRefundStatus === "completed" && refundReceipt) {
                formData.append("refundReceipt", refundReceipt);
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateRefundStatus`, {
                method: "PATCH",
                body: formData,
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Show success modal
            setSuccessMessage(`Refund status successfully updated to "${getRefundStatusLabel(newRefundStatus)}"`);
            setShowSuccessModal(true);

            // Clear receipt file
            setRefundReceipt(null);

            // Refresh order details to get updated data
            fetchOrderDetails();
            
        } catch (error) {
            console.log(error.message);
            alert("Failed to update refund status: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!orderId) return null;
    if (loading) return <p></p>;

    const shippingFee = orderData?.orderMethod === "delivery" ? 30 : 0;
    const currentStatus = orderData.statusHistory.find((item) => item.status === orderData.statusDelivery) || "";


    const noPaymentProof = (data) => {
        if (data.proofOfPayment.image === "pending"
            && data.proofOfPayment.textMessage === "n/a") return true;
        return false;
    };

    // Define status progression based on order method
    const getStatusFlow = () => {
        if (orderData.orderMethod === "delivery") {
            return ["pending", "confirm", "packing", "ready to deliver"];
        } else {
            return ["pending", "confirm", "packing", "ready for pick up", "completed"];
        }
    };

    const statusFlow = getStatusFlow();
    
    // Get current step index - steps that are COMPLETED
    const getCurrentStepIndex = () => {
        const status = orderData.statusDelivery;
        const index = statusFlow.indexOf(status);
        
        // If status is in the flow, that step is completed
        if (index !== -1) {
            return index;
        }
        
        // If status is beyond our control (rider statuses), all steps are completed
        if (status === "in transit" || status === "delivered" || status === "complete") {
            return statusFlow.length - 1;
        }
        
        return -1;
    };

    const currentStepIndex = getCurrentStepIndex();
    const isCompleted = orderData.statusDelivery === "complete" || orderData.statusDelivery === "complete" ;
    const isCancelled = orderData.statusDelivery === "refund requested";
    const isRefundCompleted = orderData.statusDelivery === "refund completed";
    const isRefundRejected = orderData.statusDelivery === "refund rejected";
    const normalCancel = orderData.statusDelivery === "cancelled"
    const isReplacement = orderData.statusDelivery === "replacement requested";
    const isReplacementConfirmed = orderData.statusDelivery === "replacement confirmed";

    // Add after line 98 (after isReplacementConfirmed)
    const isReplacementRejected = orderData.statusDelivery === "replacement rejected" ;
    const isReplacementProcessing = orderData.statusDelivery === "replacement confirmed" || isReplacementRejected;




    // Get next status
    const getNextStatus = () => {
        if (isCancelled || isCompleted) return null;
        
        // If we're at the last step in our flow, no next status
        if (currentStepIndex >= statusFlow.length - 1) return null;
        
        // If status is handled by rider, no next status for admin/seller
        if (orderData.statusDelivery === "in transit" || 
            orderData.statusDelivery === "delivered") return null;
        
        return statusFlow[currentStepIndex + 1] || null;
    };

    const nextStatus = getNextStatus();

    // Check if can proceed to next status
    const canProceed = () => {
        if (isCancelled || isCompleted || !nextStatus) return false;
        if (nextStatus === "ready to deliver" && orderData.orderMethod === "delivery" && !selectedRider?.id) {
            return false;
        }
        return true;
    };

    // Status display names
    const getStatusLabel = (status) => {
        const labels = {
            "pending": "Pending",
            "confirm": "Confirmed",
            "packing": "Packing",
            "ready to deliver": "Ready to Deliver",
            "ready for pick up": "Ready for Pick Up",
            "delivered": "Delivered",
            "completed": "Completed",
            "complete": "Complete",
            "cancelled": "Cancelled",
            "cancel": "Cancelled"
        };
        return labels[status] || status;
    };

    // Refund status labels
    const getRefundStatusLabel = (status) => {
        const labels = {
            "pending": "Pending",
            "processing": "Processing",
            "completed": "Completed",
            "rejected": "Rejected",
            "not_applicable": "Not Applicable"
        };
        return labels[status] || status;
    };

    // Get next refund status
    const getNextRefundStatus = () => {
        if (!orderData.cancellation?.refund) return null;
        
        const currentRefundStatus = orderData.cancellation.refund.status;
        const refundFlow = ["pending", "processing", "completed"];
        const currentIndex = refundFlow.indexOf(currentRefundStatus);
        
        if (currentIndex === -1 || currentIndex >= refundFlow.length - 1) return null;
        
        return refundFlow[currentIndex + 1];
    };

    const nextRefundStatus = getNextRefundStatus();
        



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
                        <p className="small text-muted mb-0">{successMessage}</p>
                    </div>
                </div>
            )}

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


            {/* Proof of Payment Modal */}
            <ViewModal 
                isOpen={viewProofModal}
                onClose={() => setViewProofModal(false)}
                imageSrc={
                    orderData.proofOfPayment.image.startsWith("https")
                    ? orderData.proofOfPayment.image
                    : `${import.meta.env.VITE_API_URL}/api/uploads/${orderData.proofOfPayment.image}`}
                title="Proof of Payment"
            />

            {/* Cancel/Reject Modal */}
            {showCancelModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                            <div className="modal-header border-0" style={{ flexShrink: 0 }}>
                                <h5 className="modal-title text-capitalize">
                                    <i className={`fa ${cancelAction === 'cancel-order' ? 'fa-times-circle text-danger' : 'fa-ban text-warning'} me-2`}></i>
                                    {cancelAction === 'cancel-order' ? 'Cancel Order' : 'Reject Refund'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        handleRemoveCancelImage();
                                    }}
                                    disabled={isSubmittingCancel}
                                ></button>
                            </div>
                            
                            {/* Scrollable Body */}
                            <div className="modal-body" style={{ overflowY: "auto", flexGrow: 1 }}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        Reason <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Provide a reason for this action..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        disabled={isSubmittingCancel}
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        Attach Proof (Optional)
                                    </label>
                                    
                                    {cancelImagePreview ? (
                                        <div className="mt-3">
                                            <div className="d-flex align-items-start gap-2">
                                                <img 
                                                    src={cancelImagePreview} 
                                                    alt="Proof Preview" 
                                                    className="img-fluid rounded border"
                                                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={handleRemoveCancelImage}
                                                    disabled={isSubmittingCancel}
                                                >
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            </div>
                                            <small className="text-success d-block mt-2">
                                                {cancelProofImage.name}
                                            </small>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                ref={cancelFileInputRef}
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={handleCancelImageChange}
                                                disabled={isSubmittingCancel}
                                            />
                                            <small className="text-muted d-block mt-1">
                                                <i className="fa fa-info-circle me-1"></i>
                                                Upload an image as proof (JPG, PNG, etc.)
                                            </small>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Sticky Footer */}
                            <div className="modal-footer border-0" style={{ flexShrink: 0 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        handleRemoveCancelImage();
                                    }}
                                    disabled={isSubmittingCancel}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${cancelAction === 'cancel-order' ? 'btn-danger' : 'btn-warning'}`}
                                    onClick={handleSubmitCancelAction}
                                    disabled={isSubmittingCancel || !cancelReason.trim()}
                                >
                                    {isSubmittingCancel ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-check me-2"></i>
                                            Confirm {cancelAction === 'cancel-order' ? 'Cancellation' : 'Rejection'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* QR Code Modal */}
            {orderData.cancellation?.refund?.qrCode && (
                <ViewModal 
                    isOpen={viewQRModal}
                    onClose={() => setViewQRModal(false)}
                    imageSrc={`${import.meta.env.VITE_API_URL}/api/uploads/${orderData.cancellation.refund.qrCode}`}
                    title="Refund QR Code"
                />
            )}

            {/* Replacement Request Modal */}
            {showReplacementModal && (
                <div className="modal fade show d-block" style={{backgroundColor: "rgba(0,0,0,0.6)"}}>
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                           <div className={`modal-header ${isViewMode ? 'bg-info bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                                <h5 className="modal-title">
                                    <i className={`fa ${isViewMode ? 'fa-eye' : 'fa-exchange'} me-2`}></i>
                                    {isViewMode ? 'Replacement Request Details' : 'Request Product Replacement'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowReplacementModal(false);
                                        setIsViewMode(false);
                                    }}
                                    disabled={!isViewMode && isSubmittingReplacement}
                                ></button>
                            </div>
                            

                            <div className="modal-body p-4">
                                {/* ========== REQUEST FORM (User) ========== */}
                                {!isViewMode && role === "user" ? (
                                    <>

                                    <p className="text-muted small mb-3">
                                        <i className="fa fa-info-circle me-1"></i>
                                        Select items you want to request a replacement for and provide details for each.
                                    </p>
                                    
                                    <div className="row g-3">
                                        {orderData.orderItems
                                            .filter(item => !item.replacement?.isRequested)
                                            .map((item, idx) => {
                                                const itemId = item._id || item.prodId;
                                                const isSelected = selectedItemsForReplacement.includes(itemId);
                                                
                                                return (
                                                    <div key={idx} className="col-12">
                                                        <div className={`border rounded p-3 ${isSelected ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light'}`}>
                                                            <div className="d-flex align-items-start gap-3">
                                                                <img 
                                                                    src={
                                                                        `${import.meta.env.VITE_API_URL}/api/Uploads/${item.imageFile}`}
                                                                    alt={item.prodName}
                                                                    className="rounded border"
                                                                    style={{width: "80px", height: "80px", objectFit: "cover"}}
                                                                />
                                                                
                                                                <div className="flex-grow-1">
                                                                    <p className="m-0 fw-bold">{item.prodName}</p>
                                                                    <p className="m-0 small text-muted">{item.pid}</p>
                                                                    <p className="m-0 small mt-1">
                                                                        {item.quantity} bundle(s) • ₱{item.prodPrice.toLocaleString('en-PH')}.00
                                                                    </p>
                                                                </div>

                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input mt-1"
                                                                    style={{width: "20px", height: "20px", cursor: "pointer"}}
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleItemForReplacement(item)}
                                                                />
                                                            </div>
                                                            
                                                            {isSelected && (
                                                                <div className="mt-3 pt-3 border-top">
                                                                    <div className="mb-3">
                                                                        <label className="form-label small fw-bold">
                                                                            Reason for Replacement <span className="text-danger">*</span>
                                                                        </label>
                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            value={replacementData[itemId]?.reason || ''}
                                                                            onChange={(e) => handleReplacementDataChange(itemId, 'reason', e.target.value)}
                                                                        >
                                                                            <option value="">Select reason...</option>
                                                                            <option value="Rotten/Spoiled Produce">Rotten/Spoiled Produce</option>
                                                                            <option value="Wilted/Not Fresh">Wilted/Not Fresh</option>
                                                                            <option value="Bruised/Damaged">Bruised/Damaged</option>
                                                                            <option value="Wrong Item">Wrong Item</option>
                                                                            <option value="Incomplete Bundle">Incomplete Bundle</option>
                                                                            <option value="Poor Quality">Poor Quality</option>
                                                                            <option value="Pest/Insect Damage">Pest/Insect Damage</option>
                                                                            <option value="Underweight/Short Measure">Underweight/Short Measure</option>
                                                                            <option value="Overripe">Overripe</option>
                                                                            <option value="Underripe">Underripe</option>
                                                                            <option value="Contaminated/Dirty">Contaminated/Dirty</option>
                                                                            <option value="Mixed/Wrong Variety">Mixed/Wrong Variety</option>
                                                                            <option value="Expired Product">Expired Product</option>
                                                                            <option value="Packaging Issue">Packaging Issue</option>
                                                                            <option value="Late Delivery">Late Delivery</option>
                                                                            <option value="Temperature Issue">Temperature Issue</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                    </div>
                                                                    
                                                                    <div className="mb-3">
                                                                        <label className="form-label small fw-bold">Description (Optional)</label>
                                                                        <textarea
                                                                            className="form-control form-control-sm"
                                                                            rows="2"
                                                                            placeholder="Provide more details about the issue..."
                                                                            value={replacementData[itemId]?.description || ''}
                                                                            onChange={(e) => handleReplacementDataChange(itemId, 'description', e.target.value)}
                                                                        ></textarea>
                                                                    </div>
                                                                    
                                                                    <div className="mb-2">
                                                                        <label className="form-label small fw-bold">Upload Photos (Optional)</label>
                                                                        <input
                                                                            type="file"
                                                                            className="form-control form-control-sm"
                                                                            accept="image/*"
                                                                            multiple
                                                                            onChange={(e) => handleReplacementImageUpload(itemId, e.target.files)}
                                                                        />
                                                                        <small className="text-muted d-block mt-1">
                                                                            <i className="fa fa-camera me-1"></i>
                                                                            Upload photos showing the issue (max 5 images per item)
                                                                        </small>
                                                                    </div>
                                                                    
                                                                    {replacementData[itemId]?.images?.length > 0 && (
                                                                        <div className="d-flex gap-2 flex-wrap mt-2">
                                                                            {replacementData[itemId].images.map((img, imgIdx) => (
                                                                                <div key={imgIdx} className="position-relative">
                                                                                    <img
                                                                                        src={URL.createObjectURL(img)}
                                                                                        alt={`Preview ${imgIdx + 1}`}
                                                                                        className="rounded border"
                                                                                        style={{width: "60px", height: "60px", objectFit: "cover"}}
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                                                                                        style={{width: "20px", height: "20px", padding: "0", fontSize: "8px"}}
                                                                                        onClick={() => handleRemoveReplacementImage(itemId, imgIdx)}
                                                                                    >
                                                                                        <i className="fa fa-times"></i>
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    
                                    {orderData.orderItems.filter(item => !item.replacement?.isRequested).length === 0 && (
                                        <div className="alert alert-info mb-0">
                                            <i className="fa fa-info-circle me-2"></i>
                                            All items already have replacement requests.
                                        </div>
                                    )}
                                </>
                                ) : (
                                    /* ========== ADMIN REVIEW VIEW ========== */
                                    <>
                                        <p className="text-muted small mb-3">
                                            <i className="fa fa-info-circle me-1"></i>
                                            Review replacement requests. Select items and provide your decision.
                                        </p>
                                        
                                        {/* Select All / Deselect All */}
                                        {orderData.orderItems.filter(item => item.replacement?.isRequested === true && item.replacement?.status === 'pending').length > 1 && (
                                            <div className="mb-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                        const allPendingItems = orderData.orderItems
                                                            .filter(item => 
                                                                item.replacement?.isRequested === true && 
                                                                item.replacement?.status === 'pending'
                                                            );
                                                        
                                                        if (selectedItemsForReplacement.length === allPendingItems.length) {
                                                            setSelectedItemsForReplacement([]);
                                                        } else {
                                                            setSelectedItemsForReplacement(allPendingItems.map(item => item._id));
                                                        }
                                                    }}
                                                >
                                                    <i className={`fa ${
                                                        selectedItemsForReplacement.length === orderData.orderItems.filter(item => 
                                                            item.replacement?.isRequested === true && 
                                                            item.replacement?.status === 'pending'
                                                        ).length ? 'fa-square-check' : 'fa-square'
                                                    } me-2`}></i>
                                                    {selectedItemsForReplacement.length === orderData.orderItems.filter(item => 
                                                        item.replacement?.isRequested === true && 
                                                        item.replacement?.status === 'pending'
                                                    ).length ? 'Deselect All' : 'Select All Pending'}
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div className="row g-3">
                                            {orderData.orderItems
                                                .filter(item => item.replacement?.isRequested === true)
                                                .map((item, idx) => {
                                                    const itemId = item._id || item.prodId;
                                                    const isSelected = selectedItemsForReplacement.includes(itemId);
                                                    const isAlreadyReviewed = item.replacement.status === 'approved' || 
                                                                            item.replacement.status === 'rejected';
                                                    
                                                    return (
                                                        <div key={idx} className="col-12">
                                                            <div className={`border rounded overflow-hidden ${
                                                                isSelected ? 'border-primary border-2' : ""
                                                            }`}>
                                                                {/* Product Card Header */}
                                                                <div className={`p-3 ${isSelected ? 'bg-primary bg-opacity-10' : 'bg-white'}`}>
                                                                    <div className="row g-3 ">
                                                                        {/* Product Image */}
                                                                        <div className="col-3 ">
                                                                            <img 
                                                                                src={`${import.meta.env.VITE_API_URL}/api/Uploads/${item.imageFile}`}
                                                                                alt={item.prodName}
                                                                                className="rounded border img-fluid"
                                                                                style={{objectFit: "cover"}}
                                                                            />
                                                                            
                                                                        </div>
                                                                        
                                                                        {/* Product Info - 3 Line Block */}
                                                                        <div className="col">
                                                                            <p className="m-0 fw-bold text-capitalize mb-1 small">{item.prodName}</p>
                                                                            <p className="m-0 text-muted mb-2 small">{item.pid}</p>
                                                                            <span className={`badge text-capitalize ${
                                                                                item.replacement.status === 'pending' ? 'bg-secondary' :
                                                                                item.replacement.status === 'approved' ? 'bg-success' :
                                                                                item.replacement.status === 'rejected' ? 'bg-danger' :
                                                                                'bg-info'
                                                                            }`}>
                                                                                {item.replacement.status}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Checkbox for Admin */}
                                                                        {role === "admin" && (
                                                                            <div className="col-auto">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="form-check-input"
                                                                                    style={{width: "24px", height: "24px", cursor: isAlreadyReviewed ? "not-allowed" : "pointer"}}
                                                                                    checked={isSelected}
                                                                                    disabled={isAlreadyReviewed}
                                                                                    onChange={() => {
                                                                                        if (isSelected) {
                                                                                            setSelectedItemsForReplacement(prev => prev.filter(id => id !== itemId));
                                                                                        } else {
                                                                                            setSelectedItemsForReplacement(prev => [...prev, itemId]);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Details Section Below Image */}
                                                                <div className="p-3 bg-light border-top">
                                                                    {/* Reason */}
                                                                    <div className="mb-3">
                                                                        <div className="d-flex align-items-start gap-2">
                                                                            <i className="fa fa-exclamation-circle text-muted small mt-1"></i>
                                                                            <div>
                                                                                <p className="m-0 small text-capitalize fw-semibold">reason:</p>
                                                                                <p className="m-0 text-muted small">{item.replacement.reason}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Description */}
                                                                    {item.replacement.description && (
                                                                        <div className="mb-3">
                                                                            <div className="d-flex align-items-start gap-2">
                                                                                <i className="fa fa-file-alt text-muted mt-1 small"></i>
                                                                                <div className="">
                                                                                    <p className="m-0 small text-capitalize fw-semibold ">description: </p>
                                                                                    <p className="m-0 text-muted  text-capitalize small">{item.replacement.description}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Date & Time */}
                                                                    <div className="mb-3">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <i className="fa fa-clock text-muted small"></i>
                                                                            <span className="text-muted small">
                                                                                {new Date(item.replacement.requestedAt).toLocaleString('en-US', {
                                                                                    month: 'long',
                                                                                    day: 'numeric',
                                                                                    year: 'numeric',
                                                                                    hour: 'numeric',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Image Previews */}
                                                                    {item.replacement?.images?.length > 0 && (
                                                                        <div>
                                                                            <div className="d-flex align-items-center gap-2 ">
                                                                                <i className="fa fa-image text-muted small"></i>
                                                                                <p className="m-0 text-dark small ">{item.replacement.images.length} photo(s)</p>
                                                                            </div>
                                                                            <div className="d-flex gap-2 flex-wrap mt-2">
                                                                                {item.replacement.images.map((imgFilename, imgIdx) => (
                                                                                    <img
                                                                                        key={imgIdx}
                                                                                        src={`${import.meta.env.VITE_API_URL}/api/Uploads/${imgFilename}`}
                                                                                        alt={`Evidence ${imgIdx + 1}`}
                                                                                        className="rounded border shadow-sm"
                                                                                        style={{width: "80px", height: "80px", objectFit: "cover", cursor: "pointer"}}
                                                                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/Uploads/${imgFilename}`, '_blank')}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Review Form - Show if selected and not already reviewed */}
                                                                {isSelected && !isAlreadyReviewed && (
                                                                    <div className="p-3 bg-white border-top">
                                                                        <p className="m-0 small mb-3 fw-bold text-primary">
                                                                            <i className="fa fa-clipboard-check me-2 small"></i>
                                                                            Review Decision
                                                                        </p>
                                                                        
                                                                        {(() => {
                                                                            const reviewData = replacementReview[itemId] || {};
                                                                            const isApproved = reviewData.decision === 'approve';
                                                                            const isRejected = reviewData.decision === 'reject';
                                                                            const faultParty = reviewData.faultAssignedTo || '';
                                                                            
                                                                            return (
                                                                                <div>
                                                                                    {/* Fault Assignment */}
                                                                                    <div className="mb-3">
                                                                                        <label className="form-label small fw-bold">
                                                                                            Who is at fault? <span className="text-danger">*</span>
                                                                                        </label>
                                                                                        <select
                                                                                            style={{fontSize: "14px"}}
                                                                                            className="form-select"
                                                                                            value={faultParty}
                                                                                            onChange={(e) => {
                                                                                                handleReviewDataChange(itemId, 'faultAssignedTo', e.target.value);
                                                                                                // Clear fault details if switching away from rider
                                                                                                if (e.target.value !== 'rider') {
                                                                                                    handleReviewDataChange(itemId, 'faultDetails', '');
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <option value="">Select who is at fault...</option>
                                                                                            <option value="seller">Seller</option>
                                                                                            <option value="rider">Rider</option>
                                                                                            <option value="none">None (Unreasonable Request)</option>
                                                                                        </select>
                                                                                        <small className="text-muted d-block mt-1">
                                                                                            <i className="fa fa-info-circle me-1"></i>
                                                                                            Choose "None" if the replacement request is unreasonable
                                                                                        </small>
                                                                                    </div>

                                                                                    {/* Fault Details - Only show if RIDER is selected */}
                                                                                    {faultParty === 'rider' && (
                                                                                        <div className="mb-3">
                                                                                            <label className="form-label fw-bold small">
                                                                                                Fault Details <span className="text-danger">*</span>
                                                                                            </label>
                                                                                            <textarea
                                                                                                style={{fontSize: "14px"}}
                                                                                                className="form-control"
                                                                                                rows="3"
                                                                                                placeholder="Describe the rider's fault or issue..."
                                                                                                value={reviewData.faultDetails || ''}
                                                                                                onChange={(e) => handleReviewDataChange(itemId, 'faultDetails', e.target.value)}
                                                                                            ></textarea>
                                                                                            <small className="text-muted">
                                                                                                <i className="fa fa-info-circle me-1"></i>
                                                                                                Explain why the rider is at fault (e.g., mishandling, late delivery)
                                                                                            </small>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {/* Decision Radio Buttons */}
                                                                                    <div className="mb-3">
                                                                                        <label className="form-label fw-bold small">
                                                                                            Decision <span className="text-danger">*</span>
                                                                                        </label>
                                                                                        <div className="d-flex gap-4">
                                                                                            <div className="form-check">
                                                                                                <input
                                                                                                    className="form-check-input"
                                                                                                    type="radio"
                                                                                                    name={`decision-${itemId}`}
                                                                                                    id={`approve-${itemId}`}
                                                                                                    checked={isApproved}
                                                                                                    onChange={() => handleReviewDataChange(itemId, 'decision', 'approve')}
                                                                                                    disabled={!faultParty}
                                                                                                />
                                                                                                <label className="form-check-label small" htmlFor={`approve-${itemId}`}>
                                                                                                    <i className="fa fa-check-circle text-success me-2"></i>
                                                                                                    Approve Replacement
                                                                                                </label>
                                                                                            </div>
                                                                                            <div className="form-check">
                                                                                                <input
                                                                                                    className="form-check-input"
                                                                                                    type="radio"
                                                                                                    name={`decision-${itemId}`}
                                                                                                    id={`reject-${itemId}`}
                                                                                                    checked={isRejected}
                                                                                                    onChange={() => handleReviewDataChange(itemId, 'decision', 'reject')}
                                                                                                    disabled={!faultParty}
                                                                                                />
                                                                                                <label className="form-check-label small" htmlFor={`reject-${itemId}`}>
                                                                                                    <i className="fa fa-times-circle text-danger me-2"></i>
                                                                                                    Reject Replacement
                                                                                                </label>
                                                                                            </div>
                                                                                        </div>
                                                                                        {!faultParty && (
                                                                                            <small className="text-warning d-block mt-1">
                                                                                                <i className="fa fa-exclamation-triangle me-1"></i>
                                                                                                Please assign fault first before making a decision
                                                                                            </small>
                                                                                        )}
                                                                                    </div>
                                                                                    
                                                                                    {/* Admin Notes */}
                                                                                    <div className="mb-0">
                                                                                        <label className="form-label fw-bold small">
                                                                                            Admin Notes {isRejected && <span className="text-danger">*</span>}
                                                                                        </label>
                                                                                        <textarea
                                                                                            style={{fontSize: "14px"}}
                                                                                            className="form-control"
                                                                                            rows="3"
                                                                                            placeholder={isRejected ? "Explain why replacement is rejected..." : "Additional notes or instructions..."}
                                                                                            value={reviewData.notes || ''}
                                                                                            onChange={(e) => handleReviewDataChange(itemId, 'notes', e.target.value)}
                                                                                        ></textarea>
                                                                                        <small className="text-muted">
                                                                                            <i className="fa fa-info-circle me-1"></i>
                                                                                            {isRejected 
                                                                                                ? "Required: Explain rejection reason to customer" 
                                                                                                : "Add any additional information or instructions"
                                                                                            }
                                                                                        </small>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                                                                                                
                                                                {/* Already Reviewed Badge */}
                                                                {isAlreadyReviewed && (
                                                                    <div className="alert alert-info mb-0 py-2 px-3 small d-flex align-items-center" >
                                                                        <i className="fa fa-info-circle me-1"></i>
                                                                        <p className="m-0 text-capitalize small text-muted">{item.replacement?.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </>
                                )}
                            </div>
                                                        
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowReplacementModal(false);
                                        setIsViewMode(false);
                                        setReplacementReview({});
                                    }}
                                    disabled={isSubmittingReplacement || isSubmittingReview}
                                >
                                    Close
                                </button>

                                {/* Submit button for USER */}
                                {!isViewMode && role === "user" && (
                                    <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={handleSubmitReplacementRequest}
                                        disabled={
                                            isSubmittingReplacement ||
                                            selectedItemsForReplacement.length === 0 ||
                                            selectedItemsForReplacement.some(itemId => !replacementData[itemId]?.reason)
                                        }
                                    >
                                        {isSubmittingReplacement ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-paper-plane me-2"></i>
                                                Submit Request ({selectedItemsForReplacement.length} {selectedItemsForReplacement.length === 1 ? 'item' : 'items'})
                                            </>
                                        )}
                                    </button>
                                )}
                                
                                {/* Submit button for ADMIN */}
                                {isViewMode && role === "admin" && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSubmitReplacementReview}
                                        disabled={
                                            isSubmittingReview ||
                                            selectedItemsForReplacement.length === 0 ||
                                            selectedItemsForReplacement.some(itemId => !replacementReview[itemId]?.decision)
                                        }
                                    >
                                        {isSubmittingReview ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-check me-2"></i>
                                                Submit Review ({selectedItemsForReplacement.length} {selectedItemsForReplacement.length === 1 ? 'item' : 'items'})
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>



                    </div>
                </div>
            )}



            <div className={role === "user" ? "bg min-vh-100 d-flex" : "d-flex min-vh-100 px-md-2"}>
                <div className={role === "user" ? "container bg-white" : "container-fluid bg-white"}>
                    <div className={`row ${role === "user" ? "justify-content-center py-5" : "justify-content-start py-4 p-md-4 "}`}>
                        <div className={`col-12 ${role === "user" ? "col-lg-10" : "col-lg-12 "} `}>
                            {/* Header */}
                            <div className="d-flex align-items-center gap-3">
                                <button 
                                    className="btn btn-outline-success"
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="fa fa-arrow-left"></i>
                                </button>
                                <div>
                                    <h5 className="m-0 fw-bold text-capitalize text-success">order details</h5>
                                    <p className="m-0 small text-muted">View order information</p>
                                </div>
                            </div>
                        </div>

                        <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10 " : "col-lg-12"}`}>
                            <div className="row g-0 p-3 px-4 bg shadow-sm border rounded"
                                style={{ cursor: "pointer" }} onClick={() => {
                                    if (role === "admin") {
                                        return navigate("/admin/trackorder", { state: { data: orderData?._id } });
                                    }
                                    if (role === "user") {
                                        return navigate("/user/trackorder", { state: { data: orderData?._id } });
                                    }
                                    if (role === "seller") {
                                        return navigate("/seller/trackorder", { state: { data: orderData?._id } });
                                    }
                                }}>
                                <div className="col">
                                    <div className="d-flex align-items-center">
                                        <div className="fa fa-truck me-3"></div>
                                        <p className="m-0 text-capitalize fw-bold ">{currentStatus.status === "confirm" ? "confirmed" : currentStatus.status  }</p>
                                    </div>
                                    <p className="m-0 text-capitalize text-muted small mt-1">{currentStatus.description}</p>
                                </div>
                                <div className="col-1 d-flex align-items-center justify-content-end">
                                    <div className="fa fa-chevron-right opacity-50"></div>
                                </div>
                            </div>
                        </div>

                        {/* Replacement Request Section - User Only, Delivered Status */}
                        {canShowReplacementSection() && (
                            <div className={`col-12 mt-4 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className={`alert border shadow-sm ${hasReplacementRequest ? 'alert-info' : 'alert-warning'}`}>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <div>
                                            <i className={`fa ${hasReplacementRequest ? 'fa-clipboard-check' : 'fa-exclamation-circle'} me-2`}></i>
                                            <strong>
                                                {role === "admin" 
                                                    ? "Review Replacement Requests" 
                                                    : hasReplacementRequest 
                                                        ? 'View Replacement Request' 
                                                        : 'Need a replacement?'
                                                }
                                            </strong>
                                            <p className="m-0 small mt-1">
                                                {role === "admin" 
                                                    ? "There are pending replacement requests that need your review."
                                                    : hasReplacementRequest 
                                                        ? 'You have submitted a replacement request. Click to view details.'
                                                        : isWithin24Hours()
                                                            ? 'You have 24 hours from delivery to request a product replacement.'
                                                            : 'The 24-hour window for replacement requests has expired.'
                                                }
                                            </p>
                                        </div>
                                        {hasReplacementRequest && (
                                            <button
                                                className="btn btn-outline-info btn-sm text-capitalize"
                                                onClick={handleViewReplacementRequest}
                                            >
                                                <i className="fa fa-eye me-2"></i>
                                                {role === "admin" ? "Review Requests" : "View Request"}
                                            </button>
                                        )}
                                        
                                        {role === "user" && !hasReplacementRequest && isWithin24Hours() && (
                                            <button
                                                className="btn btn-outline-warning btn-sm text-capitalize"
                                                onClick={handleRequestReplacement}
                                            >
                                                <i className="fa fa-exchange me-2"></i>
                                                Request Replacement
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Refund Information - Visible to Admin and User */}
                        {orderData.cancellation?.isCancelled && orderData.cancellation?.refund?.isEligible && (
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="border rounded shadow-sm p-3 bg-white">
                                    <p className="m-0 fw-bold mb-3">
                                        <i className="fa fa-info-circle me-2 text-info"></i>
                                        Refund Information
                                    </p>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <div className="row g-2 small">
                                                <div className="col-6">
                                                    <span className="text-muted">Amount:</span>
                                                    <span className="ms-2 fw-bold">₱{orderData.cancellation.refund.amount?.toLocaleString('en-PH')}.00</span>
                                                </div>
                                                <div className="col-6">
                                                    <span className="text-muted">Method:</span>
                                                    <span className="ms-2 fw-bold">{orderData.cancellation.refund.method}</span>
                                                </div>
                                                <div className="col-6">
                                                    <span className="text-muted">Account Name:</span>
                                                    <span className="ms-2">{orderData.cancellation.refund.accountName}</span>
                                                </div>
                                                <div className="col-6">
                                                    <span className="text-muted">Account Number:</span>
                                                    <span className="ms-2">{orderData.cancellation.refund.accountNumber}</span>
                                                </div>
                                                <div className="col-12">
                                                    <span className="text-muted">Status:</span>
                                                    <span className={`ms-2 fw-bold text-capitalize 
                                                        ${orderData.cancellation.refund.status === "completed" ? "text-success" : ""}
                                                        ${orderData.cancellation.refund.status === "processing" ? "text-warning" : ""}
                                                        ${orderData.cancellation.refund.status === "pending" ? "text-secondary" : ""}
                                                        ${orderData.cancellation.refund.status === "rejected" ? "text-danger" : ""}
                                                    `}>
                                                        {getRefundStatusLabel(orderData.cancellation.refund.status)}
                                                    </span>
                                                </div>
                                                {orderData.cancellation.refund.notes && (
                                                    <div className="col-12 mt-2">
                                                        <span className="text-muted">Notes:</span>
                                                        <p className="m-0 ms-2 fst-italic">{orderData.cancellation.refund.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {orderData.cancellation.refund.qrCode && (
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex align-items-start gap-2">
                                                    <i className="fa-solid fa-qrcode text-info mt-1" style={{fontSize: "18px"}}></i>
                                                    <div className="flex-grow-1">
                                                        <p className="m-0 fw-semibold mb-1" style={{fontSize: "13px"}}>
                                                            QR Code
                                                        </p>
                                                        <p 
                                                            className="m-0 text-primary small text-decoration-underline" 
                                                            style={{fontSize: "12px", cursor: "pointer"}}
                                                            onClick={() => setViewQRModal(true)}
                                                        >
                                                            <i className="fa-solid fa-expand me-1"></i>
                                                            {orderData.cancellation.refund.qrCode}
                                                        </p>
                                                        <p className="m-0 text-muted small" style={{fontSize: "11px"}}>
                                                            Click to view full size
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show Cancelled Alert if normalCancel is true */}
                        {normalCancel && (
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="alert alert-danger mb-0">
                                    <i className="fa fa-times-circle me-2"></i>
                                    This order has been cancelled
                                </div>
                            </div>
                        )}

                        {/* Refund Actions - Admin Only */}
                        {role === "admin" && orderData.cancellation?.isCancelled && orderData.cancellation?.refund?.isEligible && !isRefundRejected &&(
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="border rounded shadow-sm p-3 bg-white">
                                    <p className="m-0 fw-bold text-capitalize mb-3">Refund Actions</p>

                                    {/* Refund Progress Stepper */}
                                    <div className="d-flex justify-content-between mb-3">
                                        {["pending", "processing", "completed"].map((status, index) => {
                                            const currentRefundStatus = orderData.cancellation.refund.status;
                                            const refundFlow = ["pending", "processing", "completed"];
                                            const currentIndex = refundFlow.indexOf(currentRefundStatus);
                                            const isCompleted = index <= currentIndex;
                                            const isCurrent = index === currentIndex;
                                            const isNext = index === currentIndex + 1;

                                            return (
                                                <div key={status} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                                                    <div className="d-flex align-items-center w-100">
                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center
                                                            ${isCompleted ? 'bg-success text-white' : ''}
                                                            ${isNext && !isCompleted ? 'bg-primary text-white' : ''}
                                                            ${!isCompleted && !isNext ? 'bg-light text-muted' : ''}
                                                        `}
                                                            style={{ width: "32px", height: "32px", fontSize: "12px", flexShrink: 0 }}>
                                                            {isCompleted ? <i className="fa fa-check"></i> : index + 1}
                                                        </div>

                                                        {index < refundFlow.length - 1 && (
                                                            <div className={`flex-grow-1 ${isCompleted ? 'bg-success' : 'bg-light'}`}
                                                                style={{ height: "2px", marginLeft: "4px", marginRight: "4px" }}></div>
                                                        )}
                                                    </div>

                                                    <small className={`text-capitalize text-center mt-2 
                                                        ${isCurrent ? 'fw-bold text-success' : ''}
                                                        ${isNext ? 'fw-bold text-primary' : ''}
                                                        ${!isCurrent && !isNext ? 'text-muted' : ''}
                                                    `}
                                                        style={{ fontSize: "11px", lineHeight: "1.2" }}>
                                                        {getRefundStatusLabel(status)}
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* File Upload for Processing Status */}
                                    {nextRefundStatus !== "pending" && (
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize small fw-bold">
                                                <i className="fa fa-receipt me-2"></i>
                                                Attach Refund Receipt
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={(e) => setRefundReceipt(e.target.files[0])}
                                                disabled={orderData.cancellation.refund.status !== "processing"}
                                            />
                                            {refundReceipt && (
                                                <small className="text-success mt-1 d-block">
                                                    <i className="fa fa-check-circle me-1"></i>
                                                    File selected: {refundReceipt.name}
                                                </small>
                                            )}
                                            <small className="text-muted d-block mt-1">
                                                Upload proof of refund transaction
                                            </small>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {nextRefundStatus && (
                                        <div className="d-flex gap-2 flex-wrap">
                                            <button
                                                className="btn btn-sm btn-success text-capitalize"
                                                onClick={() => handleRefundStatusUpdate(nextRefundStatus)}
                                                disabled={isUpdating || (nextRefundStatus !== "processing" && !refundReceipt)}
                                            >
                                                {isUpdating ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa fa-arrow-right me-2"></i>
                                                        Move to {getRefundStatusLabel(nextRefundStatus)}
                                                    </>
                                                )}
                                            </button>

                                            {(orderData.cancellation.refund.status === "pending" || 
                                            orderData.cancellation.refund.status === "processing") && (
                                                <button
                                                    className="btn btn-sm btn-danger text-capitalize"
                                                    onClick={() => handleOpenCancelModal('reject-refund')}
                                                    disabled={isUpdating}
                                                >
                                                    <i className="fa fa-times me-2"></i>
                                                    Reject Refund
                                                </button>
                                            )}

                                            {nextRefundStatus !== "processing" && !refundReceipt && (
                                                <small className="text-danger d-block mt-2">
                                                    <i className="fa fa-exclamation-circle me-1"></i>
                                                    Please attach refund receipt before proceeding
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    {orderData.cancellation.refund.status === "completed" && (
                                        <div className="alert alert-success mt-3 mb-0">
                                            <i className="fa fa-check-circle me-2"></i>
                                            Refund has been completed successfully
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Progress Actions - Admin Only */}
                        {role === "admin" && !isCancelled && !normalCancel && 
                        !isRefundCompleted && !isRefundRejected && !isReplacement && !isReplacementConfirmed && 
                        orderData.orderItems?.some(item => item.replacement?.isRequested === false ) &&
                        !(orderData.cancellation?.refund?.status === "processing") && (
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="border rounded shadow-sm p-3 bg-white">
                                    <p className="m-0 fw-bold text-capitalize mb-3">Order Actions</p>

                                    {/* Progress Stepper with Labels */}
                                    <div className="d-flex justify-content-between mb-3">
                                        {statusFlow.map((status, index) => {
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const isNext = index === currentStepIndex + 1;

                                            return (
                                                <div key={status} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                                                    <div className="d-flex align-items-center w-100">
                                                        <button
                                                            className={`rounded-circle d-flex align-items-center justify-content-center border-0
                                                                ${isCompleted ? 'bg-success text-white' : ''}
                                                                ${isNext && !isCompleted ? 'bg-primary text-white' : ''}
                                                                ${!isCompleted && !isNext ? 'bg-light text-muted' : ''}
                                                                ${isNext ? '' : 'pe-none opacity-50'}
                                                            `}
                                                            style={{ 
                                                                width: "40px", 
                                                                height: "40px", 
                                                                fontSize: "14px", 
                                                                flexShrink: 0,
                                                                cursor: isNext ? 'pointer' : 'not-allowed',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onClick={() => {
                                                                if (isNext && canProceed()) {
                                                                    // Check if moving to "ready to deliver" and no rider assigned
                                                                    if (statusFlow[index] === "ready to deliver" && 
                                                                        orderData.orderMethod === "delivery" && 
                                                                        !selectedRider?.id) {
                                                                        alert("Please assign a rider first");
                                                                        return;
                                                                    }
                                                                    handleStatusUpdate(statusFlow[index]);
                                                                }
                                                            }}
                                                            disabled={
                                                                !isNext || 
                                                                !canProceed() || 
                                                                isUpdating ||
                                                                // Disable if trying to go to "ready to deliver" without rider
                                                                (isNext && 
                                                                statusFlow[index] === "ready to deliver" && 
                                                                orderData.orderMethod === "delivery" && 
                                                                !selectedRider?.id)
                                                            }
                                                        >
                                                            {isUpdating && isNext ? (
                                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                            ) : isCompleted ? (
                                                                <i className="fa fa-check"></i>
                                                            ) : (
                                                                index + 1
                                                            )}
                                                        </button>

                                                        {index < statusFlow.length - 1 && (
                                                            <div className={`flex-grow-1 ${isCompleted ? 'bg-success' : 'bg-light'}`}
                                                                style={{ height: "2px", marginLeft: "4px", marginRight: "4px" }}></div>
                                                        )}
                                                    </div>

                                                    <small className={`text-capitalize text-center mt-2 
                                                        ${isCurrent ? 'fw-bold text-success' : ''}
                                                        ${isNext ? 'fw-bold text-primary' : ''}
                                                        ${!isCurrent && !isNext ? 'text-muted' : ''}
                                                    `}
                                                        style={{ fontSize: "11px", lineHeight: "1.2" }}>
                                                        {getStatusLabel(status)}
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>

                                  


                                    {(orderData.statusDelivery === "in transit" || 
                                    orderData.statusDelivery === "delivered" || 
                                    orderData.statusDelivery === "complete") && (
                                        <div className="alert alert-info mb-3 small">
                                            <i className="fa fa-info-circle me-2"></i>
                                            {orderData.statusDelivery === "in transit" && "Order is currently in transit with the rider"}
                                            {orderData.statusDelivery === "delivered" && "Order has been delivered to customer"}
                                            {orderData.statusDelivery === "complete" && "Order has been completed"}
                                        </div>
                                    )}

                                    {orderData.orderMethod === "delivery" &&
                                    currentStepIndex < statusFlow.indexOf("ready to deliver") && 
                                    !isCompleted &&
                                    orderData.statusDelivery !== "in transit" &&
                                    orderData.statusDelivery !== "delivered" && (
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize small fw-bold">Assign Rider</label>
                                            <select
                                                className="form-select text-capitalize"
                                                value={selectedRider.id}
                                                onChange={(e) => {
                                                    const riderId = e.target.value;
                                                    const rider = riders.find(r => r._id === riderId);
                                                    setSelectedRider({
                                                        id: riderId,
                                                        name: rider ? `${rider.firstname} ${rider.lastname}` : ""
                                                    });
                                                }}
                                                disabled={orderData.statusDelivery === "pending" || orderData.statusDelivery === "confirm"}
                                            >
                                                <option value="">Select Rider</option>
                                                {riders.map((rider) => (
                                                    <option key={rider._id} value={rider._id}>
                                                        {rider.firstname} {rider.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedRider.name && (
                                                <small className="text-success mt-1 d-block">
                                                    <i className="fa fa-check-circle me-1"></i>
                                                    Rider: {selectedRider.name}
                                                </small>
                                            )}
                                            {(orderData.statusDelivery === "pending" || orderData.statusDelivery === "confirm") && (
                                                <small className="text-muted d-block mt-1">
                                                    <i className="fa fa-info-circle me-1"></i>
                                                    Rider assignment available after packing status
                                                </small>
                                            )}
                                        </div>
                                    )}
                                      {/* Add note after stepper if on packing and no rider assigned */}
                                    {orderData.orderMethod === "delivery" && 
                                    orderData.statusDelivery === "packing" && 
                                    !selectedRider?.id && (
                                        <div className="alert alert-warning mb-3" style={{fontSize: "13px"}}>
                                            <i className="fa fa-exclamation-triangle me-2"></i>
                                            Please assign a rider before moving to "Ready to Deliver"
                                        </div>
                                    )}

                                    {/* Show cancel button only on pending status */}
                                    {orderData.statusDelivery === "pending" && (
                                        <div className="d-flex gap-2 flex-wrap mt-3">
                                            <button
                                                className="btn btn-sm btn-danger text-capitalize"
                                                onClick={() => handleOpenCancelModal('cancel-order')}
                                                disabled={isUpdating}
                                            >
                                                <i className="fa fa-times me-2"></i>
                                                Cancel Order
                                            </button>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="alert alert-success mt-3 mb-0">
                                            <i className="fa fa-check-circle me-2"></i>
                                            This order has been completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Replacement Actions - Admin Only */}
                        {role === "admin" && orderData.orderItems?.some(item => item.replacement?.isRequested === true )  && (
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="border rounded shadow-sm p-3 bg-white">
                                    <p className="m-0 fw-bold text-capitalize mb-3">
                                        <i className="fa fa-exchange me-2 text-success"></i>
                                        Replacement Actions
                                    </p>

                                    {/* Replacement Progress Stepper */}
                                    <div className="d-flex justify-content-between mb-3">
                                        {getReplacementStatusFlow().map((status, index) => {
                                            const currentStepIndex = getCurrentReplacementStepIndex();
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const isNext = index === currentStepIndex + 1;
                                            
                                            // 👇 NEW: Check if review is completed
                                            const isReviewCompleted = orderData.statusDelivery !== "replacement requested" && orderData.statusDelivery !== "replacement rejected";

                                            return (
                                                <div key={status} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                                                    <div className="d-flex align-items-center w-100">
                                                        <button
                                                            className={`rounded-circle d-flex align-items-center justify-content-center border-0
                                                                ${isCompleted ? 'bg-success text-white' : ''}
                                                                ${isNext && !isCompleted && isReviewCompleted ? 'bg-primary text-white' : ''}
                                                                ${!isCompleted && (!isNext || !isReviewCompleted) ? 'bg-light text-muted' : ''}
                                                                ${isNext && isReviewCompleted ? '' : 'pe-none opacity-50'}
                                                            `}
                                                            style={{ 
                                                                width: "40px", 
                                                                height: "40px", 
                                                                fontSize: "14px", 
                                                                flexShrink: 0,
                                                                cursor: (isNext && isReviewCompleted) ? 'pointer' : 'not-allowed',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            onClick={() => {
                                                                // 👇 UPDATED: Only allow if review is completed
                                                                if (isNext && isReviewCompleted && canProceedReplacement()) {
                                                                    if (getReplacementStatusFlow()[index] === "ready to deliver" && 
                                                                        orderData.orderMethod === "delivery" && 
                                                                        !selectedRider?.id) {
                                                                        alert("Please assign a rider first");
                                                                        return;
                                                                    }
                                                                    handleReplacementStatusUpdate(getReplacementStatusFlow()[index]);
                                                                }
                                                            }}
                                                            disabled={
                                                                !isNext || 
                                                                !isReviewCompleted || // 👈 NEW: Disable if not reviewed
                                                                !canProceedReplacement() || 
                                                                isUpdatingReplacement ||
                                                                (isNext && 
                                                                getReplacementStatusFlow()[index] === "ready to deliver" && 
                                                                orderData.orderMethod === "delivery" && 
                                                                !selectedRider?.id)
                                                            }
                                                        >
                                                            {isUpdatingReplacement && isNext ? (
                                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                            ) : isCompleted ? (
                                                                <i className="fa fa-check"></i>
                                                            ) : (
                                                                index + 1
                                                            )}
                                                        </button>

                                                        {index < getReplacementStatusFlow().length - 1 && (
                                                            <div className={`flex-grow-1 ${isCompleted ? 'bg-success' : 'bg-light'}`}
                                                                style={{ height: "2px", marginLeft: "4px", marginRight: "4px" }}></div>
                                                        )}
                                                    </div>

                                                    <small className={`text-capitalize text-center mt-2 
                                                        ${isCurrent ? 'fw-bold text-success' : ''}
                                                        ${isNext && isReviewCompleted ? 'fw-bold text-primary' : ''}
                                                        ${!isCurrent && (!isNext || !isReviewCompleted) ? 'text-muted' : ''}
                                                    `}
                                                        style={{ fontSize: "11px", lineHeight: "1.2" }}>
                                                        {getReplacementStatusLabel(status)}
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Alert for rider status */}
                                   {(orderData.statusDelivery === "in transit" || 
                                        orderData.statusDelivery === "delivered" ||
                                        orderData.statusDelivery === "completed" ||
                                        orderData.statusDelivery === "complete") && 
                                        hasReplacementRequest && (
                                            <div className="alert alert-info mb-3">
                                                <i className="fa fa-info-circle me-2"></i>
                                                {orderData.statusDelivery === "in transit" && "Replacement order is currently in transit with the rider"}
                                                {orderData.statusDelivery === "delivered" && "Replacement order has been delivered"}
                                                {(orderData.statusDelivery === "completed" || orderData.statusDelivery === "complete") && "Replacement order has been completed"}
                                            </div>
                                    )}
                                    


                                    {/* 👇 UPDATED: Rider Assignment - Always show for delivery, but disabled until packing */}
                                    {orderData.orderMethod === "delivery" &&
                                    orderData.statusDelivery !== "in transit" &&
                                    orderData.statusDelivery !== "completed" && (
                                        <div className="mb-3">
                                            <label className="form-label text-capitalize small fw-bold">Assign Rider for Replacement</label>
                                            <select
                                                className="form-select"
                                                value={selectedRider.id}
                                                onChange={(e) => {
                                                    const riderId = e.target.value;
                                                    const rider = riders.find(r => r._id === riderId);
                                                    setSelectedRider({
                                                        id: riderId,
                                                        name: rider ? `${rider.firstname} ${rider.lastname}` : ""
                                                    });
                                                }}
                                                disabled={
                                                    isReplacementRejected || // 👈 ADD THIS
                                                    orderData.statusDelivery === "replacement requested" || 
                                                    orderData.statusDelivery === "replacement confirmed"
                                                }
                                            >
                                                <option value="">Select Rider</option>
                                                {riders.map((rider) => (
                                                    <option key={rider._id} value={rider._id}>
                                                        {rider.firstname} {rider.lastname}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {selectedRider.name && (
                                                <small className="text-success mt-1 d-block">
                                                    <i className="fa fa-check-circle me-1"></i>
                                                    Rider: {selectedRider.name}
                                                </small>
                                            )}
                                            
                                            {((orderData.statusDelivery === "replacement requested" && !selectedRider.name) ||
                                            orderData.statusDelivery === "replacement confirmed") && (
                                                <small className="text-muted d-block mt-1">
                                                    <i className="fa fa-info-circle me-1"></i>
                                                    Rider assignment available after packing status
                                                </small>
                                            )}

                                        </div>
                                    )}

                                    {/* Warning for no rider */}
                                    {orderData.orderMethod === "delivery" && 
                                    orderData.statusDelivery === "replacement packing" && 
                                    !selectedRider?.id && (
                                        <div className="alert alert-warning mb-3 small">
                                            <i className="fa fa-exclamation-triangle me-2"></i>
                                            Please assign a rider before moving to "Ready to Deliver"
                                        </div>
                                    )}

                                    {/* Completed alert */}
                                    {(orderData.statusDelivery === "completed" || orderData.statusDelivery === "complete") && 
                                    hasReplacementRequest && (
                                        <div className="alert alert-success mt-3 mb-0 small">
                                            <i className="fa fa-check-circle me-2"></i>
                                            Replacement order has been completed successfully
                                        </div>
                                    )}



                                     {/* 👇 ADD THIS ALERT - Show if not yet confirmed */}
                                    {orderData.statusDelivery === "replacement requested" && (
                                        <div className="alert alert-warning mb-3 small">
                                            <i className="fa fa-exclamation-triangle me-2"></i>
                                            Please review the replacement request first before proceeding with the order status.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Refund History - Items for Refund */}
                        {orderData.refundHistory && orderData.refundHistory.length > 0 && (
                            <div className={`col-12 mt-3 ${role === "user" ? "col-lg-10" : "col-lg-12"}`}>
                                <div className="border rounded shadow-sm p-3 bg-white">
                                    <p className="m-0 fw-bold text-capitalize mb-3">
                                        <i className="fa fa-money-bill-wave me-2 text-danger"></i>
                                        Items for Refund
                                    </p>
                                    
                                    <div className="row g-3">
                                        {orderData.refundHistory.map((refund, idx) => (
                                            <div key={idx} className="col-12">
                                                <div className="alert alert-warning mb-0">
                                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                                        {/* Left: Item Info */}
                                                        <div className="flex-grow-1">
                                                            <p className="m-0 fw-bold mb-1">{refund.itemName}</p>
                                                            <p className="m-0 small text-muted mb-2">{refund.pid}</p>
                                                            
                                                            <p className="m-0 small mb-1">
                                                                <strong>Reason:</strong> {refund.reason}
                                                            </p>
                                                            
                                                            <p className="m-0 small mb-1">
                                                                <strong>Fault Party:</strong> <span className="text-capitalize">{refund.faultParty}</span>
                                                                {refund.riderLiability > 0 && (
                                                                    <span className="ms-2 text-muted">
                                                                        (Rider Liability: ₱{refund.riderLiability.toLocaleString()})
                                                                    </span>
                                                                )}
                                                            </p>
                                                            
                                                            {refund.notes && (
                                                                <p className="m-0 small fst-italic text-muted mb-1">
                                                                    "{refund.notes}"
                                                                </p>
                                                            )}
                                                            
                                                            <p className="m-0 small text-muted">
                                                                {new Date(refund.requestedAt).toLocaleString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Right: Refund Amount */}
                                                        <div className="text-end">
                                                            <p className="m-0 small text-muted">Refund Amount</p>
                                                            <p className="m-0 fw-bold fs-4 text-danger">
                                                                ₱{refund.amount.toLocaleString()}.00
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Summary Footer */}
                                    <div className="alert alert-info mb-0 mt-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="m-0">
                                                    <strong>Total Items:</strong> {orderData.refundHistory.length}
                                                </p>
                                                <small className="text-muted">
                                                    Please process refund manually via agreed payment method
                                                </small>
                                            </div>
                                            <div className="text-end">
                                                <p className="m-0 small text-muted">Total Refund Amount</p>
                                                <p className="m-0 fw-bold fs-4 text-danger">
                                                    ₱{orderData.refundHistory
                                                        .reduce((sum, r) => sum + r.amount, 0)
                                                        .toLocaleString()}.00
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}



                        <div className={`${role === "user"
                            ? noPaymentProof(orderData) ? "col-12 col-md-6 col-lg-5 " : "col-12 col-lg-10"
                            : noPaymentProof(orderData) ? "col-12 col-lg-6" : "col-12"}`}>
                            <p className="m-0 text-capitalize fw-bold opacity-75 mt-5">
                                order {orderData.orderItems.length > 1 ? "items" : "item"}:
                            </p>
                            <div className="row">
                                {orderData.orderItems.map((item, i) => {
                                    return (
                                        <div key={i} className={role === "user" ?
                                            noPaymentProof(orderData) ? "col-12" : "col-12 col-lg-6 col-md-6" :
                                            noPaymentProof(orderData) ? "col-12" : "col-12 col-lg-6 col-md-12"}>
                                            <div className="row g-0 mt-2 mt-md-4 rounded bg-beige p-2 shadow-sm border">
                                                <div className={`col-5 col-sm-4 col-md-5 col-lg-5 col-xl-4 col-xxl-5`}>
                                                    <div className="d-flex flex-column justify-content-between h-100 ">
                                                        <img src={
                                                            item.imageFile.startsWith("http") 
                                                            ? item.imageFile 
                                                            : `${import.meta.env.VITE_API_URL}/api/Uploads/${item.imageFile}`} 
                                                        alt={item.imageFile} className="img-fluid rounded border shadow-sm " />

                                                        {role === "user" && orderData?.statusDelivery.toLowerCase() === "delivered" && (
                                                            <button 
                                                                className={`text-capitalize p-2 border-0 bg-dark text-white rounded shadow-sm w-100 mt-3 ${item.isReviewed ? "opacity-50" : "opacity-100"}`}
                                                                style={{ fontSize: "12px" }}
                                                                disabled={item.isReviewed}
                                                                onClick={() => navigate("/user/reviews", { state: { item: item } })}
                                                            >
                                                                {item.isReviewed ? "review sent" : "leave review ⭐"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col ms-3">
                                                    <div className="d-flex flex-column justify-content-between h-100">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <p className="m-0 text-capitalize fw-bold ">{`${item.prodName}`}</p>
                                                            <small className="text-muted">{`(${item.pid})`}</small>
                                                        </div>
                                                        <p className="m-0 text-capitalize opacity-75 small"
                                                        style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                        >{item.prodDisc}</p>
                                                        <p className="m-0 fw-bold text-muted small">{item.quantity >= 1 ? `${item.quantity} bundle` : `${item.quantity} bundles`}</p>
                                                        <p className="m-0 text-end text-capitalize bold fw-bold">{`₱${item.prodPrice.toLocaleString('en-PH') + ".00"}`}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {noPaymentProof(orderData) ? undefined : (
                            <div className={`col-12 mt-2 mt-md-4 
                            ${role === "user" ? "col-md-6 col-lg-5" : "col-md-5 col-lg-6"}  `}>
                                <p className="m-0 text-capitalize fw-bold opacity-75 my-4">proof of payment:</p>
                                
                                {/* Improved Proof of Payment Card */}
                                <div className="card shadow-sm border">
                                    <div className="card-body p-3">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-12 col-sm-5 col-md-6 col-lg-5 col-xl-4">
                                                <div 
                                                    className="position-relative"
                                                    style={{cursor: "pointer"}}
                                                    onClick={() => setViewProofModal(true)}
                                                >
                                                    <img 
                                                        src={
                                                            orderData.proofOfPayment.image.startsWith("http")
                                                            ? orderData.proofOfPayment.image
                                                            : `${import.meta.env.VITE_API_URL}/api/uploads/${orderData.proofOfPayment.image}`} 
                                                        alt={orderData.proofOfPayment.image} 
                                                        className="img-fluid rounded border shadow-sm w-100"
                                                        style={{maxHeight: "200px", objectFit: "cover"}}
                                                    />
                                                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2">
                                                        <span className="badge bg-dark bg-opacity-75 px-3 py-2" style={{fontSize: "10px"}}>
                                                            <i className="fa-solid fa-expand me-1"></i>
                                                            Click to enlarge
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12 col-sm-7 col-md-6 col-lg-7 col-xl-8">
                                                <div className="d-flex align-items-start gap-2 mb-2">
                                                    <i className="fa-solid fa-file-image text-success mt-1" style={{fontSize: "18px"}}></i>
                                                    <div className="flex-grow-1">
                                                        <p className="m-0 fw-semibold text-break" style={{fontSize: "13px"}}>
                                                            {orderData.proofOfPayment.image}
                                                        </p>
                                                        <p className="m-0 text-muted small" style={{fontSize: "11px"}}>
                                                            Payment proof image
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {orderData.proofOfPayment.textMessage && orderData.proofOfPayment.textMessage !== "n/a" && (
                                                    <div className="mt-3 p-2 bg-light rounded">
                                                        <p className="m-0 text-muted small fw-semibold mb-1" style={{fontSize: "11px"}}>
                                                            <i className="fa-solid fa-note-sticky me-1"></i>
                                                            Additional Notes:
                                                        </p>
                                                        <p className="m-0 small" style={{fontSize: "12px"}}>
                                                            {orderData.proofOfPayment.textMessage}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`col-12 mt-2 mt-md-4 
                        ${role === "user" ?
                                noPaymentProof(orderData) ? "col-12 col-md-6 col-lg-5" : "col-md-6 col-lg-5 " :
                                noPaymentProof(orderData) ? "col-md-12 col-lg-6" : "col-md-7 col-lg-6"} `}>
                            <p className="m-0 text-capitalize fw-bold opacity-75 my-4">order summary:</p>

                            <div className="pb-4 border-bottom border-3 p-2 p-md-0 pb-md-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="fa fa-location-dot small"></div>
                                    <p className="m-0 text-capitalize fw-bold">{orderData.firstname + " " + orderData.lastname}</p>
                                </div>
                                <div className="mt-2">
                                    {[orderData.contact, orderData.email, orderData.address].map((data, i) => (
                                        <p key={i} className="m-0 text-capitalize text-capitalize">{data}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 p-2 p-md-0">
                                {[
                                    {
                                        label: "Order placed",
                                        value: new Date(orderData.createdAt).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",   // Dec
                                        day: "2-digit",   // 12
                                        hour: "numeric",  // 4
                                        minute: "2-digit",// 32
                                        hour12: true      // PM
                                        })
                                    },
                                    {
                                        label: "Shipping fee", value: orderData.orderMethod === "delivery"
                                            ? `₱${shippingFee}.00` : "free"
                                    },
                                    { label: "Method of order", value: orderData.orderMethod },
                                    { label: "Mode of payment", value: orderData.paymentType },
                                    { label: "Payment status", value: orderData.paymentStatus },
                                    { label: "Payment ref", value: orderData.refNo },
                                    { label: "Total payment", value: `₱${orderData.totalPrice.toLocaleString("en-PH")}.00` },
                                ].map((data, i) => (
                                    <div key={i} className={`d-flex align-items-center justify-content-between 
                                    mt-2 
                                    ${i === 6 && "fs-5 fw-bold "}`}>
                                        <p className="m-0 text-capitalize">{data.label}:</p>
                                        <p className={`m-0 text-capitalize text-muted  `}>{data.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderDetails;