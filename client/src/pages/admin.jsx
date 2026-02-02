import { useContext, useEffect, useRef, useState } from "react";
import { Routes, Route, data, Navigate, replace, useLocation} from "react-router-dom";
import Sidebar from "../components/sidebar.jsx";
import Header from '../components/header.jsx';
import Dashboard from "../components/admin/dashboard.jsx";
import Inventory from "../components/inventory.jsx";
import Transactions from "../components/transactions.jsx";
import Settings from "../components/admin/settings.jsx";
import Modal from "../components/modal.jsx";
import { useNavigate } from "react-router-dom";
import { useBreakpoint, useBreakpointHeight } from "../components/breakpoint.jsx";
import { adminContext } from "../context/adminContext.jsx";
import OrderDetails from "../components/orderDetails.jsx";
import TrackOrder from "../components/trackOrder.jsx";
import ProductDetails from "../components/productDetails.jsx";
import Accounts from "../components/admin/accounts.jsx";
import Messages from "../components/messages.jsx";
import InboxChat from "../components/inboxchat.jsx";
import Upload from "../components/seller/upload.jsx";
import Announcement from "../components/admin/annoucement.jsx";
import AddAnnouncement from "../components/admin/addAnnoucement.jsx";
import QrCodes from "../components/admin/qrCodes.jsx";
import { io } from "socket.io-client";
import { appContext } from "../context/appContext.jsx";
import ViewProfile from "../components/admin/viewProfile.jsx";
import TrackReplacementProduct from "../components/trackProduct.jsx";
import ActivityLog from "../components/admin/activityLog.jsx";










//admin file
const Admin = ({setAdminAuth})=>{

    const { setLoadingStateButton, showNotification } = useContext(appContext);

    const { setOrders, setLoading, loading, setError, setAdminInfo, deleteProductModal, 
        setDeleteProductModal, updateStatusModal, setUpdateStatusModal,
        text, inventoryData, Id, setTrigger, exitModal, setExitModal,
        accountsModal, setAccountsModal, deleteOrderModal, setDeleteOrderModal,
        setAccountsData,  editProduct,
        addAnnouncement, setAddAnnouncement, announcementModal, setAnnouncementModal,
        hasIcon
    } = useContext(adminContext);
    
        
    const width = useBreakpoint();
    const height = useBreakpointHeight();
    const navigate = useNavigate();
    const location = useLocation();

    const { setInboxBadge,  inboxBadge, 
                inboxList, setInboxList,
                inboxError, setInboxError,
                inboxLoading, setInboxLoading } = useContext(appContext)


    const getChatsInbox = async() => {

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAdminInboxChat` , { 
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
                return chat.unreadCount?.["admin"] > 0;
            }).length;

            setInboxBadge({
                number: unreadChatsCount,
                show: unreadChatsCount > 0
            });

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
            getChatsInbox();
        })
        
        return () => {
            socket.disconnect();
        };
    }, []);
    

    useEffect(()=>{
        fetch(`${import.meta.env.VITE_API_URL}/api/getAdminInfo`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            setLoading(false);
            setAdminInfo(data.message);
        })
        .catch((err) => {
            setLoading(false);
            console.log("Error: ", err.message);
        })
    },[]);


    //api call for orders;
  
    // api call for notification
    const getNotification = async() =>{

        try{
            const fetchUrl = `${import.meta.env.VITE_API_URL}/api/getNotification`;
            const res = await fetch(fetchUrl, { method : "GET", credentials : "include"});
            
            console.log("Response from admin notification", res.status);
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            setError((prev) => ({...prev,  notification: null}));
            
        }catch(err){
            setError((prev) => ({...prev,  notification: err.message}));
        }
    }
    useEffect(()=>{
        getNotification();
    },[]);


    if(loading) return 

    const routes = [
        {path: '/',                 element: <Dashboard/> },
        {path: 'accounts',          element: <Accounts />},
        {path: 'orderdetails',      element: <OrderDetails/>},
        {path: 'productdetails',    element: <ProductDetails/>},
        {path: 'trackorder',        element: <TrackOrder/>},
        {path: 'inbox',             element: <InboxChat/>},
        {path: 'messages',          element: <Messages/>},
        {path: 'inventory',         element: <Inventory/>, source: "pendings"}, 



        {path: 'announcement',      element: <Announcement/>},
        // {path: 'transactions',      element: <Transactions/>},
        {path: 'payment',           element: <Transactions/>},
        {path: 'payout/seller',     element: <Transactions/>},
        {path: 'payout/rider',      element: <Transactions/>},
        {path: 'qrcodes',           element: <QrCodes/>},
        {path: 'profile',           element: <ViewProfile/>},
        {path: "track-replacement", element: <TrackReplacementProduct/>},
        {path: 'activity-logs',     element: <ActivityLog/>},
        {path: '*',                 element: <Navigate to="/admin"/>},
    ]

    
    return(
        <>
        <Header /> 
        <div className={`container-fluid ${ hasIcon ? "mt-5" : "mt-0"} `}>
            <div className="row ">
                <div className="p-3 d-none d-md-flex border-end bg-dark" 
                style={{width:"210px"}}>
                    <Sidebar />
                </div>
                <div className={`col p-0 bg-warning bg-opacity-10`} 
                style={{height: height - 50, overflowY : "auto"}}>
                    <Routes>
                        {routes.map((data, i)=>(
                            <Route key={i} path={data.path} element={data.element}/>
                        ))}
                    </Routes>
                </div>
            </div>
        </div>
        

        {editProduct?.isShow && <Upload/>}
        {addAnnouncement?.isShow && <AddAnnouncement/>}

        
        {/*delete order with api call */}                 
        {deleteOrderModal?.isShow && <Modal textModal={text}
        handleClickYes={()=> {

            const id = deleteOrderModal?.id;

            fetch(`${import.meta.env.VITE_API_URL}/api/${"deleteAdminOrder"}/${id}`,{
                method: "DELETE",
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
    

         {/* deleting  accounts with api call */}
        {accountsModal?.isShow && <Modal 
         loadingText="deleteing..."
         textModal={text} 
         handleClickYes={()=>{

            setLoadingStateButton(true);

            const id = accountsModal?.id;

            fetch(`${import.meta.env.VITE_API_URL}/api/removeAccounts/${id}`,{
                method: "DELETE",
                credentials: "include"
            })
            .then(res => res.json())
            .then(data => {
                console.log(data.message);
                setAccountsData((accs) => accs.filter((acc) => acc._id !== id));
                setAccountsModal({ isShow: false });
                

                showNotification(data.message, 'success');
            })
            .catch(err => {
                console.error("Error: ", err.message);
                showNotification(err.message, 'error');
            })
            .finally(() => {
                setLoadingStateButton(false);
            })
            ;
        }}
         handleClickNo={()=>setAccountsModal((prev)=>!prev)}
         />}

            

        {/* deleting products with api call */}
        {deleteProductModal && <Modal 
            loadingText="deleteing..."
            textModal={text}
            handleClickYes={()=>{

                setLoadingStateButton(true);
                

                fetch(`${import.meta.env.VITE_API_URL}/api/removeProducts/${inventoryData.deleteProduct.id}`,{
                    method : "DELETE",
                    credentials: "include"
                    })
                .then(res => res.json())
                .then(data => {
                    console.log(data.message)
                    setDeleteProductModal((prev) => !prev);
                    setTrigger((prev) => !prev);

                    if(location.pathname === "/admin/productdetails"){
                        navigate("/admin/inventory");
                    }

                    showNotification(data.message, 'success');

                })
                .catch(err =>{
                    console.error("Error: ", err.message)
                    showNotification(err.message, 'error');
                                        
                })
                .finally(()=> {
                    setLoadingStateButton(false);
                });
            }}
            handleClickNo={()=>setDeleteProductModal((prev)=>!prev)}
         />}


        {/*update status products with api call*/}
        {updateStatusModal && <Modal 

            loadingText="processing..."
            textModal={text} 
            handleClickYes={()=>{
                
                setLoadingStateButton(true);


                fetch(`${import.meta.env.VITE_API_URL}/api/updateStatusApprove/${inventoryData.updateStatus.id}`, {
                    method : "PATCH",
                    headers : {"content-type" : "application/json"},
                    body : JSON.stringify({newStatus : inventoryData.updateStatus.newStatus}),
                    credentials : "include"
                })
                .then(async(res) => {
                    const data = await res.json();
                    if(!res.ok) throw new Error(data.message);
                    return data;
                })
                .then((data) => {
                    console.log(data.message)
                    setUpdateStatusModal((prev) => !prev);
                    setTrigger((prev) => !prev);

                    if(location.pathname === "/admin/productdetails"){
                        navigate("/admin/inventory");
                    }

                    showNotification(data.message, 'success');
                }).catch((err) => {
                    console.log("Error ", err.message);
                    showNotification(err.message, 'error');

                }).finally(()=> {
                    setLoadingStateButton(false);
                });
            }}
            handleClickNo={()=>setUpdateStatusModal((prev) => !prev)}
         />}

        



        {/*delete annoucement with api call */} 
        {announcementModal?.isShow && <Modal 

            loadingText="deleting..."
            textModal={text}
            handleClickYes={()=> {

                setLoadingStateButton(true);

                const id = announcementModal?.id;

                fetch(`${import.meta.env.VITE_API_URL}/api/deleteAnnouncement/${id}`,{
                    method: "DELETE",
                    credentials: "include"
                })
                .then((res) => res.json())
                .then((data) => {
                    setAddAnnouncement((prev) => ({...prev , trigger: !prev.trigger }));
                    setAnnouncementModal((prev) => ({...prev, isShow: false }));
                    


                    showNotification(data.message, 'success');
                })
                .catch((err) => {
                    console.log("Error: ", err.message);
                    showNotification(err.message, 'error');
                })
                .finally(() =>{
                    setLoadingStateButton(false);
                })
            }}
            handleClickNo={() => setAnnouncementModal((prev) => ({...prev, isShow: false }))}
        />}




        {/*exit with api call clearing cookies jwt auth*/}
        {exitModal && <Modal 
        
        textModal={text}
        handleClickYes={()=>{

            setAdminAuth(false);
        
            fetch(`${import.meta.env.VITE_API_URL}/api/logoutAdmin`,{
                method :"GET",
                credentials: "include"
            })
            .then(res => res.json())
            .then(data => {
                navigate("/", { replace: true});
            })
            .catch(err => console.log("Error ",err.message));

            }}
         handleClickNo={()=>setExitModal(false)}/>}
        </>
    )
}
export default Admin;

