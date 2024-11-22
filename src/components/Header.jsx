import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import '../styles/Header.css';
import logo from '../assets/logos.png';
import phoneIcon from '../assets/phone-icon.png';
import emailIcon from '../assets/email-icon.png';
import infoIcon from '../assets/info-icon.png';
import searchIcon from '../assets/search-icon.png';
import helpIcon from '../assets/help-icon.png';
import userIcon from '../assets/user-icon.png'; // default user icon
import cartIcon from '../assets/cart-icon.png';
import MainPopup from './MainPopup';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [hashTags, setHashTags] = useState([]);
  const [categories, setCategories] = useState({});
  const [allCategories, setAllCategories] = useState([]); // Store all categories for the 'All Products' dropdown
  const { cartCount } = useCart();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const fetchCategoryNamesAndProducts = async (categoryIds) => {
    const categoryData = [];
    for (const categoryId of categoryIds) {
      const categoryDocRef = doc(db, 'categories', categoryId);
      const categoryDoc = await getDoc(categoryDocRef);
      if (categoryDoc.exists()) {
        const categoryName = categoryDoc.data().category_name;

        // Fetch products in this category
        const productsQuery = query(collection(db, 'productData'), where('category_id', '==', categoryId));
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        categoryData.push({ id: categoryId, name: categoryName, products });
      }
    }
    return categoryData;
  };

  const fetchAllCategories = async () => {
    const categoryQuery = collection(db, 'categories');
    const categorySnapshot = await getDocs(categoryQuery);
    const allCategories = categorySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().category_name,
    }));
    setAllCategories(allCategories);
  };

  const handleHover = async (hashTagId, categoryIds) => {
    if (!categories[hashTagId]) {
      const categoryData = await fetchCategoryNamesAndProducts(categoryIds);
      setCategories((prevState) => ({
        ...prevState,
        [hashTagId]: categoryData,
      }));
    }
    setDropdownOpen(hashTagId);
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
    fetchAllCategories(); // Fetch all categories on component mount
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
  };

  const handleMouseLeave = (hashTagId) => {
    setDropdownOpen(null);
  };

  return (
    <header className="header">
      <div className="top-bar">
        <div className="contact-info">
          <img src={phoneIcon} alt="Phone Icon" className="icon" />
          <span className="phone">xxxxxxxxxxxxxx</span>
          <span className="separator">|</span>
          <img src={emailIcon} alt="Email Icon" className="icon" />
          <span className="email">xxxxxxxxxxxxxxxx</span>
        </div>
        <div className="shipping-info-header">
          Orders of ₹500+ Get Free Shipping <img src={infoIcon} alt="Info Icon" className="icon" />
        </div>
      </div>
      <div className="main-bar">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Logo" />
          </Link>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search" />
          <button type="submit">
            <img src={searchIcon} alt="Search Icon" />
          </button>
        </div>
        <div className="user-options">
          <div className="help-center">
            <img src={helpIcon} alt="Help Icon" className="icon" />
            <a href="/help-center">Help Center</a>
          </div>
          <div className="login-signup">
            {user ? (
              <>
                <img
                  src={user.profilePic || userIcon}
                  alt="User Profile"
                  className="user-icon"
                  style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                />
                <Link to="/my-account" className="username-link">
                  {user.displayName || user.firstName}
                </Link>
                <button onClick={handleLogout} className="logout-button">
                  <i className="fas fa-sign-out-alt"></i>{/* Added sign-out icon */}
                </button>
              </>
            ) : (
              <span onClick={togglePopup}>Login / Signup</span>
            )}
          </div>
          <div>
            <Link to="/cart" className="cart">
              <img src={cartIcon} alt="Cart Icon" className="icon" /> <span className="cart-count">{cartCount}</span>
            </Link>
          </div>
        </div>
        <div className="hamburger" onClick={toggleMenu}>
          <div className={`line ${menuOpen ? 'open' : ''}`}></div>
          <div className={`line ${menuOpen ? 'open' : ''}`}></div>
          <div className={`line ${menuOpen ? 'open' : ''}`}></div>
        </div>
      </div>
      <div className={`navigation-bar ${menuOpen ? 'open' : ''}`}>
        <nav>
          <ul>
            {/* All Products with Category Dropdown */}
            <li
              className="nav-link-list"
              onMouseEnter={() => setDropdownOpen('all-products')}
              onMouseLeave={() => handleMouseLeave('all-products')}
            >
              <Link className="nav-link" to="/categories">
                All Products
              </Link>
              {dropdownOpen === 'all-products' && (
                <div className="dropdown-menu">
                  <ul>
                    {allCategories.length > 0 ? (
                      allCategories.map((category, index) => (
                        <li key={index}>
                          <Link to={`/${category.id}/products`}>
                            <strong>{category.name}</strong>
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li>Loading...</li>
                    )}
                  </ul>
                </div>
              )}
            </li>
            {hashTags.map((tag, index) => (
              <li
                key={index}
                onMouseEnter={() => handleHover(tag.hash_tag_id, tag.category_ids)}
                onMouseLeave={() => handleMouseLeave(tag.hash_tag_id)}
                className="nav-link-list"
              >
                <Link className="nav-link" to={`/${tag.hash_tag_id}/categories`}>
                  {tag.tag_name}
                </Link>
                {dropdownOpen === tag.hash_tag_id && (
                  <div className="dropdown-menu">
                    <ul>
                      {categories[tag.hash_tag_id] ? (
                        categories[tag.hash_tag_id].map((category, subIndex) => (
                          <li key={subIndex}>
                            <Link to={`/${category.id}/products`}>
                              <strong className="tag-cat-title">{category.name}</strong>
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li>Loading...</li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {showPopup && <MainPopup onUserLoaded={setUser} closePopup={closePopup} />}
    </header>
  );
};

export default Header;
