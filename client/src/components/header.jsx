import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBreakpoint } from "./breakpoint.jsx"
import { Link, useNavigate, useLocation } from "react-router-dom";
import { adminContext } from "../context/adminContext.jsx";
import { sellerContext } from "../context/sellerContext.jsx";
import IconCard from "./iconcard.jsx";
import { appContext } from "../context/appContext.jsx";


// Menu items — same structure as Sidebar (with groups)
const MENU_ITEMS = {
    seller: [
        { group: "STORE" },
        { label: 'My Crops',        link: '/seller',            icon: 'fa-solid fa-leaf' },
        { label: 'Orders',          link: '/seller/orders',     icon: 'fa-solid fa-bag-shopping' },

        { group: "COMMUNICATION" },
        { label: 'Inbox',           link: '/seller/inbox',      icon: 'fa-solid fa-inbox',              badge: true },
        { label: 'Chat Support',    link: '/seller/messages',   icon: 'fa-solid fa-message' },

        { group: "FINANCE" },
        { label: 'Payment',         link: "/seller/payment",    icon: 'fa-solid fa-credit-card',        source: "payment" },
        { label: 'Payout',          link: "/seller/payout",     icon: 'fa-solid fa-money-bill-transfer',source: "payout" },
    ],
    admin: [
        { group: "MANAGEMENT" },
        { label: 'Dashboard',       link: '/admin',                     icon: 'fa fa-table',                        badge: true },
        { label: 'Sales Report',    link: '/admin/sales',               icon: "fa fa-chart-bar" },
        { label: 'Inventory',       link: '/admin/inventory',           icon: 'fa-solid fa-boxes-stacked',          badge: true },
        { label: 'Accounts',        link: '/admin/accounts',            icon: 'fa fa-user',                         source: "user", badge: true },

        { group: "COMMUNICATION" },
        { label: 'Inbox',           link: '/admin/inbox',               icon: 'fa fa-inbox',                        badge: true },
        { label: 'Announcement',    link: '/admin/announcement',        icon: 'fa-solid fa-bell' },

        { group: "FINANCE" },
        { label: 'Payment',         link: "/admin/payment",             icon: 'fa-solid fa-credit-card',            source: "payment" },
        { label: 'Payout',          link: "/admin/payout/seller",       icon: 'fa-solid fa-money-bill-transfer',    source: "payout/seller" },
        { label: 'QR Payment',      link: '/admin/qrcodes',             icon: 'fa-solid fa-qrcode' },
        { label: 'Shipping Fee',    link: '/admin/shipping-fee',        icon: 'fa-solid fa-truck' },  // ← ADDED

        { group: "SYSTEM" },
        { label: 'Activity Logs',   link: '/admin/activity-logs',       icon: 'fa-solid fa-clock-rotate-left' },
    ]
};

// Group label component — same as Sidebar
const MenuGroup = ({ label, role }) => (
    <div className="px-2 mt-3 mb-1">
        <p className="m-0 text-uppercase fw-semibold"
            style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: role === "seller" ? "#888" : "#aaa"
            }}>
            {label}
        </p>
        <hr className="mt-1 mb-0" style={{ borderColor: role === "seller" ? "#ccc" : "#555", opacity: 0.5 }} />
    </div>
);


const Header = () => {
    const { role, orderBadge, setOrderBadge, prodBadge, setProdBadge, accBadge, setAccBadge } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller;
    const { setText, textHeader, setExitModal, openNotif, setOpenNotif,
        openProfile, setOpenProfile, notifBadge, setNotifBadge, sellerInfo,
        adminInfo, openViewProfile, setOpenViewProfile, openSettings, setOpenSettings,
        hasIcon, setHasIcon, 
    } = context;


        


    const [isMenu, setMenu] = useState(false);
    const width = useBreakpoint();
    const navigate = useNavigate();
    const location = useLocation();
    const { inboxBadge, setInboxBadge } = useContext(appContext);
    const headerRef = useRef(null);




    const handleNotification = () => {
        setOpenViewProfile(false);
        setNotifBadge((prev) => ({ ...prev, show: false }));
        setOpenProfile(false);
        setMenu(false);
        setOpenNotif((prev) => !prev);
    }
    

    const handleMenu = () => {
        setOpenSettings(false);
        setOpenViewProfile(false);
        setOpenProfile(false);
        setOpenNotif(false);
        setMenu((prev) => !prev);
    }

    
    const handleProfile = () => {

        if(role === "admin"){
            setOpenSettings(false);
            setOpenViewProfile(false);
            setMenu(false);
            setOpenNotif(false);
            setOpenProfile((prev) => !prev);
        }


        if(role === "seller"){
            setOpenSettings(false);
            setOpenViewProfile(false);
            setMenu(false);
            setOpenNotif(false);
            setOpenProfile((prev) => !prev);
        } 
    }


    const handleMenuItemClick = async (data) => {
        setMenu(false);

        if (role === "seller" && data.label === 'Chat Support') {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSellerChatId`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiverId: "unknown", receiverRole: "admin" }),
                    credentials: "include"
                });
                const e = await res.json();
                navigate(data.link, {
                    state: {
                        source: "admin",
                        chatId: e.chatId,
                        senderId: e.senderId,
                        credentials: {
                            id: e.receiverId,
                            name: "admin",
                            email: e.email,
                            role: "admin"
                        }
                    }
                });
            } catch (err) {
                console.log("Error:", err.message);
            }
        } else {
            if (data.label.toLowerCase() === 'dashboard') {
                setOrderBadge((prev) => ({ ...prev, show: false }));
            }
            if (data.label.toLowerCase() === 'inventory') {
                setProdBadge((prev) => ({ ...prev, show: false }));
            }
            if (data.label.toLowerCase() === 'accounts') {
                setAccBadge((prev) => ({ ...prev, show: false }));
            }
            if (data.label.toLowerCase() === "inbox") {
                setInboxBadge((prev) => ({ ...prev, show: false }));
            }

            navigate(data.link, { state: { source: data.source } });
        }
    }

    const isActive = (link) => {
        if (link === '/admin' || link === '/seller') {
            return location.pathname === link;
        }
        return location.pathname.startsWith(link);
    };

    const getProfileData = () => {
        if (role === "seller") {
            return {
                profile: sellerInfo?.imageFile,
                name: `${sellerInfo?.firstname} ${sellerInfo?.lastname}`,
                sub: null
            }
        } else if (role === "admin") {
            return {
                profile: adminInfo?.imageFile,
                name: role,
                sub: adminInfo?.adminType
            }
        }
        return { profile: null, name: role, sub: null }
    }

    const dataProfile = getProfileData();

    

    return (
        <>
            <div className="position-sticky top-0 start-0 end-0 shadow-sm shadow-bottom"
                style={{
                    zIndex: 99,
                    transition: 'all 0.3s ease',
                }}
            >
                <header ref={headerRef} className={`bg-white d-flex align-items-center justify-content-between p-2 px-md-5 border-bottom border z-2`}
                    style={{ transition: 'all 0.3s ease' }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <div
                            className={`${isMenu ? "bx bx-x" : "bx bx-menu"} d-flex align-items-center justify-content-center text-success fs-1 d-md-none`}
                            style={{ cursor: "pointer", transition: 'all 0.3s ease' }}
                            onClick={handleMenu}
                            role="button"
                            aria-label="Toggle menu"
                        />
                        <p className='m-0 fw-bold fs-5 text-capitalize text-success'>{textHeader}</p>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Notification Bell - ONLY for Seller */}
                        <div
                            className="fa fa-bell fs-5 position-relative"
                            style={{ cursor: "pointer", transition: 'all 0.2s ease' }}
                            onClick={handleNotification}
                            role="button"
                            aria-label="Notifications"
                        >
                            {notifBadge.show && (
                                <span className="position-absolute top-0 end-0 d-flex justify-content-center align-items-center fw-normal text-white m-2"
                                    style={{
                                        fontSize: "9px",
                                        width: "17px",
                                        height: "17px",
                                        borderRadius: "50%",
                                        background: "#dc3545",
                                    }}
                                >
                                    {notifBadge.number}
                                </span>
                            )}
                        </div>

                        {/* Profile Section */}
                        <div className="d-flex align-items-center gap-2">
                            {role === "admin" && (
                                <div className="d-flex align-items-center gap-1"
                                onClick={handleProfile}
                                style={{ cursor: 'pointer' }}>
                                    {dataProfile?.profile ? (
                                        <div
                                            className="border border-2 rounded-circle"
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                overflow: "hidden",
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                borderColor: '#dee2e6',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <img
                                                src={dataProfile?.profile}
                                                alt="Profile"
                                                className="h-100 w-100"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="rounded-circle bg-primary d-flex justify-content-center text-white align-items-center"
                                            style={{
                                                height: "30px",
                                                width: "30px",
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <span className="text-uppercase small">{dataProfile?.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                
                                    <div className="d-none d-sm-flex align-items-center gap-1">
                                        <p className="m-0 fw-semibold text-capitalize small">{dataProfile?.name}</p>
                                        <p className="m-0 text-capitalize" style={{ fontSize: '0.75rem' }}>{`(${dataProfile?.sub})`}</p>
                                    </div>
                                </div>
                            )}

                            {role === "seller" && (
                                <div className="d-flex align-items-center gap-2" 
                                onClick={handleProfile} 
                                style={{ cursor: 'pointer' }}>
                                    {dataProfile?.profile ? (
                                        <div
                                            className="border border-2 rounded-circle"
                                            style={{
                                                width: "30px",
                                                height: "30px",
                                                overflow: "hidden",
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                borderColor: '#dee2e6',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <img
                                                src={dataProfile?.profile}
                                                alt="Profile"
                                                className="h-100 w-100"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="rounded-circle bg-primary d-flex justify-content-center text-white align-items-center"
                                            style={{
                                                height: "30px",
                                                width: "30px",
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <span className="text-uppercase small">{dataProfile?.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                    <p className="m-0 text-capitalize fw-semibold small d-none d-sm-block">Farmer</p>
                                </div>
                            )}




                        </div>
                    </div>
                </header>
                            
                {/* Mobile Menu */}
                {isMenu && (
                    <nav className="w-100 d-md-none" style={{ maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>
                        <div className={`d-flex flex-column p-0 ${role === "seller" ? "bg-white" : "bg-dark"}`}>
                            {MENU_ITEMS[role]?.map((data, i) => {

                                // Render group label
                                if (data.group) {
                                    return <MenuGroup key={`group-${i}`} label={data.group} role={role} />;
                                }

                                const active = isActive(data.link);

                                return (
                                    <div
                                        key={i}
                                        className={`row p-2 mt-2 ${role === "seller" ? "text-dark" : "text-white"}`}
                                        style={{ cursor: "pointer", transition: 'all 0.2s ease' }}
                                        onClick={() => handleMenuItemClick(data)}
                                    >
                                        <div className="col-1">
                                            <i className={`${data.icon} ${active ? 'text-green fw-bold' : ''} text-capitalize ms-2 position-relative`}>
                                                {data.badge && data.label.toLowerCase() === "dashboard" && orderBadge.show && (
                                                    <p className="m-0 d-flex justify-content-center align-items-center text-white position-absolute fw-normal top-0 end-0 m-2 bg-danger"
                                                        style={{ fontSize: "9px", width: "17px", height: "17px", borderRadius: "50%" }}>
                                                        {orderBadge.number}
                                                    </p>
                                                )}
                                                {data.badge && data.label.toLowerCase() === "inventory" && prodBadge.show && (
                                                    <p className="m-0 d-flex justify-content-center align-items-center text-white position-absolute fw-normal top-0 end-0 m-2 bg-danger"
                                                        style={{ fontSize: "9px", width: "17px", height: "17px", borderRadius: "50%" }}>
                                                        {prodBadge.number}
                                                    </p>
                                                )}
                                                {data.badge && data.label.toLowerCase() === "accounts" && accBadge.show && (
                                                    <p className="m-0 d-flex justify-content-center align-items-center text-white position-absolute fw-normal top-0 end-0 m-2 bg-danger"
                                                        style={{ fontSize: "9px", width: "17px", height: "17px", borderRadius: "50%" }}>
                                                        {accBadge.number}
                                                    </p>
                                                )}
                                                {data.badge && data.label.toLowerCase() === "inbox" && inboxBadge.show && (
                                                    <p className="m-0 d-flex justify-content-center align-items-center text-white position-absolute fw-normal top-0 end-0 m-2 bg-danger"
                                                        style={{ fontSize: "9px", width: "17px", height: "17px", borderRadius: "50%" }}>
                                                        {inboxBadge.number}
                                                    </p>
                                                )}
                                            </i>
                                        </div>
                                        <div className="col-auto">
                                            <span className={`text-capitalize ${active ? 'fw-bold text-green' : 'fw-500'}`}>
                                                {data.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Exit Button */}
                            {/* <div className="p-3 border-top mb-5">
                                <button
                                    className={`w-100 border-0 p-2 text-capitalize d-flex align-items-center gap-2 justify-content-center rounded ${role === "seller" ? "bg-dark text-white" : "bg-light text-dark"}`}
                                    style={{ outline: "none", transition: 'all 0.2s ease', fontWeight: '600' }}
                                    onClick={() => {
                                        setExitModal(true);
                                        setText("do you want to exit?");
                                    }}
                                >
                                    <i className="fa-solid fa-right-from-bracket" />
                                    <span>Log out</span>
                                </button>
                            </div> */}
                            <div className="mb-5"/>
                        </div>
                    </nav>
                )}

                {role === "seller" && openNotif && <IconCard />}
                {role === "seller" && openProfile && <IconCard />}
                {role === "seller" && openViewProfile && <IconCard />}
                {role === "seller" && openSettings && <IconCard />}

                {role === 'admin' && openNotif && <IconCard/>}
                {role === "admin" && openProfile && <IconCard/>}
                {role === "admin" && openViewProfile && <IconCard/>}
                {role === "admin" && openSettings && <IconCard/>}
            </div>
        </>
    )
}
export default Header;