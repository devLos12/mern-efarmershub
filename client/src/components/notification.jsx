import { useBreakpointHeight } from "./breakpoint.jsx";
import icon from "../assets/images/icon.jpg";
import { useContext, useEffect, useState } from "react";
import { appContext } from "../context/appContext.jsx";
import { adminContext } from "../context/adminContext.jsx";
import { sellerContext } from "../context/sellerContext.jsx";
import { userContext } from "../context/userContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";


const Notification = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);
        

    let context;
    
    if (role === "admin") {
        context = admin;
    } else if (role === "seller") {
        context = seller;
    } else if (role === "user") {
        context = user;
    }


    const { notifList, setNotifList, loading, error, setOpenNotif, sellerInfo, userData }  = context;
    const height = useBreakpointHeight();
    const navigate = useNavigate();
    
    const recipientId = role === "seller" ? sellerInfo?._id : userData?._id;
    const [filter, setFilter] = useState("all"); // "all" or "unread"

    // Sort and filter notifications
    const sortedAndFilteredNotifs = notifList
        .filter(notif => {
            if (filter === "unread") {
                return !notif.readBy.includes(recipientId);
            }
            return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifList.filter(notif => !notif.readBy.includes(recipientId)).length;

    const handleReadUpdate = async(id) =>{
        setNotifList((prev) => 
            prev.map((notif) => notif._id === id
                ? {
                    ...notif, 
                    isRead : true, 
                    readBy: notif.readBy ? [...notif.readBy, recipientId] : [recipientId]
                }
                :  notif
            )
        )

        const endPoint = role === "seller"
        ? "sellerReadNotif"
        : "userReadNotif"

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${id}`, 
                {
                    method : "PATCH",
                    credentials: "include"
                }
            )
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            console.log(data.message);
        }catch(err){
            console.log("Error: ", err.message);
        }
    }

    const timeAgo = (date) => {
        if (!date) return "just now";
        const past = new Date(date);
        if (isNaN(past.getTime())) return "just now";

        const now = new Date();
        const diff = Math.floor((now - past) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 172800) return `Yesterday`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if(loading) return <p></p>

    return (
        <div className="container-fluid " 
        style={{height : height-89, overflowY : "auto"}} >
        {notifList.length > 0 ? (
            <>
            <div className="row g-0">
                <div className="col-12 mt-3">
                    <p className="m-0 text-capitalize fw-bold text-success fs-3 px-2">Notification</p>
                    <p className="text-muted px-2 text-muted small fw-bold">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
            </div>

            <div className="row g-0 px-2">
                <div className="col-auto">
                    <button 
                        className={`btn btn-sm text-capitalize border-0 rounded-pill px-3 ${filter === "all" ? "bg-success text-white" : "bg-light text-dark"}`}
                        onClick={() => setFilter("all")}
                    >
                        All
                    </button>
                </div>
                <div className="col-auto ms-2">
                    <button 
                        className={`btn btn-sm text-capitalize border-0 rounded-pill px-3 ${filter === "unread" ? "bg-success text-white" : "bg-light text-dark"}`}
                        onClick={() => setFilter("unread")}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            <div className="row px-2 mt-3">
                {sortedAndFilteredNotifs.length > 0 ? (
                    sortedAndFilteredNotifs.map((data, i) => {
                        const isUnread = !data.readBy.includes(recipientId);
                        
                        return (
                            <div key={i} className={`d-flex my-1 rounded border py-2 px-2
                                ${isUnread ? "bg-success bg-opacity-10 border-success border-opacity-25" : "bg-white border-light"}
                                `} 
                            style={{cursor : "pointer", transition: "all 0.2s"}}  
                            
                            onClick={()=>{

                                if(role === "user"){

                                    if((data.type === "checkout" || data.type === "replacement approved" || data.type === "replacement rejected")){
                                        navigate(`/user/${data.link}`, {state : { orderId : data.meta.orderId }})
                                    } else if (data.type === "system notice"){
                                        setOpenNotif(false);
                                        navigate(`/user/${data.link}`, {state: { productId: data.meta.prodId}})
                                    } 
                                }

                                if(role === "seller"){
                                    if(data.type === "statusApprove"){
                                        setOpenNotif(false);
                                        navigate(`/seller/${data.link}`, { state: { productId: data.meta.prodId } }); 
                                    }else {
                                        setOpenNotif(false);
                                        navigate(`/seller/${data.link}`, {state: { productId: data.meta.prodId}})
                                    }
                                }

                                if (isUnread) {
                                    handleReadUpdate(data._id, recipientId);
                                }

                            }}>
                                
                                <div className="col-3 col-md-2">
                                    {(data.type === "statusApprove") && (
                                        <div className="rounded border shadow-sm" 
                                        style={{width: "55px", height: "55px" , overflow: "hidden"}}
                                        >
                                            <img src={data.meta.imageFile} 
                                            alt={data.meta.imageFile}
                                            className="w-100 h-100"
                                            style={{objectFit: "cover"}}
                                            />
                                        </div>
                                    )}


                                    {(data.type === "system notice") && (
                                        <div className="rounded border shadow-sm" 
                                        style={{width: "55px", height: "55px" , overflow: "hidden"}}
                                        >
                                            <img src={data.meta.imageFile} 
                                            alt={data.meta.imageFile}
                                            className="w-100 h-100"
                                            style={{objectFit: "cover"}}
                                            />
                                        </div>
                                    )}

                                    {(data.type === "checkout" || data.type === "replacement approved" || data.type === "replacement rejected") &&(
                                        <div className="bg-success bg-opacity-10 border border-success border-opacity-25
                                        d-flex align-items-center justify-content-center rounded"
                                        style={{width: "55px", height: "55px"}}
                                        >
                                            <i className="fa fa-shopping-bag fs-4 text-success"></i>
                                        </div>
                                    )}
                                </div>

                                <div className="col">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <p className="m-0 text-capitalize fw-bold small">{data.sender.role === "system" 
                                        ? "System Notice"
                                        : data.sender.role === "user" ? "buyer" : data.sender.role
                                        }</p>
                                        <small className="text-muted" style={{fontSize: "11px"}}>
                                            {timeAgo(data.createdAt)}
                                        </small>
                                    </div>
                                    <p className="m-0 text-capitalize small mt-1" >
                                        {(() => {
                                            const message = data.message;
                                            const match = message.match(/#(\w+)\s/);
                                            if (!match) return message;

                                            const id = match[1];
                                            const [before, after] = message.split(`#${id}`);
                                            return (
                                            <>
                                                {before}
                                                <strong className="text-success">{id}</strong>
                                                {after}
                                        </>
                                        );
                                    })()}
                                </p>
                                </div>
                                <div className="col-1 ">
                                    {isUnread && (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                        <p className="m-0 rounded-circle bg-success shadow" 
                                        style={{width:"10px", height:"10px"}}></p>
                                    </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-5">
                        <i className="fa fa-bell-slash fs-1 text-muted opacity-50 mb-3"></i>
                        <p className="text-capitalize text-muted">No {filter} notifications</p>
                    </div>
                )}
            </div>
            </>
            ):(
                <div className="row justify-content-center d-flex align-items-center "
                style={{height: height-75}}>
                    <div className="col-12 text-center">
                        <i className="fa fa-bell-slash fs-1 text-muted opacity-50 mb-3"></i>
                        <p className="text-capitalize m-0 opacity-75 text-center" >
                            {error.notification || "No notifications yet"}
                        </p>
                    </div>
                </div>
            )
        }
        </div>
    )
}
export default Notification;