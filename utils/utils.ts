import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { LiquidityToken } from "../typechain-types";

export const DELAY = 60 * 60 * 24 * 2

export async function getCurrentTime(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    if (!block) throw new Error('Failed to fetch the latest block');
    return block.timestamp;
}

export async function getBlockNumber(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    if (!block) throw new Error('Failed to fetch the latest block');
    return block.number;
}

export async function getPermitSignature(signer: Signer, token: LiquidityToken, spender: Signer, value: BigInt, deadline: number) {
    const [nonce, name, version, chainId] = await Promise.all([
      (await (token.nonces(await signer.getAddress()))).toString(),
      token.name(),
      "1",
      ((await signer.provider?.getNetwork())?.chainId)?.toString(),
    ])
  
    return ethers.Signature.from(
      await signer.signTypedData(
        {
          name,
          version,
          chainId,
          verifyingContract: await token.getAddress(),
        },
        {
          Permit: [
            {
              name: "owner",
              type: "address",
            },
            {
              name: "spender",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          owner: await signer.getAddress(),
          spender: await spender.getAddress(),
          value: value.toString(),
          nonce: nonce.toString(),
          deadline: deadline.toString(),
        }
      )
    )
  }