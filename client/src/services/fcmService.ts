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
import { registerServiceWorker, unregisterServiceWorkers } from '@/lib/serviceWorkerRegistration';

/**
 * Registers FCM token for current user
 * @param userId - Firebase user ID
 * @param fcmToken - FCM registration token string
 * @returns Promise that resolves when token is registered
 */
export async function registerFCMToken(userId: string, fcmToken: string): Promise<void> {
  try {
    console.log('📱 [FCM Service] Iniciando registro de FCM token');
    console.log('📱 [FCM Service] userId:', userId);
    console.log('📱 [FCM Service] tokenPreview:', fcmToken.substring(0, 20) + '...');
    
    const userRef = doc(db, 'usuarios', userId);
    console.log('📱 [FCM Service] userRef criado para usuarios/' + userId);
    
    const tokenObject = createFCMTokenObject(fcmToken);
    console.log('📱 [FCM Service] tokenObject criado:', {
      token: tokenObject.token.substring(0, 20) + '...',
      platform: tokenObject.platform,
      timestamp: tokenObject.timestamp,
      lastActive: tokenObject.lastActive,
      deviceInfo: tokenObject.deviceInfo
    });
    
    console.log('📱 [FCM Service] Executando updateDoc com arrayUnion...');
    
    // Add token to array (Firestore will prevent duplicates)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(tokenObject),
      updatedAt: new Date()
    });
    
    console.log('✅ [FCM Service] updateDoc executado com sucesso!');
    console.log('✅ [FCM Service] FCM token registrado no Firestore');
    
    // Verify the token was saved
    const verifyDoc = await getDoc(userRef);
    const savedTokens: FCMToken[] = verifyDoc.data()?.fcmTokens || [];
    console.log('🔍 [FCM Service] Verificação: tokens salvos no Firestore:', savedTokens.length);
    console.log('🔍 [FCM Service] Token atual está no array?', savedTokens.some((t: FCMToken) => t.token === fcmToken));
    
  } catch (error: any) {
    console.error('❌ [FCM Service] Erro ao registrar FCM token:', error);
    console.error('❌ [FCM Service] Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
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
 * @param forceNew - If true, deletes existing token and generates a new one
 * @returns FCM token string or null if permission denied/error
 */
export async function requestFCMToken(forceNew: boolean = false): Promise<string | null> {
  try {
    // Check if FCM is supported
    if (!isFCMSupported()) {
      console.log('❌ FCM não suportado neste navegador');
      return null;
    }
    
    // Initialize Firebase Messaging first (needed for deleteToken)
    const { initializeMessaging } = await import('@/lib/firebase');
    const messaging = await initializeMessaging();
    
    if (!messaging) {
      console.log('❌ Firebase Messaging não disponível');
      return null;
    }
    
    // Get VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('❌ VITE_FIREBASE_VAPID_KEY não configurada');
      console.log('ℹ️ Configure a chave VAPID nas variáveis de ambiente');
      throw new Error('VAPID key não configurada. Configure VITE_FIREBASE_VAPID_KEY nas variáveis de ambiente.');
    }
    
    // If forcing new token, delete existing token and unregister service workers
    if (forceNew) {
      console.log('🔄 Forçando geração de novo token FCM...');
      try {
        const { deleteToken } = await import('firebase/messaging');
        await deleteToken(messaging);
        console.log('🗑️ Token antigo deletado do IndexedDB');
      } catch (deleteError) {
        console.log('ℹ️ Nenhum token anterior para deletar ou erro ao deletar:', deleteError);
      }
      
      // Unregister all service workers to clear cached subscriptions
      console.log('🗑️ Desregistrando service workers antigos...');
      await unregisterServiceWorkers();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Register service worker
    console.log('📝 Registrando service worker para FCM...');
    const swRegistration = await registerServiceWorker();
    
    if (!swRegistration) {
      console.error('❌ Falha ao registrar service worker');
      return null;
    }
    
    // Request permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('⚠️ Permissão de notificação negada');
      return null;
    }
    
    console.log('✅ Permissão de notificação concedida');
    
    // Import getToken dynamically to avoid issues in non-supporting environments
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: swRegistration 
    });
    
    console.log('✅ FCM token gerado:', token.substring(0, 20) + '...');
    return token;
    
  } catch (error) {
    console.error('❌ Erro ao solicitar FCM token:', error);
    // Re-throw to let caller handle the error
    throw error;
  }
}

/**
 * Forces regeneration of FCM token by deleting old token and creating new one
 * This is useful when tokens become invalid (e.g., after credential changes)
 * 
 * IMPORTANT: Only removes old token AFTER new token is successfully generated
 * to prevent leaving user without any token if generation fails.
 * 
 * @param userId - Firebase user ID to register the new token
 * @returns Object with success status and new token
 */
export async function forceRefreshFCMToken(userId: string): Promise<{ success: boolean; token: string | null; error?: string }> {
  try {
    console.log('🔄 [FCM] Iniciando renovação forçada de token...');
    
    // Check if FCM is supported
    if (!isFCMSupported()) {
      return { success: false, token: null, error: 'FCM não suportado neste navegador' };
    }
    
    // Get old token info BEFORE generating new one (for cleanup after success)
    let oldDeviceToken: FCMToken | undefined;
    try {
      const userRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userRef);
      const currentTokens: FCMToken[] = userDoc.data()?.fcmTokens || [];
      oldDeviceToken = findCurrentDeviceToken(currentTokens);
      console.log('📋 [FCM] Token antigo encontrado:', oldDeviceToken ? 'Sim' : 'Não');
    } catch (firestoreError) {
      console.log('ℹ️ [FCM] Erro ao buscar token antigo (continuando):', firestoreError);
    }
    
    // Force generation of new token (deletes from IndexedDB and unregisters SW)
    const newToken = await requestFCMToken(true);
    
    if (!newToken) {
      // DO NOT remove old token if new token generation failed
      console.log('⚠️ [FCM] Falha ao gerar novo token, mantendo token antigo');
      return { success: false, token: null, error: 'Falha ao gerar novo token. Verifique se as notificações estão habilitadas nas configurações do navegador.' };
    }
    
    // Register new token in Firestore FIRST
    await registerFCMToken(userId, newToken);
    console.log('✅ [FCM] Novo token registrado com sucesso');
    
    // Only NOW remove old token from Firestore (after new token is confirmed)
    if (oldDeviceToken && oldDeviceToken.token !== newToken) {
      try {
        console.log('🗑️ [FCM] Removendo token antigo do Firestore...');
        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(oldDeviceToken),
          updatedAt: new Date()
        });
        console.log('✅ [FCM] Token antigo removido');
      } catch (cleanupError) {
        // Non-critical: old token will be cleaned up by stale token cleanup
        console.log('ℹ️ [FCM] Não foi possível remover token antigo (será limpo automaticamente):', cleanupError);
      }
    }
    
    console.log('✅ [FCM] Token renovado com sucesso!');
    return { success: true, token: newToken };
    
  } catch (error: any) {
    console.error('❌ [FCM] Erro ao renovar token:', error);
    return { 
      success: false, 
      token: null, 
      error: error.message || 'Erro desconhecido ao renovar token' 
    };
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
