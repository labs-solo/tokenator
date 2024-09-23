// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenator {
    error ZeroAddress();
    error CommencementPassed();
    error CommencementNotPassed();
    error CannotRescueUnderlyingToken();

    event Deployed(
        address deployer,
        IERC20 underlyingToken,
        uint256 commencement,
        uint256 durationDays
    );
    event ClaimUnderlyingToken(
        address indexed user,
        address indexed to,
        uint256 tokenatorAmount,
        uint256 underlyingTokenAmount
    );
    event EmergencyWithdrawal(
        address indexed caller,
        uint256 amount,
        address indexed to
    );
    event TokensRescued(
        address indexed caller,
        IERC20 token,
        uint256 amount,
        address indexed to
    );

    /// @notice allows user to claim underlying token from this contract by burning tokenator token
    /// @param tokenatorAmount amount of tokenator token to burn
    /// @param to address to receive the underlying token
    /// @return underlyingTokenAmount amount of underlyingToken `to` address receives
    function claimUnderlyingToken(
        uint256 tokenatorAmount,
        address to
    ) external returns (uint256 underlyingTokenAmount);

    /// @notice owner may withdraw underlying token in emergency situations
    /// @param amount underlying token amount to withdraw
    /// @param to address to receive the underlying token
    function emergencyWithdraw(uint256 amount, address to) external;

    /// @notice owner may withdraw tokens accidentally sent to the contract
    /// @notice this function can't be used to withdraw the underlying token
    /// @param token the token to withdraw
    /// @param amount the amount of the token to withdraw
    /// @param to the address to receive the rescued token
    function rescueTokens(IERC20 token, uint256 amount, address to) external;

    /// @notice returns whether the duration period is complete
    /// @return true if the duration is complete, otherwise false
    function complete() external view returns (bool);

    /// @notice returns the number of seconds elapsed from the commencement time
    /// @return elapsedSeconds seconds elapsed from the commencement time
    function ageSeconds() external view returns (uint256 elapsedSeconds);

    /// @notice returns the tokenator redeemable percent based on current time within duration
    /// @notice scaled x18 => 1e18 = 1.00 = 100%
    /// @return p18 redeemable percent x18
    function redeemablePercent() external view returns (uint256 p18);

    /// @notice returns the amount of underlying tokens redeemable per tokenator at the end of duration, scaled by x18
    /// @notice it is permissible to send more underlying token to this contract for proportional, time-based distribution
    /// @return p18 amount of underlying token redeemable per tokenator at end of duration, scaled by x18
    function underlyingTokenPerTokenator() external view returns (uint256 p18);

    /// @notice present value, based on tokenator to redeem, value at completion and redeemable percent
    /// @param tokenatorAmount amount of tokenator token
    /// @return underlyingTokenAmount amount of underlying token that can be redeemed for specified tokenator amount
    function underlyingTokenForTokenator(
        uint256 tokenatorAmount
    ) external view returns (uint256 underlyingTokenAmount);

    /// @notice returns the amount of underlying token held by this contract
    /// @return underlyingTokenBalance_ amount of underlying token held by this contract
    function underlyingTokenBalance()
        external
        view
        returns (uint256 underlyingTokenBalance_);

    /// @notice returns relevant info for the specified user address
    /// @param user address of the user
    /// @return tokenatorBalance amount of tokenator held by the specified user
    /// @return claimable total amount of underlying the user could redeem now
    /// @return uponCompletion total amount of underlying the user could redeem at end of duration
    function userBalances(
        address user
    )
        external
        view
        returns (
            uint256 tokenatorBalance,
            uint256 claimable,
            uint256 uponCompletion
        );

    /// @notice returns the address of the underlying token
    /// @return IERC20 the address of the underlying token
    function underlyingToken() external view returns (IERC20);

    /// @notice returns the timestamp that the duration begins
    /// @return uint256 the timestamp the duration begins
    function commencement() external view returns (uint256);

    /// @notice returns the length of the claimable duration in seconds
    /// @return uint256 the length of the duration in seconds
    function durationSeconds() external view returns (uint256);
}
