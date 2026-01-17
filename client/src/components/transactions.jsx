import React, { useContext, useRef, useState } from "react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBreakpointHeight } from "./breakpoint";
import { appContext } from "../context/appContext";
import { useActionState } from "react";
import { adminContext } from "../context/adminContext";
import { sellerContext } from "../context/sellerContext";
import html2pdf from 'html2pdf.js';
import DamageLog from "./admin/damageLog";




const Transactions = () => {
    const { role } = useContext(appContext);
    const admin = useContext(adminContext);
    const seller = useContext(sellerContext);

    

    const location = useLocation();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const height = useBreakpointHeight();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isSelect, setIsSelect] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [imageFile, setImageFile] = useState({});
    const [imagePrev, setImagePrev] = useState({});
    const [source, setSource] = useState('');  
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    


    // Modal states - add after existing states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);




    // Payout Modal states
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);



    const fileUploadRef = useRef({});
    const printRef = useRef();




    const handlePrint = () => {
    const printContent = printRef.current.cloneNode(true);

    // Sa taas ng component, after existing states

    
    // Remove all elements that contain images or file inputs
    const elementsToRemove = printContent.querySelectorAll('img, input[type="file"], label[for*="inputFile"]');
    elementsToRemove.forEach(el => {
        // Remove the entire parent td if it contains images
        const td = el.closest('td');
        if (td) {
            td.innerHTML = '<span class="text-muted small">-</span>';
        }
    });
    
    // Remove receipt/image columns completely
    const imageContainers = printContent.querySelectorAll('.border.rounded.shadow-sm');
    imageContainers.forEach(container => {
        const td = container.closest('td');
        if (td) {
            td.innerHTML = '<span class="text-muted small">-</span>';
        }
    });
    
    const windowPrint = window.open('', '', 'width=900,height=650');



    
    windowPrint.document.write(`
        <html>
            <head>
                <title>Print Transactions</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                        font-size: 12px;
                    }
                    th {
                        background-color: #198754;
                        color: white;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .header h2 {
                        margin: 0;
                        color: #198754;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    button { display: none !important; }
                    img { display: none !important; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Transaction Report</h2>
                    <p>Date: ${new Date().toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                    <p>Type: ${source === 'payout/seller' ? 'Farmer Payout' : 
                                source === 'payout/rider' ? 'Rider Payout' : 
                                source === 'payout' ? 'Payout' : 'Payment'}</p>
                    <p>Total Records: ${filteredTransactions.length}</p>
                </div>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() { 
                        window.print(); 
                        window.onafterprint = function() { window.close(); }
                    }
                </script>
            </body>
        </html>
    `);
    
    windowPrint.document.close();
    };


    const handleDownloadPDF = () => {
        const printContent = printRef.current.cloneNode(true);
        
        // Remove all elements that contain images or file inputs
        const elementsToRemove = printContent.querySelectorAll('img, input[type="file"], label[for*="inputFile"]');
        elementsToRemove.forEach(el => {
            const td = el.closest('td');
            if (td) {
                td.innerHTML = '<span class="text-muted small">-</span>';
            }
        });
        
        // Remove image containers
        const imageContainers = printContent.querySelectorAll('.border.rounded.shadow-sm');
        imageContainers.forEach(container => {
            const td = container.closest('td');
            if (td) {
                td.innerHTML = '<span class="text-muted small">-</span>';
            }
        });

        // Create a wrapper with header
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #198754;">Transaction Report</h2>
                <p style="margin: 5px 0; color: #666;">Date: ${new Date().toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p style="margin: 5px 0; color: #666;">Type: ${source === 'payout/seller' ? 'Farmer Payout' : 
                            source === 'payout/rider' ? 'Rider Payout' : 
                            source === 'payout' ? 'Payout' : 'Payment'}</p>
                <p style="margin: 5px 0; color: #666;">Total Records: ${filteredTransactions.length}</p>
            </div>
        `;
        wrapper.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `transactions_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(wrapper).save();
    };



    const toggleSelectAll = () => {


        setIsAllSelected((prev) => {
            const newValue = !prev;

            if(newValue) {
                const allIds = new Set(filteredTransactions.map((t) => t._id));
                setSelectedIds(allIds);
            } else {
                setSelectedIds(new Set());
            }

            return newValue;
        })

    }


    const toggleSelect = (id) => {

        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id); 
            } else {
                updated.add(id);
            }
            
            setIsAllSelected(updated.size === filteredTransactions.length);
            return updated;
        });
    };


    const filteredTransactions = useMemo(()=> {
        if(!debouncedSearch) return transactions;

        return transactions.filter((t) => {
            
            const name = ( t.sellerName || "" ).toLowerCase();
            const email= ( t.sellerEmail || "").toLowerCase();

            return name.includes(debouncedSearch) || email.includes(debouncedSearch);
        })

    },[transactions, debouncedSearch]);


    useEffect(()=> {
        const result = setTimeout(()=> {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);

        return ()=> clearTimeout(result);
    },[search]);







    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);


    const riderTab = location.state?.riderTab || 'delivered'; // default is 'delivered'


    useEffect(() => {
        setCurrentPage(1);
    }, [search, source])





    const handleRemoveFile = (id) => {

        setImageFile(prev => {
            const newFiles = { ...prev };
            delete newFiles[id];
            return newFiles;
        });
                
        if (fileUploadRef.current[id]) {
            fileUploadRef.current[id].value = null;
        }
    }

    const handleFile = (e, id) => {
        const { name } = e.target;
        const file = e.target.files[0];

        setImageFile((prev) => ({
            ...prev, 
            
            [id] : {
                [ name ] : file,
                preview: file?.name    
            }

        }))

        if(file){
            const reader = new FileReader();
            reader.onload = (e) =>{
                setImagePrev((prev) => ({
                    ...prev, [id]: e.target.result
                }));
            }
            reader.readAsDataURL(file);
        }
    }

    // Function to open modal with image
    const openImageModal = (imageSrc, title) => {
        setModalImage(imageSrc);
        setModalTitle(title);
        setShowModal(true);
    }

    // Function to close modal
    const closeModal = () => {
        setShowModal(false);
        setModalImage('');
        setModalTitle('');
    }




    const openPayoutModal = (transaction) => {
        setSelectedTransaction(transaction);
        setShowPayoutModal(true);

    };

    const closePayoutModal = () => {
        setShowPayoutModal(false);
        setSelectedTransaction(null);
    };






    const handlePayout = async(id) => {
        if(!imageFile[id]?.preview){
            setModalMessage("Receipt file is required");
            setShowErrorModal(true);
            return;
        }

        setTransactions((items) => 
            items.map((item) => item._id === id ? ({...item, status: "paid",}) : item)
        )

        const formData = new FormData();
        formData.append("id", id);
        formData.append("image", imageFile[id]?.image);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/updatePayout`, {
                method: "PATCH",
                body: formData,
                credentials: "include"
            })

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);


            setImageFile(prev => {
                const newFiles = { ...prev };
                delete newFiles[id];
                return newFiles;
            });

            // ✅ CLEAR THE FILE INPUT REF
            if (fileUploadRef.current[id]) {
                fileUploadRef.current[id].value = null;
            }

            setRefresh(prev => !prev);

            setModalMessage(data.message || "Payout completed successfully!");
            setShowSuccessModal(true);
        } catch (error) {
            console.log("Error: ", error.message);
            setModalMessage(error.message || "Failed to process payout");
            setShowErrorModal(true);
        }
    }


    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            setRefresh((prev) => !prev);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.log("Refresh error:", error.message);
        } finally {
            setIsRefreshing(false);
        }
    };




    const handleDelete = async() => {
        if(selectedIds.size === 0) {
            setModalMessage("No transactions selected yet");
            setShowErrorModal(true);
            return;
        }

        const sendData = [...selectedIds];
        
        let endPoint = '';

        if(role === "admin") {
            endPoint = source === "payout/seller" || source === "payout/rider" 
            ? "deletePayout"
            : "deletePayment";
        
        } else {
            endPoint = source === "payout"
            ? "sellerDeletePayout"
            : "sellerDeletePayment"
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`,{
                method: source === "payout/seller" || source === "payout/rider" || source === "payout" ? "PATCH" : "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ items: sendData}),
                credentials: "include"
            })

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            
            console.log(data.message);
            setTransactions((prev) => prev.filter((item) => !selectedIds.has(item._id)));
            setSelectedIds(new Set());
            setIsAllSelected(false);
            
            setModalMessage(data.message || `Successfully deleted ${sendData.length} transaction(s)`);
            setShowSuccessModal(true);
        } catch (error) {
            console.log("Error: ", error.message);
            setModalMessage(error.message || "Failed to delete transactions");
            setShowErrorModal(true);
        }
    }
        



    useEffect(() => {
        const fetchTransactions = async () => {
            
            const endPoint = role === "admin"
                ? "getTransactions"
                : "getSellerTransactions";

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, { 
                    method: "GET",
                    credentials: "include"
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                let transactions = [];

                if (location?.state?.source === `payout${role === "admin" ? "/seller" : ""}`) {
                    transactions = data.payout?.reverse() || [];
                    setSource(`payout${role === "admin" ? "/seller" : ""}`);
                } 

                if (location?.state?.source === `payout/rider`) {
                    transactions = data.riderPayout?.reverse() || [];
                    setSource(`payout${role === "admin" ? "/rider" : ""}`);
                } 

                if (location?.state?.source === "payment") {
                    transactions = data.payment?.reverse() || [];
                    setSource("payment");
                }

                setTransactions(transactions);
            } catch (err) {
                console.log("Error:", err.message);
            }
        };
        fetchTransactions();
    }, [location?.state?.source, refresh]);

   



    // Handle modal animation
    useEffect(() => {
        if (showSuccessModal || showErrorModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            // Auto-close after 2 seconds for success
            if (showSuccessModal) {
                const timer = setTimeout(() => {
                    setIsModalVisible(false);
                    setTimeout(() => {
                        setShowSuccessModal(false);
                    }, 300);
                }, 2000);
                
                return () => clearTimeout(timer);
            }
        }
    }, [showSuccessModal, showErrorModal]);




    const Height = () =>{
        if(height < 574) return height ;
        return height-152;
    }
    
    // Add this calculation where you need it (e.g., in the modal body)
    const taxPercentage = selectedTransaction?.totalAmount > 0 
        ? ((selectedTransaction?.taxAmount / selectedTransaction?.totalAmount) * 100).toFixed(2)
        : 0;

    return (

        <>

        {showSuccessModal && (
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
                        <i className="fa fa-check-circle text-success" style={{ fontSize: "60px" }}></i>
                    </div>
                    <h5 className="fw-bold text-capitalize mb-2 text-success">
                        Success!
                    </h5>
                    <p className="small text-muted mb-0">{modalMessage}</p>
                </div>
            </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
                onClick={() => setShowErrorModal(false)}
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
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-3">
                        <i className="fa fa-times-circle text-danger" style={{ fontSize: "60px" }}></i>
                    </div>
                    <h5 className="fw-bold text-capitalize mb-2 text-danger">
                        Error!
                    </h5>
                    <p className="small text-muted mb-3">{modalMessage}</p>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                            setIsModalVisible(false);
                            setTimeout(() => setShowErrorModal(false), 300);
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        )}


        {/* Payout Modal - Role-based rendering */}
        {showPayoutModal && selectedTransaction && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}
                onClick={closePayoutModal}
            >
                <div
                    className="bg-white rounded shadow-lg"
                    style={{
                        maxWidth: "600px",
                        width: "90%",
                        maxHeight: "90vh",
                        overflow: "auto"
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="border-bottom p-3 d-flex justify-content-between align-items-center sticky-top bg-white">
                        <h5 className="m-0 fw-bold text-success">
                            {role === "admin" 
                                ? (selectedTransaction.status === 'paid' ? 'Payout Details' : 'Process Payout')
                                : 'Payout Details'
                            }
                        </h5>
                        <button 
                            className="btn-close" 
                            onClick={closePayoutModal}
                        ></button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4">
                        {/* Transaction Info */}
                        <div className="mb-4">
                            <h6 className="fw-bold text-muted mb-3">Transaction Information</h6>
                            <div className="row g-2">
                                <div className="col-6">
                                    <p className="m-0 small text-muted">
                                        {selectedTransaction?.orders ? 'Total Orders' : 'Total Delivery'}
                                    </p>
                                    <p className="m-0 fw-bold small">
                                        {selectedTransaction?.orders 
                                            ? (selectedTransaction.orders.length === 1 
                                                ? `${selectedTransaction.orders.length} Order` 
                                                : `${selectedTransaction.orders.length} Orders`)
                                            : (selectedTransaction?.totalDelivery === 1
                                                ? `${selectedTransaction.totalDelivery} Delivery`
                                                : `${selectedTransaction.totalDelivery} Deliveries`)
                                        }
                                    </p>
                                </div>
                                <div className="col-6">
                                    <p className="m-0 small text-muted">Date Payout</p>
                                    <p className="m-0">
                                        {new Date(selectedTransaction.date).toLocaleDateString('en-PH', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="col-6 mt-3">
                                    <p className="m-0 small text-muted">Name</p>
                                    <p className="m-0 fw-bold text-capitalize">
                                        {selectedTransaction.sellerName || selectedTransaction.riderName}
                                    </p>
                                </div>
                                <div className="col-6 mt-3">
                                    <p className="m-0 small text-muted">Email</p>
                                    <p className="m-0 small">
                                        {selectedTransaction.sellerEmail || selectedTransaction.riderEmail}
                                    </p>
                                </div>
                                <div className="col-6 mt-3">
                                    <p className="m-0 small text-muted">E-Wallet</p>
                                    <p className="m-0 fw-bold">{selectedTransaction.e_WalletAcc?.number}</p>
                                    <p className="m-0 small text-capitalize text-muted">{selectedTransaction.e_WalletAcc?.type}</p>
                                </div>
                                <div className="col-6 mt-3">
                                    <p className="m-0 small text-muted">Status</p>
                                    <span className={`badge text-capitalize ${selectedTransaction.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                                        {selectedTransaction.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="mb-4 bg-light rounded p-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Total Amount:</span>
                                <span className="fw-bold">
                                    ₱{selectedTransaction.totalAmount.toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tax Amount:</span>
                                <div className="text-end">
                                    <span className="text-danger d-block">
                                        - ₱{(selectedTransaction?.taxAmount ?? 0).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                    <span className="small text-muted">({taxPercentage}%)</span>
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">Net Amount:</span>
                                <span className="fw-bold text-success fs-5">
                                    ₱{selectedTransaction.netAmount.toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                            </div>
                        </div>
                        <hr />

                        {/* Receipt Section */}
                        <div className="mb-4">
                            <h6 className="fw-bold text-muted mb-3">Payment Receipt</h6>
                            
                            {/* If already has receipt (paid status) */}
                            {selectedTransaction.imageFile ? (
                                <div 
                                    className="border rounded p-3 d-flex align-items-center gap-3"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => openImageModal(
                                        `${import.meta.env.VITE_API_URL}/api/Uploads/${selectedTransaction.imageFile}`,
                                        selectedTransaction.imageFile
                                    )}
                                >
                                    <div 
                                        className="border rounded bg-light d-flex align-items-center justify-content-center"
                                        style={{ 
                                            width: "50px", 
                                            height: "50px", 
                                            minWidth: "50px",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/api/Uploads/${selectedTransaction.imageFile}`}
                                            alt="Receipt"
                                            className="img-fluid"
                                            style={{ 
                                                width: "100%", 
                                                height: "100%", 
                                                objectFit: "cover" 
                                            }}
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="m-0 fw-bold small">{selectedTransaction.imageFile}</p>
                                        <p className="m-0 small text-muted">
                                            <i className="fa fa-search-plus me-1"></i>
                                            Click to view full size
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* If no receipt yet */
                                <>
                                    {role === "admin" ? (
                                        /* Admin - show upload */
                                        <div>
                                            {imageFile[selectedTransaction._id]?.preview ? (
                                                /* Preview uploaded file */
                                                <div className="border rounded p-3 d-flex align-items-center gap-3">
                                                    <div 
                                                        className="border rounded bg-light d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            width: "50px", 
                                                            height: "50px", 
                                                            minWidth: "50px",
                                                            overflow: "hidden",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={() => openImageModal(
                                                            imagePrev[selectedTransaction._id],
                                                            imageFile[selectedTransaction._id]?.preview
                                                        )}
                                                    >
                                                        <img
                                                            src={imagePrev[selectedTransaction._id]}
                                                            alt="Preview"
                                                            className="img-fluid"
                                                            style={{ 
                                                                width: "100%", 
                                                                height: "100%", 
                                                                objectFit: "cover" 
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <p className="m-0 fw-bold small">
                                                            <i className="fa fa-file-image me-2 text-success"></i>
                                                            {imageFile[selectedTransaction._id]?.preview}
                                                        </p>
                                                        <p className="m-0 small text-muted">Ready to upload</p>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveFile(selectedTransaction._id)}
                                                    >
                                                        <i className="fa fa-trash"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Upload button */
                                                <div className="border border-dashed rounded p-4 text-center">
                                                    <i className="fa fa-cloud-upload-alt fs-1 text-muted mb-3"></i>
                                                    <p className="m-0 mb-3 text-muted text-capitalize small">Upload payment receipt</p>
                                                    <label 
                                                        htmlFor={`modalInputFile-${selectedTransaction._id}`}
                                                        className="btn btn-outline-success btn-sm"
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <i className="fa fa-paperclip me-2"></i>
                                                        Choose File
                                                    </label>
                                                    <input
                                                        id={`modalInputFile-${selectedTransaction._id}`}
                                                        name="image"
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        onChange={(e) => handleFile(e, selectedTransaction._id)}
                                                        ref={(el) => (fileUploadRef.current[selectedTransaction._id] = el)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Seller - show "no receipt yet" message */
                                        <div className="text-center p-4 bg-light rounded">
                                            <i className="fa fa-receipt fs-1 text-muted mb-3"></i>
                                            <p className="m-0 text-muted fw-bold">No payment receipt yet</p>
                                            <p className="m-0 small text-muted mt-2">
                                                Receipt will be uploaded once admin processes the payout
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Action Buttons - Role based */}
                        {role === "admin" && selectedTransaction.status === 'pending' ? (
                            <div className="d-flex gap-2 justify-content-end">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={closePayoutModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => {
                                        handlePayout(selectedTransaction._id);
                                        closePayoutModal();
                                    }}
                                    disabled={!imageFile[selectedTransaction._id]?.preview}
                                >
                                    <i className="fa fa-check me-2"></i>
                                    Process Payout
                                </button>
                            </div>
                        ) : (
                            <div className="d-flex justify-content-end">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={closePayoutModal}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}


        {/* Image Modal */}
        {showModal && (
            <div className="modal d-block" 
                style={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 19999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={closeModal}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg" 
                    onClick={(e) => e.stopPropagation()}
                    style={{maxWidth: '90vw', maxHeight: '90vh'}}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{modalTitle}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body text-center p-0">
                            <img 
                                src={modalImage} 
                                alt={modalTitle}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}


        <div className="p-2 mb-5">
            <div className="row g-0 bg-white border rounded p-2 px-2 px-lg-4 mt-1 gap-2">
                {(source === "payout/seller" || source === "payout/rider" )&& role === "admin" && (
                    <>
                    <div className="col-12">
                        <div className="d-flex align-items-center gap-2">
                            <div 
                            className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${
                                location.state?.source === "payout/seller" 
                                ? "bg-success text-white shadow-sm" 
                                : "bg-white text-success border border-success border-opacity-25"
                            }`}
                            style={{cursor : "pointer", transition: "all 0.2s ease"}}
                            onClick={()=> {
                                navigate('/admin/payout/seller', {state: { source: 'payout/seller'}})
                                
                            }}>
                                <i className="fa fa-store me-2 small"></i>
                                <p className="m-0 small fw-bold">Farmer</p>
                            </div>

                            <div 
                            className={`text-capitalize rounded p-2 px-3 d-flex align-items-center transition-all ${
                                location.state?.source === "payout/rider" 
                                ? "bg-success text-white shadow-sm" 
                                : "bg-white text-success border border-success border-opacity-25"
                            }`}
                            style={{cursor : "pointer", transition: "all 0.2s ease"}}
                            onClick={()=> {
                                navigate('/admin/payout/rider', {state: { source: 'payout/rider'}})
                            }}>
                                <i className="fa fa-bicycle me-2 small"></i>
                                <p className="m-0 small fw-bold">rider</p>
                            </div>
                        </div>
                    </div>

                    {/* Rider Sub-Navigation */}
                    {source === "payout/rider" && (
                        <div className="d-flex align-items-center gap-4 mt-3 border-bottom">
                            <div 
                                className={`pb-2 ${
                                    riderTab === "delivered"
                                    ? "border-bottom border-success border-3 text-success" 
                                    : "text-muted"
                                }`}
                                style={{cursor: "pointer", transition: "all 0.2s ease"}}
                                onClick={() => {
                                    navigate('/admin/payout/rider', {state: { source: 'payout/rider', riderTab: 'delivered'}})
                                }}>
                                <p className="m-0 small">Delivered</p>
                            </div>

                            <div 
                                className={`pb-2 ${
                                    riderTab === "damage-log"
                                    ? "border-bottom border-success border-3 text-success" 
                                    : "text-muted"
                                }`}
                                style={{cursor: "pointer", transition: "all 0.2s ease"}}
                                onClick={() => {
                                    navigate('/admin/payout/rider', {state: { source: 'payout/rider', riderTab: 'damage-log'}})
                                }}>
                                <p className="m-0 small">Damage Log</p>
                            </div>
                        </div>
                    )}
                    </>

                )}
              
                {!(source === "payout/rider" && riderTab === "damage-log") && (
                    <>
                        <div className="col-12 col-md-4 d-flex flex-column justify-content-center">
                            <input type="search" 
                            placeholder="Search Name... " 
                            value={search}
                            onChange={(e)=> setSearch(e.target.value)}
                            className="form-control border-2"
                            style={{outline: "none", fontSize: "14px"}}/>
                        </div>
                        <div className="col">
                            <div>
                                <div className="mt-3 mt-md-0 text-end  d-flex justify-content-end gap-2 ">
                                    {selectedIds.size > 0 && (
                                        <button className="btn-danger small px-2 p-1 text-capitalize rounded border-0 shadow-sm d-flex align-items-center gap-1"
                                        onClick={handleDelete}
                                        style={{cursor: "pointer"}}
                                        >
                                            <i className="bx bx-trash fs-6"></i>
                                            delete</button>
                                    )}

                                    <button className="bg-hover d-flex border rounded align-items-center px-2 shadow-sm gap-2 border-1"
                                    onClick={handleRefresh}
                                    >
                                        <i className={`fa fa-sync small text-dark ${isRefreshing ? 'fa-spin' : ''}`}></i>
                                        <p className="m-0 small text-capitalize">refresh</p>
                                    </button>


                                    <button className={`btn ${isSelect ? "btn-dark" : "btn-success"} btn-sm text-capitalize rounded-3 shadow-sm d-flex align-items-center gap-1`}
                                    onClick={()=> {
                                        setIsAllSelected(false);
                                        setSelectedIds(new Set());
                                        setIsSelect((prev) => !prev);
                                    }}
                                    style={{cursor: "pointer"}}
                                    >   
                                        <i className={`bx ${isSelect ? "bx-x fs-6" : "bx-check-circle fs-6"}`}></i>
                                        {`${isSelect ? "cancel" : "select"}`}
                                    </button>
                                </div>
                                <p className="m-0 small opacity-50 text-end mt-2">
                                    {`${selectedIds.size} selected from ${filteredTransactions.length} Total`}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            
            
            {/* Show search/filter only when NOT in damage-log */}
          
            {source === "payout/rider" && riderTab === "damage-log" ? (
                <DamageLog/>
            ) : (
                <>
                <div className="mt-1 bg-white rounded shadow-sm border position-relative "
                style={{overflow: "auto"}}>

                     
                    {isRefreshing && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-100" 
                            style={{ zIndex: 10 }}>
                            <div className="text-center">
                                <div className="spinner-border text-success mb-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="small text-muted mb-0">Refreshing transactions...</p>
                            </div>
                        </div>
                    )}

                    {filteredTransactions?.length === 0 ? (
                        <div className="mt-5 " style={{height: height - 240}}>
                            <p className="m-0 text-capitalize text-center small opacity-75">no payout transaction</p>
                        </div>
                    ) : (
                    

                    <div ref={printRef}>
            
                    <table className="w-100 ">
                        <thead className="position-sticky top-0 z-1 ">


                            <tr className="bg-white ">

                                {role === "admin" && source === "payout/seller" 
                                && ["#", "sellers name",  "total orders", "gross amount", "tax amount", "e-wallet", "status", "date payout", 
                                "actions", ]
                                .map((data, i) => (
                                    <th key={i}
                                    className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 7 && "text-center"}  }
                                    ${i === 0 && "text-center "} small`}
                                    >
                                        {data}
                                        {i === 4 && (<span className="small ms-2">(5.0%)</span>)
                                        }
                                    </th>
                                ))}


                                {role === "admin" && source === "payout/rider" 
                                && ["#", "rider name",  "total delivery", "gross amount", "tax amount", "e-wallet", "status", "date payout", 
                                "actions", ]
                                .map((data, i) => (
                                    <th key={i}
                                    className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 7 && "text-center"}  }
                                    ${i === 0 && "text-center "} small`}
                                    >{data}</th>
                                ))}





                                {/* for seller table head*/}
                                {role === "seller" && source === "payout" 
                                && ["#", "sellers name",  "total orders", "gross amount", "tax amount", "e-wallet", "status", "date payout", 
                                "actions"]  // changed from "reciept"
                                .map((data, i) => (
                                    <th key={i}
                                    className={`text-capitalize p-3 text-success ${i === 8 && "text-center"} ${i === 0 && "text-center"} small`}
                                    >{data}</th>
                                ))}








                                {source === "payment" && role === "admin" 
                                && ["reference id", "account name", "total amount", "payment method", "status","date paid", 'payment receipt', "type of transaction", ]
                                .map((data, i) => (
                                    <th key={i}
                                    className={`text-capitalize p-3 text-success 
                                    small`
                                }
                                    >{data}</th>
                                ))}


                                {source === "payment" && role === "seller" 
                                && ["reference id", "account name", "total amount", "payment method", "status", "date paid", "type of transaction", ]
                                .map((data, i) => (
                                    <th key={i}
                                    className={`text-capitalize p-3 text-success 
                                    small`}
                                    >{data}</th>
                                ))}



                                {isSelect && (
                                    <th className="p-3">
                                        <div className="d-flex flex-column align-items-center ">
                                            <div className="d-flex  gap-2">
                                                <p className="m-0 text-success text-capitalize">all</p>
                                                <input type="checkbox"
                                                checked={isAllSelected}
                                                onChange={toggleSelectAll}
                                                style={{cursor: "pointer"}}/>
                                            </div>
                                        </div>
                                    </th>
                                )}
                            </tr>


                        </thead>
                        <tbody>
                            {currentItems?.map((data, i ) => (
                                    <tr key={i}>

                                        {role === "admin" && source === "payout/seller" &&
                                            [
                                                {data: indexOfFirstItem + i + 1},
                                                {data: {name: data.sellerName, email: data.sellerEmail} },
                                                {data: data.orders.length},
                                                {data: `₱${data.totalAmount.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                                },
                                                {data: `₱${data.taxAmount?.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}` ?? 0},
                                                {data: {type: data?.e_WalletAcc?.type ,number: data?.e_WalletAcc?.number}},
                                                {data: data.status},
                                                {data: 
                                                    new Date(data.date).toLocaleDateString('en-PH', {
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric'})
                                                },
                                                // {data: { imageFile: data.imageFile ?? undefined, id: data._id, status: data.status}},
                                                // {data: undefined},
                                                {data: { transaction: data }}
                                            ]
                                            .map((info, i) => (
                                                <td key={i} 
                                                className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}
                                                >
                                                    { 
                                                        i === 1 ? (
                                                            <>
                                                                {info.data.name}
                                                                <p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p>
                                                            </>
                                                        
                                                        ) : i === 5 ? (
                                                                <>
                                                                {info.data.number}
                                                                <p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p>
                                                                </>
                                                        ) : i === 8 ? (
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <button 
                                                                    className={`btn btn-sm ${info.data.transaction.status === 'paid' ? 'btn-outline-success' : 'btn-success'}`}
                                                                    onClick={() => openPayoutModal(info.data.transaction)}
                                                                >
                                                                    <i className={`fa ${info.data.transaction.status === 'paid' ? 'fa-eye' : 'fa-edit'} me-1`}></i>
                                                                    {info.data.transaction.status === 'paid' ? 'View Details' : 'Process'}
                                                                </button>
                                                            </div>
                                                        ) : info.data
                                                    } 
                                                </td>
                                            ))
                                        }

                                        {role === "admin" && source === "payout/rider" &&
                                        [
                                            {data: indexOfFirstItem + i + 1},
                                            {data: {name: data.riderName, email: data.riderEmail} },
                                            {data: data.totalDelivery},
                                            {data: `₱${data.totalAmount.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                            },

                                            {data: `₱${data.taxAmount?.toLocaleString('en-PH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}` ?? 0},
                                            {data: {type: data?.e_WalletAcc?.type ,number: data?.e_WalletAcc?.number}},
                                            {data: data.status},
                                            {data: new Date(data.date).toLocaleDateString('en-PH', {
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric'})
                                            },
                                            // {data: { imageFile: data.imageFile ?? undefined, id: data._id, status: data.status}},
                                            // {data: undefined},
                                            {data: { transaction: data }}
                                        ]
                                        .map((info, i) => (
                                            <td key={i} 
                                            className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}
                                            >
                                                { 
                                                    i === 1 ? (
                                                        <>
                                                            {info.data.name}
                                                            <p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p>
                                                        </>
                                                    
                                                    ) : i === 5 ? (
                                                        <>
                                                        {info.data.number}
                                                        <p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p>
                                                        </>
                                                    
                                                    ) : i === 8 ? (
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <button 
                                                                className={`btn btn-sm ${info.data.transaction.status === 'paid' ? 'btn-outline-success' : 'btn-success'}`}
                                                                onClick={() => openPayoutModal(info.data.transaction)}
                                                            >
                                                                <i className={`fa ${info.data.transaction.status === 'paid' ? 'fa-eye' : 'fa-edit'} me-1`}></i>
                                                                {info.data.transaction.status === 'paid' ? 'View Details' : 'Process'}
                                                            </button>
                                                        </div>
                                                    ) : info.data
                                                } 
                                            </td>
                                        ))
                                    }


                                    {/*for seller table body */}
                                    {role === "seller" && source === "payout" &&
                                        [
                                            {data: indexOfFirstItem + i + 1},
                                            {data: {name: data.sellerName, email: data.sellerEmail} },
                                            {data: data.orders.length},
                                            {data: 
                                                `₱${data.totalAmount.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                            },

                                            {data: `₱${data.taxAmount?.toLocaleString('en-PH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}` ?? 0},
                                            {data: {type: data?.e_WalletAcc?.type ,number: data?.e_WalletAcc?.number}},
                                            {data: data.status},
                                            {data: new Date(data.date).toLocaleDateString('en-PH', {
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric'
                                            })},
                                            {data: { transaction: data }}
                                            ].map((info, i) => (
                                                <td key={i} 
                                                className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}
                                                >
                                                    { 
                                                        i === 1 ? (
                                                            <>
                                                                {info.data.name}
                                                                <p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p>
                                                            </>
                                                        ) : i === 5 ? (
                                                            <>
                                                                {info.data.number}
                                                                <p className="m-0 text-capitalize opacity-75 small">{info.data.type}</p>
                                                            </>
                                                        ) : i === 8 ? (
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-success"
                                                                    onClick={() => 
                                                                        openPayoutModal(info.data.transaction)}
                                                                >
                                                                    <i className="fa fa-eye me-1"></i>
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        ) : info.data
                                                    } 
                                                </td>
                                            ))
                                        }




                                        { source === "payment" && role === "admin" && (
                                            [   
                                                {data: data.refNo},
                                                {data: {name: data.accountName , email: data.accountEmail }},
                                                {data: 
                                                    `₱${data.totalAmount.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`},
                                                {data: data.paymentMethod},
                                                {data: data.status},
                                                {data: { date: data.paidAt.date, time: data.paidAt.time }},
                                                {data: data.imageFile },
                                                {data: data.type},
                                            ].map((info, i) => (
                                                <td key={i}
                                                className={`text-capitalize p-3 small`}
                                                >{
                                                    i === 1 ? (
                                                            <>
                                                                {info.data.name}
                                                                <p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p>
                                                            </>
                                                    ): i === 5 ? (
                                                        <>
                                                            <p className="m-0 small">{new Date(info.data.date).toLocaleDateString('en-PH', {
                                                                year: 'numeric', 
                                                                month: 'short', 
                                                                day: 'numeric'
                                                            })}</p>
                                                            <p className="m-0 small">{info.data.time}</p>
                                                        </>
                                                    ) : i === 6 ? (
                                                            !info?.data ? (
                                                                <p className="m-0 text-muted small">no image</p>
                                                            ): (

                                                                <div className="w-100 border rounded shadow-sm p-2 position-relative" 
                                                                style={{
                                                                    maxWidth: "120px",
                                                                    cursor: "pointer"
                                                                }}
                                                                onClick={() => openImageModal(
                                                                    info.data.includes(" - ") ?
                                                                    `${import.meta.env.VITE_API_URL}/api/Uploads/rider/${info?.data}`
                                                                    :`${import.meta.env.VITE_API_URL}/api/Uploads/${info?.data}`
                                                                )}
                                                                >
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div className="border shadow-sm rounded" 
                                                                        style={{ 
                                                                            width: "40px", 
                                                                            height: "40px", 
                                                                            overflow: "hidden",
                                                                            flexShrink: 0
                                                                        }}
                                                                        >
                                                                            <img
                                                                            src={
                                                                                info.data.includes(" - ") ?
                                                                                `${import.meta.env.VITE_API_URL}/api/Uploads/rider/${info?.data}`
                                                                                :`${import.meta.env.VITE_API_URL}/api/Uploads/${info?.data}`
                                                                            }
                                                                            alt={info?.data}
                                                                            className="h-100 w-100"
                                                                            style={{ objectFit: "cover" }}
                                                                        />
                                                                        </div>
                                                                        <div className="flex-grow-1" style={{minWidth: 0}}>
                                                                            <p className="m-0 fw-bold text-truncate"
                                                                            style={{fontSize: "0.75rem"}}
                                                                            >{info?.data}
                                                                            </p>
                                                                            <p className="m-0 text-muted" style={{fontSize: "0.65rem"}}>Image</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            )

                                                    ) : info.data
                                                }</td>
                                            ))

                                        )}



                                        { source === "payment" && role === "seller" && (
                                            [   
                                                {data: data.refNo},
                                                {data: {name: data.accountName , email: data.accountEmail }},
                                                {data: 
                                                    `₱${data.totalAmount.toLocaleString('en-PH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`},
                                                {data: data.paymentMethod},
                                                {data: data.status},
                                                {data: { date: data.paidAt.date, time: data.paidAt.time }},
                                                {data: data.type},
                                            ].map((info, i) => (
                                                <td key={i}
                                                className={`text-capitalize p-3 small ${i === 0 && "text-center"}`}
                                                >{
                                                    i === 1 ? (
                                                            <>
                                                                {info.data.name}
                                                                <p className="m-0 text-lowercase opacity-75 small">{info.data.email}</p>
                                                            </>
                                                    ): i === 5 ? (
                                                        <>
                                                            <p className="m-0 small">{new Date(info.data.date).toLocaleDateString('en-PH', {
                                                                year: 'numeric', 
                                                                month: 'short', 
                                                                day: 'numeric'
                                                            })}</p>
                                                            <p className="m-0 small">{info.data.time}</p>
                                                        </>
                                                    ): info.data
                                                }</td>
                                            ))

                                        )}
                                        
                                        {isSelect && (
                                            <td className="p-3">
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <input type="checkbox" 
                                                        checked={selectedIds.has(data._id)}
                                                        onChange={() => toggleSelect(data._id)}
                                                        style={{ cursor: "pointer" }}           
                                                    />
                                                </div>
                                            </td>
                                        )}

                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    </div>
                    )}
                
                </div>

                {filteredTransactions.length > 0 && (
                    <div className="row g-0 border-top bg-white">
                        {/* Left Column - Showing info */}
                        <div className="col-12 col-lg-4 p-3 d-flex align-items-center justify-content-center justify-content-lg-start">
                            <div className="text-muted small">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                            </div>
                        </div>
                        
                        {/* Right Column - Actions and Pagination */}
                        <div className="col-12 col-lg-8 p-3">
                            <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center justify-content-lg-end">
                                {/* PDF Download Button */}
                                <button 
                                    className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1"
                                    onClick={handleDownloadPDF}
                                    title="Download as PDF"
                                >
                                    <i className="fa fa-file-pdf small text-danger"></i>
                                    <p className="m-0 small text-capitalize d-none d-sm-block">PDF</p>
                                </button>

                                {/* Print Button */}
                                <button 
                                    className="bg-hover d-flex border rounded align-items-center px-2 py-1 shadow-sm gap-2 border-1"
                                    onClick={handlePrint}
                                    title="Print Transactions"
                                >
                                    <i className="fa fa-print small text-dark"></i>
                                    <p className="m-0 small text-capitalize d-none d-sm-block">print</p>
                                </button>

                                {/* Divider (hidden on mobile) */}
                                <div className="d-none d-md-block border-start" style={{height: "30px"}}></div>

                                {/* Previous Button */}
                                <button 
                                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <i className="fa fa-chevron-left"></i>
                                    <span className="ms-2 small d-none d-lg-block">Previous</span>
                                </button>
                                
                                {/* Page Numbers */}
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
                                                    style={{ minWidth: "35px" }}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                            return <span key={pageNumber} className="px-2 d-flex align-items-center">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                {/* Next Button */}
                                <button 
                                    className="btn btn-sm btn-outline-success d-flex align-items-center"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="me-2 small d-none d-lg-block">Next</span>
                                    <i className="fa fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </>
             )}

        </div>
        </>
    )
}

export default Transactions;