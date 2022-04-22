// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ICHIV2 is ERC20 {

    uint256 private constant initialSupply = 10000000 * 1e18;

    constructor() ERC20("ICHI MOCK", "ICHI") {
        _mint(msg.sender, initialSupply);
    }
}
