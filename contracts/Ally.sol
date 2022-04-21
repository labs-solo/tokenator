// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "./IAlly.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract Ally is ERC20Burnable {

    constructor(uint256 initialSupply) ERC20("ICHI Ally", "ALLY") {
        _mint(msg.sender, initialSupply);
    }
}
