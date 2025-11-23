/**
 * Scheduled Notifications Service
 * Sends timezone-aware push notifications for morning/evening quizzes
 * 
 * Uses Cloud Scheduler to trigger functions at specific times,
 * then batches users by timezone for optimal delivery
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

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

      // Collect all valid FCM tokens from this batch
      for (const userDoc of batch) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        // Extract token strings from FCMToken objects
        fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
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

        // Handle failed tokens (remove invalid ones)
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
              logger.warn(`❌ Token inválido: ${tokens[idx].substring(0, 20)}...`, {
                error: resp.error?.message
              });
            }
          });

          // TODO: Remove failed tokens from Firestore
          // This requires matching tokens back to users, which is complex
          // Consider implementing in a separate cleanup function
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

      for (const userDoc of batch) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        fcmTokens.forEach((tokenObj: any) => {
          if (tokenObj.token) {
            tokens.push(tokenObj.token);
          }
        });
      }

      if (tokens.length === 0) {
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
 * @param targetHour - Target hour in user's local timezone (0-23)
 * @returns Array of timezone strings currently at target hour
 */
export function getTimezonesAtHour(targetHour: number): string[] {
  // Common timezones in Brazil and Portuguese-speaking countries
  const timezones = [
    'America/Sao_Paulo',      // BRT (UTC-3)
    'America/Manaus',         // AMT (UTC-4)
    'America/Rio_Branco',     // ACT (UTC-5)
    'America/Noronha',        // FNT (UTC-2)
    'Europe/Lisbon',          // WET/WEST (UTC+0/+1)
    'Atlantic/Azores',        // AZOT/AZOST (UTC-1/0)
    'Atlantic/Cape_Verde',    // CVT (UTC-1)
    'Africa/Luanda',          // WAT (UTC+1)
    'Africa/Maputo'           // CAT (UTC+2)
  ];

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinutes = now.getUTCMinutes();

  // Only trigger if we're within the first 15 minutes of the hour
  // This prevents duplicate sends if function runs multiple times
  if (currentMinutes >= 15) {
    logger.info('⏰ Fora da janela de envio (primeiros 15 minutos da hora)');
    return [];
  }

  const matchingTimezones: string[] = [];

  for (const tz of timezones) {
    try {
      // Get current time in this timezone
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const tzHour = tzDate.getHours();

      if (tzHour === targetHour) {
        matchingTimezones.push(tz);
        logger.info(`✅ Timezone ${tz} está em ${targetHour}h (local)`);
      }
    } catch (error) {
      logger.warn(`⚠️ Erro ao processar timezone ${tz}:`, error);
    }
  }

  logger.info(`🌍 Encontrados ${matchingTimezones.length} timezones em ${targetHour}h`);
  return matchingTimezones;
}
