import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { userContext } from "../context/userContext";

const BestSellerProducts = ({signIn}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingCartItems, setPendingCartItems] = useState([]);
    const navigate = useNavigate();
    const { role } = useContext(appContext);
    const user = useContext(userContext);
    const { bestSellers, setBestSellers } = useContext(appContext);


    // ✅ FIX: Conditional destructuring - only when user is logged in
    const setCart = role === "user" ? user?.setCart : null;
    const setCartBadge = role === "user" ? user?.setCartBadge : null;
    const setOpenCart = role === "user" ? user?.setOpenCart : null;
    const setProducts = role === "user" ? user?.setProducts : null;




    // Auto scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        fetchBestSellers();
    }, []);


    const fetchBestSellers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bestsellers?limit=20`);
            const data = await response.json();
            
            if (data.success) {
                setBestSellers(data.data);
            }
            
        } catch (err) {
            console.error("Error fetching best sellers:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    // Add to cart function
    const addToCart = async(pid, prodId, prodName, prodDisc, prodPrice, imageFile, seller) => {
        // Check if user is logged in
        if(role !== "user") {
            signIn(true);
            return;
        }



        // ✅ FIX: Check if functions exist before using them
        if(!setCartBadge || !setCart || !setProducts || !setOpenCart) {
            console.error("Cart functions not available");
            return;
        }

        setCartBadge((prev) => ({
            ...prev,
            number: prev.number + 1,
            show: true,
        }));

        // Add to cart UI updates
        setCart((prev) => {
            const existing = prev.find((item) => item.prodId === prodId);

            if(existing){
                return prev.map((item) => 
                    item.prodId === prodId
                    ? { ...item, quantity: item.quantity + 1}
                    : item
                );
            } else {
                return [
                    ...prev,
                    { pid, prodId, prodName, prodDisc, prodPrice, imageFile, seller, quantity: 1}
                ];
            }
        });

        // Update stocks in bestSellers state
        setBestSellers((prevProd) => 
            prevProd.map((product) => product._id === prodId
            ? {...product, stocks: product.stocks - 1}
            : product 
        ));

        // Also update main products context if needed
        setProducts((prevProd) => 
            prevProd.map((product) => product._id === prodId
            ? {...product, stocks: product.stocks - 1}
            : product 
        ));

        setPendingCartItems((prev) => [
            ...prev, 
            {pid, prodId, prodName, prodDisc, prodPrice, imageFile, seller}
        ]);

        setOpenCart(true);
    };



    // Handle buy now
    const handleBuyNow = (data) => {
        if(role !== "user") {
            signIn(true);
            return;
        }

        navigate("checkout", {
            state: {
                source: "buy",
                products: [{
                    pid: data.prodId,
                    prodId: data._id,
                    prodName: data.name,
                    prodDisc: data.disc,
                    prodPrice: data.price,
                    imageFile: data.imageFile,
                    seller: data.seller,
                    quantity: 1,
                }]
            }
        });
    };

    // Debounce cart data to backend
    useEffect(() => {
        if(pendingCartItems.length === 0 || role !== "user") return;

        const timeout = setTimeout(async() => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/addToCart`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ items: pendingCartItems }),
                    credentials: "include"
                });

                const data = await res.json();
                setPendingCartItems([]);
                console.log("Response:", data.message);
            } catch(error) {
                console.log("Failed post request", error.message);
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [pendingCartItems, role]);
    
    // Rest of the component remains the same...
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" 
            style={{height: "420px"}}>
                <div className="text-center ">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{marginTop: "120px"}}>
                <div className="alert alert-danger" role="alert">
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container g-0">
            {/* Products Grid */}

            {/* No Results */}
            {bestSellers.length === 0 ? (
                <div className="row g-0 d-flex align-items-center justify-content-center"
                style={{height: "420px"}}
                >
                    <div className="col-12 text-center ">
                        <i className="fa-solid fa-fire fs-3 text-muted"></i>
                        <p className="text-muted mt-3">No best sellers found yet</p>
                    </div>
                </div>
            ): (
                <div className="row g-2 mb-5">
                    <div className="col-12">
                        <div className="d-flex align-items-center gap-2 justify-content-center my-5 text-success">
                            <i className="fa fa-trophy fs-5"></i>
                            <p className="m-0 text-capitalize fw-bold text-center fs-5">best seller</p>
                        </div>
                    </div>

                    {bestSellers.map((data, i) => (
                        <div key={i} className="col-6 col-sm-6 col-md-5 col-lg-4 col-xl-3 col-xxl-3">
                            <div className="card overflow-hidden shadow-sm border-0 justify-content-between position-relative bg-warning bg-opacity-10 mt-2">
                                {/* Rank Badge */}
                                <div className="position-absolute top-0 start-0 m-2 z-2">
                                    <span className={`badge ${i < 3 ? 'bg-warning' : 'bg-success'}`}>
                                        <i className="fa fa-trophy me-1"></i>
                                        #{i + 1}
                                    </span>
                                </div>

                                <div className="p-1 p-md-2 z-1">
                                    <div className="col-12 text-center bg-white rounded mt-2">
                                        <img 
                                            src={data.imageFile}  
                                            alt={data.imageFile} 
                                            className="img-fluid rounded shadow-sm"
                                            style={{cursor: "pointer"}} 
                                            onClick={() => {
                                                if(role === "user"){
                                                    navigate("/user/all-products/productdetails", {state: {productId: data._id}});
                                                } else {
                                                    signIn(true);
                                                }
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="mt-2 rounded">
                                        <p className="m-0 text-capitalize fw-bold text-success text-center">{data.name}</p>

                                        {/* Total Sold Badge */}
                                        <div className="text-center mb-2">
                                            <span className="badge bg-danger bg-opacity-10 text-danger" 
                                                style={{fontSize: "11px"}}>
                                                <i className="fa fa-fire me-1"></i>
                                                {data.totalSold} sold
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center">   
                                                <p className="m-0 text-capitalize small">price:</p>
                                                <div className="d-flex align-items-center gap-1">
                                                    <p className="m-0 text-capitalize fw-bold small text-success">
                                                        {"₱" + data.price.toLocaleString('en-ph', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                    </p>
                                                    <p className="m-0 small">/{`${data.kg} kg`}</p>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <p className="m-0 text-capitalize small">stocks:</p>
                                                <p className="m-0 text-capitalize fw-bold small">
                                                    {data.stocks > 1 ? data.stocks + " bundles" : data.stocks === 1 ? data.stocks + " bundle" : "out of stock"}
                                                </p>
                                            </div>

                                            <div className="text-end mt-1">
                                                <p className="m-0 text-muted" style={{fontSize: "12px"}}>
                                                    1 bundle = {data.kg || 2}kg
                                                </p>
                                            </div>
                                        </div>

                                        <div className="row mt-2 gap-2 g-0 d-none d-md-flex">
                                            <div className="col">
                                                <button 
                                                    className={`d-flex justify-content-center align-items-center text-capitalize border-1 bg-white w-100 p-1 rounded small ${data.stocks <= 0 ? "opacity-75" : ""}`} 
                                                    style={{outline: "none"}} 
                                                    onClick={() => addToCart(data.prodId, data._id, data.name, data.disc, data.price, data.imageFile, data.seller)}
                                                    disabled={data.stocks <= 0}
                                                >
                                                    <i className="fa-solid fa-cart-plus"></i>
                                                    <p className="m-0 ms-2 fw-normal">add</p>
                                                </button>
                                            </div>

                                            <div className="col bg">
                                                <button 
                                                    className={`text-capitalize p-1 rounded bg-dark border-0 text-light w-100 small ${data.stocks === 0 && "opacity-75"}`} 
                                                    disabled={data.stocks <= 0}
                                                    style={{outline: "none"}}
                                                    onClick={() => handleBuyNow(data)}
                                                >
                                                    buy now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            )}
        </div>
    );
};

export default BestSellerProducts;