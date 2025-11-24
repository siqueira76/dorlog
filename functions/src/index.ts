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
import { fetchUserReportData } from './firestoreDataService';
import { generateReportHTML } from './htmlTemplateService';
import { 
  generateReportId, 
  uploadReportToStorage, 
  saveToRecentReports, 
  generatePasswordHash 
} from './storageService';

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
      return;
    }
    
    // Send notifications
    const result = await sendMorningQuizNotifications(timezones, 8);
    
    console.log('✅ Morning quiz reminders enviados', result);
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
      return;
    }
    
    // Send notifications
    const result = await sendEveningQuizNotifications(timezones, 20);
    
    console.log('✅ Evening quiz reminders enviados', result);
  } catch (error) {
    console.error('❌ Erro em sendEveningQuizReminders:', error);
    throw error;
  }
});

/**
 * Function: generateReportBackground
 * 
 * Gera relatórios médicos em background (server-side)
 * Permite que o usuário saia da tela/feche aba durante processamento
 * 
 * Fluxo:
 * 1. Busca dados do Firestore
 * 2. Processa NLP (se enhanced)
 * 3. Gera HTML
 * 4. Upload para Storage
 * 5. Salva em recentReports
 * 6. Retorna URL
 */
export const generateReportBackground = onCall({
  memory: '4GiB', // Mais memória para NLP
  timeoutSeconds: 540, // 9 minutos max
  concurrency: 50, // Múltiplos usuários simultâneos
  region: 'us-central1'
}, async (request: {
  auth?: any;
  data: {
    periods: string[];
    periodsText: string;
    templateType?: 'standard' | 'enhanced';
    withPassword?: boolean;
    password?: string;
  }
}) => {
  console.log('📊 generateReportBackground invocada');

  // Validação de autenticação
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Autenticação necessária para gerar relatórios'
    );
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email || 'unknown';
  
  console.log(`👤 Usuário: ${userEmail} (${userId})`);

  // Validação de dados
  const { periods, periodsText, templateType = 'standard', withPassword, password } = request.data;

  if (!Array.isArray(periods) || periods.length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'Períodos inválidos'
    );
  }

  if (!periodsText) {
    throw new HttpsError(
      'invalid-argument',
      'Texto de períodos é obrigatório'
    );
  }

  const startTime = Date.now();

  try {
    console.log(`🚀 Iniciando geração de relatório ${templateType}...`);
    console.log(`📅 Períodos: ${periodsText} (${periods.length} período(s))`);

    // 1. Gerar ID único
    const reportId = generateReportId(userId);
    console.log(`🆔 Report ID: ${reportId}`);

    // 2. Buscar dados do Firestore
    console.log('🔍 Buscando dados do Firestore...');
    const reportData = await fetchUserReportData(userId, periods);
    console.log(`✅ Dados coletados: ${reportData.totalDays} dias, ${reportData.medications.length} medicamentos`);

    // 3. Processar NLP (se enhanced)
    let nlpResults;
    if (templateType === 'enhanced') {
      console.log('🧠 Processando análise NLP...');
      
      // Extrair textos dos quizzes
      const texts: string[] = [];
      reportData.quizData.forEach((quiz: any) => {
        if (quiz.observacoes) texts.push(quiz.observacoes);
        if (quiz.notes) texts.push(quiz.notes);
      });

      if (texts.length > 0) {
        console.log(`📝 Analisando ${texts.length} textos...`);
        nlpResults = await nlpService.analyzeBatch(texts);
        console.log(`✅ Análise NLP concluída: ${nlpResults.length} resultados`);
      } else {
        console.log('ℹ️ Nenhum texto para análise NLP');
      }
    }

    // 4. Buscar dados do usuário
    const db = admin.firestore();
    const userDoc = await db.collection('usuarios').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.name || userData?.nome || 'Paciente';

    // 5. Gerar HTML (com hash de senha se necessário)
    console.log('📝 Gerando HTML do relatório...');
    
    let passwordHash: string | undefined;
    if (withPassword && password) {
      passwordHash = generatePasswordHash(password);
      console.log('🔒 Senha hashada com sucesso');
    }
    
    const htmlContent = generateReportHTML({
      reportId,
      periodsText,
      userName,
      userEmail,
      generatedAt: new Date(),
      reportData,
      nlpResults,
      withPassword,
      passwordHash
    });
    console.log(`✅ HTML gerado (${htmlContent.length} bytes)`);

    // 6. Upload para Storage
    console.log('📤 Fazendo upload para Firebase Storage...');
    const { url, fileName } = await uploadReportToStorage(reportId, htmlContent, userId);
    console.log(`✅ Upload concluído: ${url}`);

    // 7. Salvar em recentReports
    console.log('💾 Salvando no histórico do usuário...');
    await saveToRecentReports(userId, {
      reportId,
      reportUrl: url,
      fileName,
      periodsText,
      periods,
      templateType
    });
    console.log('✅ Histórico atualizado');

    // 8. Calcular tempo de execução
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⚡ Relatório gerado em ${executionTime}s`);

    // 9. Retornar resultado
    return {
      success: true,
      reportUrl: url,
      fileName,
      reportId,
      executionTime: `${executionTime}s`,
      message: 'Relatório gerado com sucesso!'
    };

  } catch (error: any) {
    console.error('❌ Erro ao gerar relatório:', error);
    
    throw new HttpsError(
      'internal',
      'Erro ao gerar relatório',
      error.message || String(error)
    );
  }
});
