
import React, {useContext, useEffect, useMemo,  useState } from "react";
import { MyContext } from "../../context/contextApi";

const PlaceOrderForm = ({setOrderForm, orders, userId})=>{
    const {form, setForm} = useContext(MyContext);
    const [loading, setLoading] = useState(false);



    
    useEffect(()=> {
        console.log("this is orders: ",orders);
    },[])


    const orderItems = useMemo(()=>{
        return orders.map(({ prodId, prodName, quantity, prodPrice, imageFile }) => ({
            prodId, prodName, quantity, prodPrice, imageFile
        }));
    },[orders]);

    const totalPrice = useMemo(()=>{
        return orders.reduce((sum, data) => sum + data.prodPrice * data.quantity, 0);
    },[orders]);


    

    const handleForm = async(e) =>{
        e.preventDefault();

        
        const orderForm = { userId, orderItems, ...form,  totalPrice }

        if(form.payment === "online payment"){
            setLoading(true);
        }

        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submitOrder`,{
                method: "POST",
                headers : {
                    "Content-Type" : "application/json"
                }, 
                body : JSON.stringify(orderForm)
            });
            if(!res.ok){
                throw new Error("response is not ok!")
            }
            const data = await res.json();

            if(data.type === "link"){
                window.location.href = data.checkout_url;
                return;
            }

            if(data.message){
                alert(data.message);
            }
            setOrderForm(false);
            placeOrderAndclearCart(userId);
            window.location.reload();
        }catch(error){
            console.log(error.message)
        }
    }

    const placeOrderAndclearCart = async(userId)=>{
        try{
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/placeOrderclearCart/${userId}`, {
                method : "DELETE",
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

    const handleChange = (e) =>{
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name] : value
        }))
    }


    return(
        <div className="container-fluid position-fixed  top-0 start-0 end-0 
        vh-100 z-3" style={{backgroundColor : "rgba(0, 0, 0, 0.594)"}}>
            <div className="container mt-3">
                <div className="row justify-content-center ">
                    <div className="col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-5">
                        <div className="card" style={{height: "570px"}}>
                            <h1 className="text-capitalize ms-3 mt-4 fs-4 fw-bold text-center">order form</h1>
                            <div className="card-body ">
                                <form action="#" onSubmit={handleForm} className="p-2 px-3  rounded h-100
                                 d-flex flex-column justify-content-between" >
                                    <div className="rounded " style={{maxHeight : "410px", overflow:"hidden",  overflowY:"scroll"}}>
                                        <div className="d-flex justify-content-between">
                                            {[{for : "product", text: "product"}, {for:"quantity", text: "quantity"},
                                            {for :"price", text: "price"}].map((data, i) => (
                                                <label key={i} className="text-capitalize "
                                                htmlFor={data.for}>{data.text}</label>
                                            ))}
                                        </div>
                                        <div className=" rounded opacity-75 py-2 ">
                                            {orderItems.map((order, i) => (
                                                <div key={i} className="d-flex justify-content-between mt-1">
                                                    {[
                                                        {value : order.prodName},
                                                        {value : order.quantity},
                                                        {value : "- ₱"+order.prodPrice+".00"},

                                                    ].map((data, i) => (
                                                        <p key={i}
                                                        className={`w-50  opacity-75 border-0 m-0 ${i === 1 ? "text-center" :
                                                        i === 2 ? "text-end" : "text-start"}`} 
                                                        style={{outline : "none", fontSize:"14px"}}
                                                        >{data.value}</p>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="d-flex justify-content-between mt-2">
                                                <p className="text-capitalize m-0 fs-6  ">total payment: </p>
                                                <p className="text-capitalize m-0 fs-6 text-danger">- {"₱"+totalPrice+".00"}</p>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mt-2">
                                                <p className="text-capitalize m-0 ">payment method: </p>
                                                <select className="text-capitalize px-1 border-0" 
                                                id="" 
                                                name="payment"
                                                value={form.payment}
                                                onChange={handleChange}
                                                style={{outline:"none"}}>
                                                    {["cash on delivery", "online payment"].map((data, i)=>(
                                                        <option key={i} value={data}>{data}</option>
                                                    ))}
                                                </select>
                                        </div>
                                        <div className=" mt-3">
                                            <p className="m-0 d-flex fw-bold">Customer Information 
                                                <span className="m-0 ms-1 text-danger opacity-75">*</span>
                                            </p>
                                            <div className="row g-0 mt-2 justify-content-between">
                                                {[
                                                    {label:"firstname", name: "firstname", for: "firstname",type:"text"},
                                                    {label:"lastname",  name: "lastname",  for: "lastname", type:"text"},
                                                ].map((data, i)=> (
                                                    <div key={i} className="col-5">
                                                        <input className="rounded border-1 p-1 px-2 w-100 text-capitalize" 
                                                        style={{fontSize:"12px", outline:"none"}}
                                                        name={data.name} 
                                                        type={data.type}
                                                        value={form[data.name] || ""}
                                                        onChange={handleChange}
                                                        required/> 
                                                        <label className="opacity-75 text-capitalize" style={{fontSize:"14px"}}
                                                        htmlFor={data.for}>{data.label}:</label>
                                                    </div>
                                                ))}
                                            </div>
                                            {[
                                                {label : "email",            name: "email",   type:"text"},
                                                {label : "contact",          name: "contact", type:"text"},
                                                {label : "shipping address", name: "address", type:"text"},
                                            ].map((data, i)=> (
                                                <div key={i} className="row mt-2">
                                                    <div className="col">
                                                        <input 
                                                        className="w-100 p-1 px-2 rounded border-1" 
                                                        style={{outline:"none"}}
                                                        type={data.type}
                                                        name={data.name}
                                                        onChange={handleChange}
                                                        value={form[data.name] || ""}
                                                        required
                                                        />
                                                        <p className="m-0 opacity-75 text-capitalize" 
                                                        style={{fontSize:"12px"}}>{data.label}:</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="row mt-4">
                                        <div className="col-12 text-end">
                                            <button className="w-25 border-0 rounded bg-danger text-white  py-2 "
                                            onClick={()=> setOrderForm(false)}>Cancel</button>
                                            
                                            <button
                                                className={`w-50 ms-2 border-0 rounded bg-dark text-white py-2 text-capitalize
                                                ${loading ? "opacity-75" : ""}`}
                                                disabled={loading}
                                            >
                                                {form.payment.toLowerCase() === "online payment" 
                                                ? "proceed payment" : "checkout"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default PlaceOrderForm;