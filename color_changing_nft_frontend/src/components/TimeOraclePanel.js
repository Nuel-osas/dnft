import React, { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';

const TimeOraclePanel = ({ currentInterval, onUpdateInterval, isAdmin }) => {
  const { currentAccount } = useWalletKit();
  const [newInterval, setNewInterval] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleIntervalChange = (e) => {
    setNewInterval(e.target.value);
  };

  const handleUpdateInterval = async (e) => {
    e.preventDefault();
    
    if (!newInterval || isNaN(newInterval) || parseInt(newInterval) <= 0) {
      setError('Please enter a valid interval in seconds');
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Call the parent function that interacts with the smart contract
      await onUpdateInterval(newInterval);
      
      // Reset form
      setNewInterval('');
      
      alert('Interval updated successfully!');
    } catch (error) {
      console.error('Error updating interval:', error);
      setError('Failed to update interval: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

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
      
      {isAdmin ? (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Admin Controls</h3>
          <p className="text-gray-600 mb-4">
            As an admin, you can update the interval at which NFTs can change their state.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleUpdateInterval} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newInterval">
                New Interval (in seconds)
              </label>
              <input
                type="number"
                id="newInterval"
                value={newInterval}
                onChange={handleIntervalChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 3600 for 1 hour"
                min="1"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isUpdating}
                className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isUpdating ? 'Updating...' : 'Update Interval'}
              </button>
              
              <div className="text-sm text-gray-500">
                Admin: {currentAccount?.address?.substring(0, 6)}...{currentAccount?.address?.substring(currentAccount?.address?.length - 4)}
              </div>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Common Intervals</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setNewInterval('60')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded-md transition-colors"
              >
                1 minute
              </button>
              <button 
                onClick={() => setNewInterval('300')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded-md transition-colors"
              >
                5 minutes
              </button>
              <button 
                onClick={() => setNewInterval('3600')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded-md transition-colors"
              >
                1 hour
              </button>
              <button 
                onClick={() => setNewInterval('86400')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded-md transition-colors"
              >
                1 day
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border border-gray-200 rounded-lg">
          <p className="text-gray-500">You don't have admin privileges to modify the time oracle settings.</p>
        </div>
      )}
    </div>
  );
};

export default TimeOraclePanel;
