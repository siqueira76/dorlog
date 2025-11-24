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

export interface SubscriptionPlan {
  id: 'free' | 'premium';
  name: string;
  price: number;
  interval: 'month' | 'year';
  stripePriceId?: string;
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
  
  // Stripe integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Usage tracking
  monthlyReportsGenerated?: number;
  lastReportGeneratedAt?: Date;
  lastReportResetAt?: Date;
  
  // Feature flags
  features?: UserFeatures;
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
