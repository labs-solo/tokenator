import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    berachainTestnet: {
      url: process.env.BERACHAIN_TESTNET_RPC_URL || "",
      accounts: [process.env.BERACHAIN_TESTNET_DEPLOYER_PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: {
      berachainTestnet: "placeholder", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "berachainTestnet",
        chainId: 80084,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/80084/etherscan",
          browserURL: "https://bartio.beratrail.io"
        }
      }
    ]
  }
};

export default config;
