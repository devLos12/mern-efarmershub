import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";

//sidebar
const Sidebar = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller
    const {setText, setExitModal} = context;
    const navigate = useNavigate();
    const location = useLocation(); // Get current location
    const { inboxBadge, setInboxBadge } = useContext(appContext);

    const handleClick = ()=> {
        setExitModal(true);
        setText("do you want to exit?");
    }

    const data = {
        admin : [
            {label: 'dashboard',    link: '/admin',               icon : "fa fa-table",               source : undefined},
            {label: 'inventory',    link: '/admin/inventory',     icon : "fa-solid fa-boxes-stacked", source : undefined},
            {label: 'accounts',     link: '/admin/accounts',      icon : "fa fa-user",                source : "user"},
            {label: 'inbox',        link: '/admin/inbox',         icon : "fa-solid fa-inbox",         source : undefined},
            {label: "announcement", link: "/admin/announcement",  icon : "fa-solid fa-bell",          source: undefined},
            {label: 'Payment',      link: '/admin/payment',       icon : "fa-solid fa-credit-card",   source: "payment"},
            {label: 'Payout',       link: '/admin/payout/seller', icon : "fa-solid fa-money-bill-transfer",  source: "payout/seller"},
            {label: 'QR Payment',   link: '/admin/qrcodes',       icon: 'fa-solid fa-qrcode',         source: undefined},
            {label: "activity logs", link: '/admin/activity-logs', icon: 'fa-solid fa-clock-rotate-left',      source: undefined}
        ], 

        seller : [
            {label: 'My Crops',     link: '/seller',              icon : "fa-solid fa-box",           source: undefined},
            {label: 'Orders',       link: '/seller/orders',       icon : "fa-solid fa-bag-shopping",  source: undefined},
            {label: 'inbox',        link: '/seller/inbox',        icon : "fa-solid fa-inbox",         source: undefined},
            {label: 'chat support', link: '/seller/messages',     icon : "fa-solid fa-message",       source: undefined},
            {label: 'Payment',      link: '/seller/payment',      icon : "fa-solid fa-credit-card",   source: "payment"},
            {label: 'Payout',       link: '/seller/payout',       icon : "fa-solid fa-money-bill-transfer",  source: "payout"},
        ] 
    }


    const navLinks = data[role] || [];

    // Check if link is active
    const isActive = (link) => {
        // Exact match for root paths
        if (link === '/admin' || link === '/seller') {
            return location.pathname === link;
        }
        // Check if current path starts with the link
        return location.pathname.startsWith(link);
    };
    
    return (
        <>
        <nav className="nav flex-column px-2 ">
        {
            navLinks.map((data, i)=>{
                const active = isActive(data.link);
                
                return (
                    <div key={i} className="navbar-brand text-dark mt-4" 
                    style={{cursor : "pointer"}}
                    onClick={()=>{
                        if(role === "admin"){
                            navigate(data.link, { state : { source : data?.source}})

                            if(data.label === "inbox"){
                                setInboxBadge((prev) => ({
                                    ...prev,
                                    show: false
                                }))
                            }

                        } else {
                            if(i === 3) {
                                const sendData = {
                                    receiverId: "unknown",
                                    receiverRole: "admin"
                                }
                                fetch(`${import.meta.env.VITE_API_URL}/api/getSellerChatId`, {
                                    method : "POST",
                                    headers : { "Content-Type": "application/json" },
                                    body: JSON.stringify(sendData),
                                    credentials: "include"
                                })
                                .then((res) => res.json())
                                .then((e) => {
                                    console.log(e)
                                    navigate(data.link, { state : { 
                                        source : "admin",
                                        chatId : e.chatId,
                                        senderId : e.senderId,
                                        credentials:{
                                            id : e.receiverId,
                                            name : "admin",
                                            email : e.email,
                                            role : "admin"
                                        }
                                    }}) 
                                })
                                .catch((err) => console.log("Error:", err.message))
                            
                            } else {
                                if(data.label === "inbox"){
                                    setInboxBadge((prev) => ({
                                        ...prev,
                                        show: false
                                    }))
                                }

                                navigate(data.link, {
                                    state: { source: data.source }
                                });
                            }
                        }
                    }}>
                        <div className="row">
                            <div className="col-1">
                                <div className={`${data.icon} position-relative 
                                ${active ? 'text-green' : (role === "seller" ? "text-dark" : "text-light")}`}>
                                    {data.label === "inbox" && inboxBadge.show && (
                                        <p className="position-absolute top-0 end-0  m-2 
                                            d-flex justify-content-center align-items-center fw-normal text-white"
                                            style={{fontSize : "9px",
                                            width:"17px", height:"17px", borderRadius:"50%", background:"red"}}
                                            >{inboxBadge.number}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="col">
                                <p className={`m-0 ms-2 text-capitalize
                                ${active ? 'text-green' : (role === "seller" ? "text-dark" : "text-light")} 
                                `}>{data.label}</p>
                            </div>
                        </div>
                    </div>
                )
            })
        }
        <button className={`mt-4 border-0 p-1 d-flex align-items-center justify-content-center rounded-3
        shadow-lg ${role === "seller" ? "bg-dark text-white" : "bg-white text-dark"}`} 
        onClick={handleClick} 
        style={{cursor : "pointer"}}>
            <div className="fa-solid fa-right-from-bracket  small"></div>
            <p className="m-0 ms-2 small">Exit</p>
        </button>
        </nav>
        </>
    );
};

export default Sidebar;