import React, { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

function App() {
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

export default App;