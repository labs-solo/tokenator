// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "./IAlly.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract AllyBond {

    using SafeMath for uint256;

    IERC20 ichiV2;
    IAlly ally;
    uint256 private constant PRECISION = 1e18;

    // start time and duration are unchangeable

    uint256 public immutable commencement;
    uint256 public immutable durationDays;

    event Deployed(IERC20 ichiV2, IAlly ally, uint256 commencement, uint256 durationDays);
    event ClaimIchi(address user, address to, uint256 ally, uint256 ichi);

    /// @notice following the airdrop, the deployer is required to burn any surplus Ally
    /// (because totalSupply() is used in calculations) and send ICHI V2 to the contract.
    /// ICHI V2 cannot be retrieved from this contract except by redeeming Ally. There is no 
    /// provision for lost Ally and ICHI V2 will be effectively removed from circulation in
    /// that case, i.e. marooned. 

    constructor(IERC20 ichiV2_, IAlly ally_, uint256 commencement_, uint256 durationDays_) {
        require(commencement_ >= block.timestamp, 'AllyBond.constructor:: commencement_ cannot be in the past');
        ichiV2 = ichiV2_;
        ally = ally_;
        commencement = commencement_;
        durationDays = durationDays_;
        emit Deployed(ichiV2_, ally_, commencement_, durationDays_);
    }

    function claimIchi(uint256 amountAlly, address to) external returns(uint256 amountIchi) {
        require(amountAlly <= ally.balanceOf(msg.sender), 'AllyBond.claimIchi:: insufficient ally balance');
        require(amountAlly <= ally.allowance(msg.sender, address(this)), 'AllyBond.claimIchi:: insufficent allowance');
        ally.transferFrom(msg.sender, address(this), amountAlly);
        ally.burn(amountAlly);
        amountIchi = ichiForAlly(amountAlly);
        ichiV2.transfer(to, amountIchi);
        emit ClaimIchi(msg.sender, to, amountAlly, amountIchi);
    }

    function ichiBalance() public view returns(uint256 ichiOnHand) {
        ichiOnHand = ichiV2.balanceOf(address(this));
    }

    function complete() public view returns(bool isComplete) {
        isComplete = daysOld() >= durationDays;
    }

    function daysOld() public view returns(uint256 elapsed) {
        if(block.timestamp <= commencement) return 0;
        elapsed = block.timestamp.sub(commencement).div(1 days);
    }

    // 1e18 = 1.00 = 100%

    function redeemablePercent() public view returns(uint256 p18) {
        if(complete()) return PRECISION;
        p18 = daysOld().mul(PRECISION).div(durationDays);
    }

    function ichiPerAlly() public view returns(uint256 p18) {
        uint circulatingAlly = ally.totalSupply();
        p18 = ichiBalance().mul(PRECISION).div(circulatingAlly);
    }

    function ichiForAlly(uint256 amountAlly) public view returns(uint256 amountIchi) {
        amountIchi = amountAlly.mul(ichiPerAlly()).div(PRECISION);
    }

    function userBalances(address user) public view returns(uint256 allyBalance, uint256 claimable, uint256 uponCompletion) {
        allyBalance = ally.balanceOf(user);
        uponCompletion = allyBalance.mul(ichiPerAlly()).div(PRECISION);
        claimable = uponCompletion.mul(redeemablePercent()).div(PRECISION);
    }

}
