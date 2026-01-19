import { useContext, useEffect, useState } from "react";
import { replace, useLocation, useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import { userContext } from "../context/userContext";
import icon from "../assets/images/icon.jpg";





const ProductDetails = () =>{
    const {role} = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const user  = useContext(userContext);

    let context;

    if (role === "admin") {
        context = admin;
    } else if (role === "seller") {
        context = seller;
    } else if (role === "user") {
        context = user;
    }

    const { cartBadge, setCartBadge, setText,  setUpdateStatusModal, setInventoryData
        ,setDeleteProductModal, setSellerDeleteModal, setSellerData, setCart,  setSellerUpload,
        trigger, setEditProduct, product, setProducts, setOpenCart
     }
    = context;


    const [loading, setLoading] = useState(true);
    const [productDetails, setProductDetails] = useState({});
    const location = useLocation();
    const prodId = location.state?.productId || null;

    const [pendingItems, setPendingItems] = useState([]);
    const [hasError, setHasError] = useState(false);
    const navigate = useNavigate();  
     

    
    useEffect(()=>{
        if(!prodId) {
            return navigate("/", { replace : true});
        }
    },[prodId, navigate]);
    
    if(!prodId) return null;


    useEffect(() => {
        if (hasError) {
           return navigate("/", { replace: true });
        }
    }, [hasError, navigate]);



    const handleButtons = (prodId, prodName, prodDisc, prodPrice, imageFile, seller, data)=>{
        if(role === "admin"){

            if(productDetails.statusApprove === "pending"){
                setText("approve this product ?");
                setUpdateStatusModal(true);
                setInventoryData((prev) => ({
                    ...prev, 
                    updateStatus : {id : prodId, newStatus : "approved"}
                }));
            }else{
                setEditProduct({ isShow: true, data: data })
                // alert("maya ka na mag edit kupal")
            }


        } else if (role === "seller"){
            // alert(`${role} ako`);
            setSellerUpload({ isShow: true, data: data})
        } else {

            setCartBadge((prev) => ({
                ...prev,
                number : prev.number + 1,
                show : true
            }))

            setCart((prev) => {
            
                const existing = prev.find((item) => item.prodId === prodId );

                if(existing){
                    return prev.map((item) => 
                        item.prodId === prodId
                        ? { ...item, quantity : item.quantity + 1}
                        : item
                    ) 
                }else{
                    return [
                        ...prev,
                        { prodId, prodName, prodDisc, prodPrice,imageFile, seller, quantity: 1}
                    ]
                }
            })

            setProductDetails((prev) => ({
                ...prev, stocks : prev.stocks - 1 
            }))

            
            setProducts((items) =>
                items.map((item) =>
                    item._id === productDetails._id
                        ? { ...item, stocks: item.stocks - 1 }
                        : item
                )
            );

            setPendingItems((prev) => [
                ...prev,
                {prodId, prodName, prodDisc, prodPrice, imageFile, seller}
            ])
            

            setOpenCart(true);

        }
    }

    useEffect(()=>{
        if(pendingItems.length === 0) return

        const timeout = setTimeout(async()=>{
            console.log(pendingItems);
            try{
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/addToCart`, {
                    method : 'POST',
                    headers :{
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify({ items : pendingItems}),
                    credentials : "include"
                });

                const data = await res.json();
                setPendingItems([]);

            }catch(error){
                console.log("failed post request ", error.message)
            }
        }, 1000);

        return  ()=> clearTimeout(timeout);
    },[pendingItems]);


    useEffect(()=> {
        const endPoint = role === "admin" ? "getProductDetails" 
        : role === "seller" ? "getSellerProductDetails" 
        : "getUserProductDetails";

        fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${prodId}`, {
            method : "GET",
            credentials: "include"
        })
        .then( async(res) => {
            console.log(`Response from ${role} product details ${res.status}`);
            const data  = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;    
        })
        .then((data) => {
            setLoading(false);
            setHasError(false);
            setProductDetails(data);
        }).catch((err) => {
            setLoading(false);
            setHasError(true);
            setProductDetails({});
            console.log("Error: ", err.message);
        })
    },[prodId, trigger]);

    

    const timeAgo = (date) => {
        if (!date) return "just now";

        const past = new Date(date);
        if (isNaN(past.getTime())) return "just now";

        const now = new Date();
        const diff = Math.floor((now - past) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 172800) return `Yesterday`;
        return `${Math.floor(diff / 86400)} day(s) ago`;
    };

    // Function to calculate remaining days before expiration
    const getRemainingDays = (createdAt, lifeSpan) => {
        if (!createdAt || !lifeSpan) return 0;

        const created = new Date(createdAt);
        if (isNaN(created.getTime())) return 0;

        const expirationDate = new Date(created);
        expirationDate.setDate(expirationDate.getDate() + lifeSpan);

        const now = new Date();
        const diffTime = expirationDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    };



    if(loading) return <p></p>
    if(hasError) return null
    
    return(
        <div className={role === "user" 
        ? "min-vh-100 d-flex bg " 
        : "min-vh-100 d-flex px-md-2 "}>
        <div className={`${role === "user" 
            ? "container bg-white  " 
            : "container-fluid bg-white"}`}>

            <div className={`row  ${role === "user" 
                ? "justify-content-center " 
                : "justify-content-center mt-4 px-lg-4"} `}
                style={{marginTop: role === "user" ? "120px" : ""}}
                >
                <div className={role === "user" 
                    ? "col-12 col-md-12 col-lg-11 col-xl-10" 
                    : "col-12 col-lg-12"}>
                    <div className="d-flex align-items-center gap-3 ms-2">
                        <button 
                            className="btn btn-outline-success"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>
                        <div>
                            <p className="m-0 text-capitalize fw-bold text-success fs-5">product details</p>
                            <p className="m-0 small text-muted">View product information</p>
                        </div>
                    </div>
                </div>  
            </div> 

            <div className={`row ${role === "user" ? 
                "g-0 justify-content-center mt-4 " 
                :"py-4 p-lg-4 g-0 justify-content-start"}`}>  
                <div className={role === "user" 
                    ? "col-12 col-md-12 col-lg-11 col-xl-10 " 
                    : "col-12 "}>
                    <div className={`row`}>
                        <div className={role === "user" 
                            ? "col-12 col-md-6 col-lg-6 col-xl-6 " 
                            : "col-12 col-md-6 col-lg-6 col-xl-5 col-xxl-5 "}>
                            <img 
                            src={productDetails.imageFile} 
                            alt={productDetails.imageFile}  
                            className={"img-fluid rounded-5"} />
                        </div>


                        <div className={role === "user" 
                            ? "col-12 col-md-6 col-lg-6 col-xl-6 mt-md-0 mt-3 "
                            : "col-12 col-md-6 col-lg-6  col-xl-7 mt-md-0 mt-5 "}>
                            <div className={role === "user" 
                            ? "d-flex flex-column justify-content-between h-100 " 
                            : "d-flex flex-column justify-content-between h-100 "}>
                                <div className="">
                                    <div className="d-flex flex-column align-items-center align-items-md-start"> 
                                        <p className="m-0 text-capitalize fw-bold text-success fs-1">{productDetails.name}</p>

                                        <div className="d-flex">
                                            <div className="d-flex bg align-items-center gap-1 p-1 px-3 rounded-pill
                                                bg-warning bg-opacity-10"
                                                style={{fontSize: "12px"}}
                                                >
                                                    <div className="fa fa-star text-warning"></div>
                                                    <span className="small fw-bold text-warning ">Ratings:</span>
                                                    <span className="text-muted small fw-bold">{productDetails.totalRatings}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 d-flex flex-column gap-1">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <p className="m-0 text-capitalize text-muted
                                            fw-bold "> description</p>

                                            <div className="d-flex align-items-center gap-1 me-2"
                                                style={{fontSize: "12px"}}
                                            >
                                                <p className="m-0  text-success small fw-bold text-capitalize">expires in:</p>
                                                <p className="m-0 small fw-bold text-muted">
                                                    {`${getRemainingDays(productDetails.createdAt, productDetails.lifeSpan)} ${getRemainingDays(productDetails.createdAt, productDetails.lifeSpan) === 1 ? 'day' : 'days'}`}
                                                </p>
                                            </div>
                                         
                                        </div>
                                        




                                        <p className="m-0 text-capitalize text-muted
                                        small">{`${productDetails.disc}`}</p>
                                    </div>

                                    <div className="row g-0 d-flex gap-2 mt-3">
                                        {/* Price Box */}

                                        <div className="col p-3 rounded-3 bg-success bg-opacity-10" 
                                        >
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="small text-muted fw-semibold">Price</span>
                                            </div>
                                            <div className="d-flex align-items-baseline gap-1">
                                                <span className="fw-bold text-success" 
                                                style={{fontSize: "1.5rem"}}>

                                                    ₱{productDetails.price.toLocaleString('en-PH', 
                                                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stocks Box */}
                                        <div className="col p-3 rounded-3 bg-warning bg-opacity-10">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="small text-muted fw-semibold">Available Stock</span>
                                            </div>
                                            <div className="fw-bold text-warning fs-5" 
                                            >
                                                <span className="small text-capitalize text-muted ms-1">
                                                { productDetails.stocks > 1 ? productDetails.stocks + " bundles ": productDetails.stocks === 1 ? productDetails.stocks + " bundle " : "out of stock"}
                                                </span>
                                            </div>
                                            <span className="small text-muted">{`1 bundle = ${productDetails.kg}/kg`}</span>

                                        </div>
                                    </div>
                                </ div>
                                



                                <div className={"row  gap-2 g-0 mt-4"}>
                                    {productDetails.statusApprove !== "rejected" && (
                                    <div className="col">
                                        <button className={`text-capitalize p-2 d-flex justify-content-center align-items-center 
                                        w-100 gap-2
                                        ${role === "user" 
                                            ? "border-1 rounded bg-white "
                                            : "border rounded-pill bg-dark  text-white"
                                        }
                                        ${role === "user" && productDetails.stocks <= 0 && "opacity-75"}`}
                                        onClick={()=>handleButtons(productDetails._id, productDetails.name, productDetails.disc, productDetails.price, productDetails.imageFile, productDetails.seller, productDetails)}
                                        disabled={role === "user" ? productDetails.stocks <= 0 : false}
                                        >
                                        {role === "user" ? (
                                            <div className="fa fa-cart-plus position-relative">
                                                {cartBadge.number > 0 && (
                                                    <p className="m-0 position-absolute fw-bold rounded-circle d-flex align-items-center justify-content-center top-0 end-0 mt-1 me-2 text-white"
                                                    style={{fontSize:"10px", width:"18px", height: "18px", background:"red"}}
                                                    >{`${cartBadge.number}`}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <i className="fa fa-pen"></i>
                                        )}

                                     
                                        {role === "admin" && productDetails.statusApprove === "pending"
                                            ? "accept now" 
                                            : role === "user" ? `add to cart` 
                                            : "edit product"
                                        }</button>
                                    </div>
                                    )}

                                    <div className={"col "}>
                                        <button className={`text-capitalize p-2 rounded w-100 d-flex align-items-center justify-content-center gap-2
                                        ${(role === "admin" || role === "seller") 
                                        ? "bg-danger text-danger bg-opacity-10 border-danger border border-opacity-50 rounded-pill " 
                                        : "bg-dark text-white border-0"}
                                        ${role === "user" && productDetails.stocks <= 0 && "opacity-75"}
                                        `}
                                        disabled={role === "user" && productDetails.stocks <= 0}
                                        onClick={()=>{
                                            if(role === "admin"){
                                                if(productDetails.statusApprove === "pending"){
                                                    setText("reject this product ?");
                                                    setUpdateStatusModal(true);
                                                    setInventoryData((prev) => ({
                                                        ...prev, 
                                                        updateStatus : {id : productDetails._id, newStatus : "rejected"}
                                                    }));
                                                }else{
                                                    setDeleteProductModal(true);
                                                    setText("do you want to delete this item?");
                                                    setInventoryData((prev) => ({
                                                        ...prev, 
                                                        deleteProduct : {id : productDetails._id}
                                                    }));
                                                }

                                            } else if ( role === "seller"){
                                                    setSellerDeleteModal(true);
                                                    setText("do you want to delete this item?");
                                                    setSellerData((prev) => ({
                                                        ...prev, 
                                                        deleteProduct : { id : productDetails._id}
                                                    }))

                                            } else {
                                                navigate("/user/checkout", { state : { 
                                                    source : "buy", 
                                                    products: [{
                                                        prodId: productDetails._id,
                                                        prodName: productDetails.name,
                                                        prodDisc: productDetails.disc,
                                                        prodPrice: productDetails.price,
                                                        imageFile: productDetails.imageFile,
                                                        seller: productDetails.seller,
                                                        quantity: 1,
                                                    }]
                                                }});
                                            }
                                            
                                        }}>
                                            {( role === "admin" || role === "seller" ) && (
                                                <div className="bx bx-trash"></div>
                                            )}
                                            
                                            
                                            {role === "admin" && productDetails.statusApprove === "pending"
                                            ? "reject" 
                                            : role === "user" ? "buy now" : "delete"
                                        }</button> 
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className={`row ${role === "user" 
                ? "g-0 justify-content-center my-5" 
                : "px-lg-4 g-0 justify-content-start "}`}>  
                <div className={role === "user" 
                    ? "col-12 col-md-12 col-lg-11 col-xl-10 " 
                    : "col-12 "}>
                    <div className="row">
                        <div className={role === "user" ? "col-12 col-md-6 col-lg-6 col-xl-6 " : "col-12 col-md-6 col-lg-6 col-xl-5 col-xxl-5 "}>
                            <p className="m-0 text-capitalize fw-bold">customer reviews</p>
                            <div className="d-flex align-items-center mt-2 gap-2">
                                <p className="m-0 small text-muted fw-bold">{productDetails.averageRating}</p>
                                <div className="fa fa-star text-warning"></div>
                                <p className="m-0 text-capitalize small text-muted">{`${productDetails.numOfReviews} reviews`}</p>
                            </div>
                            {productDetails?.reviews.length > 0 ? (
                                <div className="mt-4">
                                    {productDetails?.reviews.map((data, i) => (
                                        <div key={i} className="d-flex gap-3 mt-3">
                                            
                                            <div>
                                                {data.user.imageFile ? (
                                                    <div className="border shadow rounded-circle border-white " 
                                                    style={{width:"50px", height:"50px", overflow: "hidden"}}>
                                                        <img src={data.user.imageFile}
                                                        alt={data.user.imageFile} 
                                                        className="h-100 w-100"
                                                        style={{ objectFit: "cover" }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="rounded-circle bg-primary text-uppercase d-flex fs-4
                                                     text-white align-items-center justify-content-center"
                                                    style={{width: "50px", height: "50px"}}
                                                    >{data.user.name.charAt(0)}</div>
                                                )} 
                                            </div>

                                            <div className="w-100">
                                                <div className="d-flex justify-content-between ">
                                                    <div>
                                                        <p className="m-0 text-capitalize fw-bold">{data.user.name}</p>
                                                        
                                                      
                                                    </div>
                                                    <p className="m-0 opacity-75" style={{fontSize:"14px"}}>{timeAgo(data.createdAt)}</p>
                                                </div>

                                                <div className="row g-0">
                                                    <div className="col-9 col-md-9 col-lg-9 col-xl-9 col-xxl-10">

                                                        <p className="m-0 text-capitalize fs-4" 
                                                            style={{color : "gold", WebkitTextStroke : "0"}}>
                                                            {"★".repeat(data.rate)}
                                                            <span style={{color : "transparent", WebkitTextStroke : "0.5px gray"}}>
                                                                {"★".repeat(5 - data.rate)}
                                                            </span>
                                                        </p>

                                                        <p className="m-0 text-capitalize me-2 small text-muted">{data.comment}</p>
                                                    </div>

                                                    <div className="col ">
                                                        {data.imageFile ? (
                                                                
                                                            <img src={data.imageFile}
                                                                 alt={data.imageFile} 
                                                            className="img-fluid rounded shadow-sm border border-white" 
                                                            />
                                                        ):(
                                                            <p className="m-0 small  text-muted text-end text-capitalize">{''}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <p className="m-0 text-center text-capitalize small text-muted">no reviews</p>
                                </div>
                            )}
                        </div>

                        <div className={role === "user" 
                            ? "col-12 col-md-6 col-lg-6 col-xl-6 mt-lg-0" 
                            : "col-12 col-md-6 col-lg-6  col-xl-7  "}>
                            <p className="m-0 text-capitalize fw-bold mb-3 mt-5 mt-md-0 small">other:</p>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    {productDetails.seller.imageFile ? (
                                        <div className="border border-white shadow rounded-circle"
                                        style={{height: "50px", width: "50px", overflow: "hidden"}}>
                                            <img src={productDetails.seller.imageFile} 
                                            alt={productDetails.seller.imageFile} 
                                            className="h-100 w-100"
                                            style={{objectFit: "cover"}} />
                                        </div>
                                    ):(
                                        <div className="rounded-circle bg-primary border border-white shadow text-uppercase d-flex fs-4
                                        text-white align-items-center justify-content-center"
                                        style={{width: "50px", height: "50px"}}
                                        >{productDetails.seller.name.charAt(0)}</div>
                                    )}


                                    <div>
                                        <p className="m-0 text-capitalize fw-bold text-muted small">{productDetails.seller.name}</p>
                                        <p className="m-0 text-capitalize small text-muted">{"(seller)"}</p>
                                    </div>
                                </div>

                                {role !== "seller" && (
                                    <button className="border-0 text-capitalize small rounded-pill p-1 px-3 shadow bg-primary text-light d-flex align-items-center gap-2"
                                    style={{outline : "none"}}
                                    onClick={()=> {

                                        const senderData = {  
                                            
                                            receiverId  : productDetails.seller.id,
                                            receiverRole : "seller"
                                        }

                                        fetch(`${import.meta.env.VITE_API_URL}/api/getUserChatId`, {
                                            method : "POST",
                                            headers : { "Content-Type": "application/json"},
                                            body: JSON.stringify(senderData),
                                            credentials : "include"
                                        })
                                        .then((res) => res.json())
                                        .then((data) => {
                                            console.log(data);
                                            navigate(`/${role}/messages`, { state : {
                                                source : "seller",
                                                chatId : data.chatId,
                                                senderId : data.senderId,
                                                credentials : {
                                                    id : productDetails.seller.id,
                                                    name : productDetails.seller.name,
                                                    email : productDetails.seller.email,
                                                    role : "seller"
                                                }
                                            }})
                                        })
                                    }}
                                    >
                                        <i className="fa fa-comment"></i>
                                        chat</button>
                                )}

                            </div>  
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

    )
  
}
export default ProductDetails;