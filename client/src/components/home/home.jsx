import React from "react";
import image from "../../assets/images/home_bg.png"
import { useBreakpoint } from "../breakpoint";

const Home = ({signIn}) => {
    const width = useBreakpoint();


    return (
        <div className="container mt-5"
        >
            <div className="row py-5">
                <div className="col-12 col-md-6 ">
                    <div className="d-flex flex-column align-items-center justify-content-center 
                    h-100 ">
                        <h1 className="text-capitalize text-center fw-bold text-green"
                        style={{fontSize: width <= 1024 ? "2.5rem" : "3.5rem"}}
                        >Welcome To <br/>
                                E-farmers Hub
                        </h1>
                        <p className="m-0 text-success">Buy fresh crops directly from local farmers</p>
                        <button 
                        onClick={()=> signIn(true)}
                        className="mt-3 border-0 px-3 p-1 rounded-3 bg-warning shadow-sm d-flex align-items-center gap-2 ">
                            <i className="fa-solid fa-shopping-cart text-white small"></i>
                            <p className="m-0 fw-bold text-capitalize text-white small"
                            >buy products </p>
                        </button>
                    </div>
                </div>
                <div className="col">
                    <img src={image} alt={image} className="img-fluid"/>
                </div>
            </div>
        </div>
    )
}

export default Home;