import React, { useState, useEffect } from 'react';
import { getDocs, collection, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import '../styles/OrdersPage.css';

const OrdersPage = () => {
  const [visibleOrderId, setVisibleOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [userName, setUserName] = useState('');
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const toggleOrderDetails = (orderId) => {
    setVisibleOrderId(visibleOrderId === orderId ? null : orderId);
  };

  const fetchUserName = async (userId) => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUserName(userData.firstName || userData.displayName || 'User');
    }
  };

  const fetchProductImage = async (productId) => {
    try {
      const productDocRef = doc(db, 'productData', productId);
      const productDoc = await getDoc(productDocRef);
      if (productDoc.exists()) {
        const productData = productDoc.data();
        return productData.product_images ? productData.product_images[0] : null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product image:', error);
      return null;
    }
  };

  const fetchOrders = async (userId) => {
    try {
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, where('user_id', '==', userId));
      const ordersSnapshot = await getDocs(q);
      const ordersData = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const order = { id: doc.id, ...doc.data() };
          const productsWithImages = await Promise.all(
            order.products.map(async (product) => {
              const productImage = await fetchProductImage(product.product_id);
              return { ...product, product_image: productImage };
            })
          );
          return { ...order, products: productsWithImages };
        })
      );
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filterOrdersByDate = () => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const filtered = orders.filter(order => {
      const orderDate = order.created_at?.seconds ? new Date(order.created_at.seconds * 1000) : null;
      if (from && to) {
        return orderDate >= from && orderDate <= to;
      } else if (from) {
    console.log('from:', from);
    console.log('to:', to);

        return orderDate >= from;
      } else if (to) {
      console.log('orderDate:', orderDate);

        return orderDate <= to;
        console.log('Filtering by both from and to');
      } else {
        return true;
        console.log('Filtering by from');
      }
    });
        console.log('Filtering by to');

    setFilteredOrders(filtered);
        console.log('No date filter');
  };

  const confirmCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    console.log('filtered:', filtered);

    setShowCancelPopup(true);
  };

  const cancelOrder = async () => {
    if (orderToCancel && cancellationReason) {
      try {
        const orderDocRef = doc(db, 'orders', orderToCancel);
        await updateDoc(orderDocRef, { status: 'Cancelled', cancellation_reason: cancellationReason });
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderToCancel ? { ...order, status: 'Cancelled' } : order
          )
        );
        setFilteredOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderToCancel ? { ...order, status: 'Cancelled' } : order
          )
        );
      } catch (error) {
        console.error('Error updating document:', error);
      } finally {
        setShowCancelPopup(false);
        setOrderToCancel(null);
        setCancellationReason('');
      }
    }
  };

  const closePopup = () => {
    setShowCancelPopup(false);
    setOrderToCancel(null);
    setCancellationReason('');
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserName(user.uid);
        fetchOrders(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-header">
        <div className="date-filter">
          <label>
            From:
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            To:
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button onClick={filterOrdersByDate}>Filter</button>
        </div>
        <div>
          <span>{filteredOrders.length} order(s) found</span>
        </div>
      </div>

      {filteredOrders.map((order) => (
        <div key={order.id} className="order-summary-container">
          <div className="order-details">
            <div className="order-id">
              <span>ORDER # {order.order_id || order.id}</span>
            </div>
            <div className="order-header">
              <span className="order-date">ORDER PLACED</span>
              <span className="order-date-value">
                {order.created_at?.seconds
                  ? new Date(order.created_at.seconds * 1000).toLocaleDateString()
                  : 'Date not available'}
              </span>
            </div>
            <div className="order-header">
              <span className="order-total">TOTAL</span>
              <span className="order-total-value">₹{order.total_amount.toFixed(2)}</span>
            </div>
            <div className="order-header">
              <span className="order-ship-to">SHIP TO</span>
              <span className="order-ship-to-value">{userName}</span>
            </div>
            <div className="order-header">
              <span className="order-status">ORDER STATUS</span>
              <span className="order-status-value">{order.status}</span>
            </div>
            <div className="order-header">
              <div className="order-actions">
                <button onClick={() => toggleOrderDetails(order.id)}>
                  {visibleOrderId === order.id ? 'Hide order details' : 'View order details'}
                </button>
                {order.status !== 'Cancelled' && (
                  <button className="cancel-btn" onClick={() => confirmCancelOrder(order.id)}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>

          {visibleOrderId === order.id && (
            <div className="order-items">
              {order.products.map((product, index) => (
                <div key={index} className="od-order-item">
                  <div className="order-item-image">
                    <img
                      src={
                        product.product_image ||
                        'https://printo-s3.dietpixels.net/site/20230704_133220599691_2fac88_Business-cards.jpg?quality=70&format=webp&w=320'
                      }
                      alt={product.product_name}
                    />
                  </div>
                  <div className="order-item-details">
                    <div className="order-item-name">
                      <span>{product.product_name}</span>
                    </div>
                    <div className="order-item-quantity">
                      <span className="order-total">QUANTITY</span>
                      <span className="order-total-value">{product.quantity}</span>
                    </div>
                    <div className="order-item-price">
                      <span className="order-total">TOTAL</span>
                      <span className="order-total-value">₹{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="order-actions">
                {order.status !== 'Cancelled' && order.status !== 'Shipped' && (
                  <button className="track-btn">Track Package</button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {showCancelPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Are you sure you want to cancel the order?</h3>
            <label>
              Reason for cancellation:
              <select value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)}>
                <option value="">Select Cancellation Reason</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found a better price">Found a better price</option>
                <option value="Product not needed">Product not needed</option>
              </select>
            </label>
            <div className="popup-actions">
              <button className="popup-cancel-btn" onClick={closePopup}>No</button>
              <button className="popup-confirm-btn" onClick={cancelOrder} disabled={!cancellationReason}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
