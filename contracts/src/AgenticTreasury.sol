// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title AgenticTreasury
/// @notice Demo treasury controlled by two distinct agents:
///         - Risk Officer (off-chain signer) approves a specific action via EIP-712.
///         - Executor (msg.sender of executeApprovedAction) submits the call.
///         The contract verifies the Risk Officer's signature, enforces a value
///         cap, and prevents replay via per-officer nonces and per-action ids.
/// @dev Production custody should rely on audited multisig / account abstraction.
///      This is intentionally minimal so judges can read it end-to-end.
contract AgenticTreasury {
    string public constant NAME = "AgenticTreasury";
    string public constant VERSION = "1";

    bytes32 public constant APPROVED_ACTION_TYPEHASH = keccak256(
        "ApprovedAction(bytes32 actionId,address target,uint256 value,bytes32 dataHash,bytes32 policyHash,uint256 deadline,uint256 nonce)"
    );

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    struct ApprovedAction {
        bytes32 actionId;
        address target;
        uint256 value;
        bytes32 dataHash;
        bytes32 policyHash;
        uint256 deadline;
        uint256 nonce;
    }

    address public owner;
    address public riskOfficer;
    uint256 public maxActionValueWei;

    mapping(bytes32 actionId => bool executed) public executedActions;
    mapping(address officer => uint256 nonce) public nonces;

    bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;

    event RiskOfficerUpdated(address indexed riskOfficer);
    event MaxActionValueUpdated(uint256 maxActionValueWei);
    event TreasuryActionExecuted(
        bytes32 indexed actionId,
        address indexed executor,
        address indexed target,
        uint256 value,
        bytes32 policyHash,
        uint256 nonceUsed
    );

    error NotOwner();
    error ActionAlreadyExecuted();
    error ActionValueTooHigh();
    error ApprovalExpired();
    error InvalidSignature();
    error WrongNonce();
    error DataHashMismatch();
    error TargetCallFailed(bytes returndata);

    constructor(address initialRiskOfficer, uint256 initialMaxActionValueWei) payable {
        owner = msg.sender;
        riskOfficer = initialRiskOfficer;
        maxActionValueWei = initialMaxActionValueWei;

        _CACHED_CHAIN_ID = block.chainid;
        _CACHED_DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );

        emit RiskOfficerUpdated(initialRiskOfficer);
        emit MaxActionValueUpdated(initialMaxActionValueWei);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    receive() external payable {}

    function setRiskOfficer(address nextRiskOfficer) external onlyOwner {
        riskOfficer = nextRiskOfficer;
        emit RiskOfficerUpdated(nextRiskOfficer);
    }

    function setMaxActionValue(uint256 nextMaxActionValueWei) external onlyOwner {
        maxActionValueWei = nextMaxActionValueWei;
        emit MaxActionValueUpdated(nextMaxActionValueWei);
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        if (block.chainid == _CACHED_CHAIN_ID) {
            return _CACHED_DOMAIN_SEPARATOR;
        }
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    function hashApprovedAction(ApprovedAction calldata approval) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                APPROVED_ACTION_TYPEHASH,
                approval.actionId,
                approval.target,
                approval.value,
                approval.dataHash,
                approval.policyHash,
                approval.deadline,
                approval.nonce
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), structHash));
    }

    /// @notice Submit a Risk-Officer-signed approval together with the actual
    ///         calldata. The contract validates the signature, then performs
    ///         `target.call{value}(data)`.
    function executeApprovedAction(
        ApprovedAction calldata approval,
        bytes calldata data,
        bytes calldata signature
    ) external returns (bytes memory result) {
        if (block.timestamp > approval.deadline) revert ApprovalExpired();
        if (executedActions[approval.actionId]) revert ActionAlreadyExecuted();
        if (approval.value > maxActionValueWei) revert ActionValueTooHigh();
        if (keccak256(data) != approval.dataHash) revert DataHashMismatch();

        address officer = riskOfficer;
        uint256 expectedNonce = nonces[officer];
        if (approval.nonce != expectedNonce) revert WrongNonce();

        bytes32 digest = hashApprovedAction(approval);
        address recovered = _recover(digest, signature);
        if (recovered != officer) revert InvalidSignature();

        executedActions[approval.actionId] = true;
        unchecked {
            nonces[officer] = expectedNonce + 1;
        }

        (bool ok, bytes memory callResult) = approval.target.call{value: approval.value}(data);
        if (!ok) revert TargetCallFailed(callResult);

        emit TreasuryActionExecuted(
            approval.actionId,
            msg.sender,
            approval.target,
            approval.value,
            approval.policyHash,
            expectedNonce
        );
        return callResult;
    }

    function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) revert InvalidSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        // Reject malleable signatures per EIP-2.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert InvalidSignature();
        }
        if (v != 27 && v != 28) revert InvalidSignature();
        address recovered = ecrecover(digest, v, r, s);
        if (recovered == address(0)) revert InvalidSignature();
        return recovered;
    }
}
