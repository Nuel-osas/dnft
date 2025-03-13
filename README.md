# Dynamic NFT Application

A full-stack decentralized application for minting and managing Dynamic NFTs on the Sui blockchain. This application demonstrates how NFTs can change their appearance based on time intervals, creating an interactive and evolving digital asset experience.

## Features

### Smart Contract Capabilities
- **Dynamic State Changes**: NFTs automatically change their visual state based on configurable time intervals
- **Admin Controls**: Authorized users can modify the time oracle settings
- **On-chain Verification**: All state changes are verified and recorded on the Sui blockchain

### Frontend Application
- **Wallet Integration**: Seamless connection with Sui wallets using Mysten Wallet Kit
- **NFT Minting**: User-friendly interface for creating new dynamic NFTs
- **Direct Image Upload**: Upload images directly without needing external hosting
- **NFT Management**: View and update your NFT collection
- **Time-based Updates**: Visual countdown timer showing when NFTs can be updated
- **Admin Panel**: Special controls for admin users to manage the time oracle

## Project Structure

The project consists of two main components:

### 1. Smart Contract (`color_changing_nft`)
- Written in Move language for the Sui blockchain
- Implements the dynamic NFT logic and time oracle
- Manages state changes and access control

### 2. Frontend Application (`color_changing_nft_frontend`)
- React-based web application
- Integrates with the Sui blockchain using Mysten Wallet Kit
- Provides a user interface for all NFT operations

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Sui wallet (such as Sui Wallet browser extension)
- Access to Sui testnet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dynamic-nft-app.git
cd dynamic-nft-app
```

2. Install frontend dependencies:
```bash
cd color_changing_nft_frontend
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Connecting Your Wallet
1. Click the "Connect Wallet" button in the top-right corner
2. Select your preferred Sui wallet
3. Approve the connection request

### Minting a New NFT
1. Navigate to the "Mint New NFT" tab
2. Fill in the NFT details:
   - Name: Give your NFT a unique name
   - Description: Describe what makes your NFT special
   - Image for State 0: Upload an image file directly from your device
   - Image for State 1: Upload another image file for the alternate state
3. Click "Mint NFT" and approve the transaction in your wallet
4. Wait for the transaction to be confirmed on the blockchain

### Viewing Your NFT Collection
1. Navigate to the "My Collection" tab
2. View all your dynamic NFTs with their current state
3. See when each NFT was last updated and when it can be updated next

### Updating NFT State
1. In the "My Collection" tab, find the NFT you want to update
2. Check the countdown timer to see if an update is possible
3. When ready, click the "Update NFT State" button
4. Approve the transaction in your wallet
5. The NFT will switch to its alternate state

### Managing Time Oracle (Admin Only)
1. If you have admin privileges, navigate to the "Time Oracle" tab
2. View the current update interval
3. Set a new interval by entering the time in seconds
4. Click "Update Interval" and approve the transaction

## Technical Details

### Smart Contract
- **Package ID**: `0x858b87cea4a8af5dcf0f9ffe13b06a37e120ed4041e43d490f831abf37b4ce4b`
- **Time Oracle ID**: `0x784613592ff44a7424af93ddd3af33c5268dc6bedf04b5eace9811d6b10c6a78`
- **Network**: Sui Testnet

### Frontend Technologies
- React.js
- Tailwind CSS for styling
- @mysten/wallet-kit for wallet integration
- @mysten/sui.js for blockchain interactions

### Image Storage Implementation
- **Client-side Storage**: Images are stored directly in the browser's localStorage
- **Base64 Encoding**: Uploaded images are converted to base64 strings for efficient storage
- **Pseudo-URL System**: A unique URL-like identifier (`local://[unique-key]`) is generated for each image
- **Automatic Retrieval**: The system automatically retrieves and displays stored images when viewing NFTs

#### How Image Upload Works
1. When a user uploads an image, the file is read using the FileReader API
2. The image is converted to a base64 data URL string
3. The `storeImage` function generates a unique key using timestamps and random strings
4. The image data is stored in localStorage with this key
5. A pseudo-URL in the format `local://[unique-key]` is passed to the smart contract
6. When displaying NFTs, the `getStoredImage` function retrieves the image data from localStorage

#### Benefits of This Approach
- **No Technical Knowledge Required**: Users don't need to know how to host images online
- **Simplified User Experience**: Direct upload instead of URL copying/pasting
- **No External Dependencies**: No need for external services like Cloudinary or Firebase
- **Persistent Storage**: Images remain available even after browser refreshes
- **Privacy**: Images are stored locally on the user's device

## How It Works

1. **NFT Creation**: When you mint an NFT, you upload two images directly and the NFT starts in state 0 (first image)
2. **Time Oracle**: A shared object on the blockchain tracks the time interval between allowed updates
3. **State Updates**: After the specified time interval has passed, you can update your NFT to toggle between states
4. **Admin Control**: Administrators can adjust the time interval, affecting all NFTs in the system

## Security Considerations

- All transactions require wallet signatures for verification
- Admin functions are protected by capability-based access control
- Time-based restrictions prevent excessive state changes

## Troubleshooting

### Common Issues

**Transaction Failed - Dry Run Error**
- This usually indicates a gas budget issue
- The application now sets explicit gas budgets to avoid this

**Cannot Update NFT - Time Restriction**
- NFTs can only be updated after the specified time interval has passed
- Check the countdown timer to see when an update will be possible

**Wallet Connection Issues**
- Make sure your wallet is on the Sui testnet network
- Try disconnecting and reconnecting your wallet

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Sui Foundation for the blockchain infrastructure
- Mysten Labs for the wallet integration tools
- The Move language community for smart contract development resources
