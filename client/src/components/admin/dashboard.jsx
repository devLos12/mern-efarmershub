
import React, { useContext} from "react";
// import Orders from "./order.jsx";
import Orders from "../orders.jsx";
import TotalUser from "./totaluser.jsx";
import TotalSales from "./totalsale.jsx";
import TotalOrder from "./totalorder.jsx";
import { useBreakpoint } from "../../components/breakpoint.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import RiderRemittances from "./remittance.jsx";






//user file
const Dashboard =()=>{
    const width = useBreakpoint();
    const navigate = useNavigate();
    const location = useLocation();
    
    const widgetsStats = [
        {element : <TotalUser/>},
        {element : <TotalSales/>},
        {element : <TotalOrder/>},
    ]  


    return(
        <>
        <div className="p-2 mb-5">
            <div className="row gx-2">
                {
                    widgetsStats.map((data, i)=>(
                    <div key={i} className={`
                    ${i === 2 ? "col-md-12 mt-md-2 mt-lg-0 ": "col-md-6 " } 
                    mt-2 mt-md-0 col-lg-4 `}>
                        <div className="bg-white shadow-sm rounded p-3 border">
                            {data.element}
                        </div>
                    </div>
                    ))
                }
            </div>

            <div className="row mt-1 ">
                <div className="col">
                    <div className="d-flex gap-2 my-1 p-2 bg-white border rounded-2 shadow-sm">
                        <button 
                        className={`btn btn-${
                            location?.state?.navigateTo === "track-remit" ? "outline-success": "success"
                        } btn-sm text-capitalize`}
                        onClick={ 
                            () => navigate("/admin", { state: { navigateTo: "order-list" }})  
                        }
                        >order list</button>

                        <button
                        className={`btn btn-${
                            location?.state?.navigateTo === "track-remit" ? "success": "outline-success"
                        } btn-sm text-capitalize`}
                        onClick={ 
                            () => navigate("/admin", { state: { navigateTo: "track-remit" }})  
                        }
                        >track remit</button>
                    </div>

                    {location?.state?.navigateTo === "track-remit" ? (
                        <RiderRemittances/>
                    ) : (
                        <Orders/>
                    )}


                </div>
            </div>
        </div>

        </>
    )
}
export default Dashboard;