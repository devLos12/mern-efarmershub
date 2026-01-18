import React, { useContext, useRef, useState, useEffect } from "react";
import { adminContext } from "../../context/adminContext";
import { useBreakpointHeight } from "../breakpoint";
import imageCompression from 'browser-image-compression';



const AddAnnouncement = () => {
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // ✅ NEW: Loading state
    const height = useBreakpointHeight();
    const handleRefFile = useRef();

    const isUpdate = Object.keys(addAnnouncement?.data ?? {}).length > 0;

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

    // Handle success modal animation
    useEffect(() => {
        if (showSuccessModal || showErrorModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            // Auto-close after 2 seconds for success
            if (showSuccessModal) {
                const timer = setTimeout(() => {
                    setIsModalVisible(false);
                    setTimeout(() => {
                        setShowSuccessModal(false);
                        setAddAnnouncement((prev) => ({
                            ...prev, 
                            trigger: !prev.trigger,
                            isShow: !prev.isShow
                        }));
                    }, 300);
                }, 2000);
                
                return () => clearTimeout(timer);
            }
        }
    }, [showSuccessModal, showErrorModal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };





    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {   
            // Compression options
            const options = {
                maxSizeMB: 0.5,              // max 1MB
                maxWidthOrHeight: 1920,    // max dimension
                useWebWorker: true         // faster
            };
            // Compress the image
            const compressedFile = await imageCompression(file, options);
            
            // Update form data with compressed file
            setFormData(prev => ({
                ...prev,
                imageFile: compressedFile
            }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({
                    ...prev,
                    imagePreview: reader.result 
                }))
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(compressedFile); // Use compressed file for preview
            
        } catch (error) {
            console.error('Compression error:', error);
            alert('Failed to compress image. Please try again.');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ✅ Start loading
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
                setModalMessage(data.message || 'Failed to save announcement');
                setShowErrorModal(true);
                return;
            }

            setModalMessage(data.message || (isUpdate ? 'Announcement updated successfully!' : 'Announcement created successfully!'));
            setShowSuccessModal(true);

        } catch (error) {
            console.error("Error:", error.message);
            setModalMessage('An error occurred. Please try again.');
            setShowErrorModal(true);
        } finally {
            // ✅ Stop loading
            setIsUploading(false);
        }
    };

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
                        <p className="small text-muted mb-0">{modalMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Modal */}
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
                            width: "90%",
                            transform: isModalVisible ? "scale(1)" : "scale(0.7)",
                            opacity: isModalVisible ? 1 : 0,
                            transition: "all 0.3s ease-in-out"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-times-circle text-danger" style={{ fontSize: "60px" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2 text-danger">
                            Error!
                        </h5>
                        <p className="small text-muted mb-3">{modalMessage}</p>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                                setIsModalVisible(false);
                                setTimeout(() => setShowErrorModal(false), 300);
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
                                            crop name
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
                                            title
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
                                            description
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
                                                start date
                                            </label>
                                            <input 
                                                type="date"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="startDate"
                                                value={formData.startDate ? formData?.startDate.split('T')[0] : ""}
                                                onChange={handleChange}
                                                disabled={isUploading}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-capitalize fw-semibold text-success small">
                                                <i className="bx bx-calendar-check me-1"></i>
                                                end date
                                            </label>
                                            <input 
                                                type="date"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="endDate"
                                                value={formData.endDate ? formData?.endDate.split('T')[0] : ""}
                                                onChange={handleChange}
                                                min={formData.startDate}
                                                disabled={isUploading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-image me-1"></i>
                                            image banner
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
                                                            // If there's a new preview, use it
                                                            if (imagePreview) return imagePreview;
                                                            
                                                            // For update mode with existing image
                                                            if (isUpdate && formData.imageFile) {
                                                                // Check if it's a Cloudinary URL (starts with https)
                                                                if (typeof formData.imageFile === 'string' && formData.imageFile.startsWith("https")) {
                                                                    return formData.imageFile;
                                                                }
                                                                // Otherwise it's a local filename - use Cloudinary URL format
                                                                return formData.imageFile; // Direct Cloudinary URL na
                                                            }
                                                            
                                                            // Fallback
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
                                        disabled={isUploading}
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