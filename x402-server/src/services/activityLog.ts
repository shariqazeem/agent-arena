import { WebSocket } from 'ws';

export interface ActivityRecord {
  id: string;
  type: 'x402_payment' | 'agent_call' | 'orchestration' | 'reputation_update';
  fromAgent: string;
  toAgent: string;
  amount: string;
  description: string;
  txHash?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class ActivityLog {
  private records: ActivityRecord[] = [];
  private wsClients: Set<WebSocket> = new Set();
  private maxRecords = 200;

  addClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => this.wsClients.delete(ws));
  }

  add(record: Omit<ActivityRecord, 'id' | 'timestamp'>): ActivityRecord {
    const entry: ActivityRecord = {
      ...record,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: Date.now(),
    };
    this.records.unshift(entry);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(0, this.maxRecords);
    }
    this.broadcast(entry);
    return entry;
  }

  getAll(limit = 50): ActivityRecord[] {
    return this.records.slice(0, limit);
  }

  getStats() {
    const totalTransactions = this.records.length;
    const totalUSDC = this.records
      .filter((r) => r.type === 'x402_payment')
      .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
    const uniqueAgents = new Set([
      ...this.records.map((r) => r.fromAgent),
      ...this.records.map((r) => r.toAgent),
    ].filter(Boolean));

    return {
      totalTransactions,
      totalUSDC: totalUSDC.toFixed(4),
      activeAgents: uniqueAgents.size,
      lastActivity: this.records[0]?.timestamp || null,
    };
  }

  private broadcast(record: ActivityRecord) {
    const msg = JSON.stringify({ type: 'activity', data: record });
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }
}

export const activityLog = new ActivityLog();
