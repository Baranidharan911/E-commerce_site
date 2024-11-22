import React, { useContext, useState, useEffect } from 'react';
import '../styles/ProductSummaryPage.css';
import { SummaryContext } from '../context/SummaryContext';
import { doc, getDoc, setDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { extractSpecificationDetails, productSpecsPrototype } from '../components/Utils';
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress from Material UI
import Button from '@mui/material/Button';

export default function ProductSummaryPage() {
  const { summaryData, updateSummaryData } = useContext(SummaryContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // State for tracking upload status
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        const cartQuery = query(
          collection(db, "carts"),
          where("user_id", "==", user.uid),
          where("checkout_status", "==", false)
        );
        const cartSnapshot = await getDocs(cartQuery);
        if (!cartSnapshot.empty) {
          const existingCart = cartSnapshot.docs[0];
          setCartId(existingCart.id);
        } else {
          const newCartRef = doc(collection(db, "carts"));
          await setDoc(newCartRef, {
            cart_id: newCartRef.id,
            user_id: user.uid,
            checkout_status: false,
            created_at: serverTimestamp(),
          });
          setCartId(newCartRef.id);
        }
      } else {
        console.log("No user is signed in.");
      }
    });
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      if (summaryData.product_id) {
        try {
          console.log("Fetching product data for ID:", summaryData.product_id);
          const productDocRef = doc(db, "products", summaryData.product_id);
          const productDoc = await getDoc(productDocRef);
  
          if (productDoc.exists()) {
            setProductData(productDoc.data());
          } else {
            console.error("No such product document!");
            setError("No such product document!");
          }
        } catch (err) {
          console.error("Error getting document:", err.message);
          setError("Error fetching product data");
        } finally {
          setLoading(false);
        }
      } else {
        console.error("No product ID found in summaryData");
        setError("No product ID found");
        setLoading(false);
      }
    };
  
    fetchProductData();
  }, [summaryData.product_id]);
  
  useEffect(() => {
    const storedSummaryData = JSON.parse(localStorage.getItem('summaryData'));
    if (storedSummaryData) {
      updateSummaryData(storedSummaryData);
    }
  }, [location]);

  const filteredData = Object.entries(summaryData).filter(
    ([key, value]) => value !== '' && value !== null && value !== 'None' && value !== 'N/A' && (typeof value !== 'number' || value > 0)
  );

  const handleDeliveryInfoChange = (event) => {
    const deliveryInfo = event.target.value;
    updateSummaryData({ delivery_info: deliveryInfo });
  };

  const moveFilesToPermanentLocation = async () => {
    const newFileURLs = [];

    if (summaryData.files && summaryData.files.length > 0) {
      for (const fileURL of summaryData.files) {
        const uniqueFilename = `file-${uuidv4()}`;
        const tempFileRef = ref(storage, fileURL); // Reference to the temp file
        const newFileRef = ref(storage, `design-files/${userId}/${summaryData.product_id}/${uniqueFilename}`);

        // Download the file as a Blob and then upload it to the new location
        const response = await fetch(fileURL);
        const blob = await response.blob();
        await uploadBytes(newFileRef, blob);

        // Get the new download URL
        const newDownloadURL = await getDownloadURL(newFileRef);
        newFileURLs.push(newDownloadURL);

        // Delete the temp file
        await deleteObject(tempFileRef);
      }
    }

    return newFileURLs;
  };

  const handleAddToCart = async () => {
    try {
      setIsUploading(true); // Start the loading state
      const designUrls = await moveFilesToPermanentLocation();

      const deliveryInfo = summaryData.delivery_info || ''; 
  
      const productSpecificationRef = doc(collection(db, "productSpecifications"));
      const productSpecificationId = productSpecificationRef.id;
  
      const specificationDetails = extractSpecificationDetails(summaryData);
      await setDoc(productSpecificationRef, {
        productSpecificationId,
        user_id: userId,
        design_urls: designUrls,
        design_info: summaryData.design_info || '', 
        delivery_info: deliveryInfo,
        product_id: summaryData.product_id,
        ...specificationDetails,  
        created_at: serverTimestamp()
      });
  
      const totalPrice = productData.price * summaryData.quantity;
  
      const cartProductRef = doc(collection(db, "cartProducts"));
      await setDoc(cartProductRef, {
        cart_product_id: cartProductRef.id,
        cart_id: cartId,
        product_id: summaryData.product_id,
        product_specification_id: productSpecificationId,
        price: totalPrice,
        created_at: serverTimestamp()
      });
  
      updateSummaryData({
        files: [],
        design_info: '',
        delivery_info: '',
        product_id: '',
        ...productSpecsPrototype
      });
  
      navigate('/cart', { replace: true });
    } catch (error) {
      console.error("Error saving product specification or adding to cart:", error);
    } finally {
      setIsUploading(false); // End the loading state
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout', { replace: true });
  };
  
  const handleLinkClick = (newSection) => {
    const currentPath = location.pathname;
    const newPath = currentPath.replace('product-summary', newSection);
    navigate(newPath);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Updated renderImagePreview function
  const renderImagePreview = () => {
    if (summaryData.files && summaryData.files.length > 0) {
      return summaryData.files.map((file, index) => {
        const imageUrl = file instanceof File ? URL.createObjectURL(file) : file;

        return (
          <img 
            key={index}
            src={imageUrl} 
            alt={`Uploaded Design ${index + 1}`} 
            className="uploaded-image" 
            style={{  width: '200px', height: '100%', marginRight: '25px' }} 
          />
        );
      });
    }

    return <p>No design uploaded yet</p>;
  };

  return (
    <div className="cart-page">
      <div className="link-bar">
        <span
          className={`link-item ${location.pathname.includes('customize') ? 'active' : 'completed'}`}
          onClick={() => handleLinkClick('customize')}
        >
          {location.pathname.includes('product-summary') && <span style={{ color: 'green' }}>✔️</span>} {productData?.product_name || 'Customise Packaging Label'} 
        </span> — 
        <span
          className={`link-item ${location.pathname.includes('design') ? 'active' : 'completed'}`}
          onClick={() => handleLinkClick('design-upload')}
        >
          {location.pathname.includes('product-summary') && <span style={{ color: 'green' }}>✔️</span>} Design Packaging Label 
        </span> — 
        <span className={`link-item ${location.pathname.includes('product-summary') ? 'active' : ''}`}>
          3. Confirm & Add to Cart
        </span> — 
        <span className="link-item">4. Cart</span>
      </div>
      <div className="cart-content">
        <h2>{productData?.product_name || 'Product Name'}</h2>
        <div className="summary-container">
          <table className="product-details-table">
            <tbody>
              {filteredData.map(([key, value]) => (
                (key !== "files" && 
                  key !== "product_id" && 
                  key !== "design_info" && 
                  key !== "delivery_info" && 
                  key !== "description_id" &&
                  key !== "category_id" &&
                  key !== "quantity" &&   
                  key !== "product_images" &&
                  key !== "productRequirementId" &&
                  key !== "price"   &&  
                  key !== "product_name" 
                ) && (
                  <tr key={key}>
                    <td>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="data">{value}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
  
          <div className="order-summary">
            <h3>Order Summary</h3>
            <span>
              <strong>Per piece cost (Inclusive taxes):</strong> <p>₹{productData?.price.toFixed(2) || 'N/A'}</p>
            </span>
            <span>
              <strong>Quantity:</strong> <p>{summaryData.quantity || 'N/A'}</p>
            </span>
            <span>
              <strong>Total production Charges:</strong> <p>₹{(productData?.price * summaryData.quantity).toFixed(2) || 'N/A'}</p>
            </span>
  
            <div className="shipping-info">
              <img src="/src/assets/delivery-icon.svg" alt="Shipping Icon" /> <p>Shipping options are now moved to checkout</p>
            </div>
  
            <input
              type="text"
              className="delivery_info"
              placeholder="Enter additional information about your order (optional)"
              value={summaryData.delivery_info || ''} 
              onChange={handleDeliveryInfoChange} 
            />
            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="progress-indicator">
                  <CircularProgress
                    size={24}
                    style={{ color: '#fff', marginRight: '20px' }}
                  />
                  Adding...
                </div>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </div>
  
        <div className="design-preview">
          <p>Your Design (Printed in Black)</p>
          <div className="design-preview-container">
            {renderImagePreview()}
          </div>
        </div>
  
        <p className="design-submission-warning">
          <img src="/src/assets/warning-icon.svg" alt="Warning Icon" /> Please submit your design files within an hour to keep us on track. Any further delay might affect the estimated delivery.
        </p>
      </div>
    </div>
  );  
}
