import chai, { expect } from 'chai'
import { Contract, Wallet, providers } from 'ethers'
import { solidity, deployContract } from 'ethereum-waffle'
import { ethers, waffle, network } from 'hardhat'

import { Ally, ICHIV2 } from "../typechain/";

chai.use(solidity)

interface AllyFixture {
  ally: Ally
  ichi: ICHIV2
}

export async function allyFixture(
  [wallet]: Wallet[],
  provider: providers.Web3Provider
): Promise<AllyFixture> {
  // deploy Ally
  const { timestamp: now } = await provider.getBlock('latest')

  const ichiFactory = await ethers.getContractFactory('ICHIV2')
  const ichi = (await ichiFactory.deploy()) as ICHIV2

  const allyFactory = await ethers.getContractFactory('Ally')
  const ally = (await allyFactory.deploy(ichi.address, now + 60 * 60, 1095)) as Ally

  return { ally, ichi }
}
