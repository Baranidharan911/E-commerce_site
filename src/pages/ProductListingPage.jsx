import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/ProductListingPage.css';

const ProductCard = ({ image, title, price, productId }) => {
  return (
    <Link to={`/product/${productId}`} className="product-card">
      <div className="prod-img-div">
        <img src={image} alt={title} className="product-image" />
      </div>
      <h3 className="product-title">{title}</h3>
      <p className="product-price"><strong>₹{price}</strong> for 1 {title}</p>
    </Link>
  );
};

const ProductSection = ({ sectionTitle, description, products }) => {
  return (
    <div className="product-section">
      <h2 className="pc-section-title">{sectionTitle}</h2>
      {description && <h6 className="pc-section-description">{description}</h6>}
      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard
            key={index}
            image={product.product_images[0]}
            title={product.product_name}
            price={product.price}
            productId={product.product_id} // Add productId to pass to the ProductCard
          />
        ))}
      </div>
    </div>
  );
};

const ProductListingPage = () => {
  const { categoryName } = useParams();
  const [categoryDisplayName, setCategoryDisplayName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // Fetch the category document based on the categoryName
        const categoryQuery = query(collection(db, 'categories'), where('category_id', '==', categoryName));
        const categorySnapshot = await getDocs(categoryQuery);

        if (!categorySnapshot.empty) {
          const categoryDoc = categorySnapshot.docs[0];
          const categoryData = categoryDoc.data();

          setCategoryDisplayName(categoryData.category_name || 'Unknown Category');

          // Fetch products associated with this category_id
          const productsQuery = query(collection(db, 'productData'), where('category_id', '==', categoryDoc.id));
          const productsSnapshot = await getDocs(productsQuery);
          const fetchedProducts = productsSnapshot.docs.map(doc => ({ ...doc.data(), product_id: doc.id }));

          setProducts(fetchedProducts);
        } else {
          setCategoryDisplayName('Unknown Category');
        }
      } catch (error) {
        console.error('Error fetching category and products:', error);
        setCategoryDisplayName('Unknown Category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryName]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-listing-page">
      <div className="pd-breadcrumbs">
        <span>Home / {categoryDisplayName}</span>
      </div>
      <ProductSection 
        sectionTitle={categoryDisplayName} 
        description={`Explore our collection of ${categoryDisplayName}.`} 
        products={products} 
      />
    </div>
  );
};

export default ProductListingPage;
