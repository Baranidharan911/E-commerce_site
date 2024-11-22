import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import '../styles/HeaderMobile.css';
import logo from '../assets/logos.png';
import searchIcon from '../assets/search-icon.png';
import cartIcon from '../assets/cart-icon.png';
import { AiOutlineMenu } from 'react-icons/ai'; // Import hamburger icon from react-icons
import MainPopup from './MainPopup';
import helpIcon from '../assets/help-icon.png';

const HeaderMobile = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for dropdown
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState(null);
  const { cartCount } = useCart();
  const [hashTags, setHashTags] = useState([]);
  const sidebarRef = useRef(null); // Use ref for sidebar

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen); // Toggle dropdown
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data());
          }
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    };

    const fetchHashTags = async () => {
      const hashTagsCollection = collection(db, 'hashTags');
      const hashTagsSnapshot = await getDocs(hashTagsCollection);
      const hashTagsData = hashTagsSnapshot.docs.map((doc) => doc.data());
      setHashTags(hashTagsData);
    };

    fetchUser();
    fetchHashTags();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  // Close menu if clicked outside the sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="header-mobile">
      <div className="mobile-header-content flex justify-between items-center p-4 bg-white shadow-md fixed top-0 left-0 w-full z-50">
        {/* Hamburger Menu with React Icon */}
        <div className="hamburger">
          <AiOutlineMenu className="h-8 w-8 cursor-pointer" onClick={toggleMenu} />
        </div>

        {/* Logo */}
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Logo" className="h-10" />
          </Link>
        </div>

        {/* Search and Cart icons */}
        <div className="header-icons flex items-center space-x-4">
          <div className="search-icon">
            <img src={searchIcon} alt="Search Icon" className="h-6 cursor-pointer" />
          </div>

          <div className="cart relative">
            <Link to="/cart">
              <img src={cartIcon} alt="Cart Icon" className="h-6 cursor-pointer" />
              {cartCount > 0 && (
                <span className="cart-count absolute top-0 right-0 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Popup for login/signup */}
      {showPopup && <MainPopup onUserLoaded={setUser} closePopup={closePopup} />}

      {/* Navigation Sidebar */}
      {menuOpen && (
        <div ref={sidebarRef} className="mobile-navigation fixed top-0 left-0 w-64 bg-white shadow-lg h-full z-50 p-4">
          <nav>
            <ul className="space-y-4">
              {/* My Account Section */}
              <li>
                <Link to="/my-account" className="text-lg font-bold">
                  {user ? user.displayName || user.firstName : 'My Account'}
                </Link>
              </li>

              {/* All Products Dropdown */}
              <li className="text-lg font-bold relative">
                <div onClick={toggleDropdown} className="cursor-pointer flex items-center justify-between">
                  All Products
                  <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <ul className="block mt-2 bg-white shadow-lg rounded-lg w-full space-y-2 p-2">
                    {hashTags.length > 0 ? (
                      hashTags.map((tag, index) => (
                        <li key={index} className="hover:bg-gray-100 p-2">
                          <Link to={`/${tag.hash_tag_id}/categories`} className="block text-base">
                            {tag.tag_name}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="p-2">Loading...</li>
                    )}
                  </ul>
                )}
              </li>

              {/* Help Center Section */}
              <li>
                <div className="flex items-center">
                  <img src={helpIcon} alt="Help Icon" className="h-5 w-5 mr-2" />
                  <Link to="/help-center" className="text-lg">
                    Help Center
                  </Link>
                </div>
              </li>

              {/* Login/Logout Button */}
              <li>
                {user ? (
                  <button onClick={handleLogout} className="text-lg font-bold">
                    Logout
                  </button>
                ) : (
                  <span onClick={togglePopup} className="text-lg font-bold cursor-pointer">
                    Login
                  </span>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeaderMobile;
