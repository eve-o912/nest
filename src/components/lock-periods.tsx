'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Goal, LOCK_PERIODS } from '@/lib/types';
import { formatCurrency, calculateYieldBreakdown } from '@/lib/data';
import { Card, CardContent, CardHeader, Button, Badge } from '@/components/ui';

interface LockPeriodsProps {
  goals: Goal[];
  baseApy: number;
  onLockGoal: (goalId: string, days: number) => void;
}

export function LockPeriods({ goals, baseApy, onLockGoal }: LockPeriodsProps) {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  const activeGoals = goals.filter(g => g.depositedAmount > 0 && !g.lockPeriod);
  const lockedGoals = goals.filter(g => g.lockPeriod);

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Commitment Savings</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Lock your funds for 30, 90, or 180 days to earn a boosted APY (+0.5% to +1.5%). 
                Locked funds remain on-chain and visible — just restricted from withdrawal until the lock expires.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lock Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {LOCK_PERIODS.map((period) => {
          const boostedApy = baseApy + period.boost;
          const exampleYield = calculateYieldBreakdown(1000, boostedApy);
          
          return (
            <Card key={period.days} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-neutral-500" />
                  <span className="font-semibold text-lg">{period.label}</span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">+{period.boost}%</span>
                  <span className="text-neutral-500 ml-2">boost</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Total APY: <strong>{boostedApy}%</strong>
                </p>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-xs text-neutral-500">
                  Example: $1,000 locked earns {formatCurrency(exampleYield.monthly)}/month vs {formatCurrency(calculateYieldBreakdown(1000, baseApy).monthly)} unlocked
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Goals to Lock */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader className="p-5 pb-0">
            <h3 className="font-semibold text-lg">Lock a Goal</h3>
            <p className="text-sm text-neutral-500">Select a goal and lock period to boost your yield</p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedGoal?.id === goal.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{goal.name}</p>
                        <p className="text-sm text-neutral-500">{formatCurrency(goal.depositedAmount)} available to lock</p>
                      </div>
                    </div>
                    {selectedGoal?.id === goal.id && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  
                  {selectedGoal?.id === goal.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Select lock period:</p>
                      <div className="flex gap-2">
                        {LOCK_PERIODS.map((period) => {
                          const boostedApy = baseApy + period.boost;
                          const extraYield = calculateYieldBreakdown(goal.depositedAmount, boostedApy).monthly - 
                                           calculateYieldBreakdown(goal.depositedAmount, baseApy).monthly;
                          
                          return (
                            <button
                              key={period.days}
                              onClick={() => onLockGoal(goal.id, period.days)}
                              className="flex-1 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
                            >
                              <p className="font-semibold text-neutral-900 dark:text-white">{period.label}</p>
                              <p className="text-xs text-neutral-500 mt-1">+{formatCurrency(extraYield)}/mo</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Locked */}
      {lockedGoals.length > 0 && (
        <Card>
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-lg">Currently Locked</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {lockedGoals.map((goal) => {
                const lockInfo = LOCK_PERIODS.find(l => l.days === goal.lockPeriod);
                const daysRemaining = goal.lockExpiry ? 
                  Math.max(0, Math.ceil((new Date(goal.lockExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 
                  0;
                
                return (
                  <div key={goal.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{goal.name}</p>
                        <p className="text-sm text-neutral-500">
                          {formatCurrency(goal.depositedAmount)} locked · {lockInfo?.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">+{lockInfo?.boost}% APY</Badge>
                      <p className="text-xs text-neutral-500 mt-1">
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Lock expired'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Important</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Locked funds cannot be withdrawn until the lock period expires. Only lock money you won't need 
            for emergencies. Consider keeping your Emergency Fund unlocked.
          </p>
        </div>
      </div>
    </div>
  );
}
