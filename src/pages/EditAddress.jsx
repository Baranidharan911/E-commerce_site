import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import Firebase auth
import '../styles/AddAddress.css';

const EditAddress = () => {
  const navigate = useNavigate();
  const { addressId } = useParams();
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    countryCode: '+91',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    addressType: 'billing', // You can modify this based on your needs
  });
  const [formError, setFormError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');

  // Get the current user's ID
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    if (addressId) {
      fetchAddressData(addressId);
    }
  }, [addressId]);

  const fetchAddressData = async (id) => {
    try {
      const docRef = doc(db, "addresses", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAddress(data);
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document: ", error);
    }
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddress({ ...address, [name]: value });
  };

  const handlePhoneNumberChange = (event) => {
    const value = event.target.value.replace(/\D/g, ''); // Allow only digits
    setPhoneError('');  // Clear error while typing
    setAddress({ ...address, phoneNumber: value });
  };

  const handleZipCodeChange = (event) => {
    const value = event.target.value.replace(/\D/g, ''); // Allow only digits
    setZipCodeError('');  // Clear error while typing
    setAddress({ ...address, zipCode: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let hasError = false;

    if (address.phoneNumber.length !== 10) {
      setPhoneError('Please enter the phone number correctly.');
      hasError = true;
    }

    if (address.zipCode.length !== 6) {
      setZipCodeError('Please enter a valid zip code.');
      hasError = true;
    }

    if (hasError) {
      setFormError('Please correct the errors before submitting.');
      return;
    }

    if (
      address.firstName &&
      address.lastName &&
      address.phoneNumber.length === 10 &&
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.zipCode.length === 6
    ) {
      setFormError('');
      try {
        const addressData = {
          ...address,
          user_id: userId, // Add user_id field
        };

        const docRef = doc(db, "addresses", addressId);
        await updateDoc(docRef, addressData);
        navigate('/my-addresses');
      } catch (e) {
        console.error("Error saving document: ", e);
      }
    } else {
      setFormError('Please fill all required fields correctly.');
    }
  };

  return (
    <div className="add-address-container">
      <nav className="breadcrumb">
        <a href="/">Home</a> / <a href="/accounts">My Accounts</a> / <span>Edit Address</span>
      </nav>
      <h1>Edit Address</h1>
      <form className="address-form" onSubmit={handleSubmit}>
        <section>
          <h2>Address</h2>
          <div className="form-group">
            <input type="text" placeholder="First Name" className={`input-field ${formError ? 'error' : ''}`} name="firstName" value={address.firstName} onChange={handleAddressChange} required />
            <input type="text" placeholder="Last Name" className={`input-field ${formError ? 'error' : ''}`} name="lastName" value={address.lastName} onChange={handleAddressChange} required />
          </div>
          <div className="form-group">
            <input type="text" placeholder="Company Name" className={`input-field ${formError ? 'error' : ''}`} name="companyName" value={address.companyName} onChange={handleAddressChange} />
            <div className={`phone-group ${phoneError ? 'error' : ''}`}>
              <select value={address.countryCode} className="country-code" disabled>
                <option value="+91">+91</option>
              </select>
              <input type="text" placeholder="Phone Number" className={`phone-input ${phoneError ? 'error' : ''}`} name="phoneNumber" value={address.phoneNumber} onChange={handlePhoneNumberChange} maxLength="10" required />
            </div>
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>
          <div className="form-group">
            <input type="text" placeholder="Address Line 1" className={`input-field ${formError ? 'error' : ''}`} name="addressLine1" value={address.addressLine1} onChange={handleAddressChange} required />
            <input type="text" placeholder="Address Line 2" className={`input-field ${formError ? 'error' : ''}`} name="addressLine2" value={address.addressLine2} onChange={handleAddressChange} />
          </div>
          <div className="form-group">
            <input type="text" placeholder="City" className={`input-field ${formError ? 'error' : ''}`} name="city" value={address.city} onChange={handleAddressChange} required />
            <input type="text" placeholder="State" className={`input-field ${formError ? 'error' : ''}`} name="state" value={address.state} onChange={handleAddressChange} required />
            <input type="text" placeholder="Zip Code" className={`input-field ${zipCodeError ? 'error' : ''}`} name="zipCode" value={address.zipCode} onChange={handleZipCodeChange} maxLength="6" required />
            {zipCodeError && <div className="error-message">{zipCodeError}</div>}
          </div>
        </section>
        <button type="submit" className="submit-btn">Update Address</button>
        {formError && <div className="error-message form-error">{formError}</div>}
      </form>
    </div>
  );
};

export default EditAddress;
