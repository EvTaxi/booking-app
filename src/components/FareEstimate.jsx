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
    <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6">
      <h3 className="font-semibold text-lg mb-3">Estimated Fare Breakdown</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Base Fare:</span>
          <span>${baseFare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Distance ({distance} miles):</span>
          <span>${distanceCost}</span>
        </div>
        <div className="flex justify-between">
          <span>Time ({duration} mins):</span>
          <span>${timeCost}</span>
        </div>
        {destination?.toLowerCase().includes('dfw airport') && (
          <>
            <div className="flex justify-between">
              <span>Airport Exit Fee:</span>
              <span>$4.12</span>
            </div>
            <div className="flex justify-between">
              <span>Airport Drop-off Fee:</span>
              <span>$3.12</span>
            </div>
          </>
        )}
        <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total Estimate:</span>
            <span>${fare.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {destination && (
        <div className="mt-4">
          <a
            href={getWazeLink(destination)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigate with Waze
          </a>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
        <AlertTriangle className="w-4 h-4" />
        <p>Final fare may vary based on actual route and conditions</p>
      </div>
    </div>
  );
};

export default FareEstimate;