
import { useState, useContext } from "react";
import img from "../assets/images/image.png";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";
import { useEffect } from "react";



const ViewProfile = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);

    let context = null;
    if(role === "admin"){
        context = admin;

    } else if (role === "seller") {
        context = seller;
    } else {
        context = user;
    }

    const { userData, sellerInfo, adminInfo, setOpenUpdateProfile } = context; 


    let dataProfile = {
        name: "",
        id: "",
        dataInfo: [] 
    };
    

    if(role === "seller"){
        dataProfile = {
            profile: sellerInfo?.imageFile ?? "",
            name: sellerInfo?.firstname + " " + sellerInfo?.lastname,
            id: sellerInfo?._id,
            dataInfo: [
                {value: sellerInfo?.e_WalletAcc?.number,                    icon: "fa fa-phone"},
                {value: sellerInfo?.email ?? "N/A",             icon: "fa fa-envelope"},

                {value: [
                    sellerInfo?.sellerAddress?.detailAddress, 
                    sellerInfo?.sellerAddress?.barangay, 
                    sellerInfo?.sellerAddress?.city, 
                    sellerInfo?.sellerAddress?.province,
                    sellerInfo?.sellerAddress?.zipCode
                ].filter(Boolean)
                .join(', ') ||  "No address available",
                icon:"fa fa-location-dot"}

            ]
        }
    } else if (role === "user"){
        dataProfile = {
            profile: userData?.imageFile,
            name: userData?.firstname + " " + userData?.lastname,
            id: userData?._id,
            dataInfo: [
                {value: userData?.billingAddress?.contact ?? "N/A", icon: "fa fa-phone"},
                {value: userData?.email ?? "N/A",                   icon: "fa fa-envelope"},
                {value: [
                    userData?.billingAddress?.detailAddress, 
                    userData?.billingAddress?.barangay, 
                    userData?.billingAddress?.city, 
                    userData?.billingAddress?.province,
                    userData?.billingAddress?.zipCode
                ].filter(Boolean)
                .join(', ') ||  "No address available",
                icon:"fa fa-location-dot"}
            ]
        }
    }


    return (
        <div className="container">
            <div className="row  p-2">
                <div className="col-12 rounded py-3 border-1 border shadow-sm">
                    <div className="d-flex flex-column align-items-center gap-2">
                        {dataProfile?.profile ? (
                            <div className="border border-white rounded-circle shadow" 
                            style={{ width: "100px", height: "100px", overflow: "hidden", }}
                            >
                                <img
                                    src={`${import.meta.env.VITE_API_URL}/api/Uploads/${dataProfile?.profile}`}
                                    alt={dataProfile?.profile}
                                    className="h-100 w-100"
                                    style={{ objectFit: "cover" }}
                                />
                            </div>
                        ) : (
                            <div className="rounded-circle bg-primary text-white fs-2 d-flex align-items-center justify-content-center" 
                        style={{width: "100px", height: "100px"}}>{dataProfile?.name.charAt(0).toUpperCase()}</div>
                        )}
                        
                        <div className="text-center">
                            <p className="m-0 text-capitalize fw-bold fs-5">{dataProfile?.name}</p>
                        </div>

                        {/* <div className="d-flex align-itesm-center gap-2">
                            <button className="p-1 px-3 bg border d-flex align-items-center justify-content-center gap-2 shadow-sm  rounded-pill bg-dark text-white" 
                            
                            onClick={()=> {
                                setOpenUpdateProfile(true)
                            }}>
                                <p className="m-0 small text-capitalize ">edit profile</p>
                                <i className="fa fa-pen small"></i>
                            </button>
                            
                            <button className="p-1 px-3 bg border d-flex align-items-center justify-content-center gap-2 shadow-sm  rounded-pill bg-dark text-white" 
                            
                            onClick={()=> {
                                setOpenUpdateProfile(true)
                            }}>
                                <p className="m-0 small text-capitalize ">password</p>
                                <i className="fa fa-lock lock small"></i>
                            </button>                                   
                        </div> */}


                    </div>

                     <div className="col-12">
                        <p className="fw-bold m-0 text-capitalize my-3">{`${role === "seller" ? "farmer" 
                            : role === "user" ? "buyer" : ""} info`}</p>

                        {
                            dataProfile?.dataInfo?.map((data, i) => (
                                <div key={i} className="row mt-2">
                                    <div className="col-1">
                                        <i className={`${data.icon} small`}></i>
                                    </div>
                                    <div className="col">
                                        <p className={`m-0 ${i === 1 ? "text-normal" : "text-capitalize"} opacity-75 small`}>{data.value}</p>
                                    </div>
                                </div>
                            ))
                        }

                    </div>
                </div>
            </div>
        </div>
    )
}


export default ViewProfile;


