import { createContext, useState, useEffect} from "react";
import { useLocation } from "react-router-dom";


export const sellerContext = createContext();


export const MySellerContext = ({children}) => {    
    const [sellerInfo, setSellerInfo] = useState({});
    const [text, setText] = useState(null);
    const [textHeader, setTextHeader] = useState("my crops");
    const { pathname } = useLocation(); 

    useEffect(() => {
        const parts = pathname.toLowerCase().split("/").filter(Boolean);
        const pathFiltered = parts.length >= 2 ? parts[1]  : parts[parts.length - 1];


        let pathFilteredHeader = "";

        if(pathFiltered === "seller"){
            pathFilteredHeader = "my crop";
        } else if (pathFiltered === "orderdetails"){ 
            pathFilteredHeader = "order details";

        } else if (pathFiltered === "trackorder"){
            pathFilteredHeader = "TracK Order";
        } else if (pathFiltered === "productdetails") {
            pathFilteredHeader = "product details";
        } else if (pathFiltered === "edit-profile"){
            pathFilteredHeader = "edit profile";
        } else if (pathFiltered === "change-password") {
            pathFilteredHeader = "change password";

        }else {
            pathFilteredHeader = pathFiltered;
        }


        setTextHeader(pathFilteredHeader);
    },[pathname]);

    const [sellerData, setSellerData] = useState({ deleteProduct : { id : ""}});
    const [sellerUpload, setSellerUpload] = useState({
        isShow: false,
        data: null
    });
    const [sellerDeleteModal, setSellerDeleteModal] = useState(false);
    const [trigger, setTrigger] = useState(false);
    const [openNotif, setOpenNotif] = useState(false);
    const [exitModal, setExitModal] = useState(false);

    const [notifBadge, setNotifBadge] = useState({
        number : 0,
        show  : false
    }); 
    const [orders, setOrders] = useState([]);
    const [notifList, setNotifList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState({
        notification: "",
        orders : "",
    })

    const [openProfile, setOpenProfile] = useState(false);
    const [openViewProfile, setOpenViewProfile] = useState(false);
    const [sellerUpdateProfile, setSellerUpdateProfile] = useState({
        isShow: true,
        data: null
    })
    const [openUpdateProfile, setOpenUpdateProfile] = useState(false);
    
    const [deleteOrderModal, setDeleteOrderModal] = useState({
        isShow: false,
        id: ""
    });
    const [openSettings, setOpenSettings] = useState(false);
    const [hasIcon, setHasIcon] = useState(false);
    const [source, setSource] = useState('');  
    


    return (
        <sellerContext.Provider 
        value={{
            sellerInfo, setSellerInfo,
            text, setText,
            textHeader, setTextHeader,
            sellerData, setSellerData,
            sellerUpload, setSellerUpload,
            sellerDeleteModal, setSellerDeleteModal,
            trigger, setTrigger,
            openNotif, setOpenNotif,
            exitModal, setExitModal,
            notifBadge, setNotifBadge,
            notifList, setNotifList,
            loading, setLoading,
            error, setError,
            orders, setOrders,
            openProfile, setOpenProfile,
            openViewProfile, setOpenViewProfile,
            openUpdateProfile, setOpenUpdateProfile,
            deleteOrderModal, setDeleteOrderModal,
            openSettings, setOpenSettings,
            hasIcon, setHasIcon,
            source, setSource

        }}>{children}
        </sellerContext.Provider>
    )
}