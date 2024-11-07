const { ethers, upgrades, network } = require("hardhat");
require("dotenv").config();

async function main() {
  // Get deployer from private key
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await provider.getBalance(deployer.address)).toString()
  );

  // Deploy Fuse token
  const Fuse = await ethers.getContractFactory("Fuse", deployer);
  console.log("Deploying Fuse token...");

  const fuse = await upgrades.deployProxy(Fuse, [], {
    initializer: "initialize",
  });
  await fuse.waitForDeployment();

  const fuseAddress = await fuse.getAddress();
  console.log("Fuse token deployed to:", fuseAddress);

  // Verify contract if on a supported network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    try {
      // Get implementation address
      const implementationAddress =
        await upgrades.erc1967.getImplementationAddress(fuseAddress);
      console.log("Implementation contract address:", implementationAddress);

      // Verify implementation contract
      await run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      console.log("Implementation contract verified");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
