import hre from "hardhat";

async function main() {
  console.log("Deploying Notes contract...");

  const notes = await hre.viem.deployContract("Notes", []);

  console.log(`Notes contract deployed to: ${notes.address}`);
  console.log("\nTo use this contract in your frontend:");
  console.log(`1. Update CONTRACT_ADDRESS to: ${notes.address}`);
  console.log(`2. Make sure you're connected to the local Hardhat network`);
  console.log(`3. The contract is ready to create, read, update, and delete notes!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});