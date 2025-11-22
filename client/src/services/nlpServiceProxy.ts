/**
 * Proxy NLP Service - Híbrido Client-Side + Server-Side
 * 
 * Decide automaticamente entre processar NLP no cliente ou servidor
 * baseado em capacidade do dispositivo e preferências do usuário.
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { NLPSingleton } from './nlpAnalysisService';
import type { NLPAnalysisResult } from './nlpAnalysisService';

/**
 * Detecção de dispositivo low-end
 */
class DeviceDetector {
  
  /**
   * Verifica se é um dispositivo low-end que se beneficiaria de NLP server-side
   */
  static isLowEndDevice(): boolean {
    // 1. Verificar RAM disponível
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 4) {
        console.log(`📱 Low-end detectado: ${memory}GB RAM`);
        return true;
      }
    }

    // 2. Verificar número de CPU cores
    if ('hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency;
      if (cores && cores < 4) {
        console.log(`📱 Low-end detectado: ${cores} CPU cores`);
        return true;
      }
    }

    // 3. User Agent (Android/iOS antigos)
    const ua = navigator.userAgent;
    
    // Android 4-6
    if (/Android [4-6]/.test(ua)) {
      console.log('📱 Low-end detectado: Android antigo');
      return true;
    }

    // iOS < 12
    const iosMatch = ua.match(/OS (\d+)_/);
    if (iosMatch && parseInt(iosMatch[1]) < 12) {
      console.log('📱 Low-end detectado: iOS antigo');
      return true;
    }

    // 4. Connection speed (se disponível)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        if (['slow-2g', '2g'].includes(connection.effectiveType)) {
          console.log('📱 Low-end detectado: Conexão lenta');
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Verifica se modelos client-side já estão em cache
   */
  static async hasLocalModelsCache(): Promise<boolean> {
    try {
      // Verificar IndexedDB ou localStorage
      const cacheKey = 'nlp_models_cached';
      const cached = localStorage.getItem(cacheKey);
      return cached === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Marca modelos como cached
   */
  static markModelsAsCached(): void {
    try {
      localStorage.setItem('nlp_models_cached', 'true');
    } catch (error) {
      console.warn('Não foi possível marcar modelos como cached:', error);
    }
  }
}

/**
 * Estratégia de seleção NLP
 */
class NLPStrategySelector {
  
  /**
   * Decide se deve usar server-side ou client-side
   */
  static async shouldUseServerNLP(): Promise<boolean> {
    // 1. Verificar conexão
    if (!navigator.onLine) {
      console.log('🔄 Offline: usando client-side');
      return false;
    }

    // 2. Preferência do usuário (se configurada)
    const userPreference = localStorage.getItem('nlp_preference');
    if (userPreference === 'server') {
      console.log('⚙️ Preferência usuário: server-side');
      return true;
    }
    if (userPreference === 'client') {
      console.log('⚙️ Preferência usuário: client-side');
      return false;
    }

    // 3. Auto-detectar baseado em dispositivo
    const isLowEnd = DeviceDetector.isLowEndDevice();
    if (isLowEnd) {
      console.log('🎯 Auto: server-side (dispositivo low-end)');
      return true;
    }

    // 4. Verificar se modelos já estão em cache
    const hasCachedModels = await DeviceDetector.hasLocalModelsCache();
    if (!hasCachedModels) {
      console.log('🎯 Auto: server-side (primeira execução, evita download 330MB)');
      return true;
    }

    // 5. Default: client-side (privacy-first)
    console.log('🎯 Auto: client-side (dispositivo capaz + modelos cached)');
    return false;
  }

  /**
   * Permite usuário configurar preferência
   */
  static setUserPreference(preference: 'server' | 'client' | 'auto'): void {
    if (preference === 'auto') {
      localStorage.removeItem('nlp_preference');
    } else {
      localStorage.setItem('nlp_preference', preference);
    }
    console.log(`⚙️ Preferência NLP atualizada: ${preference}`);
  }

  /**
   * Retorna preferência atual
   */
  static getUserPreference(): 'server' | 'client' | 'auto' {
    const pref = localStorage.getItem('nlp_preference');
    if (pref === 'server' || pref === 'client') return pref;
    return 'auto';
  }
}

/**
 * Proxy Service principal
 */
class NLPServiceProxy {
  private functions = getFunctions();
  private nlpAnalyzeCallable: any = null;

  constructor() {
    // Conectar ao emulator se em desenvolvimento
    if (import.meta.env.DEV && window.location.hostname === 'localhost') {
      console.log('🔧 Conectando ao Functions Emulator');
      connectFunctionsEmulator(this.functions, 'localhost', 5001);
    }

    // Inicializar callable
    this.nlpAnalyzeCallable = httpsCallable(this.functions, 'nlpAnalyze');
  }

  /**
   * Análise server-side via Firebase Functions
   */
  private async analyzeServerSide(texts: string[]): Promise<NLPAnalysisResult[]> {
    console.log(`☁️ Usando NLP server-side para ${texts.length} textos`);
    
    try {
      const startTime = performance.now();
      
      const result = await this.nlpAnalyzeCallable({ texts });
      
      const elapsed = performance.now() - startTime;
      console.log(`⚡ Server-side completado em ${Math.round(elapsed)}ms`);
      
      return result.data.results;

    } catch (error: any) {
      console.error('❌ Erro no server-side NLP:', error);
      
      // Fallback para client-side em caso de erro
      console.log('🔄 Fallback: tentando client-side...');
      return this.analyzeClientSide(texts);
    }
  }

  /**
   * Análise client-side via browser
   */
  private async analyzeClientSide(texts: string[]): Promise<NLPAnalysisResult[]> {
    console.log(`💻 Usando NLP client-side para ${texts.length} textos`);
    
    try {
      const startTime = performance.now();
      
      const nlpService = await NLPSingleton.getInstance();
      const results = await nlpService.analyzeBatch(texts);
      
      const elapsed = performance.now() - startTime;
      console.log(`⚡ Client-side completado em ${Math.round(elapsed)}ms`);
      
      // Marcar modelos como cached para próximas vezes
      DeviceDetector.markModelsAsCached();
      
      return results;

    } catch (error) {
      console.error('❌ Erro no client-side NLP:', error);
      throw error;
    }
  }

  /**
   * Análise de batch (método principal)
   */
  async analyzeBatch(texts: string[]): Promise<NLPAnalysisResult[]> {
    if (texts.length === 0) return [];

    console.log(`🧠 NLP Proxy: processando ${texts.length} textos...`);

    // Decidir estratégia
    const useServer = await NLPStrategySelector.shouldUseServerNLP();

    if (useServer) {
      return this.analyzeServerSide(texts);
    } else {
      return this.analyzeClientSide(texts);
    }
  }

  /**
   * Análise de texto único
   */
  async analyzeText(text: string): Promise<NLPAnalysisResult> {
    const results = await this.analyzeBatch([text]);
    return results[0];
  }

  /**
   * Configuração de preferência do usuário
   */
  setPreference(preference: 'server' | 'client' | 'auto'): void {
    NLPStrategySelector.setUserPreference(preference);
  }

  /**
   * Retorna preferência atual
   */
  getPreference(): 'server' | 'client' | 'auto' {
    return NLPStrategySelector.getUserPreference();
  }

  /**
   * Retorna informações sobre capacidade do dispositivo
   */
  getDeviceInfo() {
    return {
      isLowEnd: DeviceDetector.isLowEndDevice(),
      memory: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      online: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }
}

// Singleton global
export const nlpServiceProxy = new NLPServiceProxy();

// Exportar também as classes para uso avançado
export { NLPStrategySelector, DeviceDetector };
