import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Patients/SignUpPatientScreen';
import '../SignUpScreen.css'
import { AuthContext } from "../../context/AuthContext";

const PasswordInput = ({ value, onChange, placeholder, name }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
      <input 
        type={show ? "text" : "password"} 
        name={name}
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        required 
        style={{ 
          width: '100%', 
          padding: '10px', 
          paddingRight: '40px', 
          borderRadius: '5px', 
          border: '1px solid #ccc', 
          fontSize: '14px',
          color: '#333',
          backgroundColor: '#D9D9D9',
          boxSizing: 'border-box',
          margin: 0,
          fontFamily: 'inherit',
          outline: 'none'
        }} 
      />
      <button 
        type="button" 
        tabIndex="-1" 
        onClick={() => setShow(!show)} 
        style={{ 
          position: 'absolute', 
          right: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          color: '#666', 
          padding: 0, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
      >
        {show ? (
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755l.192.195z"/>
            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
          </svg>
        ) : (
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

function SignUpRetailerScreen() {
  // Triggering recompile
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    BusinessName: '',
    email: '',
    phone: '',
    dob: '',
    licenseNumber: '',
    age: '',
    gender: '',
    zipCode: '',
    password: '',
    confirmPassword: '',
  });
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleNextClick = async (e) => {
    e.preventDefault(); // Prevent default form submit behavior
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/register/retailer`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        setAuth({ token: result.token, user: result.user });
        alert('Registration successful');
        navigate('/retailer-home');
      } else {
        alert(result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  return (
    <div className="signup-container">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <h1>Sign Up - Retailers</h1>
      <p>Unlock your inner balance. Start your Ayurvedic journey today.</p>
      <form className="signup-form" onSubmit={handleNextClick}>
        <div className="form-column">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Ram" required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Singh"
              required
            />
          </div><div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="BusinessName"
              value={formData.BusinessName}
              onChange={handleInputChange}
              placeholder="ABC Pharmacy"
              required
            />
          </div>
          <div className="form-group">
            <label>Email ID</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="abc@gmail.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="0123456789"
              required
            />
          </div>
          <div className="form-group">
            <label>Date of Birth (DD/MM/YYYY)</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              placeholder="01/01/2000"
              required
            />
          </div>
          <div className="form-group">
            <label>License Number</label>
            <input
              type="number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              placeholder="242345678"
              required
            />
          </div>
        </div>

        <div className="form-column">
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="24"
              required
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <input
              type="text"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              placeholder="Male/Female"
              required
            />
          </div>
          <div className="form-group">
            <label>Zip Code (Location)</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="000001"
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', color: '#333', marginBottom: '5px' }}>Password</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '14px', color: '#333', marginBottom: '5px' }}>Confirm Password</label>
            <PasswordInput
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
            />
          </div>
        </div>

        <div className="form-button">
          <button type="submit" className="next-btn">Sign Up →</button>
        </div>
      </form>
    </div>
  );
}

export default SignUpRetailerScreen;
