import { ethers } from 'hardhat';
import {
    LiquidityToken,
    LiquidityToken__factory,
    Tokenator,
    Tokenator__factory,
} from '../typechain-types';

export interface TokenatorFixture {
    liquidityToken: LiquidityToken;
    tokenator: Tokenator;
}

export async function allyFixture(): Promise<TokenatorFixture> {
    // Get the deployer signer
    const [deployer] = await ethers.getSigners();

    // Get current block timestamp
    const block = await ethers.provider.getBlock('latest');
    if (!block) {
        throw new Error('Failed to fetch the latest block');
    }
    const now = block.timestamp;

    // Deploy liquidity token contract
    const liquidityTokenFactory = new LiquidityToken__factory(deployer);
    const liquidityToken = await liquidityTokenFactory.deploy("LT", "LT", ethers.parseUnits('75000000', 18));
    await liquidityToken.waitForDeployment();

    // Get the deployed contract addresses
    const liquidityTokenAddress = await liquidityToken.getAddress();

    // Deploy Tokenator contract
    const tokenatorFactory = new Tokenator__factory(deployer);
    const tokenator = await tokenatorFactory.deploy("TOKE", "TOKE", liquidityTokenAddress, now + 60 * 60, 1095);
    await tokenator.waitForDeployment();

    //   // Get the deployed contract addresses
    //   const oneTokenAddress = await oneToken.getAddress();
    //   const allyAddress = await ally.getAddress();

    //   // Deploy AllySwap contract
    //   const allySwapFactory = new AllySwap__factory(deployer);
    //   const allySwap = await allySwapFactory.deploy(
    //     oneTokenAddress,
    //     allyAddress,
    //     '2000000000000000000'
    //   );
    //   await allySwap.waitForDeployment();

    return { liquidityToken, tokenator };
}
