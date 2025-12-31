// // utilis/walletFactory.js
// const { ethers } = require('ethers');
// const { Client, Presets } = require('@account-abstraction/sdk');
// const User = require('../model/user'); // ← FIXED PATH

// const provider = new ethers.JsonRpcProvider(
//   `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
// );
// const pimlicoEndpoint = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.PIMLICO_API_KEY}`;
// const deployer = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);

// const createAGW = async (userId) => {
//   const user = await User.findById(userId);
//   if (!user) throw new Error('User not found');

//   // ← EARLY RETURN if wallet already exists
//   if (user.walletAddress) {
//     console.log(`Wallet already exists: ${user.walletAddress}`);
//     return user.walletAddress;
//   }

//   try {
//     const client = await Client.init(pimlicoEndpoint);
//     const smartAccount = await Presets.Builder.SimpleAccount.init(deployer, pimlicoEndpoint);
//     const address = smartAccount.getSender();

//     user.walletAddress = address;
//     await user.save();

//     console.log(`AGW created: ${address}`);
//     return address;
//   } catch (err) {
//     console.error('AGW deploy failed:', err.message);
//     throw err;
//   }
// };

// module.exports = { createAGW };

// utilis/walletFactory.js
const { createSmartAccountClient } = require("@biconomy/account");
const { ethers } = require("ethers");
const User = require("../model/user");

const provider = new ethers.JsonRpcProvider(
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);

const createAGW = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.walletAddress) return user.walletAddress;

  try {
    const wallet = ethers.Wallet.createRandom().connect(provider);

    const smartAccount = await createSmartAccountClient({
      signer: wallet,
      chainId: 11155111,
      bundlerUrl: `https://bundler.biconomy.io/api/v2/11155111/${process.env.BICONOMY_API_KEY}`,
      biconomyPaymasterApiKey: process.env.BICONOMY_API_KEY,
    });

    const address = await smartAccount.getAccountAddress();

    user.walletAddress = address;
    user.eoaPrivateKey = wallet.privateKey; // Encrypt later
    await user.save();

    console.log("AGW created:", address);
    return address;
  } catch (err) {
    console.error("AGW failed:", err.message);
    throw err;
  }
};

module.exports = { createAGW };
