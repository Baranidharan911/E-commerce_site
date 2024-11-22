import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import { extractSpecificationDetails } from '../components/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUnlock, faMotorcycle, faTruck, faStore } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SummaryContext } from '../context/SummaryContext'; 
import '../styles/CustomizingPage.css';

const CustomizingPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { summaryData, updateSummaryData } = useContext(SummaryContext);

  const [productName, setProductName] = useState('');
  const [productRequirements, setProductRequirements] = useState({});
  const [pincode, setPincode] = useState('');
  const [isShapeUnlocked, setIsShapeUnlocked] = useState(false);
  const [isSizeUnlocked, setIsSizeUnlocked] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [pickupModalIsOpen, setPickupModalIsOpen] = useState(false);
  const [unlockType, setUnlockType] = useState('');
  const [expressDeliveryAvailable, setExpressDeliveryAvailable] = useState(true);
  const [productPrice, setProductPrice] = useState(0);

  const [selectedValues, setSelectedValues] = useState(() => extractSpecificationDetails(summaryData));

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productDocRef = doc(db, 'productData', productId);
        const productDoc = await getDoc(productDocRef);

        if (productDoc.exists()) {
          const productData = productDoc.data();
          setProductName(productData.product_name);
          setProductPrice(productData.price);
          setProductRequirements(productData.product_requirements || {});
          console.log("Product Requirements: ", productData.product_requirements);
        } else {
          console.error('No such product document!');
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
      }
    };

    fetchProductData();
  }, [productId]);

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setPincode(value);
      if (value.length === 6) {
        const available = checkPincodeAvailability(value);
        setExpressDeliveryAvailable(available);
      } else {
        setExpressDeliveryAvailable(true);
      }
    }
  };

  const handleUnlockClick = (type) => {
    if (type === 'shape' && isShapeUnlocked) return;
    if (type === 'size' && isSizeUnlocked) return;
    setUnlockType(type);
    setModalIsOpen(true);
  };

  const handleConfirmUnlock = () => {
    if (unlockType === 'shape') {
      setIsShapeUnlocked(true);
    } else if (unlockType === 'size') {
      setIsSizeUnlocked(true);
    }
    setModalIsOpen(false);
  };

  const handleCancelUnlock = () => {
    setModalIsOpen(false);
  };

  const openPickupModal = () => {
    setPickupModalIsOpen(true);
  };

  const closePickupModal = () => {
    setPickupModalIsOpen(false);
  };

  const handleContinueToDesign = () => {
    const updatedSummaryData = {
      ...summaryData,
      product_id: productId,
      ...selectedValues,
      price: productPrice * (selectedValues.quantity || 1)
    };

    updateSummaryData(updatedSummaryData); 
    localStorage.setItem('summaryData', JSON.stringify(updatedSummaryData));

    const currentPath = location.pathname;
    const newPath = currentPath.replace('customize', 'design-upload');
    
    navigate(newPath);
  };

  const handleChange = (field, value) => {
    setSelectedValues(prevValues => ({
      ...prevValues,
      [field]: value
    }));
  };

  const renderRequirementSelect = (field, label) => {
    if (Array.isArray(productRequirements[field]) && productRequirements[field].length > 0) {
      return (
        <div className="custom-checkout-form-group" key={field}>
          <label>{label}</label>
          <select
            className="custom-checkout-select"
            value={selectedValues[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            required
          >
            <option value="">Select {label}</option>
            {productRequirements[field].map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  };

  const renderQuantityField = () => {
    const quantityOptions = productRequirements.quantity;

    if (Array.isArray(quantityOptions) && quantityOptions.length > 0) {
      return (
        <div className="custom-checkout-form-group">
          <label>Quantity</label>
          <select
            className="custom-checkout-select"
            value={selectedValues.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
            required
          >
            <option value="">Select Quantity</option>
            {quantityOptions.map((quantity, index) => (
              <option key={index} value={quantity}>{quantity}</option>
            ))}
          </select>
        </div>
      );
    } else {
      return (
        <div className="custom-checkout-form-group">
          <label>Quantity</label>
          <input
            type="number"
            className="custom-checkout-select"
            value={selectedValues.quantity || ''}
            onChange={(e) => handleChange('quantity', Number(e.target.value))}
            required
          />
        </div>
      );
    }
  };

  const totalPrice = productPrice * (selectedValues.quantity || 1);

  return (
    <div className="custom-page-wrapper">
      <div className="link-bar">
        <span className={`link-item active`}>
          1. {productName} 
        </span> — 
        <span className="link-item inactive" onClick={handleContinueToDesign}>
          2. Upload Design 
        </span> — 
        <span className="link-item inactive">
          3. Confirm & Add to Cart
        </span> — 
        <span className="link-item inactive">4. Cart</span>
      </div>
      <div className="custom-checkout-container">
      
        <div className="custom-checkout-left">
          <h1>{productName}</h1>
          <p className="custom-checkout-subheading">
            Elevate product packaging with custom labels. Ensure brand recall and a premium feel with every unboxing.
          </p>
          
          {renderQuantityField()} 

          {Object.keys(productRequirements).map(field =>
            field !== 'quantity' && renderRequirementSelect(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
          )}
        </div>

        <div className="custom-checkout-right">
          <div className="custom-checkout-price-box">
            <p><span id='price'>₹{totalPrice.toFixed(2)}</span><span> inclusive of all taxes</span></p>
            <p>for {selectedValues.quantity || 1} Qty (₹{productPrice.toFixed(2)}/piece)</p>
            <button className="custom-checkout-edit-design-button" onClick={handleContinueToDesign}>
              Continue to Design ➜
            </button>
            <p className="custom-checkout-fill-details"><span id='Arrow'>⬅︎</span>  Fill all the details to proceed</p>
          </div>

          <div className="custom-checkout-pincode-section">
            <label id='PincodeText'>Pincode</label>
            <input 
              type="text" 
              className="custom-checkout-pincode-input" 
              value={pincode} 
              onChange={handlePincodeChange}
              maxLength="6"
            />
            <button className="custom-checkout-save-button">Save</button>
          </div>

          <div className="custom-checkout-delivery-options">
            <div className="custom-checkout-delivery-option">
              <FontAwesomeIcon icon={faMotorcycle} size="2x" style={{ marginRight: '10px', color: '#FF4500' }} />
              <div>
                <h3>Express Delivery:</h3>
                <p className={expressDeliveryAvailable ? 'available' : 'unavailable'}>
                  {expressDeliveryAvailable ? 
                  "4 hours/same day delivery available at selected locations." :
                  "Express delivery unavailable at the selected pincode."}
                </p>
              </div>
            </div>
            
            <div className="custom-checkout-delivery-option">
              <FontAwesomeIcon icon={faTruck} size="2x" style={{ marginRight: '10px', color: '#FF4500' }} />
              <div>
                <h3>Standard Delivery:</h3>
                <p>Estimated delivery by Fri, 16 Aug</p>
              </div>
            </div>
            
            <div className="custom-checkout-delivery-option">
              <FontAwesomeIcon icon={faStore} size="2x" style={{ marginRight: '10px', color: '#FF4500' }} />
              <div>
                <h3>Store Pickup:</h3>
                <p>Pickup available at 27 stores across 6 cities.</p>
              </div>
            </div>

            <p className="custom-checkout-change-pickup" onClick={openPickupModal}>Change pickup</p>
          </div>
        </div>

        <Modal 
          isOpen={modalIsOpen} 
          onRequestClose={handleCancelUnlock} 
          contentLabel="Unlock Field Confirmation"
          className="custom-modal"
          overlayClassName="custom-modal-overlay"
        >
          <div className="custom-modal-header">
            <h2>Unlock The Field</h2>
            <button onClick={handleCancelUnlock} className="close-modal-button">×</button>
          </div>
          <div className="custom-modal-body">
            <p>There will be a change in design if the locked fields are modified. Do you still want to continue?</p>
          </div>
          <div className="custom-modal-footer">
            <button onClick={handleConfirmUnlock} className="confirm-button">Yes, Unlock</button>
            <button onClick={handleCancelUnlock} className="cancel-button">No, Cancel</button>
          </div>
        </Modal>

        <Modal 
          isOpen={pickupModalIsOpen} 
          onRequestClose={closePickupModal} 
          contentLabel="Select Delivery Information"
          className="custom-modal"
          overlayClassName="custom-modal-overlay"
        >
          <div className="custom-modal-header">
            <h2>Select Delivery Information</h2>
            <button onClick={closePickupModal} className="close-modal-button">×</button>
          </div>
          <div className="custom-modal-body">
            <div className="custom-modal-form-group">
              <label>City</label>
              <select className="custom-modal-select">
                <option>Select an option</option>
                <option>Bangalore</option>
                <option>Chennai</option>
                <option>Pune</option>
                <option>Hyderabad</option>
                <option>Coimbatore</option>
              </select>
            </div>
          </div>
          <div className="custom-modal-footer">
            <button onClick={closePickupModal} className="confirm-button">Confirm</button>
            <button onClick={closePickupModal} className="cancel-button">Cancel</button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CustomizingPage;
