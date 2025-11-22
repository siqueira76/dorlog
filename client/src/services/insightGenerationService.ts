/**
 * Serviço de Geração de Insights Automáticos para DorLog
 * 
 * Combina análise NLP com detecção de padrões para gerar
 * insights inteligentes e recomendações personalizadas.
 */

import { nlpServiceProxy } from './nlpServiceProxy';
import type { NLPAnalysisResult } from './nlpAnalysisService';
import { patternDetectionService, CorrelationResult, TrendResult, PatternResult, ReportData } from './patternDetectionService';

export interface InsightCategory {
  category: 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'NEUTRAL';
  priority: number; // 1-10
  title: string;
  description: string;
  recommendations?: string[];
  dataPoints: string[];
}

export interface SmartSummary {
  period: string;
  overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  keyFindings: string[];
  criticalInsights: InsightCategory[];
  recommendations: string[];
  predictiveAlerts: string[];
}

export interface HealthInsight {
  type: 'PATTERN' | 'TREND' | 'CORRELATION' | 'ANOMALY' | 'PREDICTION';
  confidence: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  insight: string;
  evidence: string[];
  actionable: boolean;
}

/**
 * Classe para geração de insights automáticos
 */
export class InsightGenerationService {

  /**
   * Gera insights baseados em análise NLP de textos livres
   */
  async generateNLPInsights(textResponses: string[]): Promise<HealthInsight[]> {
    if (textResponses.length === 0) return [];

    console.log('🧠 Gerando insights NLP...');
    const insights: HealthInsight[] = [];

    try {
      // Analisar textos usando proxy (server-side ou client-side automático)
      const nlpResults = await nlpServiceProxy.analyzeBatch(textResponses)
        .catch(() => []);

      if (nlpResults.length === 0) return insights;

      // Insight de sentimento geral
      const sentiments = nlpResults.map(r => r.sentiment);
      const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const positiveRatio = sentiments.filter(s => s.label === 'POSITIVE').length / sentiments.length;

      if (positiveRatio > 0.7) {
        insights.push({
          type: 'PATTERN',
          confidence: 0.8,
          impact: 'MEDIUM',
          insight: `Tendência emocional positiva identificada (${(positiveRatio * 100).toFixed(0)}% dos relatos)`,
          evidence: [`Análise de ${nlpResults.length} textos livres`, `Score médio: ${avgSentiment.toFixed(2)}`],
          actionable: false
        });
      } else if (positiveRatio < 0.3) {
        insights.push({
          type: 'PATTERN',
          confidence: 0.8,
          impact: 'HIGH',
          insight: `Tendência emocional negativa preocupante detectada (${(positiveRatio * 100).toFixed(0)}% positivos)`,
          evidence: [`Análise de ${nlpResults.length} textos livres`, `Baixo score de positividade`],
          actionable: true
        });
      }

      // Insight de urgência
      const urgencyLevels = nlpResults.map(r => r.urgencyLevel);
      const avgUrgency = urgencyLevels.reduce((sum, u) => sum + u, 0) / urgencyLevels.length;
      const highUrgencyCount = urgencyLevels.filter(u => u > 7).length;

      if (highUrgencyCount > 0) {
        insights.push({
          type: 'ANOMALY',
          confidence: 0.9,
          impact: 'HIGH',
          insight: `${highUrgencyCount} relato(s) com alto nível de urgência detectado`,
          evidence: [`Urgência média: ${avgUrgency.toFixed(1)}/10`, `${highUrgencyCount} casos críticos`],
          actionable: true
        });
      }

      // Insight de relevância clínica
      const clinicalRelevance = nlpResults.map(r => r.clinicalRelevance);
      const avgClinical = clinicalRelevance.reduce((sum, c) => sum + c, 0) / clinicalRelevance.length;

      if (avgClinical > 7) {
        insights.push({
          type: 'PATTERN',
          confidence: 0.7,
          impact: 'MEDIUM',
          insight: `Alta relevância clínica nos relatos (${avgClinical.toFixed(1)}/10)`,
          evidence: [`Conteúdo médico consistente`, `Descrições detalhadas de sintomas`],
          actionable: false
        });
      }

      // Insights de entidades médicas
      const allEntities = nlpResults.flatMap((r: NLPAnalysisResult) => r.entities);
      const entityCounts = new Map<string, number>();
      
      allEntities.forEach((entity: any) => {
        entityCounts.set(entity.entity, (entityCounts.get(entity.entity) || 0) + 1);
      });

      const frequentEntities = Array.from(entityCounts.entries())
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a);

      if (frequentEntities.length > 0) {
        insights.push({
          type: 'PATTERN',
          confidence: 0.6,
          impact: 'MEDIUM',
          insight: `Temas médicos recorrentes identificados`,
          evidence: frequentEntities.slice(0, 3).map(([entity, count]) => `${entity}: ${count} menções`),
          actionable: false
        });
      }

    } catch (error) {
      console.error('❌ Erro na geração de insights NLP:', error);
    }

    return insights;
  }

  /**
   * Gera insights baseados em padrões e correlações
   */
  generatePatternInsights(
    correlations: CorrelationResult[],
    trends: TrendResult[],
    patterns: PatternResult[]
  ): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Insights de correlações
    correlations.forEach(corr => {
      if (corr.significance === 'HIGH' && Math.abs(corr.correlation) > 0.6) {
        insights.push({
          type: 'CORRELATION',
          confidence: Math.abs(corr.correlation),
          impact: 'HIGH',
          insight: `Forte correlação entre ${corr.variable1} e ${corr.variable2}`,
          evidence: [
            `Correlação: ${(corr.correlation * 100).toFixed(0)}%`,
            `Baseado em ${corr.sampleSize} observações`,
            `Significância: ${corr.significance}`
          ],
          actionable: true
        });
      }
    });

    // Insights de tendências
    trends.forEach(trend => {
      if (trend.confidence > 0.6) {
        const isImproving = trend.direction === 'IMPROVING';
        
        insights.push({
          type: 'TREND',
          confidence: trend.confidence,
          impact: isImproving ? 'MEDIUM' : 'HIGH',
          insight: `${trend.metric}: tendência de ${isImproving ? 'melhora' : trend.direction === 'WORSENING' ? 'piora' : 'estabilidade'}`,
          evidence: [
            `Inclinação: ${trend.slope.toFixed(3)}`,
            `Confiança: ${(trend.confidence * 100).toFixed(0)}%`,
            `Direção: ${trend.direction}`
          ],
          actionable: !isImproving
        });
      }
    });

    // Insights de padrões
    patterns.forEach(pattern => {
      if (pattern.strength > 0.5 && pattern.frequency >= 3) {
        insights.push({
          type: 'PATTERN',
          confidence: pattern.strength,
          impact: pattern.strength > 0.7 ? 'HIGH' : 'MEDIUM',
          insight: pattern.pattern,
          evidence: pattern.examples,
          actionable: pattern.pattern.includes('crise') || pattern.pattern.includes('piora')
        });
      }
    });

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Gera alertas preditivos baseados nos padrões
   */
  generatePredictiveAlerts(patterns: PatternResult[], correlations: CorrelationResult[]): string[] {
    const alerts: string[] = [];

    // Alertas baseados em sequências de humor
    const moodSequences = patterns.filter(p => p.pattern.includes('Sequência'));
    moodSequences.forEach(seq => {
      if (seq.strength > 0.6) {
        alerts.push(`⚠️ Padrão de risco detectado: ${seq.pattern} tem ${(seq.strength * 100).toFixed(0)}% de chance de preceder crise`);
      }
    });

    // Alertas baseados em correlações fortes
    const strongCorrelations = correlations.filter(c => 
      c.significance === 'HIGH' && 
      c.correlation > 0.7 && 
      c.variable1.includes('Humor')
    );

    strongCorrelations.forEach(corr => {
      alerts.push(`🔔 Alerta comportamental: ${corr.variable1} está fortemente associado a ${corr.variable2}`);
    });

    // Alertas baseados em padrões temporais
    const timePatterns = patterns.filter(p => 
      p.pattern.includes('Crises concentradas') || 
      p.pattern.includes('incidência')
    );

    timePatterns.forEach(tp => {
      if (tp.frequency >= 3) {
        alerts.push(`📅 Padrão temporal identificado: ${tp.pattern} - considere medidas preventivas`);
      }
    });

    return alerts;
  }

  /**
   * Gera recomendações personalizadas
   */
  generatePersonalizedRecommendations(insights: HealthInsight[]): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em insights acionáveis
    const actionableInsights = insights.filter(i => i.actionable);

    actionableInsights.forEach(insight => {
      switch (insight.type) {
        case 'CORRELATION':
          if (insight.insight.includes('Humor')) {
            recommendations.push('💭 Considere técnicas de gestão emocional como meditação ou terapia cognitiva');
          }
          if (insight.insight.includes('sono')) {
            recommendations.push('😴 Implemente uma rotina de higiene do sono mais rigorosa');
          }
          break;

        case 'TREND':
          if (insight.insight.includes('piora')) {
            recommendations.push('📈 Tendência de piora detectada - considere discussão com equipe médica');
          }
          break;

        case 'PATTERN':
          if (insight.insight.includes('horário')) {
            recommendations.push('⏰ Padrão temporal identificado - considere medicação preventiva no horário de risco');
          }
          if (insight.insight.includes('gatilho')) {
            recommendations.push('🎯 Identifique e evite os gatilhos específicos mencionados');
          }
          break;

        case 'ANOMALY':
          if (insight.impact === 'HIGH') {
            recommendations.push('🚨 Anomalia de alto impacto detectada - busque avaliação médica');
          }
          break;
      }
    });

    // Recomendações gerais baseadas no conjunto de insights
    const highImpactInsights = insights.filter(i => i.impact === 'HIGH');
    if (highImpactInsights.length > 2) {
      recommendations.push('📋 Múltiplos fatores de alto impacto identificados - considere revisão abrangente do plano de tratamento');
    }

    const patternInsights = insights.filter(i => i.type === 'PATTERN');
    if (patternInsights.length > 3) {
      recommendations.push('🔍 Padrões claros identificados - utilize essas informações para otimizar sua rotina de autocuidado');
    }

    return Array.from(new Set(recommendations)); // Remove duplicatas
  }

  /**
   * Categoriza insights por importância e tipo
   */
  categorizeInsights(insights: HealthInsight[]): InsightCategory[] {
    const categories: InsightCategory[] = [];

    // Insights críticos
    const criticalInsights = insights.filter(i => 
      i.impact === 'HIGH' && 
      (i.type === 'ANOMALY' || i.confidence > 0.8)
    );

    if (criticalInsights.length > 0) {
      categories.push({
        category: 'CRITICAL',
        priority: 10,
        title: 'Alertas Críticos',
        description: 'Situações que requerem atenção imediata',
        recommendations: criticalInsights.map(i => `Ação requerida: ${i.insight}`),
        dataPoints: criticalInsights.flatMap(i => i.evidence)
      });
    }

    // Insights de warning
    const warningInsights = insights.filter(i => 
      i.impact === 'HIGH' && 
      i.type !== 'ANOMALY' && 
      i.actionable
    );

    if (warningInsights.length > 0) {
      categories.push({
        category: 'WARNING',
        priority: 7,
        title: 'Padrões de Atenção',
        description: 'Tendências que merecem monitoramento',
        recommendations: this.generatePersonalizedRecommendations(warningInsights),
        dataPoints: warningInsights.flatMap(i => i.evidence)
      });
    }

    // Insights positivos
    const positiveInsights = insights.filter(i => 
      i.insight.includes('melhora') || 
      i.insight.includes('positiv') ||
      i.insight.includes('redução')
    );

    if (positiveInsights.length > 0) {
      categories.push({
        category: 'POSITIVE',
        priority: 5,
        title: 'Progressos Identificados',
        description: 'Melhorias e padrões positivos detectados',
        dataPoints: positiveInsights.flatMap(i => i.evidence)
      });
    }

    // Insights neutros/informativos
    const neutralInsights = insights.filter(i => 
      !criticalInsights.includes(i) && 
      !warningInsights.includes(i) && 
      !positiveInsights.includes(i)
    );

    if (neutralInsights.length > 0) {
      categories.push({
        category: 'NEUTRAL',
        priority: 3,
        title: 'Informações Adicionais',
        description: 'Padrões observados e dados complementares',
        dataPoints: neutralInsights.flatMap(i => i.evidence)
      });
    }

    return categories.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Gera sumário inteligente completo
   */
  async generateSmartSummary(
    reports: ReportData[],
    textResponses: string[]
  ): Promise<SmartSummary> {
    console.log('🎯 Gerando sumário inteligente...');

    try {
      // Executar análises em paralelo
      const [nlpInsights, patternAnalysis] = await Promise.all([
        this.generateNLPInsights(textResponses),
        patternDetectionService.analyzeAllPatterns(reports)
      ]);

      const patternInsights = this.generatePatternInsights(
        patternAnalysis.correlations,
        patternAnalysis.trends,
        patternAnalysis.patterns
      );

      const allInsights = [...nlpInsights, ...patternInsights];
      const categorizedInsights = this.categorizeInsights(allInsights);
      const predictiveAlerts = this.generatePredictiveAlerts(
        patternAnalysis.patterns,
        patternAnalysis.correlations
      );
      const recommendations = this.generatePersonalizedRecommendations(allInsights);

      // Determinar sentimento geral
      const positiveInsights = allInsights.filter(i => 
        i.insight.includes('melhora') || i.insight.includes('positiv')
      );
      const negativeInsights = allInsights.filter(i => 
        i.impact === 'HIGH' && i.actionable
      );

      let overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
      if (positiveInsights.length > negativeInsights.length) {
        overallSentiment = 'POSITIVE';
      } else if (negativeInsights.length > positiveInsights.length) {
        overallSentiment = 'NEGATIVE';
      }

      // Gerar achados-chave
      const keyFindings = allInsights
        .filter(i => i.confidence > 0.6)
        .slice(0, 5)
        .map(i => i.insight);

      const period = reports.length > 0 ? 
        `${reports.length} dias analisados` : 
        'Período analisado';

      return {
        period,
        overallSentiment,
        keyFindings,
        criticalInsights: categorizedInsights,
        recommendations,
        predictiveAlerts
      };

    } catch (error) {
      console.error('❌ Erro na geração do sumário inteligente:', error);
      
      // Fallback em caso de erro
      return {
        period: 'Análise indisponível',
        overallSentiment: 'NEUTRAL',
        keyFindings: ['Erro na análise de dados'],
        criticalInsights: [],
        recommendations: ['Tente novamente mais tarde'],
        predictiveAlerts: []
      };
    }
  }

  /**
   * Valida qualidade dos dados para análise
   */
  validateDataQuality(reports: ReportData[]): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (reports.length < 3) {
      warnings.push('Poucos dados disponíveis para análise robusta');
      suggestions.push('Continue registrando dados por mais alguns dias');
    }

    const textsAvailable = reports.some(r => 
      r.quizzes.some(q => 
        (q.respostas['5'] && q.respostas['5'].length > 10) ||
        (q.respostas['8'] && q.respostas['8'].length > 10)
      )
    );

    if (!textsAvailable) {
      warnings.push('Poucos textos livres disponíveis para análise NLP');
      suggestions.push('Preencha as perguntas de texto livre para insights mais detalhados');
    }

    const emergencyQuizzes = reports.flatMap(r => r.quizzes.filter(q => q.tipo === 'emergencial'));
    if (emergencyQuizzes.length === 0) {
      suggestions.push('Nenhuma crise registrada - isso é positivo!');
    }

    return {
      isValid: warnings.length < 2,
      warnings,
      suggestions
    };
  }
}

// Instância singleton
export const insightGenerationService = new InsightGenerationService();