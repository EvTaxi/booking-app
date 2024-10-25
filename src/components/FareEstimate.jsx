import React from 'react';

const FareEstimate = ({ fareDetails }) => {
  if (!fareDetails) return null;

  const { distance, duration, fare } = fareDetails;
  const baseFare = 3.00;
  const distanceCost = (distance * 2.80).toFixed(2);
  const timeCost = (duration * 0.40).toFixed(2);

  return (
    <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6">
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
        {fareDetails.destination.toLowerCase().includes('dfw airport') && (
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
        <div className="border-t border-green-200 pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total Estimate:</span>
            <span>${fare.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm mt-3 text-green-600">
        *Final fare may vary based on actual route and conditions
      </p>
    </div>
  );
};

export default FareEstimate;