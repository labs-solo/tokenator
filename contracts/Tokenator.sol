// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.24;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ITokenator} from "./interfaces/ITokenator.sol";

contract Tokenator is ITokenator, ERC20Burnable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingToken;
    uint256 private constant PRECISION = 1e18;
    uint256 public immutable commencement;
    uint256 public immutable durationSeconds;

    /// @notice the deployer is responsible to send underlying token to the contract.
    /// @param name_ token name
    /// @param symbol_ token symbol
    /// @param totalSupply_ token total supply
    /// @param underlyingToken_ the token that tokenator can be redeemed for
    /// @param commencement_ timestamp at which tokenator vesting begins
    /// @param durationDays_ duration in days for tokenator to fully vest
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        IERC20 underlyingToken_,
        uint256 commencement_,
        uint256 durationDays_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        if (commencement_ < block.timestamp) revert CommencementPassed();
        if (address(underlyingToken_) == address(0)) revert ZeroAddress();

        underlyingToken = underlyingToken_;
        commencement = commencement_;
        durationSeconds = durationDays_ * 1 days;

        _mint(msg.sender, totalSupply_);

        emit Deployed(
            msg.sender,
            underlyingToken_,
            commencement_,
            durationDays_
        );
    }

    /// @notice allows user to claim underlying token from this contract by burning tokenator token
    /// @param tokenatorAmount amount of tokenator token to burn
    /// @param to address to receive the underlying token
    /// @return underlyingTokenAmount amount of underlyingToken `to` address receives
    function claimUnderlyingToken(
        uint256 tokenatorAmount,
        address to
    ) external returns (uint256 underlyingTokenAmount) {
        if (commencement >= block.timestamp) revert CommencementNotPassed();
        if (to == address(0)) revert ZeroAddress();

        underlyingTokenAmount = underlyingTokenForTokenator(tokenatorAmount);
        _burn(msg.sender, tokenatorAmount);
        underlyingToken.safeTransfer(to, underlyingTokenAmount);

        emit ClaimUnderlyingToken(
            msg.sender,
            to,
            tokenatorAmount,
            underlyingTokenAmount
        );
    }

    /// @notice owner may withdraw underlying token in emergency situations
    /// @param amount underlying token amount to withdraw
    /// @param to address to receive the underlying token
    function emergencyWithdraw(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        underlyingToken.safeTransfer(to, amount);

        emit EmergencyWithdrawal(msg.sender, amount, to);
    }

    /// @notice owner may withdraw tokens accidentally sent to the contract
    /// @notice this function can't be used to withdraw the underlying token
    /// @param token the token to withdraw
    /// @param amount the amount of the token to withdraw
    /// @param to the address to receive the rescued token
    function rescueTokens(
        IERC20 token,
        uint256 amount,
        address to
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (token == underlyingToken) revert CannotRescueUnderlyingToken();

        token.safeTransfer(to, amount);

        emit TokensRescued(msg.sender, token, amount, to);
    }

    /// @notice returns whether the duration period is complete
    /// @return isComplete true if the duration is complete, otherwise false
    function complete() public view returns (bool isComplete) {
        isComplete = ageSeconds() >= durationSeconds;
    }

    /// @notice returns the number of seconds elapsed from the commencement time
    /// @return elapsedSeconds seconds elapsed from the commencement time
    function ageSeconds() public view returns (uint256 elapsedSeconds) {
        if (block.timestamp <= commencement) return 0;
        elapsedSeconds = block.timestamp - commencement;
    }

    /// @notice returns the tokenator redeemable percent based on current time within duration
    /// @notice scaled x18 => 1e18 = 1.00 = 100%
    /// @return p18 redeemable percent x18
    function redeemablePercent() public view returns (uint256 p18) {
        if (complete()) return PRECISION;
        p18 = (ageSeconds() * PRECISION) / durationSeconds;
    }

    /// @notice returns the amount of underlying tokens redeemable per tokenator at the end of duration, scaled by x18
    /// @notice it is permissible to send more underlying token to this contract for proportional, time-based distribution
    /// @return p18 amount of underlying token redeemable per tokenator at end of duration, scaled by x18
    function underlyingTokenPerTokenator() public view returns (uint256 p18) {
        p18 = (underlyingTokenBalance() * PRECISION) / totalSupply();
    }

    /// @notice present value, based on tokenator to redeem, value at completion and redeemable percent
    /// @param tokenatorAmount amount of tokenator token
    /// @return underlyingTokenAmount amount of underlying token that can be redeemed for specified tokenator amount
    function underlyingTokenForTokenator(
        uint256 tokenatorAmount
    ) public view returns (uint256 underlyingTokenAmount) {
        underlyingTokenAmount =
            (tokenatorAmount *
                underlyingTokenPerTokenator() *
                redeemablePercent()) /
            PRECISION /
            PRECISION;
    }

    /// @notice returns the amount of underlying token held by this contract
    /// @return underlyingTokenBalance_ amount of underlying token held by this contract
    function underlyingTokenBalance()
        public
        view
        returns (uint256 underlyingTokenBalance_)
    {
        underlyingTokenBalance_ = underlyingToken.balanceOf(address(this));
    }

    /// @notice returns relevant info for the specified user address
    /// @param user address of the user
    /// @return tokenatorBalance amount of tokenator held by the specified user
    /// @return claimable total amount of underlying the user could redeem now
    /// @return uponCompletion total amount of underlying the user could redeem at end of duration
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
            (tokenatorBalance * underlyingTokenPerTokenator()) /
            PRECISION;
        claimable = (uponCompletion * redeemablePercent()) / PRECISION;
    }
}
