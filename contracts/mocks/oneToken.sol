// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract oneToken is ERC20 {

    uint256 private constant initialSupply = 10000000 * 1e18;

    constructor() ERC20("oneToken MOCK", "oneToken") {
        _mint(msg.sender, initialSupply);
    }
}
