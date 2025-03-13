import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { uploadImageToImgBB, storeImageLocally, getStoredImage } from './imageUtils';

// Initialize the SuiClient for testnet
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io',
});

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = '0x858b87cea4a8af5dcf0f9ffe13b06a37e120ed4041e43d490f831abf37b4ce4b'; // Package ID for the dynamic NFT contract
const TIME_ORACLE_ID = '0x784613592ff44a7424af93ddd3af33c5268dc6bedf04b5eace9811d6b10c6a78'; // Time Oracle object ID

// Utility functions for interacting with the smart contract
export const suiUtils = {
  // Get NFTs owned by the current wallet
  async getNFTsForWallet(walletAddress) {
    try {
      const objects = await client.getOwnedObjects({
        owner: walletAddress,
        options: {
          showContent: true,
          showDisplay: true,
        },
      });
      
      // Filter for our specific NFT type
      return objects.data
        .filter(obj => {
          const type = obj.data?.content?.type;
          return type && type.includes(`${CONTRACT_ADDRESS}::dynamic_nft::DynamicNFT`);
        })
        .map(obj => {
          const content = obj.data?.content;
          const display = obj.data?.display;
          
          // Get the image URLs and resolve any local storage references
          let imageOne = content?.fields?.image_one || '';
          let imageTwo = content?.fields?.image_two || '';
          let currentImage = content?.fields?.current_image || '';
          
          // Resolve local storage references if needed
          imageOne = getStoredImage(imageOne);
          imageTwo = getStoredImage(imageTwo);
          currentImage = getStoredImage(currentImage);
          
          return {
            id: obj.data.objectId,
            name: display?.name || 'Unnamed NFT',
            description: display?.description || '',
            currentState: content?.fields?.current_state || 0,
            imageOne,
            imageTwo,
            currentImage,
            lastUpdated: parseInt(content?.fields?.last_updated) || Date.now(),
          };
        });
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  },
  
  // Get the AdminCap object for the current wallet
  async getAdminCap(walletAddress) {
    try {
      const objects = await client.getOwnedObjects({
        owner: walletAddress,
        options: {
          showType: true,
          showContent: true,
        },
      });
      
      // Filter for AdminCap objects
      return objects.data
        .filter(obj => {
          const type = obj.data?.type;
          return type && type.includes(`${CONTRACT_ADDRESS}::dynamic_nft::AdminCap`);
        });
    } catch (error) {
      console.error('Error fetching AdminCap:', error);
      return [];
    }
  },
  
  // Mint a new NFT
  async mintNFT(signer, { name, description, imageOne, imageTwo }) {
    try {
      // Process and upload the images to ImgBB
      let processedImageOne, processedImageTwo;
      
      try {
        // Try to upload to ImgBB first
        if (imageOne.startsWith('data:')) {
          processedImageOne = await uploadImageToImgBB(imageOne, `${name}_state0`);
        } else {
          processedImageOne = imageOne;
        }
        
        if (imageTwo.startsWith('data:')) {
          processedImageTwo = await uploadImageToImgBB(imageTwo, `${name}_state1`);
        } else {
          processedImageTwo = imageTwo;
        }
      } catch (error) {
        console.warn('Failed to upload to ImgBB, falling back to local storage:', error);
        // Fall back to local storage if ImgBB upload fails
        processedImageOne = imageOne.startsWith('data:') ? 
          storeImageLocally(imageOne, `${name}_state0`) : imageOne;
        
        processedImageTwo = imageTwo.startsWith('data:') ? 
          storeImageLocally(imageTwo, `${name}_state1`) : imageTwo;
      }
      
      const tx = new TransactionBlock();
      
      // Set gas budget explicitly to avoid dry run failures
      tx.setGasBudget(10000000);
      
      // Call the mint_nft function from our smart contract
      tx.moveCall({
        target: `${CONTRACT_ADDRESS}::dynamic_nft::mint_nft`,
        arguments: [
          tx.pure(processedImageOne),
          tx.pure(processedImageTwo),
          tx.pure(name),
          tx.pure(description),
          tx.object('0x6'), // Clock object ID
          // Context is automatically provided by the transaction
        ],
      });
      
      // Execute the transaction
      const result = await signer.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  },
  
  // Update the state of an NFT
  async updateNFTState(signer, nftId) {
    try {
      const tx = new TransactionBlock();
      
      // Set gas budget explicitly to avoid dry run failures
      tx.setGasBudget(10000000);
      
      // Call the update_nft_state function from our smart contract
      tx.moveCall({
        target: `${CONTRACT_ADDRESS}::dynamic_nft::update_nft_state`,
        arguments: [
          tx.object(TIME_ORACLE_ID), // Time Oracle object ID
          tx.object(nftId), // NFT object ID
          tx.object('0x6'), // Clock object ID
          // Context is automatically provided by the transaction
        ],
      });
      
      // Execute the transaction
      const result = await signer.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Error updating NFT state:', error);
      throw error;
    }
  },
  
  // Update the interval for the time oracle (admin only)
  async updateTimeInterval(signer, adminCapId, newIntervalSeconds) {
    try {
      const tx = new TransactionBlock();
      
      // Set gas budget explicitly to avoid dry run failures
      tx.setGasBudget(10000000);
      
      // Call the update_interval function from our smart contract
      tx.moveCall({
        target: `${CONTRACT_ADDRESS}::dynamic_nft::update_interval`,
        arguments: [
          tx.object(adminCapId), // Admin capability object ID
          tx.object(TIME_ORACLE_ID), // Time Oracle object ID
          tx.pure(newIntervalSeconds.toString()), // New interval in seconds
          // Context is automatically provided by the transaction
        ],
      });
      
      // Execute the transaction
      const result = await signer.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Error updating time interval:', error);
      throw error;
    }
  },
  
  // Check if the current wallet has admin capability
  async checkAdminStatus(walletAddress) {
    try {
      const objects = await client.getOwnedObjects({
        owner: walletAddress,
        options: {
          showType: true,
        },
      });
      
      // Check if any of the objects is an AdminCap
      return objects.data.some(obj => {
        const type = obj.data?.type;
        return type && type.includes(`${CONTRACT_ADDRESS}::dynamic_nft::AdminCap`);
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  // Get the current interval from the time oracle
  async getCurrentInterval() {
    try {
      const object = await client.getObject({
        id: TIME_ORACLE_ID,
        options: {
          showContent: true,
        },
      });
      
      const interval = object.data?.content?.fields?.interval;
      return interval ? parseInt(interval) : 300; // Default to 5 minutes if not found
    } catch (error) {
      console.error('Error getting current interval:', error);
      return 300; // Default to 5 minutes
    }
  },
};

export default suiUtils;
