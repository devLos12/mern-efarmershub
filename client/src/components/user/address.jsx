import React, { useContext, useEffect, useState } from "react";
import img from "../../assets/images/home_bg.png";
import { useNavigate } from "react-router-dom";
import philippineLocations from "../../data/philippinesAddress.json";
import Toast from "../toastNotif.jsx";
import { appContext} from "../../context/appContext.jsx";




const Address = () => {
  const {  showToast,
            toastMessage,
            toastType,
            showNotification,
            setShowToast, } = useContext(appContext);
  const [form, setForm] = useState({});
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

    

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/getCookieId`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (res) => {
        console.log("Response from address: ", res.status);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
      })
      .then(data => {
        setLoading(false);
        setText(data.message);
        setUserId(data.id);
      })
      .catch(err => {
        setLoading(false);
        console.log("Error: ", err.message);
      });
  }, []);



  const handleForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/postAddress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...form })
      })

      if (!res.ok) {
        const errData = await res.json();
        showNotification(errData.message || 'Something went wrong', 'error');
        return;
      }
      const data = await res.json();
      if (data.message) {
        showNotification(data.message, 'success');


        setTimeout(() => {
            navigate(-1);
        }, 1500);
      }
    } catch (error) {
      console.log("Error ", error.message);
      showNotification(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation for text-only fields (firstname, lastname)
    if (name === 'firstname' || name === 'lastname') {
      const textOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setForm(prev => ({ ...prev, [name]: textOnly }));
      return;
    }

    // Validation for contact (numbers only, max 11 digits)
    if (name === 'contact') {
      const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 11);
      setForm(prev => ({ ...prev, [name]: numbersOnly }));
      return;
    }

    // Validation for zip code (numbers only, max 4 digits)
    if (name === 'zipCode') {
      const zipOnly = value.replace(/[^0-9]/g, '').slice(0, 4);
      setForm(prev => ({ ...prev, [name]: zipOnly }));
      return;
    }

    // Handle province selection
    if (name === 'province') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        city: '',
        barangay: '',
        zipCode: ''
      }));
      return;
    }

    // Handle city selection
    if (name === 'city') {
      const zipCode = philippineLocations[form.province]?.cities[value]?.zipCode || '';
      setForm(prev => ({
        ...prev,
        [name]: value,
        barangay: '',
        zipCode: zipCode
      }));
      return;
    }

    // Default case for other fields
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Get available data from JSON file
  const provinces = Object.keys(philippineLocations);
  const cities = form.province ? Object.keys(philippineLocations[form.province]?.cities || {}) : [];
  const barangays = (form.province && form.city) ?
    philippineLocations[form.province]?.cities[form.city]?.barangays || [] : [];

  if (loading) return <p></p>

  

  return (
    <>
      <div className="bg min-vh-100 d-flex">
        <div className="container bg-white" >
          <div className="row py-5 justify-content-center ">

            <div className="col-12 col-lg-10">
              {/* Back Button Header */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <button 
                  className="btn btn-outline-success"
                  onClick={() => navigate(-1)}
                >
                  <i className="fa fa-arrow-left"></i>
                </button>
                <div>
                  <p className="m-0 fs-5 fw-bold text-capitalize text-success">{text}</p>
                  <p className="m-0 small text-muted">Enter your delivery information</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mt-3 mt-md-3">
              <form action="#" onSubmit={handleForm}>
                <div className="row g-0 mt-3">
                  <div className="col-12">
                    <p className="m-0 text-capitalize fw-bold">customer info</p>
                  </div>

                  {/* Firstname */}
                  <div className="px-2 mt-2 col">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="firstname"> firstname:</label>
                    <input className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none" }}
                      name="firstname"
                      type="text"
                      placeholder="firstname"
                      value={form.firstname || ''}
                      onChange={handleChange}
                      required />
                  </div>

                  {/* Lastname */}
                  <div className="px-2 mt-2 col">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="lastname"> lastname:</label>
                    <input className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none" }}
                      name="lastname"
                      type="text"
                      placeholder="lastname"
                      value={form.lastname || ''}
                      onChange={handleChange}
                      required />
                  </div>

                  {/* Email */}
                  <div className="px-2 mt-2 col-12">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="email"> email:</label>
                    <input className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none" }}
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={form.email || ''}
                      onChange={handleChange}
                      required />
                  </div>

                  {/* Contact */}
                  <div className="px-2 mt-2 col-12">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="contact"> contact:</label>
                    <input className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none" }}
                      name="contact"
                      type="text"
                      placeholder="Contact Number"
                      value={form.contact || ''}
                      onChange={handleChange}
                      maxLength="11"
                      required />
                  </div>

                  <div className="col-12 mt-4">
                    <p className="m-0 text-capitalize fw-bold">address info</p>
                  </div>

                  {/* Province */}
                  <div className="col-12 mt-2 px-2">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="province"> province: </label>
                    <select name="province" className="mt-2 w-100 form-select bg-warning bg-opacity-10"
                      style={{ fontSize: "14px" }}
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

                  {/* City */}
                  <div className="col-12 mt-2 px-2">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="city"> city: </label>
                    <select name="city" className="mt-2 w-100 form-select bg-warning bg-opacity-10"
                      style={{ fontSize: "14px" }}
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

                  {/* Barangay */}
                  <div className="col-12 mt-2 px-2">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="barangay"> barangay: </label>
                    <select name="barangay" className="mt-2 w-100 form-select bg-warning bg-opacity-10"
                      style={{ fontSize: "14px" }}
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

                  {/* Zip Code */}
                  <div className="col-12 mt-2 px-2">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="zipCode"> zip code: </label>
                    <input className="w-100 mt-2 py-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none" }}
                      name="zipCode"
                      type="text"
                      placeholder="Zip Code (4 digits)"
                      value={form.zipCode || ''}
                      onChange={handleChange}
                      maxLength="4"
                      required
                    />
                  </div>

                  {/* Detail Address */}
                  <div className="col-12 px-2 mt-2">
                    <label className="text-capitalize mt-2" style={{ fontSize: "14px" }}
                      htmlFor="detailAddress"> blk/lot/street: </label>
                    <textarea className="w-100 mt-2 form-control bg-warning bg-opacity-10"
                      style={{ fontSize: "14px", outline: "none", resize: "none" }}
                      name="detailAddress"
                      onChange={handleChange}
                      value={form.detailAddress || ''}
                      required
                    />
                  </div>
                </div>

                <div className="row g-0 mt-4">
                  <div className="col-12 px-2">
                    <button
                      className={`text-capitalize px-3 py-2 rounded w-100 text-light border-0 ${submitting ? 'bg-secondary' : 'bg-dark'}`}
                      style={{ fontSize: "14px", outline: "none" }}
                      disabled={submitting}
                      type="submit">
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Loading...
                        </>
                      ) : text}
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

      <Toast 
          show={showToast}
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
      />
    </>
  );
};

export default Address;