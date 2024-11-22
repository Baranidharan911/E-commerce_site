import React from 'react';
import { useNavigate } from 'react-router-dom';
import NoOrdersIcon from '../assets/no-orders.png';
import '../styles/NoOrdersPage.css';

export default function OrdersPage() {
    const navigate = useNavigate(); // Initialize useNavigate

    const handleBrowseProductsClick = () => {
        navigate('/categories'); // Navigate to the category page
    };

    return (
        <div className="no-orders-container">
            <div className="no-orders-icon">
                <img src={NoOrdersIcon} alt="No Orders" />
            </div>
            <p className="no-orders-message">You have no orders placed at the moment</p>
            <button className="browse-products-button" onClick={handleBrowseProductsClick}>
                Browse all products
            </button>
        </div>
    );
}
