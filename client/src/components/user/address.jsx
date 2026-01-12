import React, { useEffect, useState } from "react";
import img from "../../assets/images/home_bg.png";
import { useNavigate } from "react-router-dom";
import philippineLocations from "../../data/philippinesAddress.json";

const Address = () => {
  const [form, setForm] = useState({});
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/getCookieId`,{
      method : "GET",
      credentials : "include"
    })
    .then( async(res) => {
      console.log("Response from address: ", res.status);
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      return data;
    })
    .then(data => {
        setLoading(false);
        setText(data.message);
        setUserId(data.id);
    })
    .catch(err => {
      setLoading(false);
      console.log("Error: ",err.message);
    });
  },[]);


  const handleForm = async(e) => {
    e.preventDefault();


    try{
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/postAddress`,{
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify({userId, ...form})
      })

      if(!res.ok){
        return await res.json();
      }
      const data = await res.json();
      if(data.message){
        alert(data.message)
        navigate(-1);
      }
    }catch(error){
      console.log("Error ", error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'province') {
      setForm(prev => ({
        ...prev, 
        [name]: value,
        city: '',
        barangay: '',
        zipCode: ''
      }));
    } else if (name === 'city') {
      const zipCode = philippineLocations[form.province]?.cities[value]?.zipCode || '';
      setForm(prev => ({
        ...prev, 
        [name]: value,
        barangay: '',
        zipCode: zipCode
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Get available data from JSON file
  const provinces = Object.keys(philippineLocations);
  const cities = form.province ? Object.keys(philippineLocations[form.province]?.cities || {}) : [];
  const barangays = (form.province && form.city) ? 
    philippineLocations[form.province]?.cities[form.city]?.barangays || [] : [];

  if(loading) return <p>Loading...</p>

  return (
    <>
      <div className="bg min-vh-100 d-flex">
      <div className="container bg-white" >
        <div className="row py-5 justify-content-center ">
          
          <div className="col-12 col-lg-10">
            <div className="d-flex align-items-center text-success">
              <i className="fa-solid fa-location-dot fs-6 me-2"></i>
              <p className="m-0 text-capitalize fs-4 fw-bold">{text}</p>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-4 mt-3 mt-md-3">
            <form action="#" onSubmit={handleForm}>
              <div className="row g-0 mt-3">
                <div className="col-12">
                  <p className="m-0 text-capitalize fw-bold">customer info</p>
                </div>
                
                {/* Customer Info Fields */}
                {[
                  { label: "firstname", name: "firstname", type: "text" },
                  { label: "lastname",  name: "lastname",  type: "text" },
                  { label: "email",     name: "email",     type: "email"},
                  { label: "contact",   name: "contact",   type: "text" }
                ].map((data, i) => (
                  <div key={i} className={`px-2 mt-2 ${i >= 2 ? "col-12 " : "col"}`}>
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor={data.name}> {data.label}:</label>
                    <input className="w-100 mt-2 py-2 form-control"
                      style={{ fontSize: "14px", outline: "none",background: "#F5F5DC" }}
                      name={data.name}
                      type={data.type}
                      placeholder={data.label}
                      value={form[data.name] || ''}
                      onChange={handleChange}
                      required/>
                  </div>
                ))}

                <div className="col-12 mt-4">
                  <p className="m-0 text-capitalize fw-bold">address info</p>
                </div>

                {/* Province */}
                <div className="col-12 mt-2 px-2">
                  <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                    htmlFor="province"> province: </label>
                  <div style={{background: "#F5F5DC" }}>
                    <select name="province" className="mt-2 w-100 form-control bg-transparent"
                      style={{fontSize:"14px"}}
                      onChange={handleChange}
                      value={form.province || ''}
                      required>
                        <option value="">Select Province</option>
                        {provinces.map((prov, i) => (
                            <option key={i} value={prov}>
                              {prov}
                            </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* City */}
                <div className="col-12 mt-2 px-2">
                  <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                    htmlFor="city"> city: </label>
                  <div style={{background: "#F5F5DC" }}>
                    <select name="city" style={{fontSize:"14px"}}
                      className={`mt-2 w-100 form-control ${form.province ? "bg-transparent" : ""}`}
                      onChange={handleChange}
                      value={form.city || ''}
                      required
                      disabled={!form.province}>
                        <option value="">Select City</option>
                        {cities.map((city, i) => (
                            <option key={i} value={city}>
                              {city}
                            </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Barangay */}
                <div className="col-12 mt-2 px-2">
                  <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                    htmlFor="barangay"> barangay: </label>
                  <div style={{background: "#F5F5DC" }}>
                    <select name="barangay" 
                      className={`mt-2 w-100 form-control ${form.city ? "bg-transparent" : ""}`}
                      style={{fontSize:"14px"}}
                      onChange={handleChange}
                      value={form.barangay || ''}
                      required
                      disabled={!form.city}>
                        <option value="">Select Barangay</option>
                        {barangays.map((brgy, i) => (
                            <option key={i} value={brgy}>
                              {brgy}
                            </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Zip Code */}
                <div className="col-12 mt-2 px-2">
                  <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                    htmlFor="zipCode"> zip code: </label>
                  <input 
                    className="w-100 mt-2 py-2 form-control"
                    style={{ fontSize: "14px", outline: "none", background: "#F5F5DC" }}
                    name="zipCode"
                    type="text"
                    placeholder="Zip Code"
                    value={form.zipCode || ''}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Detail Address */}
                <div className="col-12 px-2 mt-2">
                  <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                    htmlFor="detailAddress"> blk/lot/street: </label>
                  <textarea className="w-100 mt-2 form-control text-capitalize"
                    style={{ fontSize: "14px", outline: "none", resize: "none", background: "#F5F5DC" }}
                    name="detailAddress"
                    onChange={handleChange}
                    value={form.detailAddress || ''}
                    required
                  />
                </div>
              </div>

              <div className="row g-0 mt-4">
                <div className="col-12 px-2">
                  <button className="text-capitalize bg-dark px-3 py-2 rounded w-100 text-light border-0"
                    style={{fontSize: "14px", outline: "none"}}>
                    {text}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="col-12 col-md-6 col-lg-6">
            <img src={img} alt="background" className="img-fluid" />
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Address;