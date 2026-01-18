import React, { useContext, useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { useAsyncError, useLocation, useNavigate } from "react-router-dom";
import { appContext } from "../context/appContext";
import { useBreakpoint, useBreakpointHeight } from "./breakpoint";
import { io } from "socket.io-client";
import img from "../assets/images/about.png";
import imageCompression from 'browser-image-compression';

const Messages = () => {
    const { role} = useContext(appContext);

    const [message, setMessage] = useState({});
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [images, setImages] = useState([]);
    const chatEndRef = useRef(null);
    const input = useRef(null);
    const textArea = useRef(null);
    const fileUplaodRef = useRef(null);
    const height = useBreakpointHeight();
    const width = useBreakpoint();

    // Ilagay mo to sa taas kasama ng ibang useState
    const [viewImage, setViewImage] = useState(null); // current image na nakikita
    const [allImages, setAllImages] = useState([]); // lahat ng images sa message
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // index ng current image

    // Step 1: Add loading state
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!location.state) {
            navigate(`/${role}/inbox`);
        }
    }, [location.state]);


    const autoResize = ()=>{


        if (!textArea.current) return;

        textArea.current.style.height = "auto"; 

        const newHeight = textArea.current.scrollHeight;
        const defaultHeight = textArea.current.offsetHeight;
        let finalHeight = 80;

        const isDefault = newHeight === defaultHeight;

        if(newHeight >= finalHeight) {
            textArea.current.style.height = `${75}px`;
            textArea.current.scrollTop = textArea.current.scrollHeight;
        }else{
            textArea.current.style.height = "auto"; 
            textArea.current.style.height = `${newHeight}px`;
            finalHeight += newHeight;
        }

        
    };


    useEffect(() => {
        if (chat.length === 0) return;

        const lastMsg = chat[chat.length - 1];

        // Auto PATCH kapag message galing sa other user
        if (lastMsg.senderId !== location.state?.senderId) {
            
            let endPoint;
            if (role === "admin") {
                endPoint = "updateMarkAsReadFromAdmin";
            } else if (role === "seller") {
                endPoint = "updateMarkAsReadFromSeller";
            } else {
                endPoint = "updateMarkAsReadFromUser";
            }

            fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${location.state.chatId}`, {
                method: "PATCH",
                credentials: "include"
            });
        }
    }, [chat]);



    
    const handleMessage = (e) => {
        const { name, value } = e.target;


        setMessage((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const removeFile = (imageId) =>{

        setImages((prev) => prev.filter((img) => img.id !== imageId));

        const remainingFiles = images.filter(img => img.id !== imageId)
        .map(img => img.file);

        setMessage(prev => ({
            ...prev,
            images: remainingFiles
        }));

        // Clear file input if no images left
        if (images.length === 1) {
            if (fileUplaodRef.current) {
                fileUplaodRef.current.value = null;
            }
        }
        
    }

    const removeAllFiles = () => {
        setImages([]);
        setMessage(prev => ({ ...prev, images: [] }));
        
        if (fileUplaodRef.current) {
            fileUplaodRef.current.value = null;
        }
    };






    const handleFile = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const options = {
                maxSizeMB: 0.3,            // 500KB for chat images
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            // Compress all images
            const compressedFiles = await Promise.all(
                files.map(async (file) => {
                    console.log(`Original: ${(file.size / 1024).toFixed(2)}KB`);
                    const compressed = await imageCompression(file, options);
                    console.log(`Compressed: ${(compressed.size / 1024).toFixed(2)}KB`);
                    return compressed;
                })
            );

            // Create previews with compressed files
            compressedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newImage = {
                        id: Date.now() + index,
                        file: file,  // ✅ compressed file
                        preview: e.target.result,
                        name: file.name
                    };
                    setImages(prev => [...prev, newImage]);
                };
                reader.readAsDataURL(file);
            });

            // Set compressed files to message state
            setMessage((prev) => ({
                ...prev,
                images: compressedFiles  // ✅ compressed files
            }));

        } catch (error) {
            console.error("Error compressing images:", error);
            alert('Failed to compress images');
        }
    };


    



    const sendMessage = async () => {
        const hasText = message?.message?.trim();
        const hasImages = message?.images?.length > 0;
        if (!hasText && !hasImages) return;
        if (isSending) return; // Prevent double send

        // ✅ OPTIMISTIC UPDATE - Update UI immediately
        const tempMessage = {
            senderId: location.state?.senderId,
            text: message?.message || "",
            imageFiles: images.map(img => img.preview), // Use preview URLs temporarily
            createdAt: new Date().toISOString(),
            _temp: true // flag para malaman na temporary
        };

        // ✅ Add to chat immediately
        setChat(prev => [...prev, tempMessage]);

        // ✅ Clear input immediately
        setMessage({ message: "" });
        setImages([]);
        
        if (textArea.current) {
            textArea.current.style.height = "auto";
            textArea.current.scrollTop = 0;
        }

        // Clear file input
        if (fileUplaodRef.current) {
            fileUplaodRef.current.value = null;
        }

        setIsSending(true);

        // Prepare FormData
        const sendMessageData = new FormData();
        sendMessageData.append("receiverId", location.state?.credentials.id);
        sendMessageData.append("receiverRole", location.state?.credentials.role.toLowerCase());
        sendMessageData.append("textMessage", tempMessage.text);

        if (message.images && message.images.length > 0) {
            message.images.forEach((file) => {
                sendMessageData.append("images", file);
            });
        }

        let endPoint;
        if (role === "admin") {
            endPoint = "adminSendMessage";
        } else if (role === "seller") {
            endPoint = "sellerSendMessage";
        } else {
            endPoint = "userSendMessage";
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}`, {
                method: "POST",
                body: sendMessageData,
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // ✅ Replace temporary message with real one
            setChat(prev => 
                prev.map(msg => 
                    msg._temp ? {
                        senderId: data.senderId,
                        text: data.textMessage,
                        imageFiles: data.imageFiles, // Real Cloudinary URLs
                        createdAt: data.time
                    } : msg
                )
            );

        } catch (err) {
            console.log("Error", err.message);
            
            // ✅ Remove temp message if failed
            setChat(prev => prev.filter(msg => !msg._temp));
            
            // ✅ Restore message
            setMessage({ message: tempMessage.text });
            // Restore images kung may preview pa
            
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };




    const getMessages = async()=>{
        try{
            let endPoint;
            if(role === "admin") {
                endPoint = "getAdminMessages" ;
            } else if (role === "seller") {
                endPoint = "getSellerMessages"
            } else {
                endPoint = "getUserMessages";
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${endPoint}/${location.state?.chatId}`, {
                method : "GET",
                credentials : "include"
            })

            if(res.status === 401){
                return navigate(`/`, { replace : true });
            }

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            setLoading(false);
            setChat(data);
            setError(null);
        }catch(err){
            setLoading(false);
            setError(err.message);
            console.log("Error: ", err.message);
        }
    }



    useEffect(()=>{
        if (!location.state?.chatId) return;
        
        getMessages();

        const socket = io(`${import.meta.env.VITE_API_URL}`);
        
        socket.on("newMessageSent", (e)=>{
            console.log(e.message);
            getMessages()
        })

        socket.on("markAsRead", ()=>{
            getMessages();
        })

        return ()=> {
            socket.off("newMessageSent");
            socket.off("markAsRead");
        } 
    },[location.state?.chatId]);

    

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'instant', block:"end"});
        });

        if (input.current) {
            resizeObserver.observe(input.current);
        }

        return () => resizeObserver.disconnect();
    }, [chat, images, input]);

    
    // Handler para mag-open ng image viewer
    const openImageViewer = (imageUrl, allImagesInMessage, index) => {
        setViewImage(imageUrl);
        setAllImages(allImagesInMessage);
        setCurrentImageIndex(index);
    };

    // Handler para sa close
    const closeImageViewer = () => {
        setViewImage(null);
        setAllImages([]);
        setCurrentImageIndex(0);
    };

    // Handler para sa next image
    const nextImage = () => {
        if (currentImageIndex < allImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
            setViewImage(allImages[currentImageIndex + 1]);
        }
    };

    // Handler para sa previous image
    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
            setViewImage(allImages[currentImageIndex - 1]);
        }
    };



    const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#20c997"];
    const randomColor = useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);









    if(loading) return <p></p>

    





    return (
        <div className={role === "user" ? "bg d-flex" : "px-md-2 d-flex "} 
        style={{ height : role === "user" ? height: height-69}}>
            <div className={role === "user" 
            ? "container p-2 p-md-4 px-md-5 bg-white d-flex flex-column  justify-content-between"
            : "container-fluid bg-white px-2 d-flex flex-column justify-content-between"}>  
                <div className="overflow-auto bg h-100 bg-light"
                >
                    {/* Header with Back Button */}
                    <div className="d-flex align-items-center gap-3 py-3 px-2 position-sticky top-0 start-0 end-0 z-1 bg-white border-bottom">
                        <button 
                            className="btn btn-outline-success d-flex align-items-center justify-content-center p-0"
                            style={{ width: "40px", height: "40px" }}
                            onClick={() => navigate(`/${role}/inbox`)}
                        >
                            <i className="fa fa-arrow-left"></i>
                        </button>

                        <div className="rounded-circle align-items-center d-flex overflow-hidden justify-content-center fs-3" 
                        style={{width : "40px", height : "40px", backgroundColor: randomColor}}>
                            <p className="m-0 text-white text-capitalize">{location.state?.credentials.name?.charAt(0)}</p>
                        </div>

                        <div className="d-flex flex-column align-items-start">
                            <div className="d-flex align-items-center">
                                <p className="m-0 text-capitalize fw-bold">
                                    {location.state?.credentials?.name}
                                </p>
                                <p className="m-0 text-capitalize ms-2 small opacity-75">
                                    {`(${location.state?.credentials.role === "User" ? 
                                        "buyer" : location.state?.credentials.role === "Seller" ?
                                        "farmer" : 
                                        location.state?.credentials.role 
                                    })`}
                                </p>
                            </div>
                            <p className="m-0 small opacity-75">{`${location.state?.credentials.email}`}</p>
                        </div>
                    </div>  


                    {chat.length > 0 && (
                        <div className="rounded overflow-none px-2 pt-3" 
                        >
                            {chat.map((msg, index) => {
                                const isSender = msg.senderId === location.state?.senderId;
                                const lastMessage = index === chat.length - 1;

                                const currentDate = new Date(msg.createdAt);
                                const prevDate = index > 0 ? new Date(chat[index - 1].createdAt) : null;

                                const isNewDate =
                                    !prevDate ||
                                    currentDate.toDateString() !== prevDate.toDateString();

                                const formatDate = (date) => {
                                    const today = new Date();
                                    const yesterday = new Date();
                                    yesterday.setDate(today.getDate() - 1);

                                    if (date.toDateString() === today.toDateString()) return "Today";
                                    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

                                    return date.toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    });
                                };

                                const hasText = msg.text && msg.text.trim();
                                const hasImages = msg.imageFiles && msg.imageFiles.length > 0;


                                return( 
                                    <div key={index}>
                                        {isNewDate && (
                                            <div className="my-3 text-center w-100">
                                                <p className="m-0 opacity-75 text-dark text-center"
                                                style={{fontSize:"12px"}}>{formatDate(currentDate)}</p>
                                            </div>
                                        )}
                                        
                                        {hasImages && (
                                            <ImageLayout 
                                                msg={msg}
                                                hasText={hasText}
                                                location={location}
                                                onImageClick={openImageViewer} 
                                            />
                                        )}

                                        {hasText && (
                                        <div key={index} className={`d-flex mt-2 ${msg.senderId === location.state?.senderId ? "justify-content-end" : "justify-content-start"}`}>
                                            <div className={msg.text.length > 30 ? "col-8 col-md-4 col-lg-4 col-xl-4" : ""}>
                                                <div className={`p-2 px-3 rounded 
                                                    ${msg.senderId === location.state?.senderId ? "bg-success text-white" : "bg-light text-dark border"}`}>
                                                    <div className={`${msg.senderId === location.state?.senderId ? "text-end" : "text-start"}`}>
                                                        <div className="fs-6 text-break text-start">{msg.text}</div>
                                                        <div className={`small mt-1 opacity-75`} style={{ fontSize: "10px" }}>
                                                            { 
                                                            new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        )}

                                        {isSender && lastMessage && (
                                            <p className="text-end m-0 fw-bold opacity-75" style={{fontSize:"10px"}}>
                                                {msg._temp 
                                                    ? "sending..." 
                                                    : msg.readBy?.includes(location.state?.credentials.id) 
                                                        ? "seen" 
                                                        : "sent"
                                                }
                                            </p>
                                        )}
                                    </div>
                                    
                                )})
                            }
                            <div ref={chatEndRef}/>
                        </div>
                    )}



                    
                {chat.length === 0 && (
                    <div className="row g-0 mt-5">
                        {location.state?.source === "admin" ? (
                            <div className="col-12 text-center">
                                <div className="mb-3">
                                    <i className="bx bx-message-square-dots" style={{fontSize: "4rem", color: "#28a745"}}></i>
                                </div>
                                <p className="m-0 fs-4 fw-bold text-success">Chat with Us</p>
                                <p className="m-0 text-muted">
                                    Start a conversation with our admin for help
                                </p>
                            </div>
                        ) : (
                            <div className="col-12 text-center">
                                <div className="mb-3">
                                    <i className="bx bx-message-square-dots" style={{fontSize: "4rem", color: "#28a745"}}></i>
                                </div>
                                <p className="m-0 fs-4 fw-bold text-success">Start Chatting</p>
                                <p className="m-0 text-muted">{error || "Send your first message"}</p>
                            </div>
                        )}
                    </div>
                )}
                </div>


                <div ref={input} className="rounded border-top bg-white">
                    {/* Input */}
                    <div className="my-3 d-flex mx-2"> 
                        
                        <label className="d-flex flex-column-reverse"
                        htmlFor="inputFile"
                        >
                            <div className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                            style={{width: "40px", height: "40px"}}>
                                <i className="bx bx-plus fs-5"></i>
                            </div>
                        </label>

                        <div className="w-100 d-flex flex-column justify-content-end mx-2 position-relative">   

                            {images.length > 0 && (
                                <div className={width < 768 ? "d-flex overflow-auto" : "row g-0 py-2"} 
                                >
                                    {images.map((img) => (
                                        <div key={img.id} className="col-6 col-md-3 col-lg-2 col-xl-2 d-flex flex-column justify-content-end">
                                            <div className="position-relative p-2">
                                                <button 
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle d-flex align-items-center justify-content-center m-2 p-0"
                                                    style={{width: "24px", height: "24px"}}
                                                    onClick={() => removeFile(img.id)}
                                                >
                                                    <i className="bx bx-x"></i>
                                                </button>
                                                <img src={img.preview} alt={img.name} 
                                                className="img-fluid rounded shadow-sm border" />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Clear All Button */}
                                    {images.length > 1 && (
                                        <div className="col-6 col-md-3 col-lg-2 col-xl-2 d-flex flex-column justify-content-end">
                                            <div className="p-2">
                                                <button 
                                                    className="btn btn-outline-danger w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                                                    onClick={removeAllFiles}
                                                    style={{minHeight: "80px"}}
                                                >
                                                    <i className="bx bx-trash mb-1 fs-5"></i>
                                                    <span className="small">Clear All</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )} 

                            <input className="d-none" 
                            ref={fileUplaodRef}
                            type="file"
                            onChange={handleFile}
                            id="inputFile"
                            name="images"
                            multiple
                            /> 

                            <textarea 
                                ref={textArea}
                                className="form-control border-0 shadow-none" 
                                style={{resize: "none"}}
                                rows={1}
                                onChange={(e)=>{
                                    handleMessage(e);
                                    autoResize();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                name="message"
                                value={message.message}
                                placeholder="Type a message..."
                                required
                            />

                        </div>
                        <div className="d-flex flex-column-reverse">
                            <button 
                                className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
                                style={{width: "40px", height: "40px"}}
                                onClick={sendMessage}
                            >
                                <i className='bx bx-send'></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Image Viewer Modal - ilagay mo to bago mag-close ng main div */}
            <ImageViewerModal 
                image={viewImage}
                images={allImages}
                currentIndex={currentImageIndex}
                onClose={closeImageViewer}
                onNext={nextImage}
                onPrev={prevImage}
            />
        </div>
    );
};

export default Messages;

const ImageViewerModal = ({ image, images, currentIndex, onClose, onNext, onPrev }) => {
    if (!image) return null;

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 9999
            }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button 
                className="btn btn-light  position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px", zIndex: 10000 }}
                onClick={onClose}
            >
                <i className="bx bx-x fs-2"></i>
            </button>

            {/* Image Counter */}
            {images.length > 1 && (
                <div 
                    className="position-absolute top-0 start-50 translate-middle-x mt-3 bg-dark text-white px-3 py-1 rounded"
                    style={{ zIndex: 10000 }}
                >
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Previous Button */}
            {images.length > 1 && currentIndex > 0 && (
                <button 
                    className="btn btn-light position-absolute start-0 ms-3 rounded-circle"
                    style={{ width: "50px", height: "50px", zIndex: 10000 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrev();
                    }}
                >
                    <i className="bx bx-chevron-left fs-3"></i>
                </button>
            )}

            {/* Image */}
            <img 
                src={image}
                alt="Full view"
                className="img-fluid"
                style={{ 
                    maxHeight: '90vh', 
                    maxWidth: '90vw',
                    objectFit: 'contain'
                }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Next Button */}
            {images.length > 1 && currentIndex < images.length - 1 && (
                <button 
                    className="btn btn-light position-absolute end-0 me-3 rounded-circle"
                    style={{ width: "50px", height: "50px", zIndex: 10000 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                >
                    <i className="bx bx-chevron-right fs-3"></i>
                </button>
            )}
        </div>
    );
};

const ImageLayout = ({ location, hasText, msg, onImageClick }) => {
    
    const isSender = msg.senderId === location.state?.senderId;
    const imageCount = msg.imageFiles?.length || 0;
    const isSingleImage = imageCount === 1;

    const containerClasses = `d-flex ${hasText ? "mt-1" : "mt-2"} ${
        isSender ? "justify-content-end" : "justify-content-start"
    }`;

    const columnClasses = `col-10 col-md-5 col-lg-4 col-xl-4 ${
        isSender ? "text-end" : "text-start"
    }`;

    const timestampClasses = `small mt-1 opacity-75 ${
        isSender ? "text-end" : "text-start"
    }`;

    // Step 3: Update ImageLayout - handle preview URLs
    const allImageUrls = msg.imageFiles?.map(filename => {
        // Check if it's a preview URL (blob or data URI)
        if (filename.startsWith('blob:') || filename.startsWith('data:')) {
            return filename; // Use preview directly
        }
        // Check if Cloudinary URL
        if (filename.startsWith('https')) {
            return filename;
        }
        // Fallback for old local images
        return `${import.meta.env.VITE_API_URL}/api/uploads/${filename}`;
    }) || [];

    return (
        <div className={containerClasses}>
            <div className={columnClasses}>
                <div
                    className="row g-1"
                    style={{
                        flexDirection: isSender ? "row-reverse" : "row",
                    }}
                >
                    {msg.imageFiles?.map((filename, index) => {
                        const isLastOddImage =
                            !isSingleImage &&
                            imageCount % 2 !== 0 &&
                            index === imageCount - 1;

                        let colSize = "col-6";
                        if (isSingleImage) colSize = "col-6";
                        if (isLastOddImage) colSize = "col-12";

                        // Same for imageUrl
                        const imageUrl = (() => {
                            if (filename.startsWith('blob:') || filename.startsWith('data:')) {
                                return filename;
                            }
                            if (filename.startsWith('https')) {
                                return filename;
                            }
                            return `${import.meta.env.VITE_API_URL}/api/uploads/${filename}`;
                        })();

                        return (
                            <div key={index} className={colSize}>
                                <img
                                    src={imageUrl}
                                    alt={filename}
                                    className="img-fluid w-100 rounded border shadow-sm"
                                    style={{
                                        objectFit: "cover",
                                        cursor: "pointer"  // dagdag to para halata na clickable
                                    }}
                                    onClick={() => onImageClick(imageUrl, allImageUrls, index)}  // dagdag to
                                />
                            </div>
                        );
                    })}
                </div>

                {!hasText && (
                    <div
                        className={timestampClasses}
                        style={{ fontSize: "10px" }}
                    >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};