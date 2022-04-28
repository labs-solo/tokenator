import chai, { expect } from 'chai'
import { BigNumber } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { ethers, waffle, network } from 'hardhat'

import { allyFixture } from './fixtures'
import { mineBlock } from './utils'

import { ICHIV2, Ally } from "../typechain";

chai.use(solidity)

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const TEN_MIL = "10000000000000000000000000";
const ONE_MIL = "1000000000000000000000000";
const _8_MIL = "8000000000000000000000000";
const HALF_MIL = "500000000000000000000000";
const _200K = "200000000000000000000000";
const FIVE_PER_100 = "50000000000000000";
const _2_96 = "79228162514264337593543950336";

const createFixtureLoader = waffle.createFixtureLoader

describe('Ally - main', () => {
  const provider = waffle.provider;
  const [wallet, other0, other1, other2] = provider.getWallets()

  let ally: Ally
  let ichi: ICHIV2

  let loadFixture: ReturnType<typeof createFixtureLoader>
  before('create fixture loader', async () => {
    loadFixture = createFixtureLoader([wallet], provider)
  })

  beforeEach(async () => {
    const fixture = await loadFixture(allyFixture)
    ichi = fixture.ichi
    ally = fixture.ally
  })

  it('constructor', async () => {
    const msg1 = "Ally:constructor:: commencement_ cannot be in the past";

    const { timestamp: now } = await provider.getBlock('latest')

    const allyFactory = await ethers.getContractFactory('Ally')
    await expect(allyFactory.deploy(ichi.address, now - 60 * 60, 1095)).to.be.revertedWith(msg1);

    let allyToken = await allyFactory.deploy(ichi.address, now + 60 * 60, 1095)
    let tx = allyToken.deployTransaction
    await expect(tx)
      .to.emit(allyToken, 'Deployed').withArgs(wallet.address, ichi.address, now + 60 * 60, 1095);

    expect(await allyToken.durationSeconds()).to.eq(1095*24*60*60)
    expect(await allyToken.commencement()).to.eq(now + 60 * 60)
    expect((await allyToken.balanceOf(wallet.address)).toString()).to.eq(TEN_MIL)
  })

  it('before commencement', async () => {
    await ally.transfer(other0.address,ONE_MIL);
    expect((await ally.balanceOf(other0.address)).toString()).to.eq(ONE_MIL)

    expect((await ally.complete()).toString()).to.eq("false")
    expect((await ally.ageSeconds()).toString()).to.eq("0")
    expect((await ally.redeemablePercent()).toString()).to.eq("0")
    expect((await ally.ichiPerAlly()).toString()).to.eq("0")
    expect((await ally.ichiForAlly(ONE_MIL)).toString()).to.eq("0")
    expect((await ally.ichiBalance()).toString()).to.eq("0")

    let { allyBalance, claimable, uponCompletion } = await ally.userBalances(other0.address);
    expect(allyBalance.toString()).to.eq(ONE_MIL)
    expect(claimable.toString()).to.eq("0")
    expect(uponCompletion.toString()).to.eq("0")

    await ichi.transfer(ally.address,HALF_MIL);
    expect((await ichi.balanceOf(ally.address)).toString()).to.eq(HALF_MIL)

    expect((await ally.complete()).toString()).to.eq("false")
    expect((await ally.ageSeconds()).toString()).to.eq("0")
    expect((await ally.redeemablePercent()).toString()).to.eq("0")
    expect((await ally.ichiPerAlly()).toString()).to.eq(FIVE_PER_100)
    expect((await ally.ichiForAlly(ONE_MIL)).toString()).to.eq("0")
    expect((await ally.ichiBalance()).toString()).to.eq(HALF_MIL)

    const obj = await ally.userBalances(other0.address);
    expect(obj.allyBalance.toString()).to.eq(ONE_MIL)
    expect(obj.claimable.toString()).to.eq("0")
    expect(obj.uponCompletion.toString()).to.eq(BigNumber.from(HALF_MIL).div(10).toString()) // 10% of ICHIs

    // try to claim
    const msg1 = "Ally:claimIchi:: must wait for the commencement date to pass";
    await expect(ally.connect(other0).claimIchi(ONE_MIL, other0.address)).to.be.revertedWith(msg1);

  })

  it('after commencement', async () => {
    const { timestamp: now } = await provider.getBlock('latest')

    await ichi.transfer(ally.address,HALF_MIL);
    await ally.transfer(other0.address,ONE_MIL);
    await ally.transfer(other2.address,ONE_MIL);
    expect((await ally.balanceOf(other0.address)).toString()).to.eq(ONE_MIL)
    expect((await ally.balanceOf(other2.address)).toString()).to.eq(ONE_MIL)
    expect((await ichi.balanceOf(ally.address)).toString()).to.eq(HALF_MIL)

    await mineBlock(provider, now + 2 * 60 * 60) // 1 hour after commencement

    let comm_tm = Number(await ally.commencement())
    //console.log(comm_tm)
    const { timestamp: curr_tm } = await provider.getBlock('latest')
    //console.log(curr_tm)

    expect((await ally.complete()).toString()).to.eq("false")
    let secs = Number((await ally.ageSeconds()).toString())
    expect(secs).to.lte(3605)
    expect((await ally.redeemablePercent()).toString()).to.eq(BigNumber.from(10).pow(18).mul(secs).div(1095*24*60*60))
    expect((await ally.ichiPerAlly()).toString()).to.eq(FIVE_PER_100)
    let redPercent = (await ally.redeemablePercent()).toString()
    expect((await ally.ichiForAlly(ONE_MIL)).toString()).to.eq(BigNumber.from(ONE_MIL).
      mul(BigNumber.from(redPercent)).div(BigNumber.from(10).pow(18)).
      mul(BigNumber.from(FIVE_PER_100)).div(BigNumber.from(10).pow(18)))
    expect((await ally.ichiBalance()).toString()).to.eq(HALF_MIL)

    const { allyBalance, claimable, uponCompletion } = await ally.userBalances(other0.address);
    expect(allyBalance.toString()).to.eq(ONE_MIL)
    expect(claimable.toString()).to.eq(BigNumber.from(HALF_MIL).div(10).
      mul(BigNumber.from(redPercent)).div(BigNumber.from(10).pow(18)).toString())
    expect(uponCompletion.toString()).to.eq(BigNumber.from(HALF_MIL).div(10).toString())

    // try to claim
    const msg1 = "Ally:claimIchi:: insufficient Ally balance";
    const msg2 = "Ally:claimIchi:: insufficent Ally allowance";
    const msg3 = "Ally:claimIchi:: to cannot be the 0x0 address";
    await expect(ally.connect(other0).claimIchi(ONE_MIL, NULL_ADDRESS)).to.be.revertedWith(msg3);
    await expect(ally.connect(other1).claimIchi(ONE_MIL, other1.address)).to.be.revertedWith(msg1);
    await expect(ally.connect(other0).claimIchi(ONE_MIL, other0.address)).to.be.revertedWith(msg2);

    await ally.connect(other0).approve(ally.address, ONE_MIL);

    let ichiBal = (await ichi.balanceOf(other0.address)).toString()
    await expect(ichiBal).to.be.eq("0")    

    // redPercent = (await ally.redeemablePercent()).toString()
    // console.log("redeemable percent before claim = "+redPercent)

    let ichiForAlly = (await ally.ichiForAlly(HALF_MIL)).toString()
    // console.log("ichiForAlly before claim = "+ichiForAlly)

    // use ichiPerAlly before claimIchi with redeemPercent at the block of claimIchi to get estimated number
    let ichiPerAlly = (await ally.ichiPerAlly()).toString()
    // console.log("ichiPerAlly before claim = "+ichiPerAlly)
    await ally.connect(other0).claimIchi(HALF_MIL, other0.address);
    redPercent = (await ally.redeemablePercent()).toString()
    
    ichiForAlly = (await ally.ichiForAlly(HALF_MIL)).toString()
    // console.log("ichiForAlly after claim = "+ichiForAlly)

    ichiBal = (await ichi.balanceOf(other0.address)).toString()    
    // console.log("ICHI end balance = "+ichiBal)

    //console.log("ICHI estmated balance = "+BigNumber.from(HALF_MIL).
    //  mul(BigNumber.from(redPercent)).
    //  mul(BigNumber.from(ichiPerAlly)).
    //  div(BigNumber.from(10).pow(36)).toString())

    await expect(ichiBal).to.be.eq(BigNumber.from(HALF_MIL).
      mul(BigNumber.from(redPercent)).
      mul(BigNumber.from(ichiPerAlly)).
      div(BigNumber.from(10).pow(36)).toString())

    // use ichiPerAlly before claimIchi with redeemPercent at the block of claimIchi to get estimated number
    ichiPerAlly = (await ally.ichiPerAlly()).toString()
    await ally.connect(other0).claimIchi(BigNumber.from(HALF_MIL).toString(), other0.address);
    redPercent = (await ally.redeemablePercent()).toString()

    let ichiBal_2 = (await ichi.balanceOf(other0.address)).toString()
    await expect(BigNumber.from(ichiBal_2).sub(BigNumber.from(ichiBal))).to.be.gt(BigNumber.from(ichiBal))

    await expect(BigNumber.from(ichiBal_2).sub(BigNumber.from(ichiBal).toString())).
      to.be.eq(BigNumber.from(HALF_MIL).
      mul(BigNumber.from(redPercent)).
      mul(BigNumber.from(ichiPerAlly)).
      div(BigNumber.from(10).pow(36)).toString())

    // now lets get other2 user ICHIs
    await ally.connect(other2).approve(ally.address, ONE_MIL);

    ichiPerAlly = (await ally.ichiPerAlly()).toString()
    // and transfer to another user
    await ally.connect(other2).claimIchi(BigNumber.from(ONE_MIL).toString(), other1.address);
    redPercent = (await ally.redeemablePercent()).toString()

    let ichiBal_3 = (await ichi.balanceOf(other1.address)).toString()
    await expect(BigNumber.from(ichiBal_3)).to.be.gt(BigNumber.from(ichiBal_2))

    await expect(BigNumber.from(ichiBal_3).toString()).
      to.be.eq(BigNumber.from(ONE_MIL).
      mul(BigNumber.from(redPercent)).
      mul(BigNumber.from(ichiPerAlly)).
      div(BigNumber.from(10).pow(36)).toString())
  
  })

  it('after completion', async () => {
    const { timestamp: now } = await provider.getBlock('latest')

    await ichi.transfer(ally.address,HALF_MIL);
    await ally.transfer(other0.address,ONE_MIL);
    await ally.transfer(other2.address,ONE_MIL);
    expect((await ally.balanceOf(other0.address)).toString()).to.eq(ONE_MIL)
    expect((await ally.balanceOf(other2.address)).toString()).to.eq(ONE_MIL)
    expect((await ichi.balanceOf(ally.address)).toString()).to.eq(HALF_MIL)

    await mineBlock(provider, now + 1096 * 24 * 60 * 60) // 1 day after completion

    let comm_tm = Number(await ally.commencement())
    //console.log(comm_tm)
    const { timestamp: curr_tm } = await provider.getBlock('latest')
    //console.log(curr_tm)

    expect((await ally.complete()).toString()).to.eq("true")
    expect((await ally.ageSeconds()).toString()).to.eq((curr_tm - comm_tm).toString())
    expect((await ally.redeemablePercent()).toString()).to.eq(BigNumber.from(10).pow(18))
    expect((await ally.ichiPerAlly()).toString()).to.eq(FIVE_PER_100)
    expect((await ally.ichiForAlly(ONE_MIL)).toString()).to.eq(BigNumber.from(ONE_MIL).
      mul(BigNumber.from(FIVE_PER_100)).div(BigNumber.from(10).pow(18)))
    expect((await ally.ichiBalance()).toString()).to.eq(HALF_MIL)

    const { allyBalance, claimable, uponCompletion } = await ally.userBalances(other0.address);
    expect(allyBalance.toString()).to.eq(ONE_MIL)
    expect(claimable.toString()).to.eq(BigNumber.from(HALF_MIL).div(10).toString())
    expect(uponCompletion.toString()).to.eq(BigNumber.from(HALF_MIL).div(10).toString())

    // try to claim
    // everybody gets the same share now

    await ally.connect(other0).approve(ally.address, ONE_MIL);
    await ally.connect(other2).approve(ally.address, ONE_MIL);

    let ichiPerAlly = (await ally.ichiPerAlly()).toString()
    await ally.connect(other2).claimIchi(ONE_MIL, other2.address);
    let redPercent = (await ally.redeemablePercent()).toString()
    await expect(BigNumber.from(redPercent)).to.be.eq(BigNumber.from(10).pow(18).toString())

    await ally.connect(other0).claimIchi(ONE_MIL, other0.address);

    redPercent = (await ally.redeemablePercent()).toString()
    await expect(BigNumber.from(redPercent)).to.be.eq(BigNumber.from(10).pow(18).toString())

    let ichiBal_0 = (await ichi.balanceOf(other0.address)).toString()
    let ichiBal_2 = (await ichi.balanceOf(other2.address)).toString()

    await expect(BigNumber.from(ichiBal_2)).to.be.eq(BigNumber.from(ichiBal_0))

    await expect(BigNumber.from(ichiBal_2).toString()).
      to.be.eq(BigNumber.from(ONE_MIL).
      mul(BigNumber.from(redPercent)).
      mul(BigNumber.from(ichiPerAlly)).
      div(BigNumber.from(10).pow(36)).toString())

    // get the rest out
    await ally.approve(ally.address, _8_MIL);

    ichiPerAlly = (await ally.ichiPerAlly()).toString()
    await ally.claimIchi(_8_MIL, other2.address);
    redPercent = (await ally.redeemablePercent()).toString()

    let ichiBal_ally = (await ichi.balanceOf(ally.address)).toString()
    await expect(BigNumber.from(ichiBal_ally)).to.be.eq(BigNumber.from(0))

  })

  it('emergency withdraw', async () => {
    const { timestamp: now } = await provider.getBlock('latest')

    await ichi.transfer(ally.address,HALF_MIL);
    await ally.transfer(other0.address,ONE_MIL);
    expect((await ally.balanceOf(other0.address)).toString()).to.eq(ONE_MIL)
    expect((await ichi.balanceOf(ally.address)).toString()).to.eq(HALF_MIL)

    await mineBlock(provider, now + 2 * 60 * 60) // 1 hour after commencement

    // get all ICHIs out
    const msg1 = "Ally:emergencyWithdraw:: to cannot be the 0x0 address";
    const msg2 = "Ownable: caller is not the owner";

    await expect(ally.emergencyWithdraw(ichi.address, HALF_MIL, NULL_ADDRESS)).to.be.revertedWith(msg1);
    await expect(ally.connect(other0).emergencyWithdraw(ichi.address, HALF_MIL, other0.address)).to.be.revertedWith(msg2);

    await ally.emergencyWithdraw(ichi.address, HALF_MIL, other1.address)

    let ichiBal = (await ichi.balanceOf(other1.address)).toString()
    await expect(BigNumber.from(ichiBal).toString()).to.be.eq(HALF_MIL)

    expect((await ally.complete()).toString()).to.eq("false")
    expect((await ally.ichiPerAlly()).toString()).to.eq("0")
    expect((await ally.ichiForAlly(ONE_MIL)).toString()).to.eq("0")
    expect((await ally.ichiBalance()).toString()).to.eq("0")

    const { allyBalance, claimable, uponCompletion } = await ally.userBalances(other0.address);
    expect(allyBalance.toString()).to.eq(ONE_MIL)
    expect(claimable.toString()).to.eq("0")
    expect(uponCompletion.toString()).to.eq("0")

  })


})
