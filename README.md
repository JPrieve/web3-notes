# Web3 Notes - Decentralized Note-Taking App

A full-stack Web3 application for creating, reading, updating, and deleting notes on the blockchain using React, TypeScript, wagmi, and Hardhat.

##  Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Git

##  Getting Started

### 1. Install Dependencies

`ash
npm install --legacy-peer-deps
`

### 2. Start the Local Blockchain

Open a terminal and run:

`ash
cd contracts
npx hardhat node
`

This will:
- Start a local blockchain at http://127.0.0.1:8545
- Create 20 test accounts, each with 10,000 ETH
- Keep running in the background (don't close this terminal)

**Important:** Save Account #0 details for MetaMask:
- **Address:** 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
- **Private Key:** 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

### 3. Deploy the Smart Contract

Open a **new terminal** (keep Hardhat node running) and run:

`ash
cd contracts
npx hardhat ignition deploy ignition/modules/Notes.ts --network localhost
`

You should see:
`
Deployed Addresses
NotesModule#Notes - 0x5FbDB2315678afecb367f032d93F642f64180aa3
`

### 4. Start the Frontend

Open a **third terminal** and run:

`ash
npm start
`

The app will open at http://localhost:3000

##  MetaMask Configuration

### Add Hardhat Local Network

1. Open MetaMask
2. Click the network dropdown (top center)
3. Click "Add Network"  "Add a network manually"
4. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
5. Click "Save"

### Import Test Account

1. In MetaMask, click the account icon (top right)
2. Select "Import Account"
3. Choose "Private Key"
4. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. Click "Import"

** WARNING:** This is a publicly known test account. ONLY use it on Hardhat Local network. Never use it on real networks!

### Switch to Hardhat Network

1. In MetaMask, click the network dropdown
2. Select "Hardhat Local"
3. You should see 10,000 ETH in your balance

##  Using the App

1. Go to http://localhost:3000
2. Click "Connect Wallet"
3. Approve the connection in MetaMask
4. Create, read, update, or delete notes
5. Each transaction will require MetaMask approval and cost gas (free test ETH)

##  After Reboot

When you restart your computer, you need to:

1. **Start Hardhat node** (Terminal 1):
   `ash
   cd contracts
   npx hardhat node
   `

2. **Redeploy the contract** (Terminal 2):
   `ash
   cd contracts
   npx hardhat ignition deploy ignition/modules/Notes.ts --network localhost
   `

3. **Start the frontend** (Terminal 3):
   `ash
   npm start
   `

The contract will deploy to the same address (0x5FbDB2315678afecb367f032d93F642f64180aa3) automatically, so no code changes are needed.

##  Project Structure

`
web3-notes/
 contracts/              # Smart contracts and Hardhat config
    contracts/         # Solidity contracts
       Notes.sol     # Main Notes contract
    ignition/         # Deployment modules
    scripts/          # Deployment scripts
    hardhat.config.ts # Hardhat configuration
 src/                   # React frontend
    components/       # React components
       Notes.tsx    # Main notes component
    App.tsx          # Main app component
    wagmiConfig.ts   # Web3 configuration
 public/               # Static assets
 config-overrides.js  # Webpack configuration for Web3

`

##  Tech Stack

- **Frontend:** React 19, TypeScript, wagmi, viem
- **Smart Contracts:** Solidity 0.8.28, Hardhat
- **Blockchain:** Ethereum (local Hardhat network)
- **Wallet:** MetaMask

##  Contract Address

- **Hardhat Local:** 0x5FbDB2315678afecb367f032d93F642f64180aa3

##  Troubleshooting

### Port already in use

If port 3000 or 8545 is already in use:

`ash
# Kill processes on port 3000 (frontend)
taskkill /F /IM node.exe

# Kill processes on port 8545 (Hardhat)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8545).OwningProcess -Force
`

### MetaMask shows 0 ETH

Make sure you:
1. Switched to "Hardhat Local" network in MetaMask
2. Imported the test account with the private key above
3. Hardhat node is running

### Contract not found error

Redeploy the contract:

`ash
cd contracts
npx hardhat ignition deploy ignition/modules/Notes.ts --network localhost
`

##  License

This project is for educational purposes.
