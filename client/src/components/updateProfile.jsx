import { useContext, useEffect, useState, useRef } from "react";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";
import { useBreakpoint, useBreakpointHeight } from "./breakpoint";
import philippineLocations from "../data/philippinesAddress.json";
import imageCompression from 'browser-image-compression';


const UpadateProfile = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);

    const [formData, setFormData] = useState({});
    const height = useBreakpointHeight();
    const width = useBreakpoint();

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

    const { openUpdateProfile, setOpenUpdateProfile, sellerInfo, userData, setTrigger } = context;

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
                    
                    // Set zipcode based on city data
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





    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle location dropdown changes
    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'province') {
            // Reset city and barangay when province changes
            setFormData(prevData => ({
                ...prevData,
                province: value,
                city: '',
                barangay: '',
                zipcode: ''
            }));
            
            // Update available cities
            const provinceData = philippineLocations[value];
            if (provinceData && provinceData.cities) {
                setAvailableCities(Object.keys(provinceData.cities));
            } else {
                setAvailableCities([]);
            }
            setAvailableBarangays([]);
            
        } else if (name === 'city') {
            // Reset barangay when city changes and set zipcode
            const provinceData = philippineLocations[formData.province];
            const cityData = provinceData?.cities?.[value];
            
            setFormData(prevData => ({
                ...prevData,
                city: value,
                barangay: '',
                zipcode: cityData?.zipCode || ''
            }));
            
            // Update available barangays
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
        
        console.log(formData);



        const sendData = new FormData();

        sendData.append('image', formData.image);
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

            setIsSubmitting(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: "PATCH",
                body: sendData,
                credentials: "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            alert(data.message);
            setTrigger((prev) => !prev);
            setOpenUpdateProfile((prev) => !prev);

        } catch (error) {
            console.log("Error: ", error.message);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    
    const handleFile = async (e) => {
        const { name } = e.target;
        const file = e.target.files[0];

        if (file) {
            try {
                // Compress image before using
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };

                const compressedFile = await imageCompression(file, options);

                setFormData((prev) => ({
                    ...prev,
                    [name]: compressedFile
                }));

                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImgPreview(e.target.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Image compression error:", error);
                alert("Failed to compress image");
            }
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
        <div className="container-fluid position-fixed top-0 start-0 end-0 h-100 bg-darken" 
        style={{zIndex: 99}}>
            <div className="row mt-2 justify-content-center">
                <div className="col-12 col-md-10 col-lg-7 col-xl-6">
                    <div className="card position-relative" >
                        <i className="bx bx-x text-end fs-4 m-1 position-absolute end-0"
                        onClick={()=> setOpenUpdateProfile(false)} style={{ cursor: "pointer"}}></i>
                        <p className="m-0 text-capitalize fw-bold fs-4 text-center p-3">update profile</p>
                        <div className="card-body p-3 px-md-5" >
                         
                            <form action="#" onSubmit={handleSubmit} style={{height:  height-120, overflowY: "auto"}}>

                                <div className="d-flex flex-column  align-items-center justify-content-around w-100 gap-2 mb-3 ">
                                    {imgPreview ? (
                                        <>
                                        <div className="border border-white rounded-circle" 
                                        style={{ width: "100px", height: "100px", overflow: "hidden",  }}
                                        >
                                            <img
                                                src={imgPreview}
                                                alt={imgPreview}
                                                className="h-100 w-100"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>


                                        <button type="button" className="rounded-pill px-3 shadow-sm border p-1 bg d-flex align-items-center text-danger"
                                        style={{cursor: "pointer"}}
                                        onClick={handleFileRemove}
                                        >
                                            <p className="m-0 small text-capitalize">remove</p>
                                            <i className="bx bx-x fs-5"></i>
                                        </button>
                                        </>

                                    ):(
                                    <>
                                        {formData?.image ? (
                                            <div className="border border-white rounded-circle shadow" 
                                            style={{ width: "100px", height: "100px", overflow: "hidden",  }}
                                            >
                                                <img src={formData?.image}
                                                    alt={formData?.image} 
                                                    className="h-100 w-100 "
                                                    style={{objectFit: "cover"}}
                                                />
                                            </div>

                                        ) : (
                                            <div className="rounded-circle bg-dark fs-1 d-flex align-items-center justify-content-center text-white" 
                                            style={{width: "100px", height: "100px"}}
                                             >{formData?.firstname?.charAt(0)?.toUpperCase()}</div>
                                        )}
                                        <label className="rounded-pill px-3 shadow-sm border p-1 bg d-flex align-items-center gap-2"
                                        htmlFor="inputFile"
                                        style={{cursor: "pointer"}}
                                        >
                                            <p className="m-0 small text-capitalize">change</p>
                                            <i className="bx bx-pencil fs-6"></i>
                                        </label>
                                    </>

                                    )}

                                    <input 
                                    id="inputFile"
                                    type="file" 
                                    className="d-none" 
                                    name="image"
                                    onChange={handleFile}
                                    ref={fileUploadRef}
                                    />
                                </div>

                                <div className={`d-flex align-items-center justify-content-between gap-4`}>
                                    {[
                                        {label: "first name", name: "firstname", type: "text"},
                                        {label: "last name",  name: "lastname", type: "text"},
                                    ].map((data, i) => (
                                        <div key={i} className="w-100  ">
                                            <label htmlFor={data.name} className="text-capitalize small my-2">{data.label}:</label>
                                            <input 
                                                type={data.type} 
                                                name={data.name}
                                                className="form-control text-capitalize w-100 opacity-75 border-2" 
                                                style={{fontSize: "14px"}}
                                                value={formData[data.name] || ""}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    ))}                                    
                                </div>


                                {role === "seller" ? (
                                    <>
                                        {[ 

                                            {   label: "email",             name: "email",          type: "email" },
                                            {   label: "e-wallet account",  name: "wallet_number",  type: "text" },
                                        ].map((data, i) => (
                                            
                                            i === 1 ? (
                                                <div key={i} className="d-flex align-items-center justify-content-center gap-4">
                                                    <div  className="w-100 ">
                                                        <label htmlFor={data.name} className="text-capitalize small my-2">{data.label}:</label>
                                                        <input 
                                                            type={data.type} 
                                                            name={data.name}
                                                            className={`form-control border-2 small ${i === 1 && "text-capitalize "} w-100  opacity-75`}
                                                            value={formData?.e_WalletAcc?.number || ""}
                                                            onChange={(e)=>{
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    e_WalletAcc: { ...prev.e_WalletAcc, number: e.target.value },
                                                                }))
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="w-100 ">
                                                        <label htmlFor={data.name} className="text-capitalize small my-2">E wallet type:</label>
                                                        <select className="form-select text-capitalize border-2 opacity-75 w-100"
                                                        style={{fontSize: "14px"}} 
                                                        name={"wallet_type"} 
                                                        value={formData?.e_WalletAcc?.type || ""}
                                                        onChange={(e) => {
                                                            setFormData((prev) => ({
                                                                    ...prev,
                                                                    e_WalletAcc: { ...prev.e_WalletAcc, type: e.target.value },
                                                            }))
                                                        }}
                                                        required
                                                        >
                                                            <option value="" hidden>{
                                                            formData?.e_WalletAcc?.type ? formData?.e_WalletAcc?.type : "select wallet"
                                                            
                                                            }</option>

                                                            {["g-cash", "maya"].map((data, i) => (
                                                                <option key={i} value={data}>{data}</option>
                                                            ))}
                                                        </select>
                                                 
                                                    </div>
                                                </div>

                                            ) : (

                                                <div key={i} className="w-100 ">
                                                    <label htmlFor={data.name} className="text-capitalize small my-2">{data.label}:</label>
                                                    <input 
                                                        type={data.type} 
                                                        name={data.name}
                                                        className={`form-control border-2 ${i === 1 && "text-capitalize "} w-100  opacity-75`}
                                                        style={{fontSize: "14px"}}
                                                        value={formData[data.name] || ""}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            )

                                        ))}
                                    </>

                                ): (

                                    <div className={`d-flex align-items-center justify-content-center gap-4`}>
                                        {[ 
                                            {   label: "email",      name: "email",     type: "email" },
                                            {   label:  "contact no", name:  "contact",  type: "text"
                                            },
                                        ].map((data, i) => (
                                            
                                            <div key={i} className="w-100 ">
                                                <label htmlFor={data.name} className="text-capitalize small my-2">{data.label}:</label>
                                                <input 
                                                    type={data.type} 
                                                    name={data.name}
                                                    className={`form-control border-2 ${i === 1 && "text-capitalize "} w-100  opacity-75`}
                                                    style={{fontSize: "14px"}}
                                                    value={formData[data.name] || ""}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}








                                {/* Location Dropdowns */}
                                <div className="d-flex align-items-center justify-content-center gap-4">
                                    {/* Province Dropdown */}
                                    <div className="w-100">
                                        <label htmlFor="province" className="text-capitalize small my-2">province:</label>
                                        <select 
                                            name="province"
                                            className="form-select text-capitalize w-100  opacity-75 border-2" 
                                            style={{fontSize: "14px"}}
                                            value={formData.province || ""}
                                            onChange={handleLocationChange}
                                            required
                                        >
                                            <option value="">Select Province</option>
                                            {Object.keys(philippineLocations).map((province) => (
                                                <option key={province} value={province}>
                                                    {province}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* City Dropdown */}
                                    <div className="w-100">
                                        <label htmlFor="city" className="text-capitalize small my-2">city:</label>
                                        <select 
                                            name="city"
                                            className="form-select text-capitalize w-100 border-2 opacity-75" 
                                            style={{fontSize: "14px"}}
                                            value={formData.city}
                                            onChange={handleLocationChange}
                                            disabled={!formData.province || formData.province === fallBack}
                                            required
                                        >
                                            <option value="">Select City</option>
                                            {availableCities.map((city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-center gap-4">
                                    {/* Barangay Dropdown */}
                                    <div className="w-100">
                                        <label htmlFor="barangay" className="text-capitalize small my-2">barangay:</label>
                                        <select 
                                            name="barangay"
                                            className="form-select text-capitalize w-100 opacity-75 border-2" 
                                            style={{fontSize: "14px"}}
                                            value={formData.barangay || ""}
                                            onChange={handleLocationChange}
                                            disabled={!formData.city || formData.city === fallBack}
                                            required
                                        >
                                            <option value="">Select Barangay</option>
                                            {availableBarangays.map((barangay) => (
                                                <option key={barangay} value={barangay}>
                                                    {barangay}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Zip Code Input */}
                                    <div className="w-100">
                                        <label htmlFor="zipcode" className="text-capitalize small my-2">zip code:</label>
                                        <input 
                                            type="text" 
                                            name="zipcode"
                                            className="form-control text-capitalize w-100 opacity-75 border-2" 
                                            style={{fontSize: "14px"}}
                                            value={formData.zipcode || ""}
                                            onChange={handleInputChange}
                                            readOnly
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="w-100 ">
                                    <label htmlFor={"detailAddress"} className="text-capitalize small my-2">blk/lot/street</label>
                                    <textarea
                                        type={"text"} 
                                        name={"detailAddress"}
                                        className="form-control text-capitalize w-100 opacity-75 border-2" 
                                        style={{fontSize: "14px", resize: "none"}}
                                        value={formData["detailAddress"] || ""}
                                        onChange={handleInputChange}
                                        required

                                    />
                                </div>

                                <div className="d-flex justify-content-end mt-3 gap-3 mb-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-dark px-4" 
                                        onClick={()=> setOpenUpdateProfile(false)}
                                    >
                                        cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`btn px-4 ${!isChanged || isSubmitting ? "btn-secondary opacity-50" : "btn-primary"}`}
                                        disabled={!isChanged || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span 
                                                    className="spinner-border spinner-border-sm me-2" 
                                                    role="status" 
                                                    aria-hidden="true"
                                                ></span>
                                                processing...
                                            </>
                                        ) : (
                                            'save'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UpadateProfile;