/**
 * Background Report Service
 * 
 * Chama Cloud Function para gerar relatórios em background
 * Permite que o usuário saia da tela/feche aba durante processamento
 */

import { httpsCallable, getFunctions } from 'firebase/functions';
import app from '@/lib/firebase';

const functions = getFunctions(app);

export interface BackgroundReportOptions {
  periods: string[];
  periodsText: string;
  templateType?: 'standard' | 'enhanced';
  withPassword?: boolean;
  password?: string;
}

export interface BackgroundReportResult {
  success: boolean;
  reportUrl?: string;
  fileName?: string;
  reportId?: string;
  executionTime?: string;
  message?: string;
  error?: string;
}

/**
 * Gera relatório usando Cloud Function em background
 * 
 * Vantagens:
 * - Continua processando mesmo se fechar aba
 * - Mais rápido (servidor tem mais recursos)
 * - Não trava o navegador do usuário
 * - Processamento paralelo para múltiplos usuários
 */
export async function generateReportBackground(
  options: BackgroundReportOptions
): Promise<BackgroundReportResult> {
  console.log('🚀 [Background Service] Chamando Cloud Function...');
  console.log('📊 Opções:', {
    periods: options.periods,
    periodsText: options.periodsText,
    templateType: options.templateType || 'standard'
  });

  try {
    // Chamar Cloud Function
    const generateReport = httpsCallable<BackgroundReportOptions, BackgroundReportResult>(
      functions,
      'generateReportBackground'
    );

    console.log('📞 Invocando função...');
    const result = await generateReport(options);
    
    console.log('✅ Resposta recebida:', result.data);

    if (!result.data.success) {
      throw new Error(result.data.error || 'Erro desconhecido ao gerar relatório');
    }

    // Disparar evento para atualizar UI (Home page)
    window.postMessage({ type: 'REFRESH_USER_DATA' }, '*');
    console.log('📤 Evento de refresh enviado');

    return result.data;

  } catch (error: any) {
    console.error('❌ [Background Service] Erro:', error);
    
    // Parse Firebase Functions error
    if (error.code && error.message) {
      return {
        success: false,
        error: `${error.code}: ${error.message}`
      };
    }

    return {
      success: false,
      error: error.message || 'Erro ao gerar relatório em background'
    };
  }
}

/**
 * Verifica se a Cloud Function está disponível
 */
export async function checkBackgroundServiceHealth(): Promise<boolean> {
  try {
    const healthCheck = httpsCallable(functions, 'nlpHealth');
    await healthCheck();
    return true;
  } catch (error) {
    console.warn('⚠️ Background service não disponível:', error);
    return false;
  }
}
