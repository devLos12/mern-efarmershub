import React, { useContext, useRef, useState, useEffect } from "react";
import { adminContext } from "../../context/adminContext";
import { useBreakpointHeight } from "../breakpoint";
import imageCompression from 'browser-image-compression';
import { appContext } from "../../context/appContext";



const AddAnnouncement = () => {
    const { showNotification } = useContext(appContext);
    const { addAnnouncement, setAddAnnouncement } = useContext(adminContext);

    const [formData, setFormData] = useState({
        cropName: "",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        imageFile: null,
        imagePreview: null
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [imagePreviuos, setImagePreviuos] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [removeImage, setRemoveImage] = useState(false);

    const height = useBreakpointHeight();
    const handleRefFile = useRef();




    const [imgPosition, setImgPosition] = useState({ x: 50, y: 50 });
    const [zoom, setZoom] = useState(100);
    const isDragging = useRef(false);
    const dragLast = useRef({ x: 0, y: 0 });
    const bannerRef = useRef(null);




    const isUpdate = Object.keys(addAnnouncement?.data ?? {}).length > 0;
    







    const hasChanges = () => {
        if (!isUpdate) return true;
        const original = addAnnouncement?.data;
        return (
            formData.cropName !== original?.cropName ||
            formData.title !== original?.title ||
            formData.description !== original?.description ||
            formData.startDate?.split('T')[0] !== original?.startDate?.split('T')[0] ||
            formData.endDate?.split('T')[0] !== original?.endDate?.split('T')[0] ||
            imagePreview !== null ||

            imgPosition.x !== (original?.posX ?? 50) ||
            imgPosition.y !== (original?.posY ?? 50) ||
            zoom !== (original?.zoom ?? 100)
        );
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMinEndDate = () => {
        if (!formData.startDate) return getTodayDate();
        const startDate = new Date(formData.startDate);
        startDate.setDate(startDate.getDate() + 1);
        return startDate.toISOString().split('T')[0];
    };


    useEffect(() => {
        if (isUpdate) {
            setFormData(addAnnouncement?.data);
            setImagePreviuos(addAnnouncement?.data?.imageFile);


            setImgPosition({
                x: addAnnouncement?.data?.posX ?? 50,
                y: addAnnouncement?.data?.posY ?? 50,
            });
            setZoom(addAnnouncement?.data?.zoom ?? 100);


        } else {
            setFormData({
                cropName: "",
                title: "",
                description: "",
                startDate: "",
                endDate: "",
                imageFile: null,
            });
            setImagePreview(null);
            
            setImgPosition({ x: 50, y: 50 });
            setZoom(100);

        }
    }, [isUpdate, addAnnouncement?.data]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateBlur = (e) => {
        const { name, value } = e.target;
        if (!value) return;

        if (name === "startDate") {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                showNotification("Start date cannot be in the past", "error");
                setFormData(prev => ({ ...prev, startDate: "" }));
                return;
            }
        }

        if (name === "endDate" && formData.startDate) {
            const endDate = new Date(value);
            const startDate = new Date(formData.startDate);
            startDate.setDate(startDate.getDate() + 1);
            if (endDate < startDate) {
                showNotification("End date must be at least 1 day after start date", "error");
                setFormData(prev => ({ ...prev, endDate: "" }));
                return;
            }
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setFormData(prev => ({ ...prev, imageFile: compressedFile }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imagePreview: reader.result }));
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Compression error:', error);
            showNotification('Failed to compress image. Please try again.', 'error');
        }

        setRemoveImage(false);
    };



    const handleFileRemove = () => {
        setImagePreview(null);
        setRemoveImage(true); // ← flag na gusto tanggalin
        setFormData(prev => ({ ...prev, imageFile: null }));
        if (handleRefFile.current) handleRefFile.current.value = null;
    };



    const isFormValid = () => {
        const { cropName, title, description, startDate, endDate } = formData;
        const allFieldsFilled = (
            cropName?.trim() !== "" &&
            title?.trim() !== "" &&
            description?.trim() !== "" &&
            startDate !== "" &&
            endDate !== ""
        );
        if (!isUpdate) return allFieldsFilled && imagePreview !== null;
        return (
            allFieldsFilled &&
            hasChanges() &&
            (imagePreview !== null || imagePreviuos !== null)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        const submitData = new FormData();
        if (formData?._id) submitData.append("id", formData?._id);
        submitData.append('name', formData.cropName);
        submitData.append('title', formData.title);
        submitData.append('description', formData.description);
        submitData.append('startDate', formData.startDate);
        submitData.append('endDate', formData.endDate);
        
        submitData.append('posX', imgPosition.x);
        submitData.append('posY', imgPosition.y);
        submitData.append('zoom', zoom);



        if (formData.imageFile) submitData.append('image', formData.imageFile);

        const endPoint = isUpdate ? "editAnnouncement" : "addAnnouncement";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: isUpdate ? "PATCH" : "POST",
                body: submitData,
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                showNotification(data.message || 'Failed to save announcement', 'error');
                return;
            }
            showNotification(data.message || (isUpdate ? 'Announcement updated!' : 'Announcement created!'), 'success');
            setAddAnnouncement(prev => ({ ...prev, trigger: !prev.trigger, isShow: false }));
        } catch (error) {
            console.error("Error:", error.message);
            showNotification(error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // Resolve current banner image to display
    const currentImage = (() => {
        if (removeImage) return null; // ← respected agad
        if (imagePreview) return imagePreview;
        if (isUpdate && formData.imageFile && typeof formData.imageFile === 'string') return formData.imageFile;
        return null;
    })();




    const handleMouseDown = (e) => {
        if (e.target.closest('[data-remove]')) return;
        isDragging.current = true;
        dragLast.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !bannerRef.current) return;
        const rect = bannerRef.current.getBoundingClientRect();
        const dx = ((dragLast.current.x - e.clientX) / rect.width) * 100;
        const dy = ((dragLast.current.y - e.clientY) / rect.height) * 100;
        setImgPosition(prev => ({
            x: Math.min(100, Math.max(0, prev.x + dx)),
            y: Math.min(100, Math.max(0, prev.y + dy)),
        }));
        dragLast.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const handleTouchStart = (e) => {
        if (e.target.closest('[data-remove]')) return;
        const t = e.touches[0];
        isDragging.current = true;
        dragLast.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current || !bannerRef.current) return;
        const t = e.touches[0];
        const rect = bannerRef.current.getBoundingClientRect();
        const dx = ((dragLast.current.x - t.clientX) / rect.width) * 100;
        const dy = ((dragLast.current.y - t.clientY) / rect.height) * 100;
        setImgPosition(prev => ({
            x: Math.min(100, Math.max(0, prev.x + dx)),
            y: Math.min(100, Math.max(0, prev.y + dy)),
        }));
        dragLast.current = { x: t.clientX, y: t.clientY };
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
                            <i className={`bx ${isUpdate ? "bx-edit" : "bx-plus"} text-success fs-5`}></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-dark text-capitalize" style={{ letterSpacing: "-0.2px" }}>
                            {isUpdate ? "Edit Announcement" : "Add Announcement"}
                        </h6>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                        style={{ width: 32, height: 32 }}
                        onClick={() => setAddAnnouncement(prev => ({ ...prev, isShow: false }))}
                        disabled={isUploading}
                    >
                        <i className="bx bx-x fs-5 text-secondary"></i>
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div
                    className="px-4 py-3"
                    style={{ overflowY: "auto", maxHeight: height - 160 }}
                >
                    {/* ── IMAGE BANNER (top, same as Upload) ── */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold text-dark small mb-2">
                            Image Banner
                            <span className="text-danger ms-1">*</span>
                        </label>

                        {currentImage ? (
                            // <div
                            //     className="position-relative rounded-3 overflow-hidden border border-success border-opacity-25"
                            //     style={{ aspectRatio: "16/7", background: "#f8f9fa" }}
                            // >
                            //     <img
                            //         src={currentImage}
                            //         alt="banner preview"
                            //         className="w-100 h-100"
                            //         style={{ objectFit: "cover" }}
                            //     />
                            //     {!isUploading && (
                            //         <button
                            //             type="button"
                            //             className="btn btn-sm btn-dark position-absolute d-flex align-items-center gap-1"
                            //             style={{ bottom: 10, right: 10, fontSize: "0.75rem", borderRadius: 8, opacity: 0.85 }}
                            //             onClick={handleFileRemove}
                            //         >
                            //             <i className="bx bx-trash-alt"></i> Remove
                            //         </button>
                            //     )}
                            // </div>


                            <div
                                ref={bannerRef}
                                className="position-relative rounded-3 overflow-hidden border border-success border-opacity-25"
                                style={{
                                    aspectRatio: "16/7",
                                    background: "#f8f9fa",
                                    cursor: isDragging.current ? "grabbing" : "grab",
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseUp}
                            >

                                <img
                                    src={currentImage}
                                    alt="banner preview"
                                    className="w-100 h-100"
                                    draggable={false}
                                    style={{
                                        objectFit: "cover",
                                        objectPosition: `${imgPosition.x}% ${imgPosition.y}%`,
                                        transform: `scale(${zoom / 100})`,
                                        transformOrigin: `${imgPosition.x}% ${imgPosition.y}%`,
                                        transition: isDragging.current ? "none" : "object-position 0.1s",
                                        pointerEvents: "none",
                                    }}
                                />

                                {/* drag hint overlay */}
                                <div
                                    className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center gap-1"
                                    style={{ background: "rgba(0,0,0,0.28)", opacity: 0, transition: "opacity 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                >
                                    <i className="bx bx-move text-white fs-4"></i>
                                    <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 500 }}>Drag to reposition</span>
                                </div>

                                {/* position badge */}
                                <span
                                    className="position-absolute"
                                    style={{ top: 8, left: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.7rem", borderRadius: 6, padding: "2px 8px" }}
                                >
                                    {Math.round(imgPosition.x)}% · {Math.round(imgPosition.y)}%
                                </span>

                                {!isUploading && (
                                    <button
                                        data-remove
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
                            <label
                                htmlFor="inputBannerFile"
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
                                    <p className="mb-0 small fw-semibold text-success">Click to upload banner</p>
                                    <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>PNG, JPG, WEBP — max 0.5 MB</p>
                                </div>
                            </label>
                        )}

                        <input
                            type="file"
                            id="inputBannerFile"
                            name="imageFile"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={handleRefFile}
                            disabled={isUploading}
                            className="d-none"
                        />
                    </div>

                    {currentImage && (
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <i className="bx bx-minus text-muted" style={{ fontSize: "0.85rem" }}></i>
                            <input
                                type="range"
                                className="form-range flex-grow-1"
                                min={100}
                                max={200}
                                step={1}
                                value={zoom}
                                onChange={e => setZoom(Number(e.target.value))}
                                disabled={isUploading}
                                style={{ accentColor: "#16a34a" }}
                            />
                            <i className="bx bx-plus text-muted" style={{ fontSize: "0.85rem" }}></i>
                            <span style={{ fontSize: "0.75rem", color: "#6c757d", minWidth: 36 }}>{zoom}%</span>
                        </div>
                    )}




                    {/* ── Divider ── */}
                    <div className="d-flex align-items-center gap-2 mb-4">
                        <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                        <span className="text-muted small">Announcement Details</span>
                        <hr className="flex-grow-1 m-0" style={{ borderColor: "#e9ecef" }} />
                    </div>

                    {/* ── Row 1: Crop Name + Title ── */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Crop Name <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                name="cropName"
                                value={formData.cropName || ""}
                                onChange={handleChange}
                                placeholder="e.g., Rice, Corn"
                                disabled={isUploading}
                                required
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Title <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                name="title"
                                value={formData.title || ""}
                                onChange={handleChange}
                                placeholder="e.g., Rice Season 2026"
                                disabled={isUploading}
                                required
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                        </div>
                    </div>

                    {/* ── Row 2: Start Date + End Date ── */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                Start Date <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                name="startDate"
                                value={formData.startDate ? formData.startDate.split('T')[0] : ""}
                                onChange={handleChange}
                                onBlur={handleDateBlur}
                                min={getTodayDate()}
                                disabled={isUploading}
                                required
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-dark mb-1">
                                End Date <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                name="endDate"
                                value={formData.endDate ? formData.endDate.split('T')[0] : ""}
                                onChange={handleChange}
                                onBlur={handleDateBlur}
                                min={getMinEndDate()}
                                disabled={isUploading || !formData.startDate}
                                required
                                style={{ borderColor: "#d1e7d1", borderRadius: 8 }}
                            />
                            {!formData.startDate && (
                                <small className="text-muted" style={{ fontSize: "0.72rem" }}>Select start date first</small>
                            )}
                        </div>
                    </div>

                    {/* ── Description ── */}
                    <div className="mb-1">
                        <label className="form-label small fw-semibold text-dark mb-1">
                            Description <span className="text-danger ms-1">*</span>
                        </label>
                        <textarea
                            className="form-control form-control-sm"
                            name="description"
                            value={formData.description || ""}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe the announcement — season details, availability, or notes for buyers..."
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
                        onClick={() => setAddAnnouncement(prev => ({ ...prev, isShow: false }))}
                        disabled={isUploading}
                        style={{ borderRadius: 8 }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-success px-4 fw-semibold d-flex align-items-center gap-2"
                        onClick={handleSubmit}
                        disabled={isUploading || !isFormValid()}
                        style={{ borderRadius: 8, minWidth: 110 }}
                    >
                        {isUploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                {isUpdate ? "Updating…" : "Creating…"}
                            </>
                        ) : (
                            <>
                                <i className={`bx ${isUpdate ? "bx-save" : "bx-plus-circle"}`}></i>
                                {isUpdate ? "Save Changes" : "Create"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAnnouncement;