import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Wallet, CreditCard, Phone, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io(process.env.REACT_APP_BACKEND_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

const BookingInterface = () => {
  // State management
  const [bookingType, setBookingType] = useState('now');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const pickupRef = useRef(null);
  const destinationRef = useRef(null);

  // Socket connection management
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Unable to connect to server. Please try again later.');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);
  
  // Helper Functions
  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    setMessage('');
    setError('');
  };

  const validateScheduledTime = (date, time) => {
    const scheduledDateTime = new Date(`${date}T${time}`);
    const scheduledHour = scheduledDateTime.getHours();
    return scheduledHour >= 19 || scheduledHour < 8; // Between 7PM and 8AM
  };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedPhoneNumber);
  };

  const handleGPSClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                setPickup(results[0].formatted_address);
                if (pickupRef.current) {
                  pickupRef.current.setPlace({
                    formatted_address: results[0].formatted_address,
                    geometry: results[0].geometry
                  });
                }
              } else {
                setError("Couldn't find address for this location");
              }
            }
          );
        },
        (error) => {
          console.error('Location error:', error);
          setError('Unable to get your location');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const onPickupLoad = useCallback((autocomplete) => {
    pickupRef.current = autocomplete;
  }, []);

  const onDestinationLoad = useCallback((autocomplete) => {
    destinationRef.current = autocomplete;
  }, []);

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setPickup('');
    setDestination('');
    setSelectedDate('');
    setSelectedTime('');
  };
  
  // Form validation
  const validateForm = () => {
    if (!name || !phoneNumber || !pickup || !destination) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (bookingType === 'future' && (!selectedDate || !selectedTime)) {
      setError('Please select both date and time for future bookings');
      return false;
    }
    
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number (XXX-XXX-XXXX)');
      return false;
    }
    
    if (bookingType === 'future') {
      const today = new Date();
      const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
      if (selectedDateTime <= today) {
        setError('Please select a future date and time');
        return false;
      }
      if (!validateScheduledTime(selectedDate, selectedTime)) {
        setError('Please select a time between 7PM and 8AM');
        return false;
      }
    }
    return true;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    setError('');
    setMessage('');

    if (!isConnected) {
      setError('Not connected to server. Please try again.');
      return;
    }

    if (!validateForm()) return;

    const bookingData = {
      type: 'booking-app',
      bookingType,
      name,
      phoneNumber,
      origin: pickup,
      destination: destination,
      sessionId: Date.now().toString(),
      ...(bookingType === 'future' && {
        scheduledDate: selectedDate,
        scheduledTime: selectedTime
      })
    };

    console.log('Sending booking data:', bookingData);

    try {
      const eventName = bookingType === 'now' ? 'rideRequest' : 'futureBookingRequest';
      socket.emit(eventName, bookingData, (response) => {
        console.log('Server response:', response);
        
        if (response.success) {
          setMessage(bookingType === 'now' 
            ? 'Ride request sent! Please wait for driver confirmation.'
            : 'Ride request sent. Look out for a text message to see if the driver can fulfill this request.');
          resetForm();
        } else {
          setError(response.error || 'Failed to submit request');
        }
      });
    } catch (err) {
      console.error('Error sending booking request:', err);
      setError('Failed to send booking request. Please try again.');
    }
  };// Render component
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 text-center">
          Connecting to server...
        </div>
      )}

      {/* Welcome Banner - Changes based on booking type */}
      {bookingType === 'now' ? (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 text-center">
          <p>Welcome to EV_Taxi service! Our driver is available and ready to assist you. Request a ride below or feel welcome to step in.</p>
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>My operating hours are from 7PM to 8AM.</p>
        </div>
      )}

      {/* Booking Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => handleBookingTypeChange('now')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            bookingType === 'now' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Request Now
        </button>
        <button
          type="button"
          onClick={() => handleBookingTypeChange('future')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            bookingType === 'future' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Schedule Ride
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {/* Ride Request Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-gray-700 mb-1">Pick up</label>
          <div className="relative">
            <Autocomplete
              onLoad={onPickupLoad}
              onPlaceChanged={() => {
                if (pickupRef.current) {
                  const place = pickupRef.current.getPlace();
                  setPickup(place.formatted_address);
                }
              }}
            >
              <input
                type="text"
                placeholder="Tap the pin to get your location"
                className="w-full p-3 border rounded-lg pr-10"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                required
              />
            </Autocomplete>
            <button
              type="button"
              onClick={handleGPSClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500"
            >
              📍
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Drop off</label>
          <div className="relative">
            <Autocomplete
              onLoad={onDestinationLoad}
              onPlaceChanged={() => {
                if (destinationRef.current) {
                  const place = destinationRef.current.getPlace();
                  setDestination(place.formatted_address);
                }
              }}
            >
              <input
                type="text"
                placeholder="Where to?"
                className="w-full p-3 border rounded-lg"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </Autocomplete>
          </div>
        </div>

        <input
          type="text"
          placeholder="Your Name"
          className="w-full p-3 border rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <input
            type="tel"
            placeholder="Phone Number (Required)"
            className="w-full p-3 border rounded-lg"
            value={phoneNumber}
            onChange={handlePhoneChange}
            maxLength={12}
            required
          />
          <p className="text-sm text-gray-600 mt-1">Format: XXX-XXX-XXXX</p>
        </div>

        {bookingType === 'future' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full p-3 border rounded-lg"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Time</label>
              <input
                type="time"
                className="w-full p-3 border rounded-lg"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full p-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          disabled={!isConnected}
        >
          {bookingType === 'now' ? 'Request Ride' : 'Schedule Ride'}
        </button>
      </form>

      {/* Driver Info Section */}
      <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-center mb-6">Your Driver</h2>
        <div className="relative mb-4">
          <img 
            src="/toyota-camry.png"
            alt="Toyota Camry" 
            className="w-full rounded-lg"
          />
          <img 
            src="/profile-picture.jpg"
            alt="Driver" 
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white"
          />
        </div>
        
        <div className="text-center mt-8">
          <div className="inline-block bg-gray-800 text-white px-3 py-1 rounded-lg mb-4">
            TNH-3537
          </div>
          
          <div className="space-y-2 mb-6">
            <p><span className="font-semibold">Name:</span> James</p>
            <p><span className="font-semibold">Vehicle:</span> Black Toyota Camry</p>
            <p><span className="font-semibold">Service Type:</span> Supports 4 Passengers</p>
            <p><span className="font-semibold">Languages:</span> English</p>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold mb-3">Payment Methods Accepted:</p>
            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <Wallet className="w-6 h-6 text-gray-700" />
                <span className="text-sm">Cash</span>
              </div>
              <div className="flex flex-col items-center">
                <CreditCard className="w-6 h-6 text-gray-700" />
                <span className="text-sm">Card</span>
              </div>
              <div className="flex flex-col items-center">
                <Phone className="w-6 h-6 text-gray-700" />
                <span className="text-sm">Digital</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingInterface;