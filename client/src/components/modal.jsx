import React, { useContext, useEffect, useState } from "react";
import { appContext } from "../context/appContext";

const Modal = ({ textModal, handleClickNo, handleClickYes, loadingText = "Processing..." }) => {
    const { loadingStateButton } = useContext(appContext);

    
        
    return (
        <div 
            className="container-fluid vh-100 position-fixed top-0 start-0 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0, 0, 0, 0.6)", zIndex: 100000 }}
            onClick={loadingStateButton ? undefined : handleClickNo}
        >
            <div 
                className="card shadow-lg border-0 p-5 text-center animate-scale-in"
                style={{ maxWidth: "400px", width: "90%" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h5 className="fw-bold text-capitalize mb-4">Are you sure?</h5>
                <p className="text-muted mb-4 text-capitalize">{textModal}</p>

                <div className="d-flex gap-2 justify-content-center">
                    <button 
                        className="btn btn-outline-secondary btn-sm px-4 text-capitalize"
                        onClick={handleClickNo}
                        disabled={loadingStateButton}
                    >
                        No
                    </button>
                    <button 
                        className="btn btn-success btn-sm px-4 text-capitalize"
                        onClick={handleClickYes}
                        disabled={loadingStateButton}
                    >
                        {loadingStateButton ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {loadingText}
                            </>
                        ) : (
                            'Yes'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from {
                        transform: scale(0.7);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Modal;