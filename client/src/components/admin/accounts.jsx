import React, { useContext } from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import io from "socket.io-client";
import { adminContext } from "../../context/adminContext.jsx";
import { useBreakpointHeight } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import AddAccount from "./addAccount.jsx";

//user file
const Accounts =()=>{  
    const {setText, setId, setAccountsModal, accountsData,
        setAccountsData
     } = useContext(adminContext);
    const [error, setError] = useState(null);
    const { trigger } = useContext(adminContext);
    const height = useBreakpointHeight();
    const [loading, setLoading] = useState(true);
    const location = useLocation() || "no data";
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRefs = useRef({});
    const buttonRefs = useRef({});
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [refresh, setRefresh] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
    };

    // Debounce search
    useEffect(()=> {
        const result = setTimeout(()=> {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return ()=> clearTimeout(result);
    },[search]);


   const filteredAccounts = useMemo(()=> {
        let filtered = accountsData;

        // Apply search filter
        if(debouncedSearch) {
            filtered = filtered.filter((account) => {
                const firstname = (account.firstname || "").toLowerCase();
                const lastname = (account.lastname || "").toLowerCase();
                const email = (account.email || "").toLowerCase();
                const accountId = (account.accountId || "").toLowerCase();

                return firstname.includes(debouncedSearch) || 
                    lastname.includes(debouncedSearch) || 
                    email.includes(debouncedSearch) ||
                    accountId.includes(debouncedSearch);
            });
        }

        // Apply verification filter (only for seller and rider)
        if((location.state?.source === "seller" || location.state?.source === "rider") && verificationFilter !== 'all') {
            filtered = filtered.filter((account) => account.verification === verificationFilter);
        }

        return filtered;

    },[accountsData, debouncedSearch, verificationFilter, location.state?.source]);
    
    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

 

    const getVerificationBadge = (status) => {
        const badges = {
            'pending': { bg: 'bg-warning', text: 'Pending', icon: 'fa-clock' },
            'verified': { bg: 'bg-success', text: 'Verified', icon: 'fa-check-circle' },
            'rejected': { bg: 'bg-danger', text: 'Rejected', icon: 'fa-times-circle' }
        };
        
        const badge = badges[status] || badges['pending'];
        
        return (
            <span className={`badge ${badge.bg} d-flex align-items-center gap-1 justify-content-center`} style={{width: 'fit-content'}}>
                <i className={`fa ${badge.icon} small`}></i>
                {badge.text}
            </span>
        );
    };


    const showVerificationFilter = location.state?.source === "seller" || location.state?.source === "rider";

    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openMenuId) return;

            const menuEl = menuRefs.current[openMenuId];
            const buttonEl = buttonRefs.current[openMenuId];

            if (
                menuEl &&
                buttonEl &&
                !menuEl.contains(event.target) &&
                !buttonEl.contains(event.target)
            ) {
                setOpenMenuId(null);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId]);



    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [verificationFilter, debouncedSearch, location.state?.source]);


    useEffect(()=>{

        const loadInitialAccounts = async () => {
            setIsRefreshing(true);

            setVerificationFilter('all');
            await fetchAccounts();
            setTimeout(() => {
                setLoading(false);
                setIsRefreshing(false);
            }, 1500);
        };
        loadInitialAccounts();
    }, [location.state?.source]); 


    
    const handleChat = async(e) =>{

        try{        
            const sendData = {
                receiverId : e._id,
                receiverRole : location.state?.source
            }
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAdminChatId`,{
                method : "POST",
                headers : { "Content-Type" : "application/json" },
                body : JSON.stringify(sendData),
                credentials : "include"
            })
            const data = await res.json();


            if(!data.chatId || !data.senderId) return
 
            navigate("/admin/messages", { state :  { 
                source : location.state?.source,
                chatId : data.chatId,
                senderId : data.senderId,
                credentials : { 
                    id : e._id,
                    name : `${e.firstname} ${e.lastname}`,
                    email : e.email,
                    role : location.state?.source
                }
            }});

        }catch(err){
            console.log("Error: ", err.message);
        }
    }


    const handleViewProfile = (id) => {
        navigate(`/admin/profile`, { 
            state: { 
                accountId: id,
                source: location.state?.source 
            } 
        });
    }

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/getAccounts`,{
                method : "GET",
                credentials: "include"
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            setError(null);

            if(location.state?.source === "user"){
                setAccountsData(data.user.reverse());
            }
            if(location.state?.source === "seller"){
                setAccountsData(data.seller.reverse());
            }
            if(location.state?.source === "rider"){
                setAccountsData(data.rider.reverse());
            }
            if(location.state?.source === "admin"){
                setAccountsData(data.admin.reverse());
            }
        } catch(err) {
            setError(err.message);
            console.log("Error: ", err.message);
        }
    };


  


    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchAccounts();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    const remove = (id)=>{
        setText("do you want to delete?")
        setAccountsModal((prev) => ({...prev, isShow: true, id: id}));
        setId({account : id});
    }

    const Height = () =>{
        if(height < 574) return height ;
        return height-152;
    }


    if(loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{height: Height()}}>
            <div className="text-center">
                <div className="spinner-border text-success mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="small text-muted mb-0">Loading accounts...</p>
            </div>
        </div>
    )


    
    return(
        <>
        <div className="p-2">
            {/* Header Tabs */}
            <div className="row g-0 bg-white border flex-column shadow-sm rounded d-flex align-items-center p-2 px-3 px-lg-4">
                <div className="col">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2">
                        <div 
                        className={`rounded p-2 px-3 d-flex align-items-center transition-all ${
                            location.state?.source === "user" 
                            ? "bg-success text-white shadow-sm" 
                            : "bg-white text-success border border-success border-opacity-25"
                        }`}
                        style={{cursor : "pointer", transition: "all 0.2s ease"}}
                        onClick={()=> {
                            navigate("/admin/accounts", {
                                state : { source : "user"}
                            })
                        }}>
                            <i className="fa fa-user me-2 small"></i>
                            <p className="m-0 text-capitalize small fw-bold d-none d-md-flex">buyer</p>
                        </div>
                        <div 
                        className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${
                            location.state?.source === "seller" 
                            ? "bg-success text-white shadow-sm" 
                            : "bg-white text-success border border-success border-opacity-25"
                        }`}
                        style={{cursor : "pointer", transition: "all 0.2s ease"}}
                        onClick={()=> {
                            navigate("/admin/accounts", {
                                state : { source : "seller"}
                            })
                        }}>
                            <i className="fa fa-store me-2 small"></i>
                            <p className="m-0 small fw-bold d-none d-md-flex">farmer</p>
                        </div>

                        <div 
                        className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${
                            location.state?.source === "rider" 
                            ? "bg-success text-white shadow-sm" 
                            : "bg-white text-success border border-success border-opacity-25"
                        }`}
                        style={{cursor : "pointer", transition: "all 0.2s ease"}}
                        onClick={()=> {
                            navigate("/admin/accounts", {
                                state : { source : "rider"}
                            })
                        }}>
                            <i className="fa fa-bicycle me-2 small"></i>
                            <p className="m-0 small fw-bold d-none d-md-flex">rider</p>
                        </div>

                        {/* <div 
                        className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${
                            location.state?.source === "admin" 
                            ? "bg-success text-white shadow-sm" 
                            : "bg-white text-success border border-success border-opacity-25"
                        }`}
                        style={{cursor : "pointer", transition: "all 0.2s ease"}}
                        onClick={()=> {
                            navigate("/admin/accounts", {
                                state : { source : "admin"}
                            })
                        }}>
                            <i className="fa fa-user-shield me-2 small"></i>
                            <p className="m-0 small fw-bold d-none d-md-flex">admin</p>
                        </div> */}
                        </div>
                        
                        <button 
                        className="d-flex align-items-center px-3 py-2 shadow-sm border-0 gap-2 rounded bg-success text-white"
                        onClick={() => setShowAddModal(true)}
                        style={{transition: "all 0.2s ease"}}
                        >
                            <i className="fa fa-plus small"></i>
                            <p className="m-0 small text-capitalize fw-semibold d-none d-md-flex">add account</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="row g-0 bg-white border border-success border-opacity-25 rounded p-2 px-2 px-lg-4 mt-2 shadow-sm ">
                <div className="col-12 col-md-5">
                    <div className="position-relative">
                        <i className="fa fa-search position-absolute text-success opacity-50" 
                        style={{left: "12px", top: "50%", transform: "translateY(-50%)"}}></i>
                        <input type="search" 
                        placeholder="Search by name, email or Account ID..." 
                        value={search}
                        onChange={(e)=> setSearch(e.target.value)}
                        className="form-control border-success border-opacity-25 ps-5 small"
                        style={{outline: "none"}}/>
                    </div>
                </div>


                <div className="col ">
                        
                        <div className="mt-3 mt-md-0 text-end d-flex justify-content-end gap-2">
                            
                            {showVerificationFilter && (
                            <select 
                                className="form-select form-select-sm border-success border-opacity-25 small"
                                style={{width: "auto"}}
                                value={verificationFilter}
                                onChange={(e) => setVerificationFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            )}
                            
                            
                            <button 
                            className="d-flex align-items-center px-3 py-1 shadow-sm border gap-2 rounded "
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            >
                                <i className={`fa fa-sync small ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                <p className="m-0 small text-capitalize">{isRefreshing ? 'Refreshing...' : 'Refresh'}</p>
                            </button>
                       
                        </div>
                        <p className="m-0 small text-end text-muted mt-2 opacity-50 fw-semibold ">
                            <i className="fa fa-filter me-1"></i>
                            {`${filteredAccounts.length} from ${accountsData.length} Total`}
                        </p>
                </div>

             
            </div>

            {/* Table with Horizontal Scroll */}
            { filteredAccounts.length > 0 ? (
                <>
                <div className="mt-2 bg-white rounded shadow-sm border border-success border-opacity-25 position-relative"  
                style={{overflowX: "auto", overflowY: "hidden"}}>
                    {isRefreshing && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" 
                            style={{ zIndex: 10 }}>
                            <div className="text-center">
                                <div className="spinner-border text-success mb-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="small text-muted mb-0">Refreshing accounts...</p>
                            </div>
                        </div>
                    )}
                    
                    <table className="w-100" style={{minWidth: "800px"}}>
                    <thead className="position-sticky top-0 z-1 bg-white">
                        <tr>
                            {location.state?.source === "admin" ? (
                                // Admin table headers
                                ["Account ID", "Email", "Contact Number", "Admin Type", "Created At", "Action"].map((data, i)=> (
                                    <th className={`text-capitalize p-3 text-success small fw-bold text-nowrap
                                    ${i < 5 ? "text-start" : "text-center"}`} 
                                    key={i} >{data}</th>
                                ))
                            ) : location.state?.source === "user" ? (
                                // Buyer table headers (no verification)
                                ["Account ID", "Buyer Name", "Email", "Created At", "Message", "Action"].map((data, i)=> (
                                    <th className={`text-capitalize p-3 text-success small fw-bold text-nowrap
                                    ${i < 4 ? "text-start" : "text-center"}`} 
                                    key={i} >{data}</th>
                                ))
                            ) : (
                                // Seller/Rider table headers (with verification)
                                ["Verification Status", "Account ID", 
                                    `${location.state?.source === "seller" ? "Farmer" : "Rider"} Name`, 
                                    "Email", "Created At", "Message","Action"
                                ].map((data, i)=> (
                                    <th className={`text-capitalize p-3 text-success small fw-bold text-nowrap
                                    ${i < 5 ? "text-start" : "text-center"}`} 
                                    key={i} >{data}</th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((data, i) => {
                            const isMenuOpen = openMenuId === data._id;
                            const isAdmin = location.state?.source === "admin";
                            const isBuyer = location.state?.source === "user";
                            const needsVerification = location.state?.source === "seller" || location.state?.source === "rider";
                            
                            return (
                            <tr key={i} className="border-bottom border-success border-opacity-10"
                            style={{transition: "background-color 0.2s ease"}}
                            >
                                {isAdmin ? (
                                    // Admin row layout
                                    <>
                                        <td className="small text-start ps-3 p-3 fw-bold text-nowrap" style={{color: "#2d3748"}}>
                                            {data.accountId || "N/A"}
                                        </td>
                                        <td className="small text-start ps-3 text-lowercase p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {data.email}
                                        </td>
                                        <td className="small text-start ps-3 p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {data.contact || "N/A"}
                                        </td>
                                        <td className="small text-start ps-3 p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            <span className={`badge ${data.adminType === 'main' ? 'bg-success' : 'bg-secondary'}`}>
                                                {data.adminType ? data.adminType.toUpperCase() : "SUB"}
                                            </span>
                                        </td>
                                        <td className="small text-start ps-3 p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {data.createdAt ? formatDate(data.createdAt) : "N/A"}
                                        </td>
                                        <td className="p-3 position-relative">
                                            <div 
                                            ref={(el) => (buttonRefs.current[data._id] = el )}
                                            className="position-relative mx-auto d-flex align-items-center
                                            justify-content-center shadow-sm border rounded-circle bg-white "
                                            onClick={(e) => {
                                                setOpenMenuId(isMenuOpen ? null: data._id);
                                            }}
                                            style={{
                                                cursor: "pointer", 
                                                width: "32px", 
                                                height: "32px",
                                                transition: "all 0.2s ease"
                                            }}
                                            >
                                                <i className="fa fa-ellipsis"></i>

                                                {isMenuOpen && (
                                                    <div 
                                                    ref={(el) => (menuRefs.current[data._id] = el)} 
                                                    className="card position-absolute top-100 end-0 p-2 z-1 border border-success border-opacity-25"
                                                    style={{
                                                        width: "220px", 
                                                        cursor: "default",
                                                        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)",

                                                    }}
                                                    onClick={(e)=> e.stopPropagation()}
                                                    >
                                                        <div className="px-2 rounded 
                                                        text-capitalize p-2 d-flex align-items-center gap-2"
                                                        style={{
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={()=> {
                                                            handleViewProfile(data._id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        >
                                                            <i className="fa fa-user text-primary"></i>
                                                            <p className="m-0 capitalize small text-primary">view profile</p>
                                                        </div>
                                                        <div className="px-2 rounded 
                                                        text-capitalize p-2 d-flex align-items-center gap-2"
                                                        style={{
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={()=> {
                                                            remove(data._id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        >
                                                            <i className="bx bx-trash text-danger "></i>
                                                            <p className="m-0 capitalize small text-danger">delete</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    // Other roles row layout
                                    <>
                                        {needsVerification && !isBuyer && !isAdmin &&  (
                                            <td className="small text-start ps-3 p-3 text-nowrap" style={{color: "#2d3748"}}>
                                                {getVerificationBadge(data.verification || "pending")}
                                            </td>
                                        )}

                                        <td className="small text-start ps-3 p-3 fw-bold text-nowrap" style={{color: "#2d3748"}}>
                                            {data.accountId || "N/A"}
                                        </td>
                                        <td className="small text-start ps-3 text-capitalize p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {`${data.firstname} ${data.lastname}`}
                                        </td>
                                        <td className="small text-start ps-3 text-lowercase p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {data.email}
                                        </td>
                                        <td className="small text-start ps-3 p-3 text-nowrap" style={{color: "#2d3748"}}>
                                            {data.createdAt ? formatDate(data.createdAt) : "N/A"}
                                        </td>
                                        <td className="py-3 text-center">
                                           <button 
                                           className="text-capitalize px-3 py-1 bg-primary shadow-sm border-0  text-white small text-nowrap"
                                            style={{
                                                outline : "none", 
                                                borderRadius: "20px",
                                                transition: "all 0.2s ease"
                                            }}
                                            onClick={()=>handleChat(data)}>
                                                <i className="fa fa-comment me-1 small"></i>
                                                chat
                                            </button>
                                        </td>
                                        <td className="p-3 position-relative">
                                            <div 
                                            ref={(el) => (buttonRefs.current[data._id] = el )}
                                            className="position-relative mx-auto d-flex align-items-center
                                            justify-content-center shadow-sm border rounded-circle bg-white "
                                            onClick={(e) => {
                                                setOpenMenuId(isMenuOpen ? null: data._id);
                                            }}
                                            style={{
                                                cursor: "pointer", 
                                                width: "32px", 
                                                height: "32px",
                                                transition: "all 0.2s ease"
                                            }}
                                            >
                                                <i className="fa fa-ellipsis"></i>

                                                {isMenuOpen && (
                                                    <div 
                                                    ref={(el) => (menuRefs.current[data._id] = el)} 
                                                    className="card position-absolute top-100 end-0 p-2 z-1 border border-success border-opacity-25"
                                                    style={{
                                                        width: "220px", 
                                                        cursor: "default",
                                                        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)",

                                                    }}
                                                    onClick={(e)=> e.stopPropagation()}
                                                    >
                                                        <div className="px-2 rounded 
                                                        text-capitalize p-2 d-flex align-items-center gap-2"
                                                        style={{
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={()=> {
                                                            handleViewProfile(data._id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        >
                                                            <i className="fa fa-user text-primary"></i>
                                                            <p className="m-0 capitalize small text-primary">view profile</p>
                                                        </div>
                                                        <div className="px-2 rounded 
                                                        text-capitalize p-2 d-flex align-items-center gap-2"
                                                        style={{
                                                            cursor: "pointer",
                                                            transition: "background-color 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={()=> {
                                                            remove(data._id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        >
                                                            <i className="bx bx-trash text-danger "></i>
                                                            <p className="m-0 capitalize small text-danger">delete</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )})}
                    </tbody>
                    </table>
                </div>

                {/* Responsive Pagination Controls using Bootstrap Grid */}
                <div className="row g-0 border-top bg-white rounded-bottom shadow-sm">
                    <div className="col-12 col-lg-6 p-3 ">
                        <div className="text-muted small text-center text-lg-start  ">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAccounts.length)} of {filteredAccounts.length} accounts
                        </div>
                    </div>
                    
                    <div className="col-12 col-lg-6 p-3 d-flex justify-content-lg-end justify-content-center">
                        <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
                            <button 
                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}>
                                <i className="fa fa-chevron-left"></i>
                                <span className="ms-2 small d-none d-lg-block">Previous</span>
                            </button>
                            
                            <div className="d-flex gap-1 flex-wrap justify-content-center">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    if (pageNumber === 1 || pageNumber === totalPages || 
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                style={{ minWidth: "35px" }}>
                                                {pageNumber}
                                            </button>
                                        );
                                    } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                        return <span key={pageNumber} className="px-2 d-flex align-items-center">...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            
                            <button 
                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}>
                                <span className="me-2 small d-none d-lg-block">Next</span>
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                </>
                ):(
                    <div className="row shadow-sm border border-success border-opacity-25 justify-content-center align-items-center bg-white rounded g-0 p-5 mt-2">
                        <div className="col-md-4 text-center">
                            <div className="mb-3">
                                <i className="fa fa-inbox text-success opacity-25" style={{fontSize: "48px"}}></i>
                            </div>
                            <p className="m-0 text-capitalize text-success fw-semibold">
                                {search ? "no accounts found" : error ?? "no accounts"}
                            </p>
                            {search && (
                                <p className="m-0 small text-success opacity-75 mt-2">
                                    Try adjusting your search terms
                                </p>
                            )}
                        </div>
                    </div>
                )
            }        
        </div>

        {/* Add Account Modal */}
        <AddAccount 
            isOpen={showAddModal} 
            onClose={() => setShowAddModal(false)}
            onSuccess={() => handleRefresh()}
        />
        </>
    )
}
export default Accounts;