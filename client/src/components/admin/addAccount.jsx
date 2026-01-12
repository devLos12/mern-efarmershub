import React, { useState } from "react";

const AddAccount = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState("");
    const [formData, setFormData] = useState({});
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [plateImagePreview, setPlateImagePreview] = useState(null);
    const [licenseImagePreview, setLicenseImagePreview] = useState(null);


    const userTypes = [
        {
            role: "admin",
            title: "Sub Admin",
            description: "Manage platform and users",
            icon: "👤"
        },
        {
            role: "seller",
            title: "Farmer",
            description: "List and sell products",
            icon: "🌾"
        },
        {
            role: "rider",
            title: "Rider",
            description: "Deliver orders and earn",
            icon: "🚴"
        }
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setFormData({ ...formData, role });
        setStep(2);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        if (name === "password") {
            setPasswordError("");
        }
    };


    const handlePlateImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload a valid image (JPEG, JPG, or PNG)');
                return;
            }


            setFormData({
                ...formData,
                plateImage: file
            });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPlateImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };


    const removePlateImage = () => {
        setPlateImagePreview(null);
        setFormData({
            ...formData,
            plateImage: null
        });
        // Reset file input
        const fileInput = document.getElementById('plateImage');
        if (fileInput) fileInput.value = '';
    };



    const handleLicenseImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload a valid image (JPEG, JPG, or PNG)');
                return;
            }

            setFormData({
                ...formData,
                licenseImage: file
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                setLicenseImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLicenseImage = () => {
        setLicenseImagePreview(null);
        setFormData({
            ...formData,
            licenseImage: null
        });
        const fileInput = document.getElementById('licenseImage');
        if (fileInput) fileInput.value = '';
    };



    const handleContactChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        // Remove leading 0 if present
        if (value.startsWith('0')) {
            value = value.substring(1);
        }
        
        // Limit to 10 digits
        if (value.length <= 10) {
            setFormData({
                ...formData,
                contact: value
            });
        }
    };

    const handleWalletNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        // Remove leading 0 if present
        if (value.startsWith('0')) {
            value = value.substring(1);
        }
        
        // Limit to 10 digits
        if (value.length <= 10) {
            setFormData({
                ...formData,
                wallet_number: value
            });
        }
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (password.length < minLength) {
            return "Password must be at least 8 characters";
        }
        if (!hasUpperCase) {
            return "Password must contain at least one uppercase letter";
        }
        if (!hasLowerCase) {
            return "Password must contain at least one lowercase letter";
        }
        if (!hasNumber) {
            return "Password must contain at least one number";
        }
        return "";
    };

    const handleForm = async (e) => {
        e.preventDefault();

        const passwordValidationError = validatePassword(formData.password);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }

        if (formData.password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }


          // Validate rider-specific fields
        if (selectedRole === "rider") {
            if (!formData.plateNumber || formData.plateNumber.trim() === "") {
                setErrorMessage("Please enter your plate number");
                setShowErrorModal(true);
                return;
            }
            if (!formData.plateImage) {
                setErrorMessage("Please upload a photo of your plate number");
                setShowErrorModal(true);
                return;
            }

            if (!formData.licenseImage) {
                setErrorMessage("Please upload a photo of your driver's license");
                setShowErrorModal(true);
                return;
            }


        }

        try {
            // Prepare data with formatted contact numbers (add 0 prefix)
            const dataToSend = new FormData();
    
            Object.keys(formData).forEach(key => {
                if (key === 'plateImage') {
                    if (formData[key]) {
                        dataToSend.append('plateImage', formData[key]);
                    }
                } else if (key === 'licenseImage') {
                    if (formData[key]) {
                        dataToSend.append('licenseImage', formData[key]);
                    }
                } else if (key === 'contact') {
                    dataToSend.append('contact', `0${formData[key]}`);
                } else if (key === 'wallet_number') {
                    dataToSend.append('wallet_number', `0${formData[key]}`);
                } else {
                    dataToSend.append(key, formData[key]);
                }
            });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/add-account/${selectedRole}`, {
                method: "POST",
                body: dataToSend,
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setShowSuccessModal(true);
        } catch (error) {
            setErrorMessage(error.message);
            setShowErrorModal(true);
            console.log("Failed to add account: ", error.message);
        }
    };
    
    const handleBack = () => {
        setStep(1);
        setSelectedRole("");
        setPasswordError("");
        setConfirmPassword("");
        setFormData({});
    };

    const handleClose = () => {
        setStep(1);
        setSelectedRole("");
        setFormData({});
        setConfirmPassword("");
        setPasswordError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowErrorModal(false);
        setErrorMessage("");
        if (onClose) onClose();
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        handleClose();
        if (onSuccess) onSuccess();
    };

    const handleErrorModalClose = () => {
        setShowErrorModal(false);
        setErrorMessage("");
    };

    const isAdmin = selectedRole === "admin";
    const needsEWallet = selectedRole === "seller" || selectedRole === "rider";
    const isRider = selectedRole.toLowerCase() === "rider";


    

    if (!isOpen) return null;

    return (
        <>
            {/* Modal Backdrop */}
            <div 
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                style={{ zIndex: 1050 }}
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div 
                className="position-fixed top-50 start-50 translate-middle"
                style={{ 
                    zIndex: 1051, 
                    maxWidth: "600px", 
                    width: "90%",
                    maxHeight: "90vh",
                    overflowY: "auto"
                }}
            >
                <div className="bg-white rounded shadow-lg">
                    {step === 1 ? (
                        // Step 1: Account Type Selection
                        <div className="card overflow-hidden shadow-lg border-0">
                            <div className="d-flex justify-content-between align-items-center p-3 text-white" 
                                style={{ background: "#4CAF50" }}>
                                <h1 className="m-0 fs-4 fw-bold">Add New Account</h1>
                                <button 
                                    className="btn-close btn-close-white"
                                    onClick={handleClose}
                                ></button>
                            </div>
                            <div className="card-body p-4">
                                <p className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>
                                    Select account type to create
                                </p>
                                <div className="row g-3">
                                    {userTypes.map((type, i) => (
                                        <div key={i} className="col-12">
                                            <div
                                                className="card border-2 h-100 shadow-sm"
                                                style={{
                                                    cursor: "pointer",
                                                    transition: "all 0.3s ease",
                                                    borderColor: "#e0e0e0"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "#4CAF50";
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#e0e0e0";
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                }}
                                                onClick={() => handleRoleSelect(type.role)}
                                            >
                                                <div className="card-body d-flex align-items-center p-3">
                                                    <div className="me-3" style={{ fontSize: "2.5rem" }}>
                                                        {type.icon}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h5 className="card-title mb-1 fw-bold" style={{ fontSize: "16px" }}>
                                                            {type.title}
                                                        </h5>
                                                        <p className="card-text text-muted mb-0" style={{ fontSize: "13px" }}>
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <svg width="24" height="24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="9 18 15 12 9 6"></polyline>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Step 2: Account Creation Form
                        <div className="card overflow-hidden shadow-lg border-0">
                            <div className="d-flex justify-content-between align-items-center p-3 text-white" 
                                style={{ background: "#4CAF50" }}>
                                <h1 className="m-0 fs-4 fw-bold">
                                    Create {userTypes.find(t => t.role === selectedRole)?.title} Account
                                </h1>
                                <button 
                                    className="btn-close btn-close-white"
                                    onClick={handleClose}
                                ></button>
                            </div>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-2 mb-4"
                                onClick={handleBack}
                                style={{cursor: "pointer"}}>
                                    <i className="fa fa-chevron-left"
                                    style={{ color: "#4caf50"}}></i>
                                    <p className="m-0" style={{color: "#4caf50"}}>
                                        Back to account selection
                                    </p>
                                </div>

                                <div>
                                    {/* Admin Form - Email, Contact and Password */}
                                    {isAdmin ? (
                                        <>
                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="adminType">Admin Type:
                                                </label>
                                                <input
                                                    className="form-control mt-2 opacity-75 text-capitalize"
                                                    style={{fontSize: "14px"}}
                                                    type="text"
                                                    name="adminType"
                                                    id="adminType"
                                                    value="sub"
                                                    readOnly
                                                    disabled
                                                />
                                                <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                    Sub admin accounts can be created with limited permissions
                                                </small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="email">Email:
                                                </label>
                                                <input
                                                    className="mt-2 form-control small"
                                                    style={{fontSize: "14px"}}
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    placeholder="Enter Email"
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="contact">contact no:
                                                </label>
                                                <div className="input-group mt-2">
                                                    <span className="input-group-text small" style={{fontSize: "14px"}}>+63</span>
                                                    <input
                                                        className="form-control small"
                                                        style={{fontSize: "14px"}}
                                                        type="text"
                                                        name="contact"
                                                        id="contact"
                                                        placeholder="9XXXXXXXXX"
                                                        value={formData.contact || ''}
                                                        onChange={handleContactChange}
                                                        maxLength="10"
                                                        required
                                                    />
                                                </div>
                                                <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                    Enter 10-digit mobile number starting with 9 (0 will be added automatically)
                                                </small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="password">Create Password:
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        className="mt-2 form-control small"
                                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        id="password"
                                                        placeholder="Enter Password"
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <i 
                                                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                        style={{
                                                            right: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            cursor: "pointer",
                                                            color: "#6c757d"
                                                        }}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    ></i>
                                                </div>
                                                <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                    *Use 8 or more characters with a mix of uppercase, lowercase & numbers
                                                </small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="confirmPassword">Confirm Password:
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        className="mt-2 form-control small"
                                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        name="confirmPassword"
                                                        id="confirmPassword"
                                                        placeholder="Re-enter Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => {
                                                            setConfirmPassword(e.target.value);
                                                            setPasswordError("");
                                                        }}
                                                        required
                                                    />
                                                    <i 
                                                        className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                        style={{
                                                            right: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            cursor: "pointer",
                                                            color: "#6c757d"
                                                        }}
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    ></i>
                                                </div>
                                                {passwordError && (
                                                    <small className="text-danger d-block mt-1">{passwordError}</small>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Seller and Rider Form */}
                                            <div className="row mt-3">
                                                {[
                                                    { label: 'First name', name: 'firstname', type: 'text', holder: 'Enter first name' },
                                                    { label: 'Last name', name: 'lastname', type: 'text',  holder: 'Enter last name' }
                                                ].map((data, i) => (
                                                    <div key={i} className="col">
                                                        <label className="text-capitalize small"
                                                            htmlFor={data.name}>
                                                            {data.label}:
                                                        </label>
                                                        
                                                        <input
                                                            className="mt-2 form-control small"
                                                            style={{fontSize: "14px"}}
                                                            type={data.type}
                                                            name={data.name}
                                                            id={data.name}
                                                            placeholder={data.holder}
                                                            onChange={handleChange}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>


                                            {/* Address Section - for sellers and riders */}
                                            {needsEWallet && (
                                                <>
                                                    <div className="d-flex align-items-center gap-2 opacity-75 mt-4 p-3 rounded" 
                                                        style={{ backgroundColor: "#e8f5e9" }}>
                                                        <i className="fa fa-map-marker-alt" style={{ color: "#4CAF50" }}></i>
                                                        <p className="m-0 small fw-semibold" style={{ color: "#2e7d32" }}>
                                                            Address Information Required
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="row mt-3">
                                                        <div className="col-md-6">
                                                            <label className="text-capitalize small" htmlFor="province">
                                                                Province:
                                                            </label>
                                                            <input
                                                                className="mt-2 form-control small"
                                                                style={{fontSize: "14px"}}
                                                                type="text"
                                                                name="province"
                                                                id="province"
                                                                placeholder="Enter Province"
                                                                onChange={handleChange}
                                                                required

                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="text-capitalize small" htmlFor="city">
                                                                City/Municipality:
                                                            </label>
                                                            <input
                                                                className="mt-2 form-control small"
                                                                style={{fontSize: "14px"}}
                                                                type="text"
                                                                name="city"
                                                                id="city"
                                                                placeholder="Enter City"
                                                                onChange={handleChange}
                                                                required

                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="row mt-3">
                                                        <div className="col-md-8">
                                                            <label className="text-capitalize small" htmlFor="barangay">
                                                                Barangay:
                                                            </label>
                                                            <input
                                                                className="mt-2 form-control small"
                                                                style={{fontSize: "14px"}}
                                                                type="text"
                                                                name="barangay"
                                                                id="barangay"
                                                                placeholder="Enter Barangay"
                                                                onChange={handleChange}
                                                                required

                                                            />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="text-capitalize small" htmlFor="zipCode">
                                                                Zip Code:
                                                            </label>
                                                            <input
                                                                className="mt-2 form-control small"
                                                                style={{fontSize: "14px"}}
                                                                type="text"
                                                                name="zipCode"
                                                                id="zipCode"
                                                                placeholder="e.g., 1100"
                                                                maxLength="4"
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <label className="text-capitalize small" htmlFor="detailAddress">
                                                            Detailed Address:
                                                        </label>
                                                        <textarea
                                                            className="mt-2 form-control small"
                                                            style={{fontSize: "14px"}}
                                                            name="detailAddress"
                                                            id="detailAddress"
                                                            rows="3"
                                                            placeholder="House/Unit No., Street, Subdivision, etc."
                                                            onChange={handleChange}
                                                            required

                                                        />
                                                        <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                            Provide complete address details for deliveries
                                                        </small>
                                                    </div>
                                                </>
                                            )}


                                            {isRider && (
                                                <>
                                                    <div className="d-flex align-items-center gap-2 opacity-75 mt-4 p-3 rounded" 
                                                        style={{ backgroundColor: "#e8f5e9" }}>
                                                        <i className="fa fa-motorcycle" style={{ color: "#4CAF50" }}></i>
                                                        <p className="m-0 small fw-semibold" style={{ color: "#2e7d32" }}>
                                                            Vehicle Information Required
                                                        </p>
                                                    </div>

                                                    <div className="mt-3">
                                                        <label className="text-capitalize small" 
                                                            htmlFor="plateNumber">Plate Number:
                                                        </label>
                                                        <input
                                                            className="mt-2 form-control small text-uppercase"
                                                            style={{fontSize: "14px"}}
                                                            type="text"
                                                            name="plateNumber"
                                                            id="plateNumber"
                                                            placeholder="e.g., ABC 1234"
                                                            onChange={handleChange}
                                                            required
                                                        />
                                                        <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                            Enter your motorcycle/vehicle plate number
                                                        </small>
                                                    </div>

                                                    <div className="mt-3">
                                                        <label className="text-capitalize small" 
                                                            htmlFor="plateImage">vehicle with plate number photo::
                                                        </label>
                                                        
                                                        {!plateImagePreview ? (
                                                            <div className="mt-2">
                                                                <label 
                                                                    htmlFor="plateImage"
                                                                    className="d-flex flex-column align-items-center justify-content-center border-2 rounded p-4"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        borderStyle: "dashed",
                                                                        borderColor: "#4CAF50",
                                                                        backgroundColor: "#f9f9f9",
                                                                        minHeight: "150px"
                                                                    }}
                                                                >
                                                                    <i className="fa fa-camera mb-2" style={{ fontSize: "2.5rem", color: "#4CAF50" }}></i>
                                                                    <p className="mb-1 fw-semibold" style={{ fontSize: "14px" }}>Upload Plate Number Photo</p>
                                                                    <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>
                                                                        Click to select image (JPEG, PNG, max 5MB)
                                                                    </p>
                                                                </label>
                                                                <input
                                                                    type="file"
                                                                    id="plateImage"
                                                                    name="plateImage"
                                                                    accept="image/jpeg,image/jpg,image/png"
                                                                    onChange={handlePlateImageChange}
                                                                    style={{ display: "none" }}
                                                                    required
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 position-relative">
                                                                <img 
                                                                    src={plateImagePreview} 
                                                                    alt="Plate preview" 
                                                                    className="w-100 rounded"
                                                                    style={{ maxHeight: "250px", objectFit: "cover" }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={removePlateImage}
                                                                    className="btn btn-danger btn-sm position-absolute"
                                                                    style={{ top: "10px", right: "10px" }}
                                                                >
                                                                    <i className="fa fa-times"></i> Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                        <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                            Clear photo of your vehicle with plate number for verification
                                                        </small>
                                                    </div>



                                                    <div className="mt-3">
                                                        <label className="text-capitalize small" htmlFor="licenseImage">
                                                            Driver's License Photo:
                                                        </label>
                                                        
                                                        {!licenseImagePreview ? (
                                                            <div className="mt-2">
                                                                <label 
                                                                    htmlFor="licenseImage"
                                                                    className="d-flex flex-column align-items-center justify-content-center border-2 rounded p-4"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        borderStyle: "dashed",
                                                                        borderColor: "#4CAF50",
                                                                        backgroundColor: "#f9f9f9",
                                                                        minHeight: "150px"
                                                                    }}
                                                                >
                                                                    <i className="fa fa-id-card mb-2" style={{ fontSize: "2.5rem", color: "#4CAF50" }}></i>
                                                                    <p className="mb-1 fw-semibold" style={{ fontSize: "14px" }}>Upload Driver's License</p>
                                                                    <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>
                                                                        Click to select image (JPEG, PNG, max 5MB)
                                                                    </p>
                                                                </label>
                                                                <input
                                                                    type="file"
                                                                    id="licenseImage"
                                                                    name="licenseImage"
                                                                    accept="image/jpeg,image/jpg,image/png"
                                                                    onChange={handleLicenseImageChange}
                                                                    style={{ display: "none" }}
                                                                    required
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 position-relative">
                                                                <img 
                                                                    src={licenseImagePreview} 
                                                                    alt="License preview" 
                                                                    className="w-100 rounded"
                                                                    style={{ maxHeight: "250px", objectFit: "cover" }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={removeLicenseImage}
                                                                    className="btn btn-danger btn-sm position-absolute"
                                                                    style={{ top: "10px", right: "10px" }}
                                                                >
                                                                    <i className="fa fa-times"></i> Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                        <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                            Clear photo of your valid driver's license for verification
                                                        </small>
                                                    </div>
                                                </>
                                            )}
                                        
                                            
                                            {needsEWallet && (
                                                <div className="d-flex align-items-center gap-2 opacity-75 mt-4">
                                                    <i className="fa fa-info-circle small"></i>
                                                    <p className="m-0 text-capitalize small">
                                                        please provide a verified g-cash or maya account for receiving payments.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="row mt-2">
                                                <div className="col">
                                                    <label className="text-capitalize small" 
                                                        htmlFor="wallet_type">e-wallet type:
                                                    </label>

                                                    <select className="form-select mt-2 opacity-75 text-capitalize"
                                                    style={{fontSize: "14px"}}
                                                    name="wallet_type" 
                                                    id="wallet_type"
                                                    onChange={handleChange}
                                                    required>
                                                        <option value="">select wallet</option>
                                                        {["g-cash", "maya"].map((data, i) => (
                                                            <option key={i} value={data}>{data}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col">
                                                    <label className="text-capitalize small" 
                                                        htmlFor="wallet_number">e-wallet number:
                                                    </label>
                                                    <div className="input-group mt-2">
                                                        <span className="input-group-text small" style={{fontSize: "14px"}}>+63</span>
                                                        <input
                                                            className="form-control small"
                                                            style={{fontSize: "14px"}}
                                                            type="text"
                                                            name="wallet_number"
                                                            id="wallet_number"
                                                            placeholder="9XXXXXXXXX"
                                                            value={formData.wallet_number || ''}
                                                            onChange={handleWalletNumberChange}
                                                            maxLength="10"
                                                            required
                                                        />
                                                    </div>
                                                    <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                        Enter 10-digit mobile number starting with 9 (0 will be added automatically)
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="email">Email:
                                                </label>
                                                <input
                                                    className="mt-2 form-control small"
                                                    style={{fontSize: "14px"}}
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    placeholder="Enter Email"
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <small className="d-flex mt-1 text-muted text-capitalize" 
                                                style={{fontSize: "12px"}}>
                                                    *prefered gmail account.
                                                </small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="password">Create Password:
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        className="mt-2 form-control small"
                                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        id="password"
                                                        placeholder="Enter Password"
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <i 
                                                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                        style={{
                                                            right: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            cursor: "pointer",
                                                            color: "#6c757d"
                                                        }}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    ></i>
                                                </div>
                                                <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                    *Use 8 or more characters with a mix of uppercase, lowercase & numbers
                                                </small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small" 
                                                    htmlFor="confirmPassword">Confirm Password:
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        className="mt-2 form-control small"
                                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        name="confirmPassword"
                                                        id="confirmPassword"
                                                        placeholder="Re-enter Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => {
                                                            setConfirmPassword(e.target.value);
                                                            setPasswordError("");
                                                        }}
                                                        required
                                                    />
                                                    <i 
                                                        className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                        style={{
                                                            right: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            cursor: "pointer",
                                                            color: "#6c757d"
                                                        }}
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    ></i>
                                                </div>
                                                {passwordError && (
                                                    <small className="text-danger d-block mt-1">{passwordError}</small>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f5f5f5" }}>
                                        <div>
                                            <p className="mb-1 text-muted small">Creating account as:</p>
                                            <p className="mb-0 fw-bold text-capitalize" style={{ color: "#4CAF50" }}>
                                                {userTypes.find(t => t.role === selectedRole)?.icon} {userTypes.find(t => t.role === selectedRole)?.title}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={handleForm}
                                            className="p-2 shadow-sm text-light rounded w-100 border-0 text-capitalize"
                                            style={{
                                                outline: "none",
                                                cursor: "pointer",
                                                background: "#4CAF50",
                                                fontWeight: "500"
                                            }}
                                        >
                                            create account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
                    onClick={handleSuccessModalClose}
                >
                    <div
                        className="bg-white rounded shadow-lg p-4 text-center"
                        style={{ maxWidth: "400px", width: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2">account created successfully!</h5>
                        <p className="text-muted small mb-4">
                            The {userTypes.find(t => t.role === selectedRole)?.title.toLowerCase()} account has been created successfully.
                        </p>
                        <button
                            className="btn text-capitalize w-100"
                            style={{ background: "#4CAF50", color: "white" }}
                            onClick={handleSuccessModalClose}
                        >
                            close
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
                    onClick={handleErrorModalClose}
                >
                    <div
                        className="bg-white rounded shadow-lg p-4 text-center"
                        style={{ maxWidth: "400px", width: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-times-circle text-danger" style={{ fontSize: "4rem" }}></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2">failed to create account</h5>
                        <p className="text-muted small mb-4">
                            {errorMessage || "An error occurred while creating the account. Please try again."}
                        </p>
                        <button
                            className="btn text-capitalize w-100"
                            style={{ background: "#dc3545", color: "white" }}
                            onClick={handleErrorModalClose}
                        >
                            close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddAccount;