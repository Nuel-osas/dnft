import React, { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import suiUtils from '../utils/suiUtils';

const TimeOraclePanel = ({ defaultInterval, isAdmin, adminCapId, onIntervalUpdate }) => {
  const { signAndExecuteTransactionBlock, currentAccount } = useWalletKit();
  const [newInterval, setNewInterval] = useState(defaultInterval);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Format interval for display
  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };
  
  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    setNewInterval(value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!newInterval || newInterval <= 0) {
      setError('Please enter a valid interval (greater than 0 seconds)');
      return;
    }
    
    if (!adminCapId) {
      setError('Admin capability not found. You may not have admin rights.');
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log("Using admin cap ID:", adminCapId);
      const result = await suiUtils.updateDefaultInterval(
        { signAndExecuteTransactionBlock },
        adminCapId,
        newInterval
      );
      
      console.log('Default interval updated successfully:', result);
      setSuccess(true);
      
      // Call the callback to update the UI
      if (onIntervalUpdate) {
        onIntervalUpdate(newInterval);
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating default interval:', error);
      setError(`Failed to update interval: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Time Oracle Settings</h2>
        {isAdmin && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Admin Access
          </span>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700">Current Default Update Interval</p>
          <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-md text-sm">
            {formatInterval(defaultInterval)} ({defaultInterval} seconds)
          </div>
        </div>
        <p className="text-sm text-gray-500">
          This is the default interval that will be applied to newly minted NFTs. Each NFT owner can change their individual NFT's update interval.
        </p>
      </div>
      
      {isAdmin ? (
        <form onSubmit={handleSubmit} className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Update Default Interval</h3>
          
          <div className="mb-4">
            <label htmlFor="defaultIntervalInput" className="block text-sm font-medium text-gray-700 mb-1">
              New Default Interval (seconds)
            </label>
            <input
              id="defaultIntervalInput"
              type="number"
              min="1"
              value={newInterval}
              onChange={handleIntervalChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isUpdating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Suggested values: 60 (1 minute), 300 (5 minutes), 3600 (1 hour), 86400 (1 day)
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
              Default interval updated successfully!
            </div>
          )}
          
          <button
            type="submit"
            disabled={isUpdating || newInterval === defaultInterval}
            className={`w-full py-2 px-4 rounded-md transition-colors text-sm font-medium ${
              isUpdating || newInterval === defaultInterval
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
              'Update Default Interval'
            )}
          </button>
        </form>
      ) : (
        <div className="border-t pt-4">
          <p className="text-gray-600">
            Only administrators can change the default update interval. Individual NFT owners can still customize their own NFT's update interval.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeOraclePanel;
