import React from "react";
import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../modal.jsx";
import Toast from "../toastNotif.jsx";
import { appContext } from "../../context/appContext";
import philippinesAddress from "../../data/philippinesAddress.js";

const inputStyle = { fontSize: "14px" };

const formatPhoneDisplay = (digits) => {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

const ContactInput = ({ name, label, value, parentKey, onNestedChange, onDirectChange }) => {
    const normalize = (val) => val.replace(/\D/g, "").replace(/^63/, "").replace(/^0/, "").slice(0, 10);
    const [localDigits, setLocalDigits] = React.useState(() => normalize(value ?? ""));

    React.useEffect(() => {
        setLocalDigits(normalize(value ?? ""));
    }, [value]);

    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setLocalDigits(digits);
        const synth = { target: { name, value: "+63" + digits } };
        parentKey ? onNestedChange(parentKey, synth) : onDirectChange(synth);
    };

    return (
        <div className="mb-3">
            <label className="text-muted mb-1 small d-block">{label}</label>
            <div className="input-group">
                <span className="input-group-text bg-light fw-semibold">+63</span>
                <input
                    type="tel"
                    className="form-control"
                    style={inputStyle}
                    name={name}
                    value={formatPhoneDisplay(localDigits)}
                    onChange={handleChange}
                    maxLength={12}
                    placeholder="9XX XXX XXXX"
                />
            </div>
            <small className="text-muted">Enter 10-digit mobile number (e.g., 912 345 6789)</small>
        </div>
    );
};

const EditableField = ({
    label, name, value, parentKey, type = "text",
    lowercase, uppercase, capitalize,
    isEditMode, editForm, handleNestedChange, handleEditChange
}) => {
    if (!isEditMode) {
        return (
            <div className="mb-3">
                <p className="text-muted mb-1 small">{label}</p>
                <p className={`m-0 ${lowercase ? "text-lowercase" : ""} ${uppercase ? "text-uppercase" : ""} ${capitalize ? "text-capitalize" : ""}`}>
                    {value || "N/A"}
                </p>
            </div>
        );
    }

    const isEmail   = type === "email" || name === "email";
    const isName    = name === "firstname" || name === "lastname" || name === "middlename";
    const isContact = name === "contact" || name === "number";
    const currentVal = parentKey ? (editForm[parentKey]?.[name] ?? "") : (editForm[name] ?? "");

    const handleNameChange = (e) => {
        const val   = e.target.value.replace(/[^a-zA-Z\s\-']/g, "");
        const synth = { target: { name, value: val } };
        parentKey ? handleNestedChange(parentKey, synth) : handleEditChange(synth);
    };

    if (isContact) {
        return (
            <ContactInput
                name={name}
                label={label}
                value={currentVal}
                parentKey={parentKey}
                onNestedChange={handleNestedChange}
                onDirectChange={handleEditChange}
            />
        );
    }

    return (
        <div className="mb-3">
            <label className="text-muted mb-1 small d-block">{label}</label>
            <input
                type={type}
                className={`form-control ${isEmail ? "" : "text-capitalize"}`}
                style={inputStyle}
                name={name}
                value={currentVal}
                onChange={
                    isName
                        ? handleNameChange
                        : parentKey
                            ? (e) => handleNestedChange(parentKey, e)
                            : handleEditChange
                }
            />
        </div>
    );
};

const ViewProfile = () => {

    const {
        role,
        showToast,
        toastMessage,
        toastType,
        setShowToast,
        showNotification,
        setLoadingStateButton
    } = useContext(appContext);

    const location  = useLocation();
    const navigate  = useNavigate();
    const accountId = location?.state?.accountId;
    const source    = location?.state?.source;

    const [profile, setProfile]                   = useState(null);
    const [accountType, setAccountType]           = useState(null);
    const [loading, setLoading]                   = useState(true);
    const [error, setError]                       = useState(null);
    const [showImageModal, setShowImageModal]     = useState(false);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [showActionModal, setShowActionModal]   = useState(false);
    const [selectedAction, setSelectedAction]     = useState(null);

    const [isEditMode, setIsEditMode]       = useState(false);
    const [editForm, setEditForm]           = useState({});
    const [isSaving, setIsSaving]           = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const [availableCities, setAvailableCities]       = useState([]);
    const [availableBarangays, setAvailableBarangays] = useState([]);

    const [newPlateImage, setNewPlateImage]     = useState(null);
    const [newLicenseImage, setNewLicenseImage] = useState(null);
    const [platePreview, setPlatePreview]       = useState(null);
    const [licensePreview, setLicensePreview]   = useState(null);

    useEffect(() => {
        if (accountId) fetchViewProfile();
    }, [accountId]);

    const fetchViewProfile = async () => {
        try {
            setLoading(true);
            const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/viewProfile/${accountId}`, {
                method: "GET", credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setProfile(data.profile);
            setAccountType(data.accountType);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (action) => {
        setSelectedAction(action);
        setShowActionModal(true);
    };

    const handleVerificationAction = async () => {
        try {
            setLoadingStateButton(true);
            const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/updateVerification/${accountId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ verification: selectedAction === "approve" ? "verified" : "rejected" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowActionModal(false);
            await fetchViewProfile();
            showNotification(data.message, "success");
        } catch (err) {
            showNotification(err.message, "error");
        } finally {
            setLoadingStateButton(false);
        }
    };

    const getAddressKey = () => {
        if (source === "user")   return "billingAddress";
        if (source === "seller") return "sellerAddress";
        if (source === "rider")  return "riderAddress";
        if (source === "admin")  return "adminAddress";  // ✅ ADDED
        return null;
    };

    const handleEnableEdit = () => {
        setEditForm({ ...profile });
        const addrKey = getAddressKey();

        if (addrKey) {
            const addrData = profile[addrKey] ?? {};
            const provData = philippinesAddress[addrData.province];
            if (provData?.cities) {
                setAvailableCities(Object.keys(provData.cities));
                const cityData = provData.cities[addrData.city];
                if (cityData?.barangays) setAvailableBarangays(cityData.barangays);
            }
        }
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditForm({});
        setAvailableCities([]);
        setAvailableBarangays([]);
        setNewPlateImage(null);
        setNewLicenseImage(null);
        setPlatePreview(null);
        setLicensePreview(null);
        setIsEditMode(false);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (parentKey, e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [parentKey]: { ...prev[parentKey], [name]: value }
        }));
    };

    const handleLocationChange = (addrKey, e) => {
        const { name, value } = e.target;

        if (name === "province") {
            setEditForm(prev => ({
                ...prev,
                [addrKey]: { ...prev[addrKey], province: value, city: "", barangay: "", zipCode: "" }
            }));
            const provData = philippinesAddress[value];
            setAvailableCities(provData?.cities ? Object.keys(provData.cities) : []);
            setAvailableBarangays([]);

        } else if (name === "city") {
            const province = editForm[addrKey]?.province;
            const cityData = philippinesAddress[province]?.cities?.[value];
            setEditForm(prev => ({
                ...prev,
                [addrKey]: { ...prev[addrKey], city: value, barangay: "", zipCode: cityData?.zipCode || "" }
            }));
            setAvailableBarangays(cityData?.barangays || []);

        } else if (name === "barangay") {
            setEditForm(prev => ({
                ...prev,
                [addrKey]: { ...prev[addrKey], barangay: value }
            }));
        }
    };

    const handleImageChange = (field, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowed.includes(file.type)) {
            showNotification("Only PNG and JPG files are allowed.", "error");
            e.target.value = "";
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (field === "imagePlateNumber") {
            setNewPlateImage(file);
            setPlatePreview(previewUrl);
        } else if (field === "licenseImage") {
            setNewLicenseImage(file);
            setLicensePreview(previewUrl);
        }
    };

    const handleRemoveNewImage = (field) => {
        if (field === "imagePlateNumber") {
            setNewPlateImage(null);
            setPlatePreview(null);
        } else if (field === "licenseImage") {
            setNewLicenseImage(null);
            setLicensePreview(null);
        }
    };

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true);
            setLoadingStateButton(true);

            const normalizePhone = (val) => {
                if (!val) return val;
                return val.replace(/^\+63/, "0").replace(/\s/g, "");
            };

            const normalizedForm = {
                ...editForm,
                ...(editForm.contact && { contact: normalizePhone(editForm.contact) }),
                ...(editForm.billingAddress?.contact && {
                    billingAddress: {
                        ...editForm.billingAddress,
                        contact: normalizePhone(editForm.billingAddress.contact)
                    }
                }),
                ...(editForm.e_WalletAcc?.number && {
                    e_WalletAcc: {
                        ...editForm.e_WalletAcc,
                        number: normalizePhone(editForm.e_WalletAcc.number)
                    }
                }),
            };

            const formData = new FormData();
            formData.append("source", accountType || source);
            formData.append("profileData", JSON.stringify(normalizedForm));
            if (newPlateImage)   formData.append("imagePlateNumber", newPlateImage);
            if (newLicenseImage) formData.append("licenseImage", newLicenseImage);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updateProfile/${accountId}`, {
                method: "PUT",
                credentials: "include",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowSaveModal(false);
            setIsEditMode(false);
            setEditForm({});
            setAvailableCities([]);
            setAvailableBarangays([]);
            setNewPlateImage(null);
            setNewLicenseImage(null);
            setPlatePreview(null);
            setLicensePreview(null);
            await fetchViewProfile();
            showNotification(data.message || "Profile updated successfully.", "success");
        } catch (err) {
            setShowSaveModal(false);
            showNotification(err.message, "error");
        } finally {
            setIsSaving(false);
            setLoadingStateButton(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date   = new Date(dateString);
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let hours    = date.getHours();
        const ampm   = hours >= 12 ? "PM" : "AM";
        hours        = hours % 12 || 12;
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hours}:${date.getMinutes().toString().padStart(2,"0")} ${ampm}`;
    };

    const getVerificationBadge = (v) =>
        ({ verified: "bg-success", pending: "bg-warning", rejected: "bg-danger" }[v] || "bg-secondary");

    const InfoRow = ({ label, value, lowercase, uppercase, capitalize }) => (
        <div className="mb-3">
            <p className="text-muted mb-1 small">{label}</p>
            <p className={`m-0 ${lowercase ? "text-lowercase" : ""} ${uppercase ? "text-uppercase" : ""} ${capitalize ? "text-capitalize" : ""}`}>
                {value || "N/A"}
            </p>
        </div>
    );

    const ReadOnlyField = ({ label, value, children }) => (
        <div className="mb-3">
            <p className="text-muted mb-1 small">{label}</p>
            {children ?? <p className="m-0">{value || "N/A"}</p>}
        </div>
    );

    const editableProps = { isEditMode, editForm, handleNestedChange, handleEditChange };

    const ImageThumbnail = ({ src, filename, onView }) => (
        <div>
            <div className="w-100 border rounded shadow-sm p-2"
                style={{ maxWidth: "200px", cursor: "pointer" }}
                onClick={onView}
            >
                <div className="d-flex align-items-center gap-2">
                    <div className="border shadow-sm rounded"
                        style={{ width: "45px", height: "45px", overflow: "hidden", flexShrink: 0 }}
                    >
                        <img src={src} alt={filename} className="h-100 w-100" style={{ objectFit: "cover" }} />
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <p className="m-0 fw-bold text-truncate" style={{ fontSize: "0.75rem" }}>{filename}</p>
                        <p className="m-0 text-muted" style={{ fontSize: "0.65rem" }}>Image</p>
                    </div>
                </div>
            </div>
            <small className="text-muted d-block mt-1" style={{ fontSize: "0.7rem" }}>
                <i className="fa fa-info-circle me-1"></i>Click to view full size
            </small>
        </div>
    );

    const renderAddressFields = (addrKey) => {
        const sourceAddr = profile?.[addrKey] ?? {};

        if (!isEditMode) {
            return (
                <>
                    <div className="col-md-4"><InfoRow label="Province" value={sourceAddr.province} capitalize /></div>
                    <div className="col-md-4"><InfoRow label="City"     value={sourceAddr.city}     capitalize /></div>
                    <div className="col-md-4"><InfoRow label="Barangay" value={sourceAddr.barangay} capitalize /></div>
                    <div className="col-md-6"><InfoRow label="Zip Code" value={sourceAddr.zipCode} /></div>
                    <div className="col-12">  <InfoRow label="Detailed Address" value={sourceAddr.detailAddress} capitalize /></div>
                </>
            );
        }

        const addrData = editForm[addrKey] ?? {};

        return (
            <>
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="text-muted mb-1 small d-block">Province</label>
                        <select name="province" className="form-select form-select-sm text-capitalize"
                            style={inputStyle} value={addrData.province || ""}
                            onChange={(e) => handleLocationChange(addrKey, e)}
                        >
                            <option value="">Select Province</option>
                            {Object.keys(philippinesAddress).map((p) => (
                                <option key={p} value={p} className="text-capitalize">{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="text-muted mb-1 small d-block">City</label>
                        <select name="city" className="form-select form-select-sm text-capitalize"
                            style={inputStyle} value={addrData.city || ""}
                            onChange={(e) => handleLocationChange(addrKey, e)}
                            disabled={!addrData.province}
                        >
                            <option value="">Select City</option>
                            {availableCities.map((c) => (
                                <option key={c} value={c} className="text-capitalize">{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="text-muted mb-1 small d-block">Barangay</label>
                        <select name="barangay" className="form-select form-select-sm text-capitalize"
                            style={inputStyle} value={addrData.barangay || ""}
                            onChange={(e) => handleLocationChange(addrKey, e)}
                            disabled={!addrData.city}
                        >
                            <option value="">Select Barangay</option>
                            {availableBarangays.map((b) => (
                                <option key={b} value={b} className="text-capitalize">{b}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="text-muted mb-1 small d-block">Zip Code</label>
                        <input type="text" className="form-control" style={inputStyle}
                            name="zipCode" value={addrData.zipCode || ""} readOnly />
                    </div>
                </div>
                <div className="col-12">
                    <div className="mb-3">
                        <label className="text-muted mb-1 small d-block">Detailed Address</label>
                        <input type="text" className="form-control text-capitalize" style={inputStyle}
                            name="detailAddress" value={addrData.detailAddress || ""}
                            onChange={(e) => handleNestedChange(addrKey, e)} />
                    </div>
                </div>
            </>
        );
    };

    if (loading) {
        return (
            <div className="p-3">
                <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-3">
                <div className="bg-white rounded shadow-sm border p-5 text-center">
                    <i className="fa fa-exclamation-triangle text-danger mb-3" style={{ fontSize: "48px" }}></i>
                    <h5 className="text-danger mb-3">Error Loading Profile</h5>
                    <p className="text-muted mb-4">{error || "Profile not found"}</p>
                    <button className="btn btn-success" onClick={() => navigate(-1)}>
                        <i className="fa fa-arrow-left me-2"></i>Go Back
                    </button>
                </div>
            </div>
        );
    }

    const SectionTitle = ({ icon, title }) => (
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className={`${icon} text-success`}></i>
            <h6 className="m-0 fw-semibold text-success">{title}</h6>
        </div>
    );

    const ImageModal = () => showImageModal ? (
        <div className="modal fade show d-block" tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowImageModal(false)}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content bg-transparent border-0">
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close btn-close-white ms-auto"
                            onClick={() => setShowImageModal(false)} />
                    </div>
                    <div className="modal-body text-center p-0">
                        <img src={showImageModal} alt="Plate Number"
                            className="img-fluid rounded"
                            style={{ maxHeight: "80vh", width: "auto" }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    const LicenseModal = () => showLicenseModal ? (
        <div className="modal fade show d-block" tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowLicenseModal(false)}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content bg-transparent border-0">
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close btn-close-white ms-auto"
                            onClick={() => setShowLicenseModal(false)} />
                    </div>
                    <div className="modal-body text-center p-0">
                        <img src={showLicenseModal} alt="Driver's License"
                            className="img-fluid rounded"
                            style={{ maxHeight: "80vh", width: "auto" }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    // ─── User ─────────────────────────────────────────────────────────
    const renderUserProfile = () => (
        <>
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-user" title="Basic Information" />
                <div className="row g-3">
                    <div className="col-md-6"><ReadOnlyField label="Account ID" value={profile.accountId} /></div>
                    <div className="col-md-6"><ReadOnlyField label="Created At" value={formatDate(profile.createdAt)} /></div>
                    <div className="col-md-6"><EditableField label="First Name"  name="firstname"  value={profile.firstname}  capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Last Name"   name="lastname"   value={profile.lastname}   capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Middle Name" name="middlename" value={profile.middlename} capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Suffix"      name="suffix"     value={profile.suffix}     capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Email"       name="email"      value={profile.email}      type="email" lowercase {...editableProps} /></div>
                </div>
            </div>

            {profile.billingAddress && Object.values(profile.billingAddress).some(Boolean) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Billing Address" />
                    <div className="row g-3">
                        <div className="col-md-6"><EditableField label="First Name" name="firstname" value={profile.billingAddress.firstname} parentKey="billingAddress" capitalize {...editableProps} /></div>
                        <div className="col-md-6"><EditableField label="Last Name"  name="lastname"  value={profile.billingAddress.lastname}  parentKey="billingAddress" capitalize {...editableProps} /></div>
                        <div className="col-md-6"><EditableField label="Email"      name="email"     value={profile.billingAddress.email}     parentKey="billingAddress" type="email" lowercase {...editableProps} /></div>
                        <div className="col-md-6"><EditableField label="Contact"    name="contact"   value={profile.billingAddress.contact}   parentKey="billingAddress" {...editableProps} /></div>
                        {renderAddressFields("billingAddress")}
                    </div>
                </div>
            )}
        </>
    );

    // ─── Seller ───────────────────────────────────────────────────────
    const renderSellerProfile = () => (
        <>
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-store" title="Farmer Information" />
                <div className="row g-3">
                    <div className="col-md-6"><ReadOnlyField label="Account ID" value={profile.accountId} /></div>
                    <div className="col-md-6">
                        <ReadOnlyField label="Verification Status">
                            <span className={`badge ${getVerificationBadge(profile.verification)}`}>
                                {(profile.verification ?? "pending").toUpperCase()}
                            </span>
                        </ReadOnlyField>
                    </div>
                    <div className="col-md-6"><EditableField label="First Name"  name="firstname"  value={profile.firstname}  capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Last Name"   name="lastname"   value={profile.lastname}   capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Middle Name" name="middlename" value={profile.middlename} capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Suffix"      name="suffix"     value={profile.suffix}     capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Email"       name="email"      value={profile.email}      type="email" lowercase {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Contact"     name="contact"    value={profile.contact}    {...editableProps} /></div>
                    <div className="col-md-6"><ReadOnlyField label="Created At"  value={formatDate(profile.createdAt)} /></div>
                </div>
            </div>

            {profile.e_WalletAcc && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-wallet" title="E-Wallet Account" />
                    <div className="row g-3">
                        <div className="col-md-6">
                            {isEditMode ? (
                                <div className="mb-3">
                                    <label className="text-muted mb-1 small d-block">Wallet Type</label>
                                    <select className="form-select text-capitalize" style={inputStyle}
                                        name="type" value={editForm?.e_WalletAcc?.type || ""}
                                        onChange={(e) => handleNestedChange("e_WalletAcc", e)}
                                    >
                                        <option value="" hidden>Select wallet</option>
                                        {["g-cash", "maya"].map((w) => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <InfoRow label="Wallet Type" value={profile.e_WalletAcc.type} uppercase />
                            )}
                        </div>
                        <div className="col-md-6">
                            <EditableField label="Account Number" name="number" value={profile.e_WalletAcc.number} parentKey="e_WalletAcc" {...editableProps} />
                        </div>
                    </div>
                </div>
            )}

            {profile.sellerAddress && Object.values(profile.sellerAddress).some(Boolean) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Business Address" />
                    <div className="row g-3">
                        {renderAddressFields("sellerAddress")}
                    </div>
                </div>
            )}
        </>
    );

    // ─── Rider ────────────────────────────────────────────────────────
    const renderRiderProfile = () => (
        <>
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-bicycle" title="Rider Information" />
                <div className="row g-3">
                    <div className="col-md-6"><ReadOnlyField label="Account ID" value={profile.accountId} /></div>
                    <div className="col-md-6">
                        <ReadOnlyField label="Verification Status">
                            <span className={`badge ${getVerificationBadge(profile.verification)}`}>
                                {(profile.verification ?? "pending").toUpperCase()}
                            </span>
                        </ReadOnlyField>
                    </div>
                    <div className="col-md-6"><EditableField label="First Name"  name="firstname"  value={profile.firstname}  capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Last Name"   name="lastname"   value={profile.lastname}   capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Middle Name" name="middlename" value={profile.middlename} capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Suffix"      name="suffix"     value={profile.suffix}     capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Email"       name="email"      value={profile.email}      type="email" lowercase {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Contact"     name="contact"    value={profile.contact}    {...editableProps} /></div>
                    <div className="col-md-6">
                        <ReadOnlyField label="Delivery Status">
                            <span className={`badge ${profile.status === "available" ? "bg-success" : profile.status === "on delivery" ? "bg-primary" : "bg-secondary"}`}>
                                {(profile.status ?? "offline").toUpperCase()}
                            </span>
                        </ReadOnlyField>
                    </div>
                    <div className="col-md-6"><ReadOnlyField label="Created At" value={formatDate(profile.createdAt)} /></div>
                </div>
            </div>

            {profile.riderAddress && Object.values(profile.riderAddress).some(Boolean) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Rider Address" />
                    <div className="row g-3">
                        {renderAddressFields("riderAddress")}
                    </div>
                </div>
            )}

            {profile.e_WalletAcc && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-wallet" title="E-Wallet Account" />
                    <div className="row g-3">
                        <div className="col-md-6">
                            {isEditMode ? (
                                <div className="mb-3">
                                    <label className="text-muted mb-1 small d-block">Wallet Type</label>
                                    <select className="form-select text-capitalize" style={inputStyle}
                                        name="type" value={editForm?.e_WalletAcc?.type || ""}
                                        onChange={(e) => handleNestedChange("e_WalletAcc", e)}
                                    >
                                        <option value="" hidden>Select wallet</option>
                                        {["g-cash", "maya"].map((w) => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <InfoRow label="Wallet Type" value={profile.e_WalletAcc.type} uppercase />
                            )}
                        </div>
                        <div className="col-md-6">
                            <EditableField label="Account Number" name="number" value={profile.e_WalletAcc.number} parentKey="e_WalletAcc" {...editableProps} />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-motorcycle" title="Vehicle Information" />
                <div className="row g-3">
                    <div className="col-md-6">
                        <EditableField label="Plate Number" name="plateNumber" value={profile.plateNumber} uppercase {...editableProps} />
                    </div>

                    <div className="col-12">
                        <p className="text-muted mb-2 small">Plate Number Image</p>
                        <div className="d-flex flex-wrap gap-3 align-items-start">
                            {profile.imagePlateNumber && !platePreview && (
                                <ImageThumbnail
                                    src={profile.imagePlateNumber}
                                    filename={profile.imagePlateNumber.split("/").pop() || "plate_image.jpg"}
                                    onView={() => setShowImageModal(profile.imagePlateNumber)}
                                />
                            )}
                            {isEditMode && platePreview && (
                                <ImageThumbnail
                                    src={platePreview}
                                    filename={newPlateImage?.name || "new_plate.jpg"}
                                    onView={() => setShowImageModal(platePreview)}
                                />
                            )}
                        </div>
                        {isEditMode && (
                            <div className="mt-2">
                                <label className="btn btn-outline-secondary btn-sm me-2" style={{ cursor: "pointer" }}>
                                    <i className="fa fa-upload me-1"></i>
                                    {profile.imagePlateNumber ? "Replace Image" : "Upload Image"}
                                    <input type="file" accept="image/png, image/jpeg, image/jpg" className="d-none"
                                        onChange={(e) => handleImageChange("imagePlateNumber", e)} />
                                </label>
                                {platePreview && (
                                    <button type="button" className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleRemoveNewImage("imagePlateNumber")}
                                    >
                                        <i className="fa fa-times me-1"></i>Remove
                                    </button>
                                )}
                                <small className="text-muted d-block mt-1" style={{ fontSize: "0.7rem" }}>
                                    Accepted: PNG, JPG only
                                </small>
                            </div>
                        )}
                    </div>

                    <div className="col-12">
                        <p className="text-muted mb-2 small">Driver's License Image</p>
                        <div className="d-flex flex-wrap gap-3 align-items-start">
                            {profile.licenseImage && !licensePreview && (
                                <ImageThumbnail
                                    src={profile.licenseImage}
                                    filename={profile.licenseImage.split("/").pop() || "license_image.jpg"}
                                    onView={() => setShowLicenseModal(profile.licenseImage)}
                                />
                            )}
                            {isEditMode && licensePreview && (
                                <ImageThumbnail
                                    src={licensePreview}
                                    filename={newLicenseImage?.name || "new_license.jpg"}
                                    onView={() => setShowLicenseModal(licensePreview)}
                                />
                            )}
                        </div>
                        {isEditMode && (
                            <div className="mt-2">
                                <label className="btn btn-outline-secondary btn-sm me-2" style={{ cursor: "pointer" }}>
                                    <i className="fa fa-upload me-1"></i>
                                    {profile.licenseImage ? "Replace Image" : "Upload Image"}
                                    <input type="file" accept="image/png, image/jpeg, image/jpg" className="d-none"
                                        onChange={(e) => handleImageChange("licenseImage", e)} />
                                </label>
                                {licensePreview && (
                                    <button type="button" className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleRemoveNewImage("licenseImage")}
                                    >
                                        <i className="fa fa-times me-1"></i>Remove
                                    </button>
                                )}
                                <small className="text-muted d-block mt-1" style={{ fontSize: "0.7rem" }}>
                                    Accepted: PNG, JPG only
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    // ─── Admin ────────────────────────────────────────────────────────
    const renderAdminProfile = () => (
        <>
            <div className="bg-white rounded shadow-sm border p-4 mb-3">
                <SectionTitle icon="fa fa-user-shield" title="Admin Information" />
                <div className="row g-3">
                    <div className="col-md-6"><ReadOnlyField label="Account ID" value={profile.accountId} /></div>
                    <div className="col-md-6">
                        <ReadOnlyField label="Admin Type">
                            <span className={`badge ${profile.adminType === "main" ? "bg-success" : "bg-secondary"}`}>
                                {(profile.adminType ?? "sub").toUpperCase()}
                            </span>
                        </ReadOnlyField>
                    </div>
                    <div className="col-md-6"><EditableField label="First Name"  name="firstname"  value={profile.firstname}  capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Last Name"   name="lastname"   value={profile.lastname}   capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Middle Name" name="middlename" value={profile.middlename} capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Suffix"      name="suffix"     value={profile.suffix}     capitalize {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Email"       name="email"      value={profile.email}      type="email" lowercase {...editableProps} /></div>
                    <div className="col-md-6"><EditableField label="Contact"     name="contact"    value={profile.contact}    {...editableProps} /></div>
                    <div className="col-md-6"><ReadOnlyField label="Created At"  value={formatDate(profile.createdAt)} /></div>
                </div>
            </div>

            {/* ✅ Admin Address Section */}
            {profile.adminAddress && Object.values(profile.adminAddress).some(Boolean) && (
                <div className="bg-white rounded shadow-sm border p-4 mb-3">
                    <SectionTitle icon="fa fa-map-marker-alt" title="Address Information" />
                    <div className="row g-3">
                        {renderAddressFields("adminAddress")}
                    </div>
                </div>
            )}
        </>
    );

    // ─── Offline Farmer ───────────────────────────────────────────────
    const renderOfflineFarmerProfile = () => (
        <div className="bg-white rounded shadow-sm border p-4 mb-3">
            <SectionTitle icon="fa fa-user" title="Offline Farmer Information" />
            <div className="row g-3">
                <div className="col-md-6"><ReadOnlyField label="Account ID" value={profile.accountId} /></div>
                <div className="col-md-6">
                    <ReadOnlyField label="Verification Status">
                        <span className="badge bg-success">VERIFIED</span>
                    </ReadOnlyField>
                </div>
                <div className="col-md-6">
                    <EditableField label="First Name" name="firstname" value={profile.firstname} capitalize {...editableProps} />
                </div>
                <div className="col-md-6">
                    <EditableField label="Last Name" name="lastname" value={profile.lastname} capitalize {...editableProps} />
                </div>
                <div className="col-md-6">
                    <EditableField label="Middle Name" name="middlename" value={profile.middlename} capitalize {...editableProps} />
                </div>
                <div className="col-md-6">
                    <ReadOnlyField label="Suffix" value={profile.suffix && profile.suffix !== "N/A" ? profile.suffix : "—"} />
                </div>
                <div className="col-md-6">
                    <EditableField label="Contact" name="contact" value={profile.contact} {...editableProps} />
                </div>
                <div className="col-md-6">
                    <ReadOnlyField label="Created At" value={formatDate(profile.createdAt)} />
                </div>
                <div className="col-12">
                    <ReadOnlyField label="Device">
                        <span className="badge bg-secondary">No Device</span>
                    </ReadOnlyField>
                </div>
            </div>
        </div>
    );

    const resolvedType = accountType || source;

    const profileLabel = {
        user:          "Buyer",
        seller:        "Farmer",
        rider:         "Rider",
        admin:         "Admin",
        offlineFarmer: "Offline Farmer",
    }[resolvedType] || "Profile";

    const canEdit = true;

    return (
        <>
        <div className="p-3">
            <div className="bg-white rounded shadow-sm border mb-3 p-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-outline-success"
                            onClick={() => isEditMode ? handleCancelEdit() : navigate(-1)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>

                        {profile.imageFile ? (
                            <img src={profile.imageFile} alt="Profile"
                                className="rounded-circle border-dark border border-opacity-25"
                                style={{ width: "60px", height: "60px", objectFit: "cover" }}
                            />
                        ) : (
                            <div className="bg-success rounded-circle border border-white d-flex align-items-center justify-content-center text-uppercase text-white fs-2"
                                style={{ width: "60px", height: "60px" }}
                            >
                                {profile.firstname?.charAt(0) || profile.email?.charAt(0)}
                            </div>
                        )}

                        <div>
                            <h5 className="m-0 fw-bold">{profileLabel} Profile</h5>
                            <p className="m-0 small text-muted">
                                {isEditMode
                                    ? <span className="text-muted"><i className="fa fa-pencil me-1 small"></i>Edit Mode</span>
                                    : "View account information"
                                }
                            </p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        {!isEditMode &&
                        (source === "seller" || source === "rider") &&
                        resolvedType !== "offlineFarmer" &&
                        profile.verification === "pending" && (
                            <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm" onClick={() => openActionModal("approve")}>
                                    <i className="fa fa-check me-2"></i>Approve
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => openActionModal("reject")}>
                                    <i className="fa fa-times me-2"></i>Reject
                                </button>
                            </div>
                        )}

                        {canEdit && (
                            !isEditMode ? (
                                <button className="btn btn-dark btn-sm" onClick={handleEnableEdit}>
                                    <i className="fa fa-pencil me-2"></i>Edit Profile
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <button className="btn btn-success btn-sm" onClick={() => setShowSaveModal(true)} disabled={isSaving}>
                                        <i className="fa fa-save me-2"></i>Save Changes
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelEdit} disabled={isSaving}>
                                        <i className="fa fa-times me-2"></i>Cancel
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {resolvedType === "user"          && renderUserProfile()}
            {resolvedType === "seller"        && renderSellerProfile()}
            {resolvedType === "rider"         && renderRiderProfile()}
            {resolvedType === "admin"         && renderAdminProfile()}
            {resolvedType === "offlineFarmer" && renderOfflineFarmerProfile()}

            <ImageModal />
            <LicenseModal />
        </div>

        {showActionModal && (
            <Modal
                textModal={selectedAction === "approve" ? "Do you want to approve this account?" : "Do you want to reject this account?"}
                loadingText="processing..."
                handleClickYes={handleVerificationAction}
                handleClickNo={() => setShowActionModal(false)}
            />
        )}

        {showSaveModal && (
            <Modal
                textModal="Are you sure you want to save these changes?"
                loadingText="Saving..."
                handleClickYes={handleSaveEdit}
                handleClickNo={() => setShowSaveModal(false)}
            />
        )}

        <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
        </>
    );
};

export default ViewProfile;