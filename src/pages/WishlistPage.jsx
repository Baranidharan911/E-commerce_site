import React, { useState, useEffect } from 'react';
import '../styles/WishlistPage.css'; // Ensure this file exists with proper styling
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig'; // Adjust the import according to your Firebase setup
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // State for filtered items
  const [userId, setUserId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // State to control filter modal visibility
  const [filterCategory, setFilterCategory] = useState(''); // State to store the filter category
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlistItems = async (user) => {
      try {
        // Step 1: Get the wishlist for the current user
        const wishlistQuery = query(
          collection(db, 'wishlists'),
          where('user_id', '==', user.uid)
        );
        const wishlistSnapshot = await getDocs(wishlistQuery);

        if (!wishlistSnapshot.empty) {
          const wishlistDoc = wishlistSnapshot.docs[0];
          const wishlistId = wishlistDoc.id;

          // Step 2: Get all products in the user's wishlist
          const wishlistProductsQuery = query(
            collection(db, 'wishlistProducts'),
            where('wishlist_id', '==', wishlistId)
          );
          const wishlistProductsSnapshot = await getDocs(wishlistProductsQuery);

          const wishlistData = await Promise.all(
            wishlistProductsSnapshot.docs.map(async (wishlistProductDoc) => {
              const wishlistProduct = wishlistProductDoc.data();

              // Fetch product details
              const productRef = doc(db, 'products', wishlistProduct.product_id);
              const productDoc = await getDoc(productRef);
              const productData = productDoc.exists() ? productDoc.data() : {};

              // Fetch product specification details
              const specRef = doc(db, 'productSpecifications', wishlistProduct.product_specification_id);
              const specDoc = await getDoc(specRef);
              const specData = specDoc.exists() ? specDoc.data() : {};

              // Fetch category name from categories collection
              let categoryName = 'Uncategorized';
              if (productData.category_id) {
                const categoryRef = doc(db, 'categories', productData.category_id);
                const categoryDoc = await getDoc(categoryRef);
                categoryName = categoryDoc.exists() ? categoryDoc.data().category_name : categoryName;
              }

              return {
                id: wishlistProductDoc.id,
                product_name: productData.product_name || 'Unknown Product',
                category: categoryName,
                quantity: specData.quantity || 0,
                savedDate: wishlistProduct.created_at ? wishlistProduct.created_at.toDate().toDateString() : 'nil',
                productImage: productData.product_images ? productData.product_images[0] : '', // Use the first image if available
                price: productData.price || 0, // Assuming price is stored in productData
                product_id: wishlistProduct.product_id,
                product_specification_id: wishlistProduct.product_specification_id,
              };
            })
          );

          setWishlistItems(wishlistData);
          setFilteredItems(wishlistData); // Initialize filteredItems with all wishlist data
        } else {
          console.log('No wishlist found for this user.');
          setWishlistItems([]); // Ensure wishlistItems is set to an empty array
        }
      } catch (error) {
        console.error('Error fetching wishlist items: ', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set the user ID in the state
        fetchWishlistItems(user);
      } else {
        console.log('No user is signed in.');
        setWishlistItems([]); // Clear the wishlist if no user is signed in
      }
    });

    return () => unsubscribe(); // Cleanup the subscription on component unmount
  }, []);

  const handleAddToCart = async (item) => {
    try {
      // Step 1: Check if the user already has an active cart
      const cartQuery = query(
        collection(db, 'carts'),
        where('user_id', '==', userId),
        where('checkout_status', '==', false),
        limit(1) // Correct use of limit
      );
      const cartSnapshot = await getDocs(cartQuery);

      let cartId;

      if (cartSnapshot.empty) {
        // Create a new cart if none exists
        const cartDocRef = await addDoc(collection(db, 'carts'), {
          user_id: userId,
          checkout_status: false,
          created_at: serverTimestamp(),
        });
        cartId = cartDocRef.id;
      } else {
        // Use the existing cart ID
        cartId = cartSnapshot.docs[0].id;
      }

      // Step 2: Calculate the total price (quantity * price)
      const totalPrice = item.quantity * item.price;

      // Step 3: Add the product to the cartProducts collection
      await addDoc(collection(db, 'cartProducts'), {
        cart_id: cartId,
        created_at: serverTimestamp(),
        price: totalPrice, // Use calculated total price
        product_id: item.product_id,
        product_specification_id: item.product_specification_id,
      });

      // Step 4: Remove the product from the wishlistProducts collection
      await deleteDoc(doc(db, 'wishlistProducts', item.id));

      // Update local state to remove the item from the displayed list
      setWishlistItems((prevItems) => prevItems.filter((wishItem) => wishItem.id !== item.id));
      setFilteredItems((prevItems) => prevItems.filter((wishItem) => wishItem.id !== item.id));

      console.log(`Product ${item.product_name} added to cart and removed from wishlist.`);
    } catch (error) {
      console.error('Error adding product to cart: ', error);
    }
  };

  const handleFilter = () => {
    if (filterCategory.trim() !== '') {
      const filtered = wishlistItems.filter((item) =>
        item.category.toLowerCase().includes(filterCategory.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(wishlistItems); // Reset to all items if filter is cleared
    }
    setIsFilterModalOpen(false); // Close the filter modal after applying filter
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-page">
        <h1 className="wishlist-title">
          Wishlist
          <span
            className="wishlist-filter-icon"
            onClick={() => setIsFilterModalOpen(true)} // Open filter modal
          >
            <img src="/src/assets/filter-icon.svg" alt="Filter Icon" />
          </span>
        </h1>

        {wishlistItems.length === 0 && <p>No items in wishlist available.</p>} {/* Display message if wishlist is empty */}
        {filteredItems.length === 0 && wishlistItems.length > 0 && (
          <p>No Products Found.</p>
        )} {/* Display message if filter results are empty */}

        {filteredItems.map((item) => (
          <div key={item.id} className="wishlist-item">
            <div className="wishlist-item-header">
              <span className="wishlist-item-title">{item.product_name}</span>
              <span className="wishlist-product-info">Product info</span>
            </div>
            <div className="wishlist-item-details">
              <div className="wishlist-item-image">
                <img
                  src={item.productImage || 'https://printo-s3.dietpixels.net/site/20230523_151926980087_a63a61_Sandwich-business-card.jpg?quality=70&format=webp&w=200'} // Provide a default image path
                  alt={item.product_name}
                />
              </div>
              <div className="wishlist-item-info">
                <div className="wishlist-item-quantity">
                  <span>Quantity</span>
                  <span>{item.quantity}</span>
                </div>
                <div className="wishlist-item-saved-date">
                  <span>Saved in</span>
                  <span>{item.savedDate}</span>
                </div>
              </div>
              <div className="wishlist-item-actions">
                <button
                  className="wishlist-review-add-button"
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="wishlist-pagination">
          <button className="wishlist-prev-button" disabled>
            Prev
          </button>
          <span className="wishlist-page-number">1</span>
          <button className="wishlist-next-button">Next</button>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="filter-modal">
          <div className="filter-modal-content">
            <h2>Filter by Category</h2>
            <input
              type="text"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              placeholder="Enter category"
            />
            <button onClick={handleFilter}>Apply Filter</button>
            <button onClick={() => setIsFilterModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
