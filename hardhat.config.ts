import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  mocha: {
    timeout: 50000000, // timeout in milliseconds (~13 hours)
  },
};

export default config;
