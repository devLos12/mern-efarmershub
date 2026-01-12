import React from "react";


const Footer = () => {
    return (
        <footer className="text-light py-4" style={{background:'#4CAF50'}}>
            <div className="container text-center">
                <p className="mb-0">© 2024 E-Farmers Hub. All rights reserved.</p>
                <div className="d-flex justify-content-center gap-3 mt-2">
                <a href="#" className="text-light text-decoration-none ">Privacy Policy</a>
                <a href="#" className="text-light text-decoration-none">Terms of Service</a>
                <a href="" className="text-light text-decoration-none">Contact Us</a>
                </div>
            </div>
        </footer>
    )
}

export default Footer;