import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  mocha: {
    timeout: 50000000, // timeout in milliseconds (~13 hours)
  },

  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_RPC_URL || "",
        // blockNumber: 19900000, // optional: fixes state for reproducibility
      },
    },
  },
};

export default config;
