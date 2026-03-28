import React, { useContext, useRef, useState } from "react";
import { useBreakpointHeight } from "../breakpoint.jsx";
import { appContext } from "../../context/appContext.jsx";
import { adminContext } from "../../context/adminContext.jsx";
import imageCompression from "browser-image-compression";

// ── Contact Input ─────────────────────────────────────────────────────────────
const formatPhoneDisplay = (digits) => {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

const ContactInput = ({ value, onChange }) => {
    const normalize = (val) =>
        String(val ?? "").replace(/\D/g, "").replace(/^63/, "").replace(/^0/, "").slice(0, 10);

    const [localDigits, setLocalDigits] = useState(() => normalize(value));

    React.useEffect(() => {
        setLocalDigits(normalize(value));
    }, [value]);

    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setLocalDigits(digits);
        onChange("+63" + digits);
    };

    return (
        <div className="input-group">
            <span className="input-group-text bg-light fw-semibold" style={{ fontSize: 14 }}>+63</span>
            <input
                type="tel"
                className="form-control border-success border-opacity-25"
                style={{ fontSize: 14 }}
                value={formatPhoneDisplay(localDigits)}
                onChange={handleChange}
                maxLength={12}
                placeholder="9XX XXX XXXX"
            />
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

const OfflineFarmerUpload = ({ onClose }) => {
    const { showNotification } = useContext(appContext);
    const { setTrigger } = useContext(adminContext);

    const height = useBreakpointHeight();
    const fileUploadRef = useRef(null);

    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [imgPreview, setImgPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [farmerData, setFarmerData] = useState({
        id: "",
        firstname: "",
        middlename: "",
        lastname: "",
        suffix: "",
        contact: "",
        isNew: false,
    });

    const [productData, setProductData] = useState({
        name: "",
        price: "",
        category: "",
        productType: "",
        stocks: "",
        kg: "",
        lifeSpan: "",
        disc: "",
        image: null,
    });

    const isProductFilled =
        productData.name &&
        productData.price &&
        productData.category &&
        productData.productType &&
        productData.stocks &&
        productData.kg &&
        productData.lifeSpan &&
        productData.disc &&
        productData.image;

    const isFarmerSelected = farmerData.id || (farmerData.isNew && farmerData.firstname && farmerData.lastname);

    // ── Strict input handlers ─────────────────────────────────────────────────

    // ✅ Letters only — firstname, middlename, lastname (allow hyphen + apostrophe)
    const handleFarmerChange = (e) => {
        const { name, value } = e.target;
        const nameFields = ["firstname", "middlename", "lastname"];
        if (nameFields.includes(name)) {
            const cleaned = value.replace(/[^a-zA-Z\s\-']/g, "");
            setFarmerData((prev) => ({ ...prev, [name]: cleaned }));
            return;
        }
        setFarmerData((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ Letters only — product name and product type (no numbers)
    const handleProductNameChange = (e) => {
        const { name, value } = e.target;
        const cleaned = value.replace(/[^a-zA-Z\s\-']/g, "");
        setProductData((prev) => ({ ...prev, [name]: cleaned }));
    };

    // ✅ Numbers only for price — prevent negative, scientific notation, decimals beyond 2 places
    const handleProductPriceChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        
        // Remove leading zeros but keep single zero
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
            value = value.replace(/^0+/, "0");
        }
        
        // Prevent multiple decimal points
        const parts = value.split(".");
        if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
        }
        
        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + "." + parts[1].slice(0, 2);
        }

        setProductData((prev) => ({ ...prev, price: value }));
    };

    // ✅ Positive integers only for stocks (1-999)
    const handleProductStocksChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        
        // Prevent negative or -1
        if (value === "" || value === "-") {
            value = "";
        } else if (parseInt(value, 10) < 1) {
            value = "";
        } else if (value.length > 3) {
            value = value.slice(0, 3);
        }

        setProductData((prev) => ({ ...prev, stocks: value }));
    };

    // ✅ Positive numbers only for kg — prevent negative
    const handleProductKgChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        
        // If starts with 0, handle properly
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
            value = value.replace(/^0+/, "0");
        }
        
        // Prevent multiple decimal points
        const parts = value.split(".");
        if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
        }
        
        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + "." + parts[1].slice(0, 2);
        }

        setProductData((prev) => ({ ...prev, kg: value }));
    };

    // General product change — selects, textarea
    const handleProductChange = (e) => {
        const { name, value } = e.target;
        setProductData((prev) => ({ ...prev, [name]: value }));
    };

    // ─────────────────────────────────────────────────────────────────────────

    const handleSearch = async (value) => {
        setSearchTerm(value);
        if (!value.trim()) return setSearchResults([]);
        setIsSearching(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/offline-farmers/search?name=${value}`,
                { credentials: "include" }
            );
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectFarmer = (farmer) => {
        setFarmerData({
            id: farmer._id,
            firstname: farmer.firstname,
            middlename: farmer.middlename || "",
            lastname: farmer.lastname,
            suffix: farmer.suffix || "",
            contact: String(farmer.contact || ""),
            isNew: false,
        });
        setSearchTerm(`${farmer.firstname} ${farmer.lastname}`);
        setSearchResults([]);
    };

    const handleNewFarmer = () => {
        setFarmerData({
            id: "",
            firstname: "",
            middlename: "",
            lastname: "",
            suffix: "",
            contact: "",
            isNew: true,
        });
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleBackOrCancel = () => {
        if (farmerData.isNew) {
            setFarmerData({ id: "", firstname: "", middlename: "", lastname: "", suffix: "", contact: "", isNew: false });
        } else {
            onClose();
        }
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.75,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            setProductData((prev) => ({ ...prev, image: compressed }));
            const reader = new FileReader();
            reader.onload = (e) => setImgPreview(e.target.result);
            reader.readAsDataURL(compressed);
        } catch (err) {
            console.error("Image compression error:", err);
        }
    };

    const handleSubmit = async () => {
        setIsUploading(true);
        try {
            const normalizeContact = (val) => {
                if (!val) return "";
                return val.replace(/^\+63/, "0").replace(/\s/g, "");
            };

            const sendData = new FormData();
            sendData.append("farmerId", farmerData.id || "");
            sendData.append("firstname", farmerData.firstname);
            sendData.append("middlename", farmerData.middlename || "");
            sendData.append("lastname", farmerData.lastname);
            sendData.append("suffix", farmerData.suffix || "N/A");
            sendData.append("contact", normalizeContact(farmerData.contact));
            sendData.append("isNewFarmer", farmerData.isNew);

            sendData.append("name", productData.name);
            sendData.append("price", productData.price);
            sendData.append("category", productData.category);
            sendData.append("productType", productData.productType);
            sendData.append("stocks", productData.stocks);
            sendData.append("kg", productData.kg);
            sendData.append("lifeSpan", productData.lifeSpan);
            sendData.append("disc", productData.disc);
            sendData.append("image", productData.image);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/offline-farmer/upload`,
                { method: "POST", body: sendData, credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setTrigger((prev) => !prev);
            showNotification(data.message, "success");
            onClose();
        } catch (err) {
            showNotification(err.message, "error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className="container-fluid position-fixed top-0 start-0 end-0 vh-100 bg-darken"
            style={{ zIndex: 99 }}
        >
            <div className="row justify-content-center mt-4">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card shadow-lg border-0 position-relative" style={{ overflow: "hidden" }}>

                        {/* Close Button */}
                        <button
                            className="btn btn-link position-absolute top-0 end-0 p-3 text-decoration-none"
                            style={{ cursor: "pointer", zIndex: 1 }}
                            onClick={onClose}
                            disabled={isUploading}
                        >
                            <i className="bx bx-x fs-3 text-dark"></i>
                        </button>

                        {/* Header */}
                        <div className="card-header border-0 text-center pt-4 pb-2">
                            <h5 className="m-0 fw-bold text-success text-capitalize">
                                upload product for offline farmer
                            </h5>

                            {/* Stepper */}
                            <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                                <div className="d-flex align-items-center gap-1">
                                    <div
                                        style={{
                                            width: 28, height: 28, fontSize: 13,
                                            backgroundColor: step >= 1 ? "#198754" : "#e9ecef",
                                            color: step >= 1 ? "#fff" : "#6c757d",
                                        }}
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                    >
                                        {step > 1 ? <i className="bx bx-check"></i> : "1"}
                                    </div>
                                    <span className={`small text-capitalize ${step >= 1 ? "text-success fw-semibold" : "text-muted"}`}>
                                        select farmer
                                    </span>
                                </div>

                                <div style={{ width: 40, height: 2, backgroundColor: step > 1 ? "#198754" : "#dee2e6" }}></div>

                                <div className="d-flex align-items-center gap-1">
                                    <div
                                        style={{
                                            width: 28, height: 28, fontSize: 13,
                                            backgroundColor: step >= 2 ? "#198754" : "#e9ecef",
                                            color: step >= 2 ? "#fff" : "#6c757d",
                                        }}
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                    >
                                        2
                                    </div>
                                    <span className={`small text-capitalize ${step >= 2 ? "text-success fw-semibold" : "text-muted"}`}>
                                        product details
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div
                            className="card-body px-4"
                            style={{ overflowY: "auto", maxHeight: height - 220 }}
                        >

                            {/* ───── STEP 1: SELECT FARMER ───── */}
                            {step === 1 && (
                                <div>
                                    {!farmerData.isNew && (
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-search me-1"></i>
                                                search existing farmer
                                            </label>
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control border-success border-opacity-25"
                                                    placeholder="Type farmer name..."
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                />
                                                {isSearching && (
                                                    <div className="position-absolute end-0 top-50 translate-middle-y pe-3">
                                                        <span className="spinner-border spinner-border-sm text-success"></span>
                                                    </div>
                                                )}
                                            </div>

                                            {searchResults.length > 0 && (
                                                <div className="border rounded mt-1 bg-white shadow-sm" style={{ maxHeight: 180, overflowY: "auto" }}>
                                                    {searchResults.map((f) => (
                                                        <div
                                                            key={f._id}
                                                            className="px-3 py-2 small d-flex justify-content-between align-items-center"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => handleSelectFarmer(f)}
                                                        >
                                                            <span>{f.firstname} {f.middlename} {f.lastname} {f.suffix !== "N/A" ? f.suffix : ""}</span>
                                                            {f.contact && <span className="text-muted">{f.contact}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults.length === 0 && searchTerm && !isSearching && (
                                                <p className="text-muted small mt-1 mb-0">No farmer found.</p>
                                            )}
                                        </div>
                                    )}

                                    {farmerData.id && !farmerData.isNew && (
                                        <div className="alert alert-success py-2 d-flex justify-content-between align-items-center">
                                            <span className="small fw-semibold">
                                                <i className="bx bx-user-check me-1"></i>
                                                {farmerData.firstname} {farmerData.lastname}
                                                {farmerData.contact && ` — ${farmerData.contact}`}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline-success py-0"
                                                onClick={() => {
                                                    setFarmerData({ id: "", firstname: "", middlename: "", lastname: "", suffix: "", contact: "", isNew: false });
                                                    setSearchTerm("");
                                                }}
                                            >
                                                change
                                            </button>
                                        </div>
                                    )}

                                    {!farmerData.isNew && (
                                        <>
                                            <div className="d-flex align-items-center gap-2 my-3">
                                                <hr className="flex-grow-1 m-0" />
                                                <span className="text-muted small">or</span>
                                                <hr className="flex-grow-1 m-0" />
                                            </div>

                                            {!farmerData.id && (
                                                <button
                                                    className="btn btn-outline-success w-100 text-capitalize"
                                                    onClick={handleNewFarmer}
                                                >
                                                    <i className="bx bx-user-plus me-1"></i>
                                                    register new offline farmer
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {farmerData.isNew && (
                                        <div>
                                            <div className="mb-3">
                                                <span className="fw-semibold text-success small text-capitalize">
                                                    <i className="bx bx-user-plus me-1"></i>
                                                    new farmer info
                                                </span>
                                            </div>

                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-success text-capitalize">
                                                        first name <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-success border-opacity-25"
                                                        name="firstname"
                                                        value={farmerData.firstname}
                                                        onChange={handleFarmerChange}
                                                        placeholder="First name"
                                                    />
                                                    <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-success text-capitalize">
                                                        last name <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-success border-opacity-25"
                                                        name="lastname"
                                                        value={farmerData.lastname}
                                                        onChange={handleFarmerChange}
                                                        placeholder="Last name"
                                                    />
                                                    <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                                </div>
                                            </div>

                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-success text-capitalize">
                                                        middle name <span className="text-muted fw-normal">(optional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-success border-opacity-25"
                                                        name="middlename"
                                                        value={farmerData.middlename}
                                                        onChange={handleFarmerChange}
                                                        placeholder="Middle name"
                                                    />
                                                    <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small fw-semibold text-success text-capitalize">
                                                        suffix <span className="text-muted fw-normal">(optional)</span>
                                                    </label>
                                                    <select
                                                        className="form-select border-success border-opacity-25"
                                                        name="suffix"
                                                        value={farmerData.suffix}
                                                        onChange={handleFarmerChange}
                                                    >
                                                        <option value="">none</option>
                                                        <option value="Jr.">Jr.</option>
                                                        <option value="Sr.">Sr.</option>
                                                        <option value="II">II</option>
                                                        <option value="III">III</option>
                                                        <option value="IV">IV</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* ✅ Contact — same approach as ViewProfile edit mode */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-success text-capitalize">
                                                    contact no. <span className="text-muted fw-normal">(optional)</span>
                                                </label>
                                                <ContactInput
                                                    value={farmerData.contact}
                                                    onChange={(val) =>
                                                        setFarmerData((prev) => ({ ...prev, contact: val }))
                                                    }
                                                />
                                                <small className="text-muted">Enter 10-digit mobile number (e.g., 912 345 6789)</small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ───── STEP 2: PRODUCT DETAILS ───── */}
                            {step === 2 && (
                                <div>
                                    <div className="alert alert-success py-2 mb-4 small">
                                        <i className="bx bx-user me-1"></i>
                                        <span className="fw-semibold">Farmer: </span>
                                        {farmerData.firstname} {farmerData.middlename} {farmerData.lastname}
                                        {farmerData.suffix && farmerData.suffix !== "N/A" ? ` ${farmerData.suffix}` : ""}
                                        {farmerData.contact && ` — ${farmerData.contact}`}
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-package me-1"></i>
                                                product name <span className="text-muted fw-normal">(variety)</span>
                                            </label>
                                            {/* ✅ Letters only */}
                                            <input
                                                type="text"
                                                className="form-control border-success border-opacity-25"
                                                name="name"
                                                value={productData.name}
                                                onChange={handleProductNameChange}
                                                placeholder="e.g. Lakatan, Red Tomato"
                                            />
                                            <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-money me-1"></i>
                                                price
                                            </label>
                                            <input type="text" className="form-control border-success border-opacity-25" name="price" value={productData.price} onChange={handleProductPriceChange} placeholder="Enter price" />
                                        </div>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-shape-circle me-1"></i>
                                                product type <span className="text-muted fw-normal">(generic)</span>
                                            </label>
                                            {/* ✅ Letters only */}
                                            <input
                                                type="text"
                                                className="form-control border-success border-opacity-25"
                                                name="productType"
                                                value={productData.productType}
                                                onChange={handleProductNameChange}
                                                placeholder="e.g. Banana, Tomato"
                                            />
                                            <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-category me-1"></i>
                                                category
                                            </label>
                                            <select className="form-select border-success border-opacity-25" name="category" value={productData.category} onChange={handleProductChange}>
                                                <option value="" hidden>select category</option>
                                                {['fruits','fruit vegetables','leafy vegetables','root crops','grains','legumes'].map((c, i) => (
                                                    <option key={i} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-box me-1"></i>
                                                stocks (bundles)
                                            </label>
                                            <input type="text" className="form-control border-success border-opacity-25" name="stocks" value={productData.stocks} onChange={handleProductStocksChange} placeholder="Number of bundles" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold text-success small text-capitalize">
                                                <i className="bx bx-package me-1"></i>
                                                kg per bundle
                                            </label>
                                            <select className="form-select border-success border-opacity-25" name="kg" value={productData.kg} onChange={handleProductChange}>
                                                <option value="" hidden>select kg</option>
                                                {Array.from({ length: 25 * 4 }, (_, i) => {
                                                    const kg = 1 + i * 0.25;
                                                    if (kg <= 25) return <option key={i} value={kg}>{kg % 1 === 0 ? kg : kg.toFixed(2).replace(/\.?0+$/, "")} kg</option>;
                                                    return null;
                                                }).filter(Boolean)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-success small text-capitalize">
                                            <i className="bx bx-time me-1"></i>
                                            life span (days)
                                        </label>
                                        <select className="form-select border-success border-opacity-25" name="lifeSpan" value={productData.lifeSpan} onChange={handleProductChange}>
                                            <option value="" hidden>select life span</option>
                                            {Array.from({ length: 14 }, (_, i) => (
                                                <option key={i} value={i + 1}>{i + 1} days</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-success small text-capitalize">
                                            <i className="bx bx-detail me-1"></i>
                                            description
                                        </label>
                                        <textarea className="form-control border-success border-opacity-25" name="disc" value={productData.disc} onChange={handleProductChange} rows="4" placeholder="Enter product description" style={{ resize: "none" }} />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-success small text-capitalize">
                                            <i className="bx bx-image me-1"></i>
                                            product image
                                        </label>
                                        <input type="file" className="form-control border-success border-opacity-25" accept="image/*" onChange={handleFile} ref={fileUploadRef} />
                                        {imgPreview && (
                                            <div className="mt-3 position-relative d-inline-block py-2 pe-2">
                                                <i
                                                    className="bx bx-x text-dark fs-5 position-absolute top-0 end-0 bg-white d-flex align-items-center justify-content-center rounded-circle shadow"
                                                    style={{ cursor: "pointer", width: 25, height: 25 }}
                                                    onClick={() => {
                                                        setImgPreview(null);
                                                        setProductData(p => ({ ...p, image: null }));
                                                        fileUploadRef.current.value = null;
                                                    }}
                                                ></i>
                                                <div className="overflow-hidden rounded-2 shadow-sm" style={{ aspectRatio: "4/3" }}>
                                                    <img src={imgPreview} className="img-fluid w-100 h-100" style={{ objectFit: "cover", maxHeight: 150 }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="card-footer border-0 d-flex gap-2 justify-content-end">
                            {step === 1 ? (
                                <button
                                    className="btn btn-outline-secondary px-4 text-capitalize d-flex align-items-center"
                                    onClick={handleBackOrCancel}
                                    disabled={isUploading}
                                >
                                    {farmerData.isNew
                                        ? <><i className="bx bx-chevron-left me-1"></i> back</>
                                        : <><i className="bx bx-x-circle me-1"></i> cancel</>
                                    }
                                </button>
                            ) : (
                                <button
                                    className="btn btn-outline-secondary px-4 text-capitalize d-flex align-items-center"
                                    onClick={() => setStep(1)}
                                    disabled={isUploading}
                                >
                                    <i className="bx bx-chevron-left me-1"></i> back
                                </button>
                            )}

                            {step === 1 ? (
                                <button
                                    className="btn btn-success px-4 text-capitalize d-flex align-items-center"
                                    onClick={() => setStep(2)}
                                    disabled={!isFarmerSelected}
                                >
                                    next <i className="bx bx-chevron-right ms-1"></i>
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success px-4 text-capitalize d-flex align-items-center"
                                    onClick={handleSubmit}
                                    disabled={isUploading || !isProductFilled}
                                >
                                    {isUploading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>uploading...</>
                                    ) : (
                                        <><i className="bx bx-check-circle me-1"></i>upload product</>
                                    )}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfflineFarmerUpload;