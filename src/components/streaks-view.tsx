'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { Portfolio } from '@/lib/types';
import { calculateYieldBreakdown } from '@/lib/data';
import { Card, CardContent, CardHeader, Button, Badge, Progress } from '@/components/ui';

interface StreaksViewProps {
  portfolio: Portfolio | null;
}

export function StreaksView({ portfolio }: StreaksViewProps) {
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading portfolio data...</div>
      </div>
    );
  }
  
  const { currentStreak, longestStreak, weeklyDepositAverage, totalBalance, baseApy } = portfolio;
  
  // Calculate streak impact
  const weeklyYield = calculateYieldBreakdown(totalBalance, baseApy).weekly;
  const estimatedStreakBonus = weeklyYield * (currentStreak / 100); // Rough estimate
  
  // Generate last 8 weeks for visualization
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekNumber = 8 - i;
    const isCompleted = weekNumber <= currentStreak;
    return { weekNumber, isCompleted };
  }).reverse();

  return (
    <div className="space-y-6">
      {/* Streak Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Current Streak</p>
                <p className="text-4xl font-bold text-neutral-900 dark:text-white">{currentStreak} weeks</p>
                <p className="text-sm text-neutral-500">Longest: {longestStreak} weeks</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="success" className="text-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Consistency Bonus Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">Last 8 Weeks</h3>
          <p className="text-sm text-neutral-500">Each flame represents a week you deposited</p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {weeks.map((week, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`aspect-square rounded-xl flex items-center justify-center ${
                  week.isCompleted
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                {week.isCompleted ? (
                  <Flame className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-xs text-neutral-400">{week.weekNumber}</span>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-neutral-500">Weekly Average</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">${weeklyDepositAverage}</p>
            <p className="text-xs text-neutral-500 mt-1">Deposits per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-neutral-500">Consistency Impact</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">~${estimatedStreakBonus.toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1">Extra weekly yield from consistency</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-neutral-500">Next Milestone</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{20 - (currentStreak % 20)}</p>
            <p className="text-xs text-neutral-500 mt-1">Weeks until 20-week milestone</p>
          </CardContent>
        </Card>
      </div>

      {/* Motivation Card */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <h3 className="font-semibold text-lg">Why Streaks Matter</h3>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Compound Growth</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Consistent deposits mean your money compounds faster. Sporadic savers lose 
                  approximately 15% in compound growth compared to steady depositors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Habit Building</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Research shows it takes 66 days to form a habit. Your {currentStreak}-week streak 
                  means saving is becoming automatic — no willpower required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Momentum Effect</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Each week you deposit makes the next week easier. Missing once makes missing 
                  twice more likely. Your streak is protecting your financial future.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery CTA */}
      {currentStreak < 4 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">Get Back on Track</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  One missed week doesn't define your journey. Your longest streak was {longestStreak} weeks — 
                  you can beat that. Deposit this week and restart the chain.
                </p>
                <Button variant="primary" size="sm">
                  Make a Deposit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automation Tip */}
      {currentStreak >= 4 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Pro Tip: Automate It</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You're crushing the consistency game. Consider automating deposits on a specific 
                day (payday works great) to make this effortless. Set it and forget it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
