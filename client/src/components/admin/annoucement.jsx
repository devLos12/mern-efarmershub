import React, { useContext, useEffect, useState, useRef } from "react";
import { adminContext } from "../../context/adminContext";
import { useBreakpointHeight } from "../breakpoint";

const Announcement = () => {
    const { addAnnouncement, setAddAnnouncement, setText, setAnnouncementModal } = useContext(adminContext);
    const [announcement, setAnnouncement] = useState([]);
    const height = useBreakpointHeight();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const menuRefs = useRef({});
    const buttonRefs = useRef({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!openMenuId) return;

            const menuEl = menuRefs.current[openMenuId];
            const buttonEl = buttonRefs.current[openMenuId];

            if (
                menuEl &&
                buttonEl &&
                !menuEl.contains(event.target) &&
                !buttonEl.contains(event.target)
            ) {
                setOpenMenuId(null);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getAnnouncement`, {
            method: "GET",
            credentials: "include"
        })
        .then(async(res) => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            return data;
        })
        .then((data) => {
            setLoading(false);
            setAnnouncement(data);
        })
        .catch((err) => {
            setLoading(false);
            console.log("Error: ", err.message)
        });
    },[addAnnouncement?.trigger]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = announcement.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(announcement.length / itemsPerPage);

    // Reset to page 1 when announcement list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [announcement.length]);

    if(loading) return null;

    return (
        <div className="p-2">
            {announcement?.length > 0 && (
                <div className="row g-0 bg-white p-2 shadow-sm rounded justify-content-between border">
                    <div className="col-auto">
                        <button className="bg-success rounded border-0 p-2 
                        text-capitalize text-white small px-3 shadow-sm"
                        style={{outline: "none"}}
                        onClick={()=> setAddAnnouncement((prev) => ({...prev, isShow: true, data: {} }))}
                        >
                            <i className="fa fa-plus-circle me-2"></i>
                            add announcement
                        </button>   
                    </div>
                    <div className="col-auto d-flex align-items-center">
                        <p className="m-0 small text-muted mt-2 mt-lg-0">
                            <i className="fa fa-bullhorn me-1 "></i>
                            Total: {announcement.length} announcement{announcement.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            )}
            
            
            <div className="rounded  border mt-2 "
            >
                {announcement.length > 0 ? (
                    <>
                    <div className="bg-white" style={{overflowY: "auto"}}>
                        <table className="w-100"
                        >
                            <thead className="position-sticky top-0 z-1 bg-white border-bottom shadow-sm">
                                <tr>
                                    {["#", "title" , "crop name", "description", "start date", "end date", "banner"]
                                    .map((data, i) => (
                                        <th key={i} className="text-capitalize p-3 small fw-semibold text-success ">{data}</th>
                                    ))}
                                    <th className="text-capitalize p-3 text-center small fw-semibold text-success">action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems?.map((data, i) => {
                                    const isMenuOpen = openMenuId === data._id;
                                    const actualIndex = indexOfFirstItem + i + 1;

                                    return(
                                        <tr key={i} className="border-bottom">
                                            <td className="text-capitalize p-3 small">{actualIndex}</td>
                                            <td className="text-capitalize p-3 small">{data.title}</td>
                                            <td className="text-capitalize p-3 small">{data.cropName}</td>

                                            <td className="text-capitalize p-3 small">
                                                <p className="m-0"
                                                    style={{
                                                    wordWrap: "break-word",
                                                    whiteSpace: "normal",
                                                    maxWidth: "160px",
                                                }}
                                                >{data.description}</p>
                                            </td>
                                            <td className="text-capitalize p-3 small">
                                                {new Date(data.startDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </td>
                                            <td className="text-capitalize p-3 small">
                                                {new Date(data.endDate).toLocaleDateString('en-PH', {
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="text-capitalize p-3 small" >
                                                {!data.imageFile ? (
                                                    <p className="m-0 text-capitalize small text-muted">no image</p>
                                                ) : (
                                                <div className="border border-success border-opacity-25 shadow-sm rounded overflow-hidden " 
                                                    style={{ height: "60px" , width: "100px"}}
                                                >
                                                    <img 
                                                    src={data.imagePreview || `${import.meta.env.VITE_API_URL}/api/Uploads/${data.imageFile}`} 
                                                    alt={data.imagePreview || data.imageFile}
                                                    className="w-100 h-100"
                                                    style={{objectFit: "cover"}}
                                                    />
                                                </div>
                                                )}
                                            </td>
                                            <td className="p-3 position-relative">
                                                <div 
                                                ref={(el) => (buttonRefs.current[data._id] = el )}
                                                className="position-relative mx-auto d-flex align-items-center
                                                justify-content-center shadow-sm border rounded-circle bg-white"
                                                onClick={(e) => {
                                                    setOpenMenuId(isMenuOpen ? null: data._id);
                                                }}
                                                style={{
                                                    cursor: "pointer", 
                                                    width: "32px", 
                                                    height: "32px",
                                                    transition: "all 0.2s ease"
                                                }}
                                                >
                                                    <i className="fa fa-ellipsis"></i>

                                                    {isMenuOpen && (
                                                        <div 
                                                        ref={(el) => (menuRefs.current[data._id] = el)} 
                                                        className="card position-absolute top-100 end-0 p-2 z-1 border border-success border-opacity-25"
                                                        style={{
                                                            width: "220px", 
                                                            cursor: "default",
                                                            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)",
                                                        }}
                                                        onClick={(e)=> e.stopPropagation()}
                                                        >
                                                            <div className="px-2 rounded 
                                                            text-capitalize p-2 d-flex align-items-center gap-2"
                                                            style={{
                                                                cursor: "pointer",
                                                                transition: "background-color 0.2s ease"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={()=> {
                                                                setAddAnnouncement((prev) => ({
                                                                    ...prev, 
                                                                    isShow: true,
                                                                    data: data
                                                                }))
                                                                setOpenMenuId(null);
                                                            }}
                                                            >
                                                                <i className="bx bx-pencil text-primary"></i>
                                                                <p className="m-0 capitalize small text-primary">edit</p>
                                                            </div>

                                                            <div className="px-2 rounded 
                                                            text-capitalize p-2 d-flex align-items-center gap-2"
                                                            style={{
                                                                cursor: "pointer",
                                                                transition: "background-color 0.2s ease"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={()=> {
                                                                setAnnouncement((prev) => 
                                                                    prev.filter((a) => a._id !== data._id )
                                                                );
                                                                setText("do you want to delete?")
                                                                setAnnouncementModal((prev) => ({...prev, isShow: true, id: data._id }));
                                                                setOpenMenuId(null);    
                                                            }}
                                                            >
                                                                <i className="bx bx-trash text-danger"></i>
                                                                <p className="m-0 capitalize small text-danger">delete</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="d-flex justify-content-between align-items-center border-top p-3 bg-white">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, announcement.length)} of {announcement.length} announcements
                        </div>
                        
                        <div className="d-flex gap-2 align-items-center">
                            <button 
                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}>
                                <i className="fa fa-chevron-left"></i>
                                <span className="ms-2 small d-none d-lg-block">Previous</span>
                            </button>
                            
                            <div className="d-flex gap-1">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    if (pageNumber === 1 || pageNumber === totalPages || 
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                className={`btn btn-sm ${currentPage === pageNumber ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                style={{ minWidth: "35px" }}>
                                                {pageNumber}
                                            </button>
                                        );
                                    } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                        return <span key={pageNumber} className="px-2">...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            
                            <button 
                                className="btn btn-sm btn-outline-success d-flex align-items-center"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}>
                                <span className="me-2 small d-none d-lg-block">Next</span>
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    </>


                    ):(
                        <div className="d-flex justify-content-center align-items-center" 
                        style={{minHeight: "400px"}}
                        >
                            <div className="text-center">
                                <div className="mb-3" style={{fontSize: "48px", opacity: "0.3"}}>
                                    <i className="bx bx-inbox text-success"></i>
                                </div>
                                <p className="text-success fw-semibold mb-2">No Announcements Yet</p>
                                <p className="text-muted small mb-3" style={{maxWidth: "250px"}}>
                                    Start by creating your first announcement. Click the button below to get started.
                                </p>
                                <button 
                                    className="btn btn-success btn-sm text-white fw-semibold shadow-sm"
                                    style={{outline: "none"}}
                                    onClick={()=> setAddAnnouncement((prev) => ({...prev, isShow: true, data: {} }))}
                                >
                                    <i className="fa fa-plus-circle me-2"></i>
                                    Create Announcement
                                </button>
                            </div>
                        </div>
                    )}

            </div>
        </div>
    )
}
export default Announcement;