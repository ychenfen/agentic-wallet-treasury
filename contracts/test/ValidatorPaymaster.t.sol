// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {ValidatorPaymaster} from "../src/ValidatorPaymaster.sol";

contract ValidatorPaymasterTest is Test {
    ValidatorPaymaster internal pm;

    address internal validator = address(0xBEEF);
    address internal payer = address(0xCA11);

    function setUp() public {
        pm = new ValidatorPaymaster();
        vm.deal(payer, 10 ether);
        vm.deal(validator, 0);
    }

    function test_depositCreditsValidator() public {
        bytes32 reqHash = keccak256("req-1");
        vm.prank(payer);
        pm.depositForRequest{value: 0.001 ether}(validator, reqHash);

        assertEq(pm.balances(validator), 0.001 ether);
        assertEq(pm.escrowed(reqHash), 0.001 ether);
        assertEq(pm.validatorOf(reqHash), validator);
        assertEq(pm.totalEarned(validator), 0.001 ether);
    }

    function test_depositRevertsOnDuplicateRequestHash() public {
        bytes32 reqHash = keccak256("req-2");
        vm.prank(payer);
        pm.depositForRequest{value: 0.001 ether}(validator, reqHash);

        vm.expectRevert(ValidatorPaymaster.AlreadyDeposited.selector);
        vm.prank(payer);
        pm.depositForRequest{value: 0.001 ether}(validator, reqHash);
    }

    function test_depositRevertsOnZeroFee() public {
        vm.expectRevert(ValidatorPaymaster.NoFeeProvided.selector);
        vm.prank(payer);
        pm.depositForRequest{value: 0}(validator, keccak256("zero"));
    }

    function test_depositRevertsOnZeroValidator() public {
        vm.expectRevert(ValidatorPaymaster.InvalidValidator.selector);
        vm.prank(payer);
        pm.depositForRequest{value: 0.001 ether}(address(0), keccak256("zv"));
    }

    function test_validatorWithdraws() public {
        bytes32 reqHash = keccak256("req-3");
        vm.prank(payer);
        pm.depositForRequest{value: 0.005 ether}(validator, reqHash);

        uint256 balBefore = validator.balance;
        vm.prank(validator);
        pm.withdraw(0.003 ether);

        assertEq(validator.balance, balBefore + 0.003 ether);
        assertEq(pm.balances(validator), 0.002 ether);
        // Total earned tracks gross, not net of withdrawals.
        assertEq(pm.totalEarned(validator), 0.005 ether);
    }

    function test_withdrawAllResetsBalance() public {
        bytes32 reqHash = keccak256("req-4");
        vm.prank(payer);
        pm.depositForRequest{value: 0.01 ether}(validator, reqHash);

        vm.prank(validator);
        uint256 paid = pm.withdrawAll();
        assertEq(paid, 0.01 ether);
        assertEq(pm.balances(validator), 0);
    }

    function test_withdrawRevertsOnInsufficient() public {
        vm.expectRevert(ValidatorPaymaster.NoBalance.selector);
        vm.prank(validator);
        pm.withdraw(1);
    }

    function test_eventEmitted() public {
        bytes32 reqHash = keccak256("req-5");
        vm.expectEmit(true, true, true, true, address(pm));
        emit ValidatorPaymaster.Deposited(validator, payer, reqHash, 0.0042 ether);
        vm.prank(payer);
        pm.depositForRequest{value: 0.0042 ether}(validator, reqHash);
    }

    function test_receiveCreditsSender() public {
        // Accidental plain transfer: validator sends MNT to the paymaster.
        // Should land in *their* own balance so funds aren't stuck.
        vm.deal(validator, 0.1 ether);
        vm.prank(validator);
        (bool ok, ) = address(pm).call{value: 0.05 ether}("");
        assertTrue(ok);
        assertEq(pm.balances(validator), 0.05 ether);
    }

    function test_multipleRequestsAccumulate() public {
        for (uint256 i = 0; i < 5; i += 1) {
            bytes32 h = keccak256(abi.encode("req", i));
            vm.prank(payer);
            pm.depositForRequest{value: 0.001 ether}(validator, h);
        }
        assertEq(pm.balances(validator), 0.005 ether);
        assertEq(pm.totalEarned(validator), 0.005 ether);
    }
}
