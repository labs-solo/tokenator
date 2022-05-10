import chai, { expect } from 'chai'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { ethers, waffle, network } from 'hardhat'

import { allyFixture } from './fixtures'
import { mineBlock } from './utils'

import { ICHIV2, Ally, AllySwap, OneToken } from "../typechain";

chai.use(solidity)

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const ONE_MIL = "1000000000000000000000000";
const HALF_MIL = "500000000000000000000000";

const createFixtureLoader = waffle.createFixtureLoader

describe('AllySwap', () => {
  const provider = waffle.provider;
  const [wallet, other0, other1, other2] = provider.getWallets()

  let ally: Ally
  let ichi: ICHIV2
  let allySwap: AllySwap
  let oneToken: OneToken

  let loadFixture: ReturnType<typeof createFixtureLoader>
  before('create fixture loader', async () => {
    loadFixture = createFixtureLoader([wallet], provider)
  })

  beforeEach(async () => {
    const fixture = await loadFixture(allyFixture)
    ichi = fixture.ichi
    ally = fixture.ally
    oneToken = fixture.oneToken
    allySwap = fixture.allySwap
  })

  it('constructor', async () => {
    const allySwapFactory = await ethers.getContractFactory('AllySwap')

    let allySwap = await allySwapFactory.deploy(oneToken.address, ally.address, "200000")
    let tx = allySwap.deployTransaction
    await expect(tx)
      .to.emit(allySwap, 'Deployed').withArgs(wallet.address, oneToken.address, ally.address, "200000");
  })

  it('sets #isAgreedToTerms', async () => {
    let termsHash = await allySwap.termsHash(wallet.address);
    expect(await allySwap.isAgreedToTerms(wallet.address)).to.eq(false)
    await expect(allySwap.connect(wallet).consentAndAgreeToTerms(termsHash)).to.emit(allySwap, 'AgreedToTerms')
      .withArgs(oneToken.address, wallet.address, termsHash)
    expect(await allySwap.isAgreedToTerms(wallet.address)).to.eq(true)
  })

  it('cannot agree to terms twice', async () => {
    const msg = "AllySwap: T&C already approved.";
    let termsHash = await allySwap.termsHash(wallet.address);
    await allySwap.connect(wallet).consentAndAgreeToTerms(termsHash)
    await expect(allySwap.connect(wallet).consentAndAgreeToTerms(termsHash)).to.be.revertedWith(msg);
  })

  it('cannot agree to wrong terms', async () => {
    const msg = "AllySwap: wrong hash for T&C.";
    let termsHash = await allySwap.termsHash(other0.address);
    await expect(allySwap.connect(wallet).consentAndAgreeToTerms(termsHash)).to.be.revertedWith(msg);
  })

  it('cannot swap before agreeing to terms', async () => {
    const msg = "AllySwap: T&C must be approved.";
    await expect(allySwap.connect(wallet).swap("1000", wallet.address)).to.be.revertedWith(msg);
  })

  it('can swap for Ally', async () => {
    const msg1 = "AllySwap: to cannot be the 0x0 address";
    const msg2 = "AllySwap: insufficient oneToken balance";
    const msg3 = "AllySwap: insufficent oneToken allowance";
    const msg4 = "AllySwap: insufficient Ally balance";

    let termsHash = await allySwap.termsHash(wallet.address);
    await allySwap.connect(wallet).consentAndAgreeToTerms(termsHash)
    termsHash = await allySwap.termsHash(other0.address);
    await allySwap.connect(other0).consentAndAgreeToTerms(termsHash)

    await expect(allySwap.swap(HALF_MIL, NULL_ADDRESS)).to.be.revertedWith(msg1);
    await expect(allySwap.connect(other0).swap(HALF_MIL, wallet.address)).to.be.revertedWith(msg2);
    await expect(allySwap.swap(HALF_MIL, wallet.address)).to.be.revertedWith(msg3);

    await oneToken.connect(wallet).approve(allySwap.address, ONE_MIL);
    await expect(allySwap.swap(HALF_MIL, wallet.address)).to.be.revertedWith(msg4);

    await ally.transfer(allySwap.address,ONE_MIL);
    expect((await ally.balanceOf(allySwap.address)).toString()).to.eq(ONE_MIL)

    // swapping 0 doesn't hurt
    await expect(allySwap.swap(0, other2.address)).to.emit(allySwap, "SwapForAlly")
      .withArgs(oneToken.address, other2.address, "0", "0")
    expect((await ally.balanceOf(allySwap.address)).toString()).to.eq(ONE_MIL)

    // real swap
    await expect(allySwap.swap(HALF_MIL, other2.address)).to.emit(allySwap, "SwapForAlly")
      .withArgs(oneToken.address, other2.address, HALF_MIL, BigNumber.from(HALF_MIL).div(2).toString())

    expect((await ally.balanceOf(allySwap.address)).toString()).to.eq(BigNumber.from(ONE_MIL)
      .sub(BigNumber.from(HALF_MIL).div(2)).toString())
    expect((await oneToken.balanceOf(allySwap.address)).toString()).to.eq(HALF_MIL)
    expect((await ally.balanceOf(other2.address)).toString()).to.eq(BigNumber.from(HALF_MIL).div(2).toString())

    // swapping dust doesn't hurt
    await expect(allySwap.swap("1", other2.address)).to.emit(allySwap, "SwapForAlly")
      .withArgs(oneToken.address, other2.address, "1", "0")
    expect((await ally.balanceOf(allySwap.address)).toString()).to.eq(BigNumber.from(ONE_MIL)
      .sub(BigNumber.from(HALF_MIL).div(2)).toString())
  })

  it('set new swap rate', async () => {
    const msg1 = "AllySwap: swap rate must be > 0";
    const msg2 = "Ownable: caller is not the owner";

    await expect(allySwap.setSwapRate(0)).to.be.revertedWith(msg1);
    await expect(allySwap.connect(other0).setSwapRate("5000")).to.be.revertedWith(msg2);

    await expect(allySwap.setSwapRate("5000"))
      .to.emit(allySwap, "ChangeSwapRate")
      .withArgs(oneToken.address, "2000000000000000000", "5000")
  })

  it('emergency withdraw', async () => {
    await ally.transfer(allySwap.address,ONE_MIL);
    expect((await ally.balanceOf(allySwap.address)).toString()).to.eq(ONE_MIL)

    // get all ALLYs out
    const msg1 = "AllySwap: to cannot be the 0x0 address";
    const msg2 = "Ownable: caller is not the owner";

    await expect(allySwap.emergencyWithdraw(ally.address, HALF_MIL, NULL_ADDRESS)).to.be.revertedWith(msg1);
    await expect(allySwap.connect(other0).emergencyWithdraw(ally.address, HALF_MIL, other0.address)).to.be.revertedWith(msg2);

    await expect(allySwap.emergencyWithdraw(ally.address, HALF_MIL, other1.address))
      .to.emit(allySwap, "EmergencyWithdrawal")
      .withArgs(ally.address, HALF_MIL, other1.address)

    let allyBal = (await ally.balanceOf(other1.address)).toString()
    await expect(BigNumber.from(allyBal).toString()).to.be.eq(HALF_MIL)
  })
})
