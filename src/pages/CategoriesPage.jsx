import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "../firebaseConfig";
import { useNavigate } from 'react-router-dom';
import '../styles/CategoriesPage.css';

export default function CategoryListingPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(""); // Track selected category
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const categoryCollection = collection(db, 'categories');
      const categorySnapshot = await getDocs(categoryCollection);
      const categoryList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().category_name,
      }));
      setCategories(categoryList);
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = async (categoryId) => {
    setLoading(true);
    setSelectedCategoryId(categoryId); // Update the selected category ID
    const selectedCategory = categories.find(category => category.id === categoryId);
    setSelectedCategoryName(selectedCategory.name);

    const fetchProducts = async () => {
      const productCollection = collection(db, 'products');
      const q = query(productCollection, where('category_id', '==', categoryId));
      const productSnapshot = await getDocs(q);
      const productList = productSnapshot.docs.map(doc => ({
        docId: doc.id,  // Store the document ID
        ...doc.data(),
      }));
      setProducts(productList);
      setLoading(false);
    };

    fetchProducts();
  };

  const handleProductClick = (docId) => {
    const categoryName = selectedCategoryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/${categoryName}/${docId}`);
  };

  return (
    <div className="category-listing-page">
      <div className="sidebar">
        <ul className="sidebar-list">
          {categories.length > 0 ? (
            categories.map((category) => (
              <li 
                key={category.id} 
                className={`sidebar-item ${selectedCategoryId === category.id ? 'active' : ''}`} // Conditionally apply 'active' class
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </li>
            ))
          ) : (
            <li className="sidebar-item">Loading...</li>
          )}
        </ul>
      </div>

      <div className="category-products-content">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="category-products-list">
            <h2>Explore the products</h2>
            {selectedCategoryId === "" ? (
              <p>Select a category</p>
            ) : products.length > 0 ? (
              <div className="category-products-grid">
                {products.map((product, index) => (
                  <li 
                    key={index} 
                    className="category-product-item" 
                    onClick={() => handleProductClick(product.docId)} // Pass function reference
                  >
                    {product.product_name}
                  </li>
                ))}
              </div>
            ) : (
              <p>No products available for this category.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
