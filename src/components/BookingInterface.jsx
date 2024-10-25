import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import DriverInfo from './DriverInfo';

const libraries = ["places"];
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ev-taxi-backend-7e73753d6355.herokuapp.com';

const socket = io(BACKEND_URL, {
  withCredentials: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  path: '/socket.io/',
  secure: true
});

const BookingInterface = () => {
  // Google Maps API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State management
  const [activeTab, setActiveTab] = useState('request');
  const [formData, setFormData] = useState({
    pickup: '',
    destination: '',
    name: '',
    phoneNumber: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fareEstimate, setFareEstimate] = useState(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [driverStatus, setDriverStatus] = useState('Offline');
  const [driverInfo, setDriverInfo] = useState(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);

  // Socket event handlers
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('getDriverStatus', (response) => {
        if (response) {
          setDriverStatus(response.status);
          setDriverInfo(response.driverInfo);
        }
      });
    });

    socket.on('driverStatusUpdate', ({ status, driverInfo }) => {
      setDriverStatus(status);
      if (driverInfo) setDriverInfo(driverInfo);
    });

    socket.on('fareEstimateUpdate', (estimate) => {
      setFareEstimate(estimate);
    });

    socket.on('connect_error', (error) => {
      setError('Connection error. Please try again later.');
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('driverStatusUpdate');
      socket.off('fareEstimateUpdate');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []);

  // Google Maps Places Autocomplete handlers
  const onPickupLoad = (autocomplete) => {
    setPickupAutocomplete(autocomplete);
  };

  const onDestinationLoad = (autocomplete) => {
    setDestinationAutocomplete(autocomplete);
  };

  const handlePlaceSelect = (type) => {
    const autocomplete = type === 'pickup' ? pickupAutocomplete : destinationAutocomplete;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.geometry) {
      setError(`Please select a location from the dropdown for ${type}`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [type]: place.formatted_address
    }));

    // If both locations are set, get fare estimate
    if (formData.pickup && formData.destination) {
      requestFareEstimate(
        type === 'pickup' ? place.formatted_address : formData.pickup,
        type === 'destination' ? place.formatted_address : formData.destination
      );
    }
  };

  // Fare estimation
  const requestFareEstimate = async (origin, destination) => {
    socket.emit('requestFareEstimate', { origin, destination }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        setFareEstimate(response.fareEstimate);
      }
    });
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.pickup || !formData.destination) {
      setError('Please select both pickup and drop-off locations');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.phoneNumber.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (activeTab === 'schedule') {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        setError('Please select both date and time for scheduled ride');
        return false;
      }
      const scheduledDateTime = moment.tz(
        `${formData.scheduledDate} ${formData.scheduledTime}`,
        'YYYY-MM-DD HH:mm',
        'America/Chicago'
      );
      if (scheduledDateTime.isBefore(moment())) {
        setError('Please select a future date and time');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const requestData = {
        ...formData,
        type: activeTab === 'request' ? 'immediate' : 'scheduled'
      };

      const eventName = activeTab === 'request' ? 'rideRequest' : 'futureBookingRequest';

      socket.emit(eventName, requestData, (response) => {
        setIsLoading(false);
        
        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.success) {
          setFareEstimate(response.fareEstimate);
          setShowDriverInfo(true);
        }
      });
    } catch (error) {
      setError('Failed to submit request. Please try again.');
      setIsLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Error loading Google Maps. Please refresh the page.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-6">
      <h2 className="text-center text-lg text-green-600 mb-6">
        Welcome to EV_Taxi service! Our driver is available and ready to assist you. Request a ride below or feel welcome to step in.
      </h2>
      
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('request')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'request' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Request Now
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'schedule' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Schedule Ride
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-600">Pick up</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Autocomplete
              onLoad={onPickupLoad}
              onPlaceChanged={() => handlePlaceSelect('pickup')}
            >
              <input
                type="text"
                name="pickup"
                placeholder="Tap the pin to get your location"
                value={formData.pickup}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </Autocomplete>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-600">Drop off</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Autocomplete
              onLoad={onDestinationLoad}
              onPlaceChanged={() => handlePlaceSelect('destination')}
            >
              <input
                type="text"
                name="destination"
                placeholder="Where to?"
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </Autocomplete>
          </div>
        </div>

        {activeTab === 'schedule' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Date</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                min={moment().format('YYYY-MM-DD')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Time</label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="block text-sm text-gray-600">Your Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-600">Phone Number (Required)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Format: XXX-XXX-XXXX"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {fareEstimate && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-semibold text-green-800">Estimated Fare: ${fareEstimate.toFixed(2)}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || driverStatus === 'Offline'}
          className={`w-full py-3 rounded-lg transition-colors ${
            isLoading || driverStatus === 'Offline'
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isLoading ? 'Requesting...' : `Request ${activeTab === 'schedule' ? 'Scheduled ' : ''}Ride`}
        </button>
      </form>

      {showDriverInfo && driverInfo && (
        <DriverInfo driverInfo={driverInfo} />
      )}
    </div>
  );
};

export default BookingInterface;