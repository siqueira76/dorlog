import { SubscriptionPlan } from '@/types/user';

/**
 * Planos de assinatura do FibroDiário
 * Configuração centralizada para freemium model
 */

export const SUBSCRIPTION_PLANS: Record<'free' | 'premium', SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    interval: 'month',
    features: {
      historyDays: 30,
      maxDoctors: 3,
      nlpAnalysis: false,
      advancedReports: false,
      exportData: 'basic',
      monthlyReportsLimit: 1,
      pushNotifications: false,
      prioritySupport: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.90,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM || '',
    features: {
      historyDays: 'unlimited',
      maxDoctors: 'unlimited',
      nlpAnalysis: true,
      advancedReports: true,
      exportData: 'advanced',
      monthlyReportsLimit: 'unlimited',
      pushNotifications: true,
      prioritySupport: true,
    },
  },
};

/**
 * Trial configuration
 */
export const TRIAL_CONFIG = {
  durationDays: 14,
  autoStart: true, // Inicia automaticamente para novos usuários
  features: SUBSCRIPTION_PLANS.premium.features, // Trial tem acesso Premium
};

/**
 * Feature limits for Free tier
 */
export const FREE_TIER_LIMITS = {
  HISTORY_DAYS: 30,
  MAX_DOCTORS: 3,
  MONTHLY_REPORTS: 1,
  EXPORT_FORMAT: 'csv' as const,
};

/**
 * Feature access helper
 */
export function getFeatureAccess(tier: 'free' | 'premium', isTrialing: boolean) {
  if (isTrialing) {
    return SUBSCRIPTION_PLANS.premium.features;
  }
  return SUBSCRIPTION_PLANS[tier].features;
}

/**
 * Check if user has specific feature access
 */
export function hasFeatureAccess(
  tier: 'free' | 'premium',
  isTrialing: boolean,
  feature: keyof SubscriptionPlan['features']
): boolean {
  const access = getFeatureAccess(tier, isTrialing);
  return Boolean(access[feature]);
}

/**
 * Get history cutoff date based on tier
 */
export function getHistoryCutoffDate(tier: 'free' | 'premium', isTrialing: boolean): Date | null {
  const features = getFeatureAccess(tier, isTrialing);
  
  if (features.historyDays === 'unlimited') {
    return null; // No cutoff
  }
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - features.historyDays);
  return cutoff;
}
