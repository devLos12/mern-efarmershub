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
    




    return (
        <appContext.Provider 
        value={{
            id, setId,
            role, setRole,
            inboxBadge, setInboxBadge,
            inboxList, setInboxList,
            inboxError, setInboxError,
            inboxLoading, setInboxLoading ,
            bestSellers, setBestSellers

        }}>{children}
        </appContext.Provider>
    )
}


