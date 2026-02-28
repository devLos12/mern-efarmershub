import React, { useState, useEffect, useContext } from "react";
import Header from "../components/user/header.jsx";
import ItemCardLayout from "../components/user/itemCardLayout.jsx";
import Modal from "../components/modal.jsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Address from "../components/user/address.jsx";
import Checkout from "../components/user/checkout.jsx";
import Footer from "../components/user/footer.jsx";
import { userContext } from "../context/userContext.jsx";
import { io } from "socket.io-client";
import OrderDetails from "../components/orderDetails.jsx";
import TrackOrder from "../components/trackOrder.jsx";
import ProductDetails from "../components/productDetails.jsx";
import Reviews from "../components/user/reviews.jsx";
import Messages from "../components/messages.jsx";
import UpadateProfile from "../components/updateProfile.jsx";
import SeasonAnnouncement from "../components/user/seasonAnnouncement.jsx";
import EditProfile from "../components/editProfile.jsx";
import ChangePassword from "../components/changePassword.jsx";
import { appContext } from "../context/appContext.jsx";
import allProductCards from "../components/user/allProductCards.jsx";
import TrackReplacementProduct from "../components/trackProduct.jsx";
import AllProductCards from "../components/user/allProductCards.jsx";
import BestSellerProducts from "../components/bestSeller.jsx";






const User = ({setUserAuth}) => {
  const { setRole } = useContext(appContext);
  const { openExit, setOpenExit } = useContext(userContext);
  const { text, setNotifList, loading, setLoading } = useContext(userContext);
  const { userData, setUserData } = useContext(userContext);
  const { setNotifBadge } = useContext(userContext);
  const { setCart, setError } = useContext(userContext);
  const { setCartBadge} = useContext(userContext);
  const { setOrders, orders } = useContext(userContext);
  const { openUpdateProfile, trigger, triggerProduct } = useContext(userContext);
  const navigate = useNavigate();
  const { setProducts } = useContext(userContext);


  const { setInboxBadge,  inboxBadge, 
                  inboxList, setInboxList,
                  inboxError, setInboxError,
                  inboxLoading, setInboxLoading } = useContext(appContext);
  

  


  const getChatsInbox = async() => {

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getUserInboxChat` , { 
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
                return chat.unreadCount?.['user'] > 0;
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
            console.log(e.message);
            getChatsInbox();
        })

        return () => {
            socket.disconnect();
        };
    }, []);
    

  // fetch all product;
  useEffect(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/getAllproducts`, {
          method: "GET",
          credentials: "include"
      })
      .then(async(res) => {
          const data = res.json();
          if(!res.ok) throw new Error(data.message);
          return data;
      })
      .then((data) => {
          setProducts(data);
      })
      .catch((err) =>{
          setProducts([]);
          console.log("Error: ", err.message);
      })
  },[trigger, triggerProduct]);



  //api call for orders
  useEffect(()=>{
      fetch(`${import.meta.env.VITE_API_URL}/api/getUserOrders`,{ 
          method : "GET", 
          credentials : "include"
      })
      .then( async(res) => {
          console.log("current status from orders: ",res.status);
          const data = await res.json();
          if(!res.ok) throw new Error(data.message);
          return data;
      })
      .then(data => {
          setTimeout(() => {
            setLoading(false);
          }, 500);
          setError((prev) => ({ ...prev, order : null }));
          setOrders((prev) => ({
            ...prev, 
            data: [...data].reverse(),
            trigger: false
          }));
      })
      .catch(err => {
         setTimeout(() => {
            setLoading(false);
          }, 500);
          setOrders((prev) => ({
            ...prev, data: [], 
            trigger: false
          }));
          setError((prev) => ({ ...prev, order : err.message }));
          console.log("Error: ", err.message);
      });
  },[orders.trigger]);



  //api call for cart 
  useEffect(()=> { 
      fetch(`${import.meta.env.VITE_API_URL}/api/displayCart`,{
        method : "GET",
        credentials : "include"
      })
      .then(async(res) => {
        console.log("current status from cart: ",res.status)
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => {

        setError((prev) => ({ ...prev, cart : null }))
        setCart(data.items);
        setCartBadge((prev) => ({
          ...prev,
          number : data.items.reduce((total, item) => total + item.quantity, 0),
          show : data.items.length > 0
        }))
        
      }).catch((err) => {
        setError((prev) => ({ ...prev, cart : err.message }))
        setCart([]);
        console.log("Error: ", err.message);
      });
  },[]);

  //api call for notification
  const getNotification = async() => {
    try{
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getUserNotification`, 
        { 
          method : "GET", 
          credentials : "include"
        });
      
        const data = await res.json();
        console.log("current status from notification: ",res.status)
        if(!res.ok) throw new Error(data.message);

        
        setError((prev) => ({ ...prev, notification : null}));
        setNotifList(data.reverse());

        
        const unreadCount = data.filter(notif => !notif.readBy.includes(userData?._id)).length;

        setNotifBadge({
            number: unreadCount,
            show: unreadCount > 0
        });
        
    }catch(err){
      setError((prev) => ({ ...prev, notification : err.message}));
      setNotifList([]);
      console.log("Error: ", err.message);
    }
  }

  useEffect(()=> {
    const socket = io(`${import.meta.env.VITE_API_URL}`);
    getNotification();

    socket.on("user notif", (e)=> {
        getNotification();
    })
    return ()=>{
        socket.off("user notif");
    }
  },[userData?._id]);
    
  //api call for userInfo
  useEffect(() => {

    fetch(`${import.meta.env.VITE_API_URL}/api/getInfo`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then( async(res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message)
        return data;
    })
    .then(data => {
      setUserData(data);
    })
    .catch(error => {
      console.error("Error:", error.message);
    });
  }, [trigger]);


  const sections = [
    { id : "seasonal-product",   element : <SeasonAnnouncement/>},
    { id : "best-seller",  element : <BestSellerProducts/>},
    { id : "all-products",  element : <ItemCardLayout title={"all products"} />},
  ] 


  if(loading) return;

  return (
    <Routes>

      <Route path="/*" element={ 
        <>
          <Header/> 

          <Routes>
            <Route path="/" element={
              <main >
                <div className="container g-0">
                  {sections.map((data, i)=>(
                    <section key={i} id={data.id}
                    style={{scrollMarginTop: "80px"}}
                    >{data.element}</section>
                  ))}
                </div>
              </main>
            }/>
            <Route path="productdetails"   element={<ProductDetails/>}/>
            <Route path="all-products"     element={<AllProductCards/>}/>
            <Route path="all-products/productdetails"   element={<ProductDetails/>}/>
            <Route path="*"                element={<Navigate to="/user" /> }/>
          </Routes>

          <Footer/>
          
          {openExit && <Modal textModal={text}
          handleClickNo={()=> setOpenExit(false)}
          handleClickYes={()=> {

              setUserAuth(false);
    
              fetch(`${import.meta.env.VITE_API_URL}/api/logoutUser`,{
                method :"GET",
                credentials: "include"
              })
              .then(res => res.json())
              .then(data => {
                navigate("/", { replace: true});
                setRole(null);

              })
              .catch(err => console.log("Error ",err.message));
          }}/>}

          {openUpdateProfile && <UpadateProfile />}
        </>}
      />

      <Route path="checkout"                  element={<Checkout />}/> 
      <Route path="productdetails/checkout"   element={<Checkout />}/> 
      <Route path="all-products/checkout"   element={<Checkout />}/> 
      <Route path="orderdetails"     element={<OrderDetails/>}/>
      <Route path="trackorder"       element={<TrackOrder/>}/>
      <Route path="address"          element={<Address />}/>
      <Route path="reviews"          element={<Reviews/>}/>
      <Route path="messages"         element={<Messages/>}/>
      <Route path="edit-profile"     element={<EditProfile/>}/>
      <Route path="change-password"  element={<ChangePassword/>} />
      <Route path="track-replacement"  element={<TrackReplacementProduct/>} />

      <Route path="*"                element={<Navigate to="/user" /> }/>
    </Routes>
  );
};

export default User;



