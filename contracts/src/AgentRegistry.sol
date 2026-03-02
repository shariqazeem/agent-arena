// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentRegistry — ERC-8004 compatible AI Agent NFT registry
/// @notice Each AI agent is represented as an NFT with on-chain metadata
contract AgentRegistry is ERC721, Ownable {
    enum ServiceType {
        DataAnalysis,
        NewsSummary,
        TradingSignal,
        Sentiment
    }

    struct Agent {
        string name;
        string description;
        ServiceType serviceType;
        string endpoint;
        uint256 pricePerQuery; // in USDC (6 decimals)
        address owner;
        bool isActive;
        uint256 registeredAt;
    }

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;

    event AgentRegistered(
        uint256 indexed agentId,
        string name,
        ServiceType serviceType,
        address indexed owner,
        uint256 pricePerQuery
    );
    event AgentUpdated(uint256 indexed agentId, string endpoint, uint256 pricePerQuery);
    event AgentDeactivated(uint256 indexed agentId);

    constructor() ERC721("Agent Arena", "AGENT") Ownable(msg.sender) {}

    /// @notice Register a new AI agent — mints an NFT to the caller
    function registerAgent(
        string calldata name,
        string calldata description,
        ServiceType serviceType,
        string calldata endpoint,
        uint256 pricePerQuery
    ) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        _mint(msg.sender, agentId);

        agents[agentId] = Agent({
            name: name,
            description: description,
            serviceType: serviceType,
            endpoint: endpoint,
            pricePerQuery: pricePerQuery,
            owner: msg.sender,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit AgentRegistered(agentId, name, serviceType, msg.sender, pricePerQuery);
        return agentId;
    }

    /// @notice Update agent endpoint and price — owner only
    function updateAgent(
        uint256 agentId,
        string calldata endpoint,
        uint256 pricePerQuery
    ) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].endpoint = endpoint;
        agents[agentId].pricePerQuery = pricePerQuery;
        emit AgentUpdated(agentId, endpoint, pricePerQuery);
    }

    /// @notice Deactivate an agent — owner only
    function deactivateAgent(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    /// @notice Get full agent data
    function getAgent(uint256 agentId)
        external
        view
        returns (
            string memory name,
            string memory description,
            ServiceType serviceType,
            string memory endpoint,
            uint256 pricePerQuery,
            address owner,
            bool isActive,
            uint256 registeredAt
        )
    {
        Agent storage a = agents[agentId];
        return (
            a.name,
            a.description,
            a.serviceType,
            a.endpoint,
            a.pricePerQuery,
            a.owner,
            a.isActive,
            a.registeredAt
        );
    }

    /// @notice Get all active agent IDs
    function getActiveAgents() external view returns (uint256[] memory) {
        uint256 total = nextAgentId;
        uint256 count;
        for (uint256 i; i < total; i++) {
            if (agents[i].isActive) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx;
        for (uint256 i; i < total; i++) {
            if (agents[i].isActive) {
                result[idx++] = i;
            }
        }
        return result;
    }
}
