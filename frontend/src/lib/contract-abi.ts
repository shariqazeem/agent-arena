export const AGENT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'registerAgent',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'serviceType', type: 'uint8' },
      { name: 'endpoint', type: 'string' },
      { name: 'pricePerQuery', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updateAgent',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'endpoint', type: 'string' },
      { name: 'pricePerQuery', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deactivateAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAgent',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'serviceType', type: 'uint8' },
      { name: 'endpoint', type: 'string' },
      { name: 'pricePerQuery', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'isActive', type: 'bool' },
      { name: 'registeredAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActiveAgents',
    inputs: [],
    outputs: [{ type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextAgentId',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
] as const;

export const REPUTATION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'getReputation',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'totalTxns', type: 'uint256' },
      { name: 'successRate', type: 'uint256' },
      { name: 'avgRating', type: 'uint256' },
      { name: 'compositeScore', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'recordTransaction',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'caller', type: 'address' },
      { name: 'success', type: 'bool' },
      { name: 'rating', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
