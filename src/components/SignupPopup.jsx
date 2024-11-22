import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import '../styles/SignupPopup.css';

const SignupPopup = ({ closePopup, user }) => {
  const [formData, setFormData] = useState({
    type: 'personal',
    firstName: '',
    industry: '',
    companySize: '',
    department: '',
    password: '',
    phoneNumber: '',
    whatsappUpdates: false,
    immediateRequirement: false,
  });

  const db = getFirestore();
  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Extract email and password from formData
      const email = user.email; // use the email from the Google sign-in
      const { password, ...userData } = formData;
      const credential = EmailAuthProvider.credential(email, password);
      
      if (user.providerData[0].providerId === 'google.com') {
        // Link the Google account with email/password credentials
        await linkWithCredential(user, credential);
      } else {
        // Create a new user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        ...userData,
      });
      console.log('User data saved successfully');
      closePopup();
    } catch (error) {
      console.error('Error saving user data:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Email already in use. Please use a different email or log in with this email.');
      } else {
        alert('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={closePopup}>×</button>
        <div className="popup-header">
          <h2>Update Profile Details</h2>
        </div>
        <div className="popup-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>I am looking for</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="type" 
                    value="personal" 
                    checked={formData.type === 'personal'} 
                    onChange={handleChange} 
                  /> 
                  Personal
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="type" 
                    value="business" 
                    checked={formData.type === 'business'} 
                    onChange={handleChange} 
                  /> 
                  Business
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="Enter Name" 
              />
            </div>

            {formData.type === 'business' && (
              <>
                <div className="form-group">
                  <label>Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleChange}>
                    <option value="">Select Industry</option>
                    {/* Add options here */}
                  </select>
                </div>

                <div className="form-group">
                  <label>Company size</label>
                  <select name="companySize" value={formData.companySize} onChange={handleChange}>
                    <option value="">Select Company size</option>
                    {/* Add options here */}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={formData.department} onChange={handleChange}>
                    <option value="">Select Department</option>
                    {/* Add options here */}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Create Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Enter password" 
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                placeholder="Phone Number" 
              />
            </div>

            {formData.type === 'business' && (
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="immediateRequirement" 
                    checked={formData.immediateRequirement} 
                    onChange={handleChange} 
                  /> 
                  I have an immediate Requirement. Please call me back.
                </label>
              </div>
            )}

            <button type="submit" className="sign-up-btn">Save</button>

            <p className="login-link">Already Have An Account? <a >Login</a></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup;
