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
