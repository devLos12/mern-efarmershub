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
    const height = useBreakpointHeight();
    const handleRefFile = useRef();

    const isUpdate = Object.keys(addAnnouncement?.data ?? {}).length > 0;


    const hasChanges = () => {
        if (!isUpdate) return true; // For add mode, always allow submit
        
        const original = addAnnouncement?.data;
        
        return (
            formData.cropName !== original?.cropName ||
            formData.title !== original?.title ||
            formData.description !== original?.description ||
            formData.startDate?.split('T')[0] !== original?.startDate?.split('T')[0] ||
            formData.endDate?.split('T')[0] !== original?.endDate?.split('T')[0] ||
            imagePreview !== null // New image uploaded
        );
    };


    // ✅ Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // ✅ Get minimum end date (start date + 1 day)
    const getMinEndDate = () => {
        if (!formData.startDate) return getTodayDate();
        
        const startDate = new Date(formData.startDate);
        startDate.setDate(startDate.getDate() + 1);
        return startDate.toISOString().split('T')[0];
    };


    useEffect(() => {
        if(isUpdate){
            setFormData(addAnnouncement?.data);
            setImagePreviuos(addAnnouncement?.data?.imageFile);
        } else {
            setFormData({
                cropName: "",
                title: "",
                description: "",
                startDate: "",
                endDate: "",
                imageFile: null,
            })
            setImagePreview(null);
        }
    }, [isUpdate, addAnnouncement?.data]);

  
    const handleChange = (e) => {
        const { name, value } = e.target;
        
    
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleDateBlur = (e) => {
        const { name, value } = e.target;
        
        if (!value) return; // Skip if empty
        
        // ✅ Validate start date
        if (name === "startDate") {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                showNotification("Start date cannot be in the past", "error");
                setFormData(prev => ({
                    ...prev,
                    startDate: ""
                }));
                return;
            }
        }
        
        // ✅ Validate end date
        if (name === "endDate" && formData.startDate) {
            const endDate = new Date(value);
            const startDate = new Date(formData.startDate);
            startDate.setDate(startDate.getDate() + 1);
            
            if (endDate < startDate) {
                showNotification("End date must be at least 1 day after start date", "error");
                setFormData(prev => ({
                    ...prev,
                    endDate: ""
                }));
                return;
            }
        }
    };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {   
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };
            
            const compressedFile = await imageCompression(file, options);
            
            setFormData(prev => ({
                ...prev,
                imageFile: compressedFile
            }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({
                    ...prev,
                    imagePreview: reader.result 
                }))
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(compressedFile);
            
        } catch (error) {
            console.error('Compression error:', error);
            showNotification('Failed to compress image. Please try again.', 'error');
        }
    };


    const handleFileRemove = () => {
        if(isUpdate){
            setFormData((prev) => ({
                ...prev, 
                imageFile: imagePreview && imagePreviuos 
            }))
        }

        setImagePreview(null);

        if(handleRefFile.current){
            handleRefFile.current.value = null
        }
    }


    // ✅ Check if form is valid
    const isFormValid = () => {
        const { cropName, title, description, startDate, endDate } = formData;
        
        // Check if all required fields are filled
        const allFieldsFilled = (
            cropName?.trim() !== "" &&
            title?.trim() !== "" &&
            description?.trim() !== "" &&
            startDate !== "" &&
            endDate !== ""
        );
        
        // For add mode: all fields + image required
        if (!isUpdate) {
            return allFieldsFilled && imagePreview !== null;
        }
        
        // For update mode: all fields required + must have changes + must have image (existing or new)
        return (
            allFieldsFilled &&
            hasChanges() && // ✅ Must have changes to enable save
            (imagePreview !== null || imagePreviuos !== null)
        );
    };


    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsUploading(true);

        const submitData = new FormData();
        
        if(formData?._id) {
            submitData.append("id", formData?._id)
        }
        submitData.append('name', formData.cropName);
        submitData.append('title', formData.title);
        submitData.append('description', formData.description);
        submitData.append('startDate', formData.startDate);
        submitData.append('endDate', formData.endDate);
        
        if (formData.imageFile) {
            submitData.append('image', formData.imageFile);
        }

        const endPoint = isUpdate 
        ? "editAnnouncement"
        : "addAnnouncement"

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: isUpdate ? "PATCH" : "POST",
                body: submitData,
                credentials: "include"
            })
            const data = await res.json();

            if(!res.ok) {
                showNotification(data.message || 'Failed to save announcement', 'error');
                return;
            }

            showNotification(data.message || (isUpdate ? 'Announcement updated successfully!' : 'Announcement created successfully!'), 'success');
            
            setAddAnnouncement((prev) => ({
                ...prev, 
                trigger: !prev.trigger,
                isShow: false
            }));
                        
        } catch (error) {
            console.error("Error:", error.message);
            showNotification(error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };




    return (
        <>
            <div className="container-fluid position-fixed top-0 start-0 end-0 vh-100 bg-darken"
                style={{ zIndex: 99 }}
            >
                <div className="row justify-content-center mt-4">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card shadow-lg border-0 position-relative" 
                            style={{ overflow: "hidden" }}
                        >
                            <button 
                                className="btn btn-link position-absolute top-0 end-0 p-3 text-decoration-none"
                                style={{ cursor: "pointer", zIndex: 1 }}
                                onClick={() => setAddAnnouncement((prev) => ({...prev, isShow: false }))}
                                disabled={isUploading}
                            >
                                <i className="bx bx-x fs-3 text-dark"></i>
                            </button>

                            <div className="card-header border-0 text-center pt-4 pb-3">
                                <h5 className="m-0 text-capitalize fw-bold text-success">
                                    {isUpdate ? "edit seasonal announcement" : "add seasonal announcement"}
                                </h5>
                            </div>
                            
                            <div>
                                <div className="card-body px-4" 
                                    style={{
                                        overflowY: "auto",
                                        maxHeight: height - 190,
                                    }}
                                >
                                    <div className="mb-4">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-leaf me-1"></i>
                                            crop name <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="text"  
                                            className="form-control border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="cropName"
                                            value={formData.cropName}
                                            onChange={handleChange}
                                            placeholder="e.g., Rice, Corn, Vegetables"
                                            disabled={isUploading}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-text me-1"></i>
                                            title <span className="text-danger">*</span>
                                        </label>
                                        <input 
                                            type="text"  
                                            className="form-control border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Enter announcement title"
                                            disabled={isUploading}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-detail me-1"></i>
                                            description <span className="text-danger">*</span>
                                        </label>
                                        <textarea 
                                            className="form-control border-success border-opacity-25"
                                            style={{ 
                                                resize: "none",
                                                backgroundColor: '#ffffff' 
                                            }}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Enter announcement description"
                                            disabled={isUploading}
                                            required
                                        />
                                    </div>

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label text-capitalize fw-semibold text-success small">
                                                <i className="bx bx-calendar me-1"></i>
                                                start date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="startDate"
                                                value={formData.startDate ? formData?.startDate.split('T')[0] : ""}
                                                onChange={handleChange}
                                                onBlur={handleDateBlur}
                                                min={getTodayDate()} // ✅ Minimum today
                                                disabled={isUploading}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-capitalize fw-semibold text-success small">
                                                <i className="bx bx-calendar-check me-1"></i>
                                                end date <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="endDate"
                                                value={formData.endDate ? formData?.endDate.split('T')[0] : ""}
                                                onChange={handleChange}
                                                onBlur={handleDateBlur}
                                                min={getMinEndDate()} // ✅ Minimum start date + 1 day
                                                disabled={isUploading || !formData.startDate} // ✅ Disabled until start date is selected
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-image me-1"></i>
                                            image banner <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input 
                                                type="file" 
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                id="inputFile"
                                                name="imageFile"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                ref={handleRefFile}
                                                disabled={isUploading}
                                            />
                                        </div>
                                        
                                        {(isUpdate || imagePreview) && (
                                            <div className="mt-3">
                                                <div className="position-relative d-inline-block py-2 pe-2">
                                                    {imagePreview && !isUploading && (
                                                        <i className="bx bx-x text-dark fs-5 position-absolute top-0 end-0 bg-white d-flex align-items-center justify-content-center rounded-circle shadow"
                                                            style={{ 
                                                                cursor: "pointer",
                                                                width: '25px',
                                                                height: '25px'
                                                            }}
                                                            onClick={handleFileRemove}
                                                        ></i>
                                                    )}
                                                    <img 
                                                        src={(() => {
                                                            if (imagePreview) return imagePreview;
                                                            
                                                            if (isUpdate && formData.imageFile) {
                                                                if (typeof formData.imageFile === 'string' && formData.imageFile.startsWith("https")) {
                                                                    return formData.imageFile;
                                                                }
                                                                return formData.imageFile;
                                                            }
                                                            
                                                            return imagePreview || "";
                                                        })()}
                                                                                                
                                                        alt={imagePreview}
                                                        className="img-fluid rounded border border-success border-opacity-25 shadow-sm"
                                                        style={{ 
                                                            maxHeight: '150px',
                                                            backgroundColor: '#ffffff'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                        
                                <div className="card-footer border-0 d-flex justify-content-end gap-2 py-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4 text-capitalize"
                                        onClick={() => setAddAnnouncement((prev) => ({...prev, isShow: false }))}
                                        disabled={isUploading}
                                    >
                                        <i className="bx bx-x-circle me-1"></i>
                                        cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success px-4 text-capitalize"
                                        onClick={handleSubmit}
                                        disabled={isUploading || !isFormValid()} // ✅ Disabled if uploading OR form invalid
                                    >
                                        {isUploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {isUpdate ? "updating..." : "uploading..."}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-check-circle me-1"></i>
                                                {isUpdate ? "save" : "create"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddAnnouncement;