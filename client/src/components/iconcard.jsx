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

    const { openNotif, openProfile, openViewProfile, openSettings,
            setOpenNotif, setOpenProfile, setOpenViewProfile, setOpenSettings } = context;

    
    const height = useBreakpointHeight();

        
    const closeAll = () => {
        setOpenNotif(false);
        setOpenProfile(false);
        setOpenViewProfile(false);
        setOpenSettings(false);
    };


    
    return (
        <div className="position-absolute vh-100 bg-darken"
         onClick={closeAll}
          style={{
            position: 'absolute',
            top: '100%',       // kaagad sa baba ng header
            right: 0,
            left: 0,
            zIndex: 999,
        }}
        >
            <div className="row">
                <div className="col g-0 d-flex justify-content-end">
                    <div className="bg-light mt-1 rounded shadow"
                    onClick={(e)=> e.stopPropagation()}
                    style={{width : "430px", height: height-60}}>
                        { role === "seller" &&  openNotif && <Notification/>}
                        { role === "seller" &&  openProfile && <Profile/>}
                        { role === "seller" &&  openViewProfile && <ViewProfile/>}
                        { role === "seller" &&  openSettings && <Settings/>}

                        
                        { role === 'admin' && openNotif && <Notification/>}
                        { role === "admin" && openProfile && <Profile/>}
                        { role === "admin" && openViewProfile && <ViewProfile/>}
                        { role === "admin" && openSettings && <Settings/>}

        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IconCard;