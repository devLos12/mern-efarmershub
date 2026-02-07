import React from "react";
import image1 from "../../assets/images/image1.jpg";
import image2 from "../../assets/images/image2.jpg";


const About = () => {
    const features = [
        {
            icon: "fa-leaf",
            title: "Sustainable Farming",
            description: "Promoting eco-friendly agricultural practices for a better future"
        },
        {
            icon: "fa-handshake",
            title: "Community Driven",
            description: "Connecting farmers, sellers, and buyers in one trusted platform"
        },
        {
            icon: "fa-chart-line",
            title: "Growth & Support",
            description: "Helping farmers maximize their profits and market reach"
        },
        {
            icon: "fa-truck",
            title: "Reliable Delivery",
            description: "Fast and secure delivery of fresh farm products to your doorstep"
        }
    ];

    return (
        <div className="bg-white">
            <style>{`
                .about-section {
                    padding: 80px 0;
                    position: relative;
                }

                .about-header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .about-header h1 {
                    font-size: 48px;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin-bottom: 20px;
                    letter-spacing: -1px;
                }

                .about-header .subtitle {
                    font-size: 18px;
                    color: #666;
                    max-width: 700px;
                    margin: 0 auto;
                    line-height: 1.8;
                }

                .about-content-section {
                    margin-bottom: 80px;
                }

                .about-text {
                    font-size: 36px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 20px;
                    line-height: 1.3;
                }

                .about-text p {
                    font-size: 16px;
                    color: #555;
                    line-height: 1.8;
                    margin-bottom: 20px;
                }

                .about-images {
                    display: flex;
                    gap: 20px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding: 10px 0;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(40, 167, 69, 0.3) rgba(40, 167, 69, 0.1);
                }

                .about-images::-webkit-scrollbar {
                    height: 6px;
                }

                .about-images::-webkit-scrollbar-track {
                    background: rgba(40, 167, 69, 0.1);
                    border-radius: 10px;
                }

                .about-images::-webkit-scrollbar-thumb {
                    background: rgba(40, 167, 69, 0.4);
                    border-radius: 10px;
                }

                .about-images::-webkit-scrollbar-thumb:hover {
                    background: rgba(40, 167, 69, 0.6);
                }

                .about-img-wrapper {
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    flex-shrink: 0;
                    width: 420px;
                    height: 420px;
                }

                .about-img-wrapper:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
                }

                .about-img-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                    margin-top: 60px;
                }

                .feature-card {
                    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(40, 167, 69, 0.1);
                }

                .feature-card:hover {
                    background: linear-gradient(135deg, #fff 0%, #f0f9f0 100%);
                    transform: translateY(-8px);
                    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.1);
                    border-color: rgba(40, 167, 69, 0.3);
                }

                .feature-icon {
                    font-size: 48px;
                    color: #28a745;
                    margin-bottom: 15px;
                }

                .feature-card h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 10px;
                }

                .feature-card p {
                    font-size: 14px;
                    color: #666;
                    line-height: 1.6;
                    margin: 0;
                }

                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 14px 32px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    margin-top: 20px;
                    font-size: 15px;
                }

                .cta-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.3);
                    color: white;
                    text-decoration: none;
                }

                @media (max-width: 768px) {
                    .about-section {
                        padding: 50px 0;
                    }

                    .about-header h1 {
                        font-size: 32px;
                    }

                    .about-text h2 {
                        font-size: 24px;
                    }

                    .about-img-wrapper {
                        width: 350px;
                        height: 350px;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }
            `}</style>

            <div className="container">
                <div className="about-section">

                    {/* Main Content */}
                    <div className="row g-5 align-items-center">
                        <div className="col-12 col-lg-6">
                            <div className="about-text">
                                <h2>Our Mission</h2>
                                <p className="fw-normal fs-6">
                                    At E-Farmers Hub, we believe in empowering farmers with the tools and platform they need to succeed in the modern agricultural landscape. 
                                    Our mission is to eliminate middlemen, increase transparency, and create direct connections between producers and consumers.
                                </p>
                                <p className="fw-normal fs-6">
                                    We're building a community where quality farm products meet fair pricing, where farmers' hard work is valued, 
                                    and where fresh, sustainable agriculture thrives. Together, we're shaping the future of farming.
                                </p>
                            </div>
                        </div>

                        <div className="col-12 col-lg-6">
                            <div className="about-images">
                                <div className="about-img-wrapper">
                                    <img src={image1} alt="Farming innovation" />
                                </div>
                                <div className="about-img-wrapper">
                                    <img src={image2} alt="Community support" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">
                                    <i className={`fa-solid ${feature.icon}`}></i>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;