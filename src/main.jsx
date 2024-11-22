import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main App component
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'; // Import global styles if any

// Create the root of the application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app with context providers and the router
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="339905554940-k3atlc9o350v56tnlh2449k70h6l1epn.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
