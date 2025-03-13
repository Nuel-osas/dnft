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
  
  // Add state for file uploads
  const [imageOneFile, setImageOneFile] = useState(null);
  const [imageTwoFile, setImageTwoFile] = useState(null);
  const [isUploading, setIsUploading] = useState({ imageOne: false, imageTwo: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle file uploads
  const handleFileUpload = (e, stateNumber) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please upload an image smaller than 10MB.');
      return;
    }
    
    // Set uploading state
    if (stateNumber === 0) {
      setIsUploading(prev => ({ ...prev, imageOne: true }));
    } else {
      setIsUploading(prev => ({ ...prev, imageTwo: true }));
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      
      // Store in state based on which image is being uploaded
      if (stateNumber === 0) {
        setImageOneFile(file);
        setFormData({
          ...formData,
          imageOne: base64String,
        });
        setIsUploading(prev => ({ ...prev, imageOne: false }));
      } else {
        setImageTwoFile(file);
        setFormData({
          ...formData,
          imageTwo: base64String,
        });
        setIsUploading(prev => ({ ...prev, imageTwo: false }));
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setIsUploading(prev => ({ ...prev, imageOne: false, imageTwo: false }));
    };
    
    reader.readAsDataURL(file);
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
      setImageOneFile(null);
      setImageTwoFile(null);
      
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
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Image for State 0 *
            </label>
            <div className="flex flex-col space-y-2">
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <input
                  type="file"
                  id="imageOneUpload"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 0)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  disabled={isUploading.imageOne}
                />
                {isUploading.imageOne && (
                  <div className="mt-2 flex items-center text-sm text-primary-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing image...
                  </div>
                )}
                {imageOneFile && !isUploading.imageOne && (
                  <div className="mt-2 text-sm text-gray-500">
                    Selected: {imageOneFile.name} ({Math.round(imageOneFile.size / 1024)} KB)
                  </div>
                )}
              </div>
              {formData.imageOne && !isUploading.imageOne && (
                <div className="h-20 w-20 border border-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={formData.imageOne} 
                    alt="State 0 Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Image for State 1 *
            </label>
            <div className="flex flex-col space-y-2">
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <input
                  type="file"
                  id="imageTwoUpload"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 1)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  disabled={isUploading.imageTwo}
                />
                {isUploading.imageTwo && (
                  <div className="mt-2 flex items-center text-sm text-primary-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing image...
                  </div>
                )}
                {imageTwoFile && !isUploading.imageTwo && (
                  <div className="mt-2 text-sm text-gray-500">
                    Selected: {imageTwoFile.name} ({Math.round(imageTwoFile.size / 1024)} KB)
                  </div>
                )}
              </div>
              {formData.imageTwo && !isUploading.imageTwo && (
                <div className="h-20 w-20 border border-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={formData.imageTwo} 
                    alt="State 1 Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="submit"
              disabled={isSubmitting || isUploading.imageOne || isUploading.imageTwo}
              className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors ${(isSubmitting || isUploading.imageOne || isUploading.imageTwo) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                <p>Upload images to see preview</p>
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
