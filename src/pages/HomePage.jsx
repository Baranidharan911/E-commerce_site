import Seperator from '../assets/seperator.svg'
import Client1 from '../assets/Logo Client 1.svg'
import Client2 from '../assets/Logo Client 2.svg'
import Client3 from '../assets/Logo Client 3.svg'
import Client4 from '../assets/Logo Client 4.svg'
import QualityIcon from '../assets/quality-icon.png';
import Apparels from '../assets/apparels.jpeg';
import SecurePaymentIcon from '../assets/secure-payment-icon.png';
import QuickDeliveryIcon from '../assets/quick-delivery-icon.png';
import SupportIcon from '../assets/support-icon.png';
import BarImg1 from '../assets/bar-img-1.png';
import BarImg2 from '../assets/bar-img-2.png';

import About from '../assets/Replace This.svg'
import '../styles/HomePage.css';
import { Link } from 'react-router-dom'; // Ensure this is imported
import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'; // For FAQ dropdown icons

export default function HomePage() {
  const products = [
    { id: 1, name: 'Matt Paper Stickers', img: '/src/assets/temp-files/Frame 135.png', rating: 4 },
    { id: 2, name: 'Matt PVC Stickers', img: '/src/assets/temp-files/Frame 136.png', rating: 3 },
    { id: 3, name: 'A6 Flyers Printing', img: '/src/assets/temp-files/Frame 137.png', rating: 3.5 },
    { id: 4, name: 'Special Paper Business Cards', img: '/src/assets/temp-files/Frame 138.png', rating: 3.4 },
    { id: 5, name: 'Special Paper Business Cards', img: '/src/assets/temp-files/Frame 139.png', rating: 5 },
    { id: 6, name: 'Special Paper Business Cards', img: '/src/assets/temp-files/Frame 140.png', rating: 2.5 },
    { id: 7, name: 'Special Paper Business Cards', img: '/src/assets/temp-files/Frame 141.png', rating: 4.5 },
    { id: 8, name: 'Special Paper Business Cards', img: '/src/assets/temp-files/Frame 142.png', rating: 4.5 }
  ];

  const features = [
    { id: 1, icon: QualityIcon, description: 'Best Quality Products' },
    { id: 2, icon: SecurePaymentIcon, description: '100% Secured Payments' },
    { id: 3, icon: QuickDeliveryIcon, description: 'Quick Delivery' },
    { id: 4, icon: SupportIcon, description: '365 Days Support' },
  ];

  // FAQ Data and Dropdown Logic
  const [openFAQ, setOpenFAQ] = useState(null);
  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqItems = [
    { id: 1, question: 'What is your minimum order quantity?', answer: 'Our minimum order quantity varies depending on the product you choose. Please refer to the specific product page for more details.' },
    { id: 2, question: 'How long does it take to make & deliver?', answer: 'Production typically takes 7-10 business days and delivery time depends on your location. We offer express shipping for urgent orders.' },
    { id: 3, question: 'How can I track my order?', answer: 'You will receive an email with your tracking information once your order is shipped.' },
    { id: 4, question: 'I have a custom requirement, can you help?', answer: 'Absolutely! Reach out to our customer service team, and we will assist with your custom requirements.' },
    { id: 5, question: 'I need to check my design before printing, is it possible?', answer: 'Yes, we provide proofing services where you can review your design before the final print.' },
    { id: 6, question: 'How can I create my design?', answer: 'We have a design tool on our website, or you can upload your custom design when placing your order.' }
  ];

  return <>
    <div className="hero-section">
      <div className="hero-top-container">
        <div className="get-started-section">
          <h1 className="get-started-title">Premium Printing Solutions</h1>
          <h3 className="get-started-desc">Get top-quality printing for all your needs. From business cards to banners, we offer fast, reliable service with a focus on customer satisfaction.</h3>
          <button className="get-started-btn">Get started</button>
        </div>
        <div className="ratings-section">
          <div className="ratings">
            <div className="ratings-card">
              <span className="rating">4.8 <strong>★</strong></span>
              <p>High-rated</p>
            </div>
            <img src={BarImg1} className="bar-container" />
          </div>
          <div className="delivery">
            <img src={BarImg2} className="bar-container" />
            <div className="delivered-count">
              <h1>100+</h1>
              <h3>Items Delivered</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="category-section">
        <h1 className="category-title">Category</h1>
        <div className="categories">
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
          <div className="category">
            <h1 className="category-name">BUSINESS CARD</h1>
          </div>
          <img src={Seperator} />
        </div>
      </div>
    </div>
    <div className="about-us-section">
      <div className="about-us">
        <div className="image">
          <img src={About} />
        </div>
        <div className="about-content">
          <h3 className="about-title">About Us</h3>
          <h1 className="about-sub-title">Crafting Excellence Through Every Print</h1>
          <p className="about-desc">The Printz Shop offers top-quality printing services for a wide range of products, including business cards, brochures, posters, banners, booklets, and packaging. Using advanced technology, we provide vibrant color and black-and-white prints in various sizes and finishes. We specialize in custom business cards with options like foil stamping and embossing, as well as tailored brochures and catalogues with professional layouts and multiple binding choices. For large-format printing, we create stunning posters, banners, and displays on materials like vinyl and fabric, complete with mounting and hardware. Whatever your needs, we deliver top-tier results to make your brand stand out.</p>
          <div className="divider"></div>
        </div>
      </div>
      <div className="partners-section">
        <h1 className="partners-title">Our Partners :</h1>
        <div className="partners-logo">
          <img src={Client1} />
          <img src={Client2} />
          <img src={Client3} />
          <img src={Client4} />
        </div>
      </div>
    </div>
    {/* Popular Products Section */}
    <section className="popular-products">
        <h2 className="popular-product-section-title">Popular Products</h2>
        <div className="popular-products-grid">
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
          <div className="popular-product-card">
            <div className="popular-product-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Business Cards" />
            </div>
            <p className="popular-product-title">Business Cards</p>
          </div>
        </div>
      </section>
    
    {/* Custom Packaging Section */}
    <div className="custom-packaging">
      <div className="custom-packaging-wrapper">
        <div className="content">
          <h2>Custom packaging designed to fit your business</h2>
          <p>Explore, design and order packaging your customers will love</p>
          <button className="shop-now-btn">Shop Now</button>
        </div>
        <div className="images-grid">
          <div className="upper-grid">
            <div className="left">
              <img src="https://www.w3schools.com/css/img_5terre.jpg" alt="Packaging 1" />
            </div>
            <div className="right">
              <div className="right-top">
                <img src="https://www.w3schools.com/css/img_forest.jpg" alt="Packaging 2" />
                <img src="https://media.istockphoto.com/id/959957996/photo/indian-rupee-banknotes-in-trolley-on-a-table-online-shopping-concept.jpg?s=1024x1024&w=is&k=20&c=3xkx-pknYj0FgpHTgkqqW6aunvKat_jSyZQVaNir6dE=" alt="Packaging 3" />
              </div>
              <div className="right-bottom">
                <img src="https://www.w3schools.com/css/img_mountains.jpg" alt="Packaging 4" />
              </div>
            </div>
          </div>
          <div className="lower-grid">
            <img src={Apparels} alt="Packaging 5" />
          </div>
        </div>
      </div>
    </div>

    <div className="best-selling">
      <div className="best-selling-wrapper">
        <h2 className="best-selling-title">Best Selling</h2>
        <div className="best-selling-list-wrapper">
          <div className="best-selling-list">
            {products.map(product => (
              <div key={product.id} className="best-selling-item">
                <img src={product.img} alt={product.name} />
                <div className="best-selling-info">
                  <div className="best-selling-rating">
                    {'★'.repeat(product.rating) + '☆'.repeat(5 - product.rating)}
                  </div>
                  <div className="best-selling-name">{product.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="features">
      <div className="features-wrapper">
        {features.map(feature => (
          <div key={feature.id} className="feature-item">
            <img src={feature.icon} alt={feature.title} />
            <div className="feature-title">{feature.title}</div>
            <div className="feature-description">{feature.description}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="company-stats-section">
      <div className="upper-stats-section">
        <div className="stats-title">
          <h3>Statistic</h3>
          <h1>Printz in Number</h1>
        </div>
        <div className="stats-content">
          <p></p>At The Printz Shop, we believe in delivering excellence through innovation and precision. Our commitment to quality has made us a trusted partner for countless businesses. Whether it's a small project or a large-scale print job, we are equipped to meet your needs with unmatched efficiency.
          <button className="learn-more-btn">
            Learn More
          </button>
        </div>
      </div>
      <div className="lower-stats-section">
        <div className="stat">
          <h1>15+</h1>
          <h3>Years of Experience</h3>
        </div>
        <div className="stat">
          <h1>98%</h1>
          <h3>Satisfaction Rate</h3>
        </div>
        <div className="stat">
          <h1>50+</h1>
          <h3>Diverse Product</h3>
        </div>
        <div className="stat">
          <h1>10K</h1>
          <h3>Printing Capacity</h3>
        </div>
      </div>
    </div>

    {/* Printz Picks Section */}
    <section className="printz-picks">
        <div className="printz-picks-wrapper">
        <div className="picks-section-header">
           <div>
            <h2 className="printz-picks-title">Printz Picks :</h2>
            <p className="printz-picks-sub-title">Popular Product. Unbeatable Value.</p>
           </div>
          <button className="picks-see-all-btn">See All</button>
        </div>
     
        <div className="picks-products-grid">
          <div className="picks-product-card">
            <div className="picks-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="T-shirts" />
            </div>
            <p className="picks-product-title">
              <Link to="/tshirts">T-shirts <span className="arrow">→</span></Link>
            </p>
          </div>
          <div className="picks-product-card">
            <div className="picks-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="T-shirts" />
            </div>
            <p className="picks-product-title">
              <Link to="/tshirts">T-shirts <span className="arrow">→</span></Link>
            </p>
          </div>
          <div className="picks-product-card">
            <div className="picks-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="T-shirts" />
            </div>
            <p className="picks-product-title">
              <Link to="/tshirts">T-shirts <span className="arrow">→</span></Link>
            </p>
          </div>
          <div className="picks-product-card">
            <div className="picks-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="T-shirts" />
            </div>
            <p className="picks-product-title">
              <Link to="/tshirts">T-shirts <span className="arrow">→</span></Link>
            </p>
          </div>
          <div className="picks-product-card">
            <div className="picks-image-container">
              <img src="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="T-shirts" />
            </div>
            <p className="picks-product-title">
              <Link to="/tshirts">T-shirts <span className="arrow">→</span></Link>
            </p>
          </div>
        </div>
        </div>
      </section>


    {/* FAQ Section */}
    <section className="faq-section">
      <h2 className="faq-title">Top Questions Answered Here</h2>
      <p className="faq-subtitle">If we missed any, we are just a message away!</p>

      <div className="faq-grid">
        <div className="faq-column">
          {faqItems.slice(0, 3).map((item, index) => (
            <div key={item.id} className="faq-item">
              <div className="faq-question" onClick={() => toggleFAQ(index)}>
                <span>{item.question}</span>
                {openFAQ === index ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {openFAQ === index && <div className="faq-answer">{item.answer}</div>}
            </div>
          ))}
        </div>

        <div className="faq-column">
          {faqItems.slice(3).map((item, index) => (
            <div key={item.id} className="faq-item">
              <div className="faq-question" onClick={() => toggleFAQ(index + 3)}>
                <span>{item.question}</span>
                {openFAQ === index + 3 ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {openFAQ === index + 3 && <div className="faq-answer">{item.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Free Printing Sample Section */}
    <section className="free-sample">
      <div className="sample-content">
        <h2>Request Your Free Printing Sample!</h2>
        <p>See, Touch, and Feel the Excellence of Printshop.</p>
        <button className="request-now-btn">Request Now!</button>
      </div>
    </section>
  </>
}
