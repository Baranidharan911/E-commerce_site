import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Make sure to import your Firebase config
import SettingIcon from '../assets/icons/settings.svg';
import AddressIcon from '../assets/icons/address-book.svg';
import RequirementIcon from '../assets/icons/requirements.svg';
import WishListIcon from '../assets/icons/wishlist.svg';
import OrdersIcon from '../assets/icons/orders.svg';
import '../styles/AccountPage.css';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser(userDoc.data());
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null); // Clear user data after logout
    // Redirect to home page or login page if needed
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while fetching data
  }

  return (
    <div className="account-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> / <span>My Account</span>
      </div>
      {user ? (
        <>
          <h1>Hello, <span className="user-name">{user.firstName} {user.lastName}</span></h1>
          <ul className="account-options">
            <li><Link to="/orders"><img src={OrdersIcon} alt="My Orders Icon" /> My Orders</Link></li>
            <li><Link to="/wishlist"><img src={WishListIcon} alt="My Wishlist Icon" /> My Wishlist</Link></li>
            <li><Link to="/requirements"><img src={RequirementIcon} alt="My Requirements Icon" /> My Requirements</Link></li>
            <li><Link to="/account-settings"><img src={SettingIcon} alt="My Account Settings Icon" /> My Account Settings</Link></li>
            <li><Link to="/address-book"><img src={AddressIcon} alt="My Address Book Icon" /> My Address Book</Link></li>
            <li><Link to="/my-addresses"><img src={AddressIcon} alt="My Addresses Icon" /> My Addresses</Link></li>
          </ul>
          <button className="logout-button" onClick={handleLogout}>Log out</button>
        </>
      ) : (
        <div>Please log in to view your account details.</div>
      )}
    </div>
  );
}
