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
    const [imgPreviews, setImgPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileUploadRef = useRef(null);

    const height = useBreakpointHeight();
    const [isFilled, setIsFilled] = useState(true);
    const [isChanged, setIsChanged] = useState(false);
    const [oldLifeSpan, setOldLifeSpan] = useState(0);
    const [lifeSpanTouched, setLifeSpanTouched] = useState(false);

    const dataPreFill = role === "seller" ? sellerUpload : editProduct;
    const isUpdate = Object.keys(dataPreFill?.data ?? {}).length > 0;
    const isApproved = role === 'seller' && isUpdate && dataPreFill?.data.statusApprove === 'approved';

    useLayoutEffect(() => {
        if (isUpdate) {
            setOldLifeSpan(dataPreFill?.data?.lifeSpan || 0);
        }
    }, [isUpdate, dataPreFill]);

    useEffect(() => {
        if (isUpdate) {
            const originalData = {
                name: dataPreFill?.data?.name || "",
                price: dataPreFill?.data?.price || "",
                category: dataPreFill?.data?.category || "",
                stocks: dataPreFill?.data?.stocks || "",
                unit: dataPreFill?.data?.unit || "bundle",
                kg: dataPreFill?.data?.kg || "",
                lifeSpan: dataPreFill?.data?.lifeSpan || "",
                disc: dataPreFill?.data?.disc || "",
                imageFile: dataPreFill?.data?.imageFile || [],
                productType: dataPreFill?.data?.productType || "",
            };
            const currentData = {
                name: formData?.name || "",
                price: formData?.price || "",
                category: formData?.category || "",
                stocks: formData?.stocks || "",
                unit: formData?.unit || "bundle",
                kg: formData?.kg || "",
                lifeSpan: formData?.lifeSpan || "",
                disc: formData?.disc || "",
                imageFile: formData?.imageFile || [],
                productType: formData?.productType || "",
            };

            const textChanged = JSON.stringify(originalData) !== JSON.stringify(currentData);
            const newImagesAdded = imgPreviews.length > 0;
            setIsChanged(textChanged || newImagesAdded);
        }
    }, [formData, imgPreviews, isUpdate, dataPreFill]);

    useLayoutEffect(() => {
        if (isUpdate) {
            setFormData({
                id: dataPreFill?.data?._id || "",
                name: dataPreFill?.data?.name || "",
                price: dataPreFill?.data?.price || "",
                category: dataPreFill?.data?.category || "",
                stocks: dataPreFill?.data?.stocks || "",
                unit: dataPreFill?.data?.unit || "bundle",
                kg: dataPreFill?.data?.kg || "",
                lifeSpan: dataPreFill?.data?.lifeSpan || "",
                disc: dataPreFill?.data?.disc || "",
                imageFile: dataPreFill?.data?.imageFile || [],
                productType: dataPreFill?.data?.productType || "",
            });
        } else {
            setFormData({ name: "", price: "", category: "", stocks: "", unit: "bundle", kg: "", lifeSpan: "", disc: "", imageFile: [], productType: "" });
            setImgPreviews([]);
        }
    }, [isUpdate, dataPreFill]);

    // isFilled: kg required only when unit === "kg", lifeSpan required only when unit === "bundle"
    useLayoutEffect(() => {
        const hasImages = (formData?.imageFile?.length || 0) + imgPreviews.length > 0;
        const kgRequired = formData?.unit === "kg";
        const baseFilled = formData?.name && formData?.price && formData?.category && formData?.productType && formData?.stocks && formData?.disc && hasImages;
        const unitFilled = kgRequired ? !!formData?.kg : !!formData?.lifeSpan;
        setIsFilled(!(baseFilled && unitFilled));
    }, [formData, imgPreviews]);

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

    const handleKgChange = (e) => {
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
        if (value && !value.endsWith(".") && parseFloat(value) > 100) {
            value = "";
        }
        if (value && !value.endsWith(".") && parseFloat(value) < 1) {
            value = "";
        }
        setFormData({ ...formData, kg: value });
    };

    const handleLifeSpanChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "");
        if (value === "0") value = "";
        if (value && parseInt(value, 10) > 40) value = "";
        setLifeSpanTouched(true);
        setFormData({ ...formData, lifeSpan: value });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "disc" && value.length > 500) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleFile = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const currentCount = (formData.imageFile?.length || 0) + imgPreviews.length;
        const remaining = 3 - currentCount;
        if (remaining <= 0) return;

        const toAdd = files.slice(0, remaining);

        try {
            const options = { maxSizeMB: 0.75, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressed = await Promise.all(
                toAdd.map(async (file) => {
                    const compressedFile = await imageCompression(file, options);
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve({ file: compressedFile, previewUrl: e.target.result });
                        reader.readAsDataURL(compressedFile);
                    });
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

    const removeExisting = (index) => {
        setFormData((prev) => ({
            ...prev,
            imageFile: prev.imageFile.filter((_, i) => i !== index),
        }));
    };

    const handleClose = () => {
        role === "seller" ? setSellerUpload({ isShow: false }) : setEditProduct({ isShow: false });
    };

    const handleForm = async (e) => {
        e.preventDefault();

        const totalImages = (formData.imageFile?.length || 0) + imgPreviews.length;
        const kgRequired = formData.unit === "kg";

        if (!formData.name || !formData.price || !formData.category || !formData.stocks || !formData.disc || totalImages === 0) {
            showNotification("Please fill out all required fields.", "error");
            return;
        }
        if (kgRequired && !formData.kg) {
            showNotification("Kg per stock is required for kg-based products.", "error");
            return;
        }
        if (!kgRequired && !formData.lifeSpan) {
            showNotification("Life span is required for bundle-based products.", "error");
            return;
        }

        setIsUploading(true);
        const sendData = new FormData();
        sendData.append("id", formData.id);
        sendData.append("name", formData.name);
        sendData.append("price", formData.price);
        sendData.append("category", formData.category);
        sendData.append("stocks", formData.stocks);
        sendData.append("unit", formData.unit);

        if (kgRequired) {
            sendData.append("kg", formData.kg);
        }

        if (!isUpdate) {
            sendData.append("lifeSpan", formData.lifeSpan);
        } else if (lifeSpanTouched) {
            sendData.append("lifeSpan", formData.lifeSpan);
        }

        sendData.append("disc", formData.disc);
        sendData.append("productType", formData.productType);

        imgPreviews.forEach(({ file }) => sendData.append("imageFile", file));

        if (isUpdate && formData.imageFile?.length > 0) {
            sendData.append("existingImages", JSON.stringify(formData.imageFile));
        }

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
            setLifeSpanTouched(false);
            setImgPreviews([]);
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

    const truncateName = (name, max = 24) =>
        name.length > max ? name.slice(0, max) + "\u2026" : name;

    return (
        <div
            className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-start justify-content-center"
            style={{ zIndex: 99, backgroundColor: "rgba(0,0,0,0.45)", padding: "1.25rem 1rem", overflowY: "auto" }}
        >
            <div
                className="w-100 bg-white rounded-4 shadow-lg"
                style={{ maxWidth: "560px", marginTop: "auto", marginBottom: "auto" }}
            >
                {/* Header */}
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

                {/* Scrollable Body */}
                <form onSubmit={handleForm}>
                    <div className="px-4 py-3" style={{ overflowY: "auto", maxHeight: height - 160 }}>

                        {/* IMAGE UPLOAD */}
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-dark small mb-2">
                                Product Images <span className="text-danger ms-1">*</span>
                                <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.75rem" }}>(max 3)</span>
                            </label>

                            {((formData.imageFile?.length || 0) + imgPreviews.length) > 0 && (
                                <div className="d-flex flex-column gap-2 mb-3">
                                    {formData.imageFile?.map((img, i) => (
                                        <div
                                            key={`existing-${i}`}
                                            className="d-flex align-items-center gap-3 rounded-3 border px-3"
                                            style={{ height: 56, background: "#f8f9fa" }}
                                        >
                                            <div className="rounded-2 overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                                                <img src={img.url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <p className="m-0 small fw-semibold text-dark text-truncate">Image {i + 1}</p>
                                                <p className="m-0 text-muted" style={{ fontSize: "0.7rem" }}>Uploaded</p>
                                            </div>
                                            {!isApproved && !isUploading && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0 p-0"
                                                    style={{ width: 28, height: 28, borderRadius: 6, background: "#fff0f0", border: "1px solid #fcc", color: "#dc3545" }}
                                                    onClick={() => removeExisting(i)}
                                                >
                                                    <i className="bx bx-trash" style={{ fontSize: "0.85rem" }}></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}

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
                                                <p className="m-0 small fw-semibold text-dark text-truncate">{truncateName(item.file.name)}</p>
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
                                const total = (formData.imageFile?.length || 0) + imgPreviews.length;
                                if (total >= 3 || isApproved) return null;
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

                        {/* Unit Selection */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Unit Type <span className="text-danger ms-1">*</span>
                            </label>
                            <select
                                className="form-select form-select-sm"
                                name="unit"
                                value={formData.unit || "bundle"}
                                onChange={handleChange}
                                disabled={isUploading || isApproved}
                                required
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
                                    type="text" className="form-control form-control-sm" name="name"
                                    value={formData.name || ""} onChange={handleProductNameChange}
                                    placeholder="e.g., Lakatan, Red Tomato" disabled={isUploading || isApproved}
                                    required style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                    Price (&#8369;) <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                    type="text" className="form-control form-control-sm" name="price"
                                    value={formData.price || ""} onChange={handlePriceChange}
                                    placeholder="0.00" disabled={isUploading} required
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
                                    type="text" className="form-control form-control-sm" name="productType"
                                    value={formData.productType || ""} onChange={handleProductNameChange}
                                    placeholder="e.g., Banana, Tomato" disabled={isUploading || isApproved}
                                    required style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-dark mb-1">
                                    Category <span className="text-danger ms-1">*</span>
                                </label>
                                <select
                                    className="form-select form-select-sm" name="category"
                                    value={formData.category || ""} onChange={handleChange}
                                    disabled={isUploading || isApproved} required
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
                            <div className={formData.unit === "kg" ? "col-md-6" : "col-12"}>
                                <label className="form-label small fw-semibold text-dark mb-1">
                                    {formData.unit === "kg" ? "Stocks (kg)" : "Stocks (bundles)"}
                                    <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                    type="text" className="form-control form-control-sm" name="stocks"
                                    value={formData.stocks || ""} onChange={handleStocksChange}
                                    placeholder="e.g., 50" disabled={isUploading} required
                                    style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                />
                            </div>

                            {formData.unit === "kg" && (
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-dark mb-1">
                                        Kg per Stock <span className="text-danger ms-1">*</span>
                                    </label>
                                    <input
                                        type="text" className="form-control form-control-sm" name="kg"
                                        value={formData.kg || ""} onChange={handleKgChange}
                                        placeholder="e.g., 2" disabled={isUploading} required
                                        style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                                    />
                                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>Min 1 kg – Max 100 kg</small>
                                </div>
                            )}
                        </div>

                        {/* Life Span */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Life Span (days) <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="text" className="form-control form-control-sm" name="lifeSpan"
                                value={formData.lifeSpan || ""} onChange={handleLifeSpanChange}
                                placeholder="e.g., 7" disabled={isUploading || isApproved} required
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
                                className="form-control form-control-sm" name="disc"
                                value={formData.disc || ""} onChange={handleChange}
                                rows={3} placeholder="Describe the product — freshness, origin, or notes for buyers..."
                                disabled={isUploading || isApproved} required
                                style={{ resize: "none", borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                            <div className="d-flex justify-content-end mt-1">
                                <small className={`${(formData.disc?.length || 0) >= 500 ? "text-danger" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                                    {formData.disc?.length || 0}/500
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="d-flex justify-content-end gap-2 px-4 py-3 border-top"
                        style={{ background: "#fafafa", borderRadius: "0 0 1rem 1rem" }}
                    >
                        <button
                            type="button" className="btn btn-sm btn-light px-4 text-capitalize fw-semibold"
                            onClick={handleClose} disabled={isUploading} style={{ borderRadius: 8 }}
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
                                    {isUpdate ? "Updating\u2026" : "Uploading\u2026"}
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