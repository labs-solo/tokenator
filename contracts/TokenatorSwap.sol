// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Terms } from "./Terms.sol";

contract TokenatorSwap is Terms, Ownable {
    using SafeERC20 for IERC20;

    uint256 private constant PRECISION = 1e18;
    address public immutable liquidityToken;
    address public immutable tokenator;
    uint256 public swapRate; // swap rate between liquidity token and tokenator token
    mapping (address account => bool approved) public approvedTerms;

    error ZeroSwapRate();
    error ZeroAddress();
    error TermsAlreadyApproved();
    error InvalidTermsHash();
    error TermsNotApproved();

    event EmergencyWithdrawal(address token, uint256 amount, address to);
    event SwapForTokenator(address to, uint256 liquidityTokenAmount, uint256 tokenatorAmount);
    event SwapRateUpdated(uint256 oldRate, uint256 newRate);
    event AgreedToTerms(address account, bytes32 terms);
    event Deployed(address deployer, address liqudityToken, address tokenator, uint256 swapRate);

    constructor(address liquidityToken_, address tokenator_, uint256 swapRate_) Ownable(msg.sender) {
        liquidityToken = liquidityToken_;
        tokenator = tokenator_;
        swapRate = swapRate_;
        emit Deployed(msg.sender, liquidityToken_, tokenator_, swapRate_);
    }

    function termsHash(address account) public pure returns (bytes32) {
        return keccak256(abi.encode(account, termsAndConditions));
    }

    function isAgreedToTerms(address account) public view returns (bool) {
        return approvedTerms[account];
    }

    function setSwapRate(uint256 rate_) external onlyOwner {
        if(rate_ == 0) revert ZeroSwapRate();

        swapRate = rate_;

        emit SwapRateUpdated(swapRate, rate_);
    }

    function emergencyWithdraw(address _token, uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        IERC20(_token).safeTransfer(to, amount);

        emit EmergencyWithdrawal(_token, amount, to);
    }

    function consentAndAgreeToTerms(bytes32 terms) external {
        if (isAgreedToTerms(msg.sender)) revert TermsAlreadyApproved();
        if (termsHash(msg.sender) != terms) revert InvalidTermsHash();

        approvedTerms[msg.sender] = true;
        
        emit AgreedToTerms(msg.sender, terms);
    }

    function swap(uint256 amountIn, address to) external {
        if (!isAgreedToTerms(msg.sender)) revert TermsNotApproved();
        if (to == address(0)) revert ZeroAddress();

        uint256 amountOut = amountIn * PRECISION / swapRate;

        emit SwapForTokenator(to, amountIn, amountOut);

        IERC20(liquidityToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenator).transfer(to, amountOut);
    }
}
