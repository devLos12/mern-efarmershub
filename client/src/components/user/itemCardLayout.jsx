import ItemCards from "./itemcards.jsx";
import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { userContext } from "../../context/userContext.jsx";
import { useBreakpointHeight } from "../breakpoint.jsx";
import { useLocation, useNavigate } from "react-router-dom";




const ItemCardLayout  = ({ title }) => {
    const { trigger, setProducts, products, loading, error } = useContext(userContext);
    const height = useBreakpointHeight();
    const scrollRef  = useRef(null);
    const [leftArrow, setLeftArrow] = useState(false);
    const [rightArrow, setRightArrow] = useState(false);
    const navigate = useNavigate();    
    const location = useLocation();



    
    const filteredProduct = useMemo(() => {
        if(title === "fruits") return products.filter((p) => p.category === "fruit");
        if(title === "vegetables") return products.filter((p) => p.category === "vegetable");
        return products;
    },[products, title]);

    
    const handleScroll = (direction) => {
        const checkScroll = scrollRef.current;

        if(direction === "left"){
            checkScroll.scrollBy({
                left : -300,
                behavior : "smooth",
            });

        }else{
            checkScroll.scrollBy({
                left : 350,
                behavior : "smooth",
            });
        }
        
    }

    useEffect(()=> {
        const checkScroll = scrollRef.current;

        const arrowvisibility = ()=>{
            if(checkScroll){
                const {scrollLeft, scrollWidth, clientWidth } = checkScroll;
                setLeftArrow(scrollLeft > 0);
                setRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
            }
        }

        arrowvisibility();

        if(checkScroll){
            checkScroll.addEventListener("scroll", arrowvisibility);
        }

        window.addEventListener('resize', arrowvisibility);
        
        return () =>{
            if(checkScroll){
                checkScroll.removeEventListener("scroll", arrowvisibility);
            }
            window.removeEventListener('resize', arrowvisibility);
        }
    
    },[products]);




    return (
        <>  
            <div className="row g-0">
                <div className="col-12">
                    <div className="d-flex align-items-center gap-2 justify-content-center my-5 text-success">
                        <i className="fa-solid fa-boxes-stacked  fs-5"></i>
                        <p className="m-0 text-capitalize  fw-bold text-center fs-5">{title}</p>
                    </div>
                </div>
            </div>
            {filteredProduct.length > 0 ? (
                <div className="row g-0">
                    <div className="col-12 ">
                         <div className="position-relative ">
                            <div className="d-flex" ref={scrollRef}
                                style={{ maxWidth: "100%", overflowX: "auto", scrollBehavior: "smooth",}}
                                >
                                <ItemCards products={filteredProduct}/>
                            </div>

                            { leftArrow && <button className="fa-solid fa-chevron-left fs-6 bg-light position-absolute top-50  start-0 ms-3
                            translate-middle-y border-0 rounded-circle shadow-sm d-flex align-items-center
                            justify-content-center z-1 d-none d-md-flex text-success"
                            style={{width : "45px", height : "45px", }}
                            onClick={()=>handleScroll("left")}></button>}

                            { rightArrow && <button className="fa-solid fa-chevron-right fs-6 bg-light position-absolute top-50 end-0 me-3
                            translate-middle-y border-0 rounded-circle shadow-sm d-flex align-items-center 
                            justify-content-center z-1  d-none d-md-flex text-success"
                            style={{width : "45px", height : "45px"}}
                            onClick={()=>handleScroll("right")}></button>}
                            </div>
                    </div>
                    <div className="col-12 d-flex justify-content-end "
                    style={{cursor: "pointer"}}
                    >
                        <div className="me-3 btn btn-sm border-0 btn-outline-dark mt-4  d-flex align-items-center gap-2 justify-content-center"
                        onClick={() => {
                            navigate('/user/all-products')
                        }}
                        >
                            <p className="m-0 text-capitalize">more products</p>
                            <i className="fa-solid fa-chevron-right  "></i>
                        </div>
                    </div>
                </div>
                ):(<div className="row mt-5 d-flex align-items-center justify-content-center">
                    <div className="col-12">
                        <p className="m-0 text-center text-capitalize opacity-75">{error?.products || "No product display"}</p>
                    </div>
                </div>
            )}
        </>
    )
}
export default ItemCardLayout ;