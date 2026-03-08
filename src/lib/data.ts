import { Portfolio } from './types';

export const mockPortfolio: Portfolio = {
  userId: 'user_123',
  totalBalance: 8420.50,
  goals: [
    {
      id: 'goal_1',
      name: 'Tokyo Trip',
      emoji: '🗼',
      targetAmount: 5000,
      depositedAmount: 3200,
      targetDate: '2025-09-15',
      monthlyPledge: 400,
      assetType: 'USDC',
      apy: 6.2,
      lockPeriod: 90,
      lockExpiry: '2025-06-10',
      createdAt: '2024-12-01',
    },
    {
      id: 'goal_2',
      name: 'Emergency Fund',
      emoji: '🛡️',
      targetAmount: 10000,
      depositedAmount: 4200.50,
      targetDate: '2025-12-31',
      monthlyPledge: 800,
      assetType: 'USDC',
      apy: 6.2,
      createdAt: '2024-10-15',
    },
    {
      id: 'goal_3',
      name: 'House Down Payment',
      emoji: '🏠',
      targetAmount: 50000,
      depositedAmount: 1020,
      targetDate: '2027-03-01',
      monthlyPledge: 600,
      assetType: 'USDC',
      apy: 6.2,
      lockPeriod: 180,
      lockExpiry: '2025-09-05',
      createdAt: '2024-11-20',
    },
  ],
  currentStreak: 12,
  longestStreak: 18,
  weeklyDepositAverage: 285,
  totalEarnedYield: 156.78,
  baseApy: 6.2,
  vaultAllocation: [
    { protocol: 'Aave v3', percentage: 35, apy: 6.4, tvl: 8200000000 },
    { protocol: 'Morpho', percentage: 25, apy: 6.8, tvl: 1800000000 },
    { protocol: 'Compound v3', percentage: 20, apy: 6.1, tvl: 3100000000 },
    { protocol: 'Spark', percentage: 12, apy: 6.3, tvl: 2400000000 },
    { protocol: 'Fluid', percentage: 8, apy: 6.5, tvl: 890000000 },
  ],
  lastDepositDate: '2025-03-01',
  joinedDate: '2024-10-15',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function calculateProgress(deposited: number, target: number): number {
  return Math.min((deposited / target) * 100, 100);
}

export function calculateMonthsToGoal(
  deposited: number,
  target: number,
  monthlyPledge: number
): number {
  const remaining = target - deposited;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthlyPledge);
}

export function calculateYieldBreakdown(balance: number, apy: number) {
  const yearly = balance * (apy / 100);
  return {
    daily: yearly / 365,
    weekly: yearly / 52,
    monthly: yearly / 12,
    yearly,
  };
}

export function getDaysUntilDate(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
