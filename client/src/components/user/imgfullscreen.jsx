import React, {useContext} from "react";
import mayaImg from "../../assets/images/image.png";
import gcashImg from "../../assets/images/gcash-qr.avif";
import { userContext } from "../../context/userContext";


const ImageFullScreen = () => {
    const {setViewQr} = useContext(userContext);
    const {checkoutForm, setCheckoutForm} = useContext(userContext);
    



    const handleDownload = () => {
        const url = checkoutForm.payment === "gcash" ? img : mayaImg;
        const fileName = checkoutForm.payment === "gcash" ? "gcash-qr.png" : "maya-qr.png";

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    };

    
    return (
        <>
            <div className="container-fluid position-fixed top-0 end-0 start-0 vh-100" 
            style={{background: "#f0f2f5b2", }}>
                
                <div className="d-flex align-items-center justify-content-between
                 position-absolute top-0 end-0 p-2 ">
                    <i className="fa-solid fa-cloud-arrow-down fs-5 me-4 "
                     style={{cursor:"pointer"}} onClick={handleDownload} 
                       title="Download"></i>
                    <div className="fa-solid fa-xmark fs-4" style={{cursor:"pointer"}}
                    onClick={()=> setViewQr(false)}></div>
                </div>
                
                <div className="row justify-content-center mt-4 mt-md-3 ">
                    <div className="col-9 col-md-4 col-lg-4 col-xxl-3 text-center mt-3 mt-md-0">
                        <img src={
                            checkoutForm.payment === "gcash"
                            ? gcashImg : checkoutForm.payment === "maya" ? mayaImg : ""
                        } alt={
                            checkoutForm.payment === "gcash"
                            ? gcashImg : checkoutForm.payment === "maya" ? mayaImg : ""
                        } className="img-fluid rounded shadow" />
                    </div>
                </div>
            </div>
        </>
    )

}
export default ImageFullScreen;