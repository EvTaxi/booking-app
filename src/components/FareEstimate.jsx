import React from 'react';
import { Navigation, AlertTriangle } from 'lucide-react';

const FareEstimate = ({ fareDetails }) => {
  if (!fareDetails) return null;

  const { distance, duration, fare, destination } = fareDetails;
  const baseFare = 3.00;
  const distanceCost = (distance * 2.80).toFixed(2);
  const timeCost = (duration * 0.40).toFixed(2);

  const getWazeLink = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    return `https://www.waze.com/ul?q=${encodedAddress}&navigate=yes`;
  };

  return (
    <div className="bg-gray-200 p-4 rounded-lg mb-6">
      <h3 className="font-semibold text-lg mb-3 text-black">Estimated Fare Breakdown</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-black">Base Fare:</span>
          <span className="text-green-600">${baseFare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black">Distance ({distance} miles):</span>
          <span className="text-green-600">${distanceCost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black">Time ({duration} mins):</span>
          <span className="text-green-600">${timeCost}</span>
        </div>
        {destination?.toLowerCase().includes('dfw airport') && (
          <>
            <div className="flex justify-between">
              <span className="text-black">Airport Exit Fee:</span>
              <span className="text-green-600">$4.12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black">Airport Drop-off Fee:</span>
              <span className="text-green-600">$3.12</span>
            </div>
          </>
        )}
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span className="text-black">Total Estimate:</span>
            <span className="text-green-600">${fare.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {destination && (
        <div className="mt-4">
          <a
            href={getWazeLink(destination)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigate with Waze
          </a>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-sm text-black">
        <AlertTriangle className="w-4 h-4" />
        <p>Estimates are based on standard taxi rates in Dallas, TX. Price shown is not final.</p>
      </div>
    </div>
  );
};

export default FareEstimate;