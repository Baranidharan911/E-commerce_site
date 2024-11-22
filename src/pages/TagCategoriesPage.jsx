import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import '../styles/TagCategoriesPage.css';

const ProductCard = ({ id, image, title, price }) => {
  return (
    <Link to={`/product/${id}`} className="product-link">
      <div className="product-card">
        <div className="prod-img-div">
          <img src={image} alt={title} className="product-image" />
        </div>
        <h3 className="product-title">{title}</h3>
        <p className="product-price"><strong>₹{price}</strong>  for  1  {title}</p>
      </div>
    </Link>
  );
};

const ProductSection = ({ sectionTitle, products }) => {
  return (
    <div className="product-section">
      <h2 className="tc-section-title">{sectionTitle}</h2>
      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard 
            key={index} 
            id={product.id} // Pass product ID to the ProductCard
            image={product.product_images[0]} 
            title={product.product_name} 
            price={product.price} 
          />
        ))}
      </div>
    </div>
  );
};

const TagCategoriesPage = () => {
  const { tagId } = useParams();
  const [tagDisplayName, setTagDisplayName] = useState('');
  const [categorySections, setCategorySections] = useState([]);

  useEffect(() => {
    const fetchCategorySections = async () => {
      try {
        // Fetch the hashTag document based on the tagId
        const hashTagDocRef = doc(db, 'hashTags', tagId);
        const hashTagDoc = await getDoc(hashTagDocRef);

        if (hashTagDoc.exists()) {
          const hashTagData = hashTagDoc.data();
          setTagDisplayName(hashTagData.tag_name || 'Unknown Tag Category');

          // Fetch each category's data and associated products
          const categoryPromises = hashTagData.category_ids.map(async (categoryId) => {
            const categoryDocRef = doc(db, 'categories', categoryId);
            const categoryDoc = await getDoc(categoryDocRef);

            if (categoryDoc.exists()) {
              const categoryData = categoryDoc.data();

              // Fetch products associated with this category_id
              const productsQuery = query(collection(db, 'productData'), where('category_id', '==', categoryId));
              const productsSnapshot = await getDocs(productsQuery);
              const products = productsSnapshot.docs.map((doc) => ({
                id: doc.id, // Include product ID in the product data
                ...doc.data(),
              }));

              return {
                categoryName: categoryData.category_name,
                products: products,
              };
            }
            return null;
          });

          const fetchedCategories = await Promise.all(categoryPromises);
          setCategorySections(fetchedCategories.filter((section) => section !== null));
        }
      } catch (error) {
        console.error('Error fetching categories and products:', error);
      }
    };

    fetchCategorySections();
  }, [tagId]);

  return (
    <div className="tag-categories-page">
      <div className="pd-breadcrumbs">
        <span>Home / {tagDisplayName}</span>
      </div>
      {categorySections.map((section, index) => (
        <ProductSection 
          key={index} 
          sectionTitle={section.categoryName} 
          products={section.products} 
        />
      ))}
    </div>
  );
};

export default TagCategoriesPage;
