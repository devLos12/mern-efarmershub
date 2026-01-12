import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";
import img from "../assets/images/home_bg.png";

const ChangePassword = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");
    const [isModalVisible, setIsModalVisible] = useState(false);

    let context = null;
    
    if(role === "admin"){
        context = admin;
    } else if(role === "seller") {
        context = seller;
    } else {
        context = user;
    }

    const { setTrigger } = context;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = "Current password is required";
        }

        if (!formData.newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = "New password must be different from current password";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const showNotification = (message, type = "success") => {
        setModalMessage(message);
        setModalType(type);
        setShowModal(true);
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const endPoint = role === "seller" 
            ? "sellerChangePassword" 
            : "userChangePassword";
        
                
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }),
                credentials: "include"
            });

            const data = await res.json();  
            
            if(!res.ok) throw new Error(data.message);

            showNotification(data.message, "success");
            setTrigger((prev) => !prev);

        } catch (error) {
            showNotification(error.message, "error");
            console.log("Error: ", error.message);
        }
    };

    // Handle modal animation and navigation
    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                    if (modalType === "success") {
                        navigate(-1);
                    }
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showModal, modalType, navigate]);


    return (
        <>
        <div className={`${role === "seller" ? "d-flex min-vh-100 mx-2" : "d-flex min-vh-100 bg"}`}>
            <div className={`${role === "seller" ? "container-fluid bg-white" : "container bg-white"}`}>
                <div className="row py-5 justify-content-center">
                    
                    <div className={role === "seller" 
                        ? "col-12 col-lg-11" 
                        : "col-12 col-lg-10" }>
                        {/* Header */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <button 
                                className="btn btn-outline-success"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fa fa-arrow-left"></i>
                            </button>
                            <div>
                                <h5 className="m-0 fw-bold text-capitalize text-success">Change Password</h5>
                                <p className="m-0 small text-muted">Update your password security</p>
                            </div>
                        </div>
                    </div>

                    <div className={`${ role === "seller" 
                        ? "col-12 col-md-12 col-lg-5" 
                        : "col-12 col-md-6 col-lg-4 mt-3 mt-md-3"}`}>
                        <form action="#" onSubmit={handleSubmit}>
                            <div className="row g-0 mt-3">
                                
                                <div className="col-12">
                                    <p className="m-0 text-capitalize fw-bold">password security</p>
                                    <p className="m-0 mt-2" style={{fontSize: "13px", color: "#666"}}>
                                        Please enter your current password and choose a new secure password.
                                    </p>
                                </div>

                                {/* Current Password */}
                                <div className="col-12 mt-3">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        current password:
                                    </label>
                                    <div className="position-relative">
                                        <input 
                                            className={`w-100 mt-2 py-2 form-control ${errors.currentPassword ? 'border-danger' : ''}`}
                                            style={{ fontSize: "14px", background: "#F5F5DC", paddingRight: "40px" }}
                                            name="currentPassword"
                                            type={showPasswords.current ? "text" : "password"}
                                            placeholder="Enter current password"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <i 
                                            className={`fa-solid ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                            style={{
                                                right: "15px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                cursor: "pointer",
                                                color: "#666"
                                            }}
                                            onClick={() => togglePasswordVisibility('current')}
                                        ></i>
                                    </div>
                                    {errors.currentPassword && (
                                        <small className="text-danger" style={{fontSize: "12px"}}>
                                            {errors.currentPassword}
                                        </small>
                                    )}
                                </div>

                                {/* New Password */}
                                <div className="col-12  mt-3">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        new password:
                                    </label>
                                    <div className="position-relative">
                                        <input 
                                            className={`w-100 mt-2 py-2 form-control ${errors.newPassword ? 'border-danger' : ''}`}
                                            style={{ fontSize: "14px", background: "#F5F5DC", paddingRight: "40px" }}
                                            name="newPassword"
                                            type={showPasswords.new ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <i 
                                            className={`fa-solid ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                            style={{
                                                right: "15px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                cursor: "pointer",
                                                color: "#666"
                                            }}
                                            onClick={() => togglePasswordVisibility('new')}
                                        ></i>
                                    </div>
                                    {errors.newPassword && (
                                        <small className="text-danger" style={{fontSize: "12px"}}>
                                            {errors.newPassword}
                                        </small>
                                    )}

                                </div>

                                {/* Confirm Password */}
                                <div className="col-12  mt-3">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        confirm new password:
                                    </label>
                                    <div className="position-relative">
                                        <input 
                                            className={`w-100 mt-2 py-2 form-control ${errors.confirmPassword ? 'border-danger' : ''}`}
                                            style={{ fontSize: "14px", background: "#F5F5DC", paddingRight: "40px" }}
                                            name="confirmPassword"
                                            type={showPasswords.confirm ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <i 
                                            className={`fa-solid ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                            style={{
                                                right: "15px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                cursor: "pointer",
                                                color: "#666"
                                            }}
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        ></i>
                                    </div>
                                    {errors.confirmPassword && (
                                        <small className="text-danger" style={{fontSize: "12px"}}>
                                            {errors.confirmPassword}
                                        </small>
                                    )}
                                </div>

                            </div>


                            <div className="row g-0 mt-4">
                                <div className="col-6 ">
                                    <button 
                                        type="button"
                                        className="text-capitalize px-3 py-2 rounded w-100 text-dark border-0
                                        small"
                                        onClick={() => navigate(-1)}>
                                        cancel
                                    </button>
                                </div>
                                <div className="col-6 px-2">
                                    <button 
                                        type="submit"
                                        className="text-capitalize bg-dark px-3 py-2 rounded w-100 text-light border-0
                                        small"
                                        >
                                        change password
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className={`${role === "seller" 
                        ? "col-12 col-lg-6 d-none d-md-block" 
                        : "col-12 col-md-6 col-lg-6 d-md-block"} `}>
                        <img src={img} alt="background" className="img-fluid" />
                    </div>
                </div>
            </div>
        </div>

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
        </>
    );
}

export default ChangePassword;