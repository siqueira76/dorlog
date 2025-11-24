export interface FCMToken {
  token: string;
  platform: 'android' | 'ios' | 'web';
  timestamp: Date;
  lastActive: Date;
  deviceInfo?: {
    userAgent: string;
    browser?: string;
    os?: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  morningQuiz: boolean;
  eveningQuiz: boolean;
  medicationReminders: boolean;
  healthInsights: boolean;
  emergencyAlerts: boolean;
}

export interface UserFeatures {
  nlpAnalysis: boolean;
  unlimitedHistory: boolean;
  advancedReports: boolean;
  unlimitedDoctors: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  pushNotifications: boolean;
}

export interface RecentReport {
  reportUrl: string;
  fileName: string;
  periodsText: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface SubscriptionPlan {
  id: 'free' | 'premium';
  name: string;
  price: number;
  interval: 'month' | 'year';
  googlePlayProductId?: string; // ID do produto no Play Console (e.g., "fibrodiario_premium_monthly")
  features: {
    historyDays: number | 'unlimited';
    maxDoctors: number | 'unlimited';
    nlpAnalysis: boolean;
    advancedReports: boolean;
    exportData: 'basic' | 'advanced';
    monthlyReportsLimit: number | 'unlimited';
    pushNotifications: boolean;
    prioritySupport: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  provider: 'email' | 'google';
  createdAt?: Date;
  updatedAt?: Date;
  isSubscriptionActive?: boolean;
  
  // Terms acceptance
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  
  // Timezone information
  timezone?: string;
  timezoneOffset?: number;
  timezoneAutoDetected?: boolean;
  
  // FCM tokens for push notifications
  fcmTokens?: FCMToken[];
  
  // Notification preferences
  notificationPreferences?: NotificationPreferences;
  
  // Freemium subscription fields
  subscriptionTier?: 'free' | 'premium';
  subscriptionStatus?: 'active' | 'trialing' | 'canceled' | 'expired' | 'incomplete';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  
  // Trial management
  trialUsed?: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  
  // Google Play Billing integration
  googlePlayPurchaseToken?: string; // Token de compra do Play Store
  googlePlaySubscriptionId?: string; // ID da assinatura (e.g., "fibrodiario.premium.monthly")
  googlePlayOrderId?: string; // Order ID único da Google
  
  // Usage tracking
  monthlyReportsGenerated?: number;
  lastReportGeneratedAt?: Date;
  lastReportResetAt?: Date;
  
  // Feature flags
  features?: UserFeatures;
  
  // Recent reports (last 3 generated)
  recentReports?: RecentReport[];
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

export interface Subscription {
  email: string;
  data: Date;
  active?: boolean;
}
