import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState({
        forgot: false,
        verify: false,
        changePass: false
    });

    const [message, setMessage] = useState({
        success: "",
        error: ""
    });
    const [verifyMessage, setVerifyMessage] = useState("")
    const navigate = useNavigate();
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verified, setVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });
    const [changepassSuccess, setChangePassSuccess] = useState('');
    const [loadingChange, setLoadingChange] = useState(false);



    useEffect(() => {
        let timer;

        if(verified) return


        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }else if (cooldown === 0 && sent ){
            setSent(false);
            setVerifyCode("");
            setVerifyMessage("");
        }    

        return () => clearTimeout(timer);
    }, [cooldown, sent, verified]);


    // Password strength checker
    useEffect(() => {
        if (newPassword) {
            setPasswordStrength({
                hasMinLength: newPassword.length >= 8,
                hasUpperCase: /[A-Z]/.test(newPassword),
                hasLowerCase: /[a-z]/.test(newPassword),
                hasNumber: /[0-9]/.test(newPassword),
                hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
            });
        } else {
            setPasswordStrength({
                hasMinLength: false,
                hasUpperCase: false,
                hasLowerCase: false,
                hasNumber: false,
                hasSpecialChar: false
            });
        }
    }, [newPassword]);


    
    const handleRequestCode = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage("Please enter your email address");
            return;
        }

        setIsLoading((prev) => ({...prev, forgot: true, verify: false }));
        setMessage("");
        setChangePassSuccess("")


        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if(!response.ok) throw new Error(data.message);
            

            setTimeout(() => {
                setMessage((prev) => ({...prev, 
                    success: data.message, 
                    error: "" 
                })); 
                setIsLoading((prev) => ({...prev, forgot: false, verify: false }));
                setSent(true);


                const now = Date.now();
                const remainingTime = Math.max(Math.floor((data.cooldown - now) / 1000), 0);
                setCooldown(remainingTime);

            }, 1500);


        } catch (error) {
            setTimeout(() => {

                setMessage((prev) => ({...prev, 
                    success: "", 
                    error: `Error: ${error.message}` 
                }));
                setChangePassSuccess("");

                setIsLoading((prev) => ({...prev, forgot: false, verify: false }));
                setSent(false);
            }, 1500);

        } 
    };


    const handleResetPassword = async() => {
        if (!email || !verifyCode) {
            setMessage("Please enter both email and verification code");
            return;
        }


        setIsLoading((prev) => ({...prev, verify: true, forgot: false }));
        setVerifyMessage("");


        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-code`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ email, verifyCode })
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

           
            setTimeout(() => {
                setVerified(true);


                setMessage((prev) => ({...prev, 
                    success: "", 
                    error: "" 
                })); 
                

                setVerifyMessage(`${data.message} change your password now.`);
                setIsLoading((prev) => ({...prev, verify: false, forgot: false }));

            }, 1500);


        } catch (error) {
            setTimeout(() => {
                setVerifyMessage(error.message);
                setIsLoading((prev) => ({...prev, verify: false, forgot: false }));
            }, 1500);

        }
    };




    const handleChangePassword = async(e) => {
        e.preventDefault();
        setPasswordError({ newPassword: '', confirmPassword: '' });
        

        // Validation
        if (!newPassword) {
            setPasswordError(prev => ({ ...prev, newPassword: 'New password is required' }));
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(prev => ({ ...prev, newPassword: 'Password must be at least 8 characters' }));
            return;
        }

        if (!passwordStrength.hasUpperCase) {
            setPasswordError(prev => ({ ...prev, newPassword: 'Password must contain at least one uppercase letter' }));
            return;
        }

        if (!passwordStrength.hasLowerCase) {
            setPasswordError(prev => ({ ...prev, newPassword: 'Password must contain at least one lowercase letter' }));
            return;
        }

        if (!passwordStrength.hasNumber) {
            setPasswordError(prev => ({ ...prev, newPassword: 'Password must contain at least one number' }));
            return;
        }

        if (!confirmPassword) {
            setPasswordError(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        setLoadingChange(true);


        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email, newPassword, confirmPassword})
            })

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);


            setTimeout(()=> {
                setVerified(false);
                setVerifyMessage("");
                setLoadingChange(false);
                setCooldown(0);
                setMessage((prev) => ({...prev, success: "", error: ""}));
                setEmail("");
                setVerifyCode("");
                setNewPassword("");
                setConfirmPassword("");
                setChangePassSuccess(`${data.message} sign in your account.`);
            }, 1500);


        } catch (error) {
            setTimeout(()=> {
                setVerifyMessage("");
                setLoadingChange(false);
                setNewPassword("");
                setConfirmPassword("");
                setChangePassSuccess(`${error.message}. pls try again.`);
            }, 1500);
            console.log("Error: ", error.message);
        }
    }


    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-12 col-md-6 col-lg-5">
                    <p className="m-0 fs-2 text-capitalize text-success fw-bold ">Forgot Password ?</p>
                    <p className="m-0 text-muted text-capitalize ">No worries, we'll send you reset instructions.</p>
                    <div className="mt-2">
                        <Link className="m-0 text-success text-capitalize small text-decoration-none"
                            to={"/"}>
                            back to sign in
                            
                        </Link>
                    </div>

                    { message?.success  && (
                        <div className={`alert ${cooldown > 0 ? "alert-success text-success" : "alert-danger"} 
                        mt-3 small`}>

                            {cooldown > 0 ? (
                                <>
                                    {message?.success}

                                    <p className="fw-bold m-0 mt-1 text-capitalize ">
                                        {`Expiration left: ${cooldown}`}
                                    </p>
                                </>
                            ) : (
                                 <p className="fw-bold m-0 mt-1 text-capitalize text-danger">
                                    {`Verification code expired! request again.`}
                                </p>
                            )}
                        </div>
                    )}


                    { message?.error  && (
                        <div className={`alert alert-danger mt-3`}>
                            <p className="fw-bold m-0 small mt-1 text-capitalize text-danger">
                                {message?.error}
                            </p>
                        </div>
                    )}

                    {verifyMessage && (
                        <div className={`alert mt-3 
                            ${verifyMessage.includes("verified") ? "alert-success" : "alert-danger"} `}>
                            <p className={`fw-bold m-0 small mt-1 text-capitalize 
                                ${verifyMessage.includes("verified") ? "text-success" : "text-danger"}
                                `}>
                                {verifyMessage}
                            </p>
                        </div>
                    )}

                    {changepassSuccess && (
                        <div className={`alert alert-success mt-3 
                            ${changepassSuccess.includes("changed") ? "alert-success" : "alert-danger"}`}>
                            <p className={`fw-bold m-0 small mt-1 text-capitalize 
                                ${changepassSuccess.includes("changed") ? "text-success" : "text-danger"}`}>
                                {changepassSuccess}
                            </p>
                        </div>
                    )}
              

                    <div className="d-flex flex-column gap-4 mt-4">
                        <form action="#" onSubmit={handleRequestCode}>
                            <div className="d-flex flex-column gap-2">
                                <div className="align-items-center d-flex gap-2">
                                    <i className="fa fa-envelope small"></i>
                                <label className="text-capitalize small fw-bold">email address: </label>
                                </div>
                                <div className="d-flex gap-2">
                                    <input 
                                        type="email" 
                                        className={`form-control bg-opacity-10
                                            ${ sent ? "bg-secondary" : "bg-warning"}`} 
                                        placeholder="Type Email"
                                        style={{fontSize: "14px"}}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading?.forgot || sent}
                                        required
                                    />
                                    
                                    <button 
                                        className={`m-0 border-0 p-1 text-capitalize text-white small rounded-3 bg-success 
                                        ${ sent || isLoading?.forgot  ? "bg-opacity-50" : "bg-opacity-100"}`}
                                        style={{width: "100px"}}
                                        disabled={isLoading?.forgot || sent}
                                    >
                                        {isLoading?.forgot ? "Sending.." : 
                                        sent ? "Sent"  : "request"}
                                    </button>
                                </div>
                                <small className="text-capitalize text-muted"
                                style={{fontSize: "12px"}}
                                >*your gmail account.</small>
                            </div>
                        </form>
                        
                        {!verified && (

                        <form action="#" onSubmit={handleResetPassword}>
                            <div className="d-flex flex-column gap-2">

                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-shield-halved small"></i>
                                    <label className="text-capitalize small fw-bold">verify code: </label>
                                </div>

                                <div className="d-flex flex-column gap-2">
                                    <input 
                                        type="text" 
                                        className={`form-control 
                                            ${ !sent ? "bg-secondary bg-opacity-10 " : "bg-white"}
                                            ${ verifyMessage.includes("Invalid") && "border-danger" }
                                            `}
                                        placeholder="Type Verification Code"
                                        style={{fontSize: "14px"}}
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        disabled={!email || !sent}
                                        required
                                    />

                                    { ( cooldown > 0 &&  verifyMessage ) && (
                                        <p className={`m-0 small text-capitalize 
                                        ${verifyMessage.includes("Verified") ? "text-success" : "text-danger"}`}
                                        >{verifyMessage}</p>
                                    )}

                                    <button 
                                        className={`bg-dark border-0 p-2 text-capitalize rounded small text-white shadow-lg ${!email || !sent  || isLoading?.verify || verifyMessage.includes("Verified")
                                            ? "opacity-50" : ""
                                        }`}
                                        onClick={handleResetPassword}
                                        disabled={ !email || !sent || isLoading?.verify }
                                       
                                    >
                                        {isLoading?.verify ? "sending.." : verifyMessage.includes("Verified") ? verifyMessage  : "verify code"}
                                    </button>
                                </div>
                            </div>
                        </form>
                        )}

                        { verified  &&  
                        
                        <form action="#" onSubmit={handleChangePassword}>

                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-lock small"></i>
                                    <label className="text-capitalize small fw-bold">new password: </label>
                                </div>
                            
                                <div className="position-relative">
                                    <input 
                                        type={showNewPassword ? "text" : "password"}
                                        className={`form-control bg-opacity-10 ${passwordError.newPassword ? 'border-danger' : ''}`}
                                        placeholder="Type New Password"
                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <i 
                                        className={`bx ${showNewPassword ? 'bx-hide' : 'bx-show'} position-absolute end-0 top-50 translate-middle-y me-3`}
                                        style={{cursor: 'pointer', fontSize: '20px'}}
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    ></i>
                                </div>

                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="mt-2">
                                        <p className="small fw-bold m-0 mb-2">Password Requirements:</p>
                                        <ul className="list-unstyled small">
                                            <li className={passwordStrength.hasMinLength ? 'text-success' : 'text-muted'}>
                                                <i className={`bx ${passwordStrength.hasMinLength ? 'bx-check-circle' : 'bx-circle'} me-1`}></i>
                                                At least 8 characters
                                            </li>
                                            <li className={passwordStrength.hasUpperCase ? 'text-success' : 'text-muted'}>
                                                <i className={`bx ${passwordStrength.hasUpperCase ? 'bx-check-circle' : 'bx-circle'} me-1`}></i>
                                                One uppercase letter
                                            </li>
                                            <li className={passwordStrength.hasLowerCase ? 'text-success' : 'text-muted'}>
                                                <i className={`bx ${passwordStrength.hasLowerCase ? 'bx-check-circle' : 'bx-circle'} me-1`}></i>
                                                One lowercase letter
                                            </li>
                                            <li className={passwordStrength.hasNumber ? 'text-success' : 'text-muted'}>
                                                <i className={`bx ${passwordStrength.hasNumber ? 'bx-check-circle' : 'bx-circle'} me-1`}></i>
                                                One number
                                            </li>
                                            <li className={passwordStrength.hasSpecialChar ? 'text-success' : 'text-muted'}>
                                                <i className={`bx ${passwordStrength.hasSpecialChar ? 'bx-check-circle' : 'bx-circle'} me-1`}></i>
                                                One special character (optional)
                                            </li>
                                        </ul>
                                    </div>
                                )}

                                {passwordError.newPassword && (
                                    <p className="m-0 small text-danger text-capitalize">
                                        {passwordError.newPassword}
                                    </p>
                                )}


                            </div>

                            <div className="d-flex flex-column gap-2 mt-3">

                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa-solid fa-lock small"></i>
                                    <label className="text-capitalize small fw-bold">confirm password: </label>
                                </div>

                                <div className="position-relative">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"}
                                        className={`form-control bg-opacity-10 ${passwordError.confirmPassword ? 'border-danger' : ''}`}
                                        placeholder="Type Confirm Password"
                                        style={{fontSize: "14px", paddingRight: "40px"}}
                                        value={confirmPassword}
                                        onChange={(e)=> setConfirmPassword(e.target.value)}
                                    />
                                    <i 
                                        className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'} position-absolute end-0 top-50 translate-middle-y me-3`}
                                        style={{cursor: 'pointer', fontSize: '20px'}}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    ></i>
                                </div>

                                {passwordError.confirmPassword && (
                                    <p className="m-0 small text-danger text-capitalize">
                                        {passwordError.confirmPassword}
                                    </p>
                                )}

                                <button className={`border-0 bg-dark text-white p-2 small text-capitalize rounded-3
                                ${loadingChange ? "opacity-50" : "opacity-100"}
                                `}
                                disabled={loadingChange}
                                >
                                    {loadingChange ? "sending.." : "change password"}
                                </button>
                            </div>
                        </form>
                        }
                        
                    </div>
                </div>
               
            </div>
        </div>
    );
}

export default ForgotPassword;