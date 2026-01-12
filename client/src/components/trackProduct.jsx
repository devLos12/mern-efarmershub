import { useLocation, useNavigate } from "react-router-dom";
import img from "../assets/images/home_bg.png";
import { useContext, useEffect, useState } from "react";
import { appContext } from "../context/appContext";

const TrackReplacementProduct = () => {
    const { role } = useContext(appContext);
    const [trackData, setTrackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const orderId = location?.state?.orderId;
    const itemId = location?.state?.itemId;
    const navigate = useNavigate();

    useEffect(() => {
        const getReplacementTracking = async () => {
            if (!orderId || !itemId) {
                navigate(-1);
                return;
            }
            try {
                setLoading(true);
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/trackReplacement/${orderId}/${itemId}`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                console.log("Fetched data:", data);
                setTrackData(data);
            } catch (error) {
                console.log("Error: ", error.message);
            } finally {
                setLoading(false);
            }
        };
        
        getReplacementTracking();
    }, [orderId, itemId, navigate]);

    if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-success"></div></div>;
    
    if (!trackData) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><p>No tracking data available</p></div>;

    return (
        <>
            <div className={role === "user" ? "bg min-vh-100 d-flex" : "min-vh-100 d-flex px-2"}>
                <div className={`${role === "user" ? "container bg-white" : "container-fluid bg-white"}`}>
                    <div className="row justify-content-center bg-white py-5">
                        <div className="col-12 col-md-5 col-lg-5">
                            {/* Header */}
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <button 
                                    className="btn btn-outline-success"
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="fa fa-arrow-left"></i>
                                </button>
                                <div>
                                    <h5 className="m-0 fw-bold text-capitalize text-success">Track Replacement</h5>
                                    <p className="m-0 small text-muted">Monitor your replacement request status</p>
                                </div>
                            </div>

                            <div className="mt-5">
                                {trackData.history && trackData.history.length > 0 ? (
                                    trackData.history.map((data, i) => (
                                        <div key={data._id || i} className="row">
                                            <div className="col-4 col-md-4 col-lg-3 col-xl-3 col-xxl-2 position-relative">
                                                <div 
                                                    className="fa fa-check-circle fs-6 text-success bg-white rounded-circle"
                                                    style={{ position: "absolute", right: "-9px", top: "3px" }}
                                                ></div>
                                                <div className="text-end me-3 text-md-start me-md-0">
                                                    <p className="m-0 small">{data.date}</p>
                                                    <p className="m-0 small">{data.timestamp}</p>
                                                </div>
                                            </div>
                                            <div className="col border-start ps-4 border-2">
                                                <p className="m-0 text-capitalize fw-bold">
                                                    {data.status}
                                                </p>
                                                <div className="mt-2 mb-4 fs-6">
                                                    <p className="m-0 text-capitalize text-muted small">{data.description}</p>
                                                    
                                                    {/* Show rider info on last status if it's delivery-related */}
                                                    {(data.status === "in transit" || data.status === "delivered") && 
                                                     trackData.rider && 
                                                     i === trackData.history.length - 1 && (
                                                        <div className="d-flex align-items-center gap-2 mt-3 text-muted fw-semibold">
                                                            <i className="fa fa-motorcycle"></i>
                                                            <p className="m-0 text-capitalize small">Rider: {trackData.rider.name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="alert alert-info">
                                        <i className="fa fa-info-circle me-2"></i>
                                        Waiting for admin to review your replacement request
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-12 col-md-5 col-lg-5 col-xl-5 col-xxl-5 mt-5 mt-md-0">
                            <img src={img} alt="tracking illustration" className="img-fluid" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TrackReplacementProduct;