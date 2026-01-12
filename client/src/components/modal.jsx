import React, { useContext, useState } from "react";

const Model = ({textModal, handleClickNo, handleClickYes})=>{

    return(
        <div className="container-fluid vh-100 position-fixed top-0 "
             style={{background:"rgba(0, 0, 0, 0.594)", zIndex: 100000}}>
            <div className="row justify-content-center mt-5">
                <div className="col-12 col-sm-7 col-md-5 col-lg-4 col-xl-4">
                    <div className="card text-center p-3">
                        <p className="m-0 text-capitalize fw-bold text-start">{"are you sure?"}</p>
                        <p className="m-0 text-capitalize mt-2 p-4 rounded ">{textModal}</p>
                        <div className="mt-3 d-flex justify-content-center px-3">
                            <button className="w-50 rounded border-0 text-capitalize
                            bg-dark me-2 text-light py-1 shadow-sm"  
                             style={{maxWidth:"70px"}} onClick={handleClickNo}>no</button>
                            <button className="w-50 rounded border-0 text-capitalize
                            bg-dark ms-2 text-light py-1 shadow-sm"
                             style={{maxWidth:"70px"}}  onClick={handleClickYes}>yes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Model;