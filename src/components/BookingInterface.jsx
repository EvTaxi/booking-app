import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Phone, 
  User 
} from 'lucide-react';
import socket from '../utils/socket';
import FareEstimate from './FareEstimate';
import DriverInfo from './DriverInfo';

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
  const [driverStatus, setDriverStatus] = useState('Offline');
  const [isDriverBusy, setIsDriverBusy] = useState(false);
  const [canRequestRide, setCanRequestRide] = useState(true);
  const [hasRequestedRide, setHasRequestedRide] = useState(false);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

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

    socket.on('driverStatusUpdate', ({ status, driverInfo }) => {
      setDriverStatus(status);
      setDriverInfo(driverInfo);
      setCanRequestRide(status === 'Online' && !isDriverBusy);
      setShowDriverInfo(status === 'Online' && !isDriverBusy && bookingType === 'now');
    });

    socket.on('passengerAppStatus', ({ isOffline }) => {
      setIsDriverBusy(isOffline);
      setCanRequestRide(!isOffline && driverStatus === 'Online');
      if (isOffline) {
        setShowDriverInfo(false);
      }
    });

    socket.on('rideAccepted', () => {
      setMessage('Your ride has been accepted! The driver will contact you shortly.');
      setHasRequestedRide(false);
      setShowDriverInfo(true);
    });

    socket.on('rideDeclined', () => {
      setError('Your ride request was declined. Please try again.');
      setHasRequestedRide(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('driverStatusUpdate');
      socket.off('passengerAppStatus');
      socket.off('rideAccepted');
      socket.off('rideDeclined');
    };
  }, [bookingType, isDriverBusy, driverStatus]);

  // Helper Functions
  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setPickup('');
    setDestination('');
    setSelectedDate('');
    setSelectedTime('');
    setFareEstimate(null);
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

  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    setMessage('');
    setError('');
    setHasRequestedRide(false);
    setFareEstimate(null);
    resetForm();
    setShowDriverInfo(type === 'now' && driverStatus === 'Online' && !isDriverBusy);
  };
  
  // Validation and Submission
  const validateScheduledTime = (date, time) => {
    const scheduledDateTime = new Date(`${date}T${time}`);
    const scheduledHour = scheduledDateTime.getHours();
    return scheduledHour >= 19 || scheduledHour < 8;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasRequestedRide) {
      return;
    }

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
      destination,
      sessionId: Date.now().toString(),
      ...(bookingType === 'future' && {
        scheduledDate: selectedDate,
        scheduledTime: selectedTime
      })
    };

    try {
      const eventName = bookingType === 'now' ? 'rideRequest' : 'futureBookingRequest';
      socket.emit(eventName, bookingData, (response) => {
        if (response.success) {
          setMessage(bookingType === 'now' 
            ? 'Ride request sent! Please wait for driver confirmation.'
            : 'Scheduling request sent. You will receive a text message confirmation.');
          setHasRequestedRide(true);
          setFareEstimate(response.fareDetails);
          if (response.driverInfo) {
            setDriverInfo(response.driverInfo);
            setShowDriverInfo(true);
          }
        } else {
          setError(response.error || 'Failed to submit request');
        }
      });
    } catch (err) {
      console.error('Error sending booking request:', err);
      setError('Failed to send booking request. Please try again.');
    }
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

  // Autocomplete refs
  const onPickupLoad = useCallback((autocomplete) => {
    pickupRef.current = autocomplete;
  }, []);

  const onDestinationLoad = useCallback((autocomplete) => {
    destinationRef.current = autocomplete;
  }, []);

  // Status Banner Component
  const StatusBanner = () => {
    if (bookingType === 'now') {
      if (driverStatus === 'Offline') {
        return (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>Driver is currently offline. Please schedule a ride or try again later.</p>
          </div>
        );
      } else if (isDriverBusy) {
        return (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>Driver is currently on a trip. Please schedule a ride or try again later.</p>
          </div>
        );
      } else {
        return (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 text-center">
            <p>Welcome to EV_Taxi service! Our driver is available and ready to assist you.</p>
          </div>
        );
      }
    } else {
      return (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>Operating hours are from 7PM to 8AM.</p>
        </div>
      );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 text-center">
          Connecting to server...
        </div>
      )}

      {/* Status Banner */}
      <StatusBanner />

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

      {/* Error and Success Messages */}
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

      {/* Booking Form */}
      {(canRequestRide || bookingType === 'future') && !hasRequestedRide && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {/* Pickup Location */}
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
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    className="w-full p-3 pl-10 border rounded-lg"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    required
                  />
                </div>
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

          {/* Destination */}
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
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter destination"
                    className="w-full p-3 pl-10 border rounded-lg"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </Autocomplete>
            </div>
          </div>

          {/* Name Input */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 pl-10 border rounded-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Phone Number Input */}
          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full p-3 pl-10 border rounded-lg"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={12}
                required
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">Format: XXX-XXX-XXXX</p>
          </div>

          {/* Future Booking Fields */}
          {bookingType === 'future' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    className="w-full p-3 pl-10 border rounded-lg"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="time"
                    className="w-full p-3 pl-10 border rounded-lg"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isConnected || hasRequestedRide}
            className={`w-full p-4 rounded-lg font-medium transition-colors ${
              !isConnected || hasRequestedRide
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {hasRequestedRide 
              ? 'Request Sent' 
              : bookingType === 'now' 
                ? 'Request Ride' 
                : 'Schedule Ride'}
          </button>
        </form>
      )}

      {/* Fare Estimate - Only show for immediate requests */}
      {bookingType === 'now' && fareEstimate && (
        <FareEstimate fareDetails={fareEstimate} />
      )}

      {/* Driver Info Section */}
      {showDriverInfo && driverInfo && (
        <DriverInfo driverInfo={driverInfo} />
      )}
    </div>
  );
};

export default BookingInterface;