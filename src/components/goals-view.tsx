'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, TrendingUp, Lock, Calendar, PiggyBank } from 'lucide-react';
import { Goal } from '@/lib/types';
import { formatCurrency, calculateProgress, getDaysUntilDate, calculateMonthsToGoal } from '@/lib/data';
import { Card, CardContent, CardHeader, Button, Progress, Badge } from '@/components/ui';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
}

export function GoalsView({ goals, onAddGoal, onEditGoal }: GoalsViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const filteredGoals = goals.filter(goal => {
    const isCompleted = goal.depositedAmount >= goal.targetAmount;
    if (filter === 'completed') return isCompleted;
    if (filter === 'active') return !isCompleted;
    return true;
  });

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalDeposited = goals.reduce((sum, g) => sum + g.depositedAmount, 0);
  const overallProgress = calculateProgress(totalDeposited, totalTarget);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Saved</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{formatCurrency(totalDeposited)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Across {goals.length} goals</p>
              <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">{overallProgress.toFixed(0)}% of {formatCurrency(totalTarget)}</p>
            </div>
          </div>
          <Progress value={overallProgress} size="lg" color="blue" />
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            {f}
          </button>
        ))}
        <Button onClick={onAddGoal} className="ml-auto">
          <Plus className="w-4 h-4 mr-1" />
          New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onEdit={() => onEditGoal(goal)} />
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">
            {filter === 'completed' ? 'No completed goals yet. Keep saving!' : 'No goals match this filter.'}
          </p>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const progress = calculateProgress(goal.depositedAmount, goal.targetAmount);
  const daysLeft = getDaysUntilDate(goal.targetDate);
  const monthsToGoal = calculateMonthsToGoal(goal.depositedAmount, goal.targetAmount, goal.monthlyPledge);
  const isCompleted = goal.depositedAmount >= goal.targetAmount;
  const isOnTrack = monthsToGoal <= Math.ceil(daysLeft / 30) || isCompleted;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card onClick={onEdit} className="h-full cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{goal.emoji}</span>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{goal.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={goal.assetType === 'USDC' ? 'info' : 'warning'}>
                    {goal.assetType}
                  </Badge>
                  <span className="text-xs text-neutral-500">{goal.apy}% APY</span>
                </div>
              </div>
            </div>
            {goal.lockPeriod && (
              <div className="flex items-center gap-1 text-amber-600">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-medium">{goal.lockPeriod}d</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-600 dark:text-neutral-400">
                {formatCurrency(goal.depositedAmount)} of {formatCurrency(goal.targetAmount)}
              </span>
              <span className="font-medium text-neutral-900 dark:text-white">{progress.toFixed(0)}%</span>
            </div>
            <Progress 
              value={progress} 
              color={isCompleted ? 'green' : isOnTrack ? 'blue' : 'amber'}
              size="md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                ${goal.monthlyPledge}/mo
              </span>
            </div>
          </div>

          {!isCompleted && (
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                <span className={isOnTrack ? 'text-green-600' : 'text-amber-600'}>
                  {isOnTrack 
                    ? `On track: ${monthsToGoal} months to goal` 
                    : `Behind: Need ${monthsToGoal} months, have ${Math.ceil(daysLeft / 30)}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
