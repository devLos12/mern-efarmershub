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

    const [step, setStep] = useState(1); // Step 1: Farmer, Step 2: Product
    const [isUploading, setIsUploading] = useState(false);
    const [imgPreview, setImgPreview] = useState(null);
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
        kg: "",
        lifeSpan: "",
        disc: "",
        image: null,
    });

    // ── Validation ──
    const isFarmerSelected = farmerData.id || (farmerData.isNew && farmerData.firstname && farmerData.lastname);
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
        if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
        }
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + "." + parts[1].slice(0, 2);
        }
        setProductData((prev) => ({ ...prev, price: value }));
    };

    const handleProductStocksChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value === "" || value === "-") {
            value = "";
        } else if (parseInt(value, 10) < 1) {
            value = "";
        } else if (value.length > 3) {
            value = value.slice(0, 3);
        }
        setProductData((prev) => ({ ...prev, stocks: value }));
    };






    // const handleProductKgChange = (e) => {
    //     let value = e.target.value.replace(/[^0-9.]/g, "");
    //     if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
    //         value = value.replace(/^0+/, "0");
    //     }
    //     const parts = value.split(".");
    //     if (parts.length > 2) {
    //         value = parts[0] + "." + parts.slice(1).join("");
    //     }
    //     if (parts.length === 2 && parts[1].length > 2) {
    //         value = parts[0] + "." + parts[1].slice(0, 2);
    //     }
    //     setProductData((prev) => ({ ...prev, kg: value }));
    // };





    const handleProductKgChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
            value = value.replace(/^0+/, "0");
        }
        const parts = value.split(".");
        if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
        }
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + "." + parts[1].slice(0, 2);
        }


        // Limit to min 1 kg and max 100 kg
        if (value && !value.endsWith(".") && parseFloat(value) > 100) {
            value = "";
        }
        if (value && !value.endsWith(".") && parseFloat(value) < 1) {
            value = "";
        }


        setProductData((prev) => ({ ...prev, kg: value }));
    };

    


    const handleProductLifeSpanChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        
        // Prevent zero
        if (value === "0") {
            value = "";
        }
        
        // Limit to max 40 days
        if (value && parseInt(value, 10) > 40) {
            value = "";
        }
        setProductData((prev) => ({ ...prev, lifeSpan: value }));
    };




    const handleProductChange = (e) => {
        const { name, value } = e.target;
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
        setStep(2); // Move to step 2
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
            // Reset new farmer form
            setFarmerData({ id: "", firstname: "", middlename: "", lastname: "", suffix: "", contact: "", isNew: false });
        }
        // Reset product data
        setProductData({ name: "", price: "", category: "", productType: "", stocks: "", kg: "", lifeSpan: "", disc: "", image: null });
        setImgPreview(null);
        setStep(1);
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

    const handleFileRemove = () => {
        setImgPreview(null);
        setProductData((prev) => ({ ...prev, image: null }));
        if (fileUploadRef.current) fileUploadRef.current.value = null;
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

    const currentImage = imgPreview;

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
                                        {/* Search Section */}
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

                                        {/* Divider */}
                                        <div className="d-flex align-items-center gap-2 my-3">
                                            <hr className="flex-grow-1 m-0" />
                                            <span className="text-muted small">or</span>
                                            <hr className="flex-grow-1 m-0" />
                                        </div>

                                        {/* Register New Button */}
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

                                {/* New Farmer Form */}
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
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    name="firstname"
                                                    value={farmerData.firstname}
                                                    onChange={handleFarmerChange}
                                                    placeholder="First name"
                                                    disabled={isUploading}
                                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                />
                                                <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    Last Name <span className="text-danger ms-1">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    name="lastname"
                                                    value={farmerData.lastname}
                                                    onChange={handleFarmerChange}
                                                    placeholder="Last name"
                                                    disabled={isUploading}
                                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
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
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    name="middlename"
                                                    value={farmerData.middlename}
                                                    onChange={handleFarmerChange}
                                                    placeholder="Middle name"
                                                    disabled={isUploading}
                                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                                />
                                                <small className="text-muted" style={{ fontSize: 11 }}>Letters only</small>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark mb-1">
                                                    Suffix <span className="text-muted fw-normal">(optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    name="suffix"
                                                    value={farmerData.suffix}
                                                    onChange={(e) => {
                                                        const cleaned = e.target.value.replace(/[^a-zA-Z.\s]/g, '');
                                                        setFarmerData((prev) => ({ ...prev, suffix: cleaned }));
                                                    }}
                                                    placeholder="e.g., Jr., Sr., MD..."
                                                    maxLength={10}
                                                    disabled={isUploading}
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
                                                onChange={(val) =>
                                                    setFarmerData((prev) => ({ ...prev, contact: val }))
                                                }
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
                                        Product Image
                                        <span className="text-danger ms-1">*</span>
                                    </label>

                                    {currentImage ? (
                                        /* Preview state */
                                        <div className="position-relative rounded-3 overflow-hidden border border-success border-opacity-25"
                                            style={{ aspectRatio: "16/7", background: "#f8f9fa" }}
                                        >
                                            <img
                                                src={currentImage}
                                                alt="preview"
                                                className="w-100 h-100"
                                                style={{ objectFit: "cover" }}
                                            />
                                            {!isUploading && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger position-absolute d-flex align-items-center gap-1"
                                                    style={{ bottom: 10, right: 10, fontSize: "0.75rem", borderRadius: 8, opacity: 0.85 }}
                                                    onClick={handleFileRemove}
                                                >
                                                    <i className="bx bx-trash-alt"></i> Remove
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        /* Upload dropzone */
                                        <label
                                            htmlFor="inputFile"
                                            className="d-flex flex-column align-items-center justify-content-center rounded-3 border border-2 border-dashed gap-2"
                                            style={{
                                                aspectRatio: "16/7",
                                                borderColor: "#c4e0c4",
                                                background: "#f6fbf6",
                                                cursor: isUploading ? "not-allowed" : "pointer",
                                                transition: "background 0.2s",
                                            }}
                                        >
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10"
                                                style={{ width: 48, height: 48 }}
                                            >
                                                <i className="bx bx-cloud-upload text-success fs-4"></i>
                                            </div>
                                            <div className="text-center">
                                                <p className="mb-0 small fw-semibold text-success">Click to upload image</p>
                                                <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>PNG, JPG, WEBP — max 0.75 MB</p>
                                            </div>
                                        </label>
                                    )}

                                    <input
                                        type="file"
                                        id="inputFile"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleFile}
                                        ref={fileUploadRef}
                                        disabled={isUploading}
                                        className="d-none"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                                    <span className="text-muted small">Product Details</span>
                                    <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                                </div>

                                {/* Row 1: Name + Price */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Product Name <span className="text-muted fw-normal">(variety)</span>
                                            <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="name"
                                            value={productData.name || ""}
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
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="price"
                                            value={productData.price || ""}
                                            onChange={handleProductPriceChange}
                                            placeholder="0.00"
                                            disabled={isUploading}
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
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="productType"
                                            value={productData.productType || ""}
                                            onChange={handleProductNameChange}
                                            placeholder="e.g., Banana, Tomato"
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Category <span className="text-danger ms-1">*</span>
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            name="category"
                                            value={productData.category || ""}
                                            onChange={handleProductChange}
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        >
                                            <option value="" hidden>Select category</option>
                                            {["fruits", "fruit vegetables", "leafy vegetables", "root crops", "grains", "legumes"].map((d, i) => (
                                                <option key={i} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Stocks + KG per Bundle */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Stocks (bundles) <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="stocks"
                                            value={productData.stocks || ""}
                                            onChange={handleProductStocksChange}
                                            placeholder="e.g., 50"
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                    </div>

                                    {/* 
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Kg per Bundle <span className="text-danger ms-1">*</span>
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            name="kg"
                                            value={productData.kg || ""}
                                            onChange={handleProductChange}
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        >
                                            <option value="" hidden>Select kg per bundle</option>
                                            {Array.from({ length: 25 * 4 }, (_, i) => {
                                                const kg = 1 + i * 0.25;
                                                if (kg <= 25) {
                                                    return (
                                                        <option key={i} value={kg}>
                                                            {kg % 1 === 0 ? kg : kg.toFixed(2).replace(/\.?0+$/, "")} kg
                                                        </option>
                                                    );
                                                }
                                                return null;
                                            }).filter(Boolean)}
                                        </select>
                                    </div> */}

                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                            Kg per Bundle <span className="text-danger ms-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="kg"
                                            value={productData.kg || ""}
                                            onChange={handleProductKgChange}
                                            placeholder="e.g., 5.5"
                                            disabled={isUploading}
                                            style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                        />
                                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                                            Min 1 kg – Max 100 kg
                                        </small>
                                    </div>
                                </div>

                                {/* Life Span */}
                                {/* <div className="mb-3">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Life Span (days) <span className="text-danger ms-1">*</span>
                                    </label>
                                    <select
                                        className="form-select form-select-sm"
                                        name="lifeSpan"
                                        value={productData.lifeSpan || ""}
                                        onChange={handleProductChange}
                                        disabled={isUploading}
                                        style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                    >
                                        <option value="" hidden>Select life span</option>
                                        {Array.from({ length: 14 }, (_, i) => (
                                            <option key={i} value={i + 1}>{i + 1} {i + 1 === 1 ? "day" : "days"}</option>
                                        ))}
                                    </select>
                                </div> */}

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Life Span (days) <span className="text-danger ms-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        name="lifeSpan"
                                        value={productData.lifeSpan || ""}
                                        onChange={handleProductLifeSpanChange}
                                        placeholder="e.g., 7"
                                        disabled={isUploading}
                                        required
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
                                        name="disc"
                                        value={productData.disc || ""}
                                        onChange={handleProductChange}
                                        rows={3}
                                        placeholder="Describe the product — freshness, origin, or notes for buyers..."
                                        disabled={isUploading}
                                        style={{ resize: "none", borderColor: "#d1e7d1", borderRadius: 8 }}
                                    />
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
                                    type="button"
                                    className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                                    onClick={onClose}
                                    disabled={isUploading}
                                    style={{ borderRadius: 8 }}
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
                                    type="button"
                                    className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                                    onClick={handleBackFromStep2}
                                    disabled={isUploading}
                                    style={{ borderRadius: 8 }}
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