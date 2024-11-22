import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { getAuth, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import '../styles/PopupLogin.css';

const PopupLogin = ({ onLoginSuccess, showSignupPopup, closePopup }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async (credentialResponse) => {
    try {
      const { credential: idToken } = credentialResponse;
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, googleCredential);
      const user = result.user;

      console.log('Google sign-in result:', user);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log('User exists in Firestore:', userDoc.data());
        onLoginSuccess(user);
        console.log('Calling closePopup after Google sign-in');
        closePopup(); // Ensure the popup closes after successful login
      } else {
        console.log('New user, showing signup popup');
        showSignupPopup(user);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      alert('An error occurred during sign-in. Please try again.');
    }
  };

  const handleEmailChange = (e) => {
    setEmailOrPhone(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, emailOrPhone, password);
      const user = result.user;

      console.log('Email/Password sign-in result:', user);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log('User exists in Firestore:', userDoc.data());
        onLoginSuccess(user);
        console.log('Calling closePopup after email/password sign-in');
        closePopup(); // Ensure the popup closes after successful login
      } else {
        console.log('User does not exist in Firestore. Showing signup popup');
        showSignupPopup(user);
      }
    } catch (error) {
      console.error('Error during email/password sign-in:', error);
      alert('An error occurred during sign-in. Please check your email and password and try again.');
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={() => {
          console.log('Close button clicked');
          closePopup();
        }}>×</button>
        <div className="popup-header">
          <img src="src/assets/logo.png" alt="Logo" className="popup-logo" />
          <h2>Login/Sign up</h2>
        </div>
        <div className="google-signin">
          <GoogleLogin
            onSuccess={handleGoogleSignIn}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        </div>
        <div className="popup-body">
          <p>Login or Sign up</p>
          <label>Email</label>
          <input className="email-field" type="text" placeholder="Enter Your email" value={emailOrPhone} onChange={handleEmailChange} />
        
          <label>Password</label>
          <input className="password-field" type="password" placeholder="Enter Your password" value={password} onChange={handlePasswordChange} />
             
          <button className="login-btn" onClick={handleLogin}>Login</button>
          <p className="sign-up-link">Don't Have An Account? <a onClick={showSignupPopup}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
};

export default PopupLogin;
