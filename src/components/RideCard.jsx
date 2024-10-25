import React from 'react';
import { Calendar, Clock, MapPin, Phone, User, Car } from 'lucide-react';

const RideCard = ({ ride, type, onAccept, onDecline }) => {
  const isScheduled = type === 'scheduled';
  const isHistory = type === 'history';

  const formatScheduledTime = (date, time) => {
    return new Date(`${date}T${time}`).toLocaleString();
  };

  const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumberString;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{ride.name}</span>
        </div>
        {isScheduled && (
          <span className={`px-2 py-1 rounded text-sm ${
            ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            ride.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-500" />
          <span>{formatPhoneNumber(ride.phoneNumber)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{ride.origin || ride.pickup}</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-gray-500" />
          <span>{ride.destination}</span>
        </div>
        {isScheduled && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{formatScheduledTime(ride.scheduledDate, ride.scheduledTime)}</span>
          </div>
        )}
        <div className="font-medium text-green-600">
          ${parseFloat(ride.fare).toFixed(2)}
        </div>
      </div>

      {(!isScheduled || ride.status === 'pending') && !isHistory && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAccept(ride)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(ride)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Decline
          </button>
        </div>
      )}

      {isHistory && (
        <div className="mt-2 text-sm text-gray-500">
          Completed: {ride.timestamp}
        </div>
      )}
    </div>
  );
};

export default RideCard;