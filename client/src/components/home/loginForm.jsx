import React, { useContext, useState, useEffect } from "react";
import style from '../../styles/form.module.css';
import { Link, useNavigate } from "react-router-dom";
import { appContext } from "../../context/appContext";


const LoginForm = ({remove, adminAuth, userAuth, sellerAuth})=> {
    const { setRole, setId } = useContext(appContext);
    const [formData, setformData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loginData, setLoginData] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e)=> {
        const {name, value} = e.target;
        setformData({
            ...formData,
            [name] : value
        });
        // Clear error when user types
        setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Handle modal animation
    useEffect(() => {
        if (showModal) {
            setTimeout(() => setIsModalVisible(true), 10);
            
            // Auto-close after 2 seconds
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setTimeout(() => {
                    setShowModal(false);
                }, 300);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [showModal]);

    const showNotification = (message, type = "success", role = null, id = null) => {
        setModalMessage(message);
        setModalType(type);
        
        // Store role and id for navigation after animation
        if (role && id) {
            setLoginData({ role, id });
        }
        
        setShowModal(true);
    };
    
    const handleForm = async (e)=>{
        e.preventDefault();
        setErrors({ email: "", password: "" });

        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                method: "POST",
                headers: {"Content-Type" : "application/json"},
                body: JSON.stringify(formData),
                credentials: "include"
            });

            const data = await response.json();
            
            if(!response.ok) {
                // Handle verification errors (show modal)
                if (data.verificationStatus) {
                    showNotification(data.message, "error");
                    return;
                }
                
                // Handle invalid email/password (show inline error)
                if (data.message === "Invalid Email!") {
                    setErrors(prev => ({ ...prev, email: data.message }));
                } else if (data.message === "Invalid Password!") {
                    setErrors(prev => ({ ...prev, password: data.message }));
                } else {
                    showNotification(data.message, "error");
                }
                return;
            }

            // Success - show modal then navigate after 2 seconds
            showNotification(data.message, "success");
            
            // Set auth and navigate after modal animation
            setTimeout(() => {
                if(data.role === "admin"){
                    setId(data.id);
                    setRole(data.role);
                    adminAuth(true);
                    navigate("/admin", { replace: true });
                }
                if(data.role === "seller"){
                    setRole(data.role);
                    sellerAuth(true);
                    navigate("/seller", { replace: true });
                }     
                if(data.role === "user"){
                    setRole(data.role);
                    userAuth(true);
                    navigate("/user", { replace: true });
                }
            }, 2300); // 2s modal + 300ms fade out

        }catch(error){
            showNotification(error.message || "Network error occurred", "error");
            console.log("failed post request! ",error.message);
        }
    }
    
    return(
        <>
        <div className="container-fluid vh-100 position-fixed top-0 end-0 start-0 bg-darken"
        style={{zIndex: 100000}}
        >
            <div className="container mt-4 g-0">
                <div className="row justify-content-center  ">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6 ">
                        <div className="card overflow-hidden ">
                            <i onClick={remove} className="bx bx-x position-absolute
                            end-0 fs-4 text-dark p-2 "
                            style={{cursor: "pointer"}}
                            ></i>
                            <h1 className="text-capitalizetext-center
                            text-center fs-5 fw-bold text-green p-4 bg-white">Sign in account</h1>
                            <div className="card-body bg-light p-3 p-md-5">
                                <form action="#" onSubmit={handleForm}>
                                    {[{ label:'email',            name: 'email',          type: 'email',
                                        holder: 'Enter Email',    icon: 'bx bx-envelope'},
                                      { label:'password',          name: 'password',       type: 'password',
                                        holder: 'Enter Password', icon: 'bx bx-lock'}
                                    ].map((data, i)=> (
                                        <div key={i} className="mb-3">
                                            <div className="d-flex align-items-center mb-1 small">
                                                <i className={`${data.icon} me-1 `}></i>
                                                <label htmlFor={data.label} className="text-capitalize fw-semibold">{data.label}:</label>
                                            </div>
                                            <div className="position-relative">
                                                <input  type={data.type === 'password' ? (showPassword ? 'text' : 'password') : data.type}
                                                        style={{fontSize: "14px"}}
                                                        className={`form-control bg-warning bg-opacity-10 p-2 ${errors[data.name] ? 'border-danger' : ''}`}
                                                        placeholder={data.holder}
                                                        name={data.name}
                                                        onChange={handleChange}
                                                        required />
                                                {data.type === 'password' && (
                                                    <i 
                                                        className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} position-absolute end-0 top-50 translate-middle-y me-3`}
                                                        style={{cursor: 'pointer', fontSize: '20px'}}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    ></i>
                                                )}
                                            </div>
                                            {errors[data.name] && (
                                                <small className="text-danger mt-1 d-block">
                                                    <i className="bx bx-error-circle me-1"></i>
                                                    {errors[data.name]}
                                                </small>
                                            )}
                                        </div>
                                    ))}
                                    <div className="mt-4">
                                        <button
                                        className="border-0 bg-dark w-100 p-2 small fw-semibold text-white rounded-3"
                                        >Sign in</button>
                                    </div>
                                    <div className="mt-3 d-flex justify-content-between align-items-center ">
                                        < Link to={"/forgot-password"} 
                                        className="small text-decoration-none text-green fw-semibold " 
                                        >Forgot Password ?</Link>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="m-0 small text-capitalize">don't have an account ? </p>
                                        <Link to='/register'
                                        className="text-capitalize text-decoration-none  small fw-semibold text-green"
                                        >register now</Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
        </>
    )
}

export default LoginForm;