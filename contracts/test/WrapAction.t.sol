// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AgenticTreasury} from "../src/AgenticTreasury.sol";

/// @notice Minimal WETH9-style wrapper, mirroring the real WMNT on Mantle
///         Sepolia (deposit native -> mint wrapped 1:1). Used to prove the
///         treasury can drive a real external DeFi protocol, not just self-calls.
contract MockWMNT {
    string public constant symbol = "WMNT";
    mapping(address => uint256) public balanceOf;

    event Deposit(address indexed dst, uint256 wad);

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}

/// @notice Proves the Phase 3 real-DeFi action: Guard approves wrapping a
///         bounded amount of native MNT into WMNT, Claw executes it through the
///         already-deployed AgenticTreasury, and the treasury ends up holding
///         WMNT. This is the exact on-chain path the wrap-action script then
///         runs against the real WMNT on Mantle Sepolia.
contract WrapActionTest is Test {
    AgenticTreasury internal treasury;
    MockWMNT internal wmnt;

    address internal owner = address(0xA11CE);
    uint256 internal officerKey = 0xBEEF;
    address internal officer;
    address internal executor = address(0xEEEE);
    uint256 internal constant MAX_VALUE = 1 ether;

    function setUp() public {
        officer = vm.addr(officerKey);
        vm.prank(owner);
        treasury = new AgenticTreasury(officer, MAX_VALUE);
        wmnt = new MockWMNT();
        vm.deal(address(treasury), 1 ether); // treasury holds native MNT to wrap
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

    function test_wrapNativeIntoWMNT_throughGuardApproval() public {
        uint256 wrapAmount = 0.01 ether;
        bytes memory data = abi.encodeWithSignature("deposit()");
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("wrap-1"),
            address(wmnt),
            wrapAmount,
            data,
            keccak256("policy-wrap-v1"),
            block.timestamp + 1 hours,
            0
        );

        assertEq(wmnt.balanceOf(address(treasury)), 0, "treasury starts with 0 WMNT");

        vm.prank(executor);
        treasury.executeApprovedAction(approval, data, sig);

        // Sentinel's invariant: the treasury now holds exactly wrapAmount WMNT,
        // and the native MNT left the treasury.
        assertEq(wmnt.balanceOf(address(treasury)), wrapAmount, "treasury holds wrapped WMNT");
        assertEq(address(treasury).balance, 1 ether - wrapAmount, "native MNT spent on the wrap");
    }

    /// @notice Guard signs `deposit()`; a tampered executor cannot swap it for
    ///         `withdraw(...)`. The dataHash binding is what makes the approval
    ///         a real authorization and not a blank check.
    function test_wrap_revertsWhenExecutorTampersCalldata() public {
        uint256 wrapAmount = 0.01 ether;
        bytes memory approvedData = abi.encodeWithSignature("deposit()");
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("wrap-2"),
            address(wmnt),
            wrapAmount,
            approvedData,
            keccak256("policy-wrap-v1"),
            block.timestamp + 1 hours,
            0
        );

        bytes memory tampered = abi.encodeWithSignature("withdraw(uint256)", wrapAmount);
        vm.prank(executor);
        vm.expectRevert(AgenticTreasury.DataHashMismatch.selector);
        treasury.executeApprovedAction(approval, tampered, sig);
    }

    /// @notice The value cap still applies to external protocol calls.
    function test_wrap_revertsWhenAboveValueCap() public {
        uint256 tooMuch = MAX_VALUE + 1;
        bytes memory data = abi.encodeWithSignature("deposit()");
        (AgenticTreasury.ApprovedAction memory approval, bytes memory sig) = _approve(
            keccak256("wrap-3"),
            address(wmnt),
            tooMuch,
            data,
            keccak256("policy-wrap-v1"),
            block.timestamp + 1 hours,
            0
        );

        vm.prank(executor);
        vm.expectRevert(AgenticTreasury.ActionValueTooHigh.selector);
        treasury.executeApprovedAction(approval, data, sig);
    }
}
