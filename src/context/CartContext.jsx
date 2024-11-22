import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch the user's cart where checkout_status = false
        const cartQuery = query(
          collection(db, 'carts'),
          where('user_id', '==', user.uid),
          where('checkout_status', '==', false)
        );
        const cartSnapshot = await getDocs(cartQuery);

        if (!cartSnapshot.empty) {
          const cartId = cartSnapshot.docs[0].id; // Get the current cart id
          const cartProductsQuery = query(collection(db, 'cartProducts'), where('cart_id', '==', cartId));

          // Listen to real-time updates in the cartProducts collection
          const unsubscribeCart = onSnapshot(cartProductsQuery, (snapshot) => {
            setCartCount(snapshot.size);
          });

          return () => unsubscribeCart(); // Cleanup listener when component unmounts or user logs out
        } else {
          setCartCount(0); // If no cart found, set cart count to 0
        }
      } else {
        setCartCount(0); // Reset cart count on logout
      }
    });

    return () => unsubscribeAuth(); // Cleanup listener when component unmounts
  }, []);

  const incrementCartCount = () => {
    setCartCount((prevCount) => prevCount + 1);
  };

  const decrementCartCount = () => {
    setCartCount((prevCount) => (prevCount > 0 ? prevCount - 1 : 0));
  };

  const resetCartCount = () =>{
    setCartCount((prevCount) => (prevCount != 0 ? 0 : 0));
  };


  return (
    <CartContext.Provider value={{ cartCount, resetCartCount ,incrementCartCount, decrementCartCount  }}>
      {children}
    </CartContext.Provider>
  );
};
