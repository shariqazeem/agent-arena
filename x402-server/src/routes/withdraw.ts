import { Router } from 'express';
import { getOnChainAgent } from '../services/agentRegistry.js';
import { activityLog } from '../services/activityLog.js';
import { withdrawEarnings } from '../services/withdraw.js';

export const withdrawRouter = Router();

withdrawRouter.post('/agents/:id/withdraw', async (req, res) => {
  const id = parseInt(req.params.id);
  const { ownerAddress } = req.body as { ownerAddress?: string };

  if (!ownerAddress || typeof ownerAddress !== 'string') {
    res.status(400).json({ error: 'ownerAddress is required' });
    return;
  }

  try {
    // Validate agent exists on-chain
    const agent = await getOnChainAgent(id);
    if (!agent) {
      res.status(404).json({ error: `Agent ${id} not found on-chain` });
      return;
    }

    // Validate caller is the agent owner
    if (ownerAddress.toLowerCase() !== agent.owner.toLowerCase()) {
      res.status(403).json({ error: 'Only the agent owner can withdraw earnings' });
      return;
    }

    // Calculate withdrawable amount (non-withdrawn payments)
    const allActivities = activityLog.getAll(200);
    const payments = allActivities.filter(
      (a) =>
        (a.type === 'x402_payment' || a.type === 'agent_call') &&
        a.toAgent === agent.name &&
        !a.metadata?.withdrawn,
    );

    const withdrawable = payments.reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0);

    if (withdrawable <= 0) {
      res.status(400).json({ error: 'No earnings available to withdraw' });
      return;
    }

    // Execute USDC transfer
    const { txHash, amount } = await withdrawEarnings(ownerAddress, withdrawable);

    // Mark payments as withdrawn
    activityLog.markWithdrawn(agent.name);

    // Log the withdrawal
    activityLog.add({
      type: 'x402_payment',
      fromAgent: 'Arena',
      toAgent: agent.name,
      amount: amount,
      description: `Withdrawal of $${amount} USDC to owner ${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`,
      txHash,
    });

    res.json({ txHash, amount, agentName: agent.name });
  } catch (err) {
    console.error(`Withdrawal failed for agent ${id}:`, err);
    res.status(500).json({ error: (err as Error).message || 'Withdrawal failed' });
  }
});
