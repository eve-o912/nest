import { Portfolio, Goal, LOCK_PERIODS } from './types';
import { calculateYieldBreakdown, calculateProgress, calculateMonthsToGoal, getDaysUntilDate, formatCurrency } from './data';

export function generateAIResponse(input: string, portfolio: Portfolio): string {
  const lowerInput = input.toLowerCase();
  
  // Feature 1: Savings Goals
  if (lowerInput.includes('which goal') || lowerInput.includes('focus on') || lowerInput.includes('prioritize')) {
    return recommendGoalToFocus(portfolio);
  }
  
  if (lowerInput.includes('will i hit') || lowerInput.includes('reach my') || lowerInput.includes('timeline') || lowerInput.includes('by when')) {
    const goalName = extractGoalName(input, portfolio);
    return checkGoalTimeline(portfolio, goalName);
  }
  
  if (lowerInput.includes('add') && lowerInput.includes('month')) {
    const amount = extractAmount(input);
    return recommendWhereToAdd(portfolio, amount);
  }
  
  // Feature 2: Yield Education
  if (lowerInput.includes('how much') && (lowerInput.includes('making') || lowerInput.includes('earning') || lowerInput.includes('per day'))) {
    return calculateExactYield(portfolio);
  }
  
  if (lowerInput.includes('apy') || lowerInput.includes('good') || lowerInput.includes('compare')) {
    return explainAPYComparison(portfolio);
  }
  
  if (lowerInput.includes('vault') || lowerInput.includes('where') || lowerInput.includes('allocated')) {
    return explainVaultAllocation(portfolio);
  }
  
  // Feature 3: Lock Periods
  if (lowerInput.includes('lock') && lowerInput.includes('should')) {
    const goalName = extractGoalName(input, portfolio);
    return recommendLockPeriod(portfolio, goalName);
  }
  
  if (lowerInput.includes('how much more') && lowerInput.includes('locked')) {
    return calculateLockDifference(portfolio);
  }
  
  // Feature 4: Portfolio Health
  if (lowerInput.includes('healthy') || lowerInput.includes('strategy') || lowerInput.includes('how am i doing')) {
    return assessPortfolioHealth(portfolio);
  }
  
  if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
    return buildMonthlyPlan(portfolio);
  }
  
  if (lowerInput.includes('split') || lowerInput.includes('deposit') || lowerInput.includes('$')) {
    const amount = extractAmount(input);
    if (amount > 0) return recommendDepositSplit(portfolio, amount);
  }
  
  // Feature 5: DeFi Risk
  if (lowerInput.includes('safe') || lowerInput.includes('risk') || lowerInput.includes('hacked') || lowerInput.includes('ftx')) {
    return explainDeFiRisks();
  }
  
  // Feature 6: Streaks
  if (lowerInput.includes('streak') || lowerInput.includes('missed') || lowerInput.includes('motivate')) {
    return handleStreakQuery(portfolio, lowerInput);
  }
  
  // Feature 7: Onboarding / Help
  if (lowerInput.includes('first') || lowerInput.includes('start') || lowerInput.includes('how do i') || lowerInput.includes('new')) {
    return helpNewUser(portfolio);
  }
  
  if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
    return listCapabilities();
  }
  
  // Default response
  return "I'm focused on helping you hit your savings goals — ask me anything about your progress, yield, lock periods, or strategy. What's on your mind?";
}

// Feature 1: Savings Goals
function recommendGoalToFocus(portfolio: Portfolio): string {
  const goals = portfolio.goals;
  if (goals.length === 0) return "You don't have any goals yet. Create one first — maybe start with an Emergency Fund? I recommend 3-6 months of expenses.";
  
  // Sort by urgency (days until target / progress gap)
  const goalsWithUrgency = goals.map(goal => {
    const daysLeft = getDaysUntilDate(goal.targetDate);
    const progress = calculateProgress(goal.depositedAmount, goal.targetAmount);
    const monthsNeeded = calculateMonthsToGoal(goal.depositedAmount, goal.targetAmount, goal.monthlyPledge);
    const onTrack = monthsNeeded <= Math.ceil(daysLeft / 30);
    return { goal, daysLeft, progress, monthsNeeded, onTrack };
  });
  
  const atRisk = goalsWithUrgency.filter(g => !g.onTrack);
  
  if (atRisk.length > 0) {
    const mostAtRisk = atRisk.sort((a, b) => a.daysLeft - b.daysLeft)[0];
    return `Focus on **${mostAtRisk.goal.emoji} ${mostAtRisk.goal.name}** — you're ${mostAtRisk.monthsNeeded} months away at current pace but only have ${Math.ceil(mostAtRisk.daysLeft / 30)} months left. Bump your monthly pledge by $${(mostAtRisk.goal.targetAmount - mostAtRisk.goal.depositedAmount) / Math.ceil(mostAtRisk.daysLeft / 30) - mostAtRisk.goal.monthlyPledge > 0 ? Math.ceil((mostAtRisk.goal.targetAmount - mostAtRisk.goal.depositedAmount) / Math.ceil(mostAtRisk.daysLeft / 30) - mostAtRisk.goal.monthlyPledge) : 50} to hit your target.`;
  }
  
  const closestGoal = goalsWithUrgency.sort((a, b) => a.daysLeft - b.daysLeft)[0];
  return `Your **${closestGoal.goal.emoji} ${closestGoal.goal.name}** is closest — ${closestGoal.daysLeft} days away and you're ${closestGoal.progress.toFixed(1)}% there. Keep at it!`;
}

function checkGoalTimeline(portfolio: Portfolio, goalName?: string): string {
  let goal: Goal | undefined;
  
  if (goalName) {
    goal = portfolio.goals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()));
  }
  
  if (!goal && portfolio.goals.length > 0) {
    goal = portfolio.goals[0];
  }
  
  if (!goal) return "Which goal are you asking about? You can check your goals in the Goals tab.";
  
  const daysLeft = getDaysUntilDate(goal.targetDate);
  const monthsNeeded = calculateMonthsToGoal(goal.depositedAmount, goal.targetAmount, goal.monthlyPledge);
  const onTrack = monthsNeeded <= Math.ceil(daysLeft / 30);
  const remaining = goal.targetAmount - goal.depositedAmount;
  
  if (remaining <= 0) {
    return `🎉 You've hit your **${goal.emoji} ${goal.name}** goal! Time to celebrate — or set a new one.`;
  }
  
  if (onTrack) {
    return `You're on track for **${goal.emoji} ${goal.name}**! At $${goal.monthlyPledge}/month, you'll hit your $${goal.targetAmount.toFixed(2)} target in ${monthsNeeded} months — that's ${getDaysUntilDate(goal.targetDate) > 0 ? 'before' : 'around'} your ${new Date(goal.targetDate).toLocaleDateString()} deadline. You'll need $${remaining.toFixed(2)} more.`;
  } else {
    const requiredMonthly = remaining / Math.ceil(daysLeft / 30);
    return `Your **${goal.emoji} ${goal.name}** timeline is tight. You need $${remaining.toFixed(2)} more but only have ${Math.ceil(daysLeft / 30)} months left. Bump your monthly pledge from $${goal.monthlyPledge} to $${Math.ceil(requiredMonthly)} to hit your deadline.`;
  }
}

function recommendWhereToAdd(portfolio: Portfolio, amount: number): string {
  if (amount <= 0) return "How much would you like to add per month?";
  
  const emergencyFund = portfolio.goals.find(g => g.name.toLowerCase().includes('emergency'));
  const goalsNeedingFunds = portfolio.goals.filter(g => g.depositedAmount < g.targetAmount);
  
  if (emergencyFund && emergencyFund.depositedAmount < emergencyFund.targetAmount) {
    return `Add that $${amount}/month to your **${emergencyFund.emoji} Emergency Fund** first — it's the foundation. You're at ${calculateProgress(emergencyFund.depositedAmount, emergencyFund.targetAmount).toFixed(0)}% ($${emergencyFund.depositedAmount.toFixed(2)} of $${emergencyFund.targetAmount.toFixed(2)}).`;
  }
  
  if (goalsNeedingFunds.length > 0) {
    const mostUrgent = goalsNeedingFunds.sort((a, b) => getDaysUntilDate(a.targetDate) - getDaysUntilDate(b.targetDate))[0];
    return `Put that $${amount}/month toward **${mostUrgent.emoji} ${mostUrgent.name}** — it's your most urgent goal with ${getDaysUntilDate(mostUrgent.targetDate)} days left.`;
  }
  
  return `You're crushing all your goals! Consider creating a new one or boosting your existing targets. What are you saving for next?`;
}

// Feature 2: Yield Education
function calculateExactYield(portfolio: Portfolio): string {
  const breakdown = calculateYieldBreakdown(portfolio.totalBalance, portfolio.baseApy);
  const lockedGoals = portfolio.goals.filter(g => g.lockPeriod);
  const lockedAmount = lockedGoals.reduce((sum, g) => sum + g.depositedAmount, 0);
  const lockedBoost = lockedGoals.reduce((sum, g) => {
    const lock = LOCK_PERIODS.find(l => l.days === g.lockPeriod);
    return sum + (g.depositedAmount * (lock?.boost || 0) / 100);
  }, 0);
  
  return `You're earning **$${breakdown.daily.toFixed(2)}/day**, **$${breakdown.weekly.toFixed(2)}/week**, and **$${breakdown.monthly.toFixed(2)}/month**. That's $${breakdown.yearly.toFixed(2)}/year at ${portfolio.baseApy}% APY.${lockedAmount > 0 ? ` Your locked funds ($${lockedAmount.toFixed(2)}) are earning an extra ~$${(lockedBoost / 52).toFixed(2)}/week in boosted yield.` : ''}`;
}

function explainAPYComparison(portfolio: Portfolio): string {
  const traditionalAPY = 0.46;
  const highYieldAPY = 5.0;
  const nestAPY = portfolio.baseApy;
  
  const nestYearly = portfolio.totalBalance * (nestAPY / 100);
  const traditionalYearly = portfolio.totalBalance * (traditionalAPY / 100);
  const highYieldYearly = portfolio.totalBalance * (highYieldAPY / 100);
  
  return `Your ${nestAPY}% APY is solid. Compare: Traditional savings average ${traditionalAPY}% (you'd earn $${traditionalYearly.toFixed(2)}/year), high-yield savings ~${highYieldAPY}% ($${highYieldYearly.toFixed(2)}/year), and Nest at ${nestAPY}% gets you $${nestYearly.toFixed(2)}/year. That's $${(nestYearly - traditionalYearly).toFixed(2)} more annually than a regular savings account.`;
}

function explainVaultAllocation(portfolio: Portfolio): string {
  const allocations = portfolio.vaultAllocation;
  const top3 = allocations.slice(0, 3);
  
  return `Your money is split across ${allocations.length} protocols for optimal yield. Top allocations: ${top3.map(a => `${a.protocol} (${a.percentage}%)`).join(', ')}. The vault rebalances automatically — when Aave rates drop, it shifts to Morpho or Spark. All protocols are battle-tested with billions in TVL.`;
}

// Feature 3: Lock Periods
function recommendLockPeriod(portfolio: Portfolio, goalName?: string): string {
  let goal: Goal | undefined;
  
  if (goalName) {
    goal = portfolio.goals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()));
  }
  
  if (!goal) goal = portfolio.goals[0];
  if (!goal) return "Create a goal first, then we can talk about locking. Locks boost your APY but restrict withdrawals.";
  
  const daysUntilGoal = getDaysUntilDate(goal.targetDate);
  
  if (daysUntilGoal < 30) {
    return `Don't lock your **${goal.emoji} ${goal.name}** — you need the money in ${daysUntilGoal} days. Locks are for goals 2+ months out.`;
  }
  
  if (daysUntilGoal < 90) {
    return `A 30-day lock could work for **${goal.emoji} ${goal.name}** — you'd get +0.5% APY and access to funds in a month. With $${goal.depositedAmount.toFixed(2)}, that's an extra $${(goal.depositedAmount * 0.005 / 12).toFixed(2)}/month.`;
  }
  
  if (daysUntilGoal < 180) {
    return `Go with a 90-day lock on **${goal.emoji} ${goal.name}** — +1.0% APY fits your timeline. That earns an extra $${(goal.depositedAmount * 0.01 / 12).toFixed(2)}/month compared to unlocked.`;
  }
  
  return `Maximize with a 180-day lock on **${goal.emoji} ${goal.name}** — +1.5% APY. Since your goal is ${Math.ceil(daysUntilGoal / 30)} months away, you won't need early access. Extra yield: $${(goal.depositedAmount * 0.015 / 12).toFixed(2)}/month.`;
}

function calculateLockDifference(portfolio: Portfolio): string {
  const lockedAmount = portfolio.goals.reduce((sum, g) => sum + (g.lockPeriod ? g.depositedAmount : 0), 0);
  const unlockedAmount = portfolio.totalBalance - lockedAmount;
  
  const unlockedYield = calculateYieldBreakdown(unlockedAmount, portfolio.baseApy);
  const lockedYield30 = calculateYieldBreakdown(lockedAmount, portfolio.baseApy + 0.5);
  const lockedYield90 = calculateYieldBreakdown(lockedAmount, portfolio.baseApy + 1.0);
  const lockedYield180 = calculateYieldBreakdown(lockedAmount, portfolio.baseApy + 1.5);
  
  return `If you locked your $${lockedAmount.toFixed(2)}: 30-day = extra $${(lockedYield30.monthly - calculateYieldBreakdown(lockedAmount, portfolio.baseApy).monthly).toFixed(2)}/month; 90-day = extra $${(lockedYield90.monthly - calculateYieldBreakdown(lockedAmount, portfolio.baseApy).monthly).toFixed(2)}/month; 180-day = extra $${(lockedYield180.monthly - calculateYieldBreakdown(lockedAmount, portfolio.baseApy).monthly).toFixed(2)}/month. Your $${unlockedAmount.toFixed(2)} unlocked stays flexible at ${portfolio.baseApy}% APY.`;
}

// Feature 4: Portfolio Health
function assessPortfolioHealth(portfolio: Portfolio): string {
  const totalMonthly = portfolio.goals.reduce((sum, g) => sum + g.monthlyPledge, 0);
  const hasEmergencyFund = portfolio.goals.some(g => g.name.toLowerCase().includes('emergency'));
  const emergencyFund = portfolio.goals.find(g => g.name.toLowerCase().includes('emergency'));
  
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
  
  const status = healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Good' : 'Needs Work';
  
  return `Your savings health: **${status}** (${healthScore}/100). ${positives.length > 0 ? `✓ ${positives.join(', ')}. ` : ''}${issues.length > 0 ? `⚠ ${issues.join('; ')}.` : ''} You're pledging $${totalMonthly}/month across ${portfolio.goals.length} goals.`;
}

function buildMonthlyPlan(portfolio: Portfolio): string {
  const goals = portfolio.goals.filter(g => g.depositedAmount < g.targetAmount);
  
  if (goals.length === 0) return "You've hit all your goals! Time to set some new ones.";
  
  let plan = "Here's your 3-month deposit plan:\n\n";
  
  goals.slice(0, 3).forEach((goal, i) => {
    const month1 = goal.depositedAmount + goal.monthlyPledge;
    const month2 = month1 + goal.monthlyPledge;
    const month3 = month2 + goal.monthlyPledge;
    const progress3 = calculateProgress(month3, goal.targetAmount);
    
    plan += `${i + 1}. **${goal.emoji} ${goal.name}**: $${goal.depositedAmount.toFixed(2)} → $${month1.toFixed(2)} (Month 1) → $${month2.toFixed(2)} (Month 2) → $${month3.toFixed(2)} (Month 3) = ${progress3.toFixed(0)}% complete\n`;
  });
  
  const totalMonthly = goals.reduce((sum, g) => sum + g.monthlyPledge, 0);
  plan += `\nTotal monthly commitment: $${totalMonthly}/month.`;
  
  return plan;
}

function recommendDepositSplit(portfolio: Portfolio, amount: number): string {
  const goalsNeedingFunds = portfolio.goals.filter(g => g.depositedAmount < g.targetAmount);
  
  if (goalsNeedingFunds.length === 0) return "All your goals are funded! Create a new one first.";
  
  if (goalsNeedingFunds.length === 1) {
    return `Put the full $${amount.toFixed(2)} into **${goalsNeedingFunds[0].emoji} ${goalsNeedingFunds[0].name}** — it's your only active goal.`;
  }
  
  // Split proportionally by monthly pledge
  const totalPledges = goalsNeedingFunds.reduce((sum, g) => sum + g.monthlyPledge, 0);
  
  let split = `With $${amount.toFixed(2)}, here's my recommended split:\n\n`;
  
  goalsNeedingFunds.slice(0, 3).forEach(goal => {
    const share = (goal.monthlyPledge / totalPledges) * amount;
    split += `• **${goal.emoji} ${goal.name}**: $${share.toFixed(2)} (${goal.monthlyPledge}/${totalPledges} of your monthly pledges)\n`;
  });
  
  return split;
}

// Feature 5: DeFi Risk
function explainDeFiRisks(): string {
  return `Here's the honest risk breakdown:\n\n**Smart contract risk**: yoUSD and partner protocols are audited but not guaranteed. Aave, Morpho, and Compound have years of track record and billions in TVL.\n\n**Stablecoin risk**: USDC is issued by Circle, backed 1:1 by cash and T-bills — the most regulated stablecoin.\n\n**APY volatility**: Rates fluctuate with DeFi markets (historically 5.5%-8% for yoUSD). The vault rebalances to maximize but doesn't guarantee fixed rates.\n\n**What's NOT a risk**: No liquidation risk (yoUSD isn't leveraged), no custody risk (you control your funds), and this isn't like FTX (no centralized lending, fully on-chain).\n\nBottom line: This is closer to a high-yield savings account than a casino.`;
}

// Feature 6: Streaks
function handleStreakQuery(portfolio: Portfolio, input: string): string {
  if (input.includes('missed')) {
    return `One missed week doesn't break the habit. Your longest streak is still ${portfolio.longestStreak} weeks — you can beat that. The key is getting back on track this week. Your ${portfolio.currentStreak}-week streak was earning you an extra ~$${(portfolio.totalBalance * 0.001 / 52).toFixed(2)}/week in compound growth. Deposit this week and you're back in the game.`;
  }
  
  if (input.includes('motivate')) {
    const closestGoal = portfolio.goals.filter(g => g.depositedAmount < g.targetAmount).sort((a, b) => getDaysUntilDate(a.targetDate) - getDaysUntilDate(b.targetDate))[0];
    
    if (closestGoal) {
      const monthsLeft = calculateMonthsToGoal(closestGoal.depositedAmount, closestGoal.targetAmount, closestGoal.monthlyPledge);
      return `You're ${portfolio.currentStreak} weeks into building real wealth. At this pace, your **${closestGoal.emoji} ${closestGoal.name}** hits in ${monthsLeft} months. That ${portfolio.baseApy}% APY means even while you sleep, your money is working. Keep the streak alive — consistency beats intensity.`;
    }
    
    return `You're on a ${portfolio.currentStreak}-week streak of building wealth. That consistency is creating compound growth — literally. Your $${portfolio.totalBalance.toFixed(2)} is earning $${(portfolio.totalBalance * portfolio.baseApy / 100 / 52).toFixed(2)}/week while you focus on life. Don't break the chain.`;
  }
  
  // Streak earnings
  const estimatedExtraYield = portfolio.totalEarnedYield * (portfolio.currentStreak / 100); // Rough estimate
  return `Your ${portfolio.currentStreak}-week streak shows real commitment. Consistent deposits mean your yield compounds faster — sporadic savers lose ~15% in compound growth. Your streak has likely earned you an extra ~$${estimatedExtraYield.toFixed(2)} in accelerated yield. Longest streak: ${portfolio.longestStreak} weeks.`;
}

// Feature 7: Onboarding
function helpNewUser(portfolio: Portfolio): string {
  if (portfolio.totalBalance === 0) {
    return `Welcome to Nest! Here's how to start:\n\n1. **Create your first goal** — maybe "Emergency Fund" or something fun like "New Laptop"\n2. **Make a test deposit** — Start with $50-100 to see how it works\n3. **Watch it grow** — Your USDC goes to the yoUSD vault, allocated across Aave, Morpho, Compound, and others\n4. **Yield starts immediately** — Accrues per block, visible within minutes\n5. **Withdraw anytime** — Unless you choose to lock for a boosted rate\n\nReady to create your first goal?`;
  }
  
  return `You're already set up with $${portfolio.totalBalance.toFixed(2)}! Your funds are in the yoUSD vault earning ${portfolio.baseApy}% APY. Ask me about your goals, yield, or strategy anytime.`;
}

function listCapabilities(): string {
  return `I can help you with:\n\n🎯 **Goals** — Which to focus on, timeline checks, deposit recommendations\n📈 **Yield** — Daily/weekly earnings, APY comparisons, vault allocation\n🔒 **Locks** — Whether to lock, period recommendations, yield differences\n💪 **Health** — Portfolio assessment, monthly plans, split recommendations\n🛡️ **Risks** — Honest DeFi risk breakdown\n🔥 **Streaks** — Motivation, missed deposit recovery\n\nWhat would you like to explore?`;
}

// Helpers
function extractGoalName(input: string, portfolio: Portfolio): string | undefined {
  for (const goal of portfolio.goals) {
    if (input.toLowerCase().includes(goal.name.toLowerCase())) {
      return goal.name;
    }
  }
  return undefined;
}

function extractAmount(input: string): number {
  const match = input.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(',', '')) : 0;
}
