// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationManager — On-chain reputation tracking for AI agents
contract ReputationManager is Ownable {
    struct Reputation {
        uint256 totalTransactions;
        uint256 successCount;
        uint256 totalRating; // sum of all ratings (each 100-500)
    }

    mapping(uint256 => Reputation) public reputations;
    mapping(address => bool) public authorizedRecorders;

    event TransactionRecorded(
        uint256 indexed agentId,
        address indexed caller,
        bool success,
        uint256 rating
    );
    event RecorderAuthorized(address indexed recorder, bool authorized);

    constructor() Ownable(msg.sender) {}

    modifier onlyRecorder() {
        require(authorizedRecorders[msg.sender], "Not authorized recorder");
        _;
    }

    function setRecorder(address recorder, bool authorized) external onlyOwner {
        authorizedRecorders[recorder] = authorized;
        emit RecorderAuthorized(recorder, authorized);
    }

    /// @notice Record a transaction outcome for an agent
    /// @param rating 100-500 (1.0x to 5.0x stars scaled by 100)
    function recordTransaction(
        uint256 agentId,
        address caller,
        bool success,
        uint256 rating
    ) external onlyRecorder {
        require(rating >= 100 && rating <= 500, "Rating must be 100-500");

        Reputation storage rep = reputations[agentId];
        rep.totalTransactions++;
        if (success) rep.successCount++;
        rep.totalRating += rating;

        emit TransactionRecorded(agentId, caller, success, rating);
    }

    /// @notice Get reputation metrics for an agent
    /// @return totalTxns Total number of transactions
    /// @return successRate Success rate in basis points (0-10000)
    /// @return avgRating Average rating (100-500)
    /// @return compositeScore Composite score (0-1000)
    function getReputation(uint256 agentId)
        external
        view
        returns (
            uint256 totalTxns,
            uint256 successRate,
            uint256 avgRating,
            uint256 compositeScore
        )
    {
        Reputation storage rep = reputations[agentId];
        totalTxns = rep.totalTransactions;

        if (totalTxns == 0) {
            return (0, 0, 0, 0);
        }

        successRate = (rep.successCount * 10000) / totalTxns;
        avgRating = rep.totalRating / totalTxns;

        // Composite: 60% success rate (scaled to 0-600) + 40% rating (scaled to 0-400)
        uint256 successComponent = (successRate * 600) / 10000;
        uint256 ratingComponent = ((avgRating - 100) * 400) / 400; // normalize 100-500 → 0-400
        compositeScore = successComponent + ratingComponent;
    }
}
