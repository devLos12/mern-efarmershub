import React, {useState, useContext, useEffect, useRef} from "react";
import { userContext } from "../../context/userContext";
import { Form, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useBreakpointHeight } from "../breakpoint";
import imageCompression from 'browser-image-compression';


const Reviews = () => {
    const { userData } = useContext(userContext);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [imgPreview, setImgPreview] = useState(null);
    const [uploadText, setUploadText] = useState(true);
    const location = useLocation();
    const data = location.state?.item;
    const [form, setForm] = useState({});
    const fileUploadRef = useRef(null);
    const [isDisabled, setIsDisabled] = useState(true);
    const [isCompressing, setIsCompressing] = useState(false);
    const navigate = useNavigate();



    const submitReview = async(e) => {
      e.preventDefault();

      const user = {
        id : userData._id,
        name : `${userData.firstname} ${userData.lastname}`
      }

      const sendData = new FormData();
      sendData.append("prodId", data?.prodId);
      // sendData.append("userId", user.id);
      // sendData.append("name", user.name);
      sendData.append("rate", rating);
      sendData.append("comment", form?.comment || null);
      sendData.append("image", form?.image || null);

      
        
      try{
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productReview`, ({
          method : "POST",
          body : sendData,
          credentials : "include"
        }))
        
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);

        alert(data.message);
        navigate(-1, {replace : true});                
      }catch(err){
        console.log("Error: ", err.message);

      }
    }


    const handleComment = (e) => {
      const { name, value } = e.target

      setForm((prev) => ({
        ...prev,
        [name] : value
      }))
    }

    
    const handleFileRemove = ()=> {
      setImgPreview(null);
      setUploadText(true);

      setForm((prev) => ({...prev, image : null}));
      if(fileUploadRef.current){
          fileUploadRef.current.value = null;
      }
    }


    const handleFile = async (e) => {
        const { name } = e.target;
        const file = e.target.files[0];
        if (!file) return;

        setUploadText(false);
        setIsCompressing(true);

        try {
          const options = {
            maxSizeMB: 0.75,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          };

          const compressedFile = await imageCompression(file, options);
          
          // Set compressed file to form
          setForm({
            ...form,
            [name]: compressedFile
          });

          // Preview using compressed file
          const reader = new FileReader();
          reader.onload = (e) => {
            setImgPreview(e.target.result);
          };
          reader.readAsDataURL(compressedFile);

        } catch (error) {
          console.error('Error compressing image:', error);
          alert('Failed to compress image');
          handleFileRemove();
        } finally {
          setIsCompressing(false);
        }
    };


    useEffect(()=> {
      if(rating && form.comment){
        setIsDisabled(true);
      }else{
        setIsDisabled(false);
      }
    },[form, rating]);


    return (
        <div className=" d-flex min-vh-100 bg">
          <div className="container bg-white">
            <div className="row justify-content-center mt-5">
              <div className="col-12 col-lg-10">
                <p className="m-0 text-capitalize fs-4 fw-bold text-success ">review product</p>
              </div>
            </div>

            <div className="row justify-content-center mt-3 mb-5">
              <div className="col-12 col-md-6 col-lg-5 col-xl-4 ">
                <div className="d-flex flex-column justify-content-between h-100 p-3 bg-beige">
                  <img src={data.imageFile} 
                  alt={data.imageFile} className="img-fluid rounded shadow-sm border"/>
                  <div className="mt-3">
                    <p className="m-0 text-capitalize fw-bold fs-4">{data.prodName}</p>
                    <p className="m-0 text-capitalize opacity-75">{data.prodDisc}</p>
                  </div>
                </div>  
              </div>
              <div className="col-12 col-md-6 col-lg-5 col-xl-6 mt-5 mt-md-0">
                <div className="d-flex justify-content-between flex-column h-100">
                  <div className="d-flex flex-column ">
                    <p className="m-0 text-capitalize fw-bold">how's our product?</p>
                    <div className="d-flex flex-column  justify-content-between ">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex ">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <p className="m-0 "
                              key={value}
                              onClick={() => setRating(value)}
                              onMouseEnter={() => setHover(value)}
                              onMouseLeave={() => setHover(0)}
                              style={{
                                fontSize:"45px",
                                color: value <= (rating || hover) ? "gold" : "transparent",
                                cursor: "pointer",
                                WebkitTextStroke: value <= (rating || hover) ? "0" : "1px gray",
                                transition: "color 0.2s"}}
                            >★</p>
                          ))}
                        </div>
                        <p className="m-0 fs-5 me-2">{rating +" / 5"}</p>
                      </div>
                      <div className="mt-2">
                        <p className="m-0 fw-bold text-capitalize">write your review.</p>
                        
                        <div className="bg mt-3 p-2 border rounded position-relative" >
                          
                          {imgPreview && (
                            <div className="col-3 col-md-3 col-lg-3 col-xl-2 p-1 position-relative">

                              <div className="bx bx-x shadow rounded-circle position-absolute top-0 end-0 bg-white" 
                              style={{cursor : "pointer"}}
                              onClick={handleFileRemove}></div>
                              <img src={imgPreview} alt={imgPreview}
                              className=" rounded img-fluid mb-2 shadow-sm border " 
                              style={{maxHeight:"70px", objectFit : "auto"}}
                              />
                            </div>
                          )}

                          {isCompressing && (
                            <div className="text-center py-2">
                              <small className="text-muted">Compressing image...</small>
                            </div>
                          )}

                          <textarea  className="border-0 bg-transparent p-1 w-75 " 
                            onChange={handleComment}
                            placeholder="Leave a review" 
                            name="comment"
                            style={{outline:"none", resize : "none"}}>
                          </textarea>

                          {uploadText && (
                            <label className="d-flex m-1 rounded bg-white shadow-sm border position-absolute bottom-0 end-0 p-1 bg" 
                            htmlFor="inputFile" 
                            style={{cursor: "pointer"}}>
                              <i className='bx  bx-paperclip bx-rotate-270 
                              fs-6'></i> 
                              <p className="m-0  text-capitalize " style={{fontSize:"14px"}}>add photo</p>
                            </label>
                          )}


                          <input className="d-none"
                          type="file"
                          ref={fileUploadRef}
                          onChange={handleFile}
                          id="inputFile" 
                          name="image"
                          accept="image/*"
                          />

                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mt-2 mt-md-0">
                    <div className="col-5 col-md-5 col-lg-4">
                      <button className="text-capitalize p-2 mt-4 mt-md-0 w-100 bg-white text-dark border rounded shadow-sm"
                      onClick={()=> navigate(-1)}>skip</button>
                    </div>
                    <div className="col ">
                      <button className={`text-capitalize p-2 mt-4 mt-md-0 w-100 bg-dark text-white border-0 rounded shado ${!isDisabled ? "opacity-75" : "opacity-100"}`}
                      disabled = {!isDisabled}
                      onClick={submitReview}>{
                        !isDisabled ? "compelete review" : "rate now"
                      }</button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    )
}

export default Reviews;