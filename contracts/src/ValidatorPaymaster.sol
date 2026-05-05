// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ValidatorPaymaster
/// @notice Minimal x402-style escrow for ERC-8004 validation requests.
///         Subject agents (e.g. Claw) deposit a fee per validation request
///         hash. Validators (e.g. Sentinel) earn the deposit and may withdraw
///         to their wallet. The deposit is keyed by the same `requestHash`
///         that ERC-8004 ValidationRegistry uses, so the on-chain trail
///         (paymaster.deposit + validation.request + validation.response)
///         is forensically linked.
/// @dev    This contract is intentionally tiny and unaudited. It is meant
///         as a public demonstration of an agent-to-agent payment primitive.
///         Production custody must use audited escrow / streaming contracts.
contract ValidatorPaymaster {
    /// @dev validator address => unwithdrawn balance in wei.
    mapping(address validator => uint256 balance) public balances;

    /// @dev requestHash => amount deposited (0 means no deposit yet).
    mapping(bytes32 requestHash => uint256 amount) public escrowed;

    /// @dev requestHash => validator (so anyone can read the link without an indexer).
    mapping(bytes32 requestHash => address validator) public validatorOf;

    /// @dev Tracks cumulative MNT each validator has *ever* earned (gross),
    ///      useful as an on-chain reputation proxy independent of withdrawals.
    mapping(address validator => uint256 totalEarnedWei) public totalEarned;

    event Deposited(
        address indexed validator,
        address indexed payer,
        bytes32 indexed requestHash,
        uint256 amountWei
    );
    event Withdrawn(address indexed validator, uint256 amountWei);

    error AlreadyDeposited();
    error NoBalance();
    error TransferFailed();
    error NoFeeProvided();
    error InvalidValidator();

    /// @notice Pay `msg.value` to `validator` for the upcoming validation
    ///         request identified by `requestHash`.
    /// @dev    A given `requestHash` can only be deposited once. The paired
    ///         ERC-8004 `validationRequest` should reuse the same hash.
    function depositForRequest(address validator, bytes32 requestHash) external payable {
        if (msg.value == 0) revert NoFeeProvided();
        if (validator == address(0)) revert InvalidValidator();
        if (escrowed[requestHash] != 0) revert AlreadyDeposited();

        escrowed[requestHash] = msg.value;
        validatorOf[requestHash] = validator;
        unchecked {
            balances[validator] += msg.value;
            totalEarned[validator] += msg.value;
        }
        emit Deposited(validator, msg.sender, requestHash, msg.value);
    }

    /// @notice Withdraw the caller's accumulated balance.
    function withdraw(uint256 amountWei) external {
        uint256 b = balances[msg.sender];
        if (b == 0 || b < amountWei) revert NoBalance();
        unchecked {
            balances[msg.sender] = b - amountWei;
        }
        (bool ok, ) = msg.sender.call{value: amountWei}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amountWei);
    }

    /// @notice Withdraw the entire balance in one call.
    function withdrawAll() external returns (uint256 amount) {
        amount = balances[msg.sender];
        if (amount == 0) revert NoBalance();
        balances[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Convenience read: amount escrowed AND the validator at once.
    function escrowedFor(bytes32 requestHash)
        external
        view
        returns (address validator, uint256 amountWei)
    {
        return (validatorOf[requestHash], escrowed[requestHash]);
    }

    receive() external payable {
        // Accidental sends go straight to msg.sender's balance so the funds
        // are never trapped. This makes the contract safe against fat fingers.
        unchecked {
            balances[msg.sender] += msg.value;
            totalEarned[msg.sender] += msg.value;
        }
        emit Deposited(msg.sender, msg.sender, bytes32(0), msg.value);
    }
}
