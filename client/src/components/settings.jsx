import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";


const Settings = () => {
    const { role } = useContext(appContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);
    const context = role === "seller" ? seller : user;
    const { setOpenProfile, setOpenSettings } = context;
    const navigate = useNavigate();


    return (
        <div className="conatainer">
            <div className="row">
                <div className="col-12">
                    <p className="fs-3 text-success text-capitalize m-0 fw-bold p-3">settings</p>
                </div>
                <div className="col">
                    <div className="px-2 ">
                        <div className="row bg-hover g-0 rounded-3 shadow-sm border p-3 mt-2"
                        style={{cursor: "pointer"}}
                        onClick={() => {
                            setOpenSettings(false);
                            setOpenProfile(false);
                            navigate(`/${role}/edit-profile`)
                        }}
                        >
                            <div className="col-1">
                                <i className="fa fa-user"></i>
                            </div>
                            <div className="col">
                                <p className="m-0 text-capitalize small">edit profile</p>
                            </div>
                             <div className="col-1">
                                <i className="fa fa-chevron-right ms-4"></i>
                            </div>
                        </div>
                    </div>

                    <div className="px-2">
                        <div className="row bg-hover g-0 rounded-3 shadow-sm border p-3 mt-2"
                        style={{cursor: "pointer"}}
                        onClick={()=> {
                            setOpenSettings(false);
                            setOpenProfile(false);
                            navigate(`/${role}/change-password`)
                        }}
                        >
                            <div className="col-1">
                                <i className="fa fa-lock"></i>
                            </div>
                            <div className="col">
                                <p className="m-0 text-capitalize small">change password</p>
                            </div>
                            <div className="col-1">
                                <i className="fa fa-chevron-right ms-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )   
}

export default Settings;