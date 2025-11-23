/**
 * Firebase Cloud Messaging (FCM) utilities
 * Handles FCM token registration, device info detection, and notification permissions
 */

import { FCMToken } from '@/types/user';

/**
 * Detects device platform based on user agent
 * @returns Platform type: 'android', 'ios', or 'web'
 */
export function detectPlatform(): 'android' | 'ios' | 'web' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  return 'web';
}

/**
 * Extracts browser and OS information from user agent
 * @returns Device info object
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  return {
    userAgent,
    browser,
    os
  };
}

/**
 * Creates FCM token object with device information
 * @param token - FCM registration token string
 * @returns FCMToken object ready to be stored in Firestore
 */
export function createFCMTokenObject(token: string): FCMToken {
  const platform = detectPlatform();
  const deviceInfo = getDeviceInfo();
  const now = new Date();
  
  return {
    token,
    platform,
    timestamp: now,
    lastActive: now,
    deviceInfo
  };
}

/**
 * Checks if FCM is supported in current environment
 * @returns true if FCM is supported
 */
export function isFCMSupported(): boolean {
  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers não suportados neste navegador');
    return false;
  }
  
  // Check for Notification API support
  if (!('Notification' in window)) {
    console.log('⚠️ API de Notificações não suportada neste navegador');
    return false;
  }
  
  // Check for PushManager support
  if (!('PushManager' in window)) {
    console.log('⚠️ Push API não suportada neste navegador');
    return false;
  }
  
  return true;
}

/**
 * Requests notification permission from user
 * @returns Permission status: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isFCMSupported()) {
    console.log('❌ FCM não suportado neste ambiente');
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permissão de notificação:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão de notificação:', error);
    return 'denied';
  }
}

/**
 * Gets current notification permission status
 * @returns Current permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}

/**
 * Checks if a token is stale (older than 60 days)
 * @param tokenTimestamp - Token creation timestamp
 * @returns true if token is stale
 */
export function isTokenStale(tokenTimestamp: Date): boolean {
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
  const now = new Date().getTime();
  const tokenTime = new Date(tokenTimestamp).getTime();
  
  return (now - tokenTime) > SIXTY_DAYS;
}

/**
 * Removes stale tokens from array
 * @param tokens - Array of FCM tokens
 * @returns Filtered array with only fresh tokens
 */
export function removeStaleTokens(tokens: FCMToken[]): FCMToken[] {
  return tokens.filter(token => !isTokenStale(token.timestamp));
}

/**
 * Finds token for current device
 * @param tokens - Array of FCM tokens
 * @returns Token for current device or undefined
 */
export function findCurrentDeviceToken(tokens: FCMToken[]): FCMToken | undefined {
  const currentUserAgent = navigator.userAgent;
  return tokens.find(token => token.deviceInfo?.userAgent === currentUserAgent);
}
