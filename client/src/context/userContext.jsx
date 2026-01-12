import { createContext, useState } from "react";

export const userContext = createContext();


export const MyUserContext = ({children}) =>{

        //user attributes 
        const [text, setText] = useState(null);
        const [openCart, setOpenCart] = useState(false);
        const [openNotif, setOpenNotif] = useState(false);
        const [openProfile, setOpenProfile] = useState(false);
        const [openOrder, setOpenOrder] = useState(false);
        const [openMessages, setOpenMessages] = useState(false);
        const [userData, setUserData] = useState({});
        const [openPreview, setPreview] = useState(false);
        const [openTracking, setTracking] = useState(false);
        const [openExit, setOpenExit] = useState(false);
        const [trackId, setTrackId] = useState(null);
        const [checkoutForm, setCheckoutForm] =  useState({});
        const [viewQr, setViewQr] = useState(false);
        const [notifList, setNotifList] = useState([]);
        const [notifBadge, setNotifBadge] = useState(
            { number: 0, 
              show : false }
        );
        const [cartBadge, setCartBadge] = useState(
            { number: 0, 
              show : false }
        );
        
        const [cart, setCart] = useState(false);
        const [loading, setLoading] = useState(true);
        const [trigger, setTrigger] = useState(false);
        const [productTrigger, setProductTrigger] = useState(false);
        const [orders, setOrders] = useState({
            data: [],
            trigger: false
        });

        const [error, setError] = useState({
            cart : "",
            notification : "",
            order : "",
            products: ""
        });
        
        const [openViewProfile, setOpenViewProfile] = useState(false);
        const [openUpdateProfile, setOpenUpdateProfile] = useState(false);
        const [openSettings, setOpenSettings] = useState(false);
        const [products, setProducts] = useState([]);
        const [productDetails, setProductDetails] = useState({});
        



    return (
        <userContext.Provider 
        value={{
            text, setText,
            productTrigger, setProductTrigger,
            openCart, setOpenCart,
            openNotif, setOpenNotif,
            openProfile, setOpenProfile,
            openViewProfile, setOpenViewProfile,
            openOrder, setOpenOrder,
            openMessages, setOpenMessages,
            userData, setUserData,
            openPreview, setPreview,
            openTracking, setTracking,
            openExit, setOpenExit,
            trackId, setTrackId,
            products, setProducts,
            checkoutForm, setCheckoutForm,
            viewQr, setViewQr,
            notifList, setNotifList,
            loading, setLoading,
            notifBadge, setNotifBadge,
            cartBadge, setCartBadge,
            error, setError,
            cart, setCart,
            trigger, setTrigger,
            orders, setOrders,
            openUpdateProfile, setOpenUpdateProfile,
            openSettings, setOpenSettings,

        }}>
            {children}
        </userContext.Provider>
    )
}