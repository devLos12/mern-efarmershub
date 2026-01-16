import { useContext, useEffect, useState , useMemo, useRef} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { useBreakpointHeight } from "../components/breakpoint.jsx";
import { io } from "socket.io-client";


const InboxChat = () =>{
    const { role } = useContext(appContext);
    
    const navigate = useNavigate();
    const height = useBreakpointHeight();
    const [openMenuId, setOpenMenuId] = useState(null);

    const menuRefs = useRef({});
    const buttonRefs = useRef({});
    const { setInboxBadge,  inboxBadge, 
            inboxList, setInboxList,
            inboxError, setInboxError,
            inboxLoading, setInboxLoading } = useContext(appContext);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openMenuId) return;

            const menuEl = menuRefs.current[openMenuId];
            const buttonEl = buttonRefs.current[openMenuId];

            // Close menu if click is outside both menu and button
            if (
                menuEl &&
                buttonEl &&
                !menuEl.contains(event.target) &&
                !buttonEl.contains(event.target)
            ) {
                setOpenMenuId(null);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId]);


    


    



    const formatTime = (date) => {
        const messageDate = new Date(date);
        const now = new Date();

        const diffHours = Math.floor((now - messageDate) / (1000 * 60 * 60));

        if (diffHours < 24 && now.getDate() === messageDate.getDate()) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };


    const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#20c997"];
    const randomColor = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);



    if(inboxLoading) return <p></p>

    return (
        <div className={"mx-2 d-flex vh-100"} style={{ height : role ==="user" ? height : height-68}}>
            <div className={role === "user" ? "container-fluid bg-light p-2" : "container-fluid bg-light p-2 p-md-4"}>

                <div className="row ">
                    <div className="col-12  ">
                        {/* Header with Back Button for Admin/Seller */}
                        <div className="d-flex align-items-center gap-3 mt-2">
                            {role !== 'user' && (
                                <button 
                                    className="btn btn-outline-success"
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="fa fa-arrow-left"></i>
                                </button>
                            )}
                            <div>
                                <h5 className="m-0 fw-bold text-capitalize text-success d-flex align-items-center">
                                    inbox
                                    <span className="fw-normal ms-2 fs-6 text-muted">{`(${inboxList.length})`}</span>
                                </h5>
                                <p className="m-0 small text-muted">View and manage your conversations</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 mt-2 ">
                    
                    {inboxList.length > 0 ? (
                        inboxList.map((data, i) => {
                            const sender = data.participants.find((p) => p.role.toLowerCase() === role)
                            const receiver = data.participants.find((p) => p.role.toLowerCase() !== role);
                            const displayName = receiver?.accountId?.firstname 
                            ? `${receiver.accountId.firstname} ${receiver.accountId.lastname}`
                            : receiver.role;
                            
                            const isMenuOpen = openMenuId === data._id;

                            return (
                                <div key={i} className={`row g-0 mt-3 rounded-4
                                    ${data.unreadCount[role]  > 0 ? "bg" : "bg-hover"}
                                `} 
                                style={{cursor: "pointer"}}
                                onClick={(e)=> {
                                    e.stopPropagation();

                                    
                                    let endPoint;
                                    if(role === "admin"){
                                        endPoint = "updateMarkAsReadFromAdmin";
                                    } else if (role === "seller") {
                                        endPoint = "updateMarkAsReadFromSeller";
                                    } else {
                                        endPoint = "updateMarkAsReadFromUser";
                                    }
                                    
                                    fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${data._id}`, {
                                        method : "PATCH",
                                        credentials : "include"
                                    })
                                    .then(async(res) => {
                                        const data = await res.json();
                                        if(!res.ok) throw new Error(data.message);
                                        return data;
                                    })
                                    .then((data) => {
                                        console.log(data.message);
                                    })
                                    .catch((err) => console.log("Error:", err.message));

                                    navigate(`/${role}/messages`, { state :  { 
                                        source : receiver.role,
                                        chatId : data._id,
                                        senderId : sender.accountId._id,
                                        credentials : { 
                                            id : receiver.accountId._id,
                                            name : displayName,
                                            email: receiver.accountId.email,
                                            role : receiver.role
                                        }
                                    }})
                                }}>
                                    <div className={`d-flex align-items-center justify-content-between rounded-pill p-2 position-relative 
                                    `}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div className=" rounded-circle d-flex align-items-center justify-content-center text-uppercase fs-3 text-white" 
                                            style={{width:"40px", height:"40px", backgroundColor : randomColor}}>
                                                <p className="m-0">{displayName.charAt(0)}</p>
                                            </div>

                                            <div className="d-flex flex-column ms-2 ms-md-3 ">     
                                                <div className="d-flex align-items-center">
                                                    <p className="m-0 text-capitalize fw-bold 
                                                    ">{displayName}</p>
                                                    <p className="m-0 ms-2 small text-capitalize">
                                                        {`(${receiver.role === "Seller" ? 
                                                            "farmer" : receiver.role === "User" ? 
                                                            "buyer" : receiver.role
                                                        })`}
                                                    </p>
                                                </div>

                                                <div className={`d-flex align-items-center 
                                                    ${data.unreadCount[role] === 0 || data.unreadCount[role] === undefined ? "opacity-75" : "fw-bold"}`}>
                                                    <div className="d-flex align-items-center">
                                                        {data.unreadCount[role] > 1 ? (
                                                        <p className="m-0 small">{`${data.unreadCount[role] > 5
                                                        ? "5+   " : data.unreadCount[role]} new messages`}</p>
                                                        ) : (
                                                            <div className={`d-flex align-items-center`}>
                                                                {sender.accountId._id === data.lastSender && (
                                                                    <p className="m-0 text-capitalize me-2 small">you: </p>
                                                                )}
                                                                <p className="m-0 small">
                                                                    {data.lastMessage.length > 20 
                                                                    ? data.lastMessage.slice(0, 11) + "..."
                                                                    : data.lastMessage}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="d-flex align-items-center">
                                                            <div className="fa fa-circle mx-2" style={{fontSize : "3px"}}></div>
                                                            <p className="m-0 small">{formatTime(data.updatedAt)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        <div
                                        ref={(el) => (buttonRefs.current[data._id] = el )}
                                        className="fa-solid  fa-ellipsis fs-5 text-end  bg-light  rounded-circle d-flex align-items-center justify-content-center border small" 
                                        style={{cursor : "pointer", width : "36px", height : "36px" }} 
                                        onClick={(e)=>{
                                            e.stopPropagation();

                                            setOpenMenuId(isMenuOpen ? null : data._id)
                                        }}></div>

                                        {isMenuOpen && (
                                            <div 
                                            ref={(el) => (menuRefs.current[data._id] = el)} 
                                            className="col-5 mt-5 me-2 position-absolute top-0 end-0 rounded p-2 z-1 bg-white " 
                                            style={{
                                                boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)",
                                                cursor: "default"
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            >
                                                <p className="m-0 small fw-bold text-capitalize p-2 rounded bg-hover d-flex align-items-center gap-1 text-danger"
                                                style={{cursor: "pointer"}} 
                                                onClick={(e)=> {
                                                    e.stopPropagation();

                                                    setInboxList((chats) => 
                                                        chats.filter((chat) => chat._id !== data._id)
                                                    );

                                                    fetch(`${import.meta.env.VITE_API_URL}/api/deleteChat/${data._id}`, {
                                                        method : "PATCH",
                                                        credentials : "include"
                                                    })
                                                    .then((res) => res.json())
                                                    .then((data) => {
                                                        console.log(data.message);
                                                    })
                                                    .catch((err) => console.log("Error: ", err.message))

                                                    setOpenMenuId(null);
                                                }}>
                                                    <i className="bx bx-trash"></i>
                                                    delete</p>
                                                {/* <p className="m-0 small  fw-bold text-capitalize p-2 rounded bg-hover "
                                                style={{cursor: "pointer"}}
                                                onClick={(e)=>{
                                                    e.stopPropagation();
                                                    alert("later ka na mag edit");
                                                    setOpenMenuId(null);
                                                }}>edit</p> */}
                                            </div>
                                        )}
                                    </div>  
                                </div>
                            )
                        })
                    ) : (
                        <div  className="row mt-3 g-0 bg rounded p-5">
                            <div className="col-12 p-5 h-100">
                                <p className="m-0 text-center text-capitalize opacity-75 ">{inboxError || "no messages"}</p>
                            </div>
                        </div>
                    )}                    
                    </div>
                </div>
            </div>
        </div>
    )
}
export default InboxChat;