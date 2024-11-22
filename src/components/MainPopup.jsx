import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import PopupLogin from './PopupLogin';
import SignupPopup from './SignupPopup';

const MainPopup = ({ onUserLoaded, closePopup }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newUser, setNewUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setIsLoggedIn(true);
          onUserLoaded(userDoc.data());
        }
      }
    });
    return () => unsubscribe();
  }, [onUserLoaded]);

  const handleLoginSuccess = async (user) => {
    setIsLoggedIn(true);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      onUserLoaded(userDoc.data());
      console.log('Calling closePopup after successful login in MainPopup');
      closePopup();  // Ensure the popup closes after successful login
    }
    setNewUser(null);
  };

  const handleShowSignupPopup = (user) => {
    setNewUser(user);
  };

  return (
    <div>
      {newUser ? (
        <SignupPopup closePopup={closePopup} user={newUser} />
      ) : (
        <PopupLogin onLoginSuccess={handleLoginSuccess} showSignupPopup={handleShowSignupPopup} closePopup={closePopup} />
      )}
    </div>
  );
};

export default MainPopup;
