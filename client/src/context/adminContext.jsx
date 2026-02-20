import { useState, createContext, useEffect } from "react";
import { useLocation } from "react-router-dom";


export const adminContext = createContext();

export const MyAdminContext = ({children}) => {
   
    //admin attributes
    const [text, setText] = useState(null);
    const [textHeader, setTextHeader] = useState("Dashboard");
    const { pathname } = useLocation(); 


    useEffect(() => {
        const parts = pathname.toLowerCase().split("/").filter(Boolean);
        const pathFiltered = parts.length >= 2 ? parts[1]  : parts[parts.length - 1];

        setTextHeader(
            pathFiltered === "admin" 
            ? "Dashboard" 
            : pathFiltered === "orderdetails"  
            ? "order details" 
            : pathFiltered === "trackorder" 
            ? "Track Order" 
            : pathFiltered === "track-replacement" 
            ? "Track Replacement" 
            : pathFiltered === "activity-logs"
            ? "Activity Logs"
            : pathFiltered
        );
    },[pathname]);


    const [accountsModal, setAccountsModal] = useState({
        isShow: false,
        id: ""
    });
    
    const [confirmStatus, setConfirmStatus] = useState(false);
    const [updateStatusModal, setUpdateStatusModal] = useState(false);
    const [deleteProductModal, setDeleteProductModal] = useState(false);
    const [trigger, setTrigger] = useState(false);

    
    const [inventoryData, setInventoryData] = useState({ 
        deleteProduct : { id : "", },
        updateStatus  : { id : "", newStatus : "" }
    });


    const [Id, setId] = useState(({
        account : "",
    }))

    const [openNotif, setOpenNotif] = useState(false);
    const [exitModal, setExitModal] = useState(false);

    const [notifBadge, setNotifBadge] = useState({
        number : 0,
        show  : false
    })
    const [orders, setOrders] = useState([]);
    const [notifList, setNotifList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState({
            notification: "",
            orders : "",
    })

    const [adminInfo, setAdminInfo] = useState(null);
    const [deleteOrderModal, setDeleteOrderModal] = useState({
        isShow: false,
        id: ""
    });
    const [accountsData, setAccountsData] = useState([]);
    
    const [editProduct, setEditProduct] = useState({
        isShow: false,
        data: null
    })
    
    const [addAnnouncement, setAddAnnouncement] = useState({
        trigger: false,
        isShow: false,
        data: {},
    })
    
    const [ announcementModal, setAnnouncementModal ] = useState({
        isShow: false,
        id: null
    })
    const [hasIcon, setHasIcon] = useState(false);
    const [source, setSource] = useState('');  



    
    return (
        <adminContext.Provider 
        value={{
            loading, setLoading,
            Id, setId,
            textHeader, setTextHeader,
            text, setText,
            confirmStatus, setConfirmStatus,
            accountsModal, setAccountsModal,
            updateStatusModal, setUpdateStatusModal,
            deleteProductModal, setDeleteProductModal,
            trigger, setTrigger,
            inventoryData, setInventoryData,
            openNotif, setOpenNotif,
            exitModal, setExitModal,
            notifBadge, setNotifBadge,
            notifList, setNotifList,
            error, setError,
            orders, setOrders,
            adminInfo, setAdminInfo,
            deleteOrderModal, setDeleteOrderModal,
            accountsData, setAccountsData,
            editProduct, setEditProduct,
            addAnnouncement, setAddAnnouncement,
            announcementModal, setAnnouncementModal,
            hasIcon, setHasIcon,
            source, setSource

        }}>{children}
        </adminContext.Provider>
    )
}