import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time, mine } from '@nomicfoundation/hardhat-network-helpers';
import { Signer } from 'ethers';
import { getCurrentTime } from '../utils/utils';
import { tokenatorFixture } from './fixtures';
import { Tokenator, MockERC20 } from "../typechain-types";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const TEN_MIL = "10000000000000000000000000";
const ONE_MIL = "1000000000000000000000000";
const _8_MIL = "8000000000000000000000000";
const HALF_MIL = "500000000000000000000000";
const FIVE_PER_100 = "50000000000000000";

describe('Tokenator specification', () => {
    let wallet: Signer;
    let other0: Signer;
    let other1: Signer;
    let other2: Signer;
    let tokenator: Tokenator;
    let underlying: MockERC20;

    before(async () => {
        [wallet, other0, other1, other2] = await ethers.getSigners();
    });

    beforeEach(async () => {
        const fixture = await loadFixture(tokenatorFixture)
        tokenator = fixture.tokenator
        underlying = fixture.underlyingToken
    })

    it('constructor', async () => {
        const now = await getCurrentTime();

        const tokenatorFactory = await ethers.getContractFactory('Tokenator');

        // deployment should fail if commencement timestamp is in the past 
        await expect(tokenatorFactory.deploy("TOKE", "TOKE", ethers.parseEther("10000000"), await underlying.getAddress(), now - 60 * 60, 1095)).to.be.revertedWithCustomError(tokenatorFactory, 'CommencementPassed');

        let tokenatorToken = await tokenatorFactory.deploy("TOKE", "TOKE", ethers.parseEther("10000000"), await underlying.getAddress(), now + 60 * 60, 1095)
        let tx = await tokenatorToken.deploymentTransaction();

        // check that Deployed event is emitted with correct args
        await expect(tx)
            .to.emit(tokenatorToken, 'Deployed').withArgs(await wallet.getAddress(), await underlying.getAddress(), now + 60 * 60, 1095);

        // check that state varibles are correctly set
        expect(await tokenatorToken.durationSeconds()).to.eq(1095 * 24 * 60 * 60)
        expect(await tokenatorToken.commencement()).to.eq(now + 60 * 60)
        expect((await tokenatorToken.balanceOf(await wallet.getAddress())).toString()).to.eq(TEN_MIL)
    })

    it('before commencement', async () => {
        await tokenator.transfer(await other0.getAddress(), ONE_MIL);
        expect((await tokenator.balanceOf(await other0.getAddress())).toString()).to.eq(ONE_MIL)

        expect((await tokenator.complete()).toString()).to.eq("false")
        expect((await tokenator.ageSeconds()).toString()).to.eq("0")
        expect((await tokenator.redeemablePercent()).toString()).to.eq("0")
        expect((await tokenator.underlyingTokenPerTokenator()).toString()).to.eq("0")
        expect((await tokenator.underlyingTokenForTokenator(ONE_MIL)).toString()).to.eq("0")
        expect((await tokenator.underlyingTokenBalance()).toString()).to.eq("0")

        let { tokenatorBalance, claimable, uponCompletion } = await tokenator.userBalances(await other0.getAddress());
        expect(tokenatorBalance.toString()).to.eq(ONE_MIL)
        expect(claimable.toString()).to.eq("0")
        expect(uponCompletion.toString()).to.eq("0")

        await underlying.transfer(await tokenator.getAddress(), HALF_MIL);
        expect((await underlying.balanceOf(await tokenator.getAddress())).toString()).to.eq(HALF_MIL)

        expect((await tokenator.complete()).toString()).to.eq("false")
        expect((await tokenator.ageSeconds()).toString()).to.eq("0")
        expect((await tokenator.redeemablePercent()).toString()).to.eq("0")
        expect((await tokenator.underlyingTokenPerTokenator()).toString()).to.eq(FIVE_PER_100)
        expect((await tokenator.underlyingTokenForTokenator(ONE_MIL)).toString()).to.eq("0")
        expect((await tokenator.underlyingTokenBalance()).toString()).to.eq(HALF_MIL)

        const userBalances = await tokenator.userBalances(await other0.getAddress());
        expect(userBalances.tokenatorBalance.toString()).to.eq(ONE_MIL)
        expect(userBalances.claimable.toString()).to.eq("0")
        expect(userBalances.uponCompletion.toString()).to.eq((BigInt(HALF_MIL) / BigInt("10")).toString()) // 10% of underlying tokens

        // shouldn't be able to claim since commencement hasn't passed yet
        await expect(tokenator.connect(other0).claimUnderlyingToken(ONE_MIL, await other0.getAddress())).to.be.revertedWithCustomError(tokenator, 'CommencementNotPassed');
    })

    it('after commencement', async () => {
        const firstTimestamp = await getCurrentTime();

        await underlying.transfer(await tokenator.getAddress(), HALF_MIL);
        await tokenator.transfer(await other0.getAddress(), ONE_MIL);
        await tokenator.transfer(await other2.getAddress(), ONE_MIL);
        expect((await tokenator.balanceOf(await other0.getAddress())).toString()).to.eq(ONE_MIL)
        expect((await tokenator.balanceOf(await other2.getAddress())).toString()).to.eq(ONE_MIL)
        expect((await underlying.balanceOf(await tokenator.getAddress())).toString()).to.eq(HALF_MIL)

        await time.setNextBlockTimestamp(firstTimestamp + 2 * 60 * 60); // 1 hour after commencement
        await mine();

        const commencementTimestamp = Number(await tokenator.commencement());
        const secondTimestamp = await getCurrentTime();

        expect((await tokenator.complete()).toString()).to.eq("false");
        const secondsElapsedCommencement = Number((await tokenator.ageSeconds()).toString());

        expect(secondsElapsedCommencement).to.eq(secondTimestamp - commencementTimestamp);
        expect((await tokenator.redeemablePercent()).toString()).to.eq(BigInt("10") ** BigInt("18") * BigInt(secondsElapsedCommencement) / BigInt(1095 * 24 * 60 * 60))
        expect((await tokenator.underlyingTokenPerTokenator()).toString()).to.eq(FIVE_PER_100)
        let redeemablePercent = (await tokenator.redeemablePercent()).toString();
        expect((await tokenator.underlyingTokenForTokenator(ONE_MIL)).toString()).to.eq(BigInt(ONE_MIL) *
            BigInt(redeemablePercent) / (BigInt("10") ** BigInt("18")) *
            BigInt(FIVE_PER_100) / (BigInt("10") ** BigInt("18")));
        expect((await tokenator.underlyingTokenBalance()).toString()).to.eq(HALF_MIL);

        const { tokenatorBalance, claimable, uponCompletion } = await tokenator.userBalances(await other0.getAddress());
        expect(tokenatorBalance.toString()).to.eq(ONE_MIL);
        expect(claimable.toString()).to.eq((BigInt(HALF_MIL) / BigInt(10) *
            BigInt(redeemablePercent) / (BigInt(10) ** BigInt(18))).toString());
        expect(uponCompletion.toString()).to.eq((BigInt(HALF_MIL) / BigInt(10)).toString());

        // try to claim
        await expect(tokenator.connect(other0).claimUnderlyingToken(ONE_MIL, NULL_ADDRESS)).to.be.revertedWithCustomError(tokenator, 'ZeroAddress');
        await expect(tokenator.connect(other1).claimUnderlyingToken(ONE_MIL, await other1.getAddress())).to.be.revertedWithCustomError(tokenator, 'ERC20InsufficientBalance');

        const underlyingBalance1 = (await underlying.balanceOf(await other0.getAddress())).toString();
        await expect(underlyingBalance1).to.be.eq("0");

        let underlyingTokenForTokenator = (await tokenator.underlyingTokenForTokenator(HALF_MIL)).toString();

        // use underlyingTokenPerTokenator before claimUnderlyingToken 
        // with redeemPercent at the block of claimUnderlyingToken to get estimated number
        let underlyingTokenPerTokenator = (await tokenator.underlyingTokenPerTokenator()).toString();
        await tokenator.connect(other0).claimUnderlyingToken(HALF_MIL, await other0.getAddress());
        redeemablePercent = (await tokenator.redeemablePercent()).toString();

        underlyingTokenForTokenator = (await tokenator.underlyingTokenForTokenator(HALF_MIL)).toString();

        const underlyingBalance2 = (await underlying.balanceOf(await other0.getAddress())).toString();

        await expect(underlyingBalance2).to.be.eq((
            BigInt(HALF_MIL) *
            BigInt(redeemablePercent) *
            BigInt(underlyingTokenPerTokenator) /
            BigInt(10) ** BigInt(36)).toString());

        // use underlyingTokenPerTokenator before claimUnderlyingToken
        // with redeemPercent at the block of claimUnderlyingToken to get estimated number
        underlyingTokenPerTokenator = (await tokenator.underlyingTokenPerTokenator()).toString();

        await tokenator.connect(other0).claimUnderlyingToken(BigInt(HALF_MIL).toString(), await other0.getAddress());
        redeemablePercent = (await tokenator.redeemablePercent()).toString();

        const underlyingBalance3 = (await underlying.balanceOf(await other0.getAddress())).toString();

        await expect(BigInt(underlyingBalance3) - (BigInt(underlyingBalance2))).to.be.gt(BigInt(underlyingBalance2));

        await expect((BigInt(underlyingBalance3) - BigInt(underlyingBalance2)).toString()).
            to.be.eq((BigInt(HALF_MIL) *
            BigInt(redeemablePercent) *
            BigInt(underlyingTokenPerTokenator) /
            BigInt(10) ** BigInt(36)).toString());

        // check other users

        underlyingTokenPerTokenator = (await tokenator.underlyingTokenPerTokenator()).toString();
        // and transfer to another user
        await tokenator.connect(other2).claimUnderlyingToken(BigInt(ONE_MIL).toString(), await other1.getAddress());
        redeemablePercent = (await tokenator.redeemablePercent()).toString();

        const underlyingBalance4 = (await underlying.balanceOf(await other1.getAddress())).toString();
        await expect(BigInt(underlyingBalance4)).to.be.gt(BigInt(underlyingBalance3));

        await expect(BigInt(underlyingBalance4).toString()).
            to.be.eq((BigInt(ONE_MIL) *
            BigInt(redeemablePercent) *
            (BigInt(underlyingTokenPerTokenator)) / 
            (BigInt(10) ** BigInt(36))).toString());
    })

    it('after completion', async () => {
        const now = await getCurrentTime();

        await underlying.transfer(await tokenator.getAddress(), HALF_MIL);
        await tokenator.transfer(await other0.getAddress(), ONE_MIL);
        await tokenator.transfer(await other2.getAddress(), ONE_MIL);
        expect((await tokenator.balanceOf(await other0.getAddress())).toString()).to.eq(ONE_MIL);
        expect((await tokenator.balanceOf(await other2.getAddress())).toString()).to.eq(ONE_MIL);
        expect((await underlying.balanceOf(await tokenator.getAddress())).toString()).to.eq(HALF_MIL);

        await time.setNextBlockTimestamp(now + 1096 * 24 * 60 * 60); // 1 hour after duration end
        await mine();

        const commencementTimestamp = Number(await tokenator.commencement());
        const currentTime = await getCurrentTime();

        expect((await tokenator.complete()).toString()).to.eq("true");
        expect((await tokenator.ageSeconds()).toString()).to.eq((currentTime - commencementTimestamp).toString());
        expect((await tokenator.redeemablePercent()).toString()).to.eq(BigInt(10) ** BigInt(18));
        expect((await tokenator.underlyingTokenPerTokenator()).toString()).to.eq(FIVE_PER_100);
        expect((await tokenator.underlyingTokenForTokenator(ONE_MIL)).toString()).to.eq(BigInt(ONE_MIL) *
            (BigInt(FIVE_PER_100)) / (BigInt(10) ** BigInt(18)));
        expect((await tokenator.underlyingTokenBalance()).toString()).to.eq(HALF_MIL);

        const { tokenatorBalance, claimable, uponCompletion } = await tokenator.userBalances(await other0.getAddress());
        expect(tokenatorBalance.toString()).to.eq(ONE_MIL);
        expect(claimable.toString()).to.eq((BigInt(HALF_MIL) / BigInt(10)).toString());
        expect(uponCompletion.toString()).to.eq((BigInt(HALF_MIL) / BigInt(10)).toString());

        // try to claim, everybody gets the same share now

        await tokenator.connect(other0).approve(tokenator.getAddress(), ONE_MIL);
        await tokenator.connect(other2).approve(tokenator.getAddress(), ONE_MIL);

        let underlyingTokenPerTokenator = (await tokenator.underlyingTokenPerTokenator()).toString();
        await tokenator.connect(other2).claimUnderlyingToken(ONE_MIL, await other2.getAddress());
        let redeemablePercent = (await tokenator.redeemablePercent()).toString();
        await expect(BigInt(redeemablePercent)).to.be.eq((BigInt(10) ** BigInt(18)).toString());

        await tokenator.connect(other0).claimUnderlyingToken(ONE_MIL, await other0.getAddress());

        redeemablePercent = (await tokenator.redeemablePercent()).toString();
        await expect(BigInt(redeemablePercent)).to.be.eq((BigInt(10) ** BigInt(18)).toString());

        let underlyingBalanceOther0 = (await underlying.balanceOf(await other0.getAddress())).toString();
        let underlyingBalanceOther2 = (await underlying.balanceOf(await other2.getAddress())).toString();

        await expect(BigInt(underlyingBalanceOther2)).to.be.eq(BigInt(underlyingBalanceOther0));

        await expect(BigInt(underlyingBalanceOther2).toString()).
            to.be.eq((BigInt(ONE_MIL) *
            BigInt(redeemablePercent) *
            BigInt(underlyingTokenPerTokenator) /
            (BigInt(10) ** BigInt(36))).toString());

        // get the rest out
        await tokenator.approve(await tokenator.getAddress(), _8_MIL);

        underlyingTokenPerTokenator = (await tokenator.underlyingTokenPerTokenator()).toString();
        await tokenator.claimUnderlyingToken(_8_MIL, await other2.getAddress());
        redeemablePercent = (await tokenator.redeemablePercent()).toString();

        let underlyingTokenatorBalance = (await underlying.balanceOf(await tokenator.getAddress())).toString();
        await expect(BigInt(underlyingTokenatorBalance)).to.be.eq(BigInt(0));
    })

    it('emergency withdraw', async () => {
        const now = await getCurrentTime();

        await underlying.transfer(await tokenator.getAddress(), HALF_MIL);
        await tokenator.transfer(await other0.getAddress(), ONE_MIL);
        expect((await tokenator.balanceOf(await other0.getAddress())).toString()).to.eq(ONE_MIL);
        expect((await underlying.balanceOf(tokenator.getAddress())).toString()).to.eq(HALF_MIL);

        await time.setNextBlockTimestamp(now + 2 * 60 * 60); // 1 hour after commencement
        await mine();

        // get all underlying out
        const msg1 = "Ally:emergencyWithdraw:: to cannot be the 0x0 address";
        const msg2 = "Ownable: caller is not the owner";

        await expect(tokenator.emergencyWithdraw(HALF_MIL, NULL_ADDRESS)).to.be.revertedWithCustomError(tokenator, 'ZeroAddress');
        await expect(tokenator.connect(other0).emergencyWithdraw(HALF_MIL, await other0.getAddress())).to.be.revertedWithCustomError(tokenator, 'OwnableUnauthorizedAccount');

        await tokenator.emergencyWithdraw(HALF_MIL, await other1.getAddress());

        let underlyingBalanceOther1 = (await underlying.balanceOf(await other1.getAddress())).toString();
        await expect(BigInt(underlyingBalanceOther1).toString()).to.be.eq(HALF_MIL);

        expect((await tokenator.complete()).toString()).to.eq("false");
        expect((await tokenator.underlyingTokenPerTokenator()).toString()).to.eq("0");
        expect((await tokenator.underlyingTokenForTokenator(ONE_MIL)).toString()).to.eq("0");
        expect((await tokenator.underlyingTokenBalance()).toString()).to.eq("0");

        const { tokenatorBalance, claimable, uponCompletion } = await tokenator.userBalances(await other0.getAddress());
        expect(tokenatorBalance.toString()).to.eq(ONE_MIL);
        expect(claimable.toString()).to.eq("0");
        expect(uponCompletion.toString()).to.eq("0");
    })
});