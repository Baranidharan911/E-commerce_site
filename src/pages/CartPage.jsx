import React, { useState, useEffect, useContext } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, getDoc, updateDoc, limit } from 'firebase/firestore'; // Ensure updateDoc is imported here
import { extractSpecificationDetails } from '../components/Utils';
import EmptyCart from '../components/EmptyCart';
import '../styles/CartPage.css';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { SummaryContext } from '../context/SummaryContext';
import { useCart } from '../context/CartContext';

export default function CartPage() {
    const { cartCount, decrementCartCount } = useCart();
    const { resetSummaryData } = useContext(SummaryContext);
    const [cartProducts, setCartProducts] = useState([]);
    const [specVisibility, setSpecVisibility] = useState({});
    const [cartId, setCartId] = useState(null);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Hook to get location state

    useEffect(() => {
        resetSummaryData();
    }, []);

    useEffect(() => {
        const fetchUserAndCart = async (user) => {
            setUserId(user.uid);

            const cartQuery = query(
                collection(db, 'carts'),
                where('user_id', '==', user.uid),
                where('checkout_status', '==', false),
                limit(1)
            );
            const cartSnapshot = await getDocs(cartQuery);

            if (!cartSnapshot.empty) {
                const cartDoc = cartSnapshot.docs[0];
                setCartId(cartDoc.id);

                const cartProductsQuery = query(
                    collection(db, 'cartProducts'),
                    where('cart_id', '==', cartDoc.id)
                );
                const cartProductsSnapshot = await getDocs(cartProductsQuery);

                const productsWithDetails = await Promise.all(
                    cartProductsSnapshot.docs.map(async (productDoc) => {
                        const productData = productDoc.data();

                        // Fetch product details from products collection
                        const productRef = doc(db, 'productData', productData.product_id);
                        const productSnapshot = await getDoc(productRef);
                        const productInfo = productSnapshot.exists() ? productSnapshot.data() : {};

                        // Fetch product specifications using product_specification_id
                        const specRef = doc(db, 'productSpecifications', productData.product_specification_id);
                        const specSnapshot = await getDoc(specRef);
                        const specInfo = specSnapshot.exists() ? specSnapshot.data() : {};

                        // Use the utility function to extract specification details
                        const specificationDetails = extractSpecificationDetails(specInfo);

                        return {
                            id: productDoc.id,
                            ...productData,
                            product_name: productInfo.product_name || 'Unknown Product',
                            price: productData.price, // Use the price from the cartProducts collection
                            specifications: specificationDetails || {}, // Include selected specification details or fallback to empty
                            productImage: productInfo.product_images ? productInfo.product_images[0] : '', // Use the first image if available
                        };
                    })
                );

                setCartProducts(productsWithDetails);
            } else {
                setCartProducts([]); // Clear the cart if no active cart is found
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserAndCart(user);
            } else {
                setCartProducts([]); // Clear the cart if no user is signed in
            }
        });

        return () => unsubscribe(); // Cleanup the subscription on component unmount
    }, []);

    // Detect if user is returning from customization page
    useEffect(() => {
        if (location.state && location.state.customizedProductId) {
            // Call the function to handle the updated product
            handleCustomizationUpdate(location.state.customizedProductId);
        }
    }, [location.state]); // Runs when location state changes

    const toggleSpecVisibility = (productId) => {
        setSpecVisibility(prevState => ({
            ...prevState,
            [productId]: !prevState[productId]
        }));
    };

    const handleRemoveItem = async (productId) => {
        try {
            await deleteDoc(doc(db, 'cartProducts', productId));
            setCartProducts(cartProducts.filter(product => product.id !== productId));
            decrementCartCount();
        } catch (error) {
            console.error('Error removing product: ', error);
        }
    };

    const handleSaveForLater = async (product) => {
        try {
            let wishlistId;
            const wishlistQuery = query(
                collection(db, 'wishlists'),
                where('user_id', '==', userId),
                limit(1)
            );
            const wishlistSnapshot = await getDocs(wishlistQuery);

            if (wishlistSnapshot.empty) {
                const wishlistDoc = await addDoc(collection(db, 'wishlists'), {
                    user_id: userId,
                    created_at: new Date(),
                });
                wishlistId = wishlistDoc.id;
            } else {
                wishlistId = wishlistSnapshot.docs[0].id;
            }

            await addDoc(collection(db, 'wishlistProducts'), {
                wishlist_id: wishlistId,
                product_id: product.product_id,
                price: product.price,
                product_specification_id: product.product_specification_id,
                created_at: product.created_at,
            });

            await handleRemoveItem(product.id);
            decrementCartCount();
            console.log(`Product ${product.product_name} saved for later.`);
        } catch (error) {
            console.error('Error saving product for later: ', error);
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const handleEditDetailsClick = async (product) => {
        const { id: cartProductId, product_id: productId } = product;

        const productRef = doc(db, 'products', productId);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
            const productData = productDoc.data();
            const categoryId = productData.category_id;

            navigate(`/${cartProductId}/customize/${categoryId}/${productId}`);
        } else {
            console.error("Product not found");
        }
    };

    // New function to handle updates from cart customization page
    const handleCustomizationUpdate = async (cartProductId) => {
        try {
            const cartProductRef = doc(db, 'cartProducts', cartProductId);
            const cartProductSnapshot = await getDoc(cartProductRef);

            if (cartProductSnapshot.exists()) {
                const cartProductData = cartProductSnapshot.data();
                
                // Ensure specifications don't contain undefined values
                const sanitizedSpecifications = Object.fromEntries(
                    Object.entries(cartProductData.specifications || {}).filter(([key, value]) => value !== undefined)
                );

                const updatedCartProducts = cartProducts.map(product => 
                    product.id === cartProductId ? {
                        ...product,
                        quantity: cartProductData.quantity,
                        price: cartProductData.total_price,
                        specifications: sanitizedSpecifications,  // Use sanitized specifications
                    } : product
                );

                // Update Firestore with sanitized data
                await updateDoc(cartProductRef, {
                    quantity: cartProductData.quantity,
                    total_price: cartProductData.total_price,
                    specifications: sanitizedSpecifications // Ensure no undefined values
                });

                setCartProducts(updatedCartProducts);
            }
        } catch (error) {
            console.error('Error updating cart with customization changes:', error);
        }
    };

    const renderSpecificationRows = (specifications) => {
        return Object.entries(specifications).map(([key, value]) => {
            if (value && key !== 'quantity') {
                return (
                    <tr key={key}>
                        <td>{key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                        <td className="data">{value}</td>
                    </tr>
                );
            }
            return null;
        });
    };

    return (
        <div className="cart-container">
            {cartProducts.length === 0 ? (
                <EmptyCart />
            ) : (
                <div className="cart-section">
                    <h1>Shopping Cart</h1>
                    <div className="cart">
                        <div className="cart-items">
                            <div className="cart-header">
                                <span>All Jobs - {cartProducts.length} items</span>
                            </div>
                            {cartProducts.map((product) => (
                                <div key={product.id} className="cart-item">
                                    <div className="item-image">
                                        {product.productImage ? (
                                            <img src={product.productImage} alt={product.product_name} />
                                        ) : (
                                            <img src="https://printo-s3.dietpixels.net/site/20230525_214117185034_f58907_Spot-UV.jpg?quality=70&format=webp&w=1920" alt={product.product_name} />
                                        )}
                                    </div>
                                    <div className="item-details">
                                        <div className="item-header">
                                            <span className="item-title">{product.product_name}</span>
                                            <div className="save-remove">
                                                <span className="save-later" onClick={() => handleSaveForLater(product)}>Save for later</span>
                                                <span className="remove-item" onClick={() => handleRemoveItem(product.id)}>🗑️</span>
                                            </div>
                                        </div>
                                        <div className="item-quantity">
                                            <span>Quantity: {product.specifications.quantity}</span>
                                        </div>
                                        <div className="edit-details">
                                            <span onClick={() => handleEditDetailsClick(product)}>Edit Details</span>
                                        </div>
                                        <div className="product-specifications">
                                            <div className="product-specification-details">
                                                <span>Product Specifications</span>

                                                {specVisibility[product.id] && (
                                                    <table className="cart-product-details-table">
                                                        <tbody>
                                                            {renderSpecificationRows(product.specifications)}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                            <button onClick={() => toggleSpecVisibility(product.id)} className="toggle-specs-btn">
                                                {specVisibility[product.id] ? '►' : '▼'}
                                            </button>
                                        </div>
                                        <div className="item-total">
                                            <span>Item Total</span>
                                            <span className="total-price">₹{product.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="summary-section">
                            <div className="cart-summary">
                                <div className="summary-header">
                                    <span>Summary</span>
                                </div>
                                <div className="summary-details">
                                    <div className="summary-item">
                                        <span>Item Subtotal</span>
                                        <span style={{ textAlign: 'end' }}>₹{cartProducts.reduce((total, product) => total + product.price, 0).toFixed(2)}</span>
                                    </div>
                                    <div className="summary-item total">
                                        <span>Item Total (inclusive of all tax)</span>
                                        <span style={{ textAlign: 'end' }}>₹{cartProducts.reduce((total, product) => total + product.price, 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="vouchers">
                                    <span>Vouchers are now moved to checkout</span>
                                </div>
                            </div>
                            <button className="checkout-button" onClick={handleCheckout}>Continue to Checkout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
