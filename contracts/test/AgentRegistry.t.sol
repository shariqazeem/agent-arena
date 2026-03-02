// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        registry = new AgentRegistry();
    }

    function testRegisterAgent() public {
        vm.prank(alice);
        uint256 id = registry.registerAgent(
            "DataBot",
            "Crypto data analysis",
            AgentRegistry.ServiceType.DataAnalysis,
            "http://localhost:4402/api/agents/0/crypto-analysis",
            20000
        );

        assertEq(id, 0);
        assertEq(registry.ownerOf(0), alice);
        assertEq(registry.nextAgentId(), 1);

        (
            string memory name,
            string memory description,
            AgentRegistry.ServiceType serviceType,
            string memory endpoint,
            uint256 price,
            address owner,
            bool isActive,
            uint256 registeredAt
        ) = registry.getAgent(0);

        assertEq(name, "DataBot");
        assertEq(description, "Crypto data analysis");
        assertEq(uint8(serviceType), uint8(AgentRegistry.ServiceType.DataAnalysis));
        assertEq(endpoint, "http://localhost:4402/api/agents/0/crypto-analysis");
        assertEq(price, 20000);
        assertEq(owner, alice);
        assertTrue(isActive);
        assertGt(registeredAt, 0);
    }

    function testUpdateAgent() public {
        vm.prank(alice);
        registry.registerAgent("Bot", "Desc", AgentRegistry.ServiceType.DataAnalysis, "http://old", 100);

        vm.prank(alice);
        registry.updateAgent(0, "http://new", 200);

        (, , , string memory endpoint, uint256 price, , , ) = registry.getAgent(0);
        assertEq(endpoint, "http://new");
        assertEq(price, 200);
    }

    function testUpdateAgentOnlyOwner() public {
        vm.prank(alice);
        registry.registerAgent("Bot", "Desc", AgentRegistry.ServiceType.DataAnalysis, "http://old", 100);

        vm.prank(bob);
        vm.expectRevert("Not agent owner");
        registry.updateAgent(0, "http://new", 200);
    }

    function testDeactivateAgent() public {
        vm.prank(alice);
        registry.registerAgent("Bot", "Desc", AgentRegistry.ServiceType.DataAnalysis, "http://ep", 100);

        vm.prank(alice);
        registry.deactivateAgent(0);

        (, , , , , , bool isActive, ) = registry.getAgent(0);
        assertFalse(isActive);
    }

    function testDeactivateAgentOnlyOwner() public {
        vm.prank(alice);
        registry.registerAgent("Bot", "Desc", AgentRegistry.ServiceType.DataAnalysis, "http://ep", 100);

        vm.prank(bob);
        vm.expectRevert("Not agent owner");
        registry.deactivateAgent(0);
    }

    function testGetActiveAgents() public {
        vm.startPrank(alice);
        registry.registerAgent("Bot0", "D", AgentRegistry.ServiceType.DataAnalysis, "http://0", 100);
        registry.registerAgent("Bot1", "D", AgentRegistry.ServiceType.NewsSummary, "http://1", 200);
        registry.registerAgent("Bot2", "D", AgentRegistry.ServiceType.TradingSignal, "http://2", 300);
        registry.deactivateAgent(1);
        vm.stopPrank();

        uint256[] memory active = registry.getActiveAgents();
        assertEq(active.length, 2);
        assertEq(active[0], 0);
        assertEq(active[1], 2);
    }

    function testMultipleAgentsIncrementId() public {
        vm.startPrank(alice);
        uint256 id0 = registry.registerAgent("A", "D", AgentRegistry.ServiceType.DataAnalysis, "http://a", 100);
        uint256 id1 = registry.registerAgent("B", "D", AgentRegistry.ServiceType.NewsSummary, "http://b", 200);
        vm.stopPrank();

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(registry.nextAgentId(), 2);
    }

    function testERC721Properties() public {
        assertEq(registry.name(), "Agent Arena");
        assertEq(registry.symbol(), "AGENT");
    }
}
