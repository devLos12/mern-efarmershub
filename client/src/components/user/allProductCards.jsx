import React from "react";
import { useContext, useState, useMemo, useEffect } from "react";
import { userContext } from "../../context/userContext.jsx";
import { useNavigate } from "react-router-dom";

const AllProductCards = () => {
    const { trigger, setProducts, products, loading, error, setCart, setCartBadge, setOpenCart } = useContext(userContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProductType, setSelectedProductType] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [pendingCartItems, setPendingCartItems] = useState([]);

    // Auto scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Add to cart function
    const addToCart = async(pid, prodId, prodName, prodDisc, prodPrice, imageFile, seller) => {
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

        setProducts((prevProd) => 
            prevProd.map((product) => product._id === prodId
            ? {...product, stocks: product.stocks - 1}
            : product 
        ));

        setPendingCartItems((prev) => [
            ...prev, 
            {prodId, prodName, prodDisc, prodPrice, imageFile, seller}
        ]);

        setOpenCart(true);
    };

    // Debounce cart data to backend
    useEffect(() => {
        if(pendingCartItems.length === 0) return;

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
    }, [pendingCartItems]);

    // Extract unique product types and categories
    const { productTypes, categories } = useMemo(() => {
        const types = new Set();
        const cats = new Set();
        
        products.forEach(p => {
            if (p.productType) types.add(p.productType);
            if (p.category) cats.add(p.category);
        });
        
        return {
            productTypes: ["all", ...Array.from(types).sort()],
            categories: ["all", ...Array.from(cats).sort()]
        };
    }, [products]);

    // Filter products based on search, product type, and category
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = searchQuery.trim() === "" || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = selectedProductType === "all" || 
                p.productType === selectedProductType;
            
            const matchesCategory = selectedCategory === "all" || 
                p.category === selectedCategory;
            
            return matchesSearch && matchesType && matchesCategory;
        });
    }, [products, searchQuery, selectedProductType, selectedCategory]);

    return (
        <div className="container" style={{marginTop: "120px"}}>
            {/* Header */}
            <div className="row g-0 mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            className="btn btn-outline-success"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <div>
                            <p className="m-0 text-capitalize fw-bold text-success fs-5">all products</p>
                            <p className="m-0 small text-muted">Showing {filteredProducts.length} of {products.length} products</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar and Category Dropdown */}
            <div className="row g-0 mb-3">
                <div className="col-12">
                    <div className="d-flex gap-2">
                        <div className="input-group flex-grow-1">
                            <span className="input-group-text bg-success text-white border-success">
                                <i className="fa-solid fa-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-success"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    className="btn btn-outline-success"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            )}
                        </div>
                        
                        {/* Category Dropdown */}
                        <select 
                            className="form-select border-success text-capitalize rounded-4"
                            style={{maxWidth: "150px", fontSize: "14px"}}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">all category</option>
                            {categories.filter(cat => cat !== "all").map(category => (
                                <option key={category} value={category} className="text-capitalize">
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Horizontal Scrollable Product Type Pills */}
            <div className="row g-0 mb-3">
                <div className="col-12">
                    <div 
                        className="d-flex gap-2 pb-2" 
                        style={{
                            overflowX: "auto",
                            scrollbarWidth: "thin",
                            WebkitOverflowScrolling: "touch",
                            msOverflowStyle: "-ms-autohiding-scrollbar"
                        }}
                    >
                        {productTypes.map(type => (
                            <button
                                key={type}
                                className={`btn btn-sm text-capitalize border-0 text-nowrap rounded-2 px-4 ${
                                    selectedProductType === type 
                                        ? "bg-dark text-white" 
                                        : "btn-outline-dark"
                                }`}
                                style={{
                                    flexShrink: 0
                                }}
                                onClick={() => setSelectedProductType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedProductType !== "all" || selectedCategory !== "all" || searchQuery) && (
                <div className="row g-0 mb-2">
                    <div className="col-12">
                        <button 
                            className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                            style={{fontSize: "14px", fontWeight: "500"}}
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedProductType("all");
                                setSelectedCategory("all");
                            }}
                        >
                            <i className="fa-solid fa-times me-1"></i>
                            clear all filters
                        </button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="row g-2">
                {filteredProducts.map((data, i) => (
                    <div key={i} className="col-6 col-sm-6 col-md-5 col-lg-4 col-xl-3 col-xxl-3">
                        <div className="card overflow-hidden shadow-sm border-0 justify-content-between position-relative bg-warning bg-opacity-10 mt-2">
                            <div className="p-1 p-md-2 z-1">
                                <div className="col-12 text-center bg-white rounded mt-2">
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL}/api/uploads/${data.imageFile}`}  
                                        alt={data.imageFile} 
                                        className="img-fluid rounded shadow-sm"
                                        style={{cursor: "pointer"}} 
                                        onClick={() => {
                                            navigate("/user/all-products/productdetails", {state: {productId: data._id}});
                                        }}
                                    />
                                </div>
                                
                                <div className="mt-2 rounded">
                                    <p className="m-0 text-capitalize fw-bold text-success text-center">{data.name}</p>
                                    
                                    <div className="text-center mb-1">
                                        <span className="badge bg-success bg-opacity-10 text-success text-capitalize" style={{fontSize: "10px"}}>
                                            {data.productType}
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-center">
                                        <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 rounded-pill px-2" style={{fontSize: "12px"}}>
                                            <i className="fa fa-star text-warning small"></i>
                                            <p className="m-0 small text-warning fw-bold text-capitalize">ratings:</p>
                                            <p className="m-0 text-muted fw-bold">{data.totalRatings}</p>
                                        </div>
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
                                                onClick={() => {
                                                    navigate("/user/all-products/checkout", {
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
                                                    })
                                                }}
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

            {/* No Results */}
            {filteredProducts.length === 0 && (
                <div className="row g-0 mt-5">
                    <div className="col-12 text-center py-5">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" 
                             style={{width: "80px", height: "80px"}}>
                            <i className="fa-solid fa-search fs-1 text-muted"></i>
                        </div>
                        <p className="text-muted mb-3">No products found</p>
                        <button 
                            className="btn btn-success rounded-pill px-4"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedProductType("all");
                                setSelectedCategory("all");
                            }}
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllProductCards;