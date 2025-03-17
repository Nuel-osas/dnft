import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { uploadImageToImgBB, storeImageLocally, getStoredImage } from './imageUtils';

// Initialize the SuiClient for testnet
const client = new SuiClient({
  url: 'https://fullnode.testnet.sui.io',
});

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = '0x0e92dd08f4f41c971626e4e0e50247bec51c147d66825ae0a2d81688de857119'; // Package ID for the dynamic NFT contract
const TIME_ORACLE_ID = '0x241a5481ba6a9d433d7793c4c8bde354cad998e8ec8d0c21c75e48746b5b823c'; // Time Oracle object ID

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
            name: display?.name || content?.fields?.name || 'Unnamed NFT',
            description: display?.description || content?.fields?.description || '',
            currentState: parseInt(content?.fields?.current_state) || 0,
            imageOne,
            imageTwo,
            currentImage,
            lastUpdated: parseInt(content?.fields?.last_updated) || Date.now(),
            updateInterval: parseInt(content?.fields?.update_interval) || 300, // Get individual update interval
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
      // Process and upload the images to ImgBB in parallel
      let processedImageOne, processedImageTwo;
      
      try {
        // Try to upload both images to ImgBB in parallel
        const uploadPromises = [];
        
        if (imageOne.startsWith('data:')) {
          uploadPromises.push(
            uploadImageToImgBB(imageOne, `${name}_state0`)
              .then(url => { processedImageOne = url; })
              .catch(error => {
                processedImageOne = storeImageLocally(imageOne, `${name}_state0`);
              })
          );
        } else {
          processedImageOne = imageOne;
        }
        
        if (imageTwo.startsWith('data:')) {
          uploadPromises.push(
            uploadImageToImgBB(imageTwo, `${name}_state1`)
              .then(url => { processedImageTwo = url; })
              .catch(error => {
                processedImageTwo = storeImageLocally(imageTwo, `${name}_state1`);
              })
          );
        } else {
          processedImageTwo = imageTwo;
        }
        
        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
        
      } catch (error) {
        console.error('Error uploading images:', error);
        // Fall back to local storage if ImgBB upload fails
        processedImageOne = imageOne.startsWith('data:') ? 
          storeImageLocally(imageOne, `${name}_state0`) : imageOne;
        processedImageTwo = imageTwo.startsWith('data:') ? 
          storeImageLocally(imageTwo, `${name}_state1`) : imageTwo;
      }
      
      // Create a new transaction block
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
          tx.object(TIME_ORACLE_ID), // Time Oracle object ID to get default interval
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
  
  // Update the default interval for the time oracle (admin only)
  async updateDefaultInterval(signer, adminCapId, newIntervalSeconds) {
    try {
      const tx = new TransactionBlock();
      
      // Set gas budget explicitly to avoid dry run failures
      tx.setGasBudget(10000000);
      
      // Call the change_default_interval function from our smart contract
      tx.moveCall({
        target: `${CONTRACT_ADDRESS}::dynamic_nft::change_default_interval`,
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
      console.error('Error updating default interval:', error);
      throw error;
    }
  },
  
  // Update the interval for a specific NFT (owner only)
  async updateNFTInterval(signer, nftId, newIntervalSeconds) {
    try {
      const tx = new TransactionBlock();
      
      // Set gas budget explicitly to avoid dry run failures
      tx.setGasBudget(10000000);
      
      // Call the change_nft_interval function from our smart contract
      tx.moveCall({
        target: `${CONTRACT_ADDRESS}::dynamic_nft::change_nft_interval`,
        arguments: [
          tx.object(nftId), // NFT object ID
          tx.pure(newIntervalSeconds.toString()), // New interval in seconds
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
      console.error('Error updating NFT interval:', error);
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
      const isAdmin = objects.data.some(obj => {
        const type = obj.data?.type;
        return type && type.includes(`${CONTRACT_ADDRESS}::dynamic_nft::AdminCap`);
      });
      
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  // Get the current default interval from the time oracle
  async getDefaultInterval() {
    try {
      const oracle = await client.getObject({
        id: TIME_ORACLE_ID,
        options: {
          showContent: true,
        },
      });
      
      const interval = oracle.data?.content?.fields?.update_interval;
      return interval ? parseInt(interval) : 300; // Default to 5 minutes if not found
    } catch (error) {
      console.error('Error getting default interval:', error);
      return 300; // Default to 5 minutes
    }
  },
  
  // Check if an NFT is due for an update
  isUpdateDue(nft) {
    const currentTime = Date.now();
    return currentTime >= nft.lastUpdated + (nft.updateInterval * 1000);
  }
};

export default suiUtils;
