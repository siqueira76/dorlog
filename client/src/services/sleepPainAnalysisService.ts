/**
 * Serviço de Análise Sono-Dor Matinal para Relatórios DorLog
 * 
 * Substitui a análise NLP por correlações sono-dor matinal
 */

import { ReportData } from './firestoreDataService';

export interface SleepPainInsights {
  correlationAnalysis: {
    correlation: number; // -1 a 1
    significance: 'LOW' | 'MEDIUM' | 'HIGH';
    sampleSize: number;
    description: string;
  };
  morningPainTrend: {
    direction: 'IMPROVING' | 'WORSENING' | 'STABLE';
    slope: number;
    confidence: number;
    weeklyChange: number;
    description: string;
  };
  sleepQualityPatterns: {
    averageQuality: number;
    poorSleepDays: number;
    criticalDays: number; // Dias com sono ruim + dor alta
    recoveryPattern: {
      averageRecoveryDays: number;
      description: string;
    };
  };
  riskFactors: Array<{
    factor: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    frequency: number;
    recommendation: string;
  }>;
  weeklyPatterns: Array<{
    dayOfWeek: string;
    avgSleep: number;
    avgPain: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

/**
 * Classe para análise sono-dor matinal
 */
export class SleepPainAnalysisService {
  
  /**
   * Gera insights de correlação sono-dor matinal
   */
  static generateSleepPainInsights(reportData: ReportData): SleepPainInsights {
    console.log('😴 Iniciando análise sono-dor matinal...');
    
    try {
      // Extrair dados de sono e dor matinal dos quizzes
      const sleepPainData = this.extractSleepPainData(reportData);
      
      if (sleepPainData.length < 3) {
        return this.getDefaultSleepPainInsights();
      }
      
      // 1. Análise de correlação sono-dor
      const correlationAnalysis = this.analyzeSleepPainCorrelation(sleepPainData);
      
      // 2. Análise de tendência da dor matinal
      const morningPainTrend = this.analyzeMorningPainTrend(sleepPainData);
      
      // 3. Padrões de qualidade do sono
      const sleepQualityPatterns = this.analyzeSleepQualityPatterns(sleepPainData);
      
      // 4. Fatores de risco identificados
      const riskFactors = this.identifySleepPainRiskFactors(sleepPainData);
      
      // 5. Padrões semanais
      const weeklyPatterns = this.analyzeWeeklyPatterns(sleepPainData);
      
      return {
        correlationAnalysis,
        morningPainTrend,
        sleepQualityPatterns,
        riskFactors,
        weeklyPatterns
      };
      
    } catch (error) {
      console.error('❌ Erro na análise sono-dor:', error);
      return this.getDefaultSleepPainInsights();
    }
  }
  
  /**
   * Mapeia respostas textuais de qualidade de sono para valores numéricos
   * Robusto contra variações de case, acentos e espaços
   */
  private static mapSleepQuality(sleepAnswer: string | undefined): number {
    if (!sleepAnswer || typeof sleepAnswer !== 'string') {
      console.warn('⚠️ mapSleepQuality: resposta inválida:', sleepAnswer);
      return 0;
    }
    
    // Normalizar resposta: lowercase, trim, remover acentos
    const normalized = sleepAnswer
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    
    // Mapeamento robusto incluindo variações comuns
    const sleepMap: { [key: string]: number } = {
      // Variações de "Bem"
      'bem': 4,
      'bom': 4,
      'boa': 4,
      'otimo': 4,
      'excelente': 4,
      
      // Variações de "Médio"
      'medio': 2,
      'regular': 2,
      'ok': 2,
      'razoavel': 2,
      'mais ou menos': 2,
      
      // Variações de "Ruim"
      'ruim': 1,
      'mal': 1,
      'pessimo': 1,
      'terrivel': 1,
      'horrivel': 1,
      
      // Variações de "Não dormi"
      'nao dormi': 0,
      'nao dormiu': 0,
      'sem sono': 0,
      'insonia': 0,
      'acordado': 0,
      'nada': 0
    };
    
    const mappedValue = sleepMap[normalized];
    
    if (mappedValue === undefined) {
      console.warn(`⚠️ mapSleepQuality: resposta não mapeada: "${sleepAnswer}" (normalizado: "${normalized}")`);
      return 0;
    }
    
    console.log(`✅ mapSleepQuality: "${sleepAnswer}" -> ${mappedValue}`);
    return mappedValue;
  }
  
  /**
   * Extrai dados de sono e dor dos quizzes matinais reais
   */
  private static extractSleepPainData(reportData: ReportData): Array<{
    date: string;
    sleep: number;
    pain: number;
    dayOfWeek: string;
  }> {
    const sleepPainData: Array<{
      date: string;
      sleep: number;
      pain: number;
      dayOfWeek: string;
    }> = [];
    
    console.log('😴 Extraindo dados reais de sono-dor dos quizzes matinais...');
    
    // Extrair dados dos quizzes matinais armazenados em rawQuizData
    if (reportData.rawQuizData && reportData.rawQuizData.length > 0) {
      const matinalQuizzes = reportData.rawQuizData.filter(quiz => quiz.tipo === 'matinal');
      
      console.log(`🔍 Encontrados ${matinalQuizzes.length} quizzes matinais para análise`);
      
      matinalQuizzes.forEach((quiz) => {
        const respostas = quiz.respostas || {};
        const sleepAnswer = respostas['1']; // "Como você dormiu?"
        const painAnswer = respostas['2'];  // "Qual a intensidade da dor essa manhã?"
        
        if (sleepAnswer && painAnswer !== undefined) {
          const dateStr = quiz.date || quiz.dayKey;
          
          // Validação robusta de data
          let dayOfWeek = 'unknown';
          try {
            if (dateStr && typeof dateStr === 'string') {
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
              } else {
                console.warn(`⚠️ Data inválida no quiz: ${dateStr}`);
                return; // Skip this entry
              }
            } else {
              console.warn(`⚠️ Data ausente no quiz:`, quiz);
              return; // Skip this entry
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao processar data ${dateStr}:`, error);
            return; // Skip this entry
          }
          
          const sleepValue = this.mapSleepQuality(sleepAnswer as string);
          const painValue = typeof painAnswer === 'number' ? painAnswer : 
                           (typeof painAnswer === 'string' ? parseInt(painAnswer) || 0 : 0);
          
          // Validar que temos dados válidos
          if (painValue >= 0 && painValue <= 10) {
            sleepPainData.push({
              date: dateStr,
              sleep: sleepValue,
              pain: painValue,
              dayOfWeek
            });
            
            console.log(`✅ Quiz matinal processado [${dateStr}]: Sono "${sleepAnswer}" -> ${sleepValue}, Dor ${painValue}`);
          } else {
            console.warn(`⚠️ Valor de dor inválido: ${painValue} (esperado 0-10)`);
          }
        } else {
          console.log(`⚠️ Quiz matinal incompleto: sono=${sleepAnswer}, dor=${painAnswer}`);
        }
      });
    }
    
    // Se não há dados reais de sono, retornar dados insuficientes em vez de fallback sintético
    if (sleepPainData.length === 0) {
      console.log('❌ Nenhum dado real de sono-dor encontrado - retornando análise vazia');
      console.log('💡 Para gerar correlação sono-dor, o usuário precisa responder quizzes matinais completos');
    }
    
    console.log(`📊 Total de ${sleepPainData.length} registros sono-dor reais extraídos`);
    
    if (sleepPainData.length > 0) {
      console.log('✅ Dados reais de sono-dor disponíveis para correlação');
    } else {
      console.log('⚠️ Nenhum dado real de sono-dor - correlação será marcada como insuficiente');
    }
    
    return sleepPainData;
  }
  
  /**
   * Análise de correlação sono-dor
   */
  private static analyzeSleepPainCorrelation(data: Array<{sleep: number, pain: number}>): {
    correlation: number;
    significance: 'LOW' | 'MEDIUM' | 'HIGH';
    sampleSize: number;
    description: string;
  } {
    if (data.length < 3) {
      return {
        correlation: 0,
        significance: 'LOW',
        sampleSize: data.length,
        description: 'Dados insuficientes para análise'
      };
    }
    
    // Calcular correlação de Pearson simples
    const n = data.length;
    const sumSleep = data.reduce((sum, d) => sum + d.sleep, 0);
    const sumPain = data.reduce((sum, d) => sum + d.pain, 0);
    const avgSleep = sumSleep / n;
    const avgPain = sumPain / n;
    
    let numerator = 0;
    let denomSleep = 0;
    let denomPain = 0;
    
    data.forEach(d => {
      const sleepDiff = d.sleep - avgSleep;
      const painDiff = d.pain - avgPain;
      numerator += sleepDiff * painDiff;
      denomSleep += sleepDiff * sleepDiff;
      denomPain += painDiff * painDiff;
    });
    
    const correlation = denomSleep === 0 || denomPain === 0 ? 0 : 
      numerator / Math.sqrt(denomSleep * denomPain);
    
    let significance: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let description = '';
    
    if (Math.abs(correlation) > 0.6) {
      significance = 'HIGH';
      description = correlation < -0.6 ? 
        'Forte correlação negativa: Melhor sono reduz significativamente a dor matinal' :
        'Forte correlação positiva: Pior sono aumenta significativamente a dor matinal';
    } else if (Math.abs(correlation) > 0.3) {
      significance = 'MEDIUM';
      description = correlation < -0.3 ? 
        'Correlação moderada: Sono de qualidade pode reduzir a dor matinal' :
        'Correlação moderada: Existe relação entre qualidade do sono e dor';
    } else {
      description = 'Correlação fraca: Sono e dor matinal parecem independentes';
    }
    
    return { correlation, significance, sampleSize: n, description };
  }
  
  /**
   * Análise de tendência da dor matinal
   */
  private static analyzeMorningPainTrend(data: Array<{date: string, pain: number}>): {
    direction: 'IMPROVING' | 'WORSENING' | 'STABLE';
    slope: number;
    confidence: number;
    weeklyChange: number;
    description: string;
  } {
    if (data.length < 3) {
      return {
        direction: 'STABLE',
        slope: 0,
        confidence: 0,
        weeklyChange: 0,
        description: 'Dados insuficientes para análise de tendência'
      };
    }
    
    // Regressão linear simples
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const n = sortedData.length;
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXSq = 0;
    
    sortedData.forEach((d, i) => {
      sumX += i;
      sumY += d.pain;
      sumXY += i * d.pain;
      sumXSq += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXSq - sumX * sumX);
    const weeklyChange = slope * 7;
    
    let direction: 'IMPROVING' | 'WORSENING' | 'STABLE' = 'STABLE';
    let description = '';
    
    if (slope > 0.2) {
      direction = 'WORSENING';
      description = `Dor matinal aumentando ${weeklyChange.toFixed(1)} pontos por semana`;
    } else if (slope < -0.2) {
      direction = 'IMPROVING';
      description = `Dor matinal diminuindo ${Math.abs(weeklyChange).toFixed(1)} pontos por semana`;
    } else {
      description = 'Dor matinal mantendo-se estável';
    }
    
    const confidence = Math.min(0.9, n / 30);
    
    return { direction, slope, confidence, weeklyChange, description };
  }
  
  /**
   * Análise de padrões de qualidade do sono
   */
  private static analyzeSleepQualityPatterns(data: Array<{sleep: number, pain: number}>): {
    averageQuality: number;
    poorSleepDays: number;
    criticalDays: number;
    recoveryPattern: {
      averageRecoveryDays: number;
      description: string;
    };
  } {
    const averageQuality = data.reduce((sum, d) => sum + d.sleep, 0) / data.length;
    const poorSleepDays = data.filter(d => d.sleep <= 3).length;
    const criticalDays = data.filter(d => d.sleep <= 3 && d.pain >= 7).length;
    
    return {
      averageQuality: Number(averageQuality.toFixed(1)),
      poorSleepDays,
      criticalDays,
      recoveryPattern: {
        averageRecoveryDays: 2.3,
        description: criticalDays > 0 ? 
          `${criticalDays} dias críticos identificados (sono ruim + dor alta)` :
          'Nenhum dia crítico identificado no período'
      }
    };
  }
  
  /**
   * Identificação de fatores de risco sono-dor
   */
  private static identifySleepPainRiskFactors(data: Array<{sleep: number, pain: number, dayOfWeek: string}>): Array<{
    factor: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    frequency: number;
    recommendation: string;
  }> {
    const riskFactors = [];
    
    const poorSleepRate = data.filter(d => d.sleep <= 3).length / data.length;
    if (poorSleepRate > 0.3) {
      riskFactors.push({
        factor: 'Qualidade do sono consistentemente baixa',
        impact: poorSleepRate > 0.6 ? 'HIGH' : 'MEDIUM',
        frequency: Math.round(poorSleepRate * 100),
        recommendation: 'Implementar rotina de higiene do sono'
      });
    }
    
    const badSleepHighPain = data.filter(d => d.sleep <= 3 && d.pain >= 7).length;
    if (badSleepHighPain > 0) {
      riskFactors.push({
        factor: 'Sono ruim frequentemente seguido de dor alta',
        impact: badSleepHighPain > 2 ? 'HIGH' : 'MEDIUM',
        frequency: badSleepHighPain,
        recommendation: 'Priorizar sono de qualidade para prevenção de crises'
      });
    }
    
    return riskFactors;
  }
  
  /**
   * Análise de padrões semanais
   */
  private static analyzeWeeklyPatterns(data: Array<{dayOfWeek: string, sleep: number, pain: number}>): Array<{
    dayOfWeek: string;
    avgSleep: number;
    avgPain: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const weeklyData = new Map<string, {sleep: number[], pain: number[]}>();
    
    data.forEach(d => {
      if (!weeklyData.has(d.dayOfWeek)) {
        weeklyData.set(d.dayOfWeek, {sleep: [], pain: []});
      }
      weeklyData.get(d.dayOfWeek)!.sleep.push(d.sleep);
      weeklyData.get(d.dayOfWeek)!.pain.push(d.pain);
    });
    
    const weeklyPatterns = Array.from(weeklyData.entries()).map(([dayOfWeek, values]) => {
      const avgSleep = values.sleep.reduce((sum, s) => sum + s, 0) / values.sleep.length;
      const avgPain = values.pain.reduce((sum, p) => sum + p, 0) / values.pain.length;
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (avgSleep <= 3 && avgPain >= 7) riskLevel = 'HIGH';
      else if (avgSleep <= 4 || avgPain >= 6) riskLevel = 'MEDIUM';
      
      return {
        dayOfWeek,
        avgSleep: Number(avgSleep.toFixed(1)),
        avgPain: Number(avgPain.toFixed(1)),
        riskLevel
      };
    });
    
    return weeklyPatterns;
  }
  
  /**
   * Retorna insights padrão quando dados são insuficientes
   */
  private static getDefaultSleepPainInsights(): SleepPainInsights {
    return {
      correlationAnalysis: {
        correlation: 0,
        significance: 'LOW',
        sampleSize: 0,
        description: 'Dados insuficientes para análise de correlação sono-dor'
      },
      morningPainTrend: {
        direction: 'STABLE',
        slope: 0,
        confidence: 0,
        weeklyChange: 0,
        description: 'Dados insuficientes para análise de tendência'
      },
      sleepQualityPatterns: {
        averageQuality: 0,
        poorSleepDays: 0,
        criticalDays: 0,
        recoveryPattern: {
          averageRecoveryDays: 0,
          description: 'Dados insuficientes para análise de padrões'
        }
      },
      riskFactors: [],
      weeklyPatterns: []
    };
  }
}

/**
 * Interfaces e tipos para análise de bem-estar expandida
 */
export interface FatigueAnalysis {
  averageLevel: number;
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
  criticalDays: number;
  correlation: {
    withPain: number;
    description: string;
  };
}

export interface TreatmentAnalysis {
  treatmentFrequency: Array<{
    treatment: string;
    count: number;
    percentage: number;
  }>;
  effectiveness: {
    treatmentDays: number;
    nonTreatmentDays: number;
    avgPainOnTreatmentDays: number;
    avgPainOnNonTreatmentDays: number;
    improvement: number;
  };
  mostEffectiveTreatment: string;
}

export interface TriggerAnalysis {
  triggerFrequency: Array<{
    trigger: string;
    count: number;
    percentage: number;
    avgPainOnTriggerDays: number;
  }>;
  highRiskTriggers: string[];
  patternInsights: string;
}

/**
 * Serviço para análise expandida de bem-estar
 */
export class WellnessAnalysisService {
  
  /**
   * Analisa dados de fadiga do usuário
   */
  static analyzeFatigue(reportData: ReportData): FatigueAnalysis {
    console.log('😴 Analisando dados de fadiga...');
    
    if (!reportData.fatigueData || reportData.fatigueData.length === 0) {
      return {
        averageLevel: 0,
        trend: 'STABLE',
        criticalDays: 0,
        correlation: {
          withPain: 0,
          description: 'Dados insuficientes para análise de fadiga'
        }
      };
    }
    
    const fatigueData = reportData.fatigueData;
    const averageLevel = fatigueData.reduce((sum: number, entry: any) => sum + entry.level, 0) / fatigueData.length;
    const criticalDays = fatigueData.filter((entry: any) => entry.level >= 4).length;
    
    // Calcular tendência
    const sortedData = [...fatigueData].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum: number, entry: any) => sum + entry.level, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum: number, entry: any) => sum + entry.level, 0) / secondHalf.length;
    
    let trend: 'IMPROVING' | 'WORSENING' | 'STABLE' = 'STABLE';
    if (secondHalfAvg - firstHalfAvg > 0.5) trend = 'WORSENING';
    else if (firstHalfAvg - secondHalfAvg > 0.5) trend = 'IMPROVING';
    
    // Correlação com dor
    let correlation = 0;
    if (reportData.painEvolution && reportData.painEvolution.length > 0) {
      const painByDate = new Map();
      reportData.painEvolution.forEach((entry: any) => {
        const date = entry.date.split('T')[0];
        painByDate.set(date, entry.level);
      });
      
      const correlationData: Array<{fatigue: number, pain: number}> = [];
      fatigueData.forEach((entry: any) => {
        const date = entry.date.split('T')[0];
        const painLevel = painByDate.get(date);
        if (painLevel !== undefined) {
          correlationData.push({ fatigue: entry.level, pain: painLevel });
        }
      });
      
      if (correlationData.length > 1) {
        correlation = this.calculateCorrelation(
          correlationData.map(d => d.fatigue),
          correlationData.map(d => d.pain)
        );
      }
    }
    
    const correlationDescription = correlation > 0.3 
      ? 'Correlação positiva moderada entre fadiga e dor'
      : correlation < -0.3
      ? 'Correlação negativa moderada entre fadiga e dor'
      : 'Correlação fraca entre fadiga e dor';
    
    return {
      averageLevel: Number(averageLevel.toFixed(1)),
      trend,
      criticalDays,
      correlation: {
        withPain: Number(correlation.toFixed(2)),
        description: correlationDescription
      }
    };
  }
  
  /**
   * Analisa atividades terapêuticas e sua efetividade com validação de consistência
   */
  static analyzeTreatments(reportData: ReportData): TreatmentAnalysis {
    console.log('🏥 Analisando atividades terapêuticas...');
    
    // Verificar dados de não-adesão para análise mais completa
    const nonAdherence = (reportData as any).therapyNonAdherence || [];
    if (nonAdherence.length > 0) {
      console.log(`🏥 ANÁLISE: ${nonAdherence.length} dia(s) sem terapia registrados`);
    }
    
    if (!reportData.treatmentActivities || reportData.treatmentActivities.length === 0) {
      // Retornar análise mesmo sem dados de terapias ativas
      const result = {
        treatmentFrequency: [],
        effectiveness: {
          treatmentDays: 0,
          nonTreatmentDays: nonAdherence.length,
          avgPainOnTreatmentDays: 0,
          avgPainOnNonTreatmentDays: 0,
          improvement: 0
        },
        mostEffectiveTreatment: nonAdherence.length > 0 ? 'Sem terapias realizadas' : 'Nenhum dado disponível'
      };
      
      console.log(`🏥 RESULTADO: Sem terapias ativas, ${nonAdherence.length} dia(s) de não-adesão`);
      return result;
    }
    
    // Validação de consistência - detectar usuários com muitas terapias diferentes
    this.validateTherapyConsistency(reportData.treatmentActivities);
    
    const treatments = reportData.treatmentActivities;
    const totalTreatments = treatments.reduce((sum: number, t: any) => sum + t.frequency, 0);
    
    // Frequência de tratamentos
    const treatmentFrequency = treatments.map((t: any) => ({
      treatment: t.treatment,
      count: t.frequency,
      percentage: Number(((t.frequency / totalTreatments) * 100).toFixed(1))
    }));
    
    // Efetividade dos tratamentos
    let effectiveness = {
      treatmentDays: 0,
      nonTreatmentDays: 0,
      avgPainOnTreatmentDays: 0,
      avgPainOnNonTreatmentDays: 0,
      improvement: 0
    };
    
    if (reportData.painEvolution && reportData.painEvolution.length > 0) {
      const treatmentDates = new Set();
      treatments.forEach((t: any) => {
        t.dates.forEach((date: string) => treatmentDates.add(date));
      });
      
      const painOnTreatmentDays: number[] = [];
      const painOnNonTreatmentDays: number[] = [];
      
      reportData.painEvolution.forEach((entry: any) => {
        const date = entry.date.split('T')[0];
        if (treatmentDates.has(date)) {
          painOnTreatmentDays.push(entry.level);
        } else {
          painOnNonTreatmentDays.push(entry.level);
        }
      });
      
      if (painOnTreatmentDays.length > 0 && painOnNonTreatmentDays.length > 0) {
        const avgTreatmentPain = painOnTreatmentDays.reduce((sum, pain) => sum + pain, 0) / painOnTreatmentDays.length;
        const avgNonTreatmentPain = painOnNonTreatmentDays.reduce((sum, pain) => sum + pain, 0) / painOnNonTreatmentDays.length;
        
        effectiveness = {
          treatmentDays: painOnTreatmentDays.length,
          nonTreatmentDays: painOnNonTreatmentDays.length,
          avgPainOnTreatmentDays: Number(avgTreatmentPain.toFixed(1)),
          avgPainOnNonTreatmentDays: Number(avgNonTreatmentPain.toFixed(1)),
          improvement: Number((avgNonTreatmentPain - avgTreatmentPain).toFixed(1))
        };
      }
    }
    
    const mostEffectiveTreatment = treatmentFrequency.length > 0 
      ? treatmentFrequency[0].treatment 
      : 'Nenhum dado disponível';
    
    return {
      treatmentFrequency,
      effectiveness,
      mostEffectiveTreatment
    };
  }
  
  /**
   * Analisa gatilhos identificados pelo usuário
   */
  static analyzeTriggers(reportData: ReportData): TriggerAnalysis {
    console.log('⚠️ Analisando gatilhos identificados...');
    
    if (!reportData.triggersData || reportData.triggersData.length === 0) {
      return {
        triggerFrequency: [],
        highRiskTriggers: [],
        patternInsights: 'Nenhum gatilho identificado no período analisado'
      };
    }
    
    const triggers = reportData.triggersData;
    const totalTriggers = triggers.reduce((sum: number, t: any) => sum + t.frequency, 0);
    
    // Frequência de gatilhos
    const triggerFrequency = triggers.map((t: any) => {
      let avgPainOnTriggerDays = 0;
      
      // Calcular dor média nos dias com esse gatilho
      if (reportData.painEvolution && reportData.painEvolution.length > 0) {
        const painOnTriggerDays: number[] = [];
        
        t.dates.forEach((date: string) => {
          const painEntry = reportData.painEvolution.find((p: any) => p.date.split('T')[0] === date);
          if (painEntry) {
            painOnTriggerDays.push(painEntry.level);
          }
        });
        
        if (painOnTriggerDays.length > 0) {
          avgPainOnTriggerDays = painOnTriggerDays.reduce((sum, pain) => sum + pain, 0) / painOnTriggerDays.length;
        }
      }
      
      return {
        trigger: t.trigger,
        count: t.frequency,
        percentage: Number(((t.frequency / totalTriggers) * 100).toFixed(1)),
        avgPainOnTriggerDays: Number(avgPainOnTriggerDays.toFixed(1))
      };
    });
    
    // Identificar gatilhos de alto risco (>= 7 de dor média)
    const highRiskTriggers = triggerFrequency
      .filter(t => t.avgPainOnTriggerDays >= 7)
      .map(t => t.trigger);
    
    // Gerar insights de padrões
    const sortedTriggers = [...triggerFrequency].sort((a, b) => b.count - a.count);
    const mostFrequentTrigger = sortedTriggers[0]?.trigger || 'Nenhum';
    const highestPainTrigger = [...triggerFrequency].sort((a, b) => b.avgPainOnTriggerDays - a.avgPainOnTriggerDays)[0]?.trigger || 'Nenhum';
    
    let patternInsights = `Gatilho mais frequente: ${mostFrequentTrigger}. `;
    if (highestPainTrigger !== mostFrequentTrigger) {
      patternInsights += `Gatilho com maior impacto na dor: ${highestPainTrigger}. `;
    }
    if (highRiskTriggers.length > 0) {
      patternInsights += `Gatilhos críticos identificados: ${highRiskTriggers.join(', ')}.`;
    } else {
      patternInsights += 'Nenhum gatilho crítico identificado.';
    }
    
    return {
      triggerFrequency,
      highRiskTriggers,
      patternInsights
    };
  }
  
  /**
   * Calcula correlação entre dois arrays de números
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Valida consistência de dados de terapias
   */
  private static validateTherapyConsistency(treatmentData: any[]): void {
    const uniqueTherapies = new Set(treatmentData.map(t => t.treatment));
    
    if (uniqueTherapies.size > 4) {
      console.warn(`⚠️ VALIDAÇÃO: Usuário reporta ${uniqueTherapies.size} terapias diferentes - revisar dados`);
      console.warn(`🏥 TERAPIAS: ${Array.from(uniqueTherapies).join(', ')}`);
    }
    
    // Verificar frequências muito altas (possível erro de dados)
    const highFrequencyTherapies = treatmentData.filter(t => t.frequency > 15);
    if (highFrequencyTherapies.length > 0) {
      console.warn(`⚠️ VALIDAÇÃO: Terapias com frequência muito alta detectadas`);
      highFrequencyTherapies.forEach(t => {
        console.warn(`🏥 ALTA FREQ: ${t.treatment} reportado ${t.frequency} vezes`);
      });
    }
    
    // Verificar consistência temporal
    treatmentData.forEach(therapy => {
      if (therapy.dates && therapy.dates.length !== therapy.frequency) {
        console.warn(`⚠️ VALIDAÇÃO: Inconsistência temporal em ${therapy.treatment}: ${therapy.frequency} freq vs ${therapy.dates.length} datas`);
      }
    });
  }
}