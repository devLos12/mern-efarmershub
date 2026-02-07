import React, { useContext } from "react";
import Header from "../components/home/header.jsx";
import { useState, useEffect } from "react";
import LoginForm from "../components/home/loginForm.jsx";
import {Routes, Route, Navigate, useLocation, useNavigate} from 'react-router-dom';
import Register from "../components/home/regForm.jsx";
import Admin from "../pages/admin.jsx";
import User from "../pages/user.jsx";
import Seller from "../pages/seller.jsx";
import  ProtectedRoute   from "../auth/protectedRoute.jsx";
import { MyUserContext } from "../context/userContext.jsx";
import { MySellerContext } from "../context/sellerContext.jsx";
import { MyAdminContext } from "../context/adminContext.jsx";
import { appContext } from "../context/appContext.jsx";
import Home from "../components/home/home.jsx";
import About from "../components/home/about.jsx";
import Footer from "../components/home/footer.jsx";
import ForgotPassword from "../components/home/forgorpassword.jsx";
import SeasonAnnouncement from "../components/user/seasonAnnouncement.jsx";
import BestSellerProducts from "../components/bestSeller.jsx";


// Loading Component
const LoadingScreen = () => {
  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-white">
      <div className="mb-4" style={{
        animation: 'bounce 1s infinite',
      }}>
        <div className="d-flex align-items-center gap-2">
          <img src="https://res.cloudinary.com/dtelqtkzj/image/upload/v1770440242/image-removebg-preview_sfsot1.png" alt="logo"
          style={{width:"55px", height:"55px"}}
          />
        </div>
      </div>
      
      <span className="text-success fw-bold">Loading...</span>

      <style>
        {`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}
      </style>
    </div>
  );
};


//main entry file
const  App = ()=> {
  const {setRole, setId} = useContext(appContext);
  const [isloginVisible, setloginVisible] = useState(false);
  const [isUserAuth, setUserAuth] = useState(false);
  const [isSellerAuth, setSellerAuth] = useState(false);
  const [isAdminAuth, setAdminAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

    
  useEffect(()=>{
    fetch(`${import.meta.env.VITE_API_URL}/api/urlAuthentication`, {
      method: "GET",
      credentials: "include",
    })
    .then(res => res.json())
    .then(data => {
      setRole(data.role);
      setSellerAuth(data.role === "seller");
      setAdminAuth(data.role === "admin");
      setUserAuth(data.role === "user");
    })
    .catch((error) => console.error("Error Fetching Auth: ", error))
    .finally(()=> setIsLoading(false));

  },[]);


  if(isLoading) return <LoadingScreen />;


  const getRedirectPath = () => {
    if(isAdminAuth) return "/admin";
    if(isUserAuth)  return "/user";
    if(isSellerAuth) return "/seller";
    return "/"

  };

  return (
    <Routes>
      <Route path="/" element={
        isAdminAuth || isUserAuth || isSellerAuth  ? <Navigate to={getRedirectPath()}/> : (
          <>
            <Header signIn={()=>setloginVisible(true)}/>

            {isloginVisible && <LoginForm remove={()=>setloginVisible(false)}
              adminAuth={setAdminAuth}
              userAuth={setUserAuth}
              sellerAuth={setSellerAuth}
              />}
            <main>
              {[
                {id : "home",    element: <Home signIn={setloginVisible}/>},
                {id : "seasonal-product", element: <SeasonAnnouncement/>},
                {id : "best-seller", element : <BestSellerProducts signIn={setloginVisible}/>},
                {id : "about",   element: <About/>},
                {id : "faqs",    element: <Footer/>},
                ].map((data, i)=>(
                <section key={i} id={data.id} 
                style={{scrollMarginTop: "80px"}}
                >{data.element}</section>
              ))}
            </main>
           </>
      )}/> 
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>

      <Route path="/admin/*" element={
        <ProtectedRoute isAuthenticated={isAdminAuth}>
          <MyAdminContext>
            <Admin setAdminAuth={setAdminAuth} />
          </MyAdminContext>
        </ProtectedRoute> 
      }/>


      <Route path="/seller/*" element={
        <ProtectedRoute isAuthenticated={isSellerAuth}>
          <MySellerContext>
            <Seller setSellerAuth={setSellerAuth}/>
          </MySellerContext>
        </ProtectedRoute> 
      }/>


      <Route path="/user/*" element={
        <ProtectedRoute isAuthenticated={isUserAuth}>
          <MyUserContext>
            <User setUserAuth={setUserAuth}/>
          </MyUserContext>
        </ProtectedRoute> 
      }/>


      <Route path="*" element={
        <Navigate to={getRedirectPath()}/>
      }/>
    </Routes>
  );
}



export default App;