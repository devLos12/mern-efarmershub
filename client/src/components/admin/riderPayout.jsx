import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";


const RiderPayout = () => {
    const location = useLocation();


    useEffect(() => {

        console.log(location.state?.source);
    },[location?.state?.source]);

    return (
        <div className="container">
            <div className="row">
                <div className="col">

                </div>
            </div>
        </div>
    )
}

export default RiderPayout;