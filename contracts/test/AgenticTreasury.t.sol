// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AgenticTreasury} from "../src/AgenticTreasury.sol";

/// @notice Mock receiver used to verify that target.call{value}(data) lands.
contract NoopReceiver {
    event Pinged(address sender, uint256 value, bytes data);
    receive() external payable {
        emit Pinged(msg.sender, msg.value, "");
    }
    function ping(uint256 marker) external payable returns (uint256) {
        emit Pinged(msg.sender, msg.value, abi.encode(marker));
        return marker;
    }
}

contract AgenticTreasuryTest is Test {
    AgenticTreasury internal treasury;
    NoopReceiver internal noop;

    address internal owner = address(0xA11CE);
    uint256 internal officerKey = 0xBEEF;
    address internal officer;
    address internal executor = address(0xEEEE);
    uint256 internal constant MAX_VALUE = 1 ether;

    function setUp() public {
        officer = vm.addr(officerKey);
        vm.prank(owner);
        treasury = new AgenticTreasury(officer, MAX_VALUE);
        noop = new NoopReceiver();
        vm.deal(address(treasury), 5 ether);
    }

    function _approve(
        bytes32 actionId,
        address target,
        uint256 value,
        bytes memory data,
        bytes32 policyHash,
        uint256 deadline,
        uint256 nonce
    ) internal view returns (AgenticTreasury.ApprovedAction memory approval, bytes memory signature) {
        approval = AgenticTreasury.ApprovedAction({
            actionId: actionId,
            target: target,
            value: value,
            dataHash: keccak256(data),
            policyHash: policyHash,
            deadline: deadline,
            nonce: nonce
        });
        bytes32 digest = treasury.hashApprovedAction(approval);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(officerKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function test_executeHappyPath_emitsEventAndIncrementsNonce() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (42));
        (
            AgenticTreasury.ApprovedAction memory approval,
            bytes memory sig
        ) = _approve(
                keccak256("a1"),
                address(noop),
                0.1 ether,
                data,
                keccak256("policy-v1"),
                block.timestamp + 1 hours,
                0
            );

        vm.expectEmit(true, true, true, true, address(treasury));
        emit AgenticTreasury.TreasuryActionExecuted(
            approval.actionId,
            executor,
            approval.target,
            approval.value,
            approval.policyHash,
            0
        );

        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);

        assertEq(treasury.nonces(officer), 1);
        assertTrue(treasury.executedActions(approval.actionId));
    }

    function test_replayProtection_revertsAlreadyExecuted() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (1));
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("dup"),
            address(noop),
            0,
            data,
            bytes32(uint256(1)),
            block.timestamp + 1 hours,
            0
        );
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);

        // Same approval, same signature -> actionId replay is rejected before
        // the nonce check, so a duplicate cannot leak nonce state.
        vm.expectRevert(AgenticTreasury.ActionAlreadyExecuted.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);
    }

    function test_replayProtection_revertsActionId() public {
        // Reuse same actionId with a fresh nonce should still revert.
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (2));
        (AgenticTreasury.ApprovedAction memory approval1, bytes memory sig1) = _approve(
            keccak256("same-id"),
            address(noop),
            0,
            data,
            bytes32(uint256(1)),
            block.timestamp + 1 hours,
            0
        );
        vm.prank(executor);
        treasury.executeApprovedAction(approval1, data, sig1);

        // Same actionId, new nonce.
        (AgenticTreasury.ApprovedAction memory approval2, bytes memory sig2) = _approve(
            keccak256("same-id"),
            address(noop),
            0,
            data,
            bytes32(uint256(1)),
            block.timestamp + 1 hours,
            1
        );
        vm.expectRevert(AgenticTreasury.ActionAlreadyExecuted.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval2, data, sig2);
    }

    function test_revertsOnExpiredDeadline() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (3));
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("late"),
            address(noop),
            0,
            data,
            bytes32(0),
            block.timestamp - 1,
            0
        );
        vm.expectRevert(AgenticTreasury.ApprovalExpired.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);
    }

    function test_revertsOnValueTooHigh() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (4));
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("toobig"),
            address(noop),
            MAX_VALUE + 1,
            data,
            bytes32(0),
            block.timestamp + 1 hours,
            0
        );
        vm.expectRevert(AgenticTreasury.ActionValueTooHigh.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);
    }

    function test_revertsOnDataHashMismatch() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (5));
        bytes memory wrongData = abi.encodeCall(NoopReceiver.ping, (6));
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("mismatch"),
            address(noop),
            0,
            data,
            bytes32(0),
            block.timestamp + 1 hours,
            0
        );
        vm.expectRevert(AgenticTreasury.DataHashMismatch.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, wrongData, sig);
    }

    function test_revertsOnInvalidSignature() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (7));
        AgenticTreasury.ApprovedAction memory approval = AgenticTreasury.ApprovedAction({
            actionId: keccak256("forged"),
            target: address(noop),
            value: 0,
            dataHash: keccak256(data),
            policyHash: bytes32(0),
            deadline: block.timestamp + 1 hours,
            nonce: 0
        });
        // Sign with a different key.
        uint256 attackerKey = 0xCAFE;
        bytes32 digest = treasury.hashApprovedAction(approval);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);
        vm.expectRevert(AgenticTreasury.InvalidSignature.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);
    }

    function test_setRiskOfficer_invalidatesOldSignatures() public {
        bytes memory data = abi.encodeCall(NoopReceiver.ping, (8));
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("rotate"),
            address(noop),
            0,
            data,
            bytes32(0),
            block.timestamp + 1 hours,
            0
        );
        // Owner rotates risk officer.
        address newOfficer = address(0x999);
        vm.prank(owner);
        treasury.setRiskOfficer(newOfficer);

        vm.expectRevert(AgenticTreasury.InvalidSignature.selector);
        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);
    }

    function test_only_owner_can_setMax() public {
        vm.expectRevert(AgenticTreasury.NotOwner.selector);
        treasury.setMaxActionValue(2 ether);

        vm.prank(owner);
        treasury.setMaxActionValue(2 ether);
        assertEq(treasury.maxActionValueWei(), 2 ether);
    }
}
