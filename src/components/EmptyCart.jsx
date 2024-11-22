import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyCartIcon from '../assets/empty_cart.svg';
import '../styles/EmptyCart.css';

export default function EmptyCart() {
    const navigate = useNavigate(); // Initialize useNavigate

    const handleBrowseProductsClick = () => {
        navigate('/categories'); // Navigate to the category page
    };

    return (
        <div className="empty-cart-container">
            <div className="cart-icon">
                <img src={EmptyCartIcon} alt="Empty Cart" />
            </div>
            <p className="empty-cart-message">Your cart is empty at the moment</p>
            <button className="browse-products-button" onClick={handleBrowseProductsClick}>
                Browse all products
            </button>
        </div>
    );
}
