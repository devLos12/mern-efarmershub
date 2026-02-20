import React, { useContext, useState } from "react";
import { useEffect } from "react";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { appContext } from "../context/appContext";
import ProductCard from "./productcard.jsx";
import img from "../assets/images/nodata.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useBreakpointHeight } from "./breakpoint.jsx";
import ListReports from "./admin/listReports.jsx";
import { io } from "socket.io-client";
import Toast from "./toastNotif.jsx";





const Inventory = () => {
    const { role, showToast, toastMessage, toastType,  setShowToast } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller;
    const { trigger, sellerInfo, setSellerUpload } = context;

    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stockStatus, setStockStatus] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();
    const height = useBreakpointHeight();
    const location = useLocation();





    // Get current view from location state (products or list-report)
    const currentView = location.state?.view || "products";
    
    // Get unique categories from products
    // const uniqueCategories = [...new Set(products.map(p => p.category?.toLowerCase()).filter(Boolean))];
    const uniqueCategories = ["all", "grains", "root crops", "fruits", "fruit vegetables", "leafy vegetables", "legumes"];;



    
    useEffect(() => {
        if (role === "admin" && !location?.state?.source && !location?.state?.view) {
            navigate(location.pathname, {
                replace: true,
                state: { source: "pending", view: "products" }
            });
        }
    }, [location.state, location.pathname, navigate, role]);


    // Fetch products function
    const fetchProducts = async () => {
        if (role === "seller" && !sellerInfo._id) return;
        try {
            if(isRefreshing){
                setLoading(true);
            }

            const fetchUrl =
                role === "admin"
                    ? `${import.meta.env.VITE_API_URL}/api/getProducts`
                    : `${import.meta.env.VITE_API_URL}/api/getSellerProduct/${sellerInfo._id}`;

            const res = await fetch(fetchUrl, { 
                method: "GET", 
                credentials: "include" 
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message);

            setProducts(data);
            setError(null);
        } catch (err) {
            setProducts([]);
            setError(err.message);
            console.log("Error: ", err.message);
        } finally {
            setLoading(false);
        }
    };


    // Initial fetch
    useEffect(() => {
        fetchProducts();
    }, [trigger, role === "seller" && sellerInfo]);

    
    // Socket.IO - Real-time product updates for admin
    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL);

        socket.on('product:uploaded', (data) => {
            // Refresh products list
            fetchProducts();
        });

        socket.on('product:updated', (data) => {
            // Refresh products list
            fetchProducts();
        });

        socket.on('product:updateStatus', (data) => {
            console.log(data.message);
            fetchProducts();
        })

        socket.on('product:deleted', (data) => {
            fetchProducts();
        })

        return () => {
            socket.disconnect();
        };
    }, [role]);

    
    // Refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchProducts();
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };


    let approvalStatus = null;
    let filteredProducts = [];

    if (role === "admin") {
        approvalStatus = location?.state?.source;
        
        // Filter by approval status
        if (approvalStatus === "pending") {
            filteredProducts = products.filter((p) => p.statusApprove === "pending");
        } else if (approvalStatus === "approved") {
            filteredProducts = products.filter((p) => p.statusApprove === "approved");
        } else if (approvalStatus === "rejected") {
            filteredProducts = products.filter((p) => p.statusApprove === "rejected");
        } else {
            filteredProducts = products;
        }

        // Filter by category - dynamic matching
        if (categoryFilter !== "all") {
            filteredProducts = filteredProducts.filter((p) => 
                p.category?.toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Filter by stock status
        if (stockStatus === "available") {
            filteredProducts = filteredProducts.filter((p) => p.stocks > 0);
        } else if (stockStatus === "outofstock") {
            filteredProducts = filteredProducts.filter((p) => p.stocks === 0);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            filteredProducts = filteredProducts.filter((p) =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

    } else {
        // SELLER FILTERING LOGIC
        approvalStatus = location?.state?.source;

        // Filter by approval status
        if (approvalStatus === "pending") {
            filteredProducts = products.filter((p) => p.statusApprove === "pending");
        } else if (approvalStatus === "approved") {
            filteredProducts = products.filter((p) => p.statusApprove === "approved");
        } else if (approvalStatus === "rejected") {
            filteredProducts = products.filter((p) => p.statusApprove === "rejected");
        } else {
            filteredProducts = products;
        }

        // Filter by category - dynamic matching
        if (categoryFilter !== "all") {
            filteredProducts = filteredProducts.filter((p) => 
                p.category?.toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        
        // Filter by stock status
        if (stockStatus === "available") {
            filteredProducts = filteredProducts.filter((p) => p.stocks > 0);
        } else if (stockStatus === "outofstock") {
            filteredProducts = filteredProducts.filter((p) => p.stocks === 0);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            filteredProducts = filteredProducts.filter((p) =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    }


    if(loading) return (
        <div className="d-flex align-items-center justify-content-center h-100" 
        >
            <div className="text-center">
                <div className="spinner-border text-success mb-2" role="status">
                </div>
                <p className="small text-muted mb-0">Loading Inventory...</p>
            </div>
        </div>
    )




    return (
        <>
            <div className="p-2">

                {/* NEW: Main Tab Navigation (Products / List & Report) - Admin Only */}
                {role === "admin" && (
                    <div className="row g-0 bg-white rounded border mb-2 p-2 ">
                        <div className="d-flex gap-2">
                            <button
                                className={`btn btn-sm px-4 text-capitalize fw-semibold ${
                                    currentView === "products" 
                                        ? "btn-success" 
                                        : "btn-outline-secondary"
                                }`}
                                onClick={() => navigate("/admin/inventory", { 
                                    state: { view: "products", source: location.state?.source || "pending" } 
                                })}
                            >
                                <i className="fa-solid fa-box me-2"></i>
                                Products
                            </button>
                            <button
                                className={`btn btn-sm px-4 text-capitalize fw-semibold ${
                                    currentView === "list-report" 
                                        ? "btn-success" 
                                        : "btn-outline-secondary"
                                }`}
                                onClick={() => navigate("/admin/inventory", { 
                                    state: { view: "list-report" } 
                                })}
                            >
                                <i className="fa-solid fa-file-lines me-2"></i>
                                List & Report
                            </button>
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB CONTENT */}
                {currentView === "products" && (
                    <>
                        {/* Admin & Seller Navigation - Same Layout */}
                        <div className="row g-0 bg-white rounded border mb-2 p-2 gap-0 gap-md-2 ">
                            {/* Category Tabs */}
                            <div className="col-12">
                                <div className="d-flex my-2"
                                    style={{ overflowX: "auto", maxWidth: "420px" }}
                                >
                                    {role === "admin" ? (
                                        [
                                            { label: "pendings", icon: "fa-solid fa-clock", 
                                                color: "text-warning bg-warning border-warning", source: "pending" },
                                            { label: "approved", icon: "fa-solid fa-square-check", 
                                                color: "text-success bg-success border-success", source: "approved" },
                                            { label: "rejected", icon: "fa-solid fa-ban", 
                                                color: "text-danger bg-danger border-danger", source: "rejected" },
                                        ].map((data, i) => (
                                            <div
                                                key={i}
                                                className={`d-flex align-items-center p-1 px-3 bg-opacity-10 rounded gap-1
                                                ${location.state?.source === data.source && data.color}
                                            `}
                                                style={{ cursor: "pointer", userSelect: "none" }}
                                                onClick={() => {
                                                    navigate("/admin/inventory", { 
                                                        state: { source: data.source, view: "products" } 
                                                    });
                                                }}
                                            >
                                                <div className={`${data.icon} small`}></div>
                                                <span className="small text-capitalize ">{data.label}</span>
                                            </div>
                                        ))
                                    ) : (
                                        [
                                            { label: "all", icon: "fa-solid fa-border-all", 
                                                color: "text-primary bg-primary border-primary", source: undefined },
                                            { label: "pendings", icon: "fa-solid fa-clock", 
                                                color: "text-warning bg-warning border-warning", source: "pending" },
                                            { label: "approved", icon: "fa-solid fa-square-check", 
                                                color: "text-success bg-success border-success", source: "approved" },
                                            { label: "rejected", icon: "fa-solid fa-ban", 
                                                color: "text-danger bg-danger border-danger", source: "rejected" },
                                        ].map((data, i) => (
                                            <div
                                                key={i}
                                                className={`d-flex align-items-center p-1 px-3 bg-opacity-10 rounded gap-1
                                                ${location.state?.source === data.source && data.color}
                                            `}
                                                style={{ cursor: "pointer", userSelect: "none" }}
                                                onClick={() => {
                                                    navigate("/seller", { state: { source: data.source } });
                                                }}
                                            >
                                                <div className={`${data.icon} small`}></div>
                                                <span className="small text-capitalize">{data.label}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="col-12 col-md-5">
                                <div className="d-flex gap-2 ">
                                    <div className="position-relative flex-grow-1">
                                        <i className="fa-solid fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                        <input
                                            type="text"
                                            className="form-control ps-5  mt-2 mt-md-0"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                fontSize: "0.95rem",
                                                borderRadius: "8px"
                                            }}
                                        />
                                        {searchTerm && (
                                            <i
                                                className="fa-solid fa-times position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setSearchTerm("")}
                                            ></i>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter Dropdown */}
                            <div className="col-6 col-md-2">
                                <select
                                    className="form-select border text-capitalize mt-2 mt-md-0"
                                    style={{
                                        fontSize: "14px"
                                    }}
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">All category</option>
                                    {uniqueCategories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Stock Status Dropdown */}
                            <div className="col-6 col-md-2 ">
                                <select
                                    className="form-select border w-100 mt-2 mt-md-0"
                                    style={{
                                        fontSize: "14px"
                                    }}
                                    value={stockStatus}
                                    onChange={(e) => setStockStatus(e.target.value)}
                                >
                                    <option value="all">All Stock</option>
                                    <option value="available">Available</option>
                                    <option value="outofstock">Out of Stock</option>
                                </select>
                            </div>

                            {/* Refresh Button */}
                            <div className="col justify-content-end d-flex ">
                                <button 
                                    className="btn btn-sm btn-success d-flex align-items-center gap-2 mt-2 mt-md-0  "
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    style={{ fontSize: "14px" }}
                                >
                                    <i className={`fa fa-refresh ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>

                        </div>

                        {/* Add Product Button - Seller Only */}
                        {role === "seller" && (
                            <div className="position-fixed z-1 bottom-0 end-0 p-4">
                                <div className="col text-md-start">
                                    <button
                                        className="border-0 text-light rounded-circle fs-2 shadow"
                                        style={{ width: "50px", height: "50px", backgroundColor: "#FFD700" }}
                                        onClick={() => setSellerUpload({ isShow: true })}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Products Display with Refresh Overlay */}
                        <div className="position-relative">

                            {isRefreshing && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100 rounded" 
                                    style={{ zIndex: 10 }}>
                                    <div className="text-center">
                                        <div className="spinner-border text-success mb-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="small text-muted mb-0">Refreshing products...</p>
                                    </div>
                                </div>
                            )}

                            {filteredProducts.length > 0 ? (
                                <ProductCard products={filteredProducts} />
                            ) : (
                                <div className="row g-0 border shadow-sm bg-white rounded mt-2 justify-content-center">
                                    <div className="col-12 text-center p-3 mt-5"
                                        style={{ height: height }}>
                                        {/* Animated Icon */}
                                        <div className="opacity-50" style={{
                                            fontSize: "4rem",
                                            animation: "float 3s ease-in-out infinite"
                                        }}>
                                            {location.state?.source === "pending" ?
                                                <i className="fa-solid fa-clock text-warning"></i> :
                                                location.state?.source === "approved" ?
                                                    <i className="fa-solid fa-square-check text-success"></i> :
                                                    location.state?.source === "rejected" ?
                                                        <i className="fa-solid fa-ban text-danger"></i> :
                                                        <i className="fa-solid fa-border-all text-primary"></i>
                                            }
                                        </div>

                                        {/* Main Message */}
                                        <h4 className="mb-2 text-muted fw-bold text-capitalize">
                                            {role === "admin"
                                                ? `No ${approvalStatus} products yet`
                                                : `No ${approvalStatus ?? "product"} found`
                                            }
                                        </h4>

                                        {/* Subtitle */}
                                        <p className="mb-4 small text-muted text-capitalize">
                                            {location.state?.source === "pending" ?
                                                role === "admin" 
                                                    ? "No products are currently waiting for approval." 
                                                    : "No product pending yet." :
                                                location.state?.source === "approved" ?
                                                    "No products have been approved yet." :
                                                    location.state?.source === "rejected" ?
                                                        "No products have been rejected." :
                                                        role === "seller" && "no product available. upload all products now."
                                            }
                                        </p>
                                    </div>

                                    {/* CSS Animation */}
                                    <style>{`
                                        @keyframes float {
                                            0%, 100% { transform: translateY(0px); }
                                            50% { transform: translateY(-10px); }
                                        }
                                    `}</style>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* LIST & REPORT TAB CONTENT */}
                {currentView === "list-report" && role === "admin" && (
                    <ListReports/>
                )}
            </div>

            {/* ✅ ADD THIS - Toast Component */}
            <Toast 
                show={showToast}
                message={toastMessage}
                type={toastType}
                onClose={() => setShowToast(false)}
            />
        </>
    );
};



export default Inventory;