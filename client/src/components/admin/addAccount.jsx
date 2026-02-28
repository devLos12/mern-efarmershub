import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { appContext } from "../../context/appContext";
import { useContext } from "react";
import Toast from "../toastNotif.jsx";
import philippinesAddress from "../../data/philippinesAddress.json";

const AddAccount = ({ isOpen, onClose, onSuccess }) => {
    const {
        showToast,
        toastMessage,
        toastType,
        showNotification,
        setShowToast,
    } = useContext(appContext);

    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState("");
    const [formData, setFormData] = useState({});
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [plateImagePreview, setPlateImagePreview] = useState(null);
    const [licenseImagePreview, setLicenseImagePreview] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    // ✅ Address dropdown states (from Register.jsx)
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedBarangay, setSelectedBarangay] = useState("");

    const userTypes = [
        { role: "seller", title: "Farmer", description: "List and sell products", icon: "🌾" },
        { role: "rider", title: "Rider", description: "Deliver orders and earn", icon: "🚴" }
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setFormData({ ...formData, role });
        setStep(2);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === "password") setPasswordError("");
    };

    // ✅ Text-only validation for names (from Register.jsx)
    const handleTextOnlyChange = (e) => {
        const { name, value } = e.target;
        const regex = /^[A-Za-z\s]*$/;
        if (regex.test(value) || value === "") {
            setFormData({ ...formData, [name]: value });
        }
    };

    // ✅ Phone number formatter (from Register.jsx)
    const formatPhoneNumber = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    };

    // ✅ Address handlers (from Register.jsx)
    const handleProvinceChange = (e) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setSelectedCity("");
        setSelectedBarangay("");
        setFormData({ ...formData, province, city: "", barangay: "", zipCode: "" });
    };

    const handleCityChange = (e) => {
        const city = e.target.value;
        setSelectedCity(city);
        setSelectedBarangay("");
        const cityData = philippinesAddress[selectedProvince]?.cities[city];
        const zipCode = cityData?.zipCode || "";
        setFormData({ ...formData, city, barangay: "", zipCode });
    };

    const handleBarangayChange = (e) => {
        const barangay = e.target.value;
        setSelectedBarangay(barangay);
        setFormData({ ...formData, barangay });
    };

    // ✅ Wallet number handler (from Register.jsx)
    const handleWalletNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('63')) value = value.substring(2);
        if (value.length > 0 && !value.startsWith('9')) {
            if (value.startsWith('0')) value = value.substring(1);
            if (!value.startsWith('9')) value = '9' + value;
        }
        if (value.length <= 10) setFormData({ ...formData, wallet_number: value });
    };

    const handlePlateImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showNotification('Please upload a valid image (JPEG, JPG, or PNG)', 'error');
            return;
        }
        setIsCompressing(true);
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setFormData({ ...formData, plateImage: compressedFile });
            const reader = new FileReader();
            reader.onloadend = () => setPlateImagePreview(reader.result);
            reader.readAsDataURL(compressedFile);
        } catch {
            showNotification('Failed to compress image', 'error');
        } finally {
            setIsCompressing(false);
        }
    };

    const removePlateImage = () => {
        setPlateImagePreview(null);
        setFormData({ ...formData, plateImage: null });
        const fileInput = document.getElementById('plateImage');
        if (fileInput) fileInput.value = '';
    };

    const handleLicenseImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showNotification('Please upload a valid image (JPEG, JPG, or PNG)', 'error');
            return;
        }
        setIsCompressing(true);
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setFormData({ ...formData, licenseImage: compressedFile });
            const reader = new FileReader();
            reader.onloadend = () => setLicenseImagePreview(reader.result);
            reader.readAsDataURL(compressedFile);
        } catch {
            showNotification('Failed to compress image', 'error');
        } finally {
            setIsCompressing(false);
        }
    };

    const removeLicenseImage = () => {
        setLicenseImagePreview(null);
        setFormData({ ...formData, licenseImage: null });
        const fileInput = document.getElementById('licenseImage');
        if (fileInput) fileInput.value = '';
    };

    const validatePassword = (password) => {
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
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
        if (selectedRole === "rider") {
            if (!formData.plateNumber || formData.plateNumber.trim() === "") {
                showNotification("Please enter your plate number", 'error');
                return;
            }
            if (!formData.plateImage) {
                showNotification("Please upload a photo of your plate number", 'error');
                return;
            }
            if (!formData.licenseImage) {
                showNotification("Please upload a photo of your driver's license", 'error');
                return;
            }
        }

        setIsCreatingAccount(true);
        try {
            const dataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'plateImage') {
                    if (formData[key]) dataToSend.append('plateImage', formData[key]);
                } else if (key === 'licenseImage') {
                    if (formData[key]) dataToSend.append('licenseImage', formData[key]);
                } else if (key === 'wallet_number') {
                    // ✅ Same conversion logic as Register.jsx
                    const walletNumber = formData[key].startsWith('9') ? `0${formData[key]}` : formData[key];
                    dataToSend.append('wallet_number', walletNumber);
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

            showNotification(
                `${userTypes.find(t => t.role === selectedRole)?.title} account created successfully!`,
                'success'
            );
            handleClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setSelectedRole("");
        setPasswordError("");
        setConfirmPassword("");
        setFormData({});
        setSelectedProvince("");
        setSelectedCity("");
        setSelectedBarangay("");
        setPlateImagePreview(null);
        setLicenseImagePreview(null);
    };

    const handleClose = () => {
        setStep(1);
        setSelectedRole("");
        setFormData({});
        setConfirmPassword("");
        setPasswordError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setSelectedProvince("");
        setSelectedCity("");
        setSelectedBarangay("");
        setPlateImagePreview(null);
        setLicenseImagePreview(null);
        if (onClose) onClose();
    };

    const needsEWallet = selectedRole === "seller" || selectedRole === "rider";
    const isRider = selectedRole.toLowerCase() === "rider";

    if (!isOpen) return null;

    return (
        <>
            <div
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
                style={{ zIndex: 1050 }}
                onClick={handleClose}
            ></div>

            <div
                className="position-fixed top-50 start-50 translate-middle"
                style={{ zIndex: 1051, maxWidth: "700px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}
            >
                <div className="bg-white rounded shadow-lg">
                    {step === 1 ? (
                        <div className="card overflow-hidden shadow-lg border-0">
                            <div className="d-flex justify-content-between align-items-center p-3 text-white" style={{ background: "#4CAF50" }}>
                                <h1 className="m-0 fs-4 fw-bold">Add New Account</h1>
                                <button className="btn-close btn-close-white" onClick={handleClose}></button>
                            </div>
                            <div className="card-body p-4">
                                <p className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>Select account type to create</p>
                                <div className="row g-3">
                                    {userTypes.map((type, i) => (
                                        <div key={i} className="col-12">
                                            <div
                                                className="card border-2 h-100 shadow-sm"
                                                style={{ cursor: "pointer", transition: "all 0.3s ease", borderColor: "#e0e0e0" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4CAF50"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.transform = "translateY(0)"; }}
                                                onClick={() => handleRoleSelect(type.role)}
                                            >
                                                <div className="card-body d-flex align-items-center p-3">
                                                    <div className="me-3" style={{ fontSize: "2.5rem" }}>{type.icon}</div>
                                                    <div className="flex-grow-1">
                                                        <h5 className="card-title mb-1 fw-bold" style={{ fontSize: "16px" }}>{type.title}</h5>
                                                        <p className="card-text text-muted mb-0" style={{ fontSize: "13px" }}>{type.description}</p>
                                                    </div>
                                                    <svg width="24" height="24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card overflow-hidden shadow-lg border-0">
                            <div className="d-flex justify-content-between align-items-center p-3 text-white" style={{ background: "#4CAF50" }}>
                                <h1 className="m-0 fs-4 fw-bold">
                                    Create {userTypes.find(t => t.role === selectedRole)?.title} Account
                                </h1>
                                <button className="btn-close btn-close-white" onClick={handleClose}></button>
                            </div>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-2 mb-4" onClick={handleBack} style={{ cursor: "pointer" }}>
                                    <i className="fa fa-chevron-left" style={{ color: "#4caf50" }}></i>
                                    <p className="m-0" style={{ color: "#4caf50" }}>Back to account selection</p>
                                </div>

                                <div>
                                    {/* ✅ Names — text only, matching Register.jsx */}
                                    <div className="row mt-3">
                                        {[
                                            { label: 'First name', name: 'firstname', holder: 'Enter first name' },
                                            { label: 'Middle name', name: 'middlename', holder: 'Enter middle name', optional: true },
                                            { label: 'Last name', name: 'lastname', holder: 'Enter last name' }
                                        ].map((field, i) => (
                                            <div key={i} className="col">
                                                <label className="text-capitalize small fw-bold" htmlFor={field.name}>
                                                    {field.label}:
                                                    {field.optional && (
                                                        <span className="text-normal text-muted small ms-1">{'(optional)'}</span>
                                                    )}
                                                    
                                                </label>
                                                <input
                                                    className="mt-2 form-control small"
                                                    style={{ fontSize: "14px" }}
                                                    type="text"
                                                    name={field.name}
                                                    id={field.name}
                                                    placeholder={field.holder}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleTextOnlyChange}
                                                    required={!field.optional}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* ✅ Address — dropdown version matching Register.jsx */}
                                    {needsEWallet && (
                                        <>
                                            <div className="d-flex align-items-center gap-2 opacity-75 mt-4 p-3 rounded" style={{ backgroundColor: "#e8f5e9" }}>
                                                <i className="fa fa-map-marker-alt" style={{ color: "#4CAF50" }}></i>
                                                <p className="m-0 small fw-semibold" style={{ color: "#2e7d32" }}>Address Information Required</p>
                                            </div>

                                            <div className="row mt-3">
                                                <div className="col-md-6">
                                                    <label className="text-capitalize small fw-bold" htmlFor="province">Province:</label>
                                                    <select
                                                        className="mt-2 form-control form-select small"
                                                        style={{ fontSize: "14px" }}
                                                        id="province"
                                                        name="province"
                                                        value={selectedProvince}
                                                        onChange={handleProvinceChange}
                                                        required
                                                    >
                                                        <option value="">-- Select Province --</option>
                                                        {Object.keys(philippinesAddress).map((province) => (
                                                            <option key={province} value={province}>{province}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-6 mt-2 mt-md-0">
                                                    <label className="text-capitalize small fw-bold" htmlFor="city">City/Municipality:</label>
                                                    <select
                                                        className="mt-2 form-control form-select small"
                                                        style={{ fontSize: "14px" }}
                                                        id="city"
                                                        name="city"
                                                        value={selectedCity}
                                                        onChange={handleCityChange}
                                                        disabled={!selectedProvince}
                                                        required
                                                    >
                                                        <option value="">-- Select City --</option>
                                                        {selectedProvince && Object.keys(philippinesAddress[selectedProvince]?.cities || {}).map((city) => (
                                                            <option key={city} value={city}>{city}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="row mt-3">
                                                <div className="col-md-6">
                                                    <label className="text-capitalize small fw-bold" htmlFor="barangay">Barangay:</label>
                                                    <select
                                                        className="mt-2 form-control form-select small"
                                                        style={{ fontSize: "14px" }}
                                                        id="barangay"
                                                        name="barangay"
                                                        value={selectedBarangay}
                                                        onChange={handleBarangayChange}
                                                        disabled={!selectedCity}
                                                        required
                                                    >
                                                        <option value="">-- Select Barangay --</option>
                                                        {selectedCity && philippinesAddress[selectedProvince]?.cities[selectedCity]?.barangays?.map((barangay) => (
                                                            <option key={barangay} value={barangay}>{barangay}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-6 mt-2 mt-md-0">
                                                    <label className="text-capitalize small fw-bold" htmlFor="zipCode">Zip Code:</label>
                                                    <input
                                                        className="mt-2 form-control small"
                                                        style={{ fontSize: "14px", backgroundColor: "#f5f5f5" }}
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
                                                <label className="text-capitalize small fw-bold" htmlFor="detailAddress">Detailed Address:</label>
                                                <textarea
                                                    className="mt-2 form-control small"
                                                    style={{ fontSize: "14px" }}
                                                    name="detailAddress"
                                                    id="detailAddress"
                                                    rows="3"
                                                    placeholder="House/Unit No., Street, Subdivision, etc."
                                                    value={formData.detailAddress || ''}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>Provide complete address details for deliveries</small>
                                            </div>
                                        </>
                                    )}

                                    {/* Rider vehicle info */}
                                    {isRider && (
                                        <>
                                            <div className="d-flex align-items-center gap-2 opacity-75 mt-4 p-3 rounded" style={{ backgroundColor: "#e8f5e9" }}>
                                                <i className="fa fa-motorcycle" style={{ color: "#4CAF50" }}></i>
                                                <p className="m-0 small fw-semibold" style={{ color: "#2e7d32" }}>Vehicle Information Required</p>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small fw-bold" htmlFor="plateNumber">Plate Number:</label>
                                                <input
                                                    className="mt-2 form-control small text-uppercase"
                                                    style={{ fontSize: "14px" }}
                                                    type="text"
                                                    name="plateNumber"
                                                    id="plateNumber"
                                                    placeholder="e.g., ABC 1234"
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>Enter your motorcycle/vehicle plate number</small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small fw-bold" htmlFor="plateImage">Vehicle with plate number photo:</label>
                                                {!plateImagePreview ? (
                                                    <div className="mt-2">
                                                        <label htmlFor="plateImage" className="d-flex flex-column align-items-center justify-content-center border-2 rounded p-4"
                                                            style={{ cursor: "pointer", borderStyle: "dashed", borderColor: "#4CAF50", backgroundColor: "#f9f9f9", minHeight: "150px" }}>
                                                            <i className="fa fa-camera mb-2" style={{ fontSize: "2.5rem", color: "#4CAF50" }}></i>
                                                            <p className="mb-1 fw-semibold" style={{ fontSize: "14px" }}>{isCompressing ? 'Compressing...' : 'Upload Plate Number Photo'}</p>
                                                            <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>Click to select image (JPEG, PNG, max 5MB)</p>
                                                        </label>
                                                        <input type="file" id="plateImage" name="plateImage" accept="image/jpeg,image/jpg,image/png" onChange={handlePlateImageChange} style={{ display: "none" }} disabled={isCompressing} required />
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 position-relative">
                                                        <img src={plateImagePreview} alt="Plate preview" className="w-100 rounded" style={{ maxHeight: "250px", objectFit: "cover" }} />
                                                        <button type="button" onClick={removePlateImage} className="btn btn-danger btn-sm position-absolute" style={{ top: "10px", right: "10px" }} disabled={isCompressing}>
                                                            <i className="fa fa-times"></i> Remove
                                                        </button>
                                                    </div>
                                                )}
                                                <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>Clear photo of your vehicle with plate number for verification</small>
                                            </div>

                                            <div className="mt-3">
                                                <label className="text-capitalize small fw-bold" htmlFor="licenseImage">Driver's License Photo:</label>
                                                {!licenseImagePreview ? (
                                                    <div className="mt-2">
                                                        <label htmlFor="licenseImage" className="d-flex flex-column align-items-center justify-content-center border-2 rounded p-4"
                                                            style={{ cursor: "pointer", borderStyle: "dashed", borderColor: "#4CAF50", backgroundColor: "#f9f9f9", minHeight: "150px" }}>
                                                            <i className="fa fa-id-card mb-2" style={{ fontSize: "2.5rem", color: "#4CAF50" }}></i>
                                                            <p className="mb-1 fw-semibold" style={{ fontSize: "14px" }}>{isCompressing ? 'Compressing...' : "Upload Driver's License"}</p>
                                                            <p className="text-muted small mb-0" style={{ fontSize: "12px" }}>Click to select image (JPEG, PNG, max 5MB)</p>
                                                        </label>
                                                        <input type="file" id="licenseImage" name="licenseImage" accept="image/jpeg,image/jpg,image/png" onChange={handleLicenseImageChange} style={{ display: "none" }} disabled={isCompressing} required />
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 position-relative">
                                                        <img src={licenseImagePreview} alt="License preview" className="w-100 rounded" style={{ maxHeight: "250px", objectFit: "cover" }} />
                                                        <button type="button" onClick={removeLicenseImage} className="btn btn-danger btn-sm position-absolute" style={{ top: "10px", right: "10px" }} disabled={isCompressing}>
                                                            <i className="fa fa-times"></i> Remove
                                                        </button>
                                                    </div>
                                                )}
                                                <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>Clear photo of your valid driver's license for verification</small>
                                            </div>
                                        </>
                                    )}

                                    {/* ✅ E-wallet info note (from Register.jsx) */}
                                    {needsEWallet && (
                                        <div className="d-flex align-items-center gap-2 opacity-75 mt-4">
                                            <i className="fa fa-info-circle small"></i>
                                            <p className="m-0 text-capitalize small">please provide a verified g-cash or maya account for receiving payments.</p>
                                        </div>
                                    )}

                                    {/* ✅ E-wallet fields with formatted number (from Register.jsx) */}
                                    <div className="row mt-2">
                                        <div className="col">
                                            <label className="text-capitalize small fw-bold" htmlFor="wallet_type">e-wallet type:</label>
                                            <select className="form-select mt-2 opacity-75 text-capitalize" style={{ fontSize: "14px" }} name="wallet_type" id="wallet_type" onChange={handleChange} required>
                                                <option value="">select wallet</option>
                                                {["g-cash", "maya"].map((data, i) => (
                                                    <option key={i} value={data}>{data}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col">
                                            <label className="text-capitalize small fw-bold" htmlFor="wallet_number">e-wallet number:</label>
                                            <div className="input-group mt-2">
                                                <span className="input-group-text small" style={{ fontSize: "14px" }}>+63</span>
                                                <input
                                                    className="form-control small"
                                                    style={{ fontSize: "14px" }}
                                                    type="text"
                                                    name="wallet_number"
                                                    id="wallet_number"
                                                    placeholder="9XX XXX XXXX"
                                                    value={formatPhoneNumber(formData.wallet_number || '')}
                                                    onChange={handleWalletNumberChange}
                                                    required
                                                />
                                            </div>
                                            <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>Enter 10-digit mobile number (e.g., 912 345 6789)</small>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="text-capitalize small fw-bold" htmlFor="email">Email:</label>
                                        <input className="mt-2 form-control small" style={{ fontSize: "14px" }} type="email" name="email" id="email" placeholder="Enter Email" onChange={handleChange} required />
                                        <small className="d-flex mt-1 text-muted text-capitalize" style={{ fontSize: "12px" }}>*preferred gmail account.</small>
                                    </div>

                                    <div className="mt-3">
                                        <label className="text-capitalize small fw-bold" htmlFor="password">Create Password:</label>
                                        <div className="position-relative">
                                            <input className="mt-2 form-control small" style={{ fontSize: "14px", paddingRight: "40px" }} type={showPassword ? "text" : "password"} name="password" id="password" placeholder="Enter Password" onChange={handleChange} required />
                                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6c757d" }}
                                                onClick={() => setShowPassword(!showPassword)}></i>
                                        </div>
                                        <small className="text-muted d-block mt-1" style={{ fontSize: "12px" }}>*Use 8 or more characters with a mix of uppercase, lowercase & numbers</small>
                                    </div>

                                    <div className="mt-3">
                                        <label className="text-capitalize small fw-bold" htmlFor="confirmPassword">Confirm Password:</label>
                                        <div className="position-relative">
                                            <input className="mt-2 form-control small" style={{ fontSize: "14px", paddingRight: "40px" }} type={showConfirmPassword ? "text" : "password"} name="confirmPassword" id="confirmPassword" placeholder="Re-enter Password" value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} required />
                                            <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute`}
                                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6c757d" }}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}></i>
                                        </div>
                                        {passwordError && <small className="text-danger d-block mt-1">{passwordError}</small>}
                                    </div>

                                    <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f5f5f5" }}>
                                        <p className="mb-1 text-muted small">Creating account as:</p>
                                        <p className="mb-0 fw-bold text-capitalize" style={{ color: "#4CAF50" }}>
                                            {userTypes.find(t => t.role === selectedRole)?.icon} {userTypes.find(t => t.role === selectedRole)?.title}
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <button
                                            onClick={handleForm}
                                            className="p-2 shadow-sm text-light rounded w-100 border-0 text-capitalize"
                                            style={{
                                                outline: "none",
                                                cursor: isCreatingAccount ? "not-allowed" : "pointer",
                                                background: isCreatingAccount ? "#81c784" : "#4CAF50",
                                                fontWeight: "500",
                                                opacity: isCreatingAccount ? 0.8 : 1,
                                                transition: "all 0.3s ease"
                                            }}
                                            disabled={isCompressing || isCreatingAccount}
                                        >
                                            {isCreatingAccount ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    processing...
                                                </>
                                            ) : 'create account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
        </>
    );
};

export default AddAccount;