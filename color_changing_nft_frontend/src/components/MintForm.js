import React, { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import suiUtils from '../utils/suiUtils';

const MintForm = ({ onMint }) => {
  const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageOne: '',
    imageTwo: '',
  });
  const [previewState, setPreviewState] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.imageOne || !formData.imageTwo) {
      setError('Please fill out all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call the smart contract to mint the NFT
      const result = await suiUtils.mintNFT(
        { signAndExecuteTransactionBlock },
        {
          name: formData.name,
          description: formData.description,
          imageOne: formData.imageOne,
          imageTwo: formData.imageTwo,
        }
      );
      
      console.log('Mint transaction result:', result);
      
      // Call the onMint callback to update the UI
      onMint({
        ...formData,
        id: result.digest, // Use the transaction digest as a temporary ID
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        imageOne: '',
        imageTwo: '',
      });
      
      alert('NFT minted successfully! Transaction ID: ' + result.digest);
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError('Failed to mint NFT: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreview = () => {
    setPreviewState(previewState === 0 ? 1 : 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Mint a New Dynamic NFT</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="My Dynamic NFT"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe your NFT..."
              rows="3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="imageOne">
              Image URL (State 0) *
            </label>
            <input
              type="url"
              id="imageOne"
              name="imageOne"
              value={formData.imageOne}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image1.png"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="imageTwo">
              Image URL (State 1) *
            </label>
            <input
              type="url"
              id="imageTwo"
              name="imageTwo"
              value={formData.imageTwo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image2.png"
              required
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Minting...' : 'Mint NFT'}
            </button>
            
            <div className="text-sm text-gray-600">
              Connected: {currentAccount?.address?.substring(0, 6)}...{currentAccount?.address?.substring(currentAccount?.address?.length - 4)}
            </div>
          </div>
        </form>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-md">
          <div className={`relative h-64 ${previewState === 0 ? 'state-0' : 'state-1'} color-transition flex items-center justify-center`}>
            {(previewState === 0 ? formData.imageOne : formData.imageTwo) ? (
              <img 
                src={previewState === 0 ? formData.imageOne : formData.imageTwo} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Enter image URL to see preview</p>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              State: {previewState}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {formData.name || "NFT Name"}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {formData.description || "NFT description will appear here..."}
            </p>
            
            <button 
              onClick={togglePreview}
              className="w-full bg-secondary-500 hover:bg-secondary-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              Toggle State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintForm;
