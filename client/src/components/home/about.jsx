import React from "react";
import aboutImage from '../../assets/images/about.png';
import aboutImage2 from '../../assets/images/about2.png';


const About = () => {
    return (
        <div className="bg-warning bg-opacity-10 ">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <h1 className="fs-4 text-center fw-bold mt-5">About us</h1>
                            <p className="mt-4 text-center">Lorem ipsum, dolor sit amet consectetur 
                                adipisicing elit. Vero, possimus repellat laudantium, 
                                perferendis cumque expedita deleniti molestias sapiente 
                                error aperiam, quis eveniet? Voluptas architecto laboriosam
                                possimus numquam accusamus, totam quam.
                                Lorem ipsum, dolor sit amet consectetur 
                                adipisicing elit. Vero, possimus repellat laudantium, 
                                perferendis cumque expedita deleniti molestias sapiente 
                                error aperiam, quis eveniet? Voluptas architecto laboriosam
                                possimus numquam accusamus, totam quam.
                            </p>
                    </div>
                <div className="col">
                    <img src={aboutImage} alt="image" className="img-fluid"/>
                </div>
                <div className="col">
                    <img src={aboutImage2} alt="image" className="img-fluid"/>
                </div>
                </div>
            </div>
        </div>

    )
}

export default About