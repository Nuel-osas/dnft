import React, { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import suiUtils from '../utils/suiUtils';

const NFTIntervalSettings = ({ nft, onIntervalUpdate }) => {
  const { signAndExecuteTransactionBlock } = useWalletKit();
  const [newInterval, setNewInterval] = useState(nft.updateInterval);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    setNewInterval(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (newInterval <= 0) {
      setError('Interval must be greater than 0 seconds');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await suiUtils.updateNFTInterval(
        { signAndExecuteTransactionBlock },
        nft.id,
        newInterval
      );

      console.log('NFT interval updated successfully:', result);
      setSuccess(true);

      // Call the callback to update the UI
      if (onIntervalUpdate) {
        onIntervalUpdate(nft.id, newInterval);
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating NFT interval:', error);
      setError(`Failed to update interval: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Update Interval Settings</h4>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="intervalInput" className="block text-xs text-gray-600 mb-1">
            Update Interval (seconds)
          </label>
          <input
            id="intervalInput"
            type="number"
            min="1"
            value={newInterval}
            onChange={handleIntervalChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isUpdating}
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum recommended: 60 seconds
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded-md text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-2 bg-green-100 text-green-700 rounded-md text-xs">
            Interval updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdating || newInterval === nft.updateInterval}
          className={`w-full py-2 px-4 rounded-md transition-colors text-sm font-medium ${
            isUpdating || newInterval === nft.updateInterval
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isUpdating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Updating...
            </div>
          ) : (
            'Save New Interval'
          )}
        </button>
      </form>
    </div>
  );
};

export default NFTIntervalSettings;
