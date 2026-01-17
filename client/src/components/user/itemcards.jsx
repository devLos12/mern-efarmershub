import React, { useContext, useEffect, useRef, useState } from "react";
import { useBreakpoint}  from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";
import { useNavigate } from "react-router-dom";
import { appContext } from "../../context/appContext.jsx";



const ItemCards = ({ products }) => {
    const { setCart } = useContext(userContext);
    const { setCartBadge, setOpenCart } = useContext(userContext);
    const { setProducts } = useContext(userContext);
    const width = useBreakpoint();
    const navigate = useNavigate();

    const [pendingCartItems, setPendingCartItems] = useState([]);
    const { bestSellers, setBestSellers } = useContext(appContext);
    

    
    const addToCart = async(pid, prodId, prodName, prodDisc, prodPrice, imageFile, seller)=> {

        setCartBadge((prev) => ({
            ...prev,
            number : prev.number + 1,
            show : true,
        }))

        //addtocart ui updates
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
                    { pid, prodId, prodName, prodDisc, prodPrice,imageFile, seller, quantity: 1}
                ]
            }

        })
        
        setBestSellers((prevProd) => 
            prevProd.map((product) => product._id === prodId
            ? {...product, stocks : product.stocks - 1}
            : product 
        ))

        setProducts((prevProd) => 
            prevProd.map((product) => product._id === prodId
            ? {...product, stocks : product.stocks - 1}
            : product 
        ))

        
        setPendingCartItems((prev) => [
            ...prev, 
            {prodId, prodName, prodDisc, prodPrice, imageFile, seller}
        ])

        
        setOpenCart(true);
    }
    

    //debounce data
    useEffect(()=> {
        if(pendingCartItems.length === 0 ) return;
                

        const timeout = setTimeout(async() => {

            try{
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/addToCart`, {
                    method : 'POST',
                    headers :{
                        "Content-Type" : "application/json"
                    },
                    body : JSON.stringify({ items : pendingCartItems}),
                    credentials : "include"
                });

                const data = await res.json();
                setPendingCartItems([]);

                console.log("Response:", data.message);
            }catch(error){
                console.log("failed post request ", error.message)
            }
                        
        }, 1000);

        return () => clearTimeout(timeout);

    },[pendingCartItems])


    return (
        <>
        {products.map((data, i) => (
            <div key={i} className={`col-6 col-sm-6 col-md-5 col-lg-4 col-xl-3 col-xxl-3 `}>
                <div className="card border-0 shadow-sm overflow-hidden
                justify-content-between position-relative  bg-warning bg-opacity-10 me-2 " >
                    <div className="p-1 p-md-2 z-1" 
                    >
                        <div className="col-12 text-center bg-white rounded mt-2">
                            <img src={ 
                                data.imageFile.startsWith("http") 
                                ? data.imageFile 
                                : `${import.meta.env.VITE_API_URL}/api/uploads/${data.imageFile}`}  
                            alt={data.imageFile} 
                            className="img-fluid rounded shadow-sm"
                                style={{cursor : "pointer"}} 
                                onClick={()=>{
                                    navigate("/user/productdetails", {state : { productId : data._id}});
                                }}/>
                        </div>
                        
                        <div className="mt-2 rounded ">
                            <p className="m-0 text-capitalize fw-bold text-success text-center">{data.name}</p>
                            <div className="d-flex align-items-center justify-content-center">
                                <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 rounded-pill px-2"
                                style={{fontSize: "12px"}}
                                >
                                    <i className="fa fa-star text-warning small"></i>
                                    <p className="m-0 small text-warning fw-bold text-capitalize">ratings:</p>
                                    <p className="m-0 text-muted fw-bold">{data.totalRatings}</p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="d-flex justify-content-between align-items-center" 
                                >   
                                    <p className="m-0 text-capitalize small ">
                                    price: </p>
                                    <div className="d-flex align-items-center gap-1">
                                        <p className="m-0 text-capitalize fw-bold small text-success">{"₱"+ 
                                        data.price.toLocaleString('en-ph',
                                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                        )}</p>
                                        <p className="m-0 small ">/{`${data.kg} kg`}</p>
                                    </div>
                                </div>

                                <div className="d-flex  justify-content-between align-items-center"
                                >
                                    <p className="m-0 text-capitalize small">
                                    stocks: </p>

                                    <p className="m-0 text-capitalize fw-bold small ">{
                                    data.stocks > 1 ? data.stocks + " bundles "
                                    : data.stocks === 1 ? data.stocks + " bundle " : "out of stock"}
                                    </p>
                                </div>

                                <div className="text-end mt-1">
                                    <p className="m-0 text-muted" style={{fontSize: "12px"}}>
                                        1 bundle = {data.kg || 2}kg
                                    </p>
                                </div>
                            </div>

                            <div className="row mt-2 gap-2 g-0 d-none d-md-flex">
                                <div className="col ">
                                    <button className={` d-flex justify-content-center align-items-center text-capitalize border-1 bg-white w-100 p-1 rounded small
                                    
                                    ${data.stocks <= 0 ? "opacity-75" : ""}`} 
                                    style={{ outline:"none"}} 
                                    onClick={()=>addToCart(data.prodId, data._id, data.name, data.disc, data.price, data.imageFile, data.seller)}
                                    disabled={data.stocks <= 0}
                                    >
                                        <i className="fa-solid fa-cart-plus"></i>
                                        <p className="m-0 ms-2 fw-normal">add</p>
                                    </button>
                                </div>

                                <div className="col bg">
                                    <button className={`text-capitalize p-1 rounded bg-dark border-0 text-light w-100 
                                    small ${data.stocks ===0 && "opacity-75"}`} 
                                    disabled={data.stocks <= 0}
                                    style={{ outline:"none"}}
                                    onClick={()=> {
                                        navigate("checkout", {state : {
                                            source : "buy",
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
                                        }})
                                    }}>buy now</button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
        </>
    );
};

export default ItemCards;
