/**
 * Firebase Functions para FibroDiário
 * 
 * Entry point para todas as Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { nlpService } from './nlpService';
import type { NLPAnalysisResult } from './nlpService';

/**
 * Function: nlpAnalyze
 * 
 * Analisa textos usando modelos NLP server-side
 * 
 * @param texts - Array de textos para análise
 * @returns Array de resultados NLP
 */
export const nlpAnalyze = onCall<{ texts: string[] }, { results: NLPAnalysisResult[] }>({
  memory: '2GiB',
  timeoutSeconds: 120,
  concurrency: 80,
  region: 'us-central1'
}, async (request) => {
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
