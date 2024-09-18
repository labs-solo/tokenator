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
