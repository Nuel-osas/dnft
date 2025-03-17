import React, { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import suiUtils from '../utils/suiUtils';
import NFTIntervalSettings from './NFTIntervalSettings';

const NFTCard = ({ nft, onUpdate, onIntervalUpdate }) => {
  const { signAndExecuteTransactionBlock } = useWalletKit();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Set up a timer to update the remaining time every second
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const currentTime = Date.now();
      const nextUpdateTime = nft.lastUpdated + (nft.updateInterval * 1000);
      const remaining = Math.max(0, nextUpdateTime - currentTime);
      setTimeRemaining(remaining);
    };
    
    // Calculate immediately
    calculateTimeRemaining();
    
    // Then update every second
    const timer = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nft.lastUpdated, nft.updateInterval]);
  
  // Calculate time since last update
  const getTimeSinceLastUpdate = () => {
    const now = Date.now();
    const lastUpdated = nft.lastUpdated;
    const diffInMs = now - lastUpdated;
    
    // Convert to appropriate time unit
    if (diffInMs < 60000) { // Less than a minute
      return `${Math.floor(diffInMs / 1000)} seconds ago`;
    } else if (diffInMs < 3600000) { // Less than an hour
      return `${Math.floor(diffInMs / 60000)} minutes ago`;
    } else if (diffInMs < 86400000) { // Less than a day
      return `${Math.floor(diffInMs / 3600000)} hours ago`;
    } else { // Days or more
      return `${Math.floor(diffInMs / 86400000)} days ago`;
    }
  };
  
  // Format remaining time until next possible update
  const formatRemainingTime = (ms) => {
    if (ms <= 0) return 'Ready to update';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleUpdateNFT = async () => {
    // Check if the NFT is ready for an update
    if (!suiUtils.isUpdateDue(nft)) {
      setError(`Cannot update yet. This NFT can be updated every ${nft.updateInterval} seconds.`);
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const result = await suiUtils.updateNFTState(
        { signAndExecuteTransactionBlock },
        nft.id
      );
      
      console.log('NFT updated successfully:', result);
      
      // Call the callback to update the UI
      if (onUpdate) {
        onUpdate(nft.id, result);
      }
    } catch (error) {
      console.error('Error updating NFT:', error);
      setError(`Failed to update NFT: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={nft.currentImage} 
          alt={nft.name} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
          }}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          State: {nft.currentState === 0 ? 'A' : 'B'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{nft.name || 'Unnamed NFT'}</h3>
        <p className="text-sm text-gray-600 mb-3">{nft.description || 'No description'}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <div>
            <span className="font-medium">Last updated:</span> {getTimeSinceLastUpdate()}
          </div>
          <div>
            <a 
              href={`https://explorer.sui.io/object/${nft.id}?network=testnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              View in Explorer
            </a>
          </div>
        </div>
        
        {/* Time until next update */}
        <div className="mb-4 p-2 bg-gray-100 rounded-md text-sm text-center">
          {suiUtils.isUpdateDue(nft) ? (
            <span className="text-green-600 font-medium">Ready to update!</span>
          ) : (
            <div>
              <span className="font-medium">Next update in: </span>
              <span className="font-mono">{formatRemainingTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        <div className="mb-2 text-xs text-gray-500">
          <span className="font-medium">Update interval:</span> {nft.updateInterval} seconds
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={handleUpdateNFT}
            disabled={isUpdating || !suiUtils.isUpdateDue(nft)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm font-medium ${
              suiUtils.isUpdateDue(nft) 
                ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Updating...
              </div>
            ) : suiUtils.isUpdateDue(nft) ? 'Update Now' : 'Not Ready'}
          </button>
          
          <button
            onClick={toggleSettings}
            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {showSettings && (
          <NFTIntervalSettings 
            nft={nft} 
            onIntervalUpdate={onIntervalUpdate} 
          />
        )}
      </div>
    </div>
  );
};

export default NFTCard;
