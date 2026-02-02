import { useEffect, useContext, useState } from "react";
import Header from "../components/header.jsx";
import Sidebar from "../components/sidebar.jsx";
import { useBreakpointHeight } from "../components/breakpoint.jsx";
import Modal from "../components/modal.jsx";
import { replace, useLocation, useNavigate } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from "../components/seller/upload.jsx";
// import Transactions from "../components/seller/transactions.jsx";
import { sellerContext } from "../context/sellerContext.jsx";
import Inventory from "../components/inventory.jsx";
import Orders from "../components/orders.jsx";
import { io } from "socket.io-client";
import OrderDetails from "../components/orderDetails.jsx";
import TrackOrder from "../components/trackOrder.jsx";
import ProductDetails from "../components/productDetails.jsx";
import InboxChat from "../components/inboxchat.jsx";
import Messages from "../components/messages.jsx";
import UpadateProfile from "../components/updateProfile.jsx";
import Transactions from "../components/transactions.jsx";
import EditProfile from "../components/editProfile.jsx";
import ChangePassword from "../components/changePassword.jsx";
import { appContext } from "../context/appContext.jsx";




//seller file
const Seller = ({setSellerAuth}) => {
    const { showNotification, setLoadingStateButton } = useContext(appContext);
    const {exitModal,  setExitModal} = useContext(sellerContext);
    const { text, sellerData, sellerInf, loading } = useContext(sellerContext);
    const { setSellerInfo,  setNotifList } = useContext(sellerContext);
    const {sellerUpload,  sellerDeleteModal} = useContext(sellerContext);
    const {setSellerDeleteModal, setTrigger} = useContext(sellerContext);
    const { setLoading, setNotifBadge }= useContext(sellerContext);
    const { setError, setOrders } = useContext(sellerContext);
    const {openUpdateProfile, setOpenUpdateProfile, deleteOrderModal, setDeleteOrderModal,
        hasIcon
    } = useContext(sellerContext);
    const {trigger} = useContext(sellerContext);
    const navigate = useNavigate();
    const location = useLocation();
    const height = useBreakpointHeight();


    const { setInboxBadge,  inboxBadge, 
                    inboxList, setInboxList,
                    inboxError, setInboxError,
                    inboxLoading, setInboxLoading } = useContext(appContext);

    const getChatsInbox = async() => {

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getSellerInboxChat` , { 
                method : "GET", 
                credentials : "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            setInboxLoading(false);
            setInboxError(null);
            setInboxList(data);

             // Count total unread messages - make sure role is lowercase
            const unreadChatsCount = data.filter(chat => {
                return chat.unreadCount?.['seller'] > 0;
            }).length;

            setInboxBadge({
                number: unreadChatsCount,
                show: unreadChatsCount > 0
            });

            console.log(data);

        }catch(err){
            setInboxLoading(false);
            setInboxError(err.message);
            console.log("Error", err.message);
        }

    }



    useEffect(()=>{
        const socket = io(`${import.meta.env.VITE_API_URL}`);
        getChatsInbox();

        socket.on("newChatInbox", (e) => {
            console.log(e.message);
            getChatsInbox();
        })
    }, []);
    

    // //api call for orders
    // useEffect(() => { 
    //     const fetchUrl = `${import.meta.env.VITE_API_URL}/api/getSellerOrders`;
    //     fetch(fetchUrl, { method : "GET", credentials : "include"})
    //     .then(async(res) => {
    //         console.log("Response Status from orders: ", res.status);
    //         const data = await res.json();
    //         if(!res.ok) throw new Error(data.message);
    //         return data;
    //     })
    //     .then((data) => {
    //         setInterval(() => {
    //             setLoading(false);
    //         }, 500);
    //         setError((prev) => ({...prev, orders: null}));
    //         setOrders(data.reverse());
    //     })
    //     .catch((err) => {
    //         setInterval(() => {
    //             setLoading(false);
    //         }, 500);

    //         setOrders([]);
    //         setError((prev) => ({...prev, orders: err.message}));
    //         console.error("Error:", err.message)
    //     });
    // }, []);


    //api call for notification
    const getNotification = async() => {

        try{
            const fetchUrl = `${import.meta.env.VITE_API_URL}/api/getSellerNotification`;
            const res = await fetch(fetchUrl, { method : "GET", credentials : "include"});
            const data = await res.json();
            console.log("Response from notification: ", res.status);
            if(!res.ok) throw new Error(data.message);

            setError((prev) => ({...prev, notification : null}));
            setNotifList(data.reverse())

            const unreadCount = data.filter(notif => notif.isRead === false).length;

            setNotifBadge({
                number: unreadCount,
                show: unreadCount > 0
            });

        }catch(err){
            setNotifList([]);
            setError((prev) => ({...prev, notification : err.message}));
            console.log("Error: ", err.message);
        }
    }


    useEffect(() => {
        const socket = io(`${import.meta.env.VITE_API_URL}`);
        getNotification();

        socket.on("to seller", (e)=> {
            console.log(e.message);

            getNotification();
        })
        return ()=>{
            socket.off("Notification Added");
        }

    },[]);


    //api call for sellerinfo
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getSellerInfo`, {
            method : "GET",
            credentials: 'include'
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            setInterval(() => {
                setLoading(false);
            }, 500);
            setSellerInfo(data);
        }).catch((err) => {
            setInterval(() => {
                setLoading(false);
            }, 500);
            console.log("Error: ", err.message)
        });
    },[trigger]);


    const routes = [
        {path: '/',                        element: <Inventory/>},
        {path: 'orders',                   element: <Orders/>},
        {path: 'inbox',                    element: <InboxChat/>},
        {path: 'messages',                 element: <Messages/>},
        {path: 'orderdetails',             element: <OrderDetails/>},
        {path: 'productdetails',           element: <ProductDetails/>},
        {path: 'trackorder',               element: <TrackOrder/>},
        // {path: 'transactions',             element: <Transactions/>},
        {path: 'payment',                  element: <Transactions/>},
        {path: 'payout',                   element: <Transactions/>},
        {path: 'edit-profile',             element: <EditProfile/>},
        {path: 'change-password',          element: <ChangePassword/>},
        {path: '*',                        element: <Navigate to="/seller"/>},
    ]

    if(loading) return 

    return (
        <>
        <Header/>
        <div className={`container-fluid ${ hasIcon ? "mt-5": "mt-0"}`}>
            <div className="row">
                <div className="p-3 d-none d-md-flex border-end bg-white" 
                style={{width : "210px"}}>
                    <Sidebar />
                </div>
                <div className="col p-0 bg-warning bg-opacity-10" 
                style={{ height : height -50, overflowY : "auto"}}
                >
                    <Routes>
                        {routes.map((data, i) => (
                            <Route key={i} path={data.path} element={data.element}/>
                        ))}
                    </Routes>
                </div>
            </div>
        </div>
        {sellerUpload?.isShow && <Upload/>}
        {openUpdateProfile && <UpadateProfile />}

        
        
        {/*delete order with api call */}                 
        {deleteOrderModal?.isShow && <Modal textModal={text}
        handleClickYes={()=> {

            const id = deleteOrderModal?.id;

            fetch(`${import.meta.env.VITE_API_URL}/api/${"deleteSellerOrder"}/${id}`,{
                method: "PATCH",
                credentials: "include"
            })
            .then((res) => res.json())
            .then((data) => {
                console.log(data.message);
                setOrders((orders) => orders.filter((order) => 
                    order._id !== id
                ))
                setDeleteOrderModal({ isShow: false });
            })
            .catch((err) => console.log("Error: ", err.message))

        }}
        handleClickNo={()=> setDeleteOrderModal((prev) => !prev.isShow)}
        />
        }


        {/*delete product with api call */}
        {sellerDeleteModal && <Modal 
            
            textModal={text} 
            loadingText="deleting ...."
            handleClickYes={()=>{

                setLoadingStateButton(true);
                
                fetch(`${import.meta.env.VITE_API_URL}/api/removeSellerCrops/${sellerData.deleteProduct.id}`,{
                    method : "DELETE",
                    })
                .then(res => res.json())
                .then(data => {
                    setSellerDeleteModal((prev) => !prev);
                    setTrigger((prev) => !prev);

                    if(location.pathname === "/seller/productdetails"){
                        navigate("/", { replace : true});
                    }

                    showNotification(data.message, "success");
                })
                .catch(err => console.error("Error: ", err.message))
                .finally(()=> {
                    setLoadingStateButton(false);
                });
            }}

            handleClickNo={()=>setSellerDeleteModal((prev) => !prev)}
        />}




        {exitModal && <Modal textModal={text}
        handleClickYes={()=>{
            setSellerAuth(false);

            fetch(`${import.meta.env.VITE_API_URL}/api/logoutSeller`,{
                method :"GET",
                credentials: "include"
            })
            .then(res => res.json())
            .then(data => {
                console.log(data.message);
                navigate("/", { replace: true});
            })
            .catch(err => console.log("Error ",err.message));
            }}
        handleClickNo={()=>setExitModal(false)}
        />}
        </>
    )
}

export default Seller;