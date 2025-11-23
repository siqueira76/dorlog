/**
 * Scheduled Notifications Service
 * Sends timezone-aware push notifications for morning/evening quizzes
 * 
 * Uses Cloud Scheduler to trigger functions at specific times,
 * then batches users by timezone for optimal delivery
 * 
 * IMPORTANT: Uses user's timezone field directly instead of static offset matching
 * to properly handle DST transitions and timezone diversity
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

/**
 * Removes invalid FCM tokens from all users in batch
 * @param userDocs - Array of user documents from the batch
 * @param invalidTokens - Array of invalid token strings to remove
 */
async function cleanupInvalidTokens(userDocs: admin.firestore.QueryDocumentSnapshot[], invalidTokens: string[]): Promise<void> {
  const db = admin.firestore();
  const invalidTokenSet = new Set(invalidTokens);
  
  try {
    // For each user in batch, check if they have any invalid tokens
    for (const userDoc of userDocs) {
      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];
      
      // Find tokens that need to be removed
      const tokensToRemove = fcmTokens.filter((tokenObj: any) => 
        invalidTokenSet.has(tokenObj.token)
      );
      
      if (tokensToRemove.length === 0) {
        continue; // No invalid tokens for this user
      }
      
      logger.info(`🧹 Removendo ${tokensToRemove.length} token(s) inválido(s) do usuário ${userDoc.id}`);
      
      // Remove invalid tokens from array
      const userRef = db.collection('usuarios').doc(userDoc.id);
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
        updatedAt: new Date()
      });
    }
    
    logger.info(`✅ Limpeza de tokens concluída: ${invalidTokens.length} tokens removidos`);
  } catch (error) {
    logger.error('❌ Erro ao limpar tokens inválidos:', error);
    // Don't throw - this is cleanup, not critical path
  }
}

/**
 * Checks if current time matches target hour in given timezone
 * Handles DST transitions correctly using Intl API
 */
function isTimezonAtTargetHour(timezone: string, targetHour: number): boolean {
  try {
    const now = new Date();
    
    // Get current hour in the specified timezone using Intl API
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find(part => part.type === 'hour');
    
    if (!hourPart) {
      logger.warn(`⚠️ Não foi possível extrair hora do timezone ${timezone}`);
      return false;
    }
    
    const currentHour = parseInt(hourPart.value, 10);
    return currentHour === targetHour;
  } catch (error) {
    logger.error(`❌ Erro ao processar timezone ${timezone}:`, error);
    return false;
  }
}

/**
 * Sends morning quiz notifications to users in specified timezones
 * Batched by timezone for efficient processing
 * 
 * @param targetTimezones - IANA timezone strings (e.g., ['America/Sao_Paulo'])
 * @param targetHour - Hour to send notification (0-23, in user's timezone)
 */
export async function sendMorningQuizNotifications(
  targetTimezones: string[],
  targetHour: number = 8
): Promise<{ success: number; failed: number }> {
  logger.info('🌅 Enviando notificações de quiz matinal', {
    targetTimezones,
    targetHour
  });

  const db = admin.firestore();
  let successCount = 0;
  let failedCount = 0;

  try {
    // Query users with:
    // 1. Active subscription
    // 2. Notifications enabled
    // 3. Morning quiz enabled
    // 4. Timezone in target list
    // 5. At least one FCM token
    const usersSnapshot = await db.collection('usuarios')
      .where('isSubscriptionActive', '==', true)
      .where('notificationPreferences.enabled', '==', true)
      .where('notificationPreferences.morningQuiz', '==', true)
      .where('timezone', 'in', targetTimezones)
      .get();

    logger.info(`📊 Encontrados ${usersSnapshot.size} usuários elegíveis`);

    // Prepare notification payload
    const notification = {
      title: '🌅 Bom dia! Como você está se sentindo?',
      body: 'É hora do seu questionário matinal. Compartilhe como foi sua noite e como está o seu dia começando.'
    };

    const data = {
      type: 'morning_quiz',
      priority: 'high',
      timestamp: new Date().toISOString()
    };

    // Process users in batches to avoid overwhelming FCM
    const batchSize = 500; // FCM limit
    const users = usersSnapshot.docs;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const tokens: string[] = [];
      const tokenToUserMap = new Map<string, string>(); // Map token to userId for cleanup

      // Collect all valid FCM tokens from this batch
      for (const userDoc of batch) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        // Extract token strings from FCMToken objects
        fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
            tokenToUserMap.set(tokenObj.token, userDoc.id);
          }
        });
      }

      if (tokens.length === 0) {
        logger.info(`⚠️ Batch ${i / batchSize + 1}: Nenhum token válido encontrado`);
        continue;
      }

      logger.info(`📤 Enviando batch ${i / batchSize + 1}: ${tokens.length} tokens`);

      try {
        // Send multicast message
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification,
          data,
          android: {
            priority: 'high',
            notification: {
              channelId: 'quiz_reminders',
              priority: 'high',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          },
          webpush: {
            notification: {
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              requireInteraction: false,
              tag: 'morning-quiz',
              vibrate: [200, 100, 200]
            }
          }
        });

        successCount += response.successCount;
        failedCount += response.failureCount;

        logger.info(`✅ Batch ${i / batchSize + 1} completo`, {
          success: response.successCount,
          failed: response.failureCount
        });

        // Handle failed tokens (remove invalid ones immediately)
        if (response.failureCount > 0) {
          const invalidTokens: string[] = [];
          
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              // Only remove permanently invalid tokens
              if (
                errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered'
              ) {
                invalidTokens.push(tokens[idx]);
                logger.warn(`🗑️ Token inválido (será removido): ${tokens[idx].substring(0, 20)}...`);
              } else {
                logger.warn(`⚠️ Erro temporário no token: ${tokens[idx].substring(0, 20)}...`, {
                  error: resp.error?.message
                });
              }
            }
          });

          // Remove invalid tokens from users
          if (invalidTokens.length > 0) {
            await cleanupInvalidTokens(batch, invalidTokens);
          }
        }
      } catch (error) {
        logger.error(`❌ Erro ao enviar batch ${i / batchSize + 1}:`, error);
        failedCount += tokens.length;
      }
    }

    logger.info('🎉 Notificações matinais enviadas', {
      total: users.length,
      success: successCount,
      failed: failedCount
    });

    return { success: successCount, failed: failedCount };
  } catch (error) {
    logger.error('❌ Erro ao enviar notificações matinais:', error);
    throw error;
  }
}

/**
 * Sends evening quiz notifications to users in specified timezones
 * Batched by timezone for efficient processing
 * 
 * @param targetTimezones - IANA timezone strings (e.g., ['America/Sao_Paulo'])
 * @param targetHour - Hour to send notification (0-23, in user's timezone)
 */
export async function sendEveningQuizNotifications(
  targetTimezones: string[],
  targetHour: number = 20
): Promise<{ success: number; failed: number }> {
  logger.info('🌙 Enviando notificações de quiz noturno', {
    targetTimezones,
    targetHour
  });

  const db = admin.firestore();
  let successCount = 0;
  let failedCount = 0;

  try {
    // Query users with evening quiz enabled
    const usersSnapshot = await db.collection('usuarios')
      .where('isSubscriptionActive', '==', true)
      .where('notificationPreferences.enabled', '==', true)
      .where('notificationPreferences.eveningQuiz', '==', true)
      .where('timezone', 'in', targetTimezones)
      .get();

    logger.info(`📊 Encontrados ${usersSnapshot.size} usuários elegíveis`);

    // Prepare notification payload
    const notification = {
      title: '🌙 Boa noite! Como foi seu dia?',
      body: 'É hora do seu questionário noturno. Compartilhe como foi seu dia e como está se sentindo agora.'
    };

    const data = {
      type: 'evening_quiz',
      priority: 'high',
      timestamp: new Date().toISOString()
    };

    // Process users in batches
    const batchSize = 500;
    const users = usersSnapshot.docs;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const tokens: string[] = [];
      const tokenToUserMap = new Map<string, string>(); // Map token to userId for cleanup

      for (const userDoc of batch) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
            tokenToUserMap.set(tokenObj.token, userDoc.id);
          }
        });
      }

      if (tokens.length === 0) {
        logger.info(`⚠️ Batch ${i / batchSize + 1}: Nenhum token válido encontrado`);
        continue;
      }

      logger.info(`📤 Enviando batch ${i / batchSize + 1}: ${tokens.length} tokens`);

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification,
          data,
          android: {
            priority: 'high',
            notification: {
              channelId: 'quiz_reminders',
              priority: 'high',
              sound: 'default'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          },
          webpush: {
            notification: {
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              requireInteraction: false,
              tag: 'evening-quiz',
              vibrate: [200, 100, 200]
            }
          }
        });

        successCount += response.successCount;
        failedCount += response.failureCount;

        logger.info(`✅ Batch ${i / batchSize + 1} completo`, {
          success: response.successCount,
          failed: response.failureCount
        });

        // Handle failed tokens (remove invalid ones immediately)
        if (response.failureCount > 0) {
          const invalidTokens: string[] = [];
          
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              // Only remove permanently invalid tokens
              if (
                errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered'
              ) {
                invalidTokens.push(tokens[idx]);
                logger.warn(`🗑️ Token inválido (será removido): ${tokens[idx].substring(0, 20)}...`);
              } else {
                logger.warn(`⚠️ Erro temporário no token: ${tokens[idx].substring(0, 20)}...`, {
                  error: resp.error?.message
                });
              }
            }
          });

          // Remove invalid tokens from users
          if (invalidTokens.length > 0) {
            await cleanupInvalidTokens(batch, invalidTokens);
          }
        }
      } catch (error) {
        logger.error(`❌ Erro ao enviar batch ${i / batchSize + 1}:`, error);
        failedCount += tokens.length;
      }
    }

    logger.info('🎉 Notificações noturnas enviadas', {
      total: users.length,
      success: successCount,
      failed: failedCount
    });

    return { success: successCount, failed: failedCount };
  } catch (error) {
    logger.error('❌ Erro ao enviar notificações noturnas:', error);
    throw error;
  }
}

/**
 * Gets list of timezones that should receive notifications at current hour
 * Used by Cloud Scheduler to determine which users to notify
 * 
 * Handles DST correctly by using Intl API instead of static offsets
 * 
 * @param targetHour - Target hour in user's local timezone (0-23)
 * @returns Array of unique timezone strings currently at target hour
 */
export function getTimezonesAtHour(targetHour: number): string[] {
  // Common timezones in Brazil and Portuguese-speaking countries
  const timezones = [
    'America/Sao_Paulo',      // BRT (UTC-3) / BRST (UTC-2) when DST active
    'America/Manaus',         // AMT (UTC-4)
    'America/Rio_Branco',     // ACT (UTC-5)
    'America/Noronha',        // FNT (UTC-2)
    'Europe/Lisbon',          // WET (UTC+0) / WEST (UTC+1) during DST
    'Atlantic/Azores',        // AZOT (UTC-1) / AZOST (UTC+0) during DST
    'Atlantic/Cape_Verde',    // CVT (UTC-1)
    'Africa/Luanda',          // WAT (UTC+1)
    'Africa/Maputo'           // CAT (UTC+2)
  ];

  const now = new Date();
  const currentMinutes = now.getUTCMinutes();

  // Only trigger if we're within the first 15 minutes of the hour
  // This prevents duplicate sends if function runs multiple times
  if (currentMinutes >= 15) {
    logger.info('⏰ Fora da janela de envio (primeiros 15 minutos da hora)');
    return [];
  }

  const matchingTimezones: string[] = [];
  const seenTimezones = new Set<string>(); // Deduplicate

  for (const tz of timezones) {
    if (seenTimezones.has(tz)) {
      continue; // Skip duplicates
    }
    
    if (isTimezonAtTargetHour(tz, targetHour)) {
      matchingTimezones.push(tz);
      seenTimezones.add(tz);
      logger.info(`✅ Timezone ${tz} está em ${targetHour}h (local)`);
    }
  }

  logger.info(`🌍 Encontrados ${matchingTimezones.length} timezones únicos em ${targetHour}h`);
  return matchingTimezones;
}
