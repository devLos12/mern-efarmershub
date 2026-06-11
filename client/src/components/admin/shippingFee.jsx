import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { appContext } from "../../context/appContext.jsx";
import Toast from "../toastNotif.jsx";
import { useLocation } from "react-router-dom";
import { adminContext } from "../../context/adminContext.jsx";

// Individual puroks — fully customizable by admin
const PUROKS = ["1", "2", "3", "4", "5", "6"];

const ShippingFee = () => {
    const { showToast, toastMessage, toastType, showNotification, setShowToast } = useContext(appContext);
    const { setTextHeader } = useContext(adminContext);
    const location = useLocation();

    const [isEditingBase, setIsEditingBase] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [surchargeInputs, setSurchargeInputs] = useState(
        Object.fromEntries(PUROKS.map((p) => [p, ""]))
    );
    const [isEditingSurcharge, setIsEditingSurcharge] = useState(false);

    const [shippingFee, setShippingFee] = useState({
        amount: 60,
        surcharges: [],
        updatedBy: "admin",
        updatedAt: null,
        isLoading: false,
    });

    useLayoutEffect(() => {
        setTextHeader(location?.state?.title);
    }, [location?.state?.title]);

    useEffect(() => {
        getShippingFee();
    }, []);

    const getShippingFee = async () => {
        setShippingFee((prev) => ({ ...prev, isLoading: true }));
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getShippingFee`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShippingFee({ ...data, isLoading: false });
        } catch (error) {
            console.log("Error: ", error.message);
            setShippingFee((prev) => ({ ...prev, isLoading: false }));
        }
    };

    // ── Base Fee ──
    const handleEditBase = () => {
        setInputValue(shippingFee.amount);
        setIsEditingBase(true);
    };

    const handleCancelBase = () => {
        setIsEditingBase(false);
        setInputValue("");
    };

    const handleSaveBase = async () => {
        if (!inputValue || inputValue <= 0) {
            return showNotification("Please enter a valid amount", "error");
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateShippingFee`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(inputValue),
                    surcharges: shippingFee.surcharges,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShippingFee({ ...data, isLoading: false });
            setIsEditingBase(false);
            showNotification("Base shipping fee updated!", "success");
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Surcharges ──
    const handleEditSurcharge = () => {
        const inputs = {};
        PUROKS.forEach((purok) => {
            const match = shippingFee.surcharges?.find((s) => s.purok === purok);
            inputs[purok] = match ? String(match.additionalFee) : "0";
        });
        setSurchargeInputs(inputs);
        setIsEditingSurcharge(true);
    };

    const handleCancelSurcharge = () => {
        setIsEditingSurcharge(false);
    };

    const handleSaveSurcharge = async () => {
        for (const purok of PUROKS) {
            const val = surchargeInputs[purok];
            if (val === "" || isNaN(Number(val)) || Number(val) < 0) {
                return showNotification(`Invalid surcharge for Purok ${purok}`, "error");
            }
        }

        const newSurcharges = PUROKS.map((purok) => ({
            purok,
            additionalFee: Number(surchargeInputs[purok]),
        }));

        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateShippingFee`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: shippingFee.amount,
                    surcharges: newSurcharges,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShippingFee({ ...data, isLoading: false });
            setIsEditingSurcharge(false);
            showNotification("Surcharges updated!", "success");
        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const getSurcharge = (purok) => {
        const match = shippingFee.surcharges?.find((s) => s.purok === purok);
        return match ? match.additionalFee : 0;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
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
            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />

            <div className="p-4">
                {/* Header */}
                <div className="card border shadow-sm mb-3">
                    <div className="card-body p-4">
                        <h5 className="fw-bold m-0 text-success">
                            <i className="fa-solid fa-truck me-2"></i>
                            Shipping Fee
                        </h5>
                        <p className="text-muted small m-0">Manage delivery fee and purok surcharges</p>
                    </div>
                </div>

                <div className="row g-3">
                    {/* ── Base Fee Card ── */}
                    <div className="col-12 col-md-6">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body p-4">
                                <p className="text-muted small text-uppercase fw-semibold mb-1" style={{ letterSpacing: "1px" }}>
                                    Base Delivery Fee
                                </p>

                                {!isEditingBase ? (
                                    <>
                                        <h1 className="fw-bold text-dark mb-1">
                                            ₱{shippingFee.amount?.toLocaleString("en-PH")}.00
                                        </h1>
                                        <p className="text-muted small mb-3">Applied to all deliveries before surcharge</p>
                                        <button className="btn btn-outline-success btn-sm" onClick={handleEditBase}>
                                            <i className="fa fa-pen me-2"></i>Edit Fee
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
                                            <button className="btn btn-success btn-sm" onClick={handleSaveBase} disabled={isLoading}>
                                                {isLoading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                                ) : (
                                                    <><i className="fa fa-check me-2"></i>Save</>
                                                )}
                                            </button>
                                            <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelBase} disabled={isLoading}>
                                                <i className="fa fa-times me-2"></i>Cancel
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

                    {/* ── Surcharges Card ── */}
                    <div className="col-12 col-md-6">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body p-4">
                                <p className="text-muted small text-uppercase fw-semibold mb-1" style={{ letterSpacing: "1px" }}>
                                    Purok Surcharges
                                </p>
                                <p className="text-muted small mb-3">Additional fee based on delivery distance per purok</p>

                                {!isEditingSurcharge ? (
                                    <>
                                        <div className="d-flex flex-column gap-2 mb-3">
                                            {PUROKS.map((purok) => (
                                                <div key={purok}
                                                    className="d-flex align-items-center justify-content-between p-2 rounded-3"
                                                    style={{ background: "#f6fbf6", border: "1px solid #d1e7d1" }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10"
                                                            style={{ width: 32, height: 32 }}>
                                                            <i className="fa-solid fa-location-dot text-success" style={{ fontSize: "12px" }}></i>
                                                        </div>
                                                        <span className="small fw-semibold text-dark">Purok {purok}</span>
                                                    </div>
                                                    <span className={`fw-medium small ${getSurcharge(purok) === 0 ? "text-success" : "text-warning"}`}>
                                                        {getSurcharge(purok) === 0 ? "No surcharge" : `+₱${getSurcharge(purok)}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Preview */}
                                        <div className="p-2 rounded-3 mb-3" style={{ background: "#fffbf0", border: "1px solid #ffe69c" }}>
                                            <p className="m-0 small fw-semibold text-warning-emphasis mb-1">
                                                <i className="fa fa-lightbulb me-1"></i>Preview
                                            </p>
                                            {PUROKS.map((purok) => (
                                                <p key={purok} className="m-0 small text-muted">
                                                    Purok {purok} → ₱{shippingFee.amount + getSurcharge(purok)}.00 total
                                                </p>
                                            ))}
                                        </div>

                                        <button className="btn btn-outline-success btn-sm" onClick={handleEditSurcharge}>
                                            <i className="fa fa-pen me-2"></i>Edit Surcharges
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="d-flex flex-column gap-2 mb-3">
                                            {PUROKS.map((purok) => (
                                                <div key={purok}
                                                    className="d-flex align-items-center justify-content-between p-2 rounded-3"
                                                    style={{ background: "#f6fbf6", border: "1px solid #d1e7d1" }}>
                                                    <span className="small fw-semibold text-dark">Purok {purok}</span>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="small text-muted">+₱</span>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={surchargeInputs[purok]}
                                                            onChange={(e) =>
                                                                setSurchargeInputs((prev) => ({ ...prev, [purok]: e.target.value }))
                                                            }
                                                            min="0"
                                                            style={{ maxWidth: "80px" }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-success btn-sm" onClick={handleSaveSurcharge} disabled={isLoading}>
                                                {isLoading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                                ) : (
                                                    <><i className="fa fa-check me-2"></i>Save</>
                                                )}
                                            </button>
                                            <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelSurcharge} disabled={isLoading}>
                                                <i className="fa fa-times me-2"></i>Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShippingFee;