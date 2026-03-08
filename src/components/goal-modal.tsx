'use client';

import React, { useState } from 'react';
import { X, Target, Calendar, DollarSign, Wallet, PiggyBank } from 'lucide-react';
import { Goal } from '@/lib/types';
import { Button, Input, Select } from '@/components/ui';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  goal?: Goal | null;
}

const EMOJI_OPTIONS = ['🎯', '✈️', '🏠', '🚗', '🎓', '💍', '🛡️', '🏖️', '💻', '📱', '🎮', '👶', '🐶', '💼', '🏥'];

export function GoalModal({ isOpen, onClose, onSave, goal }: GoalModalProps) {
  const [formData, setFormData] = useState<Partial<Goal>>({
    name: goal?.name || '',
    emoji: goal?.emoji || '🎯',
    targetAmount: goal?.targetAmount || 0,
    depositedAmount: goal?.depositedAmount || 0,
    targetDate: goal?.targetDate || '',
    monthlyPledge: goal?.monthlyPledge || 0,
    assetType: goal?.assetType || 'USDC',
    ...goal,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditing = !!goal;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">
              {isEditing ? 'Edit Goal' : 'Create New Goal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Choose an emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${
                    formData.emoji === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <Input
            label="Goal Name"
            placeholder="e.g., Tokyo Trip, Emergency Fund, New Car"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          {/* Target Amount */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              placeholder="5000"
              value={formData.targetAmount || ''}
              onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
              icon={<DollarSign className="w-4 h-4" />}
              required
            />
            <Input
              label="Initial Deposit"
              type="number"
              placeholder="0"
              value={formData.depositedAmount || ''}
              onChange={(e) => setFormData({ ...formData, depositedAmount: parseFloat(e.target.value) || 0 })}
              icon={<Wallet className="w-4 h-4" />}
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Target Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Monthly Pledge */}
          <Input
            label="Monthly Pledge"
            type="number"
            placeholder="How much can you save per month?"
            value={formData.monthlyPledge || ''}
            onChange={(e) => setFormData({ ...formData, monthlyPledge: parseFloat(e.target.value) || 0 })}
            icon={<PiggyBank className="w-4 h-4" />}
            required
          />

          {/* Asset Type */}
          <Select
            label="Asset Type"
            value={formData.assetType}
            onChange={(e) => setFormData({ ...formData, assetType: e.target.value as 'USDC' | 'ETH' })}
            options={[
              { value: 'USDC', label: 'USDC (Stable, 6.2% APY)' },
              { value: 'ETH', label: 'ETH (Volatile, 3.8% APY)' },
            ]}
          />

          {/* Summary */}
          {formData.targetAmount && formData.monthlyPledge && formData.targetDate && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                At <strong>${formData.monthlyPledge}/month</strong>, you'll reach your{' '}
                <strong>${formData.targetAmount}</strong> goal in approximately{' '}
                <strong>{Math.ceil((formData.targetAmount - (formData.depositedAmount || 0)) / formData.monthlyPledge)} months</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
