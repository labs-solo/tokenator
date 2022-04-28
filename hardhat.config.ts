import "hardhat-typechain";
import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
require("hardhat-gas-reporter");
require("dotenv").config();
const mnemonic =
  process.env.DEV_MNEMONIC ||
  "test test test test test test test test test test test junk";

export default {
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 120,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      chainId: parseInt(process.env.CHAIN_ID!) || 1,
      live: false,
      saveDeployments: true,
      allowUnlimitedContractSize: false,
      tags: ["test", "local", "ethereum", "polygon"],
      accounts: {
        mnemonic,
      },
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
      accounts: {
        mnemonic,
      },
      //url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.MAINNET_ALCHEMY_API_KEY}`,
      //accounts: [`0x${process.env.ICHI_LAUNCH}`],
      chainId: 1,
      saveDeployments: true,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  watcher: {
    compilation: {
      tasks: ["compile"],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
    }
  },
  mocha: {
    timeout: 2000000,
  },
};
