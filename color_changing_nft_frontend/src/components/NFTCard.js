import React, { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import suiUtils from '../utils/suiUtils';

const NFTCard = ({ nft, onUpdate }) => {
  const { signAndExecuteTransactionBlock } = useWalletKit();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [canUpdate, setCanUpdate] = useState(false);
  
  // Check if the NFT can be updated (time interval has passed)
  useEffect(() => {
    const checkUpdateStatus = async () => {
      try {
        // Get the current interval from the oracle
        const interval = await suiUtils.getCurrentInterval();
        
        // Calculate time since last update
        const now = Date.now();
        const lastUpdated = nft.lastUpdated;
        const diffInMs = now - lastUpdated;
        const intervalMs = interval * 1000;
        
        // If enough time has passed, allow update
        if (diffInMs >= intervalMs) {
          setCanUpdate(true);
          setTimeRemaining(0);
        } else {
          // Otherwise, calculate and display remaining time
          setCanUpdate(false);
          setTimeRemaining(intervalMs - diffInMs);
        }
      } catch (error) {
        console.error('Error checking update status:', error);
      }
    };
    
    checkUpdateStatus();
    
    // Set up a timer to update the remaining time every second
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setCanUpdate(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nft.lastUpdated]);
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
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
    // Don't allow update if not enough time has passed
    if (!canUpdate) {
      setError(`Cannot update yet. Please wait ${formatRemainingTime(timeRemaining)}.`);
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
      
      // Call the parent component's onUpdate function
      if (onUpdate) {
        await onUpdate(nft.id, result);
      }
      
    } catch (error) {
      console.error('Error updating NFT:', error);
      
      // Extract the specific error message if it's a MoveAbort error
      let errorMessage = 'Failed to update NFT. Please try again.';
      
      if (error.message && error.message.includes('MoveAbort')) {
        if (error.message.includes('EInvalidColorChangeTime') || error.message.includes('1)')) {
          errorMessage = 'Not enough time has passed since the last update. Please wait and try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Determine which image to display based on current state
  const currentImage = nft.currentState === 0 ? nft.imageOne : nft.imageTwo;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        {/* NFT Image */}
        <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt={nft.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">Image not available</p>
            </div>
          )}
        </div>
        
        {/* State Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${nft.currentState === 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
          State {nft.currentState === 0 ? 'A' : 'B'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{nft.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{nft.description}</p>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <div>
            <span className="font-medium">Last Updated:</span> {getTimeSinceLastUpdate()}
          </div>
          <div>
            <a 
              href={`https://explorer.sui.io/object/${nft.id}?network=testnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              View on Explorer
            </a>
          </div>
        </div>
        
        {/* Time until next update */}
        <div className="mb-4 p-2 bg-gray-100 rounded-md text-sm text-center">
          {canUpdate ? (
            <span className="text-green-600 font-medium">Ready to update!</span>
          ) : (
            <div>
              <span className="font-medium">Next update in: </span>
              <span className="font-mono">{formatRemainingTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleUpdateNFT}
          disabled={isUpdating || !canUpdate}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isUpdating || !canUpdate
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isUpdating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Updating...
            </div>
          ) : !canUpdate ? (
            'Waiting for Update Time'
          ) : (
            'Update NFT State'
          )}
        </button>
      </div>
    </div>
  );
};

export default NFTCard;
