import React from "react";


const Messages = ({setOpenMessages, setOpenProfile}) =>{
    const hanldeArrowBack = ()=>{
        setOpenMessages(false);
        setOpenProfile(true);
    }
        
    return (
        <div className="container mt-3">
            <div className="row">
                <div className="col ">
                    <i className="fa-solid fa-arrow-left" 
                    style={{cursor:"pointer"}} onClick={hanldeArrowBack}></i>
                </div>
                <div className="col">
                    <p className="m-0 text-capitalize text-end fw-bold">Messages</p>
                </div>
            </div>
            <div className="row mt-5">
                <div className="col">
                    <p className="m-0 fs-4 fw-bold text-capitalize">i miss you uwu</p>
                </div>
            </div>
         </div>
    )
}
export default Messages;