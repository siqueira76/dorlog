/**
 * Serviço de Análise NLP Server-Side para FibroDiário
 * 
 * Roda modelos @xenova/transformers no servidor (Cloud Run via Firebase Functions)
 * para melhor performance em dispositivos low-end.
 */

import { pipeline } from '@xenova/transformers';
import type { 
  TextClassificationPipeline,
  SummarizationPipeline,
  ZeroShotClassificationPipeline
} from '@xenova/transformers';

// Tipos compatíveis com o cliente
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

/**
 * Singleton NLP Service para Firebase Functions
 */
class ServerNLPService {
  private sentimentPipeline: TextClassificationPipeline | null = null;
  private summaryPipeline: SummarizationPipeline | null = null;
  private classificationPipeline: ZeroShotClassificationPipeline | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Inicializa modelos NLP (lazy loading)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    console.log('🧠 Inicializando modelos NLP server-side...');
    const startTime = Date.now();

    try {
      // Modelo de sentimento (prioritário)
      console.log('📥 Carregando DistilBERT-SST-2 (sentiment)...');
      this.sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      ) as TextClassificationPipeline;
      console.log('✅ Sentiment model carregado');

      this.isInitialized = true;
      const elapsed = Date.now() - startTime;
      console.log(`⚡ NLP inicializado em ${elapsed}ms`);

    } catch (error) {
      console.error('❌ Erro ao inicializar NLP:', error);
      this.isInitialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Inicializa modelo de sumarização sob demanda
   */
  private async initializeSummaryModel(): Promise<void> {
    if (this.summaryPipeline) return;

    try {
      console.log('📥 Carregando T5-Small (summarization)...');
      this.summaryPipeline = await pipeline(
        'summarization',
        'Xenova/t5-small'
      ) as SummarizationPipeline;
      console.log('✅ Summary model carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar summary model:', error);
      throw error;
    }
  }

  /**
   * Inicializa modelo de classificação sob demanda
   */
  private async initializeClassificationModel(): Promise<void> {
    if (this.classificationPipeline) return;

    try {
      console.log('📥 Carregando DistilBERT-MNLI (classification)...');
      this.classificationPipeline = await pipeline(
        'zero-shot-classification',
        'Xenova/distilbert-base-uncased-mnli'
      ) as ZeroShotClassificationPipeline;
      console.log('✅ Classification model carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar classification model:', error);
      throw error;
    }
  }

  /**
   * Analisa sentimento de um texto
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    await this.initialize();

    if (!this.sentimentPipeline) {
      return this.analyzeSentimentFallback(text);
    }

    try {
      const result = await this.sentimentPipeline(text) as any;
      const output = Array.isArray(result) ? result[0] : result;

      return {
        label: output.label as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
        score: output.score || 0.5,
        confidence: (output.score || 0.5) > 0.8 ? 'HIGH' : (output.score || 0.5) > 0.6 ? 'MEDIUM' : 'LOW'
      };
    } catch (error) {
      console.error('❌ Erro na análise de sentimento:', error);
      return this.analyzeSentimentFallback(text);
    }
  }

  /**
   * Fallback baseado em regras para sentimento
   */
  private analyzeSentimentFallback(text: string): SentimentResult {
    const textLower = text.toLowerCase();
    
    const positiveWords = ['bem', 'ótimo', 'bom', 'melhor', 'feliz', 'alegre', 'calmo'];
    const negativeWords = ['dor', 'mal', 'ruim', 'pior', 'terrível', 'horrível', 'crise', 'sofrendo'];
    
    let score = 0.5;
    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 0.1;
    });
    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 0.15;
    });
    
    score = Math.max(0, Math.min(1, score));
    
    return {
      label: score > 0.6 ? 'POSITIVE' : score < 0.4 ? 'NEGATIVE' : 'NEUTRAL',
      score,
      confidence: 'MEDIUM'
    };
  }

  /**
   * Sumariza texto
   */
  async summarizeText(text: string): Promise<TextSummary> {
    if (text.length < 100) {
      return {
        summary: text,
        keyPhrases: [],
        length: text.length
      };
    }

    try {
      await this.initializeSummaryModel();

      if (this.summaryPipeline) {
        const result = await this.summaryPipeline(text, {
          max_length: 100,
          min_length: 30
        }) as any;

        const summaryText = Array.isArray(result) ? result[0].summary_text : result.summary_text;

        return {
          summary: summaryText,
          keyPhrases: this.extractKeyPhrases(text),
          length: summaryText.length
        };
      }
    } catch (error) {
      console.error('❌ Erro na sumarização:', error);
    }

    // Fallback: primeiras 100 palavras
    const words = text.split(/\s+/).slice(0, 100);
    return {
      summary: words.join(' ') + '...',
      keyPhrases: this.extractKeyPhrases(text),
      length: words.join(' ').length
    };
  }

  /**
   * Extrai frases-chave (fallback)
   */
  private extractKeyPhrases(text: string): string[] {
    const medicalTerms = [
      'dor', 'crise', 'fibromialgia', 'medicamento', 'médico',
      'tratamento', 'sintoma', 'fadiga', 'sono', 'ansiedade'
    ];

    const textLower = text.toLowerCase();
    return medicalTerms.filter(term => textLower.includes(term));
  }

  /**
   * Extrai entidades médicas
   */
  async extractMedicalEntities(text: string): Promise<MedicalEntity[]> {
    try {
      await this.initializeClassificationModel();

      if (this.classificationPipeline) {
        const medicalLabels = [
          'sintoma médico',
          'medicamento',
          'parte do corpo',
          'estado emocional',
          'dor'
        ];

        const result = await this.classificationPipeline(text, medicalLabels) as any;
        const resultData = Array.isArray(result) ? result[0] : result;

        const entities: MedicalEntity[] = (resultData.labels || []).map((label: string, index: number) => {
          const score = (resultData.scores || [])[index] || 0.5;

          let entityType: MedicalEntity['type'] = 'EMOTION';
          if (label.includes('sintoma')) entityType = 'SYMPTOM';
          else if (label.includes('medicamento')) entityType = 'MEDICATION';
          else if (label.includes('corpo')) entityType = 'BODY_PART';

          return {
            entity: label,
            type: entityType,
            confidence: score
          };
        }).filter((entity: MedicalEntity) => entity.confidence > 0.3);

        return entities;
      }
    } catch (error) {
      console.error('❌ Erro na extração de entidades:', error);
    }

    return this.extractMedicalEntitiesFallback(text);
  }

  /**
   * Fallback para extração de entidades
   */
  private extractMedicalEntitiesFallback(text: string): MedicalEntity[] {
    const textLower = text.toLowerCase();
    const entities: MedicalEntity[] = [];

    const symptoms = ['dor', 'fadiga', 'cansaço', 'insônia', 'ansiedade', 'depressão'];
    const bodyParts = ['cabeça', 'costas', 'pernas', 'braços', 'pescoço', 'ombros'];
    const emotions = ['triste', 'ansioso', 'irritado', 'calmo', 'feliz', 'depressivo'];

    symptoms.forEach(symptom => {
      if (textLower.includes(symptom)) {
        entities.push({ entity: symptom, type: 'SYMPTOM', confidence: 0.7 });
      }
    });

    bodyParts.forEach(part => {
      if (textLower.includes(part)) {
        entities.push({ entity: part, type: 'BODY_PART', confidence: 0.7 });
      }
    });

    emotions.forEach(emotion => {
      if (textLower.includes(emotion)) {
        entities.push({ entity: emotion, type: 'EMOTION', confidence: 0.7 });
      }
    });

    return entities;
  }

  /**
   * Detecta nível de urgência (0-10)
   */
  detectUrgencyLevel(text: string): number {
    const textLower = text.toLowerCase();
    
    const criticalWords = ['emergência', 'urgente', 'terrível', 'insuportável', 'hospital', 'ajuda'];
    const highWords = ['grave', 'forte', 'intenso', 'muito', 'demais'];
    
    let urgency = 3; // Base
    
    criticalWords.forEach(word => {
      if (textLower.includes(word)) urgency += 2;
    });
    
    highWords.forEach(word => {
      if (textLower.includes(word)) urgency += 1;
    });
    
    // Números de dor
    const painMatch = text.match(/\b([8-9]|10)\b/);
    if (painMatch) urgency += 2;
    
    return Math.min(10, urgency);
  }

  /**
   * Avalia relevância clínica (0-10)
   */
  assessClinicalRelevance(text: string): number {
    const textLower = text.toLowerCase();
    
    const clinicalTerms = [
      'médico', 'tratamento', 'medicamento', 'diagnóstico',
      'sintoma', 'exame', 'consulta', 'prescrição'
    ];
    
    let relevance = 2; // Base
    
    clinicalTerms.forEach(term => {
      if (textLower.includes(term)) relevance += 1.5;
    });
    
    if (text.length > 100) relevance += 1;
    if (text.length > 200) relevance += 1;
    
    return Math.min(10, relevance);
  }

  /**
   * Análise completa de texto
   */
  async analyzeText(text: string): Promise<NLPAnalysisResult> {
    console.log(`🔍 Analisando texto (${text.length} chars)...`);
    
    const [sentiment, summary, entities] = await Promise.all([
      this.analyzeSentiment(text),
      text.length > 50 ? this.summarizeText(text) : Promise.resolve(undefined),
      this.extractMedicalEntities(text)
    ]);

    const urgencyLevel = this.detectUrgencyLevel(text);
    const clinicalRelevance = this.assessClinicalRelevance(text);

    // Mapear entidades para emoções
    const emotions: EmotionalState[] = entities
      .filter(e => e.type === 'EMOTION')
      .map(e => ({
        primary: e.entity,
        intensity: e.confidence * 10,
        confidence: e.confidence
      }));

    return {
      sentiment,
      summary,
      emotions,
      entities,
      urgencyLevel,
      clinicalRelevance
    };
  }

  /**
   * Análise em batch
   */
  async analyzeBatch(texts: string[]): Promise<NLPAnalysisResult[]> {
    console.log(`🚀 Processando batch de ${texts.length} textos...`);
    
    const startTime = Date.now();
    
    // Processar em paralelo (até 5 simultâneos)
    const BATCH_SIZE = 5;
    const results: NLPAnalysisResult[] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(text => this.analyzeText(text))
      );
      results.push(...batchResults);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`⚡ Batch processado em ${elapsed}ms (${Math.round(elapsed / texts.length)}ms/texto)`);
    
    return results;
  }
}

// Singleton global
const nlpService = new ServerNLPService();

export { nlpService };
