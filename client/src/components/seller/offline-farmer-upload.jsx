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
        <input
            type="tel"
            className="form-control form-control-sm"
            style={{ fontSize: 14, borderColor: "#d1e7d1", borderRadius: 8 }}
            value={formatPhoneDisplay(localDigits)}
            onChange={handleChange}
            maxLength={12}
            placeholder="9XX XXX XXXX"
        />
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
    const [imgPreviews, setImgPreviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ── Farmer Data ──
    const [farmerData, setFarmerData] = useState({
        id: "",
        firstname: "",
        middlename: "",
        lastname: "",
        suffix: "",
        contact: "",
        isNew: false,
    });

    // ── Product Data ──
    const [productData, setProductData] = useState({
        name: "",
        price: "",
        category: "",
        productType: "",
        stocks: "",
        unit: "bundle",   // ← added
        kg: "",
        lifeSpan: "",
        disc: "",
        imageFile: [],
    });

    // ── Validation ──
    const isFarmerSelected = farmerData.id || (farmerData.isNew && farmerData.firstname && farmerData.lastname);
    const kgRequired = productData.unit === "kg";
    const isProductFilled =
        productData.name &&
        productData.price &&
        productData.category &&
        productData.productType &&
        productData.stocks &&
        productData.disc &&
        productData.lifeSpan &&
        (imgPreviews.length > 0) &&
        (kgRequired ? !!productData.kg : true); // ← kg only when unit is kg

    // ── Input Handlers ──
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

    const handleProductNameChange = (e) => {
        const { name, value } = e.target;
        const cleaned = value.replace(/[^a-zA-Z\s\-']/g, "");
        setProductData((prev) => ({ ...prev, [name]: cleaned }));
    };

    const handleProductPriceChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
            value = value.replace(/^0+/, "0");
        }
        const parts = value.split(".");
        if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
        setProductData((prev) => ({ ...prev, price: value }));
    };

    const handleProductStocksChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value === "" || value === "-") value = "";
        else if (parseInt(value, 10) < 1) value = "";
        else if (value.length > 3) value = value.slice(0, 3);
        setProductData((prev) => ({ ...prev, stocks: value }));
    };

    const handleProductKgChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
            value = value.replace(/^0+/, "0");
        }
        const parts = value.split(".");
        if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
        if (value && !value.endsWith(".") && parseFloat(value) > 100) value = "";
        if (value && !value.endsWith(".") && parseFloat(value) < 1) value = "";
        setProductData((prev) => ({ ...prev, kg: value }));
    };

    const handleProductLifeSpanChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value === "0") value = "";
        if (value && parseInt(value, 10) > 40) value = "";
        setProductData((prev) => ({ ...prev, lifeSpan: value }));
    };

    const handleProductChange = (e) => {
        const { name, value } = e.target;
        if (name === "disc" && value.length > 500) return;
        setProductData((prev) => ({ ...prev, [name]: value }));
    };

    // ── Farmer Search ──
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
        setStep(2);
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

    const handleBackFromStep2 = () => {
        if (farmerData.isNew) {
            setFarmerData({ id: "", firstname: "", middlename: "", lastname: "", suffix: "", contact: "", isNew: false });
        }
        setProductData({ name: "", price: "", category: "", productType: "", stocks: "", unit: "bundle", kg: "", lifeSpan: "", disc: "", imageFile: [] });
        setImgPreviews([]);
        setStep(1);
    };

    const handleFile = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const currentCount = imgPreviews.length;
        const remaining = 3 - currentCount;
        if (remaining <= 0) return;

        const toAdd = files.slice(0, remaining);

        try {
            const options = { maxSizeMB: 0.75, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressed = await Promise.all(
                toAdd.map(async (file) => {
                    const compressedFile = await imageCompression(file, options);
                    return {
                        file: compressedFile,
                        previewUrl: URL.createObjectURL(compressedFile),
                    };
                })
            );
            setImgPreviews((prev) => [...prev, ...compressed]);
        } catch (error) {
            console.error("Error compressing image:", error);
            showNotification("Failed to compress image", "error");
        }

        if (fileUploadRef.current) fileUploadRef.current.value = null;
    };

    const removePreview = (index) => {
        setImgPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFarmerSelected || !isProductFilled) {
            showNotification("Please fill out all required fields.", "error");
            return;
        }

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
            sendData.append("unit", productData.unit);           // ← added
            sendData.append("lifeSpan", productData.lifeSpan);   // ← always append

            if (kgRequired) {
                sendData.append("kg", productData.kg);           // ← only for kg unit
            }

            sendData.append("disc", productData.disc);
            
            // ← append multiple images
            imgPreviews.forEach(({ file }) => sendData.append("imageFile", file));

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/offline-farmer/upload`,
                { method: "POST", body: sendData, credentials: "include" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setTrigger((prev) => !prev);
            setImgPreviews([]);
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
            className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-start justify-content-center"
            style={{ zIndex: 99, backgroundColor: "rgba(0,0,0,0.45)", padding: "1.25rem 1rem", overflowY: "auto" }}
        >
            <div
                className="w-100 bg-white rounded-4 shadow-lg"
                style={{ maxWidth: "560px", marginTop: "auto", marginBottom: "auto" }}
            >
                {/* ── Header ── */}
                <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-3 bg-success bg-opacity-10"
                            style={{ width: 36, height: 36 }}
                        >
                            <i className={`bx ${step === 1 ? "bx-user-plus" : "bx-package"} text-success fs-5`}></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-dark text-capitalize" style={{ letterSpacing: "-0.2px" }}>
                            {step === 1 ? "Select Farmer" : "Upload Product"}
                        </h6>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ width: 32, height: 32 }}
                        onClick={onClose}
                        disabled={isUploading}
                    >
                        <i className="bx bx-x fs-5 text-secondary"></i>
                    </button>
                </div>

                {/* ── Stepper ── */}
                <div className="d-flex align-items-center justify-content-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #e9ecef" }}>
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
                    <div style={{ width: 40, height: 2, backgroundColor: step > 1 ? "#198754" : "#dee2e6" }}></div>
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
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit}>
                    <div
                        className="px-4 py-3"
                        style={{ overflowY: "auto", maxHeight: height - 260 }}
                    >
                        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
                        {/* STEP 1: SELECT FARMER */}
                        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
                        {step === 1 && (
                            <div>
                                {!farmerData.isNew && (
                                    <>
                                        <div className="mb-4">
                                            <label className="form-label fw-semibold text-dark small mb-2">
                                                <i className="bx bx-search me-1"></i>
                                                Search Existing Farmer
                                            </label>
                                            <div className="position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Type farmer name..."
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                    disabled={isUploading}
                                                />
                                                {isSearching && (
                                                    <div className="position-absolute end-0 top-50 translate-middle-y pe-3">
                                                        <span className="spinner-border spinner-border-sm text-success"></span>
                                                    </div>
                                                )}
                                            </div>

                                            {searchResults.length > 0 && (
                                                <div className="border rounded mt-2 bg-white shadow-sm" style={{ maxHeight: 200, overflowY: "auto" }}>
                                                    {searchResults.map((f) => (
                                                        <div
                                                            key={f._id}
                                                            className="px-3 py-2 small d-flex justify-content-between align-items-center"
                                                            style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                                            onClick={() => handleSelectFarmer(f)}
                                                        >
                                                            <span className="fw-semibold">{f.firstname} {f.middlename} {f.lastname} {f.suffix !== "N/A" ? f.suffix : ""}</span>
                                                            {f.contact && <span className="text-muted small">{f.contact}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults.length === 0 && searchTerm && !isSearching && (
                                                <p className="text-muted small mt-2 mb-0">No farmer found.</p>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-2 my-3">
                                            <hr className="flex-grow-1 m-0" />
                                            <span className="text-muted small">or</span>
                                            <hr className="flex-grow-1 m-0" />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-outline-success w-100 text-capitalize btn-sm"
                                            onClick={handleNewFarmer}
                                            style={{ borderRadius: 8 }}
                                            disabled={isUploading}
                                        >
                                            <i className="bx bx-user-plus me-1"></i>
                                            Register New Offline Farmer
                                        </button>
                                    </>
                                )}

                                {farmerData.isNew && (
                                    <div>
                                        <span className="fw-semibold text-success small text-capitalize mb-3 d-block">
                                            <i className="bx bx-user-plus me-1"></i>
                                            New Farmer Information
                                        </span>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    First Name <span className="text-danger ms-1">*</span>
                                                </label>
                                                <input
                                                    type="text" className="form-control form-control-sm"
                                                    name="firstname" value={farmerData.firstname}
                                                    onChange={handleFarmerChange} placeholder="First name"
                                                    disabled={isUploading} style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                />
                                                <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    Last Name <span className="text-danger ms-1">*</span>
                                                </label>
                                                <input
                                                    type="text" className="form-control form-control-sm"
                                                    name="lastname" value={farmerData.lastname}
                                                    onChange={handleFarmerChange} placeholder="Last name"
                                                    disabled={isUploading} style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                />
                                                <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                            </div>
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    Middle Name <span className="text-muted fw-normal">(optional)</span>
                                                </label>
                                                <input
                                                    type="text" className="form-control form-control-sm"
                                                    name="middlename" value={farmerData.middlename}
                                                    onChange={handleFarmerChange} placeholder="Middle name"
                                                    disabled={isUploading} style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                />
                                                <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    Suffix <span className="text-muted fw-normal">(optional)</span>
                                                </label>
                                                <input
                                                    type="text" className="form-control form-control-sm"
                                                    name="suffix" value={farmerData.suffix}
                                                    onChange={(e) => {
                                                        const cleaned = e.target.value.replace(/[^a-zA-Z.\s]/g, '');
                                                        setFarmerData((prev) => ({ ...prev, suffix: cleaned }));
                                                    }}
                                                    placeholder="e.g., Jr., Sr., MD..."
                                                    maxLength={10} disabled={isUploading}
                                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                    list="suffix-options"
                                                />
                                                <datalist id="suffix-options">
                                                    {['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                                                    'MD', 'DDS', 'DMD', 'RN', 'PhD', 'EdD', 'JD', 'Esq.', 'CPA', 'Ret.'
                                                    ].map((s, i) => <option key={i} value={s} />)}
                                                </datalist>
                                                <small className="text-muted" style={{ fontSize: 11 }}>Type or select</small>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold text-dark mb-1">
                                                Contact No. <span className="text-muted fw-normal">(optional)</span>
                                            </label>
                                            <ContactInput
                                                value={farmerData.contact}
                                                onChange={(val) => setFarmerData((prev) => ({ ...prev, contact: val }))}
                                            />
                                            <small className="text-muted">Enter 10-digit mobile number</small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
                        {/* STEP 2: PRODUCT DETAILS */}
                        {/* ══════════════════════════════════════════════════════════════════════════════════ */}
                        {step === 2 && (
                            <div>
                                {/* Farmer Info Alert */}
                                <div className="alert alert-success py-2 mb-4 small">
                                    <i className="bx bx-user me-1"></i>
                                    <span className="fw-semibold">Farmer: </span>
                                    {farmerData.firstname} {farmerData.middlename} {farmerData.lastname}
                                    {farmerData.suffix && farmerData.suffix !== "N/A" ? ` ${farmerData.suffix}` : ""}
                                    {farmerData.contact && ` — ${farmerData.contact}`}
                                </div>

                                {/* IMAGE UPLOAD */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold text-dark small mb-2">
                                        Product Images <span className="text-danger ms-1">*</span>
                                        <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.75rem" }}>(max 3)</span>
                                    </label>

                                    {imgPreviews.length > 0 && (
                                        <div className="d-flex flex-column gap-2 mb-3">
                                            {imgPreviews.map((item, i) => (
                                                <div
                                                    key={`new-${i}`}
                                                    className="d-flex align-items-center gap-3 rounded-3 border border-success px-3"
                                                    style={{ height: 56, background: "#f6fbf6" }}
                                                >
                                                    <div className="rounded-2 overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                                                        <img src={item.previewUrl} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                                                    </div>
                                                    <div className="flex-grow-1 overflow-hidden">
                                                        <p className="m-0 small fw-semibold text-dark text-truncate">{item.file.name}</p>
                                                        <p className="m-0 text-muted" style={{ fontSize: "0.7rem" }}>{(item.file.size / 1024).toFixed(0)} KB</p>
                                                    </div>
                                                    {!isUploading && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0 p-0"
                                                            style={{ width: 28, height: 28, borderRadius: 6, background: "#fff0f0", border: "1px solid #fcc", color: "#dc3545" }}
                                                            onClick={() => removePreview(i)}
                                                        >
                                                            <i className="bx bx-trash" style={{ fontSize: "0.85rem" }}></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(() => {
                                        const total = imgPreviews.length;
                                        if (total >= 3) return null;
                                        return (
                                            <label
                                                htmlFor="inputFile"
                                                className="d-flex align-items-center justify-content-center gap-2 rounded-3 border border-2 border-dashed"
                                                style={{ height: 72, borderColor: "#c4e0c4", background: "#f6fbf6", cursor: isUploading ? "not-allowed" : "pointer" }}
                                            >
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" style={{ width: 36, height: 36 }}>
                                                    <i className="bx bx-cloud-upload text-success fs-5"></i>
                                                </div>
                                                <div>
                                                    <p className="mb-0 small fw-semibold text-success" style={{ lineHeight: 1.3 }}>
                                                        {total > 0 ? `Add more (${total}/3)` : "Click to upload image"}
                                                    </p>
                                                    <p className="mb-0 text-muted" style={{ fontSize: "0.70rem" }}>PNG, JPG, WEBP — max 0.75 MB each</p>
                                                </div>
                                            </label>
                                        );
                                    })()}

                                    <input
                                        type="file" id="inputFile" name="imageFile" accept="image/*" multiple
                                        onChange={handleFile} ref={fileUploadRef} disabled={isUploading} className="d-none"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                                    <span className="text-muted small">Product Details</span>
                                    <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                                </div>

                                {/* ── Unit Type ── */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Unit Type <span className="text-danger ms-1">*</span>
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        name="unit"
                                        value={productData.unit}
                                        onChange={handleProductChange}
                                        disabled={isUploading}
                                        style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                    >
                                        <option value="bundle">Bundle/Tali</option>
                                        <option value="kg">Kilogram (kg)</option>
                                    </select>
                                </div>

                                {/* Row 1: Name + Price */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Product Name <span className="text-muted fw-normal">(variety)</span>
                                            <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            name="name" value={productData.name || ""}
                                            onChange={handleProductNameChange}
                                            placeholder="e.g., Lakatan, Red Tomato"
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Price (₱) <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            name="price" value={productData.price || ""}
                                            onChange={handleProductPriceChange}
                                            placeholder="0.00" disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Product Type + Category */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Product Type <span className="text-muted fw-normal">(generic)</span>
                                            <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            name="productType" value={productData.productType || ""}
                                            onChange={handleProductNameChange}
                                            placeholder="e.g., Banana, Tomato" disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Category <span className="text-danger ms-1">*</span>
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            name="category" value={productData.category || ""}
                                            onChange={handleProductChange} disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        >
                                            <option value="" hidden>Select category</option>
                                            {["fruits", "fruit vegetables", "leafy vegetables", "root crops", "grains", "legumes"].map((d, i) => (
                                                <option key={i} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Stocks + Kg per Stock (kg unit only) */}
                                <div className="row g-3 mb-3">
                                    <div className={kgRequired ? "col-md-6" : "col-12"}>
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            {kgRequired ? "Stocks (kg)" : "Stocks (bundles)"}
                                            <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            name="stocks" value={productData.stocks || ""}
                                            onChange={handleProductStocksChange}
                                            placeholder="e.g., 50" disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>

                                    {kgRequired && (
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold text-dark mb-1">
                                                Kg per Stock <span className="text-danger ms-1">*</span>
                                            </label>
                                            <input
                                                type="text" className="form-control form-control-sm"
                                                name="kg" value={productData.kg || ""}
                                                onChange={handleProductKgChange}
                                                placeholder="e.g., 5.5" disabled={isUploading}
                                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                            />
                                            <small className="text-muted" style={{ fontSize: "0.72rem" }}>Min 1 kg – Max 100 kg</small>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Life Span — for all units */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Life Span (days) <span className="text-danger ms-1">*</span>
                                    </label>
                                    <input
                                        type="text" className="form-control form-control-sm"
                                        name="lifeSpan" value={productData.lifeSpan || ""}
                                        onChange={handleProductLifeSpanChange}
                                        placeholder="e.g., 7" disabled={isUploading}
                                        style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                    />
                                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>Max 40 days</small>
                                </div>

                                {/* Description */}
                                <div className="mb-1">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Description <span className="text-danger ms-1">*</span>
                                    </label>
                                    <textarea
                                        className="form-control form-control-sm"
                                        name="disc" value={productData.disc || ""}
                                        onChange={handleProductChange}
                                        rows={3}
                                        placeholder="Describe the product — freshness, origin, or notes for buyers..."
                                        disabled={isUploading}
                                        style={{ resize: "none", borderColor: "#d1e7d1", borderRadius: 8 }}
                                    />
                                    <div className="d-flex justify-content-end mt-1">
                                        <small className={`${(productData.disc?.length || 0) >= 500 ? "text-danger" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                                            {productData.disc?.length || 0}/500
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="d-flex justify-content-end gap-2 px-4 py-3 border-top"
                        style={{ background: "#fafafa", borderRadius: "0 0 1rem 1rem" }}
                    >
                        {step === 1 ? (
                            <>
                                <button
                                    type="button" className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                                    onClick={onClose} disabled={isUploading} style={{ borderRadius: 8 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-success px-4 fw-semibold d-flex align-items-center gap-2"
                                    onClick={() => setStep(2)}
                                    disabled={!isFarmerSelected || isUploading}
                                    style={{ borderRadius: 8, minWidth: 110 }}
                                >
                                    Next <i className="bx bx-chevron-right"></i>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button" className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                                    onClick={handleBackFromStep2} disabled={isUploading} style={{ borderRadius: 8 }}
                                >
                                    <i className="bx bx-chevron-left me-1"></i>Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-sm btn-success px-4 fw-semibold d-flex align-items-center gap-2"
                                    disabled={isUploading || !isProductFilled}
                                    style={{ borderRadius: 8, minWidth: 110 }}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            Uploading…
                                        </>
                                    ) : (
                                        <>
                                            <i className="bx bx-check-circle"></i>
                                            Upload Product
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfflineFarmerUpload;