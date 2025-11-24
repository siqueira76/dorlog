/**
 * Hook for accessing subscription status in components
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionService, SubscriptionStatus } from '@/services/subscriptionService';

export function useSubscriptionStatus() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(currentUser.id);
        setStatus(subscriptionStatus);
      } catch (error) {
        console.error('Erro ao carregar status de assinatura:', error);
        // Default to free tier on error
        setStatus({
          tier: 'free',
          status: 'active',
          isPremium: false,
          isTrialing: false,
          trialDaysRemaining: null,
          trialEndsAt: null,
          features: {
            nlpAnalysis: false,
            unlimitedHistory: false,
            advancedReports: false,
            unlimitedDoctors: false,
            exportData: false,
            prioritySupport: false,
            pushNotifications: false,
          },
          canUpgrade: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [currentUser?.id]);

  return { status, loading };
}
