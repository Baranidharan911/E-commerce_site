import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage imports
import '../styles/AccountSettings.css';

const AccountSettings = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    phoneNumber: '',
    gstin: '',
    profilePic: ''
  });
  const [errors, setErrors] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null); // For storing the selected image file
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
          setFormData({
            firstName: userDoc.data().firstName || '',
            email: userDoc.data().email || '',
            phoneNumber: userDoc.data().phoneNumber || '',
            gstin: userDoc.data().gstin || '',
            profilePic: userDoc.data().profilePic || ''
          });
        }
      }
    };
    fetchUserDetails();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleProfilePicChange = (e) => {
    setNewProfilePic(e.target.files[0]);
  };

  const validateFields = () => {
    const newErrors = {};

    // Phone number validation: Exactly 10 digits
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits.';
    }

    // Email validation: Simple regex for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format.';
    }

    // GSTIN validation: 15 alphanumeric characters
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format. Must be 15 alphanumeric characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // If no errors, return true
  };

  const uploadProfilePic = async () => {
    if (!newProfilePic) return formData.profilePic;

    const storage = getStorage();
    const storageRef = ref(storage, `profilePics/${user.uid}_${newProfilePic.name}`);

    // Upload the image to Firebase Storage
    await uploadBytes(storageRef, newProfilePic);

    // Get the download URL for the uploaded image
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSave = async () => {
    if (user) {
      if (validateFields()) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Upload new profile picture if selected
        const profilePicURL = await uploadProfilePic();

        // Update the formData with the new profile picture URL
        const updatedFormData = { ...formData, profilePic: profilePicURL };

        await updateDoc(userDocRef, updatedFormData);
        setUserDetails(updatedFormData);
        setEditMode(false);
      }
    }
  };

  if (!user) {
    return <div>Please log in to view your account settings.</div>;
  }

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="account-settings">
      <div className="breadcrumbs">
        <a href="/">Home</a> / <a href="/my-account">My Account</a> / <span>Settings</span>
      </div>
      <h1>Account Settings</h1>
      <div className="user-details">
        {editMode ? (
          <>
            <div className="form-group">
              <label htmlFor="profilePic">Profile Picture:</label>
              <div className="profile-picture">
                <img
                  src={formData.profilePic || 'default-profile.png'}
                  alt="Profile"
                  className="profile-image"
                  style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                />
              </div>
              <input type="file" accept="image/*" onChange={handleProfilePicChange} />
            </div>
            <div className="form-group">
              <label htmlFor="firstName">Name:</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone:</label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="gstin">GSTIN (If applicable):</label>
              <input
                type="text"
                id="gstin"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
              />
              {errors.gstin && <span className="error">{errors.gstin}</span>}
            </div>
            <button onClick={handleSave} className="save-button">Save</button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Profile Picture:</label>
              <div className="profile-picture">
                <img
                  src={userDetails.profilePic || 'default-profile.png'}
                  alt="Profile"
                  className="profile-image"
                  style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Name:</label>
              <div className="view-field">
                <span>{userDetails.firstName}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Email:</label>
              <div className="view-field">
                <span>{userDetails.email}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <div className="view-field">
                <span>{userDetails.phoneNumber} <span className="verified">✔ Verified</span></span>
              </div>
            </div>
            <div className="form-group">
              <label>GSTIN (If applicable):</label>
              <div className="view-field">
                <span>{userDetails.gstin || 'N/A'}</span>
              </div>
            </div>
            <button onClick={() => setEditMode(true)} className="edit-button">
              <FontAwesomeIcon icon={faPencilAlt} /> Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
