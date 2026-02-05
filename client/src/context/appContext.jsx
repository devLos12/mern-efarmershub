import { useEffect, createContext, useContext, useState } from "react";

export const appContext = createContext();

export const MyAppContext = ({children}) =>{

    const [id, setId] = useState(null);
    const [role, setRole] = useState(null);
    const [inboxBadge, setInboxBadge] = useState({
        number: null,
        show: null
    })
    const [inboxList, setInboxList] = useState([]);
    const [inboxError, setInboxError] = useState(null);
    const [inboxLoading, setInboxLoading] = useState(null);
    const [bestSellers, setBestSellers] = useState([]);
    
    // ✅ ADD THESE - Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const [loadingStateButton, setLoadingStateButton] = useState(false);
    

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

            loadingStateButton, setLoadingStateButton

        }}>{children}
        </appContext.Provider>
    )
}