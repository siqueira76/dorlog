import { UnifiedReportService, UnifiedReportOptions } from '@/services/unifiedReportService';
import { EnhancedUnifiedReportService } from '@/services/enhancedUnifiedReportService';

/**
 * New unified patch that replaces githubPagesFix.ts
 * Works in both Replit and GitHub Pages environments
 * Uses real Firestore data and Firebase Storage
 */
export const patchApiCallsUnified = () => {
  console.log('🔄 Aplicando patch unificado para geração de relatórios...');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch globally
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Intercept generate-monthly-report API calls
    if (url.includes('/api/generate-monthly-report') && init?.method === 'POST') {
      console.log('🔄 Patch Unificado: Interceptando chamada para geração de relatório...');
      
      try {
        const body = JSON.parse(init.body as string);
        const { userId, periods, periodsText } = body;
        
        console.log(`🧠 Gerando relatório enhanced inteligente:`, { userId, periodsText, periodsCount: periods.length });
        
        // Use unified report service
        const options: UnifiedReportOptions = {
          userId,
          periods,
          periodsText
        };
        
        const result = await EnhancedUnifiedReportService.generateIntelligentReport(options);
        
        if (result.success) {
          // Return success response (compatible with existing code)
          // Note: Report URL will be handled by the sharing logic
          return new Response(JSON.stringify({
            success: true,
            reportUrl: result.reportUrl,
            fileName: result.fileName,
            executionTime: result.executionTime,
            message: result.message,
            dataSource: 'firestore',
            storageProvider: 'firebase_storage',
            environment: 'enhanced_unified_client_side',
            analysisType: result.analysisType || 'enhanced',
            nlpProcessed: result.nlpProcessed || false,
            chartsGenerated: result.chartsGenerated || false,
            alertsGenerated: result.alertsGenerated || 0
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error(result.error || 'Falha na geração do relatório');
        }
        
      } catch (error) {
        console.error('❌ Erro no patch unificado:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: `Erro na geração do relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          environment: 'unified_client_side'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For all other requests, use original fetch
    return originalFetch(input, init);
  };
  
  console.log('✅ Patch unificado aplicado com sucesso');
};

// Mover import.meta.env para escopo de módulo para evitar erros ESM
const FIREBASE_CONFIG = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY
};

/**
 * Check if unified report service is ready with enhanced validation
 */
export const checkUnifiedReportReadiness = (): boolean => {
  try {
    // 1. Check Firebase configuration
    const { projectId, apiKey } = FIREBASE_CONFIG;
    const hasFirebaseConfig = Boolean(projectId && apiKey && projectId !== 'demo-project');
    
    if (!hasFirebaseConfig) {
      console.warn('⚠️ Configuração Firebase incompleta:', {
        projectId: projectId ? '✓ Configurado' : '❌ Ausente',
        apiKey: apiKey ? '✓ Configurado' : '❌ Ausente'
      });
      return false;
    }
    
    // 2. Check UnifiedReportService configuration
    const config = UnifiedReportService.checkConfiguration();
    
    if (!config.isReady) {
      console.warn('⚠️ Problemas na configuração do serviço unificado:', config.issues);
      return false;
    }
    
    // 3. Check environment compatibility
    const isValidEnvironment = typeof window !== 'undefined' && 
                              typeof fetch !== 'undefined';
    
    if (!isValidEnvironment) {
      console.warn('⚠️ Ambiente inválido para sistema unificado');
      return false;
    }
    
    console.log('✅ Sistema unificado pronto com identificadores normalizados');
    return true;
    
  } catch (error) {
    console.error('❌ Verificação de prontidão falhou:', error);
    return false;
  }
};

/**
 * Test function for unified report generation
 */
export const testUnifiedReport = async (userId: string, periods: string[], periodsText: string) => {
  console.log('🧪 Testando geração de relatório unificado...');
  
  try {
    const result = await UnifiedReportService.generateReport({
      userId,
      periods,
      periodsText
    });
    
    if (result.success) {
      console.log('✅ Teste bem-sucedido:', result);
    } else {
      console.error('❌ Teste falhou:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    throw error;
  }
};