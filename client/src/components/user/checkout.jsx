import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageFullScreen from "./imgfullscreen.jsx";
import OnlinePayment from "./onlinepayment.jsx";
import { userContext } from "../../context/userContext.jsx";
import { useLayoutEffect } from "react";

const Checkout = () =>{
    const {viewQr, setOpenCart} = useContext(userContext);
    const [enableSubmit,  setEnableSubmit] = useState(false);
    const {checkoutForm, setCheckoutForm} = useContext(userContext);
    const [billingAddress, setBillingAddress] = useState({
        firstname: '',
        lastname: '',
        email: '',
        contact: '',
    });
    const [loading, setLoading] = useState(true);    
    const navigate = useNavigate();
    const location = useLocation();
    const [isComplete, setIsComplete] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");
    const [isModalVisible, setIsModalVisible] = useState(false);


    useEffect(()=>{

        if(!location.state) return navigate("/");

        const { source, items, products } = location.state;
        const newItems = source === "cart" ? items : products;

        if (newItems) {
            setCheckoutForm((prev) => ({
                ...prev, 
                items : newItems
            }))
        }   
    },[location]);


    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                    if (modalType === "success") {
                        if(location?.state.source === "cart"){
                            placeOrderAndclearCart();
                            setOpenCart((prev) => !prev);
                        }
                        navigate("/");
                    }
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showModal, modalType, location, navigate, setOpenCart]);

    
    useLayoutEffect(() => {

        if(!billingAddress?.firstname || !billingAddress?.lastname || !billingAddress?.email || !billingAddress?.contact || !billingAddress?.province || !billingAddress?.city || !billingAddress?.barangay || !billingAddress?.detailAddress || !billingAddress?.zipCode ) {

            setIsComplete(false);
        } else {
            setIsComplete(true);
        }   

    },[billingAddress]);


    useLayoutEffect(()=>{

        if( checkoutForm.orderMethod && checkoutForm.payment && checkoutForm.image && checkoutForm.text ){
            setEnableSubmit(true);
        }else{
            setEnableSubmit(false);
        }

           if(checkoutForm.orderMethod && checkoutForm.payment === "cash on delivery" ){
            setEnableSubmit(true);
        }


    },[checkoutForm]);



    const totalPrice = useMemo(()=> {
        return checkoutForm.items?.reduce((sum, data) => sum + data.prodPrice * data.quantity, 0);
    },[checkoutForm]);

    // Shipping fee calculation
    const shippingFee = useMemo(() => {
        return checkoutForm.orderMethod === "delivery" ? 30 : 0;
    }, [checkoutForm.orderMethod]);

    // Final total with shipping
    const finalTotal = useMemo(() => {
        return totalPrice + shippingFee;
    }, [totalPrice, shippingFee]);

    

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getBillingAddress`,{
            method:"GET",
            headers : {"Content-Type" : "application/json"},
            credentials : "include"
        })
        .then(async(res) => {
            console.log("Response Status from checkout: ", res.status);
            const data = await res.json();
            if(!res.ok ) throw new Error(data.message);
            return data;
        })
        .then(data => {
            setLoading(false);
            setBillingAddress(data.billingAddress);
            setCheckoutForm((prev) => ({
                ...prev, billingAddress : data.billingAddress
            }))
        })
        .catch(err => {
            setLoading(false);
            console.log("Error: ", err.message);
        });
    },[]);

    const showNotification = (message, type = "success") => {
        setModalMessage(message);
        setModalType(type);
        setShowModal(true);
    };

    const handleForm = async(e)=>{
        e.preventDefault();

        const sendData = new FormData();
        sendData.append("source", location?.state.source);
        sendData.append("billingAddress", JSON.stringify(checkoutForm.billingAddress));
        sendData.append("items", JSON.stringify(checkoutForm.items));
        sendData.append("orderMethod", checkoutForm.orderMethod);
        sendData.append("payment", checkoutForm.payment);
        sendData.append("image", checkoutForm.image);
        sendData.append("text", checkoutForm.text);
        sendData.append("totalPrice", totalPrice);
        sendData.append("shippingFee", shippingFee);
        sendData.append("finalTotal", finalTotal);

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/checkout`,{
                method : "POST",
                body : sendData,
                credentials : "include"
            })
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            showNotification(data.message, "success");
            
        }catch(err){
            showNotification(err.message, "error");
            console.log("Error: ", err.message);
        }
    }


    const placeOrderAndclearCart = async()=>{
        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/placeOrderclearCart`, {
                method : "DELETE",
                credentials : "include"
            })
            if(!res.ok){
                throw new Error("Response is not ok!");
            }
            const data = await res.json();
            console.log(data.message);
        }catch(error){
            console.log(error.message);
        }
    }


    const handleChange = (e) => {

        const { name, value } = e.target;
        setCheckoutForm((prev) => ({
            ...prev, 
            [name] : value
        }))
    }

    if(loading) return <p></p>

    return ( 
        <>
        <div className="bg min-vh-100 d-flex">
            <div className="container bg-white">
                <div className="row py-2 justify-content-center">
                   <div className="col-12 col-lg-10">
                        {/* Back Button Header */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <button 
                                className="btn btn-outline-success"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fa fa-arrow-left"></i>
                            </button>
                            <div>
                                <p className="m-0 fs-5 fw-bold text-capitalize text-success">checkout</p>
                                <p className="m-0 small text-muted">Review and place your order</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-5">
                        <p className="m-0 text-capitalize fw-bold opacity-75 my-4 ">order {checkoutForm.items.length > 1 ? "items" : "item"}:</p>
                        {checkoutForm.items.map((data, i)=>(
                            <div key={i} className="row g-0 p-2 rounded bg-beige shadow-sm border mt-2">
                                <div className="col-5 col-md-4 ">
                                    <img src={`${import.meta.env.VITE_API_URL}/api/Uploads/${data.imageFile}`} alt={data.imageFile} className="img-fluid rounded shadow-sm border"/>
                                </div>

                                <div className="col ms-3">
                                    <p className="m-0 fw-bold text-capitalize" >{data.prodName}</p>       
                                    <p className="m-0 text-capitalize text-muted small" >{data.prodDisc}</p>  
                                    <p className="m-0 fw-bold text-muted small">{data.quantity+"x"}</p>
                                    <p className="m-0 text-end text-capitalize bold fw-bold"
                                    >{`₱${data.prodPrice.toLocaleString('en-PH')+".00"}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    <div className="col-12 col-md-6 col-lg-5">
                        <form action="#" onSubmit={handleForm} >
                            <p className="m-0 text-capitalize fw-bold mt-4 opacity-75">billing address:</p>
                            <div className="p-2 mt-2">
                                {
                                    isComplete ?
                                    (
                                        <>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="fa-solid fa-location-dot small">
                                                </div>
                                                <p className="m-0 text-capitalize fw-bold ">
                                                    {`${billingAddress?.firstname} ${billingAddress?.lastname}`}
                                                </p>
                                            </div>

                                            <p className="m-0 text-capitalize text-center px-2 py-1 mt-2 rounded bg-dark text-light small"
                                            style={{fontSize:"12px", cursor:"pointer"}}
                                            onClick={() => {
                                                navigate("/user/address")
                                            }}
                                            >change</p>
                                        </div>

                                        {[
                                            {data : billingAddress.contact},
                                            {data : billingAddress.email},
                                            {data : `${billingAddress.detailAddress}, ${billingAddress.barangay}, ${billingAddress.city}, ${billingAddress.province}, ${billingAddress.zipCode}`},
                                        ].map((info, i) => (
                                            <p key={i} className={`m-0 mt-1 text-muted small
                                            ${i === 1 ? "text-normal " : "text-capitalize "}`}
                                            >{info.data}</p>
                                        ))}
                                        </>
                                    ):(
                                        <button className="d-flex align-items-center justify-content-center gap-2 bg rounded p-2 w-100 bg-dark
                                        border-0"
                                        onClick={()=> navigate("/user/address")}
                                         >
                                            <i className="fa-solid fa-circle-plus text-white" 
                                           ></i>
                                            <p className="m-0 small text-white">Add Address</p>
                                        </button>
                                    ) 
                                }
                            </div>

                            <div className="mt-3 pt-2  border-top border-2">
                                <p className="m-0 text-capitalize my-2 fw-bold opacity-75">order method:</p>
                                <div className="d-flex align-items-center gap-4">
                                    {[
                                        {label: "for delivery", value: "delivery"},
                                        {label: "for pick up",  value: "pick up"},
                                    ].map((data, i) => (
                                        <div key={i} className="d-flex align-items-center gap-2 ">
                                            <label className="text-capitalize small">{data.label}:</label>
                                            <input type="radio"
                                            className=""
                                            value={data.value}
                                            name="orderMethod"
                                            onChange={handleChange}
                                            required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>


                            <div className="mt-3">
                                <p className="m-0 text-capitalize my-2  fw-bold text-muted">mode of payment:</p>

                                <div className="px-2 ">
                                    <select
                                        id="payment-method"
                                        name="payment"
                                        className="form-select border-1 border-dark text-capitalize "
                                        disabled={Object.keys(billingAddress).length === 0 || checkoutForm?.orderMethod === undefined}
                                        onChange={handleChange}
                                        style={{ 
                                            cursor: `${(Object.keys(billingAddress).length === 0 || 
                                            checkoutForm?.orderMethod === undefined) 
                                            ? "default" : "pointer"}`,
                                            fontSize: "14px"
                                        }}
                                        value={checkoutForm?.payment || ""}
                                        required

                                    >   
                                    <option value=""
                                    className="text-capitalize"
                                    disabled hidden
                                    >Select payment method</option>

                                    {checkoutForm?.orderMethod === "delivery" && (
                                        ["cash on delivery", "gcash", "maya"].map((method, i) => (
                                            <option key={i} value={method} className="text-capitalize">
                                                {method}
                                            </option>
                                        ))
                                    )}
                                    {checkoutForm?.orderMethod === "pick up" && (
                                        ["gcash", "maya"].map((method, i) => (
                                            <option key={i} value={method} className="text-capitalize">
                                                {method}
                                            </option>
                                        ))
                                    )} 

                                    </select>
                                    {checkoutForm?.orderMethod === "pick up" && (
                                        <p className="m-0 fw-bold text-danger opacity-75 mt-2 text-capitalize"
                                        style={{fontSize: "12px"}}
                                        >payment first for pick up method *</p>
                                    )}

                                </div>
                            </div>

                            {(checkoutForm.payment === "gcash" || checkoutForm.payment === "maya")  
                            && <OnlinePayment/>}

                            
                            <div className="mt-3 ">
                                {/* Estimated Delivery - Only show for delivery */}
                                {checkoutForm.orderMethod === "delivery" && (
                                    <div className="mb-2 p-2 bg-light rounded">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <p className="m-0 text-capitalize small fw-semibold">estimated delivery:</p>
                                            <p className="m-0 text-capitalize small fw-bold text-success">1-day</p>
                                        </div>
                                    </div>
                                )}

                                <p className="m-0 text-capitalize  fw-bold opacity-75 ">order summary:</p>
                                <div className="p-2 ">
                                    {/* Original Price */}
                                    <div className="mt-1 d-flex justify-content-between align-items-center">
                                        <p className="m-0 text-capitalize small">original price:</p>
                                        <p className="m-0 text-capitalize small">₱{totalPrice.toLocaleString('en-PH')}.00</p>
                                    </div>

                                    {/* Shipping Fee */}
                                    <div className="mt-1 d-flex justify-content-between align-items-center">
                                        <p className="m-0 text-capitalize small">shipping fee:</p>
                                        <p className="m-0 text-capitalize small">
                                            {checkoutForm.orderMethod === "delivery" ? "₱30.00" : "Free"}
                                        </p>
                                    </div>

                                    {/* Total Payment */}
                                    <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                                        <p className="m-0 text-capitalize fs-5 fw-bold">total payment:</p>
                                        <p className="m-0 text-capitalize fs-5 fw-bold text-danger">
                                            ₱{finalTotal.toLocaleString('en-PH')}.00
                                        </p>
                                    </div>
                                </div>

                                <button className={`p-2 mt-3 w-100 rounded border-0 bg-dark text-capitalize text-light 
                                ${!enableSubmit || !isComplete ? "opacity-75" : "opacity-100"}`} 
                                disabled={!enableSubmit || !isComplete}
                                >{!isComplete ? "complete address"
                                : enableSubmit ? "place order "  : "complete payment"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        {viewQr && <ImageFullScreen/>}
        {/* Success/Error Modal with Animation */}
        {showModal && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
            >
                <div
                    className="bg-white rounded shadow p-4 text-center"
                    style={{
                        maxWidth: "400px",
                        width: "90%",
                        transform: isModalVisible ? "scale(1)" : "scale(0.7)",
                        opacity: isModalVisible ? 1 : 0,
                        transition: "all 0.3s ease-in-out"
                    }}
                >
                    <div className="mb-3">
                        {modalType === "success" ? (
                            <i className="bx bx-check-circle text-success" style={{ fontSize: "60px" }}></i>
                        ) : (
                            <i className="bx bx-error-circle text-danger" style={{ fontSize: "60px" }}></i>
                        )}
                    </div>
                    <h5 className={`fw-bold text-capitalize mb-2 ${modalType === "success" ? "text-success" : "text-danger"}`}>
                        {modalType === "success" ? "success!" : "error!"}
                    </h5>
                    <p className="small text-muted mb-0">{modalMessage}</p>
                </div>
            </div>
        )}
       
        </>                        
    )
}

export default Checkout;