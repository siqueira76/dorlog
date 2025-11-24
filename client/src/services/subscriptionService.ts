/**
 * Subscription Management Service
 * Gerencia todo o ciclo de vida de assinaturas, trials e features
 */

import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserFeatures } from '@/types/user';
import { SUBSCRIPTION_PLANS, TRIAL_CONFIG, getFeatureAccess } from '@/config/subscriptionPlans';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'trialing' | 'canceled' | 'expired' | 'incomplete';
  isPremium: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: Date | null;
  features: UserFeatures;
  canUpgrade: boolean;
}

export class SubscriptionService {
  /**
   * NOTA: Esta função não é mais necessária - trial é inicializado diretamente no AuthContext
   * Mantida para compatibilidade futura
   */
  static async initializeTrialForNewUser(userId: string): Promise<void> {
    console.log('⚠️ initializeTrialForNewUser deprecated - trial já inicializado no AuthContext');
  }

  /**
   * Verifica status atual da assinatura
   * CORRIGIDO: Lida com Date e Timestamp corretamente
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const userRef = doc(db, 'usuarios', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userSnap.data();
    const now = new Date();

    // Verificar trial ativo - CORRIGIDO: handle Date e Timestamp
    let isTrialing = false;
    let trialDaysRemaining: number | null = null;
    let trialEndsAt: Date | null = null;

    if (userData.trialEndDate && !userData.trialUsed) {
      // Convert to Date safely
      let trialEnd: Date;
      if (userData.trialEndDate.toDate) {
        // É um Firestore Timestamp
        trialEnd = userData.trialEndDate.toDate();
      } else if (userData.trialEndDate instanceof Date) {
        // Já é Date
        trialEnd = userData.trialEndDate;
      } else {
        // Fallback: tentar criar Date do valor
        trialEnd = new Date(userData.trialEndDate);
      }

      if (now < trialEnd) {
        isTrialing = true;
        const diffTime = trialEnd.getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        trialEndsAt = trialEnd;
      } else {
        // Trial expirou, marcar como usado
        await this.markTrialAsExpired(userId);
      }
    }

    const tier = (userData.subscriptionTier || 'free') as 'free' | 'premium';
    const isPremium = userData.isSubscriptionActive === true || isTrialing;
    const features = getFeatureAccess(tier, isTrialing);

    return {
      tier,
      status: userData.subscriptionStatus || (isTrialing ? 'trialing' : 'active'),
      isPremium,
      isTrialing,
      trialDaysRemaining,
      trialEndsAt,
      features: this.buildFeatures(features),
      canUpgrade: !isPremium,
    };
  }

  /**
   * Ativa assinatura Premium (via Stripe)
   */
  static async activatePremiumSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string
  ): Promise<void> {
    const userRef = doc(db, 'usuarios', userId);
    const startDate = new Date();

    await updateDoc(userRef, {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStartDate: Timestamp.fromDate(startDate),
      isSubscriptionActive: true,
      stripeCustomerId,
      stripeSubscriptionId,
      features: this.buildFeatures(SUBSCRIPTION_PLANS.premium.features),
      updatedAt: Timestamp.now(),
    });

    // Marcar trial como usado se estava em trial
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    
    if (userData?.trialEndDate && !userData.trialUsed) {
      await updateDoc(userRef, { trialUsed: true });
    }

    console.log(`✨ Premium ativado para ${userId}`);
  }

  /**
   * Cancela assinatura Premium
   */
  static async cancelPremiumSubscription(userId: string): Promise<void> {
    const userRef = doc(db, 'usuarios', userId);

    await updateDoc(userRef, {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionEndDate: Timestamp.now(),
      isSubscriptionActive: false,
      features: this.buildFeatures(SUBSCRIPTION_PLANS.free.features),
      updatedAt: Timestamp.now(),
    });

    console.log(`❌ Premium cancelado para ${userId}`);
  }

  /**
   * Marca trial como expirado
   */
  static async markTrialAsExpired(userId: string): Promise<void> {
    const userRef = doc(db, 'usuarios', userId);

    await updateDoc(userRef, {
      trialUsed: true,
      subscriptionStatus: 'active', // Volta para active (mas tier free)
      features: this.buildFeatures(SUBSCRIPTION_PLANS.free.features),
      updatedAt: Timestamp.now(),
    });

    console.log(`⏰ Trial expirado para ${userId}`);
  }

  /**
   * Verifica se pode gerar relatório mensal (quota)
   */
  static async canGenerateMonthlyReport(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId);

    // Premium = ilimitado
    if (status.isPremium) return true;

    // Free = verificar quota mensal
    const userRef = doc(db, 'usuarios', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) return false;

    const thisMonth = new Date().toISOString().slice(0, 7); // "2025-11"
    const lastReportMonth = userData.lastReportGeneratedAt
      ?.toDate?.()
      .toISOString()
      .slice(0, 7);

    return thisMonth !== lastReportMonth;
  }

  /**
   * Registra geração de relatório
   */
  static async recordReportGeneration(userId: string): Promise<void> {
    const userRef = doc(db, 'usuarios', userId);

    await updateDoc(userRef, {
      lastReportGeneratedAt: Timestamp.now(),
      monthlyReportsGenerated: (await getDoc(userRef)).data()?.monthlyReportsGenerated || 0 + 1,
    });
  }

  /**
   * Verifica se pode adicionar médico (limite Free = 3)
   * CORRIGIDO: Não depende de collection "assinaturas" inexistente
   */
  static async canAddDoctor(userId: string, currentDoctorCount: number): Promise<boolean> {
    // Buscar dados direto do usuario
    const userRef = doc(db, 'usuarios', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ Usuário não encontrado:', userId);
      return false;
    }

    const userData = userSnap.data();
    const now = new Date();

    // Verificar se está em trial ativo
    let isTrialing = false;
    if (userData.trialEndDate && !userData.trialUsed) {
      const trialEnd = userData.trialEndDate.toDate ? userData.trialEndDate.toDate() : userData.trialEndDate;
      isTrialing = now < trialEnd;
    }

    // Premium ou Trial = ilimitado
    const isPremium = userData.isSubscriptionActive === true || isTrialing;
    if (isPremium) return true;

    // Free tier: max 3
    const maxDoctors = SUBSCRIPTION_PLANS.free.features.maxDoctors as number;
    return currentDoctorCount < maxDoctors;
  }

  /**
   * Constrói objeto UserFeatures a partir do plan
   */
  private static buildFeatures(planFeatures: any): UserFeatures {
    return {
      nlpAnalysis: planFeatures.nlpAnalysis,
      unlimitedHistory: planFeatures.historyDays === 'unlimited',
      advancedReports: planFeatures.advancedReports,
      unlimitedDoctors: planFeatures.maxDoctors === 'unlimited',
      exportData: planFeatures.exportData !== 'basic',
      prioritySupport: planFeatures.prioritySupport,
      pushNotifications: planFeatures.pushNotifications,
    };
  }

  /**
   * Cria URL de checkout Stripe
   */
  static getCheckoutUrl(userId: string, userEmail: string): string {
    const baseUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;
    
    if (!baseUrl) {
      console.warn('⚠️ VITE_STRIPE_CHECKOUT_URL não configurado');
      return '#';
    }

    // Adicionar client_reference_id para webhook
    const params = new URLSearchParams({
      client_reference_id: userId,
      prefilled_email: userEmail,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Cria URL do Customer Portal Stripe
   */
  static getCustomerPortalUrl(stripeCustomerId: string): string {
    const baseUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;
    
    if (!baseUrl) {
      console.warn('⚠️ VITE_STRIPE_PORTAL_URL não configurado');
      return '#';
    }

    return `${baseUrl}?prefilled_email=${stripeCustomerId}`;
  }
}
