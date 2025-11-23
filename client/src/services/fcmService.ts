/**
 * FCM Service - Manages Firebase Cloud Messaging tokens and notifications
 * Handles registration, updates, and cleanup of FCM tokens for push notifications
 */

import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FCMToken } from '@/types/user';
import {
  createFCMTokenObject,
  isFCMSupported,
  requestNotificationPermission,
  getNotificationPermission,
  removeStaleTokens,
  findCurrentDeviceToken
} from '@/lib/fcmUtils';

/**
 * Registers FCM token for current user
 * @param userId - Firebase user ID
 * @param fcmToken - FCM registration token string
 * @returns Promise that resolves when token is registered
 */
export async function registerFCMToken(userId: string, fcmToken: string): Promise<void> {
  try {
    console.log('📱 Registrando FCM token:', {
      userId,
      tokenPreview: fcmToken.substring(0, 20) + '...'
    });
    
    const userRef = doc(db, 'usuarios', userId);
    const tokenObject = createFCMTokenObject(fcmToken);
    
    // Add token to array (Firestore will prevent duplicates)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(tokenObject),
      updatedAt: new Date()
    });
    
    console.log('✅ FCM token registrado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao registrar FCM token:', error);
    throw error;
  }
}

/**
 * Removes FCM token from user's tokens array
 * @param userId - Firebase user ID
 * @param tokenString - FCM token string to remove
 */
export async function removeFCMToken(userId: string, tokenString: string): Promise<void> {
  try {
    console.log('🗑️ Removendo FCM token:', {
      userId,
      tokenPreview: tokenString.substring(0, 20) + '...'
    });
    
    const userRef = doc(db, 'usuarios', userId);
    
    // Get current user document to find the exact token object
    const userDoc = await getDoc(userRef);
    const currentTokens: FCMToken[] = userDoc.data()?.fcmTokens || [];
    
    // Find the token object that matches the string
    const tokenToRemove = currentTokens.find(t => t.token === tokenString);
    
    if (!tokenToRemove) {
      console.log('⚠️ Token não encontrado no array');
      return;
    }
    
    // Remove token from array (requires full object for Firestore)
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(tokenToRemove),
      updatedAt: new Date()
    });
    
    console.log('✅ FCM token removido com sucesso');
  } catch (error) {
    console.error('❌ Erro ao remover FCM token:', error);
    throw error;
  }
}

/**
 * Updates lastActive timestamp for current device's token
 * @param userId - Firebase user ID
 */
export async function updateTokenLastActive(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    
    // Get current user document to find the token
    const userDoc = await getDoc(userRef);
    const currentTokens: FCMToken[] = userDoc.data()?.fcmTokens || [];
    
    // Find token for current device
    const currentToken = findCurrentDeviceToken(currentTokens);
    
    if (!currentToken) {
      console.log('ℹ️ Nenhum token encontrado para este dispositivo');
      return;
    }
    
    // Update lastActive timestamp
    const updatedToken: FCMToken = {
      ...currentToken,
      lastActive: new Date()
    };
    
    // Remove old token and add updated one (in single operation for atomicity)
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(currentToken)
    });
    
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(updatedToken),
      updatedAt: new Date()
    });
    
    console.log('✅ Token lastActive atualizado');
  } catch (error) {
    console.error('❌ Erro ao atualizar lastActive:', error);
  }
}

/**
 * Cleans up stale tokens (older than 60 days) from user's tokens array
 * @param userId - Firebase user ID
 */
export async function cleanupStaleTokens(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    
    // Get current user document
    const userDoc = await getDoc(userRef);
    const currentTokens: FCMToken[] = userDoc.data()?.fcmTokens || [];
    
    const freshTokens = removeStaleTokens(currentTokens);
    const staleCount = currentTokens.length - freshTokens.length;
    
    if (staleCount === 0) {
      console.log('✅ Nenhum token obsoleto encontrado');
      return;
    }
    
    console.log(`🧹 Limpando ${staleCount} token(s) obsoleto(s)`);
    
    // Replace entire array with fresh tokens
    await updateDoc(userRef, {
      fcmTokens: freshTokens,
      updatedAt: new Date()
    });
    
    console.log('✅ Tokens obsoletos removidos');
  } catch (error) {
    console.error('❌ Erro ao limpar tokens obsoletos:', error);
  }
}

/**
 * Requests notification permission and returns FCM token if granted
 * @returns FCM token string or null if permission denied/error
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    // Check if FCM is supported
    if (!isFCMSupported()) {
      console.log('❌ FCM não suportado neste navegador');
      return null;
    }
    
    // Request permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('⚠️ Permissão de notificação negada');
      return null;
    }
    
    console.log('✅ Permissão de notificação concedida');
    
    // Initialize Firebase Messaging
    const { initializeMessaging } = await import('@/lib/firebase');
    const messaging = await initializeMessaging();
    
    if (!messaging) {
      console.log('❌ Firebase Messaging não disponível');
      return null;
    }
    
    // Get FCM token using VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('❌ VITE_FIREBASE_VAPID_KEY não configurada');
      console.log('ℹ️ Configure a chave VAPID nas variáveis de ambiente');
      return null;
    }
    
    // Import getToken dynamically to avoid issues in non-supporting environments
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { vapidKey });
    
    console.log('✅ FCM token gerado:', token.substring(0, 20) + '...');
    return token;
    
  } catch (error) {
    console.error('❌ Erro ao solicitar FCM token:', error);
    return null;
  }
}

/**
 * Checks current notification permission status
 * @returns Current permission status
 */
export function checkNotificationPermission(): NotificationPermission {
  return getNotificationPermission();
}

/**
 * Updates notification preferences for user
 * @param userId - Firebase user ID
 * @param preferences - Updated notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<{
    enabled: boolean;
    morningQuiz: boolean;
    eveningQuiz: boolean;
    medicationReminders: boolean;
    healthInsights: boolean;
    emergencyAlerts: boolean;
  }>
): Promise<void> {
  try {
    console.log('⚙️ Atualizando preferências de notificação:', preferences);
    
    const userRef = doc(db, 'usuarios', userId);
    
    // Get current preferences first
    const userDoc = await getDoc(userRef);
    const currentPreferences = userDoc.data()?.notificationPreferences || {};
    
    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };
    
    await updateDoc(userRef, {
      notificationPreferences: updatedPreferences,
      updatedAt: new Date()
    });
    
    console.log('✅ Preferências de notificação atualizadas');
  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
    throw error;
  }
}
