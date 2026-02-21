import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../toastNotif.jsx";
import { appContext } from "../../context/appContext.jsx";
import philippinesAddress from "../../data/philippinesAddress.json";




const Register = () => {
    const {
            showToast,
            toastMessage,
            toastType,
            showNotification,
            setShowToast,
     } = useContext(appContext);
    
    const [step, setStep] = useState(0);  
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
    const navigate = useNavigate();
    const [licenseImagePreview, setLicenseImagePreview] = useState(null);


    
    // Add these new states after your existing useState declarations
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [allTermsAgreed, setAllTermsAgreed] = useState(false);

     
    // Add after existing rider terms states
    const [showSellerTermsModal, setShowSellerTermsModal] = useState(false);
    const [sellerTermsAgreed, setSellerTermsAgreed] = useState(false);



    const [showBuyerTermsModal, setShowBuyerTermsModal] = useState(false);
    const [buyerTermsAgreed, setBuyerTermsAgreed] = useState(false);

    // Address dropdown states
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedBarangay, setSelectedBarangay] = useState("");
    
    
    const [submitting, setSubmitting] = useState(false); 


    const userTypes = [
        {
            role: "buyer",
            title: "Buyer",
            description: "Browse and purchase fresh products",
            icon: "🛒"
        },
        {
            role: "farmer",
            title: "Farmer",
            description: "List and sell your products",
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






    const handleTextOnlyChange = (e) => {
        const { name, value } = e.target;
        const regex = /^[A-Za-z\s]*$/; // Regex to allow only letters and spaces        
        if (regex.test(value) || value === "") {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };


    // Format number with spaces for display
    const formatPhoneNumber = (value) => {
        if (!value) return '';
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Add spaces: 9XX XXX XXXX
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    };

    // Updated Contact Number Handler with formatting
    const handleContactChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        // Remove 63 prefix if user types it
        if (value.startsWith('63')) {
            value = value.substring(2);
        }
        
        // Ensure it starts with 9
        if (value.length > 0 && !value.startsWith('9')) {
            if (value.startsWith('0')) {
                value = value.substring(1);
            }
            if (!value.startsWith('9')) {
                value = '9' + value;
            }
        }
        
        // Limit to 10 digits
        if (value.length <= 10) {
            setFormData({
                ...formData,
                contact: value
            });
        }
    };

    // Same for wallet
    const handleWalletNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('63')) {
            value = value.substring(2);
        }
        
        if (value.length > 0 && !value.startsWith('9')) {
            if (value.startsWith('0')) {
                value = value.substring(1);
            }
            if (!value.startsWith('9')) {
                value = '9' + value;
            }
        }
        
        if (value.length <= 10) {
            setFormData({
                ...formData,
                wallet_number: value
            });
        }
    };






    // Address dropdown handlers
    const handleProvinceChange = (e) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setSelectedCity("");
        setSelectedBarangay("");
        setFormData({
            ...formData,
            province: province,
            city: "",
            barangay: "",
            zipCode: ""
        });
    };

    const handleCityChange = (e) => {
        const city = e.target.value;
        setSelectedCity(city);
        setSelectedBarangay("");
        
        // Get zip code from selected city
        const province = selectedProvince;
        const cityData = philippinesAddress[province]?.cities[city];
        const zipCode = cityData?.zipCode || "";
        
        setFormData({
            ...formData,
            city: city,
            barangay: "",
            zipCode: zipCode
        });
    };

    const handleBarangayChange = (e) => {
        const barangay = e.target.value;
        setSelectedBarangay(barangay);
        setFormData({
            ...formData,
            barangay: barangay
        });
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



        setSubmitting(true);

        const passwordValidationError = validatePassword(formData.password);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            setSubmitting(false);
            return;
        }

        if (formData.password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            setSubmitting(false);

            return;
        }

        // Validate rider-specific fields
        if (selectedRole === "rider") {
            if (!formData.plateNumber || formData.plateNumber.trim() === "") {
                setErrorMessage("Please enter your plate number");
                setShowErrorModal(true);
                setSubmitting(false);
                return;
            }
            if (!formData.plateImage) {
                setErrorMessage("Please upload a photo of your plate number");
                setShowErrorModal(true);
                setSubmitting(false);

                return;
            }
            if (!formData.licenseImage) {
                setErrorMessage("Please upload a photo of your driver's license");
                setShowErrorModal(true);
                setSubmitting(false);

                return;
            }
        }



        try {
            // Prepare FormData for file upload
            const dataToSend = new FormData();
            
            // Add all form fields
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
                    // Convert 9XXXXXXXXX to 09XXXXXXXXX
                    const contactNumber = formData[key].startsWith('9') 
                        ? `0${formData[key]}` 
                        : formData[key];
                    dataToSend.append('contact', contactNumber);
                } else if (key === 'wallet_number') {
                    // Convert 9XXXXXXXXX to 09XXXXXXXXX
                    const walletNumber = formData[key].startsWith('9') 
                        ? `0${formData[key]}` 
                        : formData[key];
                    dataToSend.append('wallet_number', walletNumber);
                } else {
                    dataToSend.append(key, formData[key]);
                }
            });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                method: "POST",
                body: dataToSend // Don't set Content-Type header, browser will set it automatically with boundary
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setShowSuccessModal(true);
        } catch (error) {
            setErrorMessage(error.message);
            setShowErrorModal(true);
            console.log("failed post request: ", error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setSelectedRole("");
        setPasswordError("");
        setConfirmPassword("");
        setFormData({});
        setPlateImagePreview(null);
        setLicenseImagePreview(null);
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        navigate(-1);
    };

    const handleErrorModalClose = () => {
        setShowErrorModal(false);
        setErrorMessage("");
    };






    // Add this after handleErrorModalClose function
 

    const handleOpenTermsModal = () => {
        setShowTermsModal(true);
    };

    const handleCloseTermsModal = () => {
        setShowTermsModal(false);
    };



    const handleOpenSellerTermsModal = () => {
        setShowSellerTermsModal(true);
    };

    const handleCloseSellerTermsModal = () => {
        setShowSellerTermsModal(false);
    };



    const handleOpenBuyerTermsModal = () => {
        setShowBuyerTermsModal(true);
    };

    const handleCloseBuyerTermsModal = () => {
        setShowBuyerTermsModal(false);
    };




    const needsEWallet = selectedRole.toLowerCase() === "farmer" || selectedRole.toLowerCase() === "rider";
    const isRider = selectedRole.toLowerCase() === "rider";
    const isFarmer = selectedRole.toLowerCase() === "farmer";
    const isBuyer = selectedRole.toLowerCase() === "buyer";


    return (
        <>
            <div className="container my-3">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-8">

                        {step === 0 && (
                            <div className="card overflow-hidden shadow">
                                <h1 className="text-center p-3 text-white fs-4 fw-bold" 
                                    style={{ background: "#4CAF50" }}>
                                    Important Reminder
                                </h1>
                                
                                <div className="card-body p-4">
                                    {/* Direct content - no more nested boxes */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-start gap-3 mb-3">
                                            <i className="fa fa-envelope text-success mt-1" style={{ fontSize: "1.5rem" }}></i>
                                            <div>
                                                <h6 className="fw-bold mb-2">Gmail Account Required</h6>
                                                <p className="mb-0 text-muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                                                    Please use a valid <strong>Gmail account</strong> for registration. 
                                                    This ensures better security and reliable communication.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-start gap-3 mb-3">
                                            <i className="fa fa-shield-alt text-success mt-1" style={{ fontSize: "1.5rem" }}></i>
                                            <div>
                                                <h6 className="fw-bold mb-2">Account Verification</h6>
                                                <p className="mb-0 text-muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                                                    Make sure to provide accurate information. For Farmers and Riders, 
                                                    your account will undergo admin verification before approval.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-start gap-3">
                                            <i className="fa fa-file-alt text-success mt-1" style={{ fontSize: "1.5rem" }}></i>
                                            <div>
                                                <h6 className="fw-bold mb-2">Terms and Conditions</h6>
                                                <p className="mb-0 text-muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                                                    You will be required to read and accept the Terms and Conditions 
                                                    specific to your selected account type before completing registration.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="alert alert-warning mb-4" style={{ fontSize: "13px" }}>
                                        <i className="fa fa-exclamation-triangle me-2"></i>
                                        <strong>Note:</strong> Using non-Gmail accounts may result in registration issues or delayed notifications.
                                    </div>

                                    <button
                                        onClick={() => setStep(1)}
                                        className="btn w-100 fw-semibold"
                                        style={{ 
                                            backgroundColor: "#4CAF50",
                                            color: "white",
                                            fontSize: "14px"
                                        }}
                                    >
                                        I Understand and continue
                                    </button>

                                    <div className="mt-3 text-center">
                                        <p className="m-0" style={{ fontSize: "14px" }}>Already have an account?</p>
                                        <Link to="/" className="text-decoration-none fw-semibold" 
                                            style={{ color: "#4CAF50", fontSize: "14px" }}>
                                            Sign In
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="card overflow-hidden shadow">
                                <h1 className="text-center p-3 text-white fs-4 fw-bold" 
                                    style={{ background: "#4CAF50" }}>
                                    Choose Account Type
                                </h1>
                                <div className="card-body p-4">
                                    <p className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>
                                        Select how you want to use our platform
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
                                    
                                    <div className="mt-4 text-center">
                                        <p className="m-0" style={{ fontSize: "14px" }}>Already have an account?</p>
                                        <Link to="/" className="text-decoration-none fw-semibold" 
                                              style={{ color: "#4CAF50", fontSize: "14px" }}>
                                            Sign In
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )} 
                        
                        {step === 2 && (
                            <div className="card overflow-hidden shadow">
                                <h1 className="text-center p-3 text-white fs-4 fw-bold" 
                                    style={{ background: "#4CAF50" }}>
                                    {userTypes.find(t => t.role === selectedRole)?.title} Registration
                                </h1>
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-2 mb-4"
                                    onClick={handleBack}
                                    style={{cursor: "pointer"}}>
                                        <i className="fa fa-chevron-left"
                                        style={{ color: "#4caf50"}}></i>
                                        <p className="m-0" style={{color: "#4caf50"}}>
                                            Back to account selection
                                        </p>
                                    </div>

                                    <form onSubmit={handleForm}>
                                        <div className="row mt-3">
                                            {[
                                                { label: 'First name', name: 'firstname', type: 'text', holder: 'Enter first name' },
                                                { label: "Middle name", name: "middlename", type: "text", holder: "Enter middle"},
                                                { label: 'Last name', name: 'lastname', type: 'text',  holder: 'Enter last name' },

                                            ].map((data, i) => (
                                                <div key={i} className="col-12 col-md-4 mt-2 mt-md-0">
                                                    <label className="text-capitalize small mt-2  fw-bold"
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
                                                        value={formData[data.name] || ''}
                                                        onChange={handleTextOnlyChange}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        
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
                                                        <label className="text-capitalize small fw-bold" htmlFor="province">
                                                            Province:
                                                        </label>
                                                        <select
                                                            className="mt-2 form-control form-select small"
                                                            style={{fontSize: "14px"}}
                                                            id="province"
                                                            name="province"
                                                            value={selectedProvince}
                                                            onChange={handleProvinceChange}
                                                            required
                                                        >
                                                            <option value="">-- Select Province --</option>
                                                            {Object.keys(philippinesAddress).map((province) => (
                                                                <option key={province} value={province}>
                                                                    {province}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6 mt-2 mt-md-0">
                                                        <label className="text-capitalize small fw-bold" htmlFor="city">
                                                            City/Municipality:
                                                        </label>
                                                        <select
                                                            className="mt-2 form-control form-select small"
                                                            style={{fontSize: "14px"}}
                                                            id="city"
                                                            name="city"
                                                            value={selectedCity}
                                                            onChange={handleCityChange}
                                                            disabled={!selectedProvince}
                                                            required
                                                        >
                                                            <option value="">-- Select City --</option>
                                                            {selectedProvince && Object.keys(philippinesAddress[selectedProvince]?.cities || {}).map((city) => (
                                                                <option key={city} value={city}>
                                                                    {city}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <label className="text-capitalize small fw-bold" htmlFor="barangay">
                                                            Barangay:
                                                        </label>
                                                        <select
                                                            className="mt-2 form-control form-select small"
                                                            style={{fontSize: "14px"}}
                                                            id="barangay"
                                                            name="barangay"
                                                            value={selectedBarangay}
                                                            onChange={handleBarangayChange}
                                                            disabled={!selectedCity}
                                                            required
                                                        >
                                                            <option value="">-- Select Barangay --</option>
                                                            {selectedCity && philippinesAddress[selectedProvince]?.cities[selectedCity]?.barangays?.map((barangay) => (
                                                                <option key={barangay} value={barangay}>
                                                                    {barangay}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6 mt-2 mt-md-0">
                                                        <label className="text-capitalize small fw-bold" htmlFor="zipCode">
                                                            Zip Code:
                                                        </label>
                                                        <input
                                                            className="mt-2 form-control small"
                                                            style={{fontSize: "14px"}}
                                                            type="text"
                                                            name="zipCode"
                                                            id="zipCode"
                                                            placeholder="Auto-filled"
                                                            value={formData.zipCode || ''}
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3">
                                                    <label className="text-capitalize small fw-bold" htmlFor="detailAddress">
                                                        Detailed Address:
                                                    </label>
                                                    <textarea
                                                        className="mt-2 form-control small"
                                                        style={{fontSize: "14px"}}
                                                        name="detailAddress"
                                                        id="detailAddress"
                                                        rows="3"
                                                        placeholder="House/Unit No., Street, Subdivision, etc."
                                                        value={formData.detailAddress || ''}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                        Provide complete address details for deliveries
                                                    </small>
                                                </div>
                                            </>
                                        )}


                                        {/* Rider Vehicle Information */}
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
                                                    <label className="text-capitalize small fw-bold" 
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
                                                    <label className="text-capitalize small fw-bold" 
                                                        htmlFor="plateImage">vehicle with plate number photo:
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
                                                    <label className="text-capitalize small fw-bold" htmlFor="licenseImage">
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

                                        {needsEWallet && (
                                            <>
                                                <div className="row mt-2">
                                                    <div className="col">
                                                        <label className="text-capitalize small fw-bold" 
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
                                                        <label className="text-capitalize small fw-bold" 
                                                            htmlFor="wallet_number">e-wallet number:
                                                        </label>
                                                        <div className="input-group mt-2">
                                                            <span className="input-group-text" style={{fontSize: "14px"}}>+63</span>
                                                            <input
                                                                className="form-control small"
                                                                style={{fontSize: "14px"}}
                                                                type="text"
                                                                name="wallet_number"
                                                                id="wallet_number"
                                                                placeholder="9XX XXX XXXX"
                                                                value={formatPhoneNumber(formData.wallet_number || '')}
                                                                onChange={handleWalletNumberChange}
                                                                required
                                                            />
                                                        </div>
                                                        <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                            Enter 10-digit mobile number (e.g., 912 345 6789) 
                                                        </small>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <label className="text-capitalize small fw-bold" 
                                                        htmlFor="email">Email:
                                                    </label>
                                                    <input
                                                        className="mt-2 form-control small "
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
                                                    <label className="text-capitalize small fw-bold" 
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
                                                    <label className="text-capitalize small fw-bold" 
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


                                        {/* Address Section - for farmers and riders */}

                                        {!needsEWallet && (
                                            <>
                                                <div className="mt-3">
                                                    <label className="text-capitalize small fw-bold" 
                                                        htmlFor="contact">contact no:
                                                    </label>
                                                    <div className="input-group mt-2">
                                                        <span className="input-group-text" style={{fontSize: "14px"}}>+63</span>
                                                        <input
                                                            className="form-control small"
                                                            style={{fontSize: "14px"}}
                                                            type="text"
                                                            name="contact"
                                                            id="contact"
                                                            placeholder="9XX XXX XXXX"
                                                            value={formatPhoneNumber(formData.contact || '')}
                                                            onChange={handleContactChange}
                                                            required
                                                        />
                                                    </div>
                                                    <small className="text-muted d-block mt-1" style={{fontSize: "12px"}}>
                                                        Enter 10-digit mobile number (e.g., 912 345 6789)
                                                    </small>
                                                </div>

                                                <div className="mt-3">
                                                    <label className="text-capitalize small fw-bold" 
                                                        htmlFor="email">Email:
                                                    </label>
                                                    <input
                                                        className="mt-2 form-control small "
                                                        style={{fontSize: "14px"}}
                                                        type="email"
                                                        name="email"
                                                        id="email"
                                                        placeholder="Enter Email"
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <small className="text-muted d-block m-1" style={{fontSize: "12px"}}>
                                                        *prefered gmail account.
                                                    </small>
                                                </div>

                                                <div className="mt-3">
                                                    <label className="text-capitalize small fw-bold " 
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
                                                    <label className="text-capitalize small fw-bold" 
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
                                                <p className="mb-1 text-muted small">Registering as:</p>
                                                <p className="mb-0 fw-bold text-capitalize" style={{ color: "#4CAF50" }}>
                                                    {userTypes.find(t => t.role === selectedRole)?.icon} {userTypes.find(t => t.role === selectedRole)?.title}
                                                </p>
                                            </div>
                                        </div>


                                        {/* Replace your existing register button div with this */}
                                        <div className="mt-4">
                                            {isRider && (
                                                <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107" }}>
                                                    <p className="mb-0" style={{ fontSize: "13px" }}>
                                                        Registration may proceed only after reading and accepting the Rider Terms and Conditions.{" "}
                                                        <span
                                                            className="fw-semibold"
                                                            style={{ color: "#4CAF50", textDecoration: "underline", cursor: "pointer" }}
                                                            onClick={handleOpenTermsModal}
                                                        >
                                                            CLICK HERE
                                                        </span>
                                                    </p>
                                                </div>
                                            )}


                                            {isFarmer && (
                                                <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107" }}>
                                                    <p className="mb-0" style={{ fontSize: "13px" }}>
                                                        Registration may proceed only after reading and accepting the Seller Terms and Conditions.{" "}
                                                        <span
                                                            className="fw-semibold"
                                                            style={{ color: "#4CAF50", textDecoration: "underline", cursor: "pointer" }}
                                                            onClick={handleOpenSellerTermsModal}
                                                        >
                                                            CLICK HERE
                                                        </span>
                                                    </p>
                                                </div>
                                            )}


                                            {isBuyer && (
                                                <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107" }}>
                                                    <p className="mb-0" style={{ fontSize: "13px" }}>
                                                        Registration may proceed only after reading and accepting the Buyer Terms and Conditions.{" "}
                                                        <span
                                                            className="fw-semibold"
                                                            style={{ color: "#4CAF50", textDecoration: "underline", cursor: "pointer" }}
                                                            onClick={handleOpenBuyerTermsModal}
                                                        >
                                                            CLICK HERE
                                                        </span>
                                                    </p>
                                                </div>
                                            )}

                                            
                                            <button
                                                type="submit"
                                                className="p-2 shadow-sm text-light rounded w-100 border-0 text-capitalize"
                                                disabled={
                                                    (isRider && !allTermsAgreed) || 
                                                    (isFarmer && !sellerTermsAgreed) ||
                                                    (isBuyer && !buyerTermsAgreed) || 
                                                    submitting
                                                    
                                                }
                                                style={{
                                                    outline: "none",
                                                    fontWeight: "500",

                                                    cursor: ((isRider && !allTermsAgreed) || (isFarmer && !sellerTermsAgreed) || (isBuyer && !buyerTermsAgreed) || submitting) ? "not-allowed" : "pointer",
                                                    background: ((isRider && !allTermsAgreed) || (isFarmer && !sellerTermsAgreed) || (isBuyer && !buyerTermsAgreed)) ? "#cccccc" : "#4CAF50",
                                                    opacity: ((isRider && !allTermsAgreed) || (isFarmer && !sellerTermsAgreed) || (isBuyer && !buyerTermsAgreed) || submitting) ? 0.6 : 1
                                                }}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        {"Submitting..."}
                                                    </>
                                                ) : (
                                                    "Register Now"
                                                )}
                                            </button>
                                        </div>

                                        <div className="my-4 text-center">
                                            <p className="m-0" style={{ fontSize: "14px" }}>Already have an account?</p>
                                            <Link to="/" className="text-decoration-none fw-semibold" 
                                                  style={{ color: "#4CAF50", fontSize: "14px" }}>
                                                Sign In
                                            </Link>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSuccessModal  && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
                >
                    <div
                        className="bg-white rounded shadow-lg p-4 text-center"
                        style={{ maxWidth: "400px", width: "90%" }}
                        // onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
                            <i className="fa fa-check-circle text-green fs-1" 
                            >
                            </i>
                        </div>
                         <h5 className="fw-bold text-capitalize mb-2">registration successful!</h5>

                        {(selectedRole === "farmer" || selectedRole === "rider") ? (
                            <>
                                <div className="alert alert-warning mb-3" style={{ fontSize: "13px" }}>
                                    <i className="fa fa-hourglass-half me-2"></i>
                                    <strong>Pending Admin Approval</strong>
                                </div>
                                <p className="text-muted small mb-3" style={{ lineHeight: "1.6" }}>
                                    Your {selectedRole === "farmer" ? "seller" : "rider"} account has been submitted for review. 
                                    Please wait for the admin to verify and approve your registration.
                                </p>
                                <p className="small mb-4" style={{ color: "#666" }}>
                                    You will be notified once your account is approved. This process may take 
                                    <strong> 1-3 business days</strong>.
                                </p>
                            </>
                        ) : (
                            <p className="text-muted small mb-4">
                                Your account has been created successfully.
                            </p>
                        )}
                        <button
                            className="btn text-capitalize  btn-outline-success btn-sm "
                            onClick={handleModalClose}
                        >
                            {(selectedRole === "farmer" || selectedRole === "rider") ? "understood" : "go to sign in"}
                        </button>
                    </div>
                </div>
            )}

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
                            <i className="fa fa-times-circle text-danger fs-1 " 
                            ></i>
                        </div>
                        <h5 className="fw-bold text-capitalize mb-2">registration failed</h5>
                        <p className="text-muted small mb-4">
                            {errorMessage || "An error occurred during registration. Please try again."}
                        </p>
                        <button
                            className="btn btn-outline-danger btn-sm text-capitalize w-25"
                            onClick={handleErrorModalClose}
                        >
                            close
                        </button>
                    </div>
                </div>
            )}




        {showTermsModal && (
            <RiderTermsModal
                show={showTermsModal}
                onClose={handleCloseTermsModal}
                agreedToTerms={allTermsAgreed}
                setAgreedToTerms={setAllTermsAgreed}
                onAccept={handleCloseTermsModal}
            />
        )}


        {showSellerTermsModal && (
            <SellerTermsModal
                show={showSellerTermsModal}
                onClose={handleCloseSellerTermsModal}
                agreedToTerms={sellerTermsAgreed}
                setAgreedToTerms={setSellerTermsAgreed}
                onAccept={handleCloseSellerTermsModal}
            />
        )}
        {showBuyerTermsModal && (
            <BuyerTermsModal
                show={showBuyerTermsModal}
                onClose={handleCloseBuyerTermsModal}
                agreedToTerms={buyerTermsAgreed}
                setAgreedToTerms={setBuyerTermsAgreed}
                onAccept={handleCloseBuyerTermsModal}
            />
        )}


        </>
    );
};

export default Register;








// Buyer Terms Modal Component
const BuyerTermsModal = ({ show, onClose, agreedToTerms, setAgreedToTerms, onAccept }) => {
    if (!show) return null;
    
    const termsData = [
        {
            number: '1',
            title: 'Account Registration and Responsibilities',
            content: [
                'Buyers must provide accurate and complete information during registration.',
                'Buyers are responsible for maintaining the confidentiality of their account credentials.',
                'Any activity conducted under your account is your sole responsibility.'
            ]
        },
        {
            number: '2',
            title: 'Order Placement and Product Information',
            content: [
                'Buyers must review product details, prices, and availability before placing orders.',
                'All orders are subject to product availability and seller confirmation.',
                'The platform is not responsible for inaccuracies in product listings provided by sellers.'
            ]
        },
        {
            number: '3',
            title: 'Payment Methods and Procedures',
            content: [
                'Buyers can choose between Cash on Delivery (COD) or E-Wallet payment methods.',
                'For COD orders: Payment must be exact. Overpayment is not the platform\'s or rider\'s responsibility.',
                'For E-Wallet payments: Buyers must send payment only to the official platform QR code and upload a valid receipt.',
                'Orders will not be confirmed if payment is insufficient or proof of payment is missing.'
            ]
        },
        {
            number: '4',
            title: 'Payment Accuracy',
            content: [
                'Buyers are responsible for ensuring that payment amounts are accurate.',
                'If payment is insufficient, the order will not be processed until the correct amount is settled.',
                'For payment discrepancies, buyers may contact the admin for assistance through external channels.'
            ]
        },
        {
            number: '5',
            title: 'E-Wallet Transaction Requirements',
            content: [
                'All e-wallet payments must be sent to the platform\'s official QR code only.',
                'Buyers must upload a clear and authentic receipt as proof of payment.',
                'Orders without valid proof of payment will not be approved or processed.'
            ]
        },
        {
            number: '6',
            title: 'Product Condition and Delivery',
            content: [
                'Buyers have the right to inspect products upon delivery.',
                'If a product is confirmed to have been damaged by the rider during delivery, buyers may file a complaint through the system.',
                'Complaints must be supported by evidence such as photos or descriptions of the damage.'
            ]
        },
        {
            number: '7',
            title: 'Returns and Refunds',
            content: [
                'Returns are only accepted for defective, spoiled, or incorrect products.',
                'Buyers must report issues within 24 hours of delivery.',
                'Refund processing will follow platform policies and timelines.'
            ]
        },
        {
            number: '8',
            title: 'Prohibited Activities',
            content: [
                'Buyers are prohibited from:',
                '• Providing false or misleading information',
                '• Making fraudulent claims or chargebacks',
                '• Harassing sellers, riders, or platform staff',
                '• Conducting transactions outside the platform',
                'Violations may result in account suspension or termination.'
            ]
        },
        {
            number: '9',
            title: 'Buyer Complaints and Dispute Resolution',
            content: [
                'Buyers may file complaints regarding product quality, delivery issues, or rider misconduct.',
                'All complaints must be submitted through the platform\'s official channels.',
                'The platform will investigate and resolve disputes in accordance with established policies.'
            ]
        },
        {
            number: '10',
            title: 'Limitation of Liability',
            content: [
                'The platform acts as an intermediary between buyers, sellers, and riders.',
                'The platform is not liable for product quality issues, delivery delays caused by external factors, or disputes arising from buyer negligence.',
                'Buyers are encouraged to communicate directly with sellers or contact platform support for assistance.'
            ]
        },
        {
            number: '11',
            title: 'Privacy and Data Protection',
            content: [
                'Buyers\' personal information will be used solely for order processing and platform operations.',
                'The platform is committed to protecting buyer data in accordance with applicable privacy laws.',
                'Buyers\' information will not be shared with third parties without consent, except as required by law.'
            ]
        },
        {
            number: '12',
            title: 'Communication and Support',
            content: [
                'Buyers may contact platform support for inquiries, complaints, or assistance.',
                'Response times may vary depending on the nature and complexity of the issue.'
            ]
        },
        {
            number: '13',
            title: 'Buyer Acknowledgment and Agreement',
            content: [
                'By registering as a buyer, you confirm that:',
                '• You have read and understood these Buyer Terms and Conditions.',
                '• You agree to comply with all payment and order placement procedures.',
                '• You accept responsibility for the accuracy of payment amounts and transaction details.',
                '• You understand your rights regarding product inspection, complaints, and refunds.'
            ]
        }
    ];

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg"
                style={{ maxWidth: "800px", width: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-bottom" style={{ backgroundColor: "#4CAF50" }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold text-white">E-FARMERS' HUB</h4>
                            <p className="mb-0 text-white" style={{ fontSize: "14px" }}>Buyer Terms and Conditions</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-close btn-close-white"
                            aria-label="Close"
                        ></button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                    <p className="mb-4" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                        These Terms and Conditions govern the registration and participation of buyers 
                        in E-FARMERS' HUB: A Web-Based E-Commerce Platform for Crop Products in Lupang Ramos, 
                        Langkaan I, Dasmariñas, Cavite. By registering as a buyer, you acknowledge that you 
                        have read, understood, and agreed to comply with all provisions stated below.
                    </p>

                    {termsData.map((term, index) => (
                        <div key={index} className="mb-4">
                            <div className="mb-2">
                                <h6 className="fw-bold mb-2" style={{ fontSize: "14px" }}>
                                    {term.number}. {term.title}
                                </h6>
                                <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#555" }}>
                                    {term.content.map((line, i) => (
                                        <p key={i} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>
                            {index < termsData.length - 1 && <hr className="my-3" />}
                        </div>
                    ))}

                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: "#f0f0f0" }}>
                        <p className="mb-0 small text-center fw-semibold">
                            By proceeding with registration, you fully agree to these Buyer Terms and Conditions.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-top">
                    <div 
                        className="d-flex align-items-center gap-2 mb-3 p-3 rounded" 
                        style={{ 
                            backgroundColor: agreedToTerms ? "#d4edda" : "#fff3cd",
                            cursor: "pointer"
                        }}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        <input
                            type="checkbox"
                            id="buyer-final-agreement"
                            checked={agreedToTerms}
                            onChange={() => setAgreedToTerms(!agreedToTerms)}
                            style={{ cursor: "pointer" }}
                        />
                        <label 
                            htmlFor="buyer-final-agreement" 
                            className="mb-0 small" 
                            style={{ cursor: "pointer" }}
                        >
                            by checking this box, I agree that I have read and accepted the terms and conditions
                        </label>
                    </div>
                    
                    <div className="d-flex gap-2">
                        <button
                            onClick={onClose}
                            className="btn btn-secondary flex-fill"
                            style={{ fontSize: "14px" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (agreedToTerms) {
                                    onAccept();
                                }
                            }}
                            disabled={!agreedToTerms}
                            className="btn flex-fill"
                            style={{ 
                                fontSize: "14px",
                                backgroundColor: agreedToTerms ? "#4CAF50" : "#cccccc",
                                color: "white",
                                cursor: agreedToTerms ? "pointer" : "not-allowed",
                                opacity: agreedToTerms ? 1 : 0.6
                            }}
                        >
                            Accept and Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};






// Seller Terms Modal Component
const SellerTermsModal = ({ show, onClose, agreedToTerms, setAgreedToTerms, onAccept }) => {
    if (!show) return null;
    
    const termsData = [
        {
            number: '1',
            title: 'Product Quality Responsibility',
            content: [
                'Sellers are strictly prohibited from packing and shipping spoiled, expired, damaged, or low-quality products.',
                'All products shipped must be fresh, safe, and in good condition.'
            ]
        },
        {
            number: '2',
            title: 'Seller Accountability',
            content: [
                'The seller is responsible for the quality of the product until it is received by the buyer.'
            ]
        },
        {
            number: '3',
            title: 'Compliance',
            content: [
                'Sellers are required to comply with platform standards for proper packaging and handling of products.'
            ]
        },
        {
            number: '4',
            title: 'Accurate Product Information',
            content: [
                'Sellers must provide accurate product details, actual photos, prices, and available stocks.',
                'Misleading or false information is prohibited.'
            ]
        },
        {
            number: '5',
            title: 'Order Processing',
            content: [
                'Sellers must process orders within 24-48 hours and update buyers on shipping status.',
                'Cancellations without valid reason are prohibited.'
            ]
        },
        {
            number: '6',
            title: 'Returns and Refunds',
            content: [
                'Sellers must accept legitimate returns for defective or mismatched items.',
                'Process refunds within 3-5 business days.'
            ]
        },
        {
            number: '7',
            title: 'Prohibited Practices',
            content: [
                'Selling fake products, spam messaging, manipulation of reviews, and transactions outside the platform are prohibited.'
            ]
        },
        {
            number: '8',
            title: 'Communication',
            content: [
                'Sellers must respond to buyer inquiries within 24 hours.',
                'Maintain professional communication at all times.'
            ]
        },
        {
            number: '9',
            title: 'Penalties',
            content: [
                'Repeated violations may result in warnings, suspension, or termination of account.'
            ]
        },
        {
            number: '10',
            title: 'Agreement',
            content: [
                'By using the platform, the seller agrees to all of these Seller Terms & Conditions.'
            ]
        }
    ];

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg"
                style={{ maxWidth: "800px", width: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-bottom" style={{ backgroundColor: "#4CAF50" }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold text-white">E-FARMERS' HUB</h4>
                            <p className="mb-0 text-white" style={{ fontSize: "14px" }}>Seller Terms and Conditions</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-close btn-close-white"
                            aria-label="Close"
                        ></button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                    <p className="mb-4" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                        These Terms and Conditions govern the registration and participation of sellers 
                        in E-FARMERS' HUB: A Web-Based E-Commerce Platform for Crop Products in Lupang Ramos, 
                        Langkaan I, Dasmariñas, Cavite. By registering as a seller, you acknowledge that you 
                        have read, understood, and agreed to comply with all provisions stated below.
                    </p>

                    {termsData.map((term, index) => (
                        <div key={index} className="mb-4">
                            <div className="mb-2">
                                <h6 className="fw-bold mb-2" style={{ fontSize: "14px" }}>
                                    {term.number}. {term.title}
                                </h6>
                                <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#555" }}>
                                    {term.content.map((line, i) => (
                                        <p key={i} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>
                            {index < termsData.length - 1 && <hr className="my-3" />}
                        </div>
                    ))}

                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: "#f0f0f0" }}>
                        <p className="mb-0 small text-center fw-semibold">
                            By proceeding with registration, you fully agree to these Seller Terms and Conditions.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-top">
                    <div 
                        className="d-flex align-items-center gap-2 mb-3 p-3 rounded" 
                        style={{ 
                            backgroundColor: agreedToTerms ? "#d4edda" : "#fff3cd",
                            cursor: "pointer"
                        }}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        <input
                            type="checkbox"
                            id="seller-final-agreement"
                            checked={agreedToTerms}
                            onChange={() => setAgreedToTerms(!agreedToTerms)}
                            style={{ cursor: "pointer" }}
                        />
                        <label 
                            htmlFor="seller-final-agreement" 
                            className="mb-0 small" 
                            style={{ cursor: "pointer" }}
                        >
                            by checking this box, I agree that I have read and accepted the terms and conditions
                        </label>
                    </div>
                    
                    <div className="d-flex gap-2">
                        <button
                            onClick={onClose}
                            className="btn btn-secondary flex-fill"
                            style={{ fontSize: "14px" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (agreedToTerms) {
                                    onAccept();
                                }
                            }}
                            disabled={!agreedToTerms}
                            className="btn flex-fill"
                            style={{ 
                                fontSize: "14px",
                                backgroundColor: agreedToTerms ? "#4CAF50" : "#cccccc",
                                color: "white",
                                cursor: agreedToTerms ? "pointer" : "not-allowed",
                                opacity: agreedToTerms ? 1 : 0.6
                            }}
                        >
                            Accept and Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};






// Separate Terms Modal Component
const RiderTermsModal = ({ show, onClose, agreedToTerms, setAgreedToTerms, onAccept }) => {
    if (!show) return null;
    
    const termsData = [
        {
            number: '1',
            title: 'Rider Eligibility and Membership',
            content: [
                'The rider must be a legitimate and active member or a recognized individual of the Kasama Lupang Ramos Farmers\' Cooperative.',
                'Proof of active membership may be required and verified by the system administrator or the Farmer Organization Admin.'
            ]
        },
        {
            number: '2',
            title: 'Identity and Vehicle Verification',
            content: [
                'To ensure safety and accountability, all riders are required to:',
                '• Complete identity verification through the system.',
                '• Provide a valid government-issued ID.',
                '• Possess and submit a valid driver\'s license.',
                '• Present the motorcycle to be used for deliveries, including a clear record of the plate number.',
                'Failure to complete verification requirements may result in denial or suspension of rider registration.'
            ]
        },
        {
            number: '3',
            title: 'Product Pick-up and Condition Verification',
            content: [
                'Riders are required to inspect all products upon pick-up.',
                'The rider must ensure that the products are not spoiled, damaged, or defective before confirming pick-up in the system.',
                'If issues are found during pick-up, the rider has the right to refuse the delivery before confirmation.',
                'Once the rider confirms pick-up, the farmer becomes liable for the product\'s condition prior to delivery.',
                'Any damage proven to be caused by the rider during delivery will be considered the rider\'s responsibility.'
            ]
        },
        {
            number: '4',
            title: 'Delivery Responsibilities',
            content: [
                'Riders shall deliver products assigned by the system as an opportunity to earn additional income through shipping or delivery fees.',
                'Riders must update order status in real time, following the correct delivery flow:',
                'Picked Up → Out for Delivery → Delivered'
            ]
        },
        {
            number: '5',
            title: 'Cash on Delivery (COD) Transactions',
            content: [
                'For COD orders, riders must:',
                '• Collect the exact payment from the buyer.',
                '• Take a clear and authentic photo of the buyer\'s payment as proof.',
                '• Upload the proof of payment to the system immediately.',
                'All collected COD payments must be remitted to the assigned Farmer Organization Admin:',
                '• Within the same day, or',
                '• Based on the official remittance schedule set by the organization.',
                'Riders must confirm remittance within the system.',
                'Uploading fake, altered, or edited proof of payment is strictly prohibited.'
            ]
        },
        {
            number: '6',
            title: 'Cashless Payment Policy',
            content: [
                'Cashless payments (e.g., GCash, Maya) must be processed only through the system\'s official QR code wallet.',
                'Riders are strictly prohibited from receiving e-wallet payments directly to their personal accounts.'
            ]
        },
        {
            number: '7',
            title: 'Rider Earnings and Compensation',
            content: [
                'Rider earnings are derived solely from shipping or delivery fees paid by buyers.',
                'Earnings will be released according to the system\'s payout rules and schedule.'
            ]
        },
        {
            number: '8',
            title: 'Liability for Damaged or Lost Items',
            content: [
                'If a product is damaged during delivery and it is proven that the rider is at fault, the rider is obligated to compensate for the damage.',
                'Deductions may be applied to rider earnings based on:',
                '• The severity of the damage, or',
                '• The monetary value of the affected product.',
                'Specific deduction rates or percentages shall be determined and enforced by the system or organization policies.'
            ]
        },
        {
            number: '9',
            title: 'Prohibited Acts and Misconduct',
            content: [
                'Any form of dishonesty or misconduct is strictly prohibited, including but not limited to:',
                '• Withholding or failing to remit COD payments',
                '• Fake or incomplete deliveries',
                '• Submission of falsified reports or documents',
                '• Overcharging buyers',
                '• Harassment, theft, fraud, or misrepresentation',
                'Violations may result in temporary suspension, permanent removal from the platform, and/or legal action.'
            ]
        },
        {
            number: '10',
            title: 'Legal Accountability and Ethical Conduct',
            content: [
                'All riders are expected to observe ethical, professional, and lawful behavior at all times.',
                'Any criminal acts, fraud, harassment, theft, or serious misconduct will render the rider fully liable under applicable laws.'
            ]
        },
        {
            number: '11',
            title: 'Confidentiality and Data Protection',
            content: [
                'Riders must keep all buyer, farmer, and system information confidential.',
                'Information accessed within the platform must not be shared, leaked, sold, or misused in any form.'
            ]
        },
        {
            number: '12',
            title: 'System Authority and Enforcement',
            content: [
                'The System Administrator and the Farmer Organization Admin reserve the right to:',
                '• Suspend or terminate rider access',
                '• Investigate reported violations',
                '• Report unlawful activities to proper authorities'
            ]
        },
        {
            number: '13',
            title: 'Rider Declarations and Agreement',
            content: [
                'By registering as a rider, you confirm that:',
                '• You are a legitimate member of the farmer organization.',
                '• You agree to comply with all rider responsibilities, including COD remittance and delivery standards.',
                '• You accept full accountability for any misconduct, violations, or damages caused.',
                '• You understand and agree to the earnings, payout rules, and penalties imposed by the system.'
            ]
        }
    ];

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg"
                style={{ maxWidth: "800px", width: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-bottom" style={{ backgroundColor: "#4CAF50" }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold text-white">E-FARMERS' HUB</h4>
                            <p className="mb-0 text-white" style={{ fontSize: "14px" }}>Rider Terms and Conditions</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-close btn-close-white"
                            aria-label="Close"
                        ></button>
                    </div>
                </div>



                {/* Scrollable Content */}
                <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                    <p className="mb-4" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                        These Terms and Conditions govern the registration and participation of riders in E-FARMERS' HUB: 
                        A Web-Based E-Commerce Platform for Crop Products in Lupang Ramos, Langkaan I, Dasmariñas, Cavite. 
                        By registering as a rider, you acknowledge that you have read, understood, and agreed to comply with 
                        all provisions stated below.
                    </p>

                    {termsData.map((term, index) => (
                        <div key={index} className="mb-4">
                            <div className="mb-2">
                                <h6 className="fw-bold mb-2" style={{ fontSize: "14px" }}>
                                    {term.number}. {term.title}
                                </h6>
                                <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#555" }}>
                                    {term.content.map((line, i) => (
                                        <p key={i} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>
                            {index < termsData.length - 1 && <hr className="my-3" />}
                        </div>
                    ))}

                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: "#f0f0f0" }}>
                        <p className="mb-0 small text-center fw-semibold">
                            By proceeding with registration, you fully agree to these Rider Terms and Conditions.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-top">
                    <div 
                        className="d-flex align-items-center gap-2 mb-3 p-3 rounded" 
                        style={{ 
                            backgroundColor: agreedToTerms ? "#d4edda" : "#fff3cd",
                            cursor: "pointer"
                        }}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        <input
                            type="checkbox"
                            id="final-agreement"
                            checked={agreedToTerms}
                            onChange={() => setAgreedToTerms(!agreedToTerms)}
                            style={{ cursor: "pointer" }}
                        />
                        <label 
                            htmlFor="final-agreement" 
                            className="mb-0 small" 
                            style={{ cursor: "pointer" }}
                        >
                            by checking this box, I agree that I have read and accepted the terms and condition
                        </label>
                    </div>
                    
                    <div className="d-flex gap-2">
                        <button
                            onClick={onClose}
                            className="btn btn-secondary flex-fill"
                            style={{ fontSize: "14px" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (agreedToTerms) {
                                    onAccept();
                                }
                            }}
                            disabled={!agreedToTerms}
                            className="btn flex-fill"
                            style={{ 
                                fontSize: "14px",
                                backgroundColor: agreedToTerms ? "#4CAF50" : "#cccccc",
                                color: "white",
                                cursor: agreedToTerms ? "pointer" : "not-allowed",
                                opacity: agreedToTerms ? 1 : 0.6
                            }}
                        >
                            Accept and Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

