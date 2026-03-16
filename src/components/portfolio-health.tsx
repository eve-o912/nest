'use client';

import React from 'react';
import { Heart, AlertTriangle, CheckCircle, TrendingUp, Shield, Target, PiggyBank, Calendar } from 'lucide-react';
import { Portfolio } from '@/lib/types';
import { formatCurrency, calculateProgress, getDaysUntilDate, calculateMonthsToGoal } from '@/lib/data';
import { Card, CardContent, CardHeader, Badge, Progress } from '@/components/ui';

interface PortfolioHealthProps {
  portfolio: Portfolio | null;
}

export function PortfolioHealth({ portfolio }: PortfolioHealthProps) {
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading portfolio data...</div>
      </div>
    );
  }
  
  const goals = portfolio.goals;
  const totalMonthly = goals.reduce((sum, g) => sum + g.monthlyPledge, 0);
  const hasEmergencyFund = goals.some(g => g.name.toLowerCase().includes('emergency'));
  const emergencyFund = goals.find(g => g.name.toLowerCase().includes('emergency'));
  
  // Calculate health score
  let healthScore = 70;
  const issues: string[] = [];
  const positives: string[] = [];
  
  if (portfolio.currentStreak >= 4) {
    healthScore += 10;
    positives.push(`${portfolio.currentStreak}-week deposit streak`);
  }
  
  if (hasEmergencyFund && emergencyFund) {
    const efProgress = calculateProgress(emergencyFund.depositedAmount, emergencyFund.targetAmount);
    if (efProgress >= 50) {
      healthScore += 10;
      positives.push(`Emergency fund at ${efProgress.toFixed(0)}%`);
    } else {
      healthScore -= 10;
      issues.push(`Emergency fund only at ${efProgress.toFixed(0)}% — prioritize this`);
    }
  } else {
    healthScore -= 20;
    issues.push("No emergency fund — this is your biggest gap");
  }
  
  if (portfolio.totalBalance > 0) {
    positives.push(`$${portfolio.totalEarnedYield.toFixed(2)} earned in yield`);
  }
  
  // Find at-risk goals
  const atRiskGoals = goals.filter(goal => {
    const daysLeft = getDaysUntilDate(goal.targetDate);
    const monthsNeeded = calculateMonthsToGoal(goal.depositedAmount, goal.targetAmount, goal.monthlyPledge);
    return !goal.name.toLowerCase().includes('emergency') && monthsNeeded > Math.ceil(daysLeft / 30) && goal.depositedAmount < goal.targetAmount;
  });
  
  if (atRiskGoals.length > 0) {
    healthScore -= atRiskGoals.length * 5;
    issues.push(`${atRiskGoals.length} goal${atRiskGoals.length > 1 ? 's' : ''} behind schedule`);
  }
  
  const status = healthScore >= 80 ? { label: 'Strong', color: 'success' as const } : 
                 healthScore >= 60 ? { label: 'Good', color: 'default' as const } : 
                 { label: 'Needs Work', color: 'warning' as const };

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                healthScore >= 80 ? 'bg-green-100 dark:bg-green-900/30' : 
                healthScore >= 60 ? 'bg-blue-100 dark:bg-blue-900/30' : 
                'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <Heart className={`w-6 h-6 ${
                  healthScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                  healthScore >= 60 ? 'text-blue-600 dark:text-blue-400' : 
                  'text-amber-600 dark:text-amber-400'
                }`} />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">Portfolio Health</h2>
                <p className="text-sm text-neutral-500">Based on your goals, streak, and strategy</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">{healthScore}</span>
              <span className="text-neutral-500">/100</span>
              <Badge variant={status.color} className="ml-2">{status.label}</Badge>
            </div>
          </div>
          <Progress value={healthScore} max={100} color={healthScore >= 80 ? 'green' : healthScore >= 60 ? 'blue' : 'amber'} size="lg" />
        </CardContent>
      </Card>

      {/* Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Positives */}
        <Card>
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">What's Going Well</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {positives.length > 0 ? (
              <ul className="space-y-2">
                {positives.map((positive, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {positive}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">Start building your savings foundation to see positives here.</p>
            )}
          </CardContent>
        </Card>

        {/* Issues */}
        <Card>
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold">Areas to Improve</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {issues.length > 0 ? (
              <ul className="space-y-2">
                {issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">Great job! No major issues to address.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">Recommendations</h3>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            {!hasEmergencyFund && (
              <Recommendation
                icon={Shield}
                priority="high"
                title="Create an Emergency Fund First"
                description="Before focusing on other goals, build 3-6 months of expenses. This is your financial safety net."
              />
            )}
            
            {emergencyFund && calculateProgress(emergencyFund.depositedAmount, emergencyFund.targetAmount) < 50 && (
              <Recommendation
                icon={PiggyBank}
                priority="medium"
                title="Boost Your Emergency Fund"
                description={`You're at ${calculateProgress(emergencyFund.depositedAmount, emergencyFund.targetAmount).toFixed(0)}%. Consider temporarily redirecting other goal deposits here until you hit 50%.`}
              />
            )}
            
            {atRiskGoals.length > 0 && (
              <Recommendation
                icon={Target}
                priority="medium"
                title={`${atRiskGoals.length} Goal${atRiskGoals.length > 1 ? 's' : ''} Behind Schedule`}
                description={`${atRiskGoals.map(g => g.name).join(', ')} need${atRiskGoals.length === 1 ? 's' : ''} higher monthly pledges to hit target dates.`}
              />
            )}
            
            {portfolio.currentStreak < 4 && (
              <Recommendation
                icon={TrendingUp}
                priority="low"
                title="Build Your Deposit Streak"
                description="Consistency compounds. Try automating weekly deposits to build momentum and maximize yield."
              />
            )}

            {atRiskGoals.length === 0 && hasEmergencyFund && portfolio.currentStreak >= 4 && (
              <Recommendation
                icon={Calendar}
                priority="low"
                title="Consider Lock Periods"
                description="You have solid fundamentals. Locking funds for 90-180 days could earn you +0.5-1.5% extra APY."
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Monthly Pledges" value={`$${totalMonthly}`} />
        <Stat label="Active Goals" value={goals.length.toString()} />
        <Stat label="Current Streak" value={`${portfolio.currentStreak} weeks`} />
        <Stat label="Yield Earned" value={`$${portfolio.totalEarnedYield.toFixed(2)}`} />
      </div>
    </div>
  );
}

function Recommendation({
  icon: Icon,
  priority,
  title,
  description,
}: {
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
    medium: 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800',
    low: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
  };

  const priorityBadge = {
    high: 'error' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${priorityColors[priority]}`}>
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-neutral-900 dark:text-white">{title}</h4>
          <Badge variant={priorityBadge[priority]}>{priority}</Badge>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}
