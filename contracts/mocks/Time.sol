// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

contract Time {

    function blockTime() external view returns(uint256 time) {
        time = block.timestamp;
    }
}