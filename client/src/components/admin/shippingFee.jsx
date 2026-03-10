import { useContext, useState } from "react";
import { appContext } from "../../context/appContext.jsx";
import Toast from "../toastNotif.jsx";



const ShippingFee = () => {
    const { shippingFee, setShippingFee, 
            showToast,
            toastMessage,
            toastType,
            showNotification,
            setShowToast,
     } = useContext(appContext);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleEdit = () => {
        setInputValue(shippingFee.amount);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputValue("");
    };

    
    const handleSave = async () => {
        if (!inputValue || inputValue <= 0) {
            return showNotification("Please enter a valid amount", "error");
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateShippingFee`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(inputValue) }),
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            console.log(data);  


            setShippingFee(data);
            setIsEditing(false);
            showNotification("Shipping fee updated successfully!", "success");
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    };



    if (shippingFee.isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                <div className="text-center">
                    <div className="spinner-border text-success" role="status">     
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="small text-muted mt-2">Loading Shipping fee...</p>
                </div>
            </div>
        );
    }


    return (
        <>

        <Toast 
            show={showToast}
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
        />


        <div className="p-4">
            <div className="card border shadow-sm">
                <div className="card-body p-4">
                    <h5 className="fw-bold m-0 text-success">
                        <i className="fa-solid fa-truck me-2"></i>
                        Shipping Fee
                    </h5>
                    <p className="text-muted small m-0">Manage delivery fee for all orders</p>
                </div>
            </div>

            <div className="row mt-2">
                <div className="col-12 ">
                    <div className="card border shadow-sm">
                        <div className="card-body p-4">
                            <p className="text-muted small text-uppercase fw-semibold mb-1"
                                style={{ letterSpacing: "1px" }}>
                                Current Delivery Fee
                            </p>

                            {!isEditing ? (
                                <>
                                    <h1 className="fw-bold text-dark mb-3">
                                        ₱{shippingFee.amount?.toLocaleString("en-PH")}.00
                                    </h1>

                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={handleEdit}
                                    >
                                        <i className="fa fa-pen me-2"></i>
                                        Edit Fee
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <span className="fw-bold fs-5">₱</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            min="1"
                                            autoFocus
                                            style={{ maxWidth: "140px" }}
                                        />
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={handleSave}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-check me-2"></i>
                                                    Save
                                                </>
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                        >
                                            <i className="fa fa-times me-2"></i>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}

                            <hr className="my-3" />

                            <div className="d-flex flex-column gap-1">
                                <p className="m-0 small text-muted">
                                    <i className="fa fa-clock me-2"></i>
                                    Last updated: <span className="text-dark">{formatDate(shippingFee.updatedAt)}</span>
                                </p>
                                <p className="m-0 small text-muted">
                                    <i className="fa fa-user me-2"></i>
                                    Updated by: <span className="text-dark text-capitalize">{shippingFee.updatedBy}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            


        </div>
        </>

    );
};

export default ShippingFee;