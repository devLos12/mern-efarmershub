import { useEffect, createContext, useContext, useState } from "react";

export const appContext = createContext();

export const MyAppContext = ({children}) =>{

    const [id, setId] = useState(null);
    const [role, setRole] = useState(null);
    const [inboxBadge, setInboxBadge] = useState({
        number: null,
        show: false
    })
    const [inboxList, setInboxList] = useState([]);
    const [inboxError, setInboxError] = useState(null);
    const [inboxLoading, setInboxLoading] = useState(false);
    const [bestSellers, setBestSellers] = useState([]);
    
    // ✅ ADD THESE - Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const [loadingStateButton, setLoadingStateButton] = useState(false);


    const [orderBadge, setOrderBadge] = useState({
        number: null,
        show: false
    });

    const [prodBadge, setProdBadge] = useState({
        number: null,
        show: false
    })

    
    // ✅ ADD THIS - Toast function
    const showNotification = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };
         
    // ✅ ADD THIS - Auto-hide toast after 3 seconds
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const [accBadge, setAccBadge] = useState({
        number: null,
        show: false
    })



    const [shippingFee, setShippingFee ] = useState({
        amount: 30,
        updatedBy: "admin",
        updatedAt: null,
        isLoading: true
    });



    useEffect(() => {

        fetch(`${import.meta.env.VITE_API_URL}/api/getShippingFee`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setShippingFee({
            ...data,
            isLoading: false
        }))
        .catch(err => {
                console.log("Error: ", err.message)
                setShippingFee(prev => ({...prev, isLoading: false }))
            } 
        )

    },[]);



    return (
        <appContext.Provider 
        value={{
            id, setId,
            role, setRole,
            inboxBadge, setInboxBadge,
            inboxList, setInboxList,
            inboxError, setInboxError,
            inboxLoading, setInboxLoading,
            bestSellers, setBestSellers,
            // ✅ ADD THESE to the context value
            showToast,
            toastMessage,
            toastType,
            showNotification,
            setShowToast,

            loadingStateButton, setLoadingStateButton,
            orderBadge, setOrderBadge,
            prodBadge, setProdBadge,
            accBadge, setAccBadge,
            shippingFee, setShippingFee

        }}>{children}
        </appContext.Provider>
    )
}