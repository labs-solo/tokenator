import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const BARTIO_RPC_URL = process.env.BARTIO_RPC_URL || "";
const BARTIO_DEPLOYER_PRIVATE_KEY = process.env.BARTIO_DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    bartio: {
      url: BARTIO_RPC_URL,
      accounts: [BARTIO_DEPLOYER_PRIVATE_KEY],
    },
  },
};

export default config;
