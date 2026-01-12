import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { useBreakpoint } from "./breakpoint.jsx"
import { Link, useNavigate } from "react-router-dom";
import { adminContext } from "../context/adminContext.jsx";
import { sellerContext } from "../context/sellerContext.jsx";
import IconCard from "./iconcard.jsx";
import { appContext } from "../context/appContext.jsx";




const Header = ()=> {
    const {role} = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context =  role === "admin" ? admin : seller;
    const { setText, textHeader, setExitModal, openNotif, setOpenNotif,
            openProfile, setOpenProfile, notifBadge, setNotifBadge, sellerInfo,
            adminInfo, openViewProfile, setOpenViewProfile, openSettings, setOpenSettings,
            hasIcon, setHasIcon, 
    } = context;

    const [isMenu, setMenu] = useState(false);
    const width = useBreakpoint();  
    const navigate = useNavigate();
    const { inboxBadge} = useContext(appContext);    



    useLayoutEffect(() => {
        // Para sa admin: walang openNotif sa hasIcon
        if (role === "admin") {
            setHasIcon(isMenu || openProfile || openViewProfile || openSettings);
        } else {
            // Para sa seller: kasama ang openNotif
            setHasIcon(isMenu || openNotif || openProfile || openViewProfile || openSettings);
        }
    },[isMenu, openNotif, openProfile, openViewProfile, openSettings, role]);


    
    const Notification = () => { 
        setOpenViewProfile(false);

        setNotifBadge((prev) => ({ 
            ...prev,
            show : false
        }));
        
        setOpenProfile(false);
        setMenu(false);
        setOpenNotif((prev) => !prev);
    }

    const Menu = () => {

        if(role === "seller") {
            setOpenViewProfile(false);
            setOpenProfile(false);
        }
        setOpenNotif(false);
        setMenu((prev) => !prev);
       
    }

    const Profile = () => {
        

        setOpenSettings(false);
        setOpenViewProfile(false);
        setMenu(false);
        setOpenNotif(false);
        setOpenProfile((prev) => !prev);
    }


    let dataProfile = {
        profile: "",
        name: "",
        sub: null
    }


    if(role === "seller"){
        dataProfile = {
            profile: sellerInfo?.imageFile,
            name: `${sellerInfo?.firstname} ${sellerInfo?.lastname}`,
            sub: null
        }
    } else if(role === "admin") {
        dataProfile = {
            profile: null,
            name: role,
            sub: adminInfo?.adminType
        }
    } else {
        dataProfile = {
            profile: null,
            name: role,
            sub: null
        }
    }

    return(
        <>
        <div>
        <div className={hasIcon ? "position-fixed top-0 end-0 start-0" : ""}
        style={{zIndex: 99, backgroundColor : "rgba(0, 0, 0, 0.204)"}}
        >
            <header className={`bg-white
            d-flex align-items-center justify-content-between p-2 px-md-5 border-bottom border z-2`} 
            >
                <div className="d-flex align-items-center ">
                    <div className={`m-0 ${isMenu ? "bx bx-x" : "bx bx-menu"} 
                    d-flex align-items-center justify-content-center text-success  fs-3  d-md-none me-2 rounded-circle`} 
                    style={{cursor:"pointer" }} onClick={Menu}></div>
                    <p className='m-0 fw-bold fs-5 text-capitalize text-green'>{textHeader}</p>
                </div>


                <div className="d-flex align-items-center gap-3 ">
                    {/* Notification Bell - ONLY for Seller */}
                    {role === "seller" && (
                        <div className="fa fa-bell fs-5 text-dark position-relative" 
                        style={{cursor :"pointer"}} onClick={Notification}>
                            {notifBadge.show && (
                                <p className="position-absolute top-0 end-0  m-2 
                                    d-flex justify-content-center align-items-center fw-normal text-white"
                                    style={{fontSize : "9px",
                                    width:"17px", height:"17px", borderRadius:"50%", background:"red"}}
                                    >{notifBadge.number}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Profile Section */}
                    {dataProfile?.profile ? (
                        <div className="d-flex align-items-center gap-3">
                            {role === "admin" && (
                                <div className="d-flex align-items-center gap-1">
                                    <p className="m-0 fw-semibold text-capitalize">{dataProfile?.name}</p>
                                    <p className="m-0 text-capitalize small">{`(${dataProfile?.sub})`}</p>
                                </div>
                            )}
                            
                            {role === "seller" && (
                                <div className="d-flex align-items-center gap-2">
                                    <div className="border border-dark border-opacity-25 shadow-sm rounded-circle" 
                                    style={{ width: "30px", height: "30px", overflow: "hidden", cursor: "pointer" }}
                                    onClick={Profile}>
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/api/Uploads/${dataProfile?.profile}`}
                                            alt={dataProfile?.profile}
                                            className="h-100 w-100"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <p className="m-0 text-capitalize fw-semibold small">farmer</p>
                                </div>
                            )}
                        </div>
                    ):(
                        <div className="d-flex align-items-center gap-2">
                            {role === "admin" && (
                                <>
                                <div className="rounded-circle bg-primary d-flex justify-content-center text-white align-items-center border-white border" 
                                style={{height: "30px", width: "30px"}}>
                                    <p className="m-0 text-uppercase small">{dataProfile?.name?.charAt(0)}</p>
                                </div>

                                <div className="d-flex align-items-center gap-1">
                                    <p className="m-0 fw-semibold text-capitalize">{dataProfile?.name}</p>
                                    <p className="m-0 text-capitalize small">{`(${dataProfile?.sub})`}</p>
                                </div>
                                </>
                            )}

                            {role === "seller" && (
                                <div className="rounded-circle bg-primary d-flex justify-content-center text-white align-items-center border-white border" 
                                onClick={Profile} 
                                style={{height: "30px", width: "30px", cursor: "pointer"}}>
                                    <p className="m-0 text-uppercase small">{dataProfile?.name?.charAt(0)}</p>
                                </div>
                            )}

                        </div>
                    )}
                </div>
             
            </header>
            
            {isMenu && (
                <div className="w-100  d-md-none vh-100" 
                >
                    <div className={`d-md-none d-flex flex-column gap-4 p-3 ${role === "seller"? "bg-white" : "bg-dark"}`}>
                        {( role === "seller" ? 
                            [
                                {label: 'My Crops',     link: '/'},
                                {label: 'Orders',       link: '/seller/orders'},
                                {label: 'Inbox',        link: '/seller/inbox'},
                                {label: 'Chat Supoort', link: '/seller/messages'},
                                {label: "payment",      link: "/seller/payment", source: "payment"},
                                {label: "payout",       link: "/seller/payout", source: "payout"},

                                
                            ]
                        :   role === "admin" ?
                            [
                                {label: 'Dashboard',    link: '/admin'},
                                {label: 'Accounts',     link: '/admin/accounts',      source : "user"},
                                {label: 'Inventory',    link: '/admin/inventory',     source : undefined},
                                {label: 'Inbox',        link: '/admin/inbox',         source : undefined},
                                {label: "Announcement", link: '/admin/announcement',   source : undefined},
                                {label: "payment",      link: "/admin/payment", source: "payment"},
                                {label: "payout",       link: "/admin/payout/seller", source: "payout/seller"},
                            ]
                        : []
                        ).map((data, i) => (
                            <div key={i} className="" 
                            style={{cursor : "pointer"}}
                            onClick={()=> {

                                if(role === "admin"){
                                    setMenu(false)
                                    navigate(data.link , { state : { source : data.source}});  
                                } else { 
                                    
                                    if(i === 3 ){

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
                                            setMenu(false)
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
                                        setMenu(false)
                                        navigate(data.link , { state : { source : data.source}});  
                                    }
                                }
                            
                                }}>
                                <p className="m-0 text-green text-capitalize ">{data.label}</p>
                            </div>
                        ))}
                        <div className="m-0">
                            <button className={`rounded w-100 border-0 p-2 text-capitalize   
                             d-flex align-items-center gap-2  justify-content-center 
                            ${role === "seller" ? "bg-dark text-white" : "bg-white text-dark"}`} 
                            style={{outline:"none"}}
                            onClick={()=> {
                                setExitModal(true);
                                setText("do you want to exit?");
                            }}>
                                <div className="fa-solid fa-right-from-bracket "></div>
                                exit</button>
                        </div>
                    </div>
                </div>
            )}
            {role === "seller" && openNotif && <IconCard/>}
            {openProfile && <IconCard/>}
            {openViewProfile && <IconCard/>}
            {openSettings && <IconCard />}
        </div>
        </div>
        </>
    )   
}
export default Header;