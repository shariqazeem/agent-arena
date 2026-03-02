// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationManager.sol";

contract DeployArena is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("SERVER_PRIVATE_KEY");
        address serverWallet = vm.envAddress("SERVER_WALLET_ADDRESS");

        vm.startBroadcast(deployerKey);

        AgentRegistry registry = new AgentRegistry();
        ReputationManager reputation = new ReputationManager();

        // Authorize server wallet as reputation recorder
        reputation.setRecorder(serverWallet, true);

        // Seed 4 demo agents
        string memory baseUrl = "http://localhost:4402";

        registry.registerAgent(
            "DataBot",
            "Real-time crypto market data from Chainlink oracles and CoinGecko. Provides AVAX/USD, BTC/USD prices and market metrics.",
            AgentRegistry.ServiceType.DataAnalysis,
            string.concat(baseUrl, "/api/agents/0/crypto-analysis"),
            20000 // $0.02 USDC
        );

        registry.registerAgent(
            "NewsBot",
            "AI-powered news aggregation and summarization. Delivers concise crypto market news summaries using Groq LLM.",
            AgentRegistry.ServiceType.NewsSummary,
            string.concat(baseUrl, "/api/agents/1/news-summary"),
            10000 // $0.01 USDC
        );

        registry.registerAgent(
            "TraderBot",
            "Advanced trading signal generator. Orchestrates DataBot and NewsBot via x402 payments, merges insights with AI analysis.",
            AgentRegistry.ServiceType.TradingSignal,
            string.concat(baseUrl, "/api/agents/2/trading-signal"),
            50000 // $0.05 USDC
        );

        registry.registerAgent(
            "SentimentBot",
            "Market sentiment analysis powered by AI. Analyzes news and social signals to gauge market mood and fear/greed index.",
            AgentRegistry.ServiceType.Sentiment,
            string.concat(baseUrl, "/api/agents/3/sentiment-analysis"),
            30000 // $0.03 USDC
        );

        vm.stopBroadcast();

        console.log("AgentRegistry deployed at:", address(registry));
        console.log("ReputationManager deployed at:", address(reputation));
        console.log("Server wallet authorized as recorder:", serverWallet);
        console.log("4 demo agents seeded");
    }
}
