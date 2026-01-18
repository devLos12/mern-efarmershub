import React, { useEffect, useMemo, useState } from "react";
import { useContext } from "react";
import img from "../assets/images/carlos.png";
import { useBreakpoint, useBreakpointHeight } from "./breakpoint.jsx";
import { userContext } from "../context/userContext.jsx";
import { useActionData, useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext.jsx";
import { sellerContext } from "../context/sellerContext.jsx";
import { adminContext } from "../context/adminContext.jsx";
import ViewProfile from "./viewProfile.jsx";




const Profile = ()=>{
    const {role} = useContext(appContext);
    const seller = useContext(sellerContext);
    const user = useContext(userContext);
    const admin = useContext(adminContext);

    let context = "";

    if (role === "admin") {
        context = admin;
    } else if (role === "seller") {
        context = seller;
    } else if (role === "user") {
        context = user;
    }

    const {userData, openOrder, setOpenOrder, openProfile, setOpenProfile, setOpenExit ,
         setOpenMessages, setText, sellerInfo, setExitModal, setOpenViewProfile,
         setOpenUpdateProfile, setOpenSettings
    } = context;
    


    const width = useBreakpoint();
    const height = useBreakpointHeight();
    const navigate = useNavigate();



    const chatWithUs = async() =>{

        try{
            const senderData = {
                receiverId: "unknown",
                receiverRole: "admin"
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getUserChatId`, {
                method : "POST",
                headers : { "Content-Type": "application/json"},
                body: JSON.stringify(senderData),
                credentials : "include"
            })
            const data = await res.json();
            
            navigate("/user/messages", { state : {
                source : "admin",
                chatId : data.chatId,
                senderId : data.senderId,
                credentials : {
                    id : data.receiverId,
                    name : "admin",
                    email: data.email,
                    role : "admin"
                }
            }})

        }catch(err){
            console.log("Error: ", err.message);
        }
    }


    const viewProfile = () => {
        setOpenProfile(false);
        setOpenViewProfile(true);
    }


    const order = ()=>{
        setOpenMessages(false);
        setOpenProfile(false);
        setOpenOrder(true);
    }

    
    const messages = () => {
        setOpenProfile(false);
        setOpenOrder(false);
        setOpenMessages(true);
    }
    

    const settings = () =>{ 
        setOpenProfile(false);
        setOpenSettings(true);
    }


    const logOut = () =>{
        setText("do you want to exit?");
        
        if(role === "user") {
            setOpenExit(true);
        } else {
            setExitModal(true);
            
        }
    }


    let dataProfile = {
        profile: "", 
        name: "",
        email: ""
    }


    if(role === "user") {
        dataProfile = {
            profile: userData?.imageFile,
            name: `${userData?.firstname} ${userData?.lastname}`,
            email: userData?.email    
        }
    } else if (role === "seller"){
        dataProfile = {
            profile: sellerInfo?.imageFile,
            name: `${sellerInfo?.firstname} ${sellerInfo?.lastname}`,
            email: sellerInfo?.email    
        }
    }


    const ProfileLinks = {
        user : [
            {value : "My Orders",         icon : "fa-solid fa-shopping-bag",       action : order},
            {value : "settings",          icon : "fa-solid fa-gear",               action : settings},
            {value : "Chat with us",      icon : "fa-solid fa-message",            action : chatWithUs},
            {value : "Log-out",           icon : "fa-solid fa-right-from-bracket", 
            action : logOut},
        ],
        seller: [
            {value : "settings",          icon : "fa-solid fa-gear",              action : settings},
            {value : "Log-out",           icon : "fa-solid fa-right-from-bracket", 
            action : logOut},
        ]
    }

    const dataLinks = ProfileLinks[role || []];
        
        
    return(
        <>
        <div className="container-fluid ">
            <div className="row rounded p-2" style={{maxHeight : height-100, overflowY:"auto"}}>
                <div className="col-12  py-3 rounded  shadow-sm border">
                    <div className="row ">
                        <div className="d-flex align-items-center gap-4">
                            {dataProfile?.profile ? (
                                <div className="border border-white rounded-circle" 
                                style={{ width: "50px", height: "50px", overflow: "hidden" }}
                                >
                                    <img
                                        src={dataProfile?.profile}
                                        alt={dataProfile?.profile}
                                        className="h-100 w-100"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                            ):(
                                <div  style={{width:"50px", height:"50px"}} className=" rounded-circle bg-danger d-flex justify-content-center align-items-center fs-2 text-white text-uppercase">{
                                    role === "user" ? userData?.firstname?.charAt(0) : sellerInfo?.firstname.charAt(0)    
                                }</div>
                            )}

                            <div>
                                <p className="m-0 text-capitalize fs-5 fw-bold">{dataProfile?.name}</p>
                                <p className="m-0 small">{`${dataProfile?.email}`}</p>
                            </div>
                        </div>
                    
                        <div className="col-12 mt-3">
                            <div className="d-flex aling-items-center gap-2">
                                <button className="d-flex align-items-center justify-content-center px-3 p-2 shadow-sm  
                                rounded-3 w-100 border bg-dark gap-2" 
                                style={{outline: "none"}}
                                onClick={viewProfile}
                                >
                                    <p className="m-0 text-capitalize small text-white">view profile</p> 
                                    <i className="fa fa-user-circle small text-white"></i>
                                </button>
                            </div>
                        </div>
                    </div>  
                </div>

                <div className="col  rounded mt-3">
                    {dataLinks.map((data, i) => (
                        <div key={i} className="row mt-1 shadow-sm border py-3 rounded bg-hover"
                        onClick={data.action} 
                        style={{ cursor:"pointer"}}>
                            <div className="col-1 ">
                                <i className={`${data.icon} small`}></i>
                            </div>
                            <div className="col " >
                                <p className="m-0 text-capitalize small " >{data.value}</p>
                            </div>
                            <div className="col-1 me-2 text-end">
                                <i className="fa-solid fa-chevron-right  opacity-75 small"></i>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </>
    )
}
export default Profile;