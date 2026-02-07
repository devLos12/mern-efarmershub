import React, { useContext, useRef, useEffect } from "react";
import { useState } from "react";
import IconCard from "./iconcard.jsx";
import { useBreakpoint } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";
import { useNavigate } from "react-router-dom";
import { appContext } from "../../context/appContext.jsx";

const Header = () => {
    const [isMenu, setIsMenu] = useState(false);
    const {openCart, setOpenCart} = useContext(userContext);
    const {openNotif, setOpenNotif} = useContext(userContext);
    const {openProfile, setOpenProfile} = useContext(userContext);
    const {cartBadge, setCartBadge} = useContext(userContext);
    const {notifBadge, setNotifBadge} = useContext(userContext);
    const {openOrder, setOpenOrder} = useContext(userContext);
    const {openMessages, setOpenMessages} = useContext(userContext);
    const {openViewProfile, setOpenViewProfile, userData} = useContext(userContext);
    const {openSettings, setOpenSettings} = useContext(userContext);
    const width = useBreakpoint();
    const navigate = useNavigate();

    const { setInboxBadge, inboxBadge } = useContext(appContext);
    
    // Refs for click outside detection
    const headerRef = useRef(null);
    const iconCardRef = useRef(null);
    
    // Close all modals function
    const closeAllModals = () => {
        setOpenCart(false);
        setOpenNotif(false);
        setOpenProfile(false);
        setOpenOrder(false);
        setOpenMessages(false);
        setOpenViewProfile(false);
        setOpenSettings(false);
    };

    // Click outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if any modal is open
            const isAnyModalOpen = openCart || openNotif || openProfile || 
                                   openOrder || openMessages || openViewProfile || openSettings;
            
            if (!isAnyModalOpen) return;

            // Check if clicked on bg-darken or its children (row, col)
            const bgDarkenElement = event.target.closest('.bg-darken');
            const isClickOnCard = event.target.closest('.bg-light');
            
            // Close if clicked on bg-darken area but NOT on the card itself
            if (bgDarkenElement && !isClickOnCard) {
                closeAllModals();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openCart, openNotif, openProfile, openOrder, openMessages, openViewProfile, openSettings]);
        
    const cart = () => {
        setOpenMessages(false);
        setOpenViewProfile(false);
        setOpenOrder(false);
        setCartBadge((prev) => ({
            ...prev, 
            show : false,
        }));
        setOpenProfile(false);
        setOpenNotif(false);
        setIsMenu(false);
        setOpenCart((prev) => !prev);
    }

    const notif = () => {
        setOpenMessages(false);
        setOpenViewProfile(false);
        setOpenOrder(false);
        setNotifBadge((prev) => ({
            ...prev, 
            show : false,
        }));
        setOpenCart(false);
        setOpenProfile(false);
        setIsMenu(false);
        setOpenNotif((prev) => !prev);
    }

    const profile = ()=> {
        setOpenSettings(false);
        setOpenViewProfile(false);
        setOpenMessages(false);
        setOpenOrder(false);
        setOpenCart(false);
        setOpenNotif(false);
        setIsMenu(false);
        setOpenProfile((prev) => !prev);
    }

    const menu = () =>{
        setOpenViewProfile(false);
        setOpenMessages(false);
        setOpenOrder(false);
        setOpenCart(false);
        setOpenNotif(false);
        setOpenProfile(false);
        setIsMenu((prev) => !prev);
    }
     
    const messages = () => {
        setIsMenu(false);
        setOpenProfile(false);
        setOpenCart(false);
        setOpenOrder(false);
        setOpenNotif(false);
        setOpenMessages((prev) => !prev);
        setInboxBadge((prev) => ({
            ...prev,
            show: false
        }));
    }
        

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        
        // Close mobile menu
        setIsMenu(false);
        
        // Navigate to /user if not there yet
        if (window.location.pathname !== '/user') {
            navigate('/user');
            // Wait for navigation then scroll
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            // Already on page, just scroll
            const element = document.getElementById(sectionId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    
    const links = [
        { id: 'best-seller', label: 'best seller' },
        { id: 'all-products', label: 'all-products' },
        { id: 'seasonal-product',  label: 'seasonal product'},


        // { id: 'fruits',       label: 'Fruits' },
        // { id: 'vegetables',   label: 'Vegetables' },
    ];
        
    
    return (
        <div className="container-fluid position-fixed top-0 end-0 start-0 w-100 g-0 "
        style={{zIndex: 10000}}
        >
            <div ref={headerRef} className="d-flex align-items-center justify-content-between bg-white p-3 px-lg-5 border border-bottom">

                <div className={`bx ${isMenu ? "bx-x" : "bx-menu"} 
                 fs-3 me-3 text-green d-md-none`} 
                onClick={menu} 
                style={{cursor : "pointer"}}></div>

                <div className="d-flex justify-content-between align-items-center gap-1">
                                        
                    <img src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" alt="logo" 
                    style={{width:"30px", height:"30px"}} />
                    
                    <p className="m-0 fs-5 text-capitalize fw-bold text-green mt-1"
                    >farmers hub</p>
                </div>


                <nav className="d-none d-md-block">
                    <ul className="list-unstyled d-flex gap-4 m-0">
                        {links.map((data, i) => (
                            <li key={i}>
                                <a 
                                    className="fw-bold text-decoration-none text-capitalize small text-green" 
                                    href={`#${data.id}`}
                                    onClick={(e) => handleNavClick(e, data.id)}
                                >
                                    {data.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="d-flex align-items-center gap-1" >
                    {[  
                        {icon : "fa fa-shopping-cart", click : cart, isActive: openCart},
                        {icon : "fa fa-bell",          click : notif, isActive: openNotif},
                        {icon: "fa fa-message",        click : messages, isActive: openMessages}
                    ].map((data, i) => (
                    <div key={i} className={`${data.icon} 
                    d-flex align-items-center justify-content-center
                    text-green position-relative fs-5 p-2 rounded-circle
                    ${data.isActive ? "bg-success bg-opacity-10" : ""}
                    `}
                    onClick={data.click} style={{cursor : "pointer", width: "40px", height: '40px'}}>
                        
                        {i === 0 &&  cartBadge.show  && (
                            <p className="position-absolute top-0 end-0  m-3 rounded-circle fw-bold
                                d-flex justify-content-center align-items-center text-white " 
                            style={{fontSize : "10px",
                            width:"17px", height:"17px", background:"red"}}
                            >{cartBadge.number}</p>
                        )}

                        {i === 1 &&  notifBadge.show  && (
                            <p className="position-absolute top-0 end-0  m-3 rounded-circle fw-bold
                                d-flex justify-content-center align-items-center text-white"
                            style={{fontSize : "10px",
                            width:"17px", height:"17px", background:"red"}}
                            >{notifBadge.number}</p>
                        )}

                        {i === 2 &&  inboxBadge.show  && (
                            <p className="position-absolute top-0 end-0  m-3 rounded-circle fw-bold
                                d-flex justify-content-center align-items-center text-white"
                            style={{fontSize : "10px",
                            width:"17px", height:"17px", background:"red"}}
                            >{inboxBadge.number}</p>
                        )}
                    </div>
                    ))}

                    {userData?.imageFile ? (
                        <div className="border border-dark rounded-circle ms-2" 
                        style={{ width: "30px", height: "30px", overflow: "hidden", cursor: "pointer" }}
                        onClick={profile}>
                            <img
                                src={userData?.imageFile}
                                alt={userData?.profile}
                                className="h-100 w-100"
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                    ):(
                        <div className="rounded-circle bg-danger d-flex align-items-center 
                        justify-content-center border-white border" 
                        style={{width: "30px", height: "30px", cursor: "pointer"}}
                        onClick={profile}>
                            <p className="m-0 text-uppercase text-white small">{userData?.firstname.charAt(0)}</p>
                        </div>
                    )}
                </div>
            </div>

            {isMenu && (
                <div className="bg-white p-3 d-block d-md-none vh-100 ">
                    <nav>
                        <ul className="list-unstyled d-flex flex-column gap-3">
                            {links.map((data, i) => (
                                <li key={i}>
                                    <a key={i} className="text-green fw-bold text-decoration-none text-capitalize small" href={data.to}>{data.label}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
            {openCart && <IconCard />}
            {openNotif && <IconCard />}
            {openProfile && <IconCard />}
            {openOrder && <IconCard/>}
            {openMessages && <IconCard/>}
            {openViewProfile && <IconCard/>}
            {openSettings && <IconCard/>}
        </div>
    )
}

export default Header;