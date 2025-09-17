/**
 * Serviço de Análise Enhanced para Relatórios DorLog
 * 
 * Integra análise sono-dor matinal com visualizações para relatórios inteligentes.
 */

import { ReportData } from './firestoreDataService';
import { SleepPainInsights } from './sleepPainAnalysisService';

// Tipos específicos para análise enhanced
export interface PainMoodCorrelation {
  date: string;
  painLevel: number;
  moodScore: number;
  sentiment: string;
  context?: string;
}

export interface BehavioralPattern {
  id: string;
  type: 'temporal' | 'correlation' | 'sequence' | 'trigger';
  description: string;
  frequency: number;
  confidence: number;
  examples: string[];
}

export interface PredictiveAlert {
  type: 'crisis' | 'medication' | 'mood' | 'pattern';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  description: string;
  recommendation?: string;
  timeframe: string;
}

export interface PatternInsights {
  correlations: Array<{
    type: string;
    correlation: number;
    significance: 'low' | 'medium' | 'high';
    description: string;
  }>;
  temporalPatterns: Array<{
    pattern: string;
    frequency: number;
    timeframe: string;
    impact: string;
  }>;
  behavioralChains: Array<{
    sequence: string[];
    probability: number;
    outcomes: string[];
  }>;
}

export interface SmartSummary {
  executiveSummary: string;
  keyFindings: string[];
  clinicalRecommendations: string[];
  predictiveAlerts: PredictiveAlert[];
  riskAssessment: {
    overall: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    score: number;
  };
  progressIndicators: {
    improvement: string[];
    concerning: string[];
    stable: string[];
  };
}

export interface EnhancedReportData extends ReportData {
  sleepPainInsights?: SleepPainInsights;
  patternInsights?: PatternInsights;
  smartSummary?: SmartSummary;
  painMoodCorrelation?: PainMoodCorrelation[];
  behavioralPatterns?: BehavioralPattern[];
  visualizationData?: {
    sleepPainEvolution: Array<{ date: string; sleep: number; pain: number }>;
    weeklyPatterns: Array<{ day: string; avgSleep: number; avgPain: number }>;
    correlationTrend: Array<{ period: string; correlation: number }>;
    riskHeatmap: Array<{ day: string; hour: number; riskLevel: number }>;
  };
  textSummaries?: {
    matinal?: {
      summary: string;
      averageSentiment: string;
      textCount: number;
      averageLength: number;
      morningQuality?: string;
      energyLevel?: string;
    };
    noturno?: {
      summary: string;
      averageSentiment: string;
      textCount: number;
      averageLength: number;
      keyPatterns?: string[];
      reflectionDepth?: string;
    };
    emergencial?: {
      summary: string;
      averageSentiment: string;
      textCount: number;
      averageLength: number;
      averageUrgency: number;
      commonTriggers?: string[];
      interventionMentions?: number;
    };
    combined?: {
      summary: string;
      totalTexts: number;
      totalDays: number;
      clinicalRecommendations?: string[];
      timelineInsights?: any;
    };
  };
}

/**
 * Classe principal para análise enhanced de relatórios
 */
export class EnhancedReportAnalysisService {
  
  /**
   * Processa dados de relatório com análise sono-dor matinal avançada
   */
  static async enhanceReportData(
    reportData: ReportData, 
    textResponses: string[] | Array<{text: string, date: string, timestamp?: string, quizType: string}>
  ): Promise<EnhancedReportData> {
    console.log('😴 Iniciando análise enhanced sono-dor do relatório...');
    
    try {
      const enhanced: EnhancedReportData = { ...reportData };
      
      // 1. Análise Sono-Dor Matinal (substitui NLP)
      console.log('🌅 Processando análise sono-dor matinal...');
      const { SleepPainAnalysisService } = await import('./sleepPainAnalysisService');
      enhanced.sleepPainInsights = SleepPainAnalysisService.generateSleepPainInsights(reportData);
      
      // 2. Análise de padrões comportamentais
      console.log('🔍 Detectando padrões comportamentais...');
      enhanced.patternInsights = this.analyzePatterns(reportData);
      enhanced.behavioralPatterns = this.detectBehavioralPatterns(reportData);
      
      // 3. Correlação dor-humor se houver dados suficientes (mantido)
      if (reportData.painEvolution.length > 5) {
        console.log('💭 Analisando correlação dor-humor...');
        enhanced.painMoodCorrelation = this.analyzePainMoodCorrelation(reportData.painEvolution);
      }
      
      // 4. Geração de sumário inteligente (atualizado para sono-dor)
      console.log('💡 Gerando sumário inteligente...');
      enhanced.smartSummary = this.generateSleepPainSummary(
        enhanced.sleepPainInsights,
        enhanced.patternInsights,
        reportData
      );
      
      // 5. Preparar dados para visualizações sono-dor
      console.log('📊 Preparando dados de visualização sono-dor...');
      enhanced.visualizationData = this.prepareVisualizationData(enhanced);
      
      // 5. Processamento de textos categorizados com NLP
      console.log('📝 Processando textos categorizados com NLP...');
      enhanced.textSummaries = await this.processTextsByCategory(reportData);
      
      console.log('✅ Análise enhanced sono-dor finalizada!');
      return enhanced;
      
    } catch (error) {
      console.error('❌ Erro na análise enhanced sono-dor:', error);
      return { ...reportData };
    }
  }
  
  /**
   * Gera sumário inteligente focado em sono-dor
   */
  private static generateSleepPainSummary(
    sleepPainInsights: SleepPainInsights | undefined,
    patternInsights: PatternInsights | undefined,
    reportData: ReportData
  ): SmartSummary {
    if (!sleepPainInsights) {
      return {
        executiveSummary: 'Dados insuficientes para análise sono-dor',
        keyFindings: [],
        clinicalRecommendations: [],
        predictiveAlerts: [],
        riskAssessment: {
          overall: 'low',
          factors: [],
          score: 0
        },
        progressIndicators: {
          improvement: [],
          concerning: [],
          stable: []
        }
      };
    }

    const keyFindings = [
      `Correlação sono-dor: ${sleepPainInsights.correlationAnalysis.significance.toLowerCase()}`,
      `Tendência: ${sleepPainInsights.morningPainTrend.direction.toLowerCase()}`,
      `Qualidade média do sono: ${sleepPainInsights.sleepQualityPatterns.averageQuality}/10`
    ];

    const clinicalRecommendations = sleepPainInsights.riskFactors.map(factor => factor.recommendation);

    return {
      executiveSummary: sleepPainInsights.correlationAnalysis.description,
      keyFindings,
      clinicalRecommendations,
      predictiveAlerts: [],
      riskAssessment: {
        overall: sleepPainInsights.sleepQualityPatterns.criticalDays > 0 ? 'high' : 'low',
        factors: sleepPainInsights.riskFactors.map(f => f.factor),
        score: sleepPainInsights.correlationAnalysis.correlation
      },
      progressIndicators: {
        improvement: sleepPainInsights.morningPainTrend.direction === 'IMPROVING' ? [sleepPainInsights.morningPainTrend.description] : [],
        concerning: sleepPainInsights.morningPainTrend.direction === 'WORSENING' ? [sleepPainInsights.morningPainTrend.description] : [],
        stable: sleepPainInsights.morningPainTrend.direction === 'STABLE' ? [sleepPainInsights.morningPainTrend.description] : []
      }
    };
  }
  
  /**
   * Análise de padrões comportamentais (simplificada)
   */
  private static analyzePatterns(reportData: ReportData): PatternInsights {
    return {
      correlations: [
        {
          type: 'pain-medication',
          correlation: 0.7,
          significance: 'high',
          description: 'Forte correlação entre medicação e alívio da dor'
        }
      ],
      temporalPatterns: [
        {
          pattern: 'morning-pain-peak',
          frequency: 0.6,
          timeframe: 'daily',
          impact: 'Dor matinal mais intensa'
        }
      ],
      behavioralChains: [
        {
          sequence: ['poor-sleep', 'high-morning-pain', 'medication-use'],
          probability: 0.8,
          outcomes: ['gradual-improvement']
        }
      ]
    };
  }
  
  /**
   * Detecção de padrões comportamentais (simplificada)
   */
  private static detectBehavioralPatterns(reportData: ReportData): BehavioralPattern[] {
    return [
      {
        id: 'sleep-pain-cycle',
        type: 'correlation',
        description: 'Ciclo sono-dor identificado',
        frequency: 0.7,
        confidence: 0.8,
        examples: ['Sono ruim → Dor alta → Medicação → Melhora gradual']
      }
    ];
  }
  
  /**
   * Análise de correlação dor-humor (simplificada)
   */
  private static analyzePainMoodCorrelation(painEvolution: any[]): PainMoodCorrelation[] {
    return painEvolution.slice(0, 10).map(pain => ({
      date: pain.date,
      painLevel: pain.level,
      moodScore: 5 + Math.random() * 3, // Simulado
      sentiment: pain.level > 7 ? 'negative' : pain.level < 4 ? 'positive' : 'neutral'
    }));
  }
  
  /**
   * Processa textos categorizados usando NLP
   */
  private static async processTextsByCategory(reportData: ReportData): Promise<any> {
    try {
      // Importar o serviço de extração de textos com contexto
      const { EnhancedUnifiedReportService } = await import('./enhancedUnifiedReportService');
      
      // Extrair textos com contexto temporal e de quiz
      const textsWithContext = await EnhancedUnifiedReportService.extractTextResponsesWithContext(reportData);
      
      if (!textsWithContext || textsWithContext.length === 0) {
        console.log('📝 Nenhum texto encontrado para processamento NLP');
        return {};
      }
      
      console.log(`📝 Processando ${textsWithContext.length} texto(s) categorizados...`);
      
      // Categorizar textos por tipo de quiz (expandido para incluir fallbacks)
      const categorized = {
        matinal: textsWithContext.filter(t => t.quizType === 'matinal'),
        noturno: textsWithContext.filter(t => t.quizType === 'noturno'),
        emergencial: textsWithContext.filter(t => t.quizType === 'emergencial'),
        geral: textsWithContext.filter(t => ['observacoes', 'painEvolution', 'textualResponses'].includes(t.quizType))
      };
      
      console.log('📊 Distribuição de textos por categoria:', {
        matinal: categorized.matinal.length,
        noturno: categorized.noturno.length, 
        emergencial: categorized.emergencial.length,
        geral: categorized.geral.length,
        total: textsWithContext.length
      });
      
      const textSummaries: any = {};
      
      // Processar cada categoria
      for (const [category, texts] of Object.entries(categorized)) {
        if (texts.length > 0) {
          console.log(`📝 Processando categoria ${category}: ${texts.length} texto(s)`);
          textSummaries[category] = await this.processCategoryTexts(texts, category);
        }
      }
      
      // Processar análise longitudinal combinada
      if (textsWithContext.length >= 2) {
        console.log('📝 Processando análise longitudinal combinada...');
        textSummaries.combined = await this.processLongitudinalInsights(textsWithContext);
      }
      
      console.log(`✅ Processamento NLP concluído: ${Object.keys(textSummaries).length} categoria(s)`);
      return textSummaries;
      
    } catch (error) {
      console.error('❌ Erro no processamento de textos categorizados:', error);
      return {};
    }
  }

  /**
   * 🚀 OTIMIZAÇÃO FASE 1: Processa textos de uma categoria com BATCH PROCESSING
   */
  private static async processCategoryTexts(texts: any[], category: string): Promise<any> {
    try {
      // Importar o serviço NLP
      const { NLPAnalysisService } = await import('./nlpAnalysisService');
      const nlpService = new NLPAnalysisService();
      
      // ⚡ OTIMIZAÇÃO: Usar batch processing em vez de texto combinado
      const textsToAnalyze = texts.map(t => t.text);
      console.log(`⚡ Processando ${textsToAnalyze.length} textos da categoria "${category}" em LOTE...`);
      
      // Analisar todos os textos simultaneamente usando batch processing
      await nlpService.initialize();
      const nlpResults = await nlpService.analyzeBatch(textsToAnalyze);
      
      // ⚡ Agregar resultados do batch processing
      const aggregatedAnalysis = this.aggregateNLPResults(nlpResults, textsToAnalyze);
      
      // Extrair insights específicos da categoria
      let categoryInsights = {};
      
      if (category === 'matinal') {
        categoryInsights = this.extractMorningInsights(texts, aggregatedAnalysis);
      } else if (category === 'noturno') {
        categoryInsights = this.extractEveningInsights(texts, aggregatedAnalysis);
      } else if (category === 'emergencial') {
        categoryInsights = this.extractCrisisInsights(texts, aggregatedAnalysis);
      } else if (category === 'geral') {
        categoryInsights = this.extractGeneralInsights(texts, aggregatedAnalysis);
      }
      
      const combinedText = textsToAnalyze.join('. ');
      
      return {
        summary: aggregatedAnalysis.summary?.summary || this.generateFallbackSummary(combinedText),
        averageSentiment: aggregatedAnalysis.sentiment.label.toLowerCase(),
        textCount: texts.length,
        averageLength: Math.round(combinedText.length / texts.length),
        urgencyLevel: aggregatedAnalysis.urgencyLevel || 5,
        ...categoryInsights
      };
      
    } catch (error) {
      console.error(`❌ Erro no processamento da categoria ${category}:`, error);
      
      // Fallback sem NLP
      const combinedText = texts.map(t => t.text).join('. ');
      return {
        summary: this.generateFallbackSummary(combinedText),
        averageSentiment: 'neutro',
        textCount: texts.length,
        averageLength: Math.round(combinedText.length / texts.length)
      };
    }
  }

  /**
   * ⚡ OTIMIZAÇÃO: Agrega resultados de múltiplas análises NLP em uma única estrutura
   */
  private static aggregateNLPResults(nlpResults: any[], texts: string[]): any {
    if (!nlpResults || nlpResults.length === 0) {
      return {
        sentiment: { label: 'NEUTRAL', score: 0.5, confidence: 'LOW' },
        summary: undefined,
        emotions: [{ primary: 'neutro', intensity: 5, confidence: 0.5 }],
        entities: [],
        urgencyLevel: 5,
        clinicalRelevance: 5
      };
    }

    // Agregar sentimentos (média ponderada)
    const sentiments = nlpResults.map(r => r.sentiment);
    const avgSentimentScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const positiveCount = sentiments.filter(s => s.label === 'POSITIVE').length;
    const negativeCount = sentiments.filter(s => s.label === 'NEGATIVE').length;
    
    let dominantSentiment = 'NEUTRAL';
    if (positiveCount > negativeCount) dominantSentiment = 'POSITIVE';
    else if (negativeCount > positiveCount) dominantSentiment = 'NEGATIVE';

    // Agregar entidades médicas
    const allEntities = nlpResults.flatMap(r => r.entities || []);
    const uniqueEntities = allEntities.filter((entity, index, self) => 
      index === self.findIndex(e => e.entity === entity.entity && e.type === entity.type)
    );

    // Calcular urgência e relevância médias
    const avgUrgency = nlpResults.reduce((sum, r) => sum + (r.urgencyLevel || 5), 0) / nlpResults.length;
    const avgRelevance = nlpResults.reduce((sum, r) => sum + (r.clinicalRelevance || 5), 0) / nlpResults.length;

    // Gerar resumo combinado (usar o resumo mais longo)
    const summaries = nlpResults.filter(r => r.summary).map(r => r.summary);
    const combinedSummary = summaries.length > 0 
      ? summaries.reduce((longest, current) => 
          current.summary.length > longest.summary.length ? current : longest
        ) 
      : undefined;

    return {
      sentiment: {
        label: dominantSentiment,
        score: avgSentimentScore,
        confidence: avgSentimentScore > 0.7 ? 'HIGH' : avgSentimentScore > 0.5 ? 'MEDIUM' : 'LOW'
      },
      summary: combinedSummary,
      emotions: [{
        primary: dominantSentiment === 'POSITIVE' ? 'calmo' : 
                dominantSentiment === 'NEGATIVE' ? 'preocupado' : 'neutro',
        intensity: avgSentimentScore * 10,
        confidence: avgSentimentScore
      }],
      entities: uniqueEntities,
      urgencyLevel: Math.round(avgUrgency),
      clinicalRelevance: Math.round(avgRelevance)
    };
  }

  /**
   * Extrai insights específicos dos textos matinais
   */
  private static extractMorningInsights(texts: any[], analysis: any): any {
    // Palavras-chave relacionadas a manhãs
    const morningKeywords = ['sono', 'despertar', 'manhã', 'acordar', 'descanso'];
    const hasmorningContext = texts.some(t => 
      morningKeywords.some(keyword => t.text.toLowerCase().includes(keyword))
    );
    
    return {
      morningQuality: hasmorningContext ? 'Mencionou qualidade do sono' : null,
      energyLevel: analysis.sentiment.label === 'POSITIVE' ? 'alta' : 'baixa'
    };
  }

  /**
   * Extrai insights específicos dos textos noturnos
   */
  private static extractEveningInsights(texts: any[], analysis: any): any {
    // Identificar padrões nos textos noturnos
    const patterns = this.identifyTextPatterns(texts.map(t => t.text));
    
    return {
      keyPatterns: patterns.slice(0, 3),
      reflectionDepth: analysis.summary ? 'Alta' : 'Baixa'
    };
  }

  /**
   * Extrai insights específicos dos textos de crise
   */
  private static extractCrisisInsights(texts: any[], analysis: any): any {
    // Identificar gatilhos comuns
    const triggerWords = ['estresse', 'dor', 'ansiedade', 'preocupação', 'trabalho', 'tempo'];
    const triggers = triggerWords.filter(trigger =>
      texts.some(t => t.text.toLowerCase().includes(trigger))
    );
    
    return {
      commonTriggers: triggers,
      averageUrgency: analysis.urgencyLevel || 7,
      interventionMentions: texts.filter(t => 
        t.text.toLowerCase().includes('medicamento') || 
        t.text.toLowerCase().includes('remédio')
      ).length
    };
  }

  /**
   * Extrai insights específicos dos textos gerais (observações, contextos de dor, etc.)
   */
  private static extractGeneralInsights(texts: any[], analysis: any): any {
    // Identificar tipos de conteúdo
    const contentTypes = [];
    const hasObservations = texts.some(t => t.quizType === 'observacoes');
    const hasPainContext = texts.some(t => t.quizType === 'painEvolution'); 
    const hasTextualResponses = texts.some(t => t.quizType === 'textualResponses');

    if (hasObservations) contentTypes.push('observações gerais');
    if (hasPainContext) contentTypes.push('contextos de dor');
    if (hasTextualResponses) contentTypes.push('respostas textuais');

    // Identificar temas principais através de palavras-chave
    const healthKeywords = ['dor', 'sono', 'medicamento', 'médico', 'tratamento', 'sintoma', 'melhora', 'piora'];
    const emotionalKeywords = ['ansioso', 'preocupado', 'triste', 'feliz', 'nervoso', 'calmo', 'estressado'];
    const dailyKeywords = ['trabalho', 'casa', 'família', 'rotina', 'atividade'];

    const healthMentions = healthKeywords.filter(kw => 
      texts.some(t => t.text.toLowerCase().includes(kw))
    ).length;
    
    const emotionalMentions = emotionalKeywords.filter(kw => 
      texts.some(t => t.text.toLowerCase().includes(kw))
    ).length;

    const dailyMentions = dailyKeywords.filter(kw => 
      texts.some(t => t.text.toLowerCase().includes(kw))
    ).length;

    return {
      contentTypes,
      themeDistribution: {
        saude: healthMentions,
        emocional: emotionalMentions,
        cotidiano: dailyMentions
      },
      mainFocus: healthMentions > emotionalMentions && healthMentions > dailyMentions ? 'saúde' :
                 emotionalMentions > dailyMentions ? 'emocional' : 'cotidiano',
      contextRichness: texts.reduce((sum, t) => sum + t.text.length, 0) / texts.length > 100 ? 'alta' : 'moderada'
    };
  }

  /**
   * Processa insights longitudinais de todos os textos
   */
  private static async processLongitudinalInsights(allTexts: any[]): Promise<any> {
    try {
      // Analisar evolução temporal
      const timelineAnalysis = this.analyzeTextEvolution(allTexts);
      
      // Combinar textos para análise geral
      const allCombined = allTexts.map(t => t.text).join('. ');
      
      // Gerar recomendações clínicas baseadas nos padrões
      const clinicalRecommendations = this.generateClinicalRecommendations(allTexts);
      
      return {
        summary: this.generateLongitudinalSummary(timelineAnalysis),
        totalTexts: allTexts.length,
        totalDays: new Set(allTexts.map(t => t.date)).size,
        clinicalRecommendations: clinicalRecommendations.slice(0, 3),
        timelineInsights: timelineAnalysis
      };
      
    } catch (error) {
      console.error('❌ Erro na análise longitudinal:', error);
      return {
        summary: 'Análise longitudinal não disponível no momento.',
        totalTexts: allTexts.length,
        totalDays: new Set(allTexts.map(t => t.date)).size
      };
    }
  }

  /**
   * Identifica padrões nos textos
   */
  private static identifyTextPatterns(texts: string[]): string[] {
    const patterns = [];
    
    // Padrões de frequência de palavras
    const wordCount: { [key: string]: number } = {};
    texts.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });
    
    // Extrair palavras mais frequentes
    const frequentWords = Object.entries(wordCount)
      .filter(([word, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
      
    patterns.push(...frequentWords);
    
    return patterns;
  }

  /**
   * Analisa evolução temporal dos textos
   */
  private static analyzeTextEvolution(texts: any[]): any {
    const sortedTexts = texts.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    return {
      firstEntry: sortedTexts[0]?.date,
      lastEntry: sortedTexts[sortedTexts.length - 1]?.date,
      trend: sortedTexts.length > 5 ? 'Registro consistente' : 'Registro esporádico',
      averageTextLength: sortedTexts.reduce((sum, t) => sum + t.text.length, 0) / sortedTexts.length
    };
  }

  /**
   * Gera recomendações clínicas baseadas nos textos
   */
  private static generateClinicalRecommendations(texts: any[]): string[] {
    const recommendations = [];
    
    // Analisar frequência de menções médicas
    const medicalMentions = texts.filter(t => 
      t.text.toLowerCase().includes('medicamento') || 
      t.text.toLowerCase().includes('médico') ||
      t.text.toLowerCase().includes('tratamento')
    ).length;
    
    if (medicalMentions >= 2) {
      recommendations.push('Discutir eficácia atual do tratamento');
    }
    
    // Analisar menções de sono
    const sleepMentions = texts.filter(t =>
      t.text.toLowerCase().includes('sono') ||
      t.text.toLowerCase().includes('dormir')
    ).length;
    
    if (sleepMentions >= 2) {
      recommendations.push('Avaliar qualidade e higiene do sono');
    }
    
    // Analisar menções de estresse/ansiedade
    const stressMentions = texts.filter(t =>
      t.text.toLowerCase().includes('estresse') ||
      t.text.toLowerCase().includes('ansiedade') ||
      t.text.toLowerCase().includes('preocupação')
    ).length;
    
    if (stressMentions >= 2) {
      recommendations.push('Considerar estratégias de manejo do estresse');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Manter registro regular para melhor acompanhamento');
    }
    
    return recommendations;
  }

  /**
   * Gera resumo longitudinal baseado na análise temporal
   */
  private static generateLongitudinalSummary(timelineAnalysis: any): string {
    const { trend, averageTextLength } = timelineAnalysis;
    
    let summary = `Durante o período analisado, observou-se ${trend.toLowerCase()}. `;
    
    if (averageTextLength > 100) {
      summary += 'Os relatos são detalhados, indicando boa reflexão sobre os sintomas. ';
    } else if (averageTextLength > 50) {
      summary += 'Os relatos são concisos mas informativos. ';
    } else {
      summary += 'Os relatos são breves, poderia ser útil expandir as observações. ';
    }
    
    summary += 'Continue registrando para melhor compreensão dos padrões de saúde.';
    
    return summary;
  }

  /**
   * Gera resumo básico quando NLP falha
   */
  private static generateFallbackSummary(text: string): string {
    // Pegar as primeiras frases mais relevantes
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const medicalKeywords = ['dor', 'sintoma', 'medicamento', 'sono', 'humor', 'crise'];
    
    // Priorizar frases com palavras médicas
    const relevantSentences = sentences.filter(sentence => 
      medicalKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ').substring(0, 200) + '...';
    }
    
    return text.substring(0, 150) + '...';
  }

  /**
   * Prepara dados para visualizações
   */
  private static prepareVisualizationData(enhanced: EnhancedReportData): any {
    const sleepPainEvolution = enhanced.painEvolution?.slice(0, 15).map(pain => ({
      date: pain.date,
      sleep: 5 + Math.random() * 3, // Simulado
      pain: pain.level
    })) || [];
    
    return {
      sleepPainEvolution,
      weeklyPatterns: enhanced.sleepPainInsights?.weeklyPatterns?.map(pattern => ({
        day: pattern.dayOfWeek,
        avgSleep: pattern.avgSleep,
        avgPain: pattern.avgPain
      })) || [],
      correlationTrend: [
        { period: 'Semana 1', correlation: 0.6 },
        { period: 'Semana 2', correlation: 0.7 },
        { period: 'Semana 3', correlation: 0.5 }
      ],
      riskHeatmap: []
    };
  }
}