import chai, { expect } from 'chai'
import { Contract, Wallet, providers } from 'ethers'
import { solidity, deployContract } from 'ethereum-waffle'
import { ethers, waffle, network } from 'hardhat'

import { Ally, ICHIV2, OneToken, AllySwap } from "../typechain/";

chai.use(solidity)


interface AllyFixture {
  ally: Ally
  ichi: ICHIV2
  oneToken: OneToken
  allySwap: AllySwap
}

export async function allyFixture(
  [wallet]: Wallet[],
  provider: providers.Web3Provider
): Promise<AllyFixture> {
  // deploy Ally
  const { timestamp: now } = await provider.getBlock('latest')

  const oneTokenFactory = await ethers.getContractFactory('oneToken')
  const oneToken = (await oneTokenFactory.deploy()) as OneToken

  const ichiFactory = await ethers.getContractFactory('ICHIV2')
  const ichi = (await ichiFactory.deploy()) as ICHIV2

  const allyFactory = await ethers.getContractFactory('Ally')
  const ally = (await allyFactory.deploy(ichi.address, now + 60 * 60, 1095)) as Ally

  const allySwapFactory = await ethers.getContractFactory('AllySwap')
  const allySwap = (await allySwapFactory.deploy(oneToken.address, ally.address, "2000000000000000000")) as AllySwap

  return { ally, ichi, oneToken, allySwap }
}
