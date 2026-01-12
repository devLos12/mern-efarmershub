import React, { useEffect } from "react";
import style from '../../styles/header.module.css';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

//header file!
const Header = ({signIn, isUserAuthenticated, setAuth})=> {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const navigate = useNavigate();
    
    const links = [
        {id: 'about',        label: 'about'},
        {id: 'best-seller',  label: 'best seller'},
        {id: 'seasonal-product',  label: 'seasonal product'},
        {id: 'faqs',         label: "faq's"}
    ];

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        
        // Close mobile menu
        setMenuVisible(false);
        
        // Navigate to home/landing page if not there yet
        if (window.location.pathname !== '/') {
            navigate('/');
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
    
    return(
        <>
            <div className="container-fluid position-fixed top-0 end-0 start-0 bg-white g-0 z-3">
                <div className="border-bottom border">
                <header className="d-flex align-items-center
                justify-content-between p-3 px-md-5 ">
                    <div className="d-flex justify-content-between align-items-center">
                        <p className="m-0 fs-5 text-capitalize fw-bold text-green"
                        >e farmers hub</p>
                    </div>
                    <nav className="d-none d-md-block">
                        <ul className="list-unstyled d-flex gap-4 m-0">
                        {links.map((link, i) => (
                            <li key={i}>
                                <a 
                                    className="text-decoration-none small text-green fw-bold text-capitalize" 
                                    href={`#${link.id}`}
                                    onClick={(e) => handleNavClick(e, link.id)}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                        </ul>
                    </nav>

                    <button className="btn btn-sm btn-warning d-none d-md-flex gap-2 align-items-center rounded-3 text-white fw-bold"
                    onClick={signIn}>
                        <i className="fa fa-user-circle"></i>
                        Sign in
                    </button>

                    <i className={`bx bx-${isMenuVisible ? "x" : "menu" } fs-2 d-md-none text-green`}
                    onClick={()=> setMenuVisible((prev) => !prev)}
                    style={{cursor: "pointer"}}
                    >
                    </i>
                </header>
                </div>

                {isMenuVisible && (
                    <nav className="d-md-none vh-100 bg-white">
                        <ul className="list-unstyled d-flex flex-column gap-4 m-0 p-3">
                        {links.map((link, i) => (
                            <li key={i}>
                                <a 
                                    className="text-decoration-none small text-green fw-bold text-capitalize" 
                                    href={`#${link.id}`}
                                    onClick={(e) => handleNavClick(e, link.id)}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                            <button className="p-2 shadow-lg bg-warning rounded-3 border-0 text-white fw-bold small text-capitalize"
                            onClick={signIn}
                            >sign in</button>
                        </ul>
                    </nav>
                )}

            </div>
        </>
    );
} 

export default Header;