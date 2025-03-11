import React, { useState, useEffect, useCallback } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { ConnectButton } from '@mysten/wallet-kit';
import NFTCard from './components/NFTCard';
import MintForm from './components/MintForm';
import TimeOraclePanel from './components/TimeOraclePanel';
import Header from './components/Header';
import Footer from './components/Footer';
import suiUtils from './utils/suiUtils';

function App() {
  const { isConnected, currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
  const [userNFTs, setUserNFTs] = useState([]);
  const [activeTab, setActiveTab] = useState('mint');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(3600);

  const fetchUserNFTs = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nfts = await suiUtils.getNFTsForWallet(currentAccount.address);
      setUserNFTs(nfts);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to fetch your NFTs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount]);

  const checkAdminStatus = useCallback(async () => {
    if (!currentAccount?.address) return;
    
    try {
      const isAdmin = await suiUtils.checkAdminStatus(currentAccount.address);
      setIsAdmin(isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, [currentAccount]);

  const fetchCurrentInterval = useCallback(async () => {
    try {
      const interval = await suiUtils.getCurrentInterval();
      setCurrentInterval(interval);
    } catch (error) {
      console.error('Error fetching current interval:', error);
    }
  }, []);

  const handleMintNFT = useCallback(async (formData) => {
    // This function is called from MintForm component
    // The actual contract interaction happens in MintForm
    // Here we just refresh the NFT list after minting
    await fetchUserNFTs();
  }, [fetchUserNFTs]);

  const handleUpdateNFT = useCallback(async (nftId, result) => {
    // This function is called from NFTCard component
    // The actual contract interaction happens in NFTCard
    // Here we just refresh the NFT list after updating
    await fetchUserNFTs();
  }, [fetchUserNFTs]);

  const handleUpdateInterval = useCallback(async (newInterval) => {
    if (!isAdmin || !currentAccount) return;
    
    try {
      // Find the admin cap object ID
      const objects = await suiUtils.getAdminCap(currentAccount.address);
      if (!objects || objects.length === 0) {
        throw new Error('Admin capability not found');
      }
      
      const adminCapId = objects[0].data.objectId;
      
      // Call the smart contract to update the interval
      await suiUtils.updateTimeInterval(
        { signAndExecuteTransactionBlock },
        adminCapId,
        parseInt(newInterval)
      );
      
      // Update the local state
      setCurrentInterval(parseInt(newInterval));
      
    } catch (error) {
      console.error('Error updating interval:', error);
      throw error;
    }
  }, [isAdmin, currentAccount, signAndExecuteTransactionBlock]);

  // Fetch user's NFTs when wallet is connected
  useEffect(() => {
    if (isConnected && currentAccount) {
      fetchUserNFTs();
      checkAdminStatus();
      fetchCurrentInterval();
    }
  }, [isConnected, currentAccount, fetchUserNFTs, checkAdminStatus, fetchCurrentInterval]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dynamic NFT Dashboard</h1>
          <ConnectButton />
        </div>
        
        {isConnected ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-8">
              <div className="flex space-x-4 border-b mb-4">
                <button 
                  className={`py-2 px-4 ${activeTab === 'mint' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('mint')}
                >
                  Mint New NFT
                </button>
                <button 
                  className={`py-2 px-4 ${activeTab === 'collection' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                  onClick={() => {
                    setActiveTab('collection');
                    fetchUserNFTs(); // Refresh NFTs when switching to collection tab
                  }}
                >
                  My Collection
                </button>
                {isAdmin && (
                  <button 
                    className={`py-2 px-4 ${activeTab === 'oracle' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                    onClick={() => {
                      setActiveTab('oracle');
                      fetchCurrentInterval(); // Refresh interval when switching to oracle tab
                    }}
                  >
                    Time Oracle
                  </button>
                )}
              </div>
              
              {activeTab === 'mint' && (
                <MintForm onMint={handleMintNFT} />
              )}
              
              {activeTab === 'collection' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your NFT Collection</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      <p className="mt-2 text-gray-600">Loading your NFTs...</p>
                    </div>
                  ) : userNFTs.length === 0 ? (
                    <p className="text-gray-500">You don't have any NFTs yet. Mint one to get started!</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userNFTs.map((nft) => (
                        <NFTCard 
                          key={nft.id}
                          nft={nft}
                          onUpdate={handleUpdateNFT}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={fetchUserNFTs}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Refresh Collection
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'oracle' && (
                <TimeOraclePanel 
                  currentInterval={currentInterval}
                  onUpdateInterval={handleUpdateInterval}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Sui wallet to mint and manage your dynamic NFTs.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
