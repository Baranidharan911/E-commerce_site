import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [deliverySelected, setDeliverySelected] = useState(localStorage.getItem('delivery_type') || null);
  const [addresses, setAddresses] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(
    JSON.parse(localStorage.getItem('billing_address')) || null
  );
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(
    JSON.parse(localStorage.getItem('shipping_address')) || null
  );
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState(localStorage.getItem('gst_in') || '');
  const [paymentMethod, setPaymentMethod] = useState(localStorage.getItem('payment_method') || '');
  const [currentCartId, setCurrentCartId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddressesAndCartData = async (userId) => {
      try {
        // Fetch addresses
        const q = query(collection(db, 'addresses'), where('user_id', '==', userId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const fetchedAddresses = [];
          querySnapshot.forEach((doc) => {
            fetchedAddresses.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setAddresses(fetchedAddresses);
        } else {
          console.log('No addresses found for this user.');
          setAddresses([]);
        }

        // Fetch cart data
        const cartQuery = query(
          collection(db, 'carts'),
          where('user_id', '==', userId),
          where('checkout_status', '==', false),
          limit(1)
        );
        const cartSnapshot = await getDocs(cartQuery);

        if (!cartSnapshot.empty) {
          const cartDoc = cartSnapshot.docs[0];
          const cartId = cartDoc.id;
          setCurrentCartId(cartId);

          const cartProductsQuery = query(
            collection(db, 'cartProducts'),
            where('cart_id', '==', cartId)
          );
          const cartProductsSnapshot = await getDocs(cartProductsQuery);

          const productsWithDetails = await Promise.all(
            cartProductsSnapshot.docs.map(async (productDoc) => {
              const productData = productDoc.data();

              const productRef = doc(db, 'products', productData.product_id);
              const productSnapshot = await getDoc(productRef);
              const productInfo = productSnapshot.exists() ? productSnapshot.data() : {};

              const specRef = doc(db, 'productSpecifications', productData.product_specification_id);
              const specSnapshot = await getDoc(specRef);
              const specInfo = specSnapshot.exists() ? specSnapshot.data() : {};

              return {
                id: productDoc.id,
                ...productData,
                product_name: productInfo.product_name || 'Unknown Product',
                price: productData.price,
                quantity: specInfo.quantity || 1,
                productImage: productInfo.product_images ? productInfo.product_images[0] : '',
              };
            })
          );

          setCartProducts(productsWithDetails);

          // Calculate the total price
          const total = productsWithDetails.reduce((sum, product) => sum + (product.price), 0);
          setTotalPrice(total);
        } else {
          console.log('No active cart found for this user.');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAddressesAndCartData(user.uid);
      } else {
        setLoading(false);
        console.log('User not logged in, cannot fetch data');
      }
    });
  }, []);

  const handleDeliverySelection = (type) => {
    setDeliverySelected(type);
    localStorage.setItem('delivery_type', type);
  };

  const handleBillingAddressSelection = (address) => {
    setSelectedBillingAddress(address);
    localStorage.setItem('billing_address', JSON.stringify(address));
  };

  const handleShippingAddressSelection = (address) => {
    setSelectedShippingAddress(address);
    localStorage.setItem('shipping_address', JSON.stringify(address));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const isStepCompleted = (step) => {
    return step < currentStep;
  };

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    return text;
  };

  const handleGstSubmit = () => {
    localStorage.setItem('gst_in', gstNumber);
    setShowGstModal(false);
  };

  const handlePaymentMethodChange = (event) => {
    const method = event.target.value;
    setPaymentMethod(method);
    localStorage.setItem('payment_method', method);
  };

  // Updated: Check coupon usage and apply coupon logic
  const handleApplyCoupon = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setCouponError('You must be logged in to apply a coupon.');
        return;
      }

      // Query to check if the user has already used this coupon
      const couponUsageQuery = query(
        collection(db, 'coupon_usage'),
        where('user_id', '==', user.uid),
        where('coupon_code', '==', couponCode)
      );
      const couponUsageSnapshot = await getDocs(couponUsageQuery);

      if (!couponUsageSnapshot.empty) {
        setCouponError('You have already used this coupon.');
        return;
      }

      // Query to get the coupon details from the coupons collection
      const couponQuery = query(collection(db, 'coupons'), where('code', '==', couponCode));
      const couponSnapshot = await getDocs(couponQuery);

      if (!couponSnapshot.empty) {
        const couponDoc = couponSnapshot.docs[0];
        const couponData = couponDoc.data();
        const today = new Date();

        // Validate coupon status and expiry
        if (couponData.status !== 'active') {
          setCouponError('This coupon is not active.');
          setDiscountAmount(0);
          return;
        }

        if (today < new Date(couponData.startDate) || today > new Date(couponData.expiryDate)) {
          setCouponError('This coupon has expired.');
          setDiscountAmount(0);
          return;
        }

        // Apply coupon logic (discount calculation)
        let discount = 0;
        if (couponData.discountType === 'percentage') {
          discount = (totalPrice * couponData.discountValue) / 100;
        } else if (couponData.discountType === 'fixed') {
          discount = couponData.discountValue;
        }

        // Record the coupon usage for this user in Firestore
        await addDoc(collection(db, 'coupon_usage'), {
          user_id: user.uid,
          coupon_code: couponCode,
          used_on: serverTimestamp(),
        });

        setDiscountAmount(discount);
        setCouponError(null);
        console.log(`Coupon applied. Discount: ₹${discount}`);
      } else {
        setCouponError('Invalid coupon code.');
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('There was an issue applying the coupon. Please try again later.');
      setDiscountAmount(0);
    }
  };

  // Function to generate a unique order ID
  const generateOrderId = () => {
    const timestamp = Date.now().toString(); // Get the current timestamp in milliseconds
    const randomNum = Math.floor(Math.random() * 1000000).toString(); // Generate a random number
    return `ORD-${randomNum}`; // Concatenate with a prefix
  };

  const handlePlaceOrder = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user is logged in');
        return;
      }

      // Generate a unique order ID
      const uniqueOrderId = generateOrderId();

      // Calculate delivery fee based on total price
      const deliveryFee = totalPrice > 499 ? 0 : 150;

      // Prepare the order data, including product details
      const orderProducts = cartProducts.map(product => ({
        product_id: product.product_id || null, // Set to null if undefined
        product_name: product.product_name || 'Unknown Product', // Provide a default value
        product_specification_id: product.product_specification_id || null, // Set to null if undefined
        design_url: product.design_url || '', // Provide a default value
        price: product.price || 0, // Set to 0 if undefined
        quantity: product.quantity || 1, // Provide a default quantity
      }));

      // Retrieve the applied coupon details from local storage
      const appliedCoupon = JSON.parse(localStorage.getItem('applied_coupon'));

      // Prepare human-readable values for order data
      const deliveryTypeReadable = deliverySelected === 'home' ? 'Door Delivery' : 'Store Pickup';
      const paymentMethodReadable = paymentMethod === 'upi' ? 'UPI Payment' : 
                                    paymentMethod === 'card' ? 'Card Payment' : 
                                    paymentMethod === 'wallets' ? 'Wallet Payment' : 
                                    paymentMethod === 'netbanking' ? 'Net Banking' : 'Unknown Payment Method';

      const orderData = {
        order_id: uniqueOrderId, // Add the unique order ID
        cart_id: currentCartId || '',
        delivery_type: deliveryTypeReadable,
        gst_in: gstNumber || '',
        total_amount: totalPrice, // Total before discount
        discount_amount: appliedCoupon ? appliedCoupon.discountAmount : 0, // Store the discount amount
        discount_percentage: appliedCoupon && appliedCoupon.discountType === 'percentage'
          ? appliedCoupon.discountPercentage
          : null, // Store the discount percentage if applicable
        discount_type: appliedCoupon ? appliedCoupon.discountType : null, // Store the discount type
        coupon_code: appliedCoupon ? appliedCoupon.code : null, // Store the coupon code
        final_amount: totalPrice - (appliedCoupon ? appliedCoupon.discountAmount : 0) + deliveryFee, // Final amount after discount and delivery fee
        status: 'Pending',
        payment_method: paymentMethodReadable,
        billing_address_id: selectedBillingAddress?.id || null,
        shipping_address_id: selectedShippingAddress?.id || null,
        user_id: user.uid,
        products: orderProducts,
        created_at: serverTimestamp(),
      };

      const orderDocRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Order placed with ID:', uniqueOrderId);

      // **Add a notification to Firestore**
      await addDoc(collection(db, 'notifications'), {
        content: `Order #${uniqueOrderId} has been placed.`,
        user_id: user.uid,
        order_id: uniqueOrderId,
        time: serverTimestamp(),
        status: 'New',
      });
      console.log('Notification added for new order.');

      if (currentCartId) {
        const cartDocRef = doc(db, 'carts', currentCartId);
        await updateDoc(cartDocRef, {
          checkout_status: true,
        });
        console.log('Cart checkout status updated to true');
      }

      // Clear relevant items from local storage
      localStorage.removeItem('delivery_type');
      localStorage.removeItem('billing_address');
      localStorage.removeItem('shipping_address');
      localStorage.removeItem('payment_method');
      localStorage.removeItem('gst_in');
      localStorage.removeItem('applied_coupon'); // Clear the applied coupon details

      navigate('/', { replace: true });

    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-main-content">
        <div className="checkout-left-section">
          <div className={`accordion-section-step ${currentStep === 1 ? 'active-step' : ''}`}>
            <h3 onClick={() => handleStepClick(1)}>
              <span className={`step-number ${isStepCompleted(1) ? 'completed' : ''}`}>
                {isStepCompleted(1) ? '✓' : '1'}
              </span>
              Delivery
            </h3>
            {currentStep === 1 && (
              <div className="delivery-options">
                <div id="left" className={`delivery-option ${deliverySelected === 'home' ? 'selected' : ''}`} onClick={() => handleDeliverySelection('home')}>
                  <img src="src/assets/homedelivery.png" alt="Home Delivery" />
                  <span className="delivery-label">Door Delivery</span>
                </div>
                <div id="right" className={`delivery-option ${deliverySelected === 'store' ? 'selected' : ''}`} onClick={() => handleDeliverySelection('store')}>
                  <img src="src/assets/Store.png" alt="Store Pickup" />
                  <span className="delivery-label">Store Pickup</span>
                </div>
              </div>
            )}
            {currentStep === 1 && (
              <button className="continue-btn" onClick={handleNextStep} disabled={!deliverySelected}>
                Continue
              </button>
            )}
            {isStepCompleted(1) && (
              <div className="completed-step-info">
                <span>{deliverySelected === 'home' ? 'Door Delivery' : 'Store Pickup'}</span>
              </div>
            )}
          </div>

          <div className={`accordion-section-step ${currentStep >= 2 ? 'active-step' : ''}`}>
            <h3 onClick={() => handleStepClick(2)}>
              <span className={`step-number ${isStepCompleted(2) ? 'completed' : currentStep >= 2 ? 'active' : ''}`}>
                {isStepCompleted(2) ? '✓' : '2'}
              </span>
              Select Address
            </h3>
            {currentStep === 2 && (
              <div className="address-selection-section">
                <div className="address-header">
                  <p>Select Billing Address</p>
                  <button className="new-address-btn" onClick={() => navigate('/add-address')}>+New Address</button>
                </div>
                {loading ? (
                  <p>Loading addresses...</p>
                ) : addresses.length > 0 ? (
                  addresses.map((address) => {
                    const fullAddress = `${address.firstName || ""} ${address.lastName || ""}, ${address.addressLine1 || ""}, ${address.city || ""}, ${address.state || ""}, ${address.zipCode || ""}`;
                    const truncatedAddress = truncateText(fullAddress, 65);
                    return (
                      <div className="checkout-address" key={address.id}>
                        <input
                          type="radio"
                          name="billingAddress"
                          checked={selectedBillingAddress && selectedBillingAddress.id === address.id}
                          onChange={() => handleBillingAddressSelection(address)}
                        />
                        <label title={fullAddress}>{truncatedAddress}</label>
                      </div>
                    );
                  })
                ) : (
                  <p>No addresses found</p>
                )}
                <div className="divider"></div>
                <div className="address-header">
                  <p>Select Shipping Address</p>
                  <button className="new-address-btn" onClick={() => navigate('/add-address')}>+New Address</button>
                </div>
                {loading ? (
                  <p>Loading addresses...</p>
                ) : addresses.length > 0 ? (
                  addresses.map((address) => {
                    const fullAddress = `${address.firstName || ""} ${address.lastName || ""}, ${address.addressLine1 || ""}, ${address.city || ""}, ${address.state || ""}, ${address.zipCode || ""}`;
                    const truncatedAddress = truncateText(fullAddress, 65);
                    return (
                      <div className="checkout-address" key={address.id}>
                        <input
                          type="radio"
                          name="shippingAddress"
                          checked={selectedShippingAddress && selectedShippingAddress.id === address.id}
                          onChange={() => handleShippingAddressSelection(address)}
                        />
                        <label title={fullAddress}>{truncatedAddress}</label>
                      </div>
                    );
                  })
                ) : (
                  <p>No addresses found</p>
                )}
                <button className="use-address-btn" onClick={handleNextStep} disabled={!selectedBillingAddress || !selectedShippingAddress}>
                  Use these Addresses
                </button>
              </div>
            )}
          </div>

          <div className={`accordion-section-step ${currentStep >= 3 ? 'active-step' : ''}`}>
            <h3 onClick={() => handleStepClick(3)}>
              <span className={`step-number ${isStepCompleted(3) ? 'completed' : currentStep >= 3 ? 'active' : ''}`}>
                {isStepCompleted(3) ? '✓' : '3'}
              </span>
              Order Summary
            </h3>
            {currentStep === 3 && (
              <div className="order-summary-section">
                {loading ? (
                  <p>Loading order summary...</p>
                ) : cartProducts.length > 0 ? (
                  cartProducts.map((product) => (
                    <div className="order-item" key={product.id}>
                      <img src={product.productImage || 'https://printo-s3.dietpixels.net/cloudinary/res/dxivtqnri/image/upload/2023/Businesscard/Product-page/Sandwich-business-card/1685031525.jpg?quality=70&format=webp&w=640'} alt={product.product_name} />
                      <div>
                        <h4>{product.product_name}</h4>
                        <p>₹{product.price}</p>
                        <p>Quantity: {product.quantity}</p>
                      </div>
                      <p>Standard Delivery Mon, Aug 12 | ₹75.00</p>
                    </div>
                  ))
                ) : (
                  <p>No products in cart.</p>
                )}
                <button className="save-continue-btn" onClick={handleNextStep}>Save & Continue</button>
              </div>
            )}
          </div>

          <div className={`accordion-section-step ${currentStep >= 4 ? 'active-step' : ''}`}>
            <h3 onClick={() => handleStepClick(4)}>
              <span className={`step-number ${isStepCompleted(4) ? 'completed' : currentStep >= 4 ? 'active' : ''}`}>
                {isStepCompleted(4) ? '✓' : '4'}
              </span>
              Payment
            </h3>
            {currentStep === 4 && (
              <div className="payment-section">
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="upi" 
                    name="paymentMethod" 
                    value="upi" 
                    checked={paymentMethod === 'upi'} 
                    onChange={handlePaymentMethodChange}
                  />
                  <label htmlFor="upi">UPI</label>
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="card" 
                    name="paymentMethod" 
                    value="card" 
                    checked={paymentMethod === 'card'} 
                    onChange={handlePaymentMethodChange}
                  />
                  <label htmlFor="card">Card</label>
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="wallets" 
                    name="paymentMethod" 
                    value="wallets" 
                    checked={paymentMethod === 'wallets'} 
                    onChange={handlePaymentMethodChange}
                  />
                  <label htmlFor="wallets">Wallets</label>
                </div>
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="netbanking" 
                    name="paymentMethod" 
                    value="netbanking" 
                    checked={paymentMethod === 'netbanking'} 
                    onChange={handlePaymentMethodChange}
                  />
                  <label htmlFor="netbanking">Net Banking</label>
                </div>
                <button className="place-order-btn" onClick={handlePlaceOrder} disabled={!paymentMethod}>
                  Place order
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-right-section">
          <div className="gst-section">
            <p>GST Identification number</p>
            <p>Ordering for Business use? <a href="#" onClick={() => setShowGstModal(true)}>Add GSTIN</a></p>
            {showGstModal && (
              <div className="modal">
                <div className="modal-content">
                  <h2>Enter GST Number</h2>
                  <input
                    type="text"
                    placeholder="GSTIN"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="gst-input"
                  />
                  <div className="modal-actions">
                    <button className="modal-submit" onClick={handleGstSubmit}>Submit</button>
                    <button className="modal-close" onClick={() => setShowGstModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="checkout-summary-section">
            <div className="checkout-summary">
              <div className="checkout-summary-header">
                <h3>Summary</h3>
              </div>

              <div className="checkout-summary-details">
                <div className="checkout-summary-item">
                  <span className="checkout-summary-content">
                    <span>Item Subtotal</span>
                    <span style={{ textAlign: 'end' }}>₹{totalPrice}</span> {/* Display total price */}
                  </span>
                  <span className="checkout-summary-content">
                    <span>Discount</span>
                    <span>₹{discountAmount}</span> {/* Display discount amount */}
                  </span>
                  <span className="checkout-summary-content">
                    <span>Delivery Fee</span>
                    <span>₹{totalPrice > 499 ? 0 : 150}</span> {/* Display delivery fee based on total price */}
                  </span>
                </div>
                <div className="checkout-summary-item checkout-total">
                  <span className="checkout-summary-content">
                    <span>Item Total (inclusive of all tax)</span>
                    <span>₹{totalPrice - discountAmount + (totalPrice > 499 ? 0 : 150)}</span> {/* Add delivery fee and subtract discount */}
                  </span>
                </div>
                <div className="checkout-vouchers">
                  <p className="checkout-voucher-info">Have a coupon code?</p>
                  <div className="coupon-section">
                    <input
                      type="text"
                      className="coupon-input"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button className="apply-coupon-btn" onClick={handleApplyCoupon}>Apply Coupon</button>
                  </div>
                  {couponError && <p className="coupon-error">{couponError}</p>}
                </div>
                <button className="order-btn" onClick={handlePlaceOrder} disabled={!paymentMethod}>
                  Place order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sample-request-section">
        <h2>Request Your Free Printing Sample!</h2>
        <p>See, Touch, and Feel the Excellence of Printshop.</p>
        <button className="request-btn">Request Now!</button>
      </div>
    </div>
  );
};

export default CheckoutPage;
