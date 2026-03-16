'use client';

import React from 'react';
import { TrendingUp, Zap, PieChart, ArrowRightLeft, Info } from 'lucide-react';
import { Portfolio } from '@/lib/types';
import { calculateYieldBreakdown, formatCurrency, formatPercent } from '@/lib/data';
import { Card, CardContent, CardHeader, Badge, Progress } from '@/components/ui';

interface YieldDashboardProps {
  portfolio: Portfolio | null;
}

export function YieldDashboard({ portfolio }: YieldDashboardProps) {
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading portfolio data...</div>
      </div>
    );
  }
  
  const breakdown = calculateYieldBreakdown(portfolio.totalBalance, portfolio.baseApy);
  const lockedAmount = portfolio.goals.reduce((sum, g) => sum + (g.lockPeriod ? g.depositedAmount : 0), 0);
  const unlockedAmount = portfolio.totalBalance - lockedAmount;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-neutral-500">Current APY</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{formatPercent(portfolio.baseApy)}</p>
            <p className="text-xs text-neutral-500 mt-1">Variable rate, auto-rebalancing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-neutral-500">Total Yield Earned</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{formatCurrency(portfolio.totalEarnedYield)}</p>
            <p className="text-xs text-neutral-500 mt-1">Since {new Date(portfolio.joinedDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-neutral-500">Active Balance</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{formatCurrency(portfolio.totalBalance)}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {lockedAmount > 0 ? `$${lockedAmount.toFixed(0)} locked · $${unlockedAmount.toFixed(0)} liquid` : 'All funds liquid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yield Breakdown */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">Your Yield Breakdown</h3>
          <p className="text-sm text-neutral-500">Based on ${portfolio.totalBalance.toFixed(2)} at {portfolio.baseApy}% APY</p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <YieldStat label="Per Day" value={breakdown.daily} />
            <YieldStat label="Per Week" value={breakdown.weekly} />
            <YieldStat label="Per Month" value={breakdown.monthly} />
            <YieldStat label="Per Year" value={breakdown.yearly} highlight />
          </div>
        </CardContent>
      </Card>

      {/* APY Comparison */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">How Your APY Compares</h3>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            <APYComparisonRow
              label="Traditional Savings (US Average)"
              apy={0.46}
              balance={portfolio.totalBalance}
              color="neutral"
            />
            <APYComparisonRow
              label="High-Yield Savings"
              apy={5.0}
              balance={portfolio.totalBalance}
              color="amber"
            />
            <APYComparisonRow
              label="Nest (yoUSD Vault)"
              apy={portfolio.baseApy}
              balance={portfolio.totalBalance}
              color="blue"
              isBest
            />
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              You're earning <strong>${(breakdown.yearly - portfolio.totalBalance * 0.0046).toFixed(2)} more per year</strong> than a traditional savings account.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vault Allocation */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-neutral-600" />
            <h3 className="font-semibold text-lg">Vault Allocation</h3>
          </div>
          <p className="text-sm text-neutral-500">Auto-rebalanced across protocols for optimal yield</p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-3">
            {portfolio.vaultAllocation.map((allocation) => (
              <div key={allocation.protocol} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {allocation.protocol}
                </div>
                <div className="flex-1">
                  <Progress value={allocation.percentage} color="blue" size="sm" />
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="font-medium text-neutral-900 dark:text-white">{allocation.percentage}%</span>
                  <span className="text-neutral-500 ml-1">({allocation.apy}%)</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              The vault continuously monitors rates across protocols. When yields shift, 
              it rebalances your position to maximize returns while maintaining security 
              through battle-tested protocols.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function YieldStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function APYComparisonRow({
  label,
  apy,
  balance,
  color,
  isBest = false,
}: {
  label: string;
  apy: number;
  balance: number;
  color: 'neutral' | 'amber' | 'blue';
  isBest?: boolean;
}) {
  const yearly = balance * (apy / 100);
  const colorClasses = {
    neutral: 'bg-neutral-200 dark:bg-neutral-700',
    amber: 'bg-amber-200 dark:bg-amber-700',
    blue: 'bg-blue-500',
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{apy}%</span>
            {isBest && <Badge variant="success">Best</Badge>}
          </div>
        </div>
        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color]} rounded-full`}
            style={{ width: `${Math.min((apy / 7) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-1">${yearly.toFixed(2)}/year</p>
      </div>
    </div>
  );
}
