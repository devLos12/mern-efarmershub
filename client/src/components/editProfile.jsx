import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";
import philippineLocations from "../data/philippinesAddress.json";
import img from "../assets/images/home_bg.png";
import imageCompression from 'browser-image-compression';
import Toast from "./toastNotif";



const EditProfile = () => {
    
    const { role, 
            showToast,
            toastMessage,
            toastType,
            showNotification,
            setShowToast,

    } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({});
    const [imgPreview, setImgPreview] = useState(null);
    const [isChanged, setIsChanged] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Location dropdown states
    const [availableCities, setAvailableCities] = useState([]);
    const [availableBarangays, setAvailableBarangays] = useState([]);
    const [imagePrev, setImagePrev] = useState("");
    const fileUploadRef = useRef(null);


    let context = null;
    
    if(role === "admin"){
        context = admin;
    } else if(role === "seller") {
        context = seller;
    } else {
        context = user;
    }

    const { sellerInfo, userData, setTrigger } = context;

    let dataProfile = {
        firstname: "",
        lastname: ""
    }

    const fallBack = "n/a";

    if(role === "admin"){
        
    } else if(role === "seller"){
        dataProfile = {
            image: sellerInfo?.imageFile,
            firstname: sellerInfo?.firstname ?? fallBack,
            lastname: sellerInfo?.lastname ?? fallBack,
            email: sellerInfo?.email ?? fallBack,
            
            e_WalletAcc: { 
                type: sellerInfo?.e_WalletAcc?.type ?? fallBack, 
                number: sellerInfo?.e_WalletAcc?.number ?? fallBack
            },
            province: sellerInfo?.sellerAddress?.province ?? fallBack,
            city: sellerInfo?.sellerAddress?.city ?? fallBack,
            barangay: sellerInfo?.sellerAddress?.barangay ?? fallBack,
            zipcode: sellerInfo?.sellerAddress?.zipCode ?? fallBack,
            detailAddress: sellerInfo?.sellerAddress?.detailAddress ?? fallBack
        }

    } else {

        dataProfile = {
            image: userData?.imageFile,
            firstname: userData?.firstname ?? fallBack,
            lastname: userData?.lastname ?? fallBack,
            email: userData?.email ?? fallBack,
            contact: userData?.billingAddress?.contact ?? fallBack,
            province: userData?.billingAddress?.province ?? fallBack,
            city: userData?.billingAddress?.city ?? fallBack,
            barangay: userData?.billingAddress?.barangay ?? fallBack,
            zipcode: userData?.billingAddress?.zipCode ?? fallBack,
            detailAddress: userData?.billingAddress?.detailAddress ?? fallBack
        }
    }

    useEffect(()=>{
        setFormData(dataProfile);
        setOriginalData(dataProfile);
        setImagePrev(dataProfile?.image);

        // Set initial cities and barangays based on prefilled data
        if (dataProfile.province && dataProfile.province !== fallBack) {
            const provinceData = philippineLocations[dataProfile.province];
            if (provinceData && provinceData.cities) {
                const cities = Object.keys(provinceData.cities);
                setAvailableCities(cities);
                
                if (dataProfile.city && dataProfile.city !== fallBack) {
                    const cityData = provinceData.cities[dataProfile.city];
                    if (cityData && cityData.barangays) {
                        setAvailableBarangays(cityData.barangays);
                    }
                    
                    if (cityData && cityData.zipCode && !dataProfile.zipcode) {
                        setFormData(prev => ({
                            ...prev,
                            zipcode: cityData.zipCode
                        }));
                    }
                }
            }
        }
    }, []);  

    useEffect(()=> {
        setIsChanged(JSON.stringify(formData) !== JSON.stringify(originalData));
    }, [formData, originalData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        // Sanitize text inputs - allow only letters and spaces
        if (name === 'firstname' || name === 'lastname' || name === 'detailAddress') {
            sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        // Contact number - only digits, max 11 digits
        if (name === 'contact') {
            sanitizedValue = value.replace(/\D/g, '').slice(0, 11);
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: sanitizedValue
        }));
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'province') {
            setFormData(prevData => ({
                ...prevData,
                province: value,
                city: '',
                barangay: '',
                zipcode: ''
            }));
            
            const provinceData = philippineLocations[value];
            if (provinceData && provinceData.cities) {
                setAvailableCities(Object.keys(provinceData.cities));
            } else {
                setAvailableCities([]);
            }
            setAvailableBarangays([]);
            
        } else if (name === 'city') {
            const provinceData = philippineLocations[formData.province];
            const cityData = provinceData?.cities?.[value];
            
            setFormData(prevData => ({
                ...prevData,
                city: value,
                barangay: '',
                zipcode: cityData?.zipCode || ''
            }));
            
            if (cityData && cityData.barangays) {
                setAvailableBarangays(cityData.barangays);
            } else {
                setAvailableBarangays([]);
            }
            
        } else if (name === 'barangay') {
            setFormData(prevData => ({
                ...prevData,
                barangay: value
            }));
        }
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        setIsSubmitting(true);

        const sendData = new FormData();
        
        // Compress image if it's a file object (newly uploaded)
        if (formData.image instanceof File) {
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                const compressedFile = await imageCompression(formData.image, options);
                sendData.append('image', compressedFile);
            } catch (error) {
                console.log("Image compression error:", error);
                sendData.append('image', formData.image);
            }
        } else {
            sendData.append('image', formData.image);
        }
        
        sendData.append('firstname', formData.firstname);
        sendData.append('lastname',  formData.lastname);
        sendData.append('email', formData.email);

        if(role === "seller" ){
            sendData.append('wallet_number', formData?.e_WalletAcc?.number);
            sendData.append('wallet_type',  formData?.e_WalletAcc?.type);
        } else {
            sendData.append('contact', formData.contact);
        }

        sendData.append('province', formData.province);
        sendData.append('city', formData.city);
        sendData.append('barangay', formData.barangay); 
        sendData.append('zipCode', formData.zipcode);
        sendData.append('detailAddress', formData.detailAddress);

        const endPoint = role === "user" 
        ? "userUpdateProfile" 
        : "sellerUpdateProfile"
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: "PATCH",
                body: sendData,
                credentials: "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            showNotification(data.message, 'success');
            
            // // Success - trigger refresh and navigate back
            setTrigger((prev) => !prev);

                  // Navigate after short delay
            setTimeout(() => {
                navigate(-1);
            }, 1500);

        } catch (error) {
            showNotification(error.message || 'Something went wrong', 'error');
            console.log("Error: ", error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleFile = (e) =>{
        const {name} = e.target;

        setFormData((prev) => ({
            ...prev, 
            [name]: e.target.files[0]
        }));
        
        const file = e.target.files[0];

        if(file){
            const reader = new FileReader();
            reader.onload = (e) =>{
                setImgPreview(e.target.result);
            }
            reader.readAsDataURL(file);
        }
    }

    const handleFileRemove = (e) => {
        setImgPreview(null);
        setFormData((prev) => ({
            ...prev, image: imagePrev
        }))

        if(fileUploadRef.current){
            fileUploadRef.current.value = null;
        }
    }

    return (
        <>
        <div className={`${role === "seller" ? "min-vh-100 d-flex" : "min-vh-100 d-flex bg"}`}>
            <div className={`${role === "seller" ? "container-fluid bg-white mx-md-2" : "container bg-white"}`}>
                <div className={`row justify-content-center ${role === "seller" ? "py-3" : "py-5"}`}>
                    
                    <div className={role === "seller" ? "col-12 col-md-10 col-lg-11 " : "col-12 col-lg-11"}>
                        {/* Header */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <button 
                                className="btn btn-outline-success"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fa fa-arrow-left"></i>
                            </button>
                            <div>
                                <h5 className="m-0 fw-bold text-capitalize text-success">Update Profile</h5>
                                <p className="m-0 small text-muted">Manage your personal information and address</p>
                            </div>
                        </div>
                    </div>

                    <div className={
                        role === "seller" 
                        ? "col-12 col-md-10 col-lg-5"
                        : "col-12 col-md-6 col-lg-5 mt-3 mt-md-3"}>
                        <form action="#" onSubmit={handleSubmit}>
                            <div className="row g-0 mt-3">
                                
                                {/* Profile Image Section */}
                                <div className="col-12 d-flex flex-column align-items-center gap-2 mb-3">
                                    {imgPreview ? (
                                        <>
                                            <div className="border border-white rounded-circle shadow" 
                                                style={{ width: "100px", height: "100px", overflow: "hidden" }}>
                                                <img
                                                    src={imgPreview}
                                                    alt="Preview"
                                                    className="h-100 w-100"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            </div>
                                            <button type="button" 
                                                className="rounded-pill px-3 shadow-sm border p-1 bg-light d-flex align-items-center text-danger"
                                                style={{cursor: "pointer", fontSize: "14px"}}
                                                onClick={handleFileRemove}>
                                                <span className="text-capitalize">remove</span>
                                                <i className="bx bx-x fs-5"></i>
                                            </button>
                                        </>
                                    ):(
                                        <>
                                            <div style={{position: "relative"}}>
                                                {formData?.image ? (
                                                    <div className="border border-white rounded-circle shadow" 
                                                        style={{ width: "100px", height: "100px", overflow: "hidden" }}>
                                                        <img src={formData?.image}
                                                            alt="Profile" 
                                                            className="h-100 w-100"
                                                            style={{objectFit: "cover"}}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="rounded-circle bg-dark fs-1 d-flex align-items-center justify-content-center text-white" 
                                                        style={{width: "100px", height: "100px"}}>
                                                        {formData?.firstname?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                                <label className="rounded-circle shadow-xl border bg-white d-flex align-items-center justify-content-center "
                                                    htmlFor="inputFile"
                                                    style={{cursor: "pointer", width: "30px", height: "30px", position: "absolute", bottom: "0", right: "0"}}>
                                                    <i className="bx bx-camera "></i>
                                                </label>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        id="inputFile"
                                        type="file" 
                                        className="d-none" 
                                        name="image"
                                        onChange={handleFile}
                                        ref={fileUploadRef}
                                        accept="image/*"
                                    />
                                </div>

                                <div className="col-12">
                                    <p className="m-0 text-capitalize fw-bold">personal info</p>
                                </div>

                                {/* First Name & Last Name */}
                                <div className="col-6 px-2 mt-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        first name:
                                    </label>
                                    <input 
                                        className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                        style={{ fontSize: "14px" }}
                                        name="firstname"
                                        type="text"
                                        value={formData.firstname || ""}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="col-6 px-2 mt-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        last name:
                                    </label>
                                    <input 
                                        className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                        style={{ fontSize: "14px" }}
                                        name="lastname"
                                        type="text"
                                        value={formData.lastname || ""}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="col-12 px-2 mt-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        email:
                                    </label>
                                    <input 
                                        className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                        style={{ fontSize: "14px" }}
                                        name="email"
                                        type="email"
                                        value={formData.email || ""}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Conditional: Seller Wallet or User Contact */}
                                {role === "seller" ? (
                                    <>
                                        <div className="col-6 px-2 mt-2">
                                            <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                                e-wallet account:
                                            </label>
                                            <input 
                                                className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                                style={{ fontSize: "14px" }}
                                                name="wallet_number"
                                                type="text"
                                                placeholder="11-digit number"
                                                value={formData?.e_WalletAcc?.number || ""}
                                                onChange={(e)=>{
                                                    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        e_WalletAcc: { ...prev.e_WalletAcc, number: sanitized },
                                                    }))
                                                }}
                                                maxLength="11"
                                                required
                                            />
                                        </div>
                                        <div className="col-6 px-2 mt-2">
                                            <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                                e-wallet type:
                                            </label>
                                            <select 
                                                className="form-select text-capitalize mt-2 w-100 bg-warning bg-opacity-10"
                                                style={{fontSize: "14px"}} 
                                                name="wallet_type" 
                                                value={formData?.e_WalletAcc?.type || ""}
                                                onChange={(e) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        e_WalletAcc: { ...prev.e_WalletAcc, type: e.target.value },
                                                    }))
                                                }}
                                                required>
                                                <option value="" hidden>
                                                    {formData?.e_WalletAcc?.type || "select wallet"}
                                                </option>
                                                {["g-cash", "maya"].map((data, i) => (
                                                    <option key={i} value={data}>{data}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-12 px-2 mt-2">
                                        <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                            contact no:
                                        </label>
                                        <input 
                                            className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                            style={{ fontSize: "14px" }}
                                            name="contact"
                                            type="text"
                                            placeholder="11-digit number"
                                            value={formData.contact || ""}
                                            onChange={handleInputChange}
                                            maxLength="11"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="col-12 mt-4">
                                    <p className="m-0 text-capitalize fw-bold">address info</p>
                                </div>

                                {/* Province */}
                                <div className="col-12 mt-2 px-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        province:
                                    </label>
                                    <select 
                                        name="province" 
                                        className="form-select mt-2 w-100 bg-warning bg-opacity-10"
                                        style={{fontSize:"14px"}}
                                        onChange={handleLocationChange}
                                        value={formData.province || ''}
                                        required>
                                        <option value="">Select Province</option>
                                        {Object.keys(philippineLocations).map((province) => (
                                            <option key={province} value={province}>
                                                {province}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* City */}
                                <div className="col-12 mt-2 px-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        city:
                                    </label>
                                    <select 
                                        name="city" 
                                        className="form-select mt-2 w-100 bg-warning bg-opacity-10"
                                        style={{fontSize:"14px"}}
                                        onChange={handleLocationChange}
                                        value={formData.city || ''}
                                        disabled={!formData.province || formData.province === fallBack}
                                        required>
                                        <option value="">Select City</option>
                                        {availableCities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Barangay */}
                                <div className="col-12 mt-2 px-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        barangay:
                                    </label>
                                    <select 
                                        name="barangay"
                                        className="form-select mt-2 w-100 bg-warning bg-opacity-10"
                                        style={{fontSize:"14px"}}
                                        onChange={handleLocationChange}
                                        value={formData.barangay || ''}
                                        disabled={!formData.city || formData.city === fallBack}
                                        required>
                                        <option value="">Select Barangay</option>
                                        {availableBarangays.map((barangay) => (
                                            <option key={barangay} value={barangay}>
                                                {barangay}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Zip Code */}
                                <div className="col-12 mt-2 px-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        zip code:
                                    </label>
                                    <input 
                                        className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                                        style={{ fontSize: "14px" }}
                                        name="zipcode"
                                        type="text"
                                        value={formData.zipcode || ''}
                                        onChange={handleInputChange}
                                        readOnly
                                        required
                                    />
                                </div>

                                {/* Detail Address */}
                                <div className="col-12 px-2 mt-2">
                                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}>
                                        blk/lot/street:
                                    </label>
                                    <textarea 
                                        className="w-100 mt-2 form-control text-capitalize bg-warning bg-opacity-10"
                                        style={{ fontSize: "14px", resize: "none" }}
                                        name="detailAddress"
                                        onChange={handleInputChange}
                                        value={formData.detailAddress || ''}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row g-0 mt-4">
                                <div className="col-6 px-2">
                                    <button 
                                        type="button"
                                        className="text-capitalize px-3 py-2 rounded w-100 border-0 small"
                                        onClick={() => navigate(-1)}>
                                        cancel
                                    </button>
                                </div>
                                <div className="col-6 px-2">
                                    <button 
                                        type="submit"
                                        className={`text-capitalize px-3 py-2 rounded w-100 text-light border-0 small d-flex align-items-center justify-content-center gap-2
                                            ${(!isChanged || isSubmitting) ? "bg-dark opacity-50" : "bg-dark"}
                                        `}
                                        disabled={!isChanged || isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <span>updating...</span>
                                            </>
                                        ) : (
                                            "update profile"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className={`col-12 col-md-6 col-lg-6 ${ role === "seller" ? "d-md-none d-lg-block"  :"d-md-block d-none"} `}>
                        <img src={img} alt="background" className="img-fluid" />
                    </div>
                </div>
            </div>
        </div>

        <Toast 
            show={showToast}
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
        />
        </>
    );
}

export default EditProfile;