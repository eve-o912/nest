'use client';

import React from 'react';
import { Shield, FileCheck, XCircle, TrendingDown, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { PROTOCOLS } from '@/lib/types';
import { Card, CardContent, CardHeader, Badge } from '@/components/ui';

export function RiskEducation() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Risk Overview</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Nest and the yoUSD vault are designed to be low-risk DeFi — closer to a high-yield 
                savings account than speculative investing. Here's the honest breakdown of what could go wrong.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Categories */}
      <div className="space-y-4">
        <RiskCard
          icon={FileCheck}
          title="Smart Contract Risk"
          level="low"
          description="yoUSD and partner protocols are audited but not guaranteed. Bugs could theoretically result in lost funds."
          details={[
            "Multiple security audits by reputable firms",
            "Bug bounty programs active",
            "Aave, Morpho, Compound have years of track record",
            "Billions in Total Value Locked (TVL) across protocols",
          ]}
        />

        <RiskCard
          icon={XCircle}
          title="Liquidation Risk"
          level="none"
          description="This does NOT apply to yoUSD. There's no leverage, no loans, no liquidation possibility."
          details={[
            "Your funds are never borrowed against",
            "No margin calls or liquidation mechanics",
            "Principal remains stable (in USDC terms)",
          ]}
        />

        <RiskCard
          icon={TrendingDown}
          title="Stablecoin Depeg Risk"
          level="low"
          description="USDC could theoretically lose its 1:1 peg to USD, though this has historically been extremely rare and short-lived."
          details={[
            "USDC is the most regulated stablecoin",
            "Issued by Circle, backed 1:1 by cash and T-bills",
            "Monthly attestations by Grant Thornton",
            "Has maintained peg through multiple market cycles",
          ]}
        />

        <RiskCard
          icon={Building}
          title="Protocol Risk"
          level="low"
          description="Aave, Morpho, Compound, or other partner protocols could be exploited."
          details={PROTOCOLS.slice(0, 4).map(p => `${p.name}: ${p.tvl} TVL, years of operation`)}
        />

        <RiskCard
          icon={AlertTriangle}
          title="APY Volatility Risk"
          level="medium"
          description="Rates fluctuate with DeFi market conditions. Historical range: 5.5%–8% for yoUSD."
          details={[
            "Vault rebalances automatically to optimize",
            "Cannot guarantee a fixed rate",
            "Rate drops typically gradual, not sudden",
            "Still historically outperforms traditional savings",
          ]}
        />
      </div>

      {/* vs FTX / CeFi */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">How This Is Different From FTX</h3>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-800 dark:text-red-300 mb-2">FTX / Celsius / BlockFi</p>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                <li>• Centralized company held your funds</li>
                <li>• Company lent your money to risky counterparties</li>
                <li>• No transparency — you didn't know where funds went</li>
                <li>• Bankruptcy froze all withdrawals</li>
                <li>• No on-chain visibility</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-800 dark:text-green-300 mb-2">Nest / yoUSD</p>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <li>• Fully on-chain — you control your funds</li>
                <li>• Money goes to audited DeFi protocols only</li>
                <li>• Complete transparency — see exactly where funds are</li>
                <li>• Smart contracts execute automatically</li>
                <li>• Withdraw anytime (unless you chose to lock)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Bottom Line</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This is low-risk yield on idle cash. The main risks are smart contract bugs (audited, battle-tested) 
              and APY fluctuations (historically 5.5%–8%). It's not risk-free, but it's fundamentally different 
              from high-risk DeFi like leverage, derivatives, or new unaudited protocols. 
              You're earning yield by lending to over-collateralized borrowers through established protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskCard({
  icon: Icon,
  title,
  level,
  description,
  details,
}: {
  icon: React.ElementType;
  title: string;
  level: 'none' | 'low' | 'medium' | 'high';
  description: string;
  details: string[];
}) {
  const levelColors = {
    none: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white">{title}</h4>
              <Badge variant={level === 'none' ? 'success' : level === 'low' ? 'info' : level === 'medium' ? 'warning' : 'error'}>
                {level === 'none' ? 'No Risk' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{description}</p>
        <ul className="space-y-1">
          {details.map((detail, i) => (
            <li key={i} className="text-sm text-neutral-500 flex items-start gap-2">
              <span className="text-blue-500">•</span>
              {detail}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
