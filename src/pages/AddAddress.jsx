import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth
import '../styles/AddAddress.css';

const AddAddress = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);

  const [billingAddress, setBillingAddress] = useState({
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
  });

  const [shippingAddress, setShippingAddress] = useState({
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
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [formError, setFormError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');

  // Get the current user's ID on auth state change
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    if (id) {
      setIsEditing(true);
      fetchAddressData(id);
    }

    return () => unsubscribe();
  }, [id]);

  const fetchAddressData = async (addressId) => {
    try {
      const docRef = doc(db, 'addresses', addressId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBillingAddress(data.billingAddress);
        setShippingAddress(data.shippingAddress);
        setSameAsBilling(JSON.stringify(data.billingAddress) === JSON.stringify(data.shippingAddress));
      } else {
        console.error('No such document!');
      }
    } catch (error) {
      console.error('Error fetching document: ', error);
    }
  };

  const handleBillingAddressChange = (event) => {
    const { name, value } = event.target;
    setBillingAddress({ ...billingAddress, [name]: value });
    if (sameAsBilling) {
      setShippingAddress({ ...shippingAddress, [name]: value });
    }
  };

  const handleShippingAddressChange = (event) => {
    const { name, value } = event.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  const handleCheckboxChange = () => {
    setSameAsBilling(!sameAsBilling);
    if (!sameAsBilling) {
      setShippingAddress({ ...billingAddress });
    } else {
      setShippingAddress({
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
      });
    }
  };

  const handlePhoneNumberChange = (event, isBilling) => {
    const value = event.target.value.replace(/\D/g, ''); // Allow only digits
    setPhoneError(''); // Clear error while typing
    if (isBilling) {
      setBillingAddress({ ...billingAddress, phoneNumber: value });
      if (sameAsBilling) {
        setShippingAddress({ ...shippingAddress, phoneNumber: value });
      }
    } else {
      setShippingAddress({ ...shippingAddress, phoneNumber: value });
    }
  };

  const handleZipCodeChange = (event, isBilling) => {
    const value = event.target.value.replace(/\D/g, ''); // Allow only digits
    setZipCodeError(''); // Clear error while typing
    if (isBilling) {
      setBillingAddress({ ...billingAddress, zipCode: value });
      if (sameAsBilling) {
        setShippingAddress({ ...shippingAddress, zipCode: value });
      }
    } else {
      setShippingAddress({ ...shippingAddress, zipCode: value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let hasError = false;

    if (billingAddress.phoneNumber.length !== 10) {
      setPhoneError('Please enter the phone number correctly.');
      hasError = true;
    }

    if (billingAddress.zipCode.length !== 6) {
      setZipCodeError('Please enter a valid zip code.');
      hasError = true;
    }

    if (hasError) {
      setFormError('Please correct the errors before submitting.');
      return;
    }

    if (
      billingAddress.firstName &&
      billingAddress.lastName &&
      billingAddress.phoneNumber.length === 10 &&
      billingAddress.addressLine1 &&
      billingAddress.city &&
      billingAddress.state &&
      billingAddress.zipCode.length === 6
    ) {
      setFormError('');
      try {
        // Data for `addresses` collection
        const minimalAddressData = {
          addressLine1: billingAddress.addressLine1,
          addressLine2: billingAddress.addressLine2,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.zipCode,
          phoneNumber: billingAddress.phoneNumber,
          user_id: userId,
        };

        // Data for `AddressBook` collection
        const addressBookData = {
          billingAddress,
          shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
          user_id: userId,
        };

        if (isEditing) {
          // Update in both collections
          const docRef1 = doc(db, 'addresses', id); 
          await updateDoc(docRef1, minimalAddressData);

          const docRef2 = doc(db, 'AddressBook', id); 
          await updateDoc(docRef2, addressBookData);
        } else {
          // Add to both collections
          await addDoc(collection(db, 'addresses'), minimalAddressData); // Minimal fields for addresses
          await addDoc(collection(db, 'AddressBook'), addressBookData); // Full data for AddressBook
        }

        navigate('/address-book');
      } catch (e) {
        console.error('Error saving document: ', e);
      }
    } else {
      setFormError('Please fill all required fields correctly.');
    }
  };

  return (
    <div className="add-address-container">
      <nav className="breadcrumb">
        <a href="/">Home</a> / <a href="/my-account">My Accounts</a> / <span>My Address</span>
      </nav>
      <h1>{isEditing ? 'Edit Address' : 'Add Address'}</h1>
      <form className="address-form" onSubmit={handleSubmit}>
        <section>
          <h2>Billing Address</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="First Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="firstName"
              value={billingAddress.firstName}
              onChange={handleBillingAddressChange}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="lastName"
              value={billingAddress.lastName}
              onChange={handleBillingAddressChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Company Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="companyName"
              value={billingAddress.companyName}
              onChange={handleBillingAddressChange}
            />
            <div className={`phone-group ${phoneError ? 'error' : ''}`}>
              <select value={billingAddress.countryCode} className="country-code" disabled>
                <option value="+91">+91</option>
              </select>
              <input
                type="text"
                placeholder="Phone Number"
                className={`phone-input ${phoneError ? 'error' : ''}`}
                name="phoneNumber"
                value={billingAddress.phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e, true)}
                maxLength="10"
                required
              />
            </div>
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Address Line 1"
              className={`input-field ${formError ? 'error' : ''}`}
              name="addressLine1"
              value={billingAddress.addressLine1}
              onChange={handleBillingAddressChange}
              required
            />
            <input
              type="text"
              placeholder="Address Line 2"
              className={`input-field ${formError ? 'error' : ''}`}
              name="addressLine2"
              value={billingAddress.addressLine2}
              onChange={handleBillingAddressChange}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="City"
              className={`input-field ${formError ? 'error' : ''}`}
              name="city"
              value={billingAddress.city}
              onChange={handleBillingAddressChange}
              required
            />
            <input
              type="text"
              placeholder="State"
              className={`input-field ${formError ? 'error' : ''}`}
              name="state"
              value={billingAddress.state}
              onChange={handleBillingAddressChange}
              required
            />
            <input
              type="text"
              placeholder="Zip Code"
              className={`input-field ${zipCodeError ? 'error' : ''}`}
              name="zipCode"
              value={billingAddress.zipCode}
              onChange={(e) => handleZipCodeChange(e, true)}
              maxLength="6"
              required
            />
            {zipCodeError && <div className="error-message">{zipCodeError}</div>}
          </div>
        </section>
        <section>
          <h2>Shipping Address</h2>
          <label className="checkbox-container">
            <input type="checkbox" checked={sameAsBilling} onChange={handleCheckboxChange} />
            Shipping address is same as the billing address
          </label>
          <div className="form-group">
            <input
              type="text"
              placeholder="First Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="firstName"
              value={shippingAddress.firstName}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
            <input
              type="text"
              placeholder="Last Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="lastName"
              value={shippingAddress.lastName}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Company Name"
              className={`input-field ${formError ? 'error' : ''}`}
              name="companyName"
              value={shippingAddress.companyName}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
            />
            <div className={`phone-group ${phoneError ? 'error' : ''}`}>
              <select value={shippingAddress.countryCode} className="country-code" disabled={sameAsBilling}>
                <option value="+91">+91</option>
              </select>
              <input
                type="text"
                placeholder="Phone Number"
                className={`phone-input ${phoneError ? 'error' : ''}`}
                name="phoneNumber"
                value={shippingAddress.phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e, false)}
                maxLength="10"
                disabled={sameAsBilling}
                required={!sameAsBilling}
              />
            </div>
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Address Line 1"
              className={`input-field ${formError ? 'error' : ''}`}
              name="addressLine1"
              value={shippingAddress.addressLine1}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
            <input
              type="text"
              placeholder="Address Line 2"
              className={`input-field ${formError ? 'error' : ''}`}
              name="addressLine2"
              value={shippingAddress.addressLine2}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="City"
              className={`input-field ${formError ? 'error' : ''}`}
              name="city"
              value={shippingAddress.city}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
            <input
              type="text"
              placeholder="State"
              className={`input-field ${formError ? 'error' : ''}`}
              name="state"
              value={shippingAddress.state}
              onChange={handleShippingAddressChange}
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
            <input
              type="text"
              placeholder="Zip Code"
              className={`input-field ${zipCodeError ? 'error' : ''}`}
              name="zipCode"
              value={shippingAddress.zipCode}
              onChange={(e) => handleZipCodeChange(e, false)}
              maxLength="6"
              disabled={sameAsBilling}
              required={!sameAsBilling}
            />
            {zipCodeError && <div className="error-message">{zipCodeError}</div>}
          </div>
        </section>
        <button type="submit" className="submit-btn">
          {isEditing ? 'Update Address' : 'Submit'}
        </button>
        {formError && <div className="error-message form-error">{formError}</div>}
      </form>
    </div>
  );
};

export default AddAddress;
