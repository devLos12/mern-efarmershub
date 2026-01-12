import React, { useContext, useLayoutEffect, useState } from "react";
import { useBreakpointHeight } from "./breakpoint";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import Notification from "./notification";
import { appContext } from "../context/appContext";
import Profile from "./profile";
import ViewProfile from "./viewProfile";
import Settings from "./settings";



const IconCard = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller;
    const { openNotif, openProfile, openViewProfile, openSettings, setHasIcon } = context;
    const height = useBreakpointHeight();
    
    
    return (
        <div className="container-fluid bg-darken " 
        >
            <div className="row">
                <div className="col g-0 d-flex justify-content-end">
                    <div className="bg-light mt-1 rounded shadow"
                    style={{width : "430px", height: height-60}}>
                        { openNotif && <Notification/>}
                        { openProfile && <Profile/>}
                        { openViewProfile && <ViewProfile/>}
                        { openSettings && <Settings/>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IconCard;