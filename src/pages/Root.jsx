import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header'; // Desktop Header
import HeaderMobile from '../components/HeaderMobile'; // Mobile Header
import Footer from '../components/Footer';

export default function RootLayout() {
  const [isMobile, setIsMobile] = useState(false);

  // Debounced function to detect screen size and set mobile status
  useEffect(() => {
    const debounceResize = () => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        setIsMobile(window.innerWidth <= 1024); // Adjust the breakpoint as necessary
      }, 150);  // Debounce delay in milliseconds
    };
    
    window.addEventListener('resize', debounceResize);
    debounceResize(); // Set initial state on component mount
    return () => window.removeEventListener('resize', debounceResize);
  }, []);

  return (
    <>
      {/* Conditionally render the mobile or desktop header */}
      {isMobile ? <HeaderMobile /> : <Header />}
      
      <main className="main-container">
        <Outlet />
      </main>
      
      <Footer />
    </>
  );
}
