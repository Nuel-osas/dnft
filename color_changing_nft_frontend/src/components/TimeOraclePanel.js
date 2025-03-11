import React from 'react';
import { useWalletKit } from '@mysten/wallet-kit';

const TimeOraclePanel = ({ currentInterval }) => {
  const { currentAccount } = useWalletKit();

  // Format the interval for display
  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  if (!currentAccount) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Please connect your wallet to access time oracle settings.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Time Oracle Settings</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Current Update Interval</h3>
            <p className="text-gray-600">{formatInterval(currentInterval)}</p>
          </div>
          <div className="bg-primary-100 text-primary-800 px-4 py-2 rounded-md">
            {currentInterval} seconds
          </div>
        </div>
      </div>
      
      <div className="text-center p-8 border border-gray-200 rounded-lg">
        <p className="text-gray-600">
          NFTs can be updated every <span className="font-semibold">{formatInterval(currentInterval)}</span>.
        </p>
        <p className="text-gray-500 mt-2">
          This interval is set by the smart contract and determines how frequently NFT states can change.
        </p>
      </div>
    </div>
  );
};

export default TimeOraclePanel;
