import { ethers } from 'hardhat';

export const DELAY = 60 * 60 * 24 * 2

export async function getCurrentTime(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    if (!block) throw new Error('Failed to fetch the latest block');
    return block.timestamp;
}