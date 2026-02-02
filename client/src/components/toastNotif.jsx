import React from 'react';

const Toast = ({ show, message, type, onClose }) => {
    if (!show) return null;
    
    return (
        <>
            {/* Toast Notification - Bottom Left */}
            <div
                className="position-fixed bottom-0 start-0 m-3 animate-slide-up shadow-lg"
                style={{ zIndex: 10000 }}
            >
                <div
                    className={`d-flex align-items-center gap-3 bg-white rounded shadow-lg p-3 border-start border-5 ${
                        type === "success" ? "border-success" : "border-danger"
                    }`}
                    style={{
                        minWidth: "300px",
                        maxWidth: "400px"
                    }}
                >
                    <div>
                        {type === "success" ? (
                            <i className="bx bx-check-circle text-success" style={{ fontSize: "28px" }}></i>
                        ) : (
                            <i className="bx bx-error-circle text-danger" style={{ fontSize: "28px" }}></i>
                        )}
                    </div>
                    <div className="flex-grow-1">
                        <p className={`fw-semibold mb-0 small ${type === "success" ? "text-success" : "text-danger"}`}>
                            {type === "success" ? "Success!" : "Error!"}
                        </p>
                        <p className="small text-muted mb-0">{message}</p>
                    </div>
                    <button
                        className="btn btn-sm btn-link text-muted p-0"
                        onClick={onClose}
                    >
                        <i className="bx bx-x fs-5"></i>
                    </button>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default Toast;