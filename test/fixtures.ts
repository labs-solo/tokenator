import { ethers } from 'hardhat';
import {
    LiquidityToken,
    LiquidityToken__factory,
    Tokenator,
    Tokenator__factory,
    MockERC20,
    MockERC20__factory
} from '../typechain-types';
import { Mock } from 'node:test';

export interface TokenatorFixture {
    liquidityToken: LiquidityToken;
    underlyingToken: MockERC20;
    tokenator: Tokenator;
}

export async function tokenatorFixture(): Promise<TokenatorFixture> {
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
    const liquidityTokenAddress = await liquidityToken.getAddress();

    // Deploy mock underlying token contract
    const underlyingTokenFactory = new MockERC20__factory(deployer);
    const underlyingToken = await underlyingTokenFactory.deploy("UNDER", "UNDER", ethers.parseUnits('10000000', 18));
    await underlyingToken.waitForDeployment();
    const mockUnderlyingTokenAddress = await underlyingToken.getAddress();

    // Deploy Tokenator contract
    const tokenatorFactory = new Tokenator__factory(deployer);
    const tokenator = await tokenatorFactory.deploy("TOKE", "TOKE", ethers.parseUnits('10000000', 18), mockUnderlyingTokenAddress, now + 60 * 60, 1095);
    await tokenator.waitForDeployment();

    return { liquidityToken, underlyingToken, tokenator };
}
