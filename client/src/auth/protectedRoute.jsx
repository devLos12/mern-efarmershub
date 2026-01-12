import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  const [userAuth, setUserAuth] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [sellerAuth, setSellerAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true); //  Dapat true sa umpisa


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/urlAuthentication`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setAdminAuth(data.role === "admin");
        setUserAuth(data.role === "user");
        setSellerAuth(data.role === "seller");
      })
      .catch((error) => console.error("Error fetching auth:", error))
      .finally(() => setIsLoading(false)); //  Loading state off after fetch
  }, []);


  if (isLoading) return <p></p>; //  Show loading while waiting
  
  const handlePath = () => {
    if(adminAuth) return "/admin";
    if(userAuth) return "/user";
    if(sellerAuth) return "/seller";
    return "/"

  };

  return isAuthenticated ? children : <Navigate to={handlePath()} />
};


export default ProtectedRoute;
