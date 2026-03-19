import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate();
    

    const contactLinks = [
        { icon: "fa-solid fa-location-dot",  label: "Lupang Ramos Brgy. Lankaan II, Dasmarinas Cavite." },
        { icon: "fa-brands fa-facebook",     label: "https://www.facebook.com/KasamaLR" },
        { icon: "fa-solid fa-envelope",      label: "lupangramoskasama@gmail.com" },
        { icon: "fa-solid fa-phone",         label: "+63 991 137 5276" },
    ]


    const links = [
        {id: 'about',        label: 'About Us'},
        {id: 'best-seller',  label: 'Best Seller'},
        {id: 'seasonal-product',  label: 'Seasonal Product'},
    ];

    const handleNavClick = (e, sectionId) => {
        e.preventDefault();
        
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

    
    return (
        <footer className="bg-dark py-5 mt-5" style={{borderTop: '1px solid #e5e7eb'}}>
            <div className="container">
                <div className="row mb-5">
                    {/* Brand Section */}
                    <div className="col-12 col-md-6 mb-4 mb-md-0">
                        <p className="fw-bold text-green fs-5 mb-2">E Farmers Hub</p>
                        <p className="text-light " style={{lineHeight: '1.6'}}>
                            Empowering farmers with technology and innovation for sustainable agriculture.
                        </p>
                        <div className="d-flex gap-3 mt-3 ">
                            <a href="https://web.facebook.com/KasamaLR" target="_blank" rel="noopener noreferrer" className="text-green text-decoration-none fs-6"><i className="fab fa-facebook"></i></a>
                            <a href="#" className="text-green text-decoration-none fs-6"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="text-green text-decoration-none fs-6"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="text-green text-decoration-none fs-6"><i className="fab fa-linkedin"></i></a>
                        </div>
                    </div>
               
                    {/* Quick Navigation Column */}
                    <div className="col-12 col-md-6 ">
                        <h6 className="fw-bold text-green mb-3" 
                        style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                            Quick Navigation
                        </h6>
                        <ul className="list-unstyled">
                            {links.map((link, i) => (
                                <li key={i} className="mb-2">
                                    <a 
                                        href={`#${link.id}`}
                                        className="text-light text-decoration-none "
                                        onClick={(e) => handleNavClick(e, link.id)}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li className="mb-2">
                                <a href="#" className="text-light text-decoration-none small">Sign in</a>
                            </li>
                        </ul>
                    </div>
                    
                     <div className="col-12 mt-5">
                        <h6 className="fw-bold text-green mb-3" 
                        style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                            Contact Us
                        </h6>
                        {contactLinks.map((link, i) => (
                            <div key={i} className="d-flex align-items-center gap-3 mb-2">
                                <i className={`${link.icon} text-white `}></i>
                                <p className="m-0 text-white">{link.label}</p>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Divider */}
                <div style={{borderTop: '1px solid #e5e7eb', padding: '2rem 0'}} className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                    <p className="text-light small m-0 text-center fs-6">© 2026 E-Farmers Hub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;