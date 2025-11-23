/**
 * Firebase Functions para FibroDiário
 * 
 * Entry point para todas as Cloud Functions
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { nlpService } from './nlpService';
import {
  sendMorningQuizNotifications,
  sendEveningQuizNotifications,
  getTimezonesAtHour
} from './scheduledNotifications';

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Function: nlpAnalyze
 * 
 * Analisa textos usando modelos NLP server-side
 * 
 * @param texts - Array de textos para análise
 * @returns Array de resultados NLP
 */
export const nlpAnalyze = onCall({
  memory: '2GiB',
  timeoutSeconds: 120,
  concurrency: 80,
  region: 'us-central1'
}, async (request: { auth?: any; data: { texts: string[] } }) => {
  console.log('📞 nlpAnalyze invocada');

  // Validação de autenticação
  if (!request.auth) {
    console.warn('⚠️ Tentativa de acesso sem autenticação');
    throw new HttpsError(
      'unauthenticated',
      'Autenticação necessária para usar análise NLP'
    );
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email || 'unknown';
  
  console.log(`👤 Usuário: ${userEmail} (${userId})`);

  // Validação de dados
  const { texts } = request.data;

  if (!Array.isArray(texts)) {
    throw new HttpsError(
      'invalid-argument',
      'Parâmetro "texts" deve ser um array de strings'
    );
  }

  if (texts.length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'Array de textos não pode estar vazio'
    );
  }

  if (texts.length > 50) {
    throw new HttpsError(
      'invalid-argument',
      'Máximo de 50 textos por requisição'
    );
  }

  // Validar que todos são strings
  if (!texts.every(t => typeof t === 'string')) {
    throw new HttpsError(
      'invalid-argument',
      'Todos os elementos devem ser strings'
    );
  }

  try {
    console.log(`📊 Processando ${texts.length} textos para ${userEmail}...`);
    
    // Processar análise NLP
    const results = await nlpService.analyzeBatch(texts);
    
    console.log(`✅ Análise concluída: ${results.length} resultados`);

    return { results };

  } catch (error) {
    console.error('❌ Erro ao processar NLP:', error);
    
    throw new HttpsError(
      'internal',
      'Erro ao processar análise NLP',
      error instanceof Error ? error.message : String(error)
    );
  }
});

/**
 * Function: nlpHealth
 * 
 * Health check para verificar status do serviço NLP
 */
export const nlpHealth = onCall({
  memory: '256MiB',
  timeoutSeconds: 10,
  region: 'us-central1'
}, async () => {
  return {
    status: 'ok',
    service: 'nlp-analysis',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

/**
 * Scheduled Function: sendMorningQuizReminders
 * 
 * Runs every hour to send morning quiz notifications to users
 * in timezones where it's currently 8 AM
 * 
 * Cloud Scheduler: "0 * * * *" (every hour at minute 0)
 */
export const sendMorningQuizReminders = onSchedule({
  schedule: '0 * * * *', // Every hour
  timeZone: 'UTC',
  memory: '512MiB',
  timeoutSeconds: 300,
  region: 'us-central1'
}, async (event) => {
  console.log('⏰ Trigger: sendMorningQuizReminders');
  
  try {
    // Get timezones currently at 8 AM
    const timezones = getTimezonesAtHour(8);
    
    if (timezones.length === 0) {
      console.log('ℹ️ Nenhum timezone em 8h neste momento');
      return { success: true, message: 'No timezones at target hour' };
    }
    
    // Send notifications
    const result = await sendMorningQuizNotifications(timezones, 8);
    
    console.log('✅ Morning quiz reminders enviados', result);
    return {
      success: true,
      timezones,
      ...result
    };
  } catch (error) {
    console.error('❌ Erro em sendMorningQuizReminders:', error);
    throw error;
  }
});

/**
 * Scheduled Function: sendEveningQuizReminders
 * 
 * Runs every hour to send evening quiz notifications to users
 * in timezones where it's currently 8 PM
 * 
 * Cloud Scheduler: "0 * * * *" (every hour at minute 0)
 */
export const sendEveningQuizReminders = onSchedule({
  schedule: '0 * * * *', // Every hour
  timeZone: 'UTC',
  memory: '512MiB',
  timeoutSeconds: 300,
  region: 'us-central1'
}, async (event) => {
  console.log('⏰ Trigger: sendEveningQuizReminders');
  
  try {
    // Get timezones currently at 8 PM (20h)
    const timezones = getTimezonesAtHour(20);
    
    if (timezones.length === 0) {
      console.log('ℹ️ Nenhum timezone em 20h neste momento');
      return { success: true, message: 'No timezones at target hour' };
    }
    
    // Send notifications
    const result = await sendEveningQuizNotifications(timezones, 20);
    
    console.log('✅ Evening quiz reminders enviados', result);
    return {
      success: true,
      timezones,
      ...result
    };
  } catch (error) {
    console.error('❌ Erro em sendEveningQuizReminders:', error);
    throw error;
  }
});
