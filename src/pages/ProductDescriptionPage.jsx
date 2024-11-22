import React, { useState, useRef, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, getDocs, limit, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import '../styles/ProductDescriptionPage.css';
import { SummaryContext } from '../context/SummaryContext';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { updateSummaryData, resetSummaryData } = useContext(SummaryContext); 
  const [product, setProduct] = useState(null);
  const [categoryDisplayName, setCategoryDisplayName] = useState('');
  const [thumbnails, setThumbnails] = useState([]);
  const [mainImage, setMainImage] = useState('');
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productRequirements, setProductRequirements] = useState({});
  const [validationError, setValidationError] = useState('');
  const [productDescriptions, setProductDescriptions] = useState({
    description: '',
    overview: [],
    options: [],
    designs: []
  });
  const [selectedTab, setSelectedTab] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [similarProducts, setSimilarProducts] = useState([]); // For dynamic similar products
  const [recommendedProducts, setRecommendedProducts] = useState([]); // For dynamic recommended products
  const thumbnailContainerRef = useRef(null);
  const navigate = useNavigate();
  const [selectedValues, setSelectedValues] = useState({});

  useEffect(() => {
    resetSummaryData();
    fetchProductData();
  }, [productId]);

  // Fetch the current product data
  const fetchProductData = async () => {
    try {
      const productDocRef = doc(db, "productData", productId);
      const productDoc = await getDoc(productDocRef);

      if (productDoc.exists()) {
        const productData = productDoc.data();
        setProduct(productData);

        const productPriceAfterDiscount = productData.price || 0;
        const productDiscount = productData.discount || 0;
        setDiscount(productDiscount);

        const originalPrice = productDiscount > 0 
          ? productPriceAfterDiscount / (1 - (productDiscount / 100))
          : productPriceAfterDiscount;

        setProduct(prevState => ({
          ...prevState,
          originalPrice,
          price: productPriceAfterDiscount
        }));

        setProductDescriptions({
          description: productData.description || '',
          overview: productData.overviews || [],
          options: productData.options || [],
          designs: productData.designs || []
        });

        setThumbnails(productData.product_images || []);
        setMainImage(productData.product_images[0] || '');

        // Fetch similar and recommended products
        fetchSimilarProducts(productData.category_id);
        fetchRecommendedProducts();

        const requirementsData = productData.product_requirements;
        if (requirementsData) {
          setProductRequirements(requirementsData);
        }
      } else {
        setError("No such product document!");
      }
    } catch (err) {
      setError("Error getting document: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 1 to 2 random products first and then fetch category-specific products
  const fetchSimilarProducts = async (categoryId) => {
    try {
      // First, fetch 2 random products regardless of category
      const randomProductsQuery = query(
        collection(db, "productData"),
        limit(2) // Fetch 2 random products
      );
      const randomQuerySnapshot = await getDocs(randomProductsQuery);
      const randomProductsArray = randomQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Then, fetch products from the same category, excluding the current product and random products fetched above
      const categoryProductsQuery = query(
        collection(db, "productData"),
        where("category_id", "==", categoryId),
        limit(3) // Adjust this limit as needed for category-specific products
      );
      const categoryQuerySnapshot = await getDocs(categoryProductsQuery);
      const categoryProductsArray = categoryQuerySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => !randomProductsArray.some(randomProduct => randomProduct.id === product.id)); // Filter out duplicates from random products

      // Combine random products and category-specific products into one array
      const combinedProducts = [...randomProductsArray, ...categoryProductsArray];
      setSimilarProducts(combinedProducts);
    } catch (error) {
      console.error("Error fetching similar products: ", error);
    }
  };

  // Fetch 4 to 5 random products for "You Might Be Interested In" section
  const fetchRecommendedProducts = async () => {
    try {
      const recommendedProductsQuery = query(
        collection(db, "productData"),
        limit(5) // Fetch 4 to 5 random products
      );
      const querySnapshot = await getDocs(recommendedProductsQuery);
      const recommendedProductsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecommendedProducts(recommendedProductsArray);
    } catch (error) {
      console.error("Error fetching recommended products: ", error);
    }
  };

  // Navigate to a product's detail page
  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const handleThumbnailClick = (thumbnail, index) => {
    setMainImage(thumbnail);
    setSelectedThumbnail(index);
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbnailContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  

  const handleChange = (field, value) => {
    setSelectedValues(prevValues => ({
      ...prevValues,
      [field]: value
    }));
  };

  const handleUploadClick = () => {
    const requiredFields = Object.keys(productRequirements).filter(
      field => Array.isArray(productRequirements[field]) && productRequirements[field].length > 0
    ); 

    if (productRequirements.quantity) {
      requiredFields.push('quantity');
    } 
    
    const missingFields = requiredFields.filter(field => !selectedValues[field]);
    
    if (missingFields.length > 0) {
      setValidationError(`Please select all the fields before proceeding.`);
    } else {
      setValidationError('');
      const updatedData = {
        ...selectedValues,
        product_id: productId,
      };
      
      updateSummaryData(updatedData);
      navigate('design-upload');
    }
  };
 

  const renderRequirementSelect = (field, label) => {
    if (Array.isArray(productRequirements[field]) && productRequirements[field].length > 0) {
      return (
        <div className="pd-form-row" key={field}>
          <label>{label}</label>
          <select
            value={selectedValues[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            required
          >
            <option value="">Select {label}</option>
            {productRequirements[field].map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  };

  const renderQuantityField = () => {
    const quantityOptions = productRequirements.quantity;

    if (Array.isArray(quantityOptions) && quantityOptions.length > 0) {
      return (
        <div className="pd-form-row">
          <label>Quantity</label>
          <select
            value={selectedValues.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
            required
          >
            <option value="">Select Quantity</option>
            {quantityOptions.map((quantity, index) => (
              <option key={index} value={quantity}>{quantity}</option>
            ))}
          </select>
        </div>
      );
    } else {
      return (
        <div className="pd-form-row">
          <label>Quantity</label>
          <input
            type="number"
            placeholder="Enter Quantity"
            value={selectedValues.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
            required
          />
        </div>
      );
    }
  };

  const similarProductsRef = useRef(null);
  const recommendedProductsRef = useRef(null);

  const scrollHorizontally = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const discountedPrice = discount > 0 
    ? product.originalPrice - (product.originalPrice * (discount / 100)) 
    : product.price;


  

  return (
    <div className="pd-product-page-container">
      <div className="pd-product-page-wrapper">
        <div className="pd-breadcrumbs">
          <span>Home / {categoryDisplayName} / {product?.product_name}</span>
        </div>
        <div className="pd-product-details">
          <div className="pd-product-image-section">
            <img src={mainImage} alt="Main Product" className="pd-main-product-image" />
            <div className="pd-thumbnail-navigation">
              <button onClick={() => scrollThumbnails('left')}>&#9664;</button>
              <div className="pd-product-thumbnails" ref={thumbnailContainerRef}>
                {thumbnails.map((thumbnail, index) => (
                  <img
                    key={index}
                    src={thumbnail}
                    alt={`Thumbnail ${index + 1}`}
                    onClick={() => handleThumbnailClick(thumbnail, index)}
                    className={`pd-thumbnail ${selectedThumbnail === index ? 'selected' : ''}`}
                  />
                ))}
              </div>
              <button onClick={() => scrollThumbnails('right')}>&#9654;</button>
            </div>

          </div>
          <div className="pd-product-info-section">
            <h1>{product?.product_name || "Product Name"}</h1>
            <ul>
              {productDescriptions.description.split('.').map((sentence, index) => (
                sentence.trim().length > 0 && (
                  <li key={index}>
                    {sentence.trim()}.
                  </li>
                )
              ))}
            </ul>
            <form>
              {renderQuantityField()}
              {Object.keys(productRequirements).map(field =>
                field !== 'quantity' && renderRequirementSelect(field, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
              )}
              <div className="pd-price-upload-row">
                <div className="pd-price">
                  <p>
                    <strong>₹{discountedPrice.toFixed(2)}</strong> inclusive of all taxes
                    <span className="original-price"> ₹{product?.originalPrice?.toFixed(2)}</span>
                    {discount > 0 && (
                      <span className="discount-tag">-{discount}%</span>
                    )}
                  </p>
                  <p>Buy in bulk and save</p>
                </div>
                <button 
                  type="button" 
                  className="pd-upload-button" 
                  onClick={handleUploadClick}
                >
                  Upload Files
                </button>
              </div>
              <div className="pd-form-row">
                <label>Estimate Delivery</label>
                <input type="text" placeholder="Pincode" />
              </div>
              {validationError && <p className="error-message">{validationError}</p>}
            </form>
          </div>
        </div>

        <div className="pd-tabs">
          {productDescriptions.overview.length > 0 && (
            <a
              href="#overview"
              className={selectedTab === 'overview' ? 'pd-active' : ''}
              onClick={() => handleTabClick('overview')}
            >
              Overview
            </a>
          )}
          {productDescriptions.options.length > 0 && (
            <a
              href="#options"
              className={selectedTab === 'options' ? 'pd-active' : ''}
              onClick={() => handleTabClick('options')}
            >
              Options
            </a>
          )}
          {productDescriptions.designs.length > 0 && (
            <a
              href="#designs"
              className={selectedTab === 'designs' ? 'pd-active' : ''}
              onClick={() => handleTabClick('designs')}
            >
              Designs
            </a>
          )}
        </div>

        <div className="pd-description">
          {selectedTab === 'overview' && productDescriptions.overview.length > 0 && (
            <div>
              {productDescriptions.overview.map((item, index) => (
                <div key={index} className="pd-overview-card">
                  {item.title && <h3>{item.title}</h3>}
                  {item.image && <img src={item.image} alt={item.title} />}
                  <ul>
                    {item.text.split('. ').map((sentence, i) =>
                      sentence.length > 0 ? (
                        <li key={i}>{sentence.trim()}</li>
                      ) : null
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'options' && productDescriptions.options.length > 0 && (
            <div className="pd-options-wrapper">
              {productDescriptions.options.map((item, index) => (
                <div key={index} className="pd-option-card">
                  {item.image && <img src={item.image} alt={item.title} />}
                  {item.text && <h3>{item.title}</h3>}
                  {item.text && (
                    <ul>
                      {item.text.split('. ').map((sentence, i) =>
                        sentence.length > 0 ? (
                          <li key={i}>{sentence.trim()}</li>
                        ) : null
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'designs' && productDescriptions.designs.length > 0 && (
            <div>
              {productDescriptions.designs.map((item, index) => (
                <div key={index}>
                  {item.title && <h3>{item.title}</h3>}
                  <div className="pd-design-card">
                    {item.image && <img src={item.image} alt={item.title} />}
                    <ul>
                      {item.text.split('. ').map((sentence, i) =>
                        sentence.length > 0 ? (
                          <li key={i}>{sentence.trim()}</li>
                        ) : null
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similar Products Section */}
        <div className="pd-similar-products">
          <h2>Similar Products</h2>
          <div className="product-scrollable-wrapper">
            <div className="product-grids">
              {similarProducts.map((product, index) => (
                <div 
                  className="product-cards" 
                  key={index} 
                  onClick={() => navigateToProduct(product.id)} // Navigate on click
                  style={{ cursor: 'pointer' }} // Add pointer to show clickable
                >
                  <img src={product.product_images[0]} alt={product.product_name} />
                  <p>{product.product_name}</p>
                  <p>₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* You Might Be Interested In Section */}
        <div className="pd-recommended-products">
          <h2>You Might Be Interested In</h2>
          <div className="product-scrollable-wrapper">
            <div className="product-grids">
              {recommendedProducts.map((product, index) => (
                <div 
                  className="product-cards" 
                  key={index} 
                  onClick={() => navigateToProduct(product.id)} // Navigate on click
                  style={{ cursor: 'pointer' }} // Add pointer to show clickable
                >
                  <img src={product.product_images[0]} alt={product.product_name} />
                  <p>{product.product_name}</p>
                  <p>₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
