import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Your Notes contract address and ABI
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const NOTES_ABI = [
    "function createNote(string title, string content, bool isPublic) returns (uint256)",
    "function getUserNotes(address user) view returns (tuple(uint256 id, address author, string title, string content, uint256 createdAt, uint256 updatedAt, bool isPublic, bool isPinned, uint256 tipsReceived, uint256 version)[])",
    "event NoteCreated(uint256 indexed noteId, address indexed author, string title, bool isPublic)"
  ];
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, NOTES_ABI, provider);
  
  console.log("\n🔍 Analyzing Blockchain Data Storage\n");
  console.log("=".repeat(70));
  
  // Get recent blocks and decode transactions
  const blockNumber = await provider.getBlockNumber();
  console.log(`\n📊 Current Block: ${blockNumber}\n`);
  
  // Look at recent transactions
  for (let i = Math.max(1, blockNumber - 2); i <= blockNumber; i++) {
    const block = await provider.getBlock(i, true);
    
    if (block && block.transactions.length > 0) {
      console.log(`\n📦 Block #${i} - ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log("-".repeat(70));
      
      for (const tx of block.transactions) {
        if (typeof tx !== 'string' && tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
          console.log(`\n  🔗 Transaction: ${tx.hash}`);
          console.log(`  📤 From: ${tx.from}`);
          console.log(`  📥 To: ${tx.to}`);
          console.log(`  ⛽ Gas Used: ${tx.gasLimit.toString()}`);
          
          // Decode the transaction input data
          try {
            const iface = new ethers.Interface(NOTES_ABI);
            const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
            
            if (decoded) {
              console.log(`\n  📝 Function Called: ${decoded.name}`);
              console.log(`  📋 Parameters:`);
              
              decoded.args.forEach((arg, index) => {
                const param = decoded.fragment.inputs[index];
                console.log(`    - ${param.name}: ${arg}`);
              });
            }
          } catch (e) {
            console.log(`  ⚠️  Could not decode transaction data`);
          }
          
          // Get the transaction receipt to see events
          const receipt = await provider.getTransactionReceipt(tx.hash);
          if (receipt && receipt.logs.length > 0) {
            console.log(`\n  📢 Events Emitted:`);
            for (const log of receipt.logs) {
              try {
                const iface = new ethers.Interface(NOTES_ABI);
                const parsedLog = iface.parseLog({ topics: log.topics as string[], data: log.data });
                if (parsedLog) {
                  console.log(`    - Event: ${parsedLog.name}`);
                  parsedLog.args.forEach((arg, idx) => {
                    const input = parsedLog.fragment.inputs[idx];
                    console.log(`      ${input.name}: ${arg}`);
                  });
                }
              } catch (e) {
                // Not a Notes contract event
              }
            }
          }
        }
      }
    }
  }
  
  // Now show the actual stored data in contract storage
  console.log("\n\n💾 CONTRACT STORAGE (Where content is actually stored)");
  console.log("=".repeat(70));
  
  // Get the first account's notes
  const accounts = await provider.listAccounts();
  if (accounts.length > 0) {
    const userAddress = accounts[0].address;
    console.log(`\n👤 Reading notes for: ${userAddress}\n`);
    
    try {
      const notes = await contract.getUserNotes(userAddress);
      
      if (notes.length === 0) {
        console.log("  No notes stored yet.");
      } else {
        notes.forEach((note: any, index: number) => {
          console.log(`\n  📝 Note #${index + 1}`);
          console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`  ID: ${note.id.toString()}`);
          console.log(`  Title: "${note.title}"`);
          console.log(`  Content: "${note.content}"`);
          console.log(`  Author: ${note.author}`);
          console.log(`  Created: ${new Date(Number(note.createdAt) * 1000).toLocaleString()}`);
          console.log(`  Public: ${note.isPublic}`);
          console.log(`  Pinned: ${note.isPinned}`);
          console.log(`  Version: ${note.version.toString()}`);
        });
      }
    } catch (e) {
      console.log(`  ⚠️  Error reading notes: ${e}`);
    }
  }
  
  console.log("\n\n💡 KEY CONCEPTS:");
  console.log("=".repeat(70));
  console.log(`
  1. TRANSACTION DATA (in blocks):
     - Contains the function call and input parameters
     - Encoded in the transaction's 'data' field
     - Visible in the blockchain but encoded
  
  2. CONTRACT STORAGE (persistent state):
     - Where your notes are actually stored
     - Organized in mappings and arrays
     - Only readable via contract function calls
     - Not directly visible in block data
  
  3. EVENTS (in transaction receipts):
     - Logged outputs from transactions
     - Indexed for easy searching
     - Can include partial data (like note ID and title)
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
