import React, { useContext, useMemo } from "react";
import { useState, useEffect} from "react";
import { useNavigate, } from "react-router-dom";
import { useBreakpointHeight } from "../../components/breakpoint.jsx";
import { userContext } from "../../context/userContext.jsx";
import "../../styles/index.css";
import { appContext } from "../../context/appContext.jsx";





const Cart = () => {
    const { products, setProducts } = useContext(userContext);
    const { cart , setCart, setCartBadge } = useContext(userContext);
    const { loading, error } = useContext(userContext);
    const navigate = useNavigate();
    const height = useBreakpointHeight();
    const { bestSellers, setBestSellers } = useContext(appContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingId, setLoadingId] = useState(null);


    
    const totalPrice = useMemo(()=>{
        return cart.reduce((sum, data) => sum + data.prodPrice * data.quantity, 0);
    },[cart]);


    const removeItem = async(prodId)=>{
        
        setCart((prev) => prev.filter((item) => item.prodId !== prodId));   
        const cartFound = cart.find((item) => item.prodId === prodId);
        const quantityToReturn = cartFound ? cartFound.quantity : 0;

          
        setBestSellers((prev) => 
            prev.map((item) => 
                item._id === prodId ? {...item, stocks : item.stocks + quantityToReturn} : item
            )
        )
        
        setProducts((prev) => 
            prev.map((item) => 
                item._id === prodId ? {...item, stocks : item.stocks + quantityToReturn} : item
            )
        )
        
        setCartBadge((prev) => ({
            ...prev, 
            number : prev.number - quantityToReturn,
            show : false,
        }))

        
        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/removeItem/${prodId}`, {
                method : "DELETE",
                credentials : "include"
            })
            
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            console.log(data.message);
        }catch(error){
            console.log("Error: ", error.message);
        }
    } 



    const handleQuantity = async(operator, prodId) =>{
        
        // ✅ Prevent multiple clicks while processing
        if (isProcessing) return;

        try {

            setIsProcessing(true);
            setLoadingId(`${prodId}-${operator}`); // ✅ i-track kung sino at anong operator


            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reqQuantity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify({ pendingData : [{ operator, prodId }] }),
                credentials: 'include'  
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);


            // ✅ Update UI after successful API call
            if (operator === "+") {

                setCartBadge((prev) => ({
                    ...prev, 
                    number : prev.number + 1,
                    show : true,
                }))

                setCart((prev) =>
                    prev.map((item) =>
                        item.prodId === prodId  ? { ...item, quantity: item.quantity + 1 } : item
                    )
                );

                setBestSellers((prev) => 
                    prev.map((item) => 
                        item._id === prodId ? { ...item, stocks : item.stocks - 1} : item
                    )
                )

                setProducts((prev) => 
                    prev.map((item) => 
                        item._id === prodId ? { ...item, stocks : item.stocks - 1} : item
                    )
                )
                  
            }else{

                setCartBadge((prev) => ({
                    ...prev, 
                    number : prev.number - 1,
                    show : true,
                }))

                setCart((prev) =>
                    prev.map((item) =>
                    item.prodId === prodId ? { ...item, quantity: item.quantity - 1 } : item
                    )
                );

                setBestSellers((prev) => 
                    prev.map((item) => 
                        item._id === prodId ? { ...item, stocks : item.stocks + 1} : item
                    )
                )
                
                setProducts((prev) => 
                    prev.map((item) => 
                        item._id === prodId ? { ...item, stocks : item.stocks + 1} : item
                    )
                )
            }

            console.log("Response: ", data.message);

        } catch (error) {
            console.log("Error: ", error.message);
        } finally {
            setIsProcessing(false);
            setLoadingId(null);
        }
    }

    if(loading) return <p></p>

    return(
        <>
            <div className="container-fluid rounded  h-100 d-flex justify-content-between flex-column">
                {cart.length > 0 ? (
                    <>
                    <div>
                    <div className="row rounded">
                        <div className="col-md-6 ">
                            <p className="m-0 fw-bold text-capitalize fs-3 p-2 text-success">Cart item</p>
                        </div>
                    </div>
                    <div className="row rounded p-2" style={{ maxHeight : height-200, overflowY:"auto"}}>
                        {cart.map((data, i)=> {
                        const productItem = products.find(item => item._id === data.prodId);
                        
                        
                        return ( 
                            <div key={i} className="col-12 mt-2 rounded p-2  position-relative border shadow-sm" 
                            style={{background: "#F5F5DC"}}>
                                <div className="row ">
                                    <div className="col-5 align-items-center">
                                        <div style={{aspectRatio: "4/3"}}>
                                            <img src={data.imageFile} 
                                            className="img-fluid rounded w-100 h-100"
                                            style={{objectFit: "cover"}}
                                            /> 
                                        </div>

                                    </div>
                                    <div className="col-6 g-0 d-flex flex-column justify-content-between ">
                                        <div>
                                        <p className="m-0 fw-bold text-capitalize small text-success">{data.prodName}</p>
                                        <p className="m-0 text-capitalize opacity-75 small">{data.prodDisc}</p>
                                        </div>
                                        

                                        <div className="col-12 mt-2 d-flex  justify-content-between rounded">
                                            <strong className="d-flex align-items-center h-100 small">
                                            {"₱"+data.prodPrice+".00"}</strong>

                                            <div className="d-flex align-items-center justify-content-between w-50 ">
                                                <button className={`border-0 bg-dark text-light 
                                                ${productItem?.stocks === 0 || !productItem || isProcessing ? "opacity-75" : ""}`} 
                                                style={{width : "35px", height:"35px", borderRadius: "50%"}} 
                                                onClick={()=>handleQuantity("+", data.prodId)}
                                                disabled={productItem?.stocks === 0 || !productItem || isProcessing} 
                                                >


                                                    {loadingId === `${data.prodId}-+` ? (
                                                        <div className="spinner-border spinner-border-sm text-white opacity-75" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    ) : "+"}

                                                </button>
                                                
                                                <p className="m-0  p-2 text-center">{data.quantity}</p>
                                                
                                                <button className={`border-0 bg-dark text-light ${data.quantity === 1 || !productItem || isProcessing ? "opacity-75" : ""}`}
                                                style={{width : "35px", height:"35px", borderRadius: "50%"}} 
                                                onClick={()=>handleQuantity("-", data.prodId)}
                                                disabled={data.quantity === 1 || !productItem || isProcessing}
                                                >

                                                    {loadingId === `${data.prodId}--` ? (
                                                        <div className="spinner-border spinner-border-sm text-white opacity-75" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    ) : "-"}

                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bx bx-x fs-4 position-absolute d-flex align-items-center justify-content-center end-0 top-0 
                                        text-danger  " style={{cursor:"pointer", width : "30px ", height: "30px", borderRadius:"50%"}}
                                    onClick={()=>removeItem(data.prodId)}></div>
                                </div>
                            </div>
                        )})}
                    </div>
                    </div>
                        
                    <div className="row rounded py-3 " >
                        <div className="col rounded d-flex align-items-center justify-content-between">
                            <div className=" d-flex">
                                <p className="m-0 text-capitalize fw-bold">total price: </p>
                                <p className="m-0 text-capitalize ms-3 text-danger">{"₱"+totalPrice.toLocaleString('en-PH')+".00"}</p>
                            </div>
                            <button className="btn btn-success text-capitalize btn-sm"
                            
                            onClick={()=> {
                                // setOrderForm(true);
                                navigate("/user/checkout", { state : { source : "cart", items : cart}});
                            }}
                            >checkout</button>
                        </div>
                    </div>
                    </>
                ) : (
                    <div className="row rounded h-100 d-flex align-items-center">
                        <div className="col-12 ">
                            <p className="m-0 text-center opacity-75 text-capitalize">{error.cart || "no items"}</p>
                        </div>
                    </div>
                )}
            </div>

        </>
    )
}
export default Cart;