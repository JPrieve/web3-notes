import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get current block number
  const blockNumber = await provider.getBlockNumber();
  console.log(`\n📊 Current Block Number: ${blockNumber}`);
  console.log("=".repeat(60));
  
  // Get the latest block
  const latestBlock = await provider.getBlock(blockNumber);
  
  if (latestBlock) {
    console.log("\n🔷 Latest Block Details:");
    console.log(`  Block Number: ${latestBlock.number}`);
    console.log(`  Block Hash: ${latestBlock.hash}`);
    console.log(`  Parent Hash: ${latestBlock.parentHash}`);
    console.log(`  Timestamp: ${latestBlock.timestamp} (${new Date(latestBlock.timestamp * 1000).toLocaleString()})`);
    console.log(`  Transactions: ${latestBlock.transactions.length}`);
    console.log(`  Gas Used: ${latestBlock.gasUsed.toString()}`);
    console.log(`  Gas Limit: ${latestBlock.gasLimit.toString()}`);
    console.log(`  Miner: ${latestBlock.miner}`);
    
    // Show transactions in the block
    if (latestBlock.transactions.length > 0) {
      console.log("\n📝 Transactions in this block:");
      for (let i = 0; i < latestBlock.transactions.length; i++) {
        const txHash = latestBlock.transactions[i];
        const tx = await provider.getTransaction(txHash);
        if (tx) {
          console.log(`  ${i + 1}. ${tx.hash}`);
          console.log(`     From: ${tx.from}`);
          console.log(`     To: ${tx.to || 'Contract Creation'}`);
          console.log(`     Value: ${ethers.formatEther(tx.value)} ETH`);
        }
      }
    }
  }
  
  // Show last 5 blocks
  console.log("\n\n📚 Last 5 Blocks:");
  console.log("=".repeat(60));
  
  const startBlock = Math.max(0, blockNumber - 4);
  for (let i = blockNumber; i >= startBlock; i--) {
    const block = await provider.getBlock(i);
    if (block) {
      console.log(`\nBlock #${block.number}`);
      console.log(`  Hash: ${block.hash}`);
      console.log(`  Time: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log(`  Transactions: ${block.transactions.length}`);
      console.log(`  Gas Used: ${block.gasUsed.toString()}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
