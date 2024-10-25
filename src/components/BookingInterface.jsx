import React from 'react';
import { Wallet, CreditCard, Phone } from 'lucide-react';

const DriverInfo = ({ driverInfo }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-center mb-6">Your Driver</h2>
      <div className="relative">
        <div className="mb-4">
          <img 
            src="/toyota-camry.png"
            alt="Toyota Camry"
            className="w-full rounded-lg"
          />
        </div>
        <div className="flex justify-center -mt-2 mb-4">
          <img 
            src="/profile-picture.jpg"
            alt="Driver"
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
        </div>
      </div>
      
      <div className="text-center mt-4">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">License Plate</p>
          <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg font-mono">
            TNH-3537
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <p><span className="font-semibold">Name:</span> {driverInfo?.name || 'James'}</p>
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
  );
};

export default DriverInfo;