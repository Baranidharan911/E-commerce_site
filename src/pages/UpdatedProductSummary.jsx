import React, { useContext, useState, useEffect } from 'react';
import '../styles/ProductSummaryPage.css';
import { SummaryContext } from '../context/SummaryContext';
import { doc, getDoc, setDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { extractSpecificationDetails, productSpecsPrototype } from '../components/Utils';

const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function UpdatedProductSummary() {
  const { summaryData, updateSummaryData } = useContext(SummaryContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [productSpecificationId, setProductSpecificationId] = useState(null);
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
    const fetchCartProductData = async () => {
      if (cartProductId) {
        try {
          const cartProductDocRef = doc(db, "cartProducts", cartProductId);
          const cartProductDoc = await getDoc(cartProductDocRef);

          if (cartProductDoc.exists()) {
            const cartProductData = cartProductDoc.data();
            setProductSpecificationId(cartProductData.product_specification_id);

            const productDocRef = doc(db, "products", cartProductData.product_id);
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
    const storedSummaryData = JSON.parse(localStorage.getItem('summaryData'));
    if (storedSummaryData) {
      updateSummaryData(storedSummaryData);
    }
  }, [location]);

  useEffect(() => {
    setProductData(productData);
  }, [summaryData]);

  useEffect(() => {
    const fetchProductSpecificationData = async () => {
      if (productSpecificationId) {
        try {
          const productSpecificationRef = doc(db, "productSpecifications", productSpecificationId);
          const productSpecDoc = await getDoc(productSpecificationRef);

          if (productSpecDoc.exists()) {
            const existingData = productSpecDoc.data();
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

  const filteredData = Object.entries(summaryData).filter(
    ([key, value]) => value !== '' && value !== null && value !== 'None' && value !== 'N/A' && (typeof value !== 'number' || value > 0)
  );

  const handleDeliveryInfoChange = (event) => {
    const deliveryInfo = event.target.value;
    updateSummaryData({ delivery_info: deliveryInfo });
  };

  const handleAddToCart = async () => {
    try {
      let designUrl = '';
      let newProductSpecificationId = productSpecificationId;
    
      if (summaryData.files && summaryData.files.length > 0) {
        const base64String = summaryData.files[0];
        const file = dataURLtoFile(base64String, 'design-file.png');
        const uniqueFilename = `file-${uuidv4()}`;
        const fileRef = ref(storage, `design-files/${userId}/${summaryData.product_id}/${uniqueFilename}`);
        await uploadBytes(fileRef, file);
        designUrl = await getDownloadURL(fileRef);
      }
    
      if (productSpecificationId) {
        console.log("Updating existing product specification with ID:", productSpecificationId);

        const productSpecificationRef = doc(db, "productSpecifications", productSpecificationId);
        const productSpecDoc = await getDoc(productSpecificationRef);

        if (productSpecDoc.exists()) {
          const existingData = productSpecDoc.data();

          const updatedValues = extractSpecificationDetails({
            ...existingData,
            ...summaryData,
            design_url: designUrl,
            design_info: summaryData.design_info,
            delivery_info: summaryData.delivery_info,
            product_id: summaryData.product_id,
            updated_at: serverTimestamp(),
          });

          await updateDoc(productSpecificationRef, updatedValues);

          console.log("Product specification updated successfully!");
        } else {
          console.error("No existing product specification document found!");
          return;
        }
      } else {
        console.log("Creating a new product specification.");

        const productSpecificationRef = doc(collection(db, "productSpecifications"));
        newProductSpecificationId = productSpecificationRef.id;

        const newSpecificationData = extractSpecificationDetails({
          ...summaryData,
          design_url: designUrl,
          user_id: userId,
          created_at: serverTimestamp(),
        });

        await setDoc(productSpecificationRef, newSpecificationData);

        console.log("Product specification saved successfully!");
        setProductSpecificationId(newProductSpecificationId);

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
    
      updateSummaryData({
        files: [],
        design_info: '',
        delivery_info: '',
        product_id: '',
        ...productSpecsPrototype
      });
    
      navigate('/', { replace: true });
    
    } catch (error) {
      console.error("Error saving product specification or adding to cart:", error);
    }
  };

  const handleLinkClick = (newSection) => {
    const currentPath = location.pathname;
    const newPath = currentPath.replace('cart-product-summary', newSection);
    navigate(newPath);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const renderImagePreview = () => {
    if (summaryData.files && summaryData.files.length > 0) {
      const file = summaryData.files[0];
      const imageUrl = file instanceof File ? URL.createObjectURL(file) : file;

      return <img src={imageUrl} alt="Uploaded Design" className="uploaded-image" style={{ maxWidth: '100%', height: 'auto' }} />;
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
              <strong>Per piece cost (Inclusive taxes):</strong> <p>₹{productData?.price || 'N/A'}</p>
            </span>
            <span>
              <strong>Quantity:</strong> <p>{summaryData.quantity || 'N/A'}</p>
            </span>
            <span>
              <strong>Total production Charges:</strong> <p>₹{productData?.price * summaryData.quantity || 'N/A'}</p>
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
            <button className="add-to-cart-button" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>

        <div className="design-preview">
          <p>Your Design (Printed in Black)</p>
          <div className="design-placeholder">
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
