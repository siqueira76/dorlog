/**
 * Serviço de Análise NLP Client-Side para DorLog
 * 
 * Sistema isolado para processamento de linguagem natural
 * sem interferir nas funcionalidades existentes da aplicação.
 */

import { pipeline, env } from '@xenova/transformers';
import type { 
  TextClassificationPipeline,
  SummarizationPipeline,
  ZeroShotClassificationPipeline
} from '@xenova/transformers';

// Detecção de compatibilidade para GitHub Pages
interface EnvironmentConfig {
  name: string;
  allowRemoteModels: boolean;
  allowLocalModels: boolean;
  useBrowserCache: boolean;
  useWebGPU?: boolean;
}

// Detecção de ambiente para otimização
function detectEnvironment(): { isGitHubPages: boolean; isReplit: boolean; isLocal: boolean } {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  return {
    isGitHubPages: hostname.includes('github.io'),
    isReplit: hostname.includes('replit.dev') || hostname.includes('replit.co'),
    isLocal: hostname === 'localhost' || hostname === '127.0.0.1'
  };
}

// Configurações otimizadas por ambiente
function getEnvironmentConfig(envInfo: { isGitHubPages: boolean; isReplit: boolean; isLocal: boolean }): EnvironmentConfig {
  if (envInfo.isGitHubPages) {
    return {
      name: 'GitHub Pages',
      allowRemoteModels: true,  // Usar Hugging Face Hub (padrão)
      allowLocalModels: false,  // Não precisamos de modelos locais
      useBrowserCache: true,    // Cache otimizado para PWA
      useWebGPU: true          // Performance máxima
    };
  } else if (envInfo.isReplit) {
    return {
      name: 'Replit',
      allowRemoteModels: true,  // Usar Hugging Face Hub
      allowLocalModels: false,  // Evitar problemas de filesystem
      useBrowserCache: true,    // Habilitar cache para reduzir tempo de carregamento
      useWebGPU: false         // Compatibilidade primeiro
    };
  } else {
    return {
      name: 'Local/Outros',
      allowRemoteModels: true,
      allowLocalModels: false,
      useBrowserCache: true,
      useWebGPU: true
    };
  }
}

// Tipos para análise NLP
export interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TextSummary {
  summary: string;
  keyPhrases: string[];
  length: number;
}

export interface EmotionalState {
  primary: string;
  intensity: number;
  confidence: number;
}

export interface MedicalEntity {
  entity: string;
  type: 'SYMPTOM' | 'MEDICATION' | 'BODY_PART' | 'TIME' | 'EMOTION';
  confidence: number;
}

export interface NLPAnalysisResult {
  sentiment: SentimentResult;
  summary?: TextSummary;
  emotions: EmotionalState[];
  entities: MedicalEntity[];
  urgencyLevel: number; // 0-10
  clinicalRelevance: number; // 0-10
}

// 🚀 OTIMIZAÇÃO FASE 1: Cache persistente e logging inteligente
interface ModelCache {
  [key: string]: {
    model: any;
    timestamp: number;
    version: string;
  };
}

// Sistema de logging otimizado para NLP
let NLP_VERBOSE_LOGGING = false;
const nlpLog = (message: string, ...args: any[]) => {
  if (NLP_VERBOSE_LOGGING) {
    console.log(message, ...args);
  }
};

// Singleton para garantir uma única instância de NLP compartilhada
class NLPSingleton {
  private static instance: NLPAnalysisService | null = null;
  private static initPromise: Promise<NLPAnalysisService> | null = null;

  static async getInstance(): Promise<NLPAnalysisService> {
    if (this.instance) return this.instance;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.createInstance();
    this.instance = await this.initPromise;
    this.initPromise = null;
    
    return this.instance;
  }

  private static async createInstance(): Promise<NLPAnalysisService> {
    const service = new NLPAnalysisService();
    await service.initialize();
    return service;
  }

  static resetInstance(): void {
    this.instance = null;
    this.initPromise = null;
  }
}

/**
 * Função estática para acessar a instância singleton de NLP
 */
export const getNLPInstance = async (): Promise<NLPAnalysisService> => {
  return NLPSingleton.getInstance();
};

/**
 * Função para resetar a instância singleton (útil para testes)
 */
export const resetNLPInstance = (): void => {
  NLPSingleton.resetInstance();
};

/**
 * Classe principal para análise NLP com cache persistente otimizado
 */
export class NLPAnalysisService {
  private sentimentPipeline: TextClassificationPipeline | null = null;
  private summaryPipeline: SummarizationPipeline | null = null;
  private classificationPipeline: ZeroShotClassificationPipeline | null = null;
  private isLoading = false;
  private initialized = false;
  private environmentInfo = detectEnvironment();
  private environmentConfig: EnvironmentConfig;
  private modelCache: ModelCache = {};
  private static readonly CACHE_EXPIRY_HOURS = 24;
  private static readonly CACHE_VERSION = '2.0';
  
  constructor() {
    this.environmentConfig = getEnvironmentConfig(this.environmentInfo);
    this.configureEnvironment();
  }
  
  /**
   * Configura ambiente baseado na detecção (GitHub Pages, Replit, etc.)
   */
  private configureEnvironment(): void {
    const config = this.environmentConfig;
    
    console.log(`🌍 Ambiente detectado: ${config.name}`);
    console.log('🎯 Configuração otimizada:', {
      allowRemoteModels: config.allowRemoteModels,
      allowLocalModels: config.allowLocalModels,
      useBrowserCache: config.useBrowserCache
    });
    
    try {
      // Configurar transformers.js com configurações corretas
      if (env && typeof env === 'object') {
        (env as any).allowRemoteModels = config.allowRemoteModels;
        (env as any).allowLocalModels = config.allowLocalModels;
        (env as any).useBrowserCache = config.useBrowserCache;
        
        // GitHub Pages específico - não configurar remoteHost (usar padrão HF Hub)
        if (this.environmentInfo.isGitHubPages) {
          console.log('🚀 GitHub Pages: Usando Hugging Face Hub (padrão)');
          // Não configurar remoteHost - deixar padrão
        }
        
        console.log('✅ Transformers.js configurado para', config.name);
      }
    } catch (error) {
      console.warn('⚠️ Configuração de ambiente limitada, usando padrões');
    }
  }

  /**
   * Inicializa os modelos NLP (lazy loading) - versão otimizada
   */
  async initialize(): Promise<void> {
    if (this.initialized || this.isLoading) return;
    
    this.isLoading = true;
    console.log('⚡ Inicializando modelos NLP com CACHE OTIMIZADO...');

    try {
      // 🚀 OTIMIZAÇÃO: Tentar carregar do cache primeiro
      const cachedModel = this.getCachedModel('sentiment');
      if (cachedModel) {
        console.log('✅ Modelo de sentimento carregado do CACHE');
        this.sentimentPipeline = cachedModel.model;
        this.initialized = true;
        this.isLoading = false;
        return;
      }

      // Carregar do Hugging Face Hub se não estiver em cache
      nlpLog('📥 Carregando modelo de análise de sentimento...');
      
      const initPromise = this.initializeSentimentModel();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na inicialização (30s)')), 30000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      
      // 🚀 OTIMIZAÇÃO: Salvar no cache para uso futuro
      this.setCachedModel('sentiment', this.sentimentPipeline!);
      
      this.initialized = true;
      console.log('✅ Modelo de sentimento inicializado e CACHEADO com sucesso');
      nlpLog('ℹ️ Outros modelos serão carregados conforme necessário');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar modelo NLP:', error);
      console.error('📝 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : 'Stack não disponível'
      });
      
      // Não falhar completamente - usar fallback
      this.initialized = false;
      console.log('🔄 Usando modo fallback baseado em regras');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Inicializa apenas o modelo de sentimento
   */
  private async initializeSentimentModel(): Promise<void> {
    const modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    this.sentimentPipeline = await this.loadModelWithOptimization(
      'text-classification',
      modelName
    ) as TextClassificationPipeline;
  }
  
  /**
   * Carrega modelo usando configuração padrão (Hugging Face Hub)
   */
  private async loadModelWithOptimization(task: string, modelName: string, options?: any): Promise<any> {
    const config = this.environmentConfig;
    const timeout = config.name === 'GitHub Pages' ? 30000 : 20000; // Mais tempo para GitHub Pages
    
    console.log(`📥 Carregando modelo ${modelName} via Hugging Face Hub...`);
    
    try {
      // Usar configuração padrão - não sobrescrever URLs
      const modelPromise = pipeline(task as any, modelName, {
        ...options,
        // Para GitHub Pages, otimizar configurações
        ...(this.environmentInfo.isGitHubPages && {
          device: config.useWebGPU ? 'webgpu' : 'cpu',
          dtype: 'fp32' // Compatibilidade máxima
        })
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout carregamento (${timeout/1000}s)`)), timeout)
      );
      
      const model = await Promise.race([modelPromise, timeoutPromise]);
      
      console.log(`✅ Modelo ${modelName} carregado com sucesso`);
      return model;
      
    } catch (error) {
      console.error(`❌ Erro ao carregar modelo ${modelName}:`, error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  /**
   * Inicializa modelo de sumarização sob demanda
   */
  private async initializeSummaryModel(): Promise<void> {
    if (this.summaryPipeline) return;
    
    try {
      console.log('📥 Carregando modelo de sumarização...');
      this.summaryPipeline = await this.loadModelWithOptimization(
        'summarization',
        'Xenova/t5-small'
      ) as SummarizationPipeline;
    } catch (error) {
      console.error('❌ Erro ao carregar modelo de sumarização:', error);
      throw error;
    }
  }

  /**
   * Inicializa modelo de classificação sob demanda
   */
  private async initializeClassificationModel(): Promise<void> {
    if (this.classificationPipeline) return;
    
    try {
      console.log('📥 Carregando modelo de classificação...');
      this.classificationPipeline = await this.loadModelWithOptimization(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli'
      ) as ZeroShotClassificationPipeline;
    } catch (error) {
      console.error('❌ Erro ao carregar modelo de classificação:', error);
      throw error;
    }
  }

  /**
   * Analisa sentimento de um texto
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    await this.initialize();
    
    // Se modelo de IA não estiver disponível, usar fallback
    if (!this.sentimentPipeline) {
      console.log('🔄 Usando análise de sentimento baseada em regras');
      return this.analyzeSentimentFallback(text);
    }

    try {
      const result = await this.sentimentPipeline!(text) as any;
      const output = Array.isArray(result) ? result[0] : result;
      
      return {
        label: output.label as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
        score: output.score || 0.5,
        confidence: (output.score || 0.5) > 0.8 ? 'HIGH' : (output.score || 0.5) > 0.6 ? 'MEDIUM' : 'LOW'
      };
    } catch (error) {
      console.error('❌ Erro na análise de sentimento IA:', error);
      console.log('🔄 Fallback para análise baseada em regras');
      return this.analyzeSentimentFallback(text);
    }
  }

  /**
   * Análise de sentimento baseada em regras (fallback)
   */
  private analyzeSentimentFallback(text: string): SentimentResult {
    const textLower = text.toLowerCase();
    
    // Palavras positivas
    const positiveWords = ['bom', 'bem', 'melhor', 'otimo', 'ótimo', 'calmo', 'tranquilo', 'feliz', 'alegre', 'satisfeito', 'melhorou', 'aliviado'];
    const negativeWords = ['dor', 'mal', 'pior', 'terrível', 'insuportável', 'preocupado', 'ansioso', 'triste', 'deprimido', 'crise', 'ruim', 'péssimo'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (textLower.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (textLower.includes(word)) negativeScore++;
    });
    
    let label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    let score = 0.5;
    
    if (positiveScore > negativeScore) {
      label = 'POSITIVE';
      score = Math.min(0.9, 0.6 + (positiveScore * 0.1));
    } else if (negativeScore > positiveScore) {
      label = 'NEGATIVE';
      score = Math.min(0.9, 0.6 + (negativeScore * 0.1));
    }
    
    return {
      label,
      score,
      confidence: score > 0.8 ? 'HIGH' : score > 0.6 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Gera resumo de texto
   */
  async summarizeText(text: string, maxLength = 100): Promise<TextSummary> {
    // Verificar se o texto é longo o suficiente para sumarização
    if (text.length < 50) {
      return {
        summary: text,
        keyPhrases: this.extractKeyPhrases(text),
        length: text.length
      };
    }

    // Tentar carregar modelo de sumarização se ainda não foi carregado
    if (!this.summaryPipeline) {
      try {
        await this.initializeSummaryModel();
      } catch (error) {
        console.log('🔄 Modelo de sumarização não disponível, usando fallback');
        return this.summarizeTextFallback(text, maxLength);
      }
    }

    try {
      const result = await this.summaryPipeline!(text, {
        max_length: maxLength,
        min_length: 20,
        do_sample: false
      }) as any;

      const summaryText = Array.isArray(result) ? result[0]?.summary_text || result[0]?.generated_text : result?.summary_text || result?.generated_text;

      return {
        summary: summaryText,
        keyPhrases: this.extractKeyPhrases(text),
        length: summaryText.length
      };
    } catch (error) {
      console.error('❌ Erro na sumarização IA:', error);
      return this.summarizeTextFallback(text, maxLength);
    }
  }

  /**
   * Sumarização baseada em regras (fallback)
   */
  private summarizeTextFallback(text: string, maxLength: number): TextSummary {
    // Pegar as primeiras frases mais relevantes
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const medicalKeywords = ['dor', 'sintoma', 'medicamento', 'sono', 'humor', 'crise'];
    
    // Priorizar frases com palavras médicas
    const relevantSentences = sentences.filter(sentence => 
      medicalKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    const summaryText = relevantSentences.length > 0 
      ? relevantSentences.slice(0, 2).join('. ').substring(0, maxLength) + '...'
      : text.substring(0, maxLength) + '...';
    
    return {
      summary: summaryText,
      keyPhrases: this.extractKeyPhrases(text),
      length: summaryText.length
    };
  }

  /**
   * Classifica entidades médicas no texto
   */
  async extractMedicalEntities(text: string): Promise<MedicalEntity[]> {
    // Tentar carregar modelo de classificação se ainda não foi carregado
    if (!this.classificationPipeline) {
      try {
        await this.initializeClassificationModel();
      } catch (error) {
        console.log('🔄 Modelo de classificação não disponível, usando fallback');
        return this.extractMedicalEntitiesFallback(text);
      }
    }

    const medicalLabels = [
      'sintoma médico',
      'medicamento',
      'parte do corpo',
      'tempo de duração',
      'estado emocional',
      'dor',
      'tratamento'
    ];

    try {
      const result = await this.classificationPipeline!(text, medicalLabels) as any;
      const resultData = Array.isArray(result) ? result[0] : result;
      
      const entities: MedicalEntity[] = (resultData.labels || []).map((label: string, index: number) => {
        const score = (resultData.scores || [])[index] || 0.5;
        
        let entityType: MedicalEntity['type'] = 'EMOTION';
        if (label.includes('sintoma')) entityType = 'SYMPTOM';
        else if (label.includes('medicamento')) entityType = 'MEDICATION';
        else if (label.includes('corpo')) entityType = 'BODY_PART';
        else if (label.includes('tempo')) entityType = 'TIME';

        return {
          entity: label,
          type: entityType,
          confidence: score
        };
      }).filter((entity: MedicalEntity) => entity.confidence > 0.3);

      return entities;
    } catch (error) {
      console.error('❌ Erro na extração de entidades IA:', error);
      return this.extractMedicalEntitiesFallback(text);
    }
  }

  /**
   * Extração de entidades baseada em regras (fallback)
   */
  private extractMedicalEntitiesFallback(text: string): MedicalEntity[] {
    const textLower = text.toLowerCase();
    const entities: MedicalEntity[] = [];
    
    // Dicionários de palavras por categoria
    const entityDict = {
      symptoms: ['dor', 'crise', 'ansiedade', 'depressão', 'cansaço', 'mal-estar', 'náusea', 'tontura'],
      bodyParts: ['cabeça', 'pescoço', 'costas', 'braço', 'perna', 'estômago', 'peito', 'olhos'],
      medications: ['remédio', 'medicamento', 'dipirona', 'paracetamol', 'ibuprofeno', 'antidepressivo'],
      timeWords: ['minutos', 'horas', 'dias', 'semana', 'mês', 'hoje', 'ontem', 'sempre'],
      emotions: ['triste', 'feliz', 'preocupado', 'calmo', 'irritado', 'ansioso', 'deprimido']
    };
    
    // Detectar entidades por palavra-chave
    Object.entries(entityDict).forEach(([category, words]) => {
      words.forEach(word => {
        if (textLower.includes(word)) {
          let type: MedicalEntity['type'] = 'EMOTION';
          switch(category) {
            case 'symptoms': type = 'SYMPTOM'; break;
            case 'bodyParts': type = 'BODY_PART'; break;
            case 'medications': type = 'MEDICATION'; break;
            case 'timeWords': type = 'TIME'; break;
            case 'emotions': type = 'EMOTION'; break;
          }
          
          entities.push({
            entity: word,
            type,
            confidence: 0.7 // Confiança média para detecção por regras
          });
        }
      });
    });
    
    // Remover duplicatas
    const uniqueEntities = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.entity === entity.entity && e.type === entity.type)
    );
    
    return uniqueEntities.slice(0, 5); // Limitar a 5 entidades
  }

  /**
   * Detecta nível de urgência no texto
   */
  detectUrgencyLevel(text: string): number {
    const urgencyKeywords = {
      critical: ['insuportável', 'desesperado', 'socorro', 'emergência', 'não aguento'],
      high: ['muito forte', 'muito ruim', 'piorou muito', 'preocupado', 'assustado'],
      medium: ['desconfortável', 'ruim', 'incomoda', 'atrapalha'],
      low: ['leve', 'suportável', 'tolerável', 'melhor']
    };

    const normalizedText = text.toLowerCase();
    
    let urgencyScore = 0;
    
    urgencyKeywords.critical.forEach(keyword => {
      if (normalizedText.includes(keyword)) urgencyScore += 3;
    });
    
    urgencyKeywords.high.forEach(keyword => {
      if (normalizedText.includes(keyword)) urgencyScore += 2;
    });
    
    urgencyKeywords.medium.forEach(keyword => {
      if (normalizedText.includes(keyword)) urgencyScore += 1;
    });
    
    urgencyKeywords.low.forEach(keyword => {
      if (normalizedText.includes(keyword)) urgencyScore -= 1;
    });

    // Normalizar para escala 0-10
    return Math.max(0, Math.min(10, urgencyScore));
  }

  /**
   * Avalia relevância clínica do texto
   */
  assessClinicalRelevance(text: string): number {
    const clinicalKeywords = {
      high: ['dor', 'sintoma', 'medicamento', 'médico', 'hospital', 'tratamento', 'crise'],
      medium: ['desconforto', 'mal-estar', 'cansaço', 'stress', 'ansiedade'],
      low: ['normal', 'bem', 'rotina', 'trabalho']
    };

    const normalizedText = text.toLowerCase();
    let relevanceScore = 0;
    
    clinicalKeywords.high.forEach(keyword => {
      if (normalizedText.includes(keyword)) relevanceScore += 2;
    });
    
    clinicalKeywords.medium.forEach(keyword => {
      if (normalizedText.includes(keyword)) relevanceScore += 1;
    });
    
    clinicalKeywords.low.forEach(keyword => {
      if (normalizedText.includes(keyword)) relevanceScore -= 0.5;
    });

    // Normalizar para escala 0-10
    return Math.max(0, Math.min(10, relevanceScore));
  }

  /**
   * Extrai frases-chave do texto (implementação simples)
   */
  private extractKeyPhrases(text: string): string[] {
    // Implementação básica - pode ser melhorada com NLP mais avançado
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    // Retornar frases mais relevantes baseadas em palavras-chave médicas
    const medicalKeywords = ['dor', 'sintoma', 'medicamento', 'sono', 'humor', 'crise'];
    const relevantSentences = sentences.filter(sentence => 
      medicalKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );

    return relevantSentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Processamento em paralelo de múltiplos textos (NOVO - BATCH PROCESSING)
   */
  async analyzeBatch(texts: string[]): Promise<NLPAnalysisResult[]> {
    if (texts.length === 0) return [];
    
    nlpLog(`🚀 Processando ${texts.length} textos em batches...`);
    
    // Processar em batches de 5 textos para otimização
    const BATCH_SIZE = 5;
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }
    
    // Processar batches em paralelo
    const batchPromises = batches.map(batch => 
      Promise.all(batch.map(text => this.analyzeText(text)))
    );
    
    const startTime = Date.now();
    const results = await Promise.all(batchPromises);
    const endTime = Date.now();
    
    const flatResults = results.flat();
    nlpLog(`⚡ PERFORMANCE: Lote de ${texts.length} textos processado em ${endTime - startTime}ms (${Math.round((endTime - startTime) / texts.length)}ms/texto)`);
    
    return flatResults;
  }

  /**
   * Garantir que modelo de sumarização esteja carregado sob demanda
   */
  private async ensureSummaryModel(): Promise<void> {
    if (!this.summaryPipeline) {
      await this.initializeSummaryModel();
    }
  }

  /**
   * Garantir que modelo de classificação esteja carregado sob demanda
   */
  private async ensureClassificationModel(): Promise<void> {
    if (!this.classificationPipeline) {
      await this.initializeClassificationModel();
    }
  }

  /**
   * Análise completa de um texto
   */
  async analyzeText(text: string): Promise<NLPAnalysisResult> {
    if (!text || text.trim().length < 3) {
      throw new Error('Texto muito curto para análise');
    }

    console.log('🧠 Iniciando análise NLP do texto...');

    try {
      // Executar análises sequencialmente para reduzir carga
      console.log('🔍 Analisando sentimento...');
      const sentiment = await this.analyzeSentiment(text);
      
      console.log('🏥 Extraindo entidades médicas...');
      const entities = await this.extractMedicalEntities(text);

      // Análises síncronas (baseadas em regras)
      console.log('⚡ Calculando urgência e relevância...');
      const urgencyLevel = this.detectUrgencyLevel(text);
      const clinicalRelevance = this.assessClinicalRelevance(text);

      // Gerar resumo se o texto for longo
      let summary: TextSummary | undefined;
      if (text.length > 100) {
        console.log('📝 Gerando resumo...');
        summary = await this.summarizeText(text);
      }

      // Mapear estado emocional baseado no sentimento
      const emotions: EmotionalState[] = [{
        primary: sentiment.label === 'POSITIVE' ? 'calmo' : 
                sentiment.label === 'NEGATIVE' ? 'preocupado' : 'neutro',
        intensity: sentiment.score * 10,
        confidence: sentiment.score
      }];

      const result: NLPAnalysisResult = {
        sentiment,
        summary,
        emotions,
        entities,
        urgencyLevel,
        clinicalRelevance
      };

      console.log('✅ Análise NLP concluída:', {
        sentiment: sentiment.label,
        entitiesFound: entities.length,
        urgency: urgencyLevel,
        clinical: clinicalRelevance
      });
      return result;

    } catch (error) {
      console.error('❌ Erro na análise NLP:', error);
      console.error('📝 Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Retornar resultado básico em caso de erro total
      return {
        sentiment: { label: 'NEUTRAL', score: 0.5, confidence: 'LOW' },
        emotions: [{ primary: 'neutro', intensity: 5, confidence: 0.5 }],
        entities: [],
        urgencyLevel: 5,
        clinicalRelevance: 5
      };
    }
  }

  /**
   * Verifica se os modelos estão carregados
   */
  isReady(): boolean {
    return this.initialized && !this.isLoading;
  }

  /**
   * Retorna status detalhado dos modelos com informações de ambiente
   */
  getModelStatus(): { 
    sentiment: boolean; 
    summary: boolean; 
    classification: boolean; 
    fallbackMode: boolean;
    remoteSource: string;
    environment: string;
    configuration: EnvironmentConfig;
  } {
    return {
      sentiment: !!this.sentimentPipeline,
      summary: !!this.summaryPipeline,
      classification: !!this.classificationPipeline,
      fallbackMode: !this.initialized,
      remoteSource: 'Hugging Face Hub',
      environment: this.environmentConfig.name,
      configuration: this.environmentConfig
    };
  }
  
  /**
   * Verifica conectividade com Hugging Face Hub
   */
  private async checkRemoteConnectivity(): Promise<{ source: string; available: boolean; responseTime: number }> {
    const startTime = Date.now();
    try {
      // Teste simples de conectividade com HF Hub
      const testUrl = 'https://huggingface.co/api/models/Xenova/distilbert-base-uncased-finetuned-sst-2-english';
      const response = await fetch(testUrl, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        source: 'Hugging Face Hub',
        available: response.ok,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        source: 'Hugging Face Hub',
        available: false,
        responseTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Diagnóstico completo do sistema NLP
   */
  async getDiagnosticInfo(): Promise<{
    status: string;
    models: { sentiment: boolean; summary: boolean; classification: boolean };
    remote: { source: string; connectivity: boolean; responseTime: number };
    environment: { type: string; hostname: string; config: EnvironmentConfig };
    performance: { initTime: number | null; lastError: string | null };
    recommendations: string[];
  }> {
    const modelStatus = this.getModelStatus();
    const connectivity = await this.checkRemoteConnectivity();
    const recommendations: string[] = [];
    
    // Gerar recomendações baseadas no status
    if (modelStatus.fallbackMode) {
      recommendations.push('Modelos IA indisponíveis - usando análise baseada em regras');
    }
    
    if (!connectivity.available) {
      recommendations.push('Verificar conectividade com Hugging Face Hub');
      recommendations.push('Tentar recarregar a página');
    }
    
    if (modelStatus.environment === 'Replit') {
      recommendations.push('Para produção, considere deploy no GitHub Pages para melhor performance');
    }
    
    if (modelStatus.environment === 'GitHub Pages' && !connectivity.available) {
      recommendations.push('Verificar CORS e conectividade externa');
    }
    
    return {
      status: this.isReady() ? 'Pronto' : this.isLoading ? 'Carregando' : 'Fallback',
      models: {
        sentiment: modelStatus.sentiment,
        summary: modelStatus.summary,
        classification: modelStatus.classification
      },
      remote: {
        source: connectivity.source,
        connectivity: connectivity.available,
        responseTime: connectivity.responseTime
      },
      environment: {
        type: modelStatus.environment,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        config: this.environmentConfig
      },
      performance: {
        initTime: null,
        lastError: null
      },
      recommendations
    };
  }

  /**
   * Força reinicialização com limpeza de cache
   */
  async reinitializeWithCacheClear(): Promise<boolean> {
    console.log('🔄 Reinicializando com limpeza de cache...');
    
    // Limpar modelos atuais
    this.dispose();
    
    // Limpar cache do browser se possível
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ Cache do browser limpo');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível limpar cache do browser');
    }
    
    // Reconfigurar ambiente
    this.configureEnvironment();
    
    // Tentar reinicializar
    try {
      await this.initialize();
      return this.isReady();
    } catch (error) {
      console.error('❌ Falha ao reinicializar:', error);
      return false;
    }
  }
  
  /**
   * Testa conectividade com Hugging Face Hub
   */
  async testRemoteConnectivity(): Promise<{ source: string; available: boolean; responseTime: number; details: string }> {
    console.log('📋 Testando conectividade com Hugging Face Hub...');
    
    const result = await this.checkRemoteConnectivity();
    
    const details = result.available 
      ? `Conectividade OK (${result.responseTime}ms)`
      : `Falha na conectividade (${result.responseTime}ms)`;
    
    console.log('📋 Resultado do teste:', { ...result, details });
    
    return {
      ...result,
      details
    };
  }
  
  /**
   * Libera recursos dos modelos (para economia de memória)
   */
  /**
   * 🚀 OTIMIZAÇÃO: Recupera modelo do cache local
   */
  private getCachedModel(modelType: string): { model: any; timestamp: number; version: string } | null {
    try {
      const cacheKey = `nlp_model_${modelType}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const parsed = JSON.parse(cachedData);
      const hoursSinceCache = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
      
      // Verificar expiração e versão
      if (hoursSinceCache > NLPAnalysisService.CACHE_EXPIRY_HOURS || 
          parsed.version !== NLPAnalysisService.CACHE_VERSION) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      nlpLog(`⚡ Cache hit: ${modelType} (${hoursSinceCache.toFixed(1)}h atrás)`);
      return parsed;
      
    } catch (error) {
      nlpLog(`❌ Erro ao recuperar cache: ${error}`);
      return null;
    }
  }

  /**
   * 🚀 OTIMIZAÇÃO: Salva modelo no cache local
   */
  private setCachedModel(modelType: string, model: any): void {
    try {
      const cacheKey = `nlp_model_${modelType}`;
      const cacheData = {
        model,
        timestamp: Date.now(),
        version: NLPAnalysisService.CACHE_VERSION
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      nlpLog(`⚡ Modelo ${modelType} salvo no cache`);
      
    } catch (error) {
      nlpLog(`❌ Erro ao salvar cache: ${error}`);
    }
  }

  dispose(): void {
    this.sentimentPipeline = null;
    this.summaryPipeline = null;
    this.classificationPipeline = null;
    this.initialized = false;
    this.isLoading = false;
    console.log('🗑️ Modelos NLP liberados da memória');
  }
}

// Instância singleton para reutilização
export const nlpService = new NLPAnalysisService();