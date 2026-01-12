import React, { useContext, useState } from "react";
import Cart from "./cart.jsx";
import { useBreakpointHeight } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";
import Notifications from "../notification.jsx";
import Order from "./order.jsx";
import "../../styles/index.css";
import InboxChat from "../inboxchat.jsx";
import Profile from "../profile.jsx";
import ViewProfile from "../viewProfile.jsx";
import Settings from "../settings.jsx";




const IconCard = () => {
    const { openCart, openProfile, openNotif, openOrder, openMessages,
        openViewProfile, openSettings
    } = useContext(userContext);
    const height = useBreakpointHeight();
    

    return (
        <div className="container-fluid bg-darken">
            <div className="row ">
                <div className="col g-0 d-flex justify-content-end">
                    <div className="bg-light  mt-1 rounded shadow"
                    style={{width : "430px", height: height-80}}>
                        {openCart && <Cart/>}
                        {openProfile && <Profile/>}
                        {openNotif && <Notifications/>}
                        {openOrder && <Order/>}
                        {openMessages && <InboxChat/>}
                        {openViewProfile && <ViewProfile/>}
                        {openSettings && <Settings/>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IconCard;