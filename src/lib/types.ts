export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  depositedAmount: number;
  targetDate: string;
  monthlyPledge: number;
  assetType: 'USDC' | 'ETH';
  apy: number;
  lockPeriod?: number;
  lockExpiry?: string;
  createdAt: string;
}

export interface Portfolio {
  userId: string;
  totalBalance: number;
  goals: Goal[];
  currentStreak: number;
  longestStreak: number;
  weeklyDepositAverage: number;
  totalEarnedYield: number;
  baseApy: number;
  vaultAllocation: VaultAllocation[];
  lastDepositDate?: string;
  joinedDate: string;
}

export interface VaultAllocation {
  protocol: string;
  percentage: number;
  apy: number;
  tvl: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface YieldBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export const PROTOCOLS = [
  { name: 'Aave v3', description: 'Lending protocol with deep liquidity', tvl: '$8.2B' },
  { name: 'Morpho', description: 'Peer-to-peer lending optimizer', tvl: '$1.8B' },
  { name: 'Compound v3', description: 'Algorithmic money markets', tvl: '$3.1B' },
  { name: 'Spark', description: 'DAO-governed lending by Maker', tvl: '$2.4B' },
  { name: 'Fluid', description: 'Instadapp\'s lending layer', tvl: '$890M' },
  { name: 'Euler', description: 'Permissionless lending protocol', tvl: '$450M' },
];

export const LOCK_PERIODS = [
  { days: 30, boost: 0.5, label: '30 Days' },
  { days: 90, boost: 1.0, label: '90 Days' },
  { days: 180, boost: 1.5, label: '180 Days' },
];
