import React from "react";
import style from '../../styles/section.module.css';
import image from "../../assets/images/home_bg.png"
import aboutImage from '../../assets/images/about.png';
import aboutImage2 from '../../assets/images/about2.png';


export const Home = () => {
    
    return(
        <div className={style.home}>
            <div className="container d-flex align-items-center justify-content-center my-5">
                <div className="row my-5">
                    <div className="col-12 col-md-6 col-lg-6 my-md-5
                     d-flex align-items-center justify-content-center ">
                        <div className="text-center mt-5 mt-md-0">
                            <h1>Welcome To <br/>
                                E-farmers Hub
                            </h1>
                            <p>Buy fresh crops directly from local farmers</p>
                            <button>
                                <i className="bx bxs-cart"></i>
                                Purchase
                            </button>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-6 my-md-5
                     d-flex align-items-center justify-content-center">
                        <img src={image} alt="img"  className="img-fluid"/>
                    </div>
                </div>
            </div>
        </div>
    )
}



export const About = ()=> {
    return(
        <div className={style.about}>
            <div className="container px-5 py-md-5">
                <div className="row py-5">
                    <div className="col-12 ">
                        <h1 className="fs-4 mt-5 mt-md-0">About us</h1>
                        <p className="fs-md-5 mt-4 text-center">Lorem ipsum, dolor sit amet consectetur 
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

export const Contact = ()=> {

    return(
        <div className={style.contact}>
            <div className="container">
                <div className="row mt-4 p-md-5 py-5 ">
                    <h1 className="text-center text-md-start mt-5" >Need Help?</h1>
                    <div className="col-12 col-md-6 ">
                        <h2 className="text-center text-md-start mt-md-4 mt-2">Get in touch with us</h2>

                        {
                            [
                                {label : 'Email', Value: 'E-farmers_hub@gmail.com', icon: 'bx bxs-envelope fs-3'},
                                {label : 'Contact', Value: '09756640226', icon: 'bx bxs-phone fs-3 '},
                                {label : 'Address', Value: 'Dasmarinas Cavite', icon: 'bx bxs-location-plus fs-3'},

                            ].map((data, i)=>(
                                <div key={i} className=" d-flex align-items-center my-4 justify-content-md-start
                                justify-content-center">
                                    <i className={data.icon}></i>
                                    <label>{data.label}:</label>
                                    <span>{data.Value}</span>
                                </div>
                            ))
                        }
                        <div className="mt-5">
                            <p className=" text-center text-md-start">Our team is dedicated to assist you 
                                <br/>regarding in your concern.
                            </p>
                        </div>
                    </div> 
                    <div className="col-12 col-md-6 mt-5 mt-md-0 ">
                        <form action="" onSubmit={async (e)=> {
                            e.preventDefault()
                            alert('atttempting to send Data!')
                        }}>
                            <div className="container g-0">
                                <div className="row">
                                    {[
                                        {label: 'First Name: ', placeholder: 'Enter First Name'},
                                        {label: 'Last Name: ', placeholder: 'Enter Last Name'},
                                        
                                    ].map((data, i)=> (
                                        <div key={i} className="col">
                                            <div className={style.input}>
                                                <label>{data.label}</label>
                                                <input type="text" className="w-100"
                                                 placeholder={data.placeholder}/>
                                            </div>
                                        </div>  
                                    ))}
                                </div>
                                <div className="row mt-3">
                                    {[
                                        {label: 'Email: ', placeholder: 'Enter Email'},
                                        {label: 'Contact No: ', placeholder: 'Enter Contact No'},
                                    ].map((data, i)=> (
                                        <div key={i} className="col">
                                            <div className={style.input}>
                                                <label>{data.label}</label>
                                                <input type="text" className="w-100 " 
                                                placeholder={data.placeholder}/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="row mt-3">
                                    <div className="col-12  ">
                                        <div className={style.message}>
                                            <label>Message: </label> 
                                            <textarea name="" id="" placeholder="Message Here"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}


export const Footer = ()=> {
    return(
        <footer className="text-light py-4" style={{background:'#4CAF50'}}>
            <div className="container text-center">
                <p className="mb-0">© 2024 E-Farmers Hub. All rights reserved.</p>
                <div className="d-flex justify-content-center gap-3 mt-2">
                <a href="#" className="text-light text-decoration-none ">Privacy Policy</a>
                <a href="#" className="text-light text-decoration-none">Terms of Service</a>
                <a href="#contact" className="text-light text-decoration-none">Contact Us</a>
                </div>
             </div>
        </footer>
    )
}


