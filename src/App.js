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
        <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg">
          Error loading Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
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