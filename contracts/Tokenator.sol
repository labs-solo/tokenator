// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.24;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Tokenator is ERC20Burnable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 liquidityToken;
    uint256 private constant INITIAL_SUPPLY_ = 1_000_0000 * 1e18;
    uint256 private constant PRECISION = 1e18;
    uint256 public immutable commencement;
    uint256 public immutable durationSeconds;

    error ZeroAddress();
    error CommencementPassed();
    error CommencementNotPassed();
    error CannotRescueLiquidityToken();

    event Deployed(
        address deployer,
        IERC20 liquidityToken,
        uint256 commencement,
        uint256 durationDays
    );
    event ClaimLiquidityToken(
        address user,
        address to,
        uint256 tokenatorAmount,
        uint256 liquidityTokenAmount
    );
    event EmergencyWithdrawal(uint256 amount, address to);
    event TokensRescued(IERC20 token, uint256 amount, address to);

    /// @notice following the airdrop, the deployer is required to burn any surplus Tokenator
    /// (because totalSupply() is used in calculations) and send liquidity token to the contract.
    constructor(
        string memory name_,
        string memory symbol_,
        IERC20 liquidityToken_,
        uint256 commencement_,
        uint256 durationDays_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        if (commencement_ < block.timestamp) revert CommencementPassed();

        liquidityToken = liquidityToken_;
        commencement = commencement_;
        durationSeconds = durationDays_ * 1 days;

        _mint(msg.sender, INITIAL_SUPPLY_);

        emit Deployed(
            msg.sender,
            liquidityToken_,
            commencement_,
            durationDays_
        );
    }

    // redeem liquidity token from this contract by burning tokenator
    function claimLiquidityToken(
        uint256 tokenatorAmount,
        address to
    ) external returns (uint256 liquidityTokenAmount) {
        if (commencement >= block.timestamp) revert CommencementNotPassed();
        if (to == address(0)) revert ZeroAddress();

        liquidityTokenAmount = liquidityTokenForTokenator(tokenatorAmount);
        _burn(msg.sender, tokenatorAmount);
        liquidityToken.transfer(to, liquidityTokenAmount);

        emit ClaimLiquidityToken(
            msg.sender,
            to,
            tokenatorAmount,
            liquidityTokenAmount
        );
    }

    // owner may withdraw liquidity token in emergency situations
    function emergencyWithdraw(
        uint256 amount,
        address to
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        liquidityToken.safeTransfer(to, amount);

        emit EmergencyWithdrawal(amount, to);
    }

    // owner may withdraw tokens accidentally sent to the contract that aren't the liquidity token 
    function rescueTokens(
        IERC20 token,
        uint256 amount,
        address to
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (token == liquidityToken) revert CannotRescueLiquidityToken();

        token.safeTransfer(to, amount);

        emit TokensRescued(token, amount, to);
    }

    // duration period is complete
    function complete() public view returns (bool isComplete) {
        isComplete = ageSeconds() >= durationSeconds;
    }

    // seconds completed in full
    function ageSeconds() public view returns (uint256 elapsedSeconds) {
        if (block.timestamp <= commencement) return 0;
        elapsedSeconds = block.timestamp - commencement;
    }

    // 1e18 = 1.00 = 100%
    function redeemablePercent() public view returns (uint256 p18) {
        if (complete()) return PRECISION;
        p18 = (ageSeconds() * PRECISION) / durationSeconds;
    }

    // at completion, based on current liquidity token balance and unredeemed tokenator token supply
    // it is permissible to send more liquidity token to this contract for proportional, time-based distribution
    function liquidityTokenPerTokenator() public view returns (uint256 p18) {
        p18 = (liquidityTokenBalance() * PRECISION) / totalSupply();
    }

    // present value, based on tokenator to redeem, value at completion and redeemable percent
    function liquidityTokenForTokenator(
        uint256 tokenatorAmount
    ) public view returns (uint256 liquidityTokenAmount) {
        liquidityTokenAmount =
            (tokenatorAmount *
                liquidityTokenPerTokenator() *
                redeemablePercent()) /
            PRECISION ** 2;
    }

    // courtesy view functions
    function liquidityTokenBalance()
        public
        view
        returns (uint256 liquidityTokenBalance_)
    {
        liquidityTokenBalance_ = liquidityToken.balanceOf(address(this));
    }

    function userBalances(
        address user
    )
        public
        view
        returns (
            uint256 tokenatorBalance,
            uint256 claimable,
            uint256 uponCompletion
        )
    {
        tokenatorBalance = balanceOf(user);
        uponCompletion =
            (tokenatorBalance * liquidityTokenPerTokenator()) /
            PRECISION;
        claimable = (uponCompletion * redeemablePercent()) / PRECISION;
    }
}
