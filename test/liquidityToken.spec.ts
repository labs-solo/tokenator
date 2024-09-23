import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers';
import { Signer } from 'ethers';
import { getBlockNumber, getPermitSignature, getCurrentTime } from '../utils/utils';
import { tokenatorFixture } from './fixtures';
import { LiquidityToken } from "../typechain-types";

describe('LiquidityToken specification', () => {
    let wallet: Signer;
    let account0: Signer;
    let account1: Signer;
    let liquidityToken: LiquidityToken;

    before(async () => {
        [wallet, account0, account1] = await ethers.getSigners();
    });

    beforeEach(async () => {
        const fixture = await loadFixture(tokenatorFixture);
        liquidityToken = fixture.liquidityToken;
    })

    it('deployment', async () => {
        // check that state varibles are correctly set
        expect(await liquidityToken.name()).to.eq("LT");
        expect(await liquidityToken.symbol()).to.eq("LT");
        expect(await liquidityToken.totalSupply()).to.eq(ethers.parseUnits('75000000', 18));
        expect(await liquidityToken.balanceOf(await wallet.getAddress())).to.eq(ethers.parseUnits('75000000', 18));
    });

    it('votes', async () => {
        await liquidityToken.transfer(await account0.getAddress(), 1000);
        await liquidityToken.transfer(await account1.getAddress(), 2000);
        await mine();

        expect(await liquidityToken.getVotes(await account0.getAddress())).to.eq(0);
        expect(await liquidityToken.getVotes(await account1.getAddress())).to.eq(0);

        const block1Number = await getBlockNumber();

        // accounts delegate to themselves
        await liquidityToken.connect(account0).delegate(await account0.getAddress());
        await liquidityToken.connect(account1).delegate(await account1.getAddress());

        // check delegations
        expect(await liquidityToken.delegates(await account0.getAddress())).to.eq(await account0.getAddress());
        expect(await liquidityToken.delegates(await account1.getAddress())).to.eq(await account1.getAddress());

        // account0 should now have 1000 votes
        // account1 should now have 2000 votes
        expect(await liquidityToken.getVotes(await account0.getAddress())).to.eq(1000);
        expect(await liquidityToken.getVotes(await account1.getAddress())).to.eq(2000);

        const block2Number = await getBlockNumber();

        // account 0 transfers 500 tokens to account 1
        await liquidityToken.connect(account0).transfer(await account1.getAddress(), 500);

        expect(await liquidityToken.getVotes(await account0.getAddress())).to.eq(500);
        expect(await liquidityToken.getVotes(await account1.getAddress())).to.eq(2500);

        const block3Number = await getBlockNumber();

        // account 0 transfers 500 tokens to account 1
        await liquidityToken.connect(account0).transfer(await account1.getAddress(), 500);

        expect(await liquidityToken.getVotes(await account0.getAddress())).to.eq(0);
        expect(await liquidityToken.getVotes(await account1.getAddress())).to.eq(3000);

        const block4Number = await getBlockNumber();

        await mine();

        // check pastVotes at past block numbers
        expect(await liquidityToken.getPastVotes(await account0.getAddress(), block2Number)).to.eq(1000);
        expect(await liquidityToken.getPastVotes(await account1.getAddress(), block2Number)).to.eq(2000);

        expect(await liquidityToken.getPastVotes(await account0.getAddress(), block3Number)).to.eq(500);
        expect(await liquidityToken.getPastVotes(await account1.getAddress(), block3Number)).to.eq(2500);

        expect(await liquidityToken.getPastVotes(await account0.getAddress(), block4Number)).to.eq(0);
        expect(await liquidityToken.getPastVotes(await account1.getAddress(), block4Number)).to.eq(3000);
    });

    it('permit', async () => {
        const deadline = (await getCurrentTime()) + 1000;
        const permitAmount = ethers.parseUnits('10', 18);

        // get signature for wallet to permit account 1 to transfer 10 tokens
        const signature = await getPermitSignature(wallet, liquidityToken, account1, permitAmount, deadline);

        const v = signature.yParity ? 28 : 27;
        const r = signature.r;
        const s = signature.s;

        // transferFrom should fail before permit has been called
        await expect(liquidityToken.connect(account1).transferFrom(await wallet.getAddress(), await account1.getAddress(), permitAmount)).to.be.revertedWithCustomError(liquidityToken, 'ERC20InsufficientAllowance');

        await liquidityToken.permit(
            await wallet.getAddress(),
            await account1.getAddress(),
            permitAmount,
            deadline,
            v,
            r,
            s
        );

        // transferFrom should succeed now
        await liquidityToken.connect(account1).transferFrom(await wallet.getAddress(), await account1.getAddress(), permitAmount);

        // transferFrom should fail now that allowance has been used
        await expect(liquidityToken.connect(account1).transferFrom(await wallet.getAddress(), await account1.getAddress(), permitAmount)).to.be.revertedWithCustomError(liquidityToken, 'ERC20InsufficientAllowance');
    });
});