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

## Image Upload Feature

The application now features a user-friendly image upload system that allows users to directly upload images from their devices when minting NFTs, rather than requiring them to provide URLs.

### Key Features

- **Direct Image Upload**: Users can upload images directly from their devices
- **Cloud Storage with ImgBB**: Images are uploaded to ImgBB for permanent storage and accessibility across all devices
- **Local Storage Fallback**: If cloud upload fails, images fall back to browser's localStorage
- **File Validation**: Supports all image formats with a 10MB size limit
- **Image Preview**: Users can preview their uploaded images before minting

### Technical Implementation

The image upload system uses a two-tier approach:

1. **Primary Storage (ImgBB)**:
   - Images are uploaded to ImgBB's cloud storage via their API
   - This ensures images are accessible from any device and persist even if the user clears their browser data
   - Each image receives a permanent URL that's stored in the NFT metadata

2. **Fallback Storage (localStorage)**:
   - If the ImgBB upload fails (e.g., due to network issues), the system falls back to localStorage
   - Images are stored as base64 strings with unique keys
   - A pseudo-URL system (`local://[unique-key]`) is used to reference these locally stored images

### Configuration

To use the ImgBB integration, you need to:

1. Sign up for a free ImgBB account at https://api.imgbb.com/
2. Get your API key from the dashboard
3. Add your API key to the `.env` file:
   ```
   REACT_APP_IMGBB_API_KEY=your_imgbb_api_key_here
   ```

### User Experience

The enhanced image upload system provides a seamless experience:

1. Users click the file upload button or drag and drop an image
2. The image is processed and a preview is shown
3. When the user mints the NFT, the images are automatically uploaded to ImgBB
4. The permanent image URLs are stored in the NFT metadata
5. Images can be viewed from any device by anyone with access to the NFT

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
- ImgBB for providing a reliable image hosting service
