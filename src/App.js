import React from 'react';
import BookingInterface from './components/BookingInterface';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ["places"];

function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center p-4">
          Error loading Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingInterface />
    </div>
  );
}

export default App;