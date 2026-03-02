import { ethers } from 'ethers';

export interface AgentWallet {
  agentId: number;
  name: string;
  wallet: ethers.HDNodeWallet;
  address: string;
}

let agentWallets: AgentWallet[] | null = null;

const AGENT_NAMES = ['DataBot', 'NewsBot', 'TraderBot', 'SentimentBot'];

export function getAgentWallets(): AgentWallet[] {
  if (agentWallets) return agentWallets;

  const mnemonic = process.env.AGENT_MNEMONIC;
  if (!mnemonic) {
    console.warn('AGENT_MNEMONIC not set — using random wallets for demo');
    const randomMnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
    agentWallets = AGENT_NAMES.map((name, i) => {
      const wallet = ethers.HDNodeWallet.fromMnemonic(randomMnemonic, `m/44'/60'/0'/0/${i}`);
      return { agentId: i, name, wallet, address: wallet.address };
    });
    return agentWallets;
  }

  const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
  agentWallets = AGENT_NAMES.map((name, i) => {
    const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, `m/44'/60'/0'/0/${i}`);
    return { agentId: i, name, wallet, address: wallet.address };
  });

  return agentWallets;
}

export function getAgentWallet(agentId: number): AgentWallet | undefined {
  return getAgentWallets().find((w) => w.agentId === agentId);
}
