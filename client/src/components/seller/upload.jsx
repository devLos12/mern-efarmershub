import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBreakpoint, useBreakpointHeight } from "../../components/breakpoint.jsx";
import { sellerContext } from "../../context/sellerContext.jsx";
import { appContext } from "../../context/appContext.jsx";
import { adminContext } from "../../context/adminContext.jsx";

const Upload = () => {  
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);

    let context = role === "admin" ? admin : seller; 
    const { setTrigger, setSellerUpload, sellerUpload, editProduct, setEditProduct } = context; 
    
    const [formData, setFormData] = useState({});
    const [imgPreview, setImgPreview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const fileUploadRef = useRef(null);



    const height = useBreakpointHeight();
    const [isFilled, setIsFilled] = useState(true);
    const [prevImg, setPrevImg] = useState("");
    const [isChanged, setIsChanged] = useState(false);

    const dataPreFill = role === "seller" ? sellerUpload : editProduct;
    const isUpdate = Object.keys(dataPreFill?.data ?? {}).length > 0;



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
                // Sa update mode:
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
                productType: dataPreFill?.data?.productType || "",

            };

            setIsChanged(JSON.stringify(originalData) !== JSON.stringify(currentData));
        }
    }, [formData, isUpdate, dataPreFill]);


    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                    if (modalType === "success") {
                        if (role === "seller") {
                            setSellerUpload((prev) => ({ ...prev, isShow: false, data: null }));
                        } else {
                            setEditProduct((prev) => ({ ...prev, isShow: false, data: null }));
                        }
                    }
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showModal, modalType, role, setSellerUpload, setEditProduct]);




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
            setFormData({
                name: "",
                price: "",
                category: "",
                stocks: "",
                kg: "",
                lifeSpan: "",
                disc: "",
                image: null,
                // Sa non-update mode:
                productType: "",
            });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFile = (e) => {
        const { name } = e.target;
        const file = e.target.files[0];

        setFormData({
            ...formData,
            [name]: file
        });

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImgPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileRemove = () => {
        if (isUpdate) {
            setImgPreview(null);
            setFormData((prev) => ({
                ...prev,
                image: prevImg,
            }));
        } else {
            setImgPreview(null);
        }

        if (fileUploadRef.current) {
            fileUploadRef.current.value = null;
        }
    };


    const showNotification = (message, type = "success") => {
        setModalMessage(message);
        setModalType(type);
        setShowModal(true);
    };


    const handleForm = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.category || !formData.stocks || !formData.kg || !formData.lifeSpan || !formData.disc || !formData.image) {
            showNotification("Please fill out all required fields.", "error");
            return;
        }

        const sendData = new FormData();
        sendData.append("id", formData.id);
        sendData.append("name", formData.name);
        sendData.append("price", formData.price);
        sendData.append('category', formData.category);
        sendData.append('stocks', formData.stocks);
        sendData.append('kg', formData.kg);
        sendData.append('lifeSpan', formData.lifeSpan);
        sendData.append("disc", formData.disc);
        sendData.append("image", formData.image);
        sendData.append('productType', formData.productType);

        const endPoint = isUpdate 
            ? role === "seller" ? "updateCrops" : "updateCropsByAdmin"
            : "uploadCrops";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: isUpdate ? "PUT" : "POST",
                body: sendData,
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showNotification(data.message, "success");
            setTrigger((prev) => !prev);
        } catch (error) {
            showNotification(error.message, "error");
            console.error("Error: ", error.message);
        }
    };



    return (
        <>
        {/* Success/Error Modal with Animation */}
        {showModal && (
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
                        {modalType === "success" ? (
                            <i className="bx bx-check-circle text-success" style={{ fontSize: "60px" }}></i>
                        ) : (
                            <i className="bx bx-error-circle text-danger" style={{ fontSize: "60px" }}></i>
                        )}
                    </div>
                    <h5 className={`fw-bold text-capitalize mb-2 ${modalType === "success" ? "text-success" : "text-danger"}`}>
                        {modalType === "success" ? "success!" : "error!"}
                    </h5>
                    <p className="small text-muted mb-0">{modalMessage}</p>
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
                        {/* Close Button */}
                        <button 
                            className="btn btn-link position-absolute top-0 end-0 p-3 text-decoration-none"
                            style={{ cursor: "pointer", zIndex: 1 }}
                            onClick={() => {
                                role === "seller" 
                                    ? setSellerUpload({ isShow: false })
                                    : setEditProduct({ isShow: false });    
                            }}
                        >
                            <i className="bx bx-x fs-3 text-dark"></i>
                        </button>

                        {/* Header */}
                        <div className="card-header border-0 text-center pt-4 pb-3">
                            <h5 className="m-0 text-capitalize fw-bold text-success">
                                {isUpdate ? "update product" : "add new product"}
                            </h5>
                        </div>
                        
                        <form onSubmit={handleForm}>
                            {/* Form Content */}
                            <div className="card-body px-4 "
                                style={{
                                    overflowY: "auto",
                                    maxHeight: height - 190,
                                }}
                            >

                                {/* Category and Product Type */}
                                <div className="row mb-4">
                                  
                                    <div className="col-md-6">
                                        {/* Product Name */}
                                            <label className="form-label text-capitalize fw-semibold text-success small">
                                                <i className="bx bx-package me-1"></i>
                                                product name <span className="text-muted fw-normal">(variety name)</span>
                                            </label>
                                            <input 
                                                type="text"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="name"
                                                value={formData.name || ""}
                                                onChange={handleChange}
                                                placeholder="e.g., Lakatan, Red Tomato, Saba"
                                                required
                                            />
                                    </div>
                                      <div className="col-md-6 mb-3 mb-md-0">
                                        {/* Price */}
                                            <label className="form-label text-capitalize fw-semibold text-success small">
                                                <i className="bx bx-money me-1"></i>
                                                price
                                            </label>
                                            <input 
                                                type="text"  
                                                className="form-control border-success border-opacity-25"
                                                style={{ backgroundColor: '#ffffff' }}
                                                name="price"
                                                value={formData.price || ""}
                                                onChange={handleChange}
                                                placeholder="Enter price"
                                                required
                                            />
                                    </div>
                                </div>
                             

                               

                                {/* Category and Product Type */}
                                <div className="row mb-4">
                                  
                                    <div className="col-md-6">
                                       <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-shape-circle me-1"></i>
                                            product type <span className="text-muted fw-normal">(generic name)</span>
                                        </label>
                                        <input 
                                            type="text"  
                                            className="form-control border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="productType"
                                            value={formData.productType || ""}
                                            onChange={handleChange}
                                            placeholder="e.g., Banana, Tomato, Potato"
                                            required
                                        />
                                    </div>
                                      <div className="col-md-6 mb-3 mb-md-0">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-category me-1"></i>
                                            category
                                        </label>
                                        <select 
                                            className="form-select border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="category"
                                            value={formData.category || ""}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" hidden>select category</option>
                                            {[
                                                'fruit', 
                                                'vegetable', 
                                                'fertilizer', 
                                                'root crops', 
                                                'grains', 
                                                'legumes'
                                            ].map((data, i) => (
                                                <option key={i} value={data
                                                }>{data}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Stocks and Kilogram per Bundle */}
                                <div className="row mb-4">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-box me-1"></i>
                                            stocks (bundles)
                                        </label>
                                        <input 
                                            type="number"
                                            className="form-control border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="stocks"
                                            value={formData.stocks || ""}
                                            onChange={handleChange}
                                            placeholder="Enter number of bundles"
                                            min="1"
                                            max="999"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-capitalize fw-semibold text-success small">
                                            <i className="bx bx-package me-1"></i>
                                            kilogram per bundle
                                        </label>
                                        <select 
                                            className="form-select border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            name="kg"
                                            value={formData.kg || ""}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" hidden>select kg per bundle</option>
                                            {Array.from({ length: 25 * 4 }, (_, i) => {
                                                const kg = 1 + (i * 0.25);
                                                if (kg <= 25) {
                                                    return (
                                                        <option key={i} value={kg}>
                                                            {kg % 1 === 0 ? kg : kg.toFixed(2).replace(/\.?0+$/, '')} kg
                                                        </option>
                                                    );
                                                }
                                                return null;
                                            }).filter(Boolean)}
                                        </select>
                                    </div>
                                </div>

                                
                                {/* Life Span */}
                                <div className="mb-4">
                                    <label className="form-label text-capitalize fw-semibold text-success small">
                                        <i className="bx bx-time me-1"></i>
                                        life span (days)
                                    </label>
                                    <select 
                                        className="form-select border-success border-opacity-25"
                                        style={{ backgroundColor: '#ffffff' }}
                                        name="lifeSpan"
                                        value={formData.lifeSpan || ""}
                                        onChange={handleChange}
                                    >
                                        <option value="" hidden>select life span</option>
                                        {Array.from({ length: 14 }, (_, i) => (
                                            <option key={i} value={i + 1}>{i + 1} days</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
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
                                        name="disc"
                                        value={formData.disc || ""}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Enter product description"
                                        required
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="mb-3">
                                    <label className="form-label text-capitalize fw-semibold text-success small">
                                        <i className="bx bx-image me-1"></i>
                                        product image
                                    </label>
                                    <div className="input-group">
                                        <input 
                                            type="file" 
                                            className="form-control border-success border-opacity-25"
                                            style={{ backgroundColor: '#ffffff' }}
                                            id="inputFile"
                                            name="image"
                                            accept="image/*"
                                            onChange={handleFile}
                                            ref={fileUploadRef}
                                        />
                                    </div>
                                    
                                    {/* Image Preview */}
                                    {(isUpdate || imgPreview) && (
                                        <div className="mt-3">
                                            <div className="position-relative d-inline-block py-2 pe-2">
                                                {imgPreview && (
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
                                                    src={
                                                        isUpdate 
                                                            ? imgPreview || `${import.meta.env.VITE_API_URL}/api/Uploads/${formData?.image}`
                                                            : imgPreview
                                                    } 
                                                    alt={imgPreview}
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
                                    
                            {/* Footer with Action Buttons */}
                            <div className="card-footer border-0 d-flex justify-content-end gap-2 py-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4 text-capitalize"
                                    onClick={() => {
                                        role === "seller" 
                                            ? setSellerUpload({ isShow: false })
                                            : setEditProduct({ isShow: false });
                                    }}
                                >
                                    <i className="bx bx-x-circle me-1"></i>
                                    cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success px-4 text-capitalize"
                                    disabled={isUpdate ? (!isChanged || isFilled) : isFilled}
                                >
                                    <i className="bx bx-check-circle me-1"></i>
                                    {isUpdate ? "save" : "add product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        </>
    );
};

export default Upload;