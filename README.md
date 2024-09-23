# Tokenator
The Tokenator contract is an ERC-20 token that enables distribution of a configured underlying token over time. Holders of the Tokenator token have the ability to claim an amount of the underlying token proportional to how much of Tokenator they hold relative to the total supply, and how much of the underlying token the Tokenator contract holds. This claimable amount is fully matured once the claim duration has ended. Tokenator holders can claim before the duration has ended, but lose out on an amount of the underlying token proportional to how much longer is left in the claim duration - to the benefit of users still holding Tokenator.

## Setup
Switch to the correct version of node
```
nvm use
```

Install npm packages
```
npm install
```

To run test
```
npx hardhat tests
```


## Deployment
This repository uses Hardhat Ignition for contract deployment
https://hardhat.org/ignition/docs/getting-started#overview

To deploy SIP (an instantion of LiquidityToken) on Berachain bArtio testnet, run:
```
npx hardhat ignition deploy ignition/modules/SIP.ts --parameters ignition/parameters.json --network berachainTestnet --verify
```

To deploy MockAegisLP (an instantion of MockERC20) on Berachain bArtio testnet, run:
```
npx hardhat ignition deploy ignition/modules/MockAegisLP.ts --parameters ignition/parameters.json --network berachainTestnet --verify
```

To deploy JUG (an instantiation of Tokenator) on Berachain bArtio testnet, run:
```
npx hardhat ignition deploy ignition/modules/JUG.ts --parameters ignition/parameters.json --network berachainTestnet --verify
```

If any contract verifications fail, the following command can be ran to retry verification:
```
npx hardhat ignition verify chain-80084 --include-unrelated-contracts
```