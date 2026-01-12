import { useLocation, useNavigate } from "react-router-dom";
import img from "../assets/images/home_bg.png";
import { useContext } from "react";
import { appContext } from "../context/appContext";
import { useEffect } from "react";
import { useState } from "react";


const TrackOrder = () => {
    const {role} = useContext(appContext);
    const [trackOrder, setTrackOrder] = useState([]); 
    const location = useLocation();
    const orderId = location.state?.data;
    const navigate = useNavigate();




    // Helper function: Check if status should show rider info
    const shouldShowRiderInfo = (status) => {
        const deliveryStatuses = ["ready to deliver", "in transit", "delivered"];
        return deliveryStatuses.includes(status.toLowerCase());
    };


    const handleChatMessage = async () => {
        
        const senderData = {  
            receiverId  : trackOrder?.rider?._id,
            receiverRole : "Rider"
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getUserChatId`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(senderData),
                credentials: "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            navigate(`/${role}/Messages`, { state: {
                source : "Rider",
                chatId : data.chatId,
                senderId : data.senderId,
                credentials : {
                    id : trackOrder?.rider?._id,
                    name : `${trackOrder?.rider?.firstname} ${trackOrder?.rider?.lastname}`,
                    email : trackOrder?.rider.email,
                    role : "Rider"
                }
            }})


        } catch (error) {
            console.log("Error: ", error.message );
        }

    }



    useEffect(() => {
        const getTrackHistory = async () => {
            
            let endPoint = "";

            if(role === "user"){
                endPoint = "trackOrder";
            } else if (role === "admin") {
                endPoint = "trackAdminOrder";
            } else {
                endPoint = "trackSellerOrder";
            }
            
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${orderId}`,{
                    method: "GEt",
                    credentials: "include"
                })
                const data = await res.json();
                if(!res.ok) throw new Error(data.message);
                console.log(data);
                setTrackOrder(data);
            } catch (error) {
                console.log("Error: ", error.message);
            }
            
        }
        getTrackHistory();
    },[]);



    return (
    <>
    <div className={role === "user" ? "bg min-vh-100  d-flex" : "min-vh-100 d-flex px-2"}>
        <div className={`${role === "user" ? "container bg-white" : "container-fluid bg-white "}`}>
            <div className="row justify-content-center bg-white py-5">
                <div className="col-12 col-md-5 col-lg-5 ">
                    {/* Header */}
                   {/* Header */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <button 
                            className="btn btn-outline-success"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <div>
                            <h5 className="m-0 fw-bold text-capitalize text-success">Track Order</h5>
                            <p className="m-0 small text-muted">Monitor your order status and delivery</p>
                        </div>
                    </div>

                    <div className="mt-5">
                    {trackOrder?.statusHistory?.map((data, i) => (
                        <div key={i} className="row">
                            <div className="col-4 col-md-4 col-lg-3 col-xl-3 col-xxl-2  position-relative">

                                <div className="fa fa-check-circle fs-6 text-success bg-white rounded-circle    "
                                style={{ position: "absolute", right: "-9px", top:"3px"}}></div>

                                <div className="text-end me-3 text-md-start me-md-0" 
                                >
                                    <p className="m-0 small">{data.date}</p>
                                    <p className="m-0 small">{data.timestamp}</p>
                                </div>
                            </div>

                            <div className="col border-start ps-4  border-2  ">
                                <p className="m-0 text-capitalize fw-bold ">{
                                data.status === "confirm" 
                                    ? "confirmed" 
                                    : data.status === "complete" 
                                        ? "completed" 
                                        : data.status}
                                </p>
                                <div className={`mt-2 mb-4 fs-6`}>
                                    <p className="m-0 text-capitalize text-muted small">{data.description}</p>
                                    <p className="m-0 text-capitalize fw-bold small text-muted">{data.location}</p>
                                    
                                    
                                   {shouldShowRiderInfo(data.status) && trackOrder?.rider && (

                                        <>
                                        <div className="d-flex align-items-center gap-2 mt-3 text-muted fw-semibold">
                                            <p className="m-0 text-capitalize small">{trackOrder?.rider?.firstname}</p>
                                            <p className="m-0 text-capitalize small">{trackOrder?.rider?.lastname}</p>

                                       
                                        </div>
                                        <p className="m-0 text-capitalize text-muted small fw-semibold">{trackOrder?.rider.contact}</p>
                                        
                                        
                                        {role === "user" && i === trackOrder?.statusHistory?.length - 1 && (

                                        <button className="mt-2 bg-primary border-0 px-3 p-1 rounded-pill d-flex align-items-center gap-1"
                                        style={{fontSize: "12px"}}
                                        onClick={handleChatMessage}
                                        >
                                        <div className="fa fa-comment text-white"></div>
                                        <p className="m-0 text-capitalize text-white small fw-bold">chat</p>
                                        </button>
                                        )}

                                        </>
                                    )}

                                    {data.imageFile && (
                                        <div className="col-3 mt-4">
                                            <img 
                                            src={
                                                data.status === "refund completed" || 
                                                data.status === "cancelled" ||
                                                data.status === "refund rejected"
                                                ? `${import.meta.env.VITE_API_URL}/api/uploads/${data.imageFile}`
                                                : `${import.meta.env.VITE_API_URL}/api/uploads/rider/${data.imageFile}`
                                            } 
                                            alt={data.imageFile} 
                                            className="img-fluid rounded shadow" />
                                        </div>
                                    )} 
                                
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="col-12 col-md-5 col-lg-5 col-xl-5 col-xxl-5 mt-5 mt-md-0">
                    <img src={img} alt={img} className="img-fluid "/>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};


export default TrackOrder;