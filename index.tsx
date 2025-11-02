import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SplashPage from './components/SplashPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Router: React.FC = () => {
  // Helper to get the current path from the URL hash.
  // Defaults to '/' if hash is empty or just '#'.
  const getPathFromHash = () => window.location.hash.substring(1) || '/';

  const [path, setPath] = useState(getPathFromHash());

  useEffect(() => {
    // This function will be called when the hash part of the URL changes
    // (e.g., user clicks a link like <a href="#/app">).
    const onLocationChange = () => {
      setPath(getPathFromHash());
    };
    
    window.addEventListener('hashchange', onLocationChange);

    // Cleanup the event listener when the component unmounts.
    return () => {
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  switch (path) {
    case '/app':
      return <App />;
    default:
      // Any path other than '/app', including '/', will render the splash page.
      return <SplashPage />;
  }
};


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);