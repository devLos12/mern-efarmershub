import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBreakpoint, useBreakpointHeight } from "../../components/breakpoint.jsx";
import { sellerContext } from "../../context/sellerContext.jsx";
import { appContext } from "../../context/appContext.jsx";
import { adminContext } from "../../context/adminContext.jsx";
import imageCompression from "browser-image-compression";

const Upload = () => {
    const { role, showNotification } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);

    let context = role === "admin" ? admin : seller;
    const { setTrigger, setSellerUpload, sellerUpload, editProduct, setEditProduct } = context;

    const [formData, setFormData] = useState({});
    const [imgPreview, setImgPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileUploadRef = useRef(null);

    const height = useBreakpointHeight();
    const [isFilled, setIsFilled] = useState(true);
    const [prevImg, setPrevImg] = useState("");
    const [isChanged, setIsChanged] = useState(false);

    const dataPreFill = role === "seller" ? sellerUpload : editProduct;
    const isUpdate = Object.keys(dataPreFill?.data ?? {}).length > 0;

    const [oldLifeSpan, setOldLifeSpan] = useState(0);



    useLayoutEffect(() => {
        if (isUpdate) {
            setOldLifeSpan(dataPreFill?.data?.lifeSpan || 0);  // ← Here!
        }
    }, [isUpdate, dataPreFill]);


    useEffect(() => {
        if (isUpdate) {
            const originalData = {
                name: dataPreFill?.data?.name || "",
                price: dataPreFill?.data?.price || "",
                category: dataPreFill?.data?.category || "",
                stocks: dataPreFill?.data?.stocks || "",
                kg: dataPreFill?.data?.kg || "",
                lifeSpan: dataPreFill?.data?.lifeSpan || "",
                disc: dataPreFill?.data?.disc || "",
                image: dataPreFill?.data?.imageFile || null,
                productType: dataPreFill?.data?.productType || "",
            };
            const currentData = {
                name: formData?.name || "",
                price: formData?.price || "",
                category: formData?.category || "",
                stocks: formData?.stocks || "",
                kg: formData?.kg || "",
                lifeSpan: formData?.lifeSpan || "",
                disc: formData?.disc || "",
                image: formData?.image || null,
                productType: formData?.productType || "",
            };

            setIsChanged(JSON.stringify(originalData) !== JSON.stringify(currentData));
        }
    }, [formData, isUpdate, dataPreFill]);

    useLayoutEffect(() => {
        if (isUpdate) {
            setFormData({
                id: dataPreFill?.data?._id || "",
                name: dataPreFill?.data?.name || "",
                price: dataPreFill?.data?.price || "",
                category: dataPreFill?.data?.category || "",
                stocks: dataPreFill?.data?.stocks || "",
                kg: dataPreFill?.data?.kg || "",
                lifeSpan: dataPreFill?.data?.lifeSpan || "",
                disc: dataPreFill?.data?.disc || "",
                image: dataPreFill?.data?.imageFile || null,
                productType: dataPreFill?.data?.productType || "",
            });
            if (dataPreFill?.data?.imageFile) {
                setPrevImg(dataPreFill?.data?.imageFile);
            }
        } else {
            setFormData({ name: "", price: "", category: "", stocks: "", kg: "", lifeSpan: "", disc: "", image: null, productType: "" });
            setImgPreview(null);
        }
    }, [isUpdate, dataPreFill]);

    useLayoutEffect(() => {
        if (formData?.name && formData?.price && formData?.category && formData?.productType && formData?.stocks && formData?.kg && formData?.disc && formData?.image) {
            setIsFilled(false);
        } else {
            setIsFilled(true);
        }
    }, [formData]);

    const handleProductNameChange = (e) => {
        const { name, value } = e.target;
        const cleaned = value.replace(/[^a-zA-Z\s\-']/g, "");
        setFormData({ ...formData, [name]: cleaned });
    };

    const handlePriceChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        if (value.startsWith("0") && value.length > 1 && value[1] !== ".") value = value.replace(/^0+/, "0");
        const parts = value.split(".");
        if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
        setFormData({ ...formData, price: value });
    };

    const handleStocksChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value === "" || value === "-") value = "";
        else if (parseInt(value, 10) < 1) value = "";
        else if (value.length > 3) value = value.slice(0, 3);
        setFormData({ ...formData, stocks: value });
    };


    // const handleKgChange = (e) => {
    //     let value = e.target.value.replace(/[^0-9.]/g, "");
    //     if (value.startsWith("0") && value.length > 1 && value[1] !== ".") value = value.replace(/^0+/, "0");
    //     const parts = value.split(".");
    //     if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
    //     if (parts.length === 2 && parts[1].length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
    //     setFormData({ ...formData, kg: value });
    // };


    // ✅ KG input with limit (0.25 - 25)
    const handleKgChange = (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, "");
        
        // Handle leading zeros
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
        
        // Limit to max 25 kg
        if (value && parseFloat(value) > 25) {
            value = "";
        }
        
        setFormData({ ...formData, kg: value });
    };




    const handleLifeSpanChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");

        // Prevent zero
        if (value === "0") {
            value = "";
        }
        // Limit to max 14 days
        if (value && parseInt(value, 10) > 40) {
            value = "";
        }
        setFormData({ ...formData, lifeSpan: value });
    };



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFile = async (e) => {
        const { name } = e.target;
        const file = e.target.files[0];
        if (!file) return;
        try {
            const options = { maxSizeMB: 0.75, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setFormData({ ...formData, [name]: compressedFile });
            const reader = new FileReader();
            reader.onload = (e) => setImgPreview(e.target.result);
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error("Error compressing image:", error);
            alert("Failed to compress image");
        }
    };

    const handleFileRemove = () => {
        if (isUpdate) {
            setImgPreview(null);
            setFormData((prev) => ({ ...prev, image: prevImg }));
        } else {
            setImgPreview(null);
        }
        if (fileUploadRef.current) fileUploadRef.current.value = null;
    };

    const handleClose = () => {
        role === "seller" ? setSellerUpload({ isShow: false }) : setEditProduct({ isShow: false });
    };

    const handleForm = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.category || !formData.stocks || !formData.kg || !formData.lifeSpan || !formData.disc || !formData.image) {
            showNotification("Please fill out all required fields.", "error");
            return;
        }
        setIsUploading(true);
        const sendData = new FormData();
        sendData.append("id", formData.id);
        sendData.append("name", formData.name);
        sendData.append("price", formData.price);
        sendData.append("category", formData.category);
        sendData.append("stocks", formData.stocks);
        sendData.append("kg", formData.kg); 


        if (isUpdate && Number(formData.lifeSpan) === oldLifeSpan) {
            sendData.append("lifeSpan", "reset");
        } else {
            sendData.append("lifeSpan", formData.lifeSpan);
        }
        


        sendData.append("disc", formData.disc);
        sendData.append("image", formData.image);
        sendData.append("productType", formData.productType);

        const endPoint = isUpdate ? (role === "seller" ? "updateCrops" : "updateCropsByAdmin") : "uploadCrops";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: isUpdate ? "PUT" : "POST",
                body: sendData,
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setTrigger((prev) => !prev);
            if (role === "seller") setSellerUpload((prev) => ({ ...prev, isShow: false, data: null }));
            else setEditProduct((prev) => ({ ...prev, isShow: false, data: null }));
            showNotification(data.message, "success");
        } catch (error) {
            showNotification(error.message, "error");
            console.error("Error: ", error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const currentImage = isUpdate ? imgPreview || formData.image : imgPreview;

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
                            <i className={`bx ${isUpdate ? "bx-edit" : "bx-plus"} text-success fs-5`}></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-dark text-capitalize" style={{ letterSpacing: "-0.2px" }}>
                            {isUpdate ? "Update Product" : "Add New Product"}
                        </h6>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ width: 32, height: 32 }}
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        <i className="bx bx-x fs-5 text-secondary"></i>
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <form onSubmit={handleForm}>
                    <div
                        className="px-4 py-3"
                        style={{ overflowY: "auto", maxHeight: height - 160 }}
                    >-

                        {/* ── IMAGE UPLOAD (top) ── */}
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
                                    {/* overlay on hover-ish, always show remove btn */}
                                    {!isUploading && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-dark position-absolute d-flex align-items-center gap-1"
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

                        {/* ── Divider ── */}
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                            <span className="text-muted small">Product Details</span>
                            <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                        </div>

                        {/* ── Row 1: Name + Price ── */}
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
                                    value={formData.name || ""}
                                    onChange={handleProductNameChange}
                                    placeholder="e.g., Lakatan, Red Tomato"
                                    disabled={isUploading}
                                    required
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
                                    value={formData.price || ""}
                                    onChange={handlePriceChange}
                                    placeholder="0.00"
                                    disabled={isUploading}
                                    required
                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                            </div>
                        </div>

                        {/* ── Row 2: Product Type + Category ── */}
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
                                    value={formData.productType || ""}
                                    onChange={handleProductNameChange}
                                    placeholder="e.g., Banana, Tomato"
                                    disabled={isUploading}
                                    required
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
                                    value={formData.category || ""}
                                    onChange={handleChange}
                                    disabled={isUploading}
                                    required
                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                >
                                    <option value="" hidden>Select category</option>
                                    {["fruits", "fruit vegetables", "leafy vegetables", "root crops", "grains", "legumes"].map((d, i) => (
                                        <option key={i} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Row 3: Stocks + KG per Bundle ── */}
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                    Stocks (bundles) <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    name="stocks"
                                    value={formData.stocks || ""}
                                    onChange={handleStocksChange}
                                    placeholder="e.g., 50"
                                    disabled={isUploading}
                                    required
                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                            </div>


                            {/* <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                    Kg per Bundle <span className="text-danger ms-1">*</span>
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    name="kg"
                                    value={formData.kg || ""}
                                    onChange={handleChange}
                                    disabled={isUploading}
                                    required
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
                                    value={formData.kg || ""}
                                    onChange={handleKgChange}
                                    placeholder="e.g., 5.5"
                                    disabled={isUploading}
                                    required
                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Max 25 kg, decimals allowed (e.g., 0.5, 1.25)</small>
                            </div>
                        </div>
                        

                        {/* ── Life Span ── */}
                        {/* <div className="mb-3">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Life Span (days)
                            </label>
                            <select
                                className="form-select form-select-sm"
                                name="lifeSpan"
                                value={formData.lifeSpan || ""}
                                onChange={handleChange}
                                disabled={isUploading}
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            >
                                <option value="" hidden>Select life span</option>
                                {isUpdate && <option value="reset">Reset</option>}
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
                                value={formData.lifeSpan || ""}
                                onChange={handleLifeSpanChange}
                                placeholder="e.g., 7"
                                disabled={isUploading}
                                required
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                            <small className="text-muted" style={{ fontSize: "0.72rem" }}>Max 40 days</small>
                        </div>

                        {/* ── Description ── */}
                        <div className="mb-1">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Description <span className="text-danger ms-1">*</span>
                            </label>
                            <textarea
                                className="form-control form-control-sm"
                                name="disc"
                                value={formData.disc || ""}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe the product — freshness, origin, or notes for buyers..."
                                disabled={isUploading}
                                required
                                style={{ resize: "none", borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="d-flex justify-content-end gap-2 px-4 py-3 border-top"
                        style={{ background: "#fafafa", borderRadius: "0 0 1rem 1rem" }}
                    >
                        <button
                            type="button"
                            className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                            onClick={handleClose}
                            disabled={isUploading}
                            style={{ borderRadius: 8 }}
                        >
                            Cancel
                        </button>   
                        <button
                            type="submit"
                            className="btn btn-sm btn-success px-4 fw-semibold d-flex align-items-center gap-2"
                            disabled={isUploading || (isUpdate ? !isChanged || isFilled : isFilled)}
                            style={{ borderRadius: 8, minWidth: 110 }}
                        >
                            {isUploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    {isUpdate ? "Updating…" : "Uploading…"}
                                </>
                            ) : (
                                <>
                                    <i className={`bx ${isUpdate ? "bx-save" : "bx-plus-circle"}`}></i>
                                    {isUpdate ? "Save Changes" : "Add Product"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;