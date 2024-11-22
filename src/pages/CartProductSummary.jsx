import React, { useContext, useState, useEffect } from 'react';
import '../styles/ProductSummaryPage.css';
import { SummaryContext } from '../context/SummaryContext';
import { doc, getDoc, setDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { extractSpecificationDetails, productSpecsPrototype } from '../components/Utils';
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress from Material UI
import Button from '@mui/material/Button';
import { arrayUnion } from "firebase/firestore"; // Import arrayUnion

export default function CartProductSummary() {
  const { summaryData, updateSummaryData } = useContext(SummaryContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [productSpecificationId, setProductSpecificationId] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // State for tracking upload status
  const [existingDesignUrls, setExistingDesignUrls] = useState([]); // State to store existing design URLs
  const navigate = useNavigate();
  const location = useLocation();
  const { cartProductId } = useParams();

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
          setCartId(existingCart.cart_id);
        } else {
          const newCartRef = doc(collection(db, "carts"));
          await setDoc(newCartRef, {
            cart_id: newCartRef.cart_id,
            user_id: user.uid,
            checkout_status: false,
            created_at: serverTimestamp(),
          });
          setCartId(newCartRef.cart_id);
        }
      } else {
        console.log("No user is signed in.");
      }
    });
  }, []);

  useEffect(() => {
    const fetchCartProductData = async () => {
      if (cartProductId) {
        try {
          const cartProductDocRef = doc(db, "cartProducts", cartProductId);
          const cartProductDoc = await getDoc(cartProductDocRef);

          if (cartProductDoc.exists()) {
            const cartProductData = cartProductDoc.data();
            setProductSpecificationId(cartProductData.product_specification_id);

            const productDocRef = doc(db, "productData", cartProductData.product_id);
            const productDoc = await getDoc(productDocRef);

            if (productDoc.exists()) {
              setProductData(productDoc.data());
            } else {
              console.error("No such product document!");
              setError("No such product document!");
            }
          } else {
            console.error("No such cart product document!");
            setError("No such cart product document!");
          }
        } catch (err) {
          console.error("Error getting document:", err.message);
          setError("Error fetching cart product data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCartProductData();
  }, [cartProductId]);

  useEffect(() => {
    const fetchProductSpecificationData = async () => {
      if (productSpecificationId) {
        try {
          const productSpecificationRef = doc(db, "productSpecifications", productSpecificationId);
          const productSpecDoc = await getDoc(productSpecificationRef);

          if (productSpecDoc.exists()) {
            const existingData = productSpecDoc.data();
            setExistingDesignUrls(existingData.design_urls || []); // Store existing design URLs
            updateSummaryData(prevData => ({
              ...prevData,
              ...existingData,
              product_id: existingData.product_id,
            }));
          } else {
            console.error("No existing product specification document found!");
          }
        } catch (error) {
          console.error("Error fetching product specification data:", error);
        }
      }
    };

    fetchProductSpecificationData();
  }, [productSpecificationId]);

  useEffect(() => {
    const storedSummaryData = JSON.parse(localStorage.getItem('summaryData'));
    if (storedSummaryData) {
      updateSummaryData(storedSummaryData);
    }
  }, [location]);

  useEffect(() => {
    setProductData(productData);
  }, [summaryData]);

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
      setIsUploading(true); // Start the uploading process
  
      // Move files from temp to permanent location
      const newDesignUrls = await moveFilesToPermanentLocation(); // Move files to permanent storage
      console.log(newDesignUrls);
  
      let newProductSpecificationId = productSpecificationId;
  
      // Check if the product specification exists; if yes, update it
      if (productSpecificationId) {
        console.log("Updating existing product specification with ID:", productSpecificationId);
  
        const productSpecificationRef = doc(db, "productSpecifications", productSpecificationId);
        const productSpecDoc = await getDoc(productSpecificationRef);
  
        if (productSpecDoc.exists()) {
          const existingData = productSpecDoc.data();
  
          // Use Firestore's arrayUnion to append new design URLs without duplicates
          await updateDoc(productSpecificationRef, {
            ...existingData,
            ...summaryData,
            design_urls: arrayUnion(...newDesignUrls), // Append the new design URLs to the existing array
            design_info: summaryData.design_info,
            delivery_info: summaryData.delivery_info,
            product_id: summaryData.product_id,
            updated_at: serverTimestamp(),
          });
  
          console.log("Product specification updated successfully!");
        } else {
          console.error("No existing product specification document found!");
          return;
        }
      } else {
        // If no product specification exists, create a new one
        console.log("Creating a new product specification.");
  
        const productSpecificationRef = doc(collection(db, "productSpecifications"));
        newProductSpecificationId = productSpecificationRef.id;
  
        const newSpecificationData = extractSpecificationDetails({
          ...summaryData,
          design_urls: newDesignUrls, // Use the new design URLs
          user_id: userId,
          created_at: serverTimestamp(),
        });
  
        // Save the new product specification in Firestore
        await setDoc(productSpecificationRef, newSpecificationData);
  
        console.log("Product specification saved successfully!");
        setProductSpecificationId(newProductSpecificationId);
  
        // Add the product to the cart
        const totalPrice = productData.price * summaryData.quantity;
        const cartProductRef = doc(collection(db, "cartProducts"));
        await setDoc(cartProductRef, {
          cart_product_id: cartProductRef.id,
          cart_id: cartId,
          product_id: summaryData.product_id,
          product_specification_id: newProductSpecificationId,
          price: totalPrice,
          created_at: serverTimestamp(),
        });
        console.log("New cart product added successfully!");
      }
  
      // Clear the summary data after saving
      updateSummaryData({
        files: [],
        design_info: '',
        delivery_info: '',
        product_id: '',
        ...productSpecsPrototype
      });
  
      // Navigate back to the homepage or cart page
      navigate('/', { replace: true });
  
    } catch (error) {
      console.error("Error saving product specification or adding to cart:", error);
    } finally {
      setIsUploading(false); // Stop the uploading process
    }
  };
  
  const handleLinkClick = (newSection) => {
    const currentPath = location.pathname;
    const newPath = currentPath.replace('cart-product-summary', newSection);
    navigate(newPath);
  };

  const renderImagePreview = () => {
    // Combine images from both sources: summaryData.files and existingDesignUrls
    const allImages = [...existingDesignUrls, ...(summaryData.files || [])];

    if (allImages.length > 0) {
      return allImages.map((file, index) => {
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
          onClick={() => handleLinkClick('uploads')}
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
            <button className="add-to-cart-button" onClick={handleAddToCart}>Add to Cart</button>
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
