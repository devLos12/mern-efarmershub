import React, { useEffect, useState, useContext } from "react";
import { useBreakpoint } from "./breakpoint.jsx";
import { adminContext } from "../context/adminContext.jsx";
import { sellerContext } from "../context/sellerContext";
import { appContext } from "../context/appContext.jsx";
import { useNavigate } from "react-router-dom";



const ProductCard = ({ products })=>{
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);
    const context = role === "admin" ? admin : seller;
    
    const {setText, setInventoryData, setUpdateStatusModal, setDeleteProductModal,
        setSellerDeleteModal, setSellerData, setSellerUpload, setProductUpdateData,
        setEditProduct
    } = context;

    const width = useBreakpoint();
    const navigate = useNavigate();

    const updateProduct = (data) => {
        if(role === "seller") {
            setSellerUpload({ isShow: true, data: data });
        } else {
            setEditProduct({ isShow: true,  data: data })
        }
    }

    const deleteProduct = (id) =>{
        if(role === "admin"){
            setDeleteProductModal(true);
            setText("do you want to delete this item?");
            setInventoryData((prev) => ({
                ...prev, 
                deleteProduct : {id : id}
            }));
        }else{
            setSellerDeleteModal(true);
            setText("do you want to delete this item?");
            setSellerData((prev) => ({
                ...prev, 
                deleteProduct : { id : id}
            }))
        }
    }

    const updateStatus = (id, newStatus) =>{
        setUpdateStatusModal(true);
        setText( newStatus === "approved" && "approve this product?" ||
                 newStatus === "rejected" && "reject this product?");
        setInventoryData((prev) => ({
            ...prev, 
            updateStatus : {id : id, newStatus : newStatus}
        }));
    }


    const FontSize = () => {
        if(width <= 344) return "10px";
        if(width <= 768) return "12px";
        return "14px"
    } 
    
    return (
        <div className={`row g-0`}>
            {products.map((data, i) => (
                <div key={i} className="col-6  col-sm-4 col-md-4 col-lg-4 col-xl-3 col-xxl-3">
                    <div className="bg-white border rounded g-0 p-1 p-md-2 p-lg-3  me-1 mb-1">
                        <div className="12">
                            <img src={data.imageFile} alt={data.imageFile} className="img-fluid rounded " style={{cursor:"pointer"}} 
                            
                            onClick={()=>{
                                
                                if(role === "admin"){
                                    navigate("/admin/productdetails", { state : {source: "inventory", productId : data._id}});
                                }
                                
                                if(role === "seller"){
                                    navigate("/seller/productdetails", { state : {source: "inventory", productId : data._id}});
                                }
                            }}/>
                        </div>

                        <div className="mt-2">
                            <p className="m-0 text-capitalize text-center fw-bold  small text-success" 
                            >{data.name}</p> 
                            <div className="m-0 d-flex align-items-center justify-content-center gap-1"
                            style={{fontSize: "12px"}}
                            >
                                <i className="fa fa-star text-warning small"></i>
                                <p className="m-0 fw-bold text-capitalize text-warning small">ratings</p>
                                <p className="m-0 text-muted fw-bold small">{`${data.totalRatings}`}</p>
                            </div>

                            <div className="mt-3 d-flex align-items-center justify-content-between ">
                                <p className="m-0 text-capitalize small text-muted " >price:</p>
                                <div className="d-flex align-items-center gap-1">
                                    <p className="m-0 text-capitalize fw-bold text-success small">
                                        ₱{data.price.toLocaleString('en-PH', 
                                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                        )}</p> 
                                </div>
                            </div>  
                            <div className="d-flex aling-items-center justify-content-between">
                                <p className="m-0 text-capitalize small text-muted" >stocks:</p>
                                <p className="m-0 text-capitalize fw-bold small ">{
                                    data.stocks > 1 ? data.stocks + " bundles "
                                    : data.stocks === 1 ? data.stocks + " bundle " : "out of stock"}
                                </p>
                            </div>
                            <div className="text-end mt-1">
                                <p className="m-0 text-muted" style={{fontSize: "10px"}}>
                                    1 bundle = {data.kg || 2}kg
                                </p>
                            </div>
                        </div>

                        <ProductButton 
                        role={role} 
                        data={data} 
                        FontSize={FontSize} 
                        updateStatus={updateStatus}
                        deleteProduct={deleteProduct}
                        updateProduct={updateProduct}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
export default ProductCard;


const ProductButton = ({role, data, FontSize, updateStatus, deleteProduct, updateProduct}) =>{

    const isPending = status => status === "pending"; 
    const isApproved = status => status === "approved";
    const isRejected = status => status === "rejected";

    if(role === "admin"){
        return (
              <div className="row g-0 gap-2 mt-2 rounded ">
                {isRejected(data.statusApprove) ? (
                    undefined
                ) : (
                    <div className="col">
                        <button className={`d-none d-md-flex p-1 bg-dark text-light rounded-pill d-flex align-items-center justify-content-center
                        gap-2 border w-100`} 
                        onClick={()=> {
                            isPending(data.statusApprove) && updateStatus(data._id, "approved")
                            isApproved(data.statusApprove) && updateProduct(data)
                        }}
                        style={{outline: "none"}}>
                            <div className={`small
                                ${isPending(data.statusApprove) && "fa fa-check"}
                                ${isApproved(data.statusApprove) && "fa fa-pen"}
                                `} style={{fontSize : FontSize()}}></div>
                            <p className="m-0 text-capitalize small" 
                            >{isPending(data.statusApprove) ? "accept" : "edit"}</p>
                        </button>
                    </div>
                )}

                <div className="col">
                    <button className={`p-1 d-none d-md-flex bg-danger rounded-pill d-flex align-items-center justify-content-center 
                    border border-danger border-opacity-25 w-100 bg-danger bg-opacity-10 gap-2`}

                    style={{ outline: "none"}}
                    onClick={()=> isPending(data.statusApprove) ? 
                    updateStatus(data._id, "rejected") : deleteProduct(data._id)}>
                        <div className={`small text-danger 
                        ${isPending(data.statusApprove) && "fa fa-x "} 
                        ${isApproved(data.statusApprove) && "bx bx-trash "}
                        ${isRejected(data.statusApprove) && "bx bx-trash "}
                        `} 
                        ></div>
                        <p className="m-0 text-capitalize small text-danger " 
                        >{isPending(data.statusApprove) ? "reject" :"delete"}</p>
                    </button>
                </div>

            </div>
        )
    }

    if(role === "seller") {
        return (
            <div className="row g-0 gap-2 gap-md-3 mt-3 rounded ">

                {isRejected(data.statusApprove) ? (
                    undefined
                ) : (
                    
                    <div className="col">
                        <button className="p-1 d-none d-md-flex bg-dark rounded-pill d-flex align-items-center justify-content-center w-100 border" 
                        style={{outline: "none"}}
                        onClick={()=>updateProduct(data)}>
                            <div className="fa fa-pencil me-2 small text-white"></div>
                            <p className="m-0 small text-white" 
                            >Edit</p>
                        </button>
                    </div> 
                )}

                <div className="col">
                    <button className="p-1 d-none d-md-flex bg-danger bg-opacity-10 rounded-pill d-flex align-items-center justify-content-center w-100 border-1 border-danger border-opacity-25 " 
                    style={{outline: "none"}}
                    onClick={()=>deleteProduct(data._id)}>
                        <div className="bx bx-trash text-danger"  
                        ></div>
                        <p className="m-0 small text-danger" 
                        >Delete</p>
                    </button>
                </div>

            </div>
        )
    }
}