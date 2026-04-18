import React, { Suspense, lazy, useEffect } from 'react';
import './index.css';

const LoginPage = lazy(() => import('./components/LoginPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!sessionStorage.getItem('access_token'));

  useEffect(() => {
    // Request location permission on app load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location access granted:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Location access denied or unavailable:', error.message);
        }
      );
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Suspense fallback={
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Roboto,sans-serif', color: '#800000', fontSize: '16px',
        background: '#e8edf5'
      }}>
        Loading...
      </div>
    }>
      {isLoggedIn ? (
        <Dashboard />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </Suspense>
  );
}

export default App;
