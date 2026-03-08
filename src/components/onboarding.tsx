'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Shield, Target, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-neutral-950 dark:to-blue-950/30">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6"
          >
            <Wallet className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-neutral-900 dark:text-white mb-4"
          >
            Welcome to Nest
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mx-auto"
          >
            Goal-based DeFi savings on Base. Earn 6%+ APY while building real wealth.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StepCard
            icon={Target}
            title="1. Set Your Goal"
            description="Create a named savings goal — Emergency Fund, Tokyo Trip, House Down Payment."
            delay={0.3}
          />
          <StepCard
            icon={TrendingUp}
            title="2. Deposit & Earn"
            description="Your USDC goes to the yoUSD vault, earning yield across Aave, Morpho, Compound."
            delay={0.4}
          />
          <StepCard
            icon={Shield}
            title="3. Track Progress"
            description="Watch your savings grow. Get insights from Nest Coach. Hit your targets."
            delay={0.5}
          />
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              How Nest Works
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Deposit USDC</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Start with any amount — even $50 to test it out. Your funds are converted to yoUSD.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Auto-Allocation</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    The vault allocates across Aave, Morpho, Compound, Spark, and 8+ protocols for optimal yield.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Yield Accrues</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Yield accrues per block. You'll see it within minutes. Compounds automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">4</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Withdraw Anytime</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Funds are yours. Withdraw anytime unless you choose to lock for a boosted rate.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-neutral-900 dark:text-white">6%+ APY</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Compare to 0.46% traditional savings. That's 13x more yield on your money.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium text-neutral-900 dark:text-white">Battle-Tested</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Built on Aave, Morpho, Compound — protocols with billions in TVL and years of track record.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button onClick={onComplete} size="lg" className="px-8">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-neutral-500 mt-4">
            Already have an account? Connect your wallet to see your real portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
