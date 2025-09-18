/**
 * Serviço de NLP Contextual para Análise Médica - DorLog
 * 
 * Processa textos livres dos usuários para extrair informações sobre:
 * - Menções a medicamentos
 * - Referências a médicos
 * - Sentimentos sobre tratamentos
 * - Eficácia relatada
 * - Efeitos colaterais
 */

import { MedicalInsight, Doctor, Medication } from './medicalCorrelationService';

export interface MedicalMention {
  type: 'MEDICATION' | 'DOCTOR' | 'TREATMENT' | 'SYMPTOM' | 'SIDE_EFFECT';
  text: string;
  confidence: number;
  context: string;
  sentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  timestamp?: string;
  sourceText: string;
}

export interface MedicationReference {
  medicationName: string;
  mentionedName: string; // Como foi mencionado no texto
  confidence: number;
  sentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  efficacyMentioned: boolean;
  sideEffectsMentioned: boolean;
  adherenceMentioned: boolean;
  context: string;
}

export interface DoctorReference {
  doctorName?: string;
  specialty?: string;
  mentionType: 'CONSULTA' | 'PRESCRICAO' | 'RECOMENDACAO' | 'OPINIAO';
  sentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  confidence: number;
  context: string;
}

export interface TreatmentSentiment {
  overallSentiment: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  confidence: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  keyPositiveTerms: string[];
  keyNegativeTerms: string[];
  improvementMentions: number;
  worseningMentions: number;
}

export interface AdheerencePattern {
  medicationName: string;
  totalMentions: number;
  adherencePositive: number; // "tomei", "usei", "não esqueci"
  adherenceNegative: number; // "esqueci", "não tomei", "parei"
  adherenceScore: number; // 0-1
  patterns: Array<{
    date: string;
    text: string;
    adherenceType: 'TOMOU' | 'ESQUECEU' | 'PAROU' | 'AJUSTOU';
  }>;
}

/**
 * Classe principal para análise NLP contextual de dados médicos
 */
export class MedicalNLPService {
  
  // Dicionários de termos médicos para detecção
  private static readonly MEDICATION_KEYWORDS = [
    'remedio', 'medicamento', 'comprimido', 'capsula', 'gotas', 'xarope',
    'pomada', 'gel', 'spray', 'injecao', 'vacina', 'dose', 'mg', 'ml',
    'tomar', 'tomei', 'usar', 'usei', 'aplicar', 'apliquei'
  ];
  
  private static readonly DOCTOR_KEYWORDS = [
    'medico', 'doutor', 'doutora', 'dr', 'dra', 'especialista',
    'reumatologista', 'neurologista', 'ortopedista', 'psiquiatra',
    'clinico geral', 'consulta', 'atendimento', 'prescreveu', 'recomendou'
  ];
  
  private static readonly POSITIVE_TERMS = [
    'melhor', 'melhorou', 'melhorando', 'aliviou', 'ajudou', 'eficaz',
    'funcionou', 'bom', 'otimo', 'excelente', 'satisfeito', 'feliz',
    'menos dor', 'sem dor', 'dormindo melhor', 'mais energia'
  ];
  
  private static readonly NEGATIVE_TERMS = [
    'pior', 'piorou', 'piorando', 'nao funcionou', 'nao ajudou', 'ruim',
    'terrivel', 'horrivel', 'efeito colateral', 'enjoo', 'tontura',
    'mais dor', 'nao consegui', 'desisti', 'parei', 'insatisfeito'
  ];
  
  private static readonly ADHERENCE_POSITIVE = [
    'tomei', 'usei', 'apliquei', 'nao esqueci', 'certinho', 'todo dia',
    'sempre tomo', 'no horario', 'conforme prescricao', 'regularmente'
  ];
  
  private static readonly ADHERENCE_NEGATIVE = [
    'esqueci', 'nao tomei', 'nao usei', 'parei', 'desisti', 'saltei',
    'faltou', 'acabou', 'nao consegui', 'muito caro', 'muitos efeitos'
  ];
  
  /**
   * Analisa textos livres para extrair menções médicas
   */
  static analyzeMedicalMentions(
    texts: Array<{text: string, date: string, timestamp?: string}>,
    knownMedications: Medication[],
    knownDoctors: Doctor[]
  ): MedicalMention[] {
    console.log('🔍 Analisando menções médicas em textos livres...');
    
    const mentions: MedicalMention[] = [];
    
    texts.forEach(textEntry => {
      const text = textEntry.text.toLowerCase();
      const words = text.split(/\s+/);
      
      // Detectar menções a medicamentos
      this.MEDICATION_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword)) {
          const context = this.extractContext(text, keyword, 30);
          const sentiment = this.determineSentiment(context);
          
          mentions.push({
            type: 'MEDICATION',
            text: keyword,
            confidence: this.calculateKeywordConfidence(keyword, context),
            context,
            sentiment,
            timestamp: textEntry.timestamp,
            sourceText: textEntry.text
          });
        }
      });
      
      // Detectar menções a médicos
      this.DOCTOR_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword)) {
          const context = this.extractContext(text, keyword, 30);
          const sentiment = this.determineSentiment(context);
          
          mentions.push({
            type: 'DOCTOR',
            text: keyword,
            confidence: this.calculateKeywordConfidence(keyword, context),
            context,
            sentiment,
            timestamp: textEntry.timestamp,
            sourceText: textEntry.text
          });
        }
      });
      
      // Detectar medicamentos específicos conhecidos
      knownMedications.forEach(medication => {
        const medName = medication.nome.toLowerCase();
        if (text.includes(medName)) {
          const context = this.extractContext(text, medName, 40);
          const sentiment = this.determineSentiment(context);
          
          mentions.push({
            type: 'MEDICATION',
            text: medication.nome,
            confidence: 0.9, // Alta confiança para medicamentos conhecidos
            context,
            sentiment,
            timestamp: textEntry.timestamp,
            sourceText: textEntry.text
          });
        }
      });
    });
    
    console.log(`✅ Encontradas ${mentions.length} menções médicas`);
    return mentions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Analisa referências específicas a medicamentos
   */
  static analyzeMedicationReferences(
    texts: Array<{text: string, date: string}>,
    knownMedications: Medication[]
  ): MedicationReference[] {
    console.log('💊 Analisando referências específicas a medicamentos...');
    
    const references: MedicationReference[] = [];
    
    knownMedications.forEach(medication => {
      const medName = medication.nome.toLowerCase();
      let mentionCount = 0;
      let totalSentiment = 0;
      let efficacyMentioned = false;
      let sideEffectsMentioned = false;
      let adherenceMentioned = false;
      let contexts: string[] = [];
      
      texts.forEach(textEntry => {
        const text = textEntry.text.toLowerCase();
        
        if (text.includes(medName)) {
          mentionCount++;
          const context = this.extractContext(text, medName, 50);
          contexts.push(context);
          
          const sentiment = this.determineSentiment(context);
          totalSentiment += sentiment === 'POSITIVO' ? 1 : sentiment === 'NEGATIVO' ? -1 : 0;
          
          // Verificar menções de eficácia
          if (this.POSITIVE_TERMS.some(term => context.includes(term)) ||
              this.NEGATIVE_TERMS.some(term => context.includes(term))) {
            efficacyMentioned = true;
          }
          
          // Verificar menções de efeitos colaterais
          if (context.includes('efeito') || context.includes('enjoo') || 
              context.includes('tontura') || context.includes('mal')) {
            sideEffectsMentioned = true;
          }
          
          // Verificar menções de adesão
          if (this.ADHERENCE_POSITIVE.some(term => context.includes(term)) ||
              this.ADHERENCE_NEGATIVE.some(term => context.includes(term))) {
            adherenceMentioned = true;
          }
        }
      });
      
      if (mentionCount > 0) {
        const overallSentiment = totalSentiment > 0 ? 'POSITIVO' : 
                                totalSentiment < 0 ? 'NEGATIVO' : 'NEUTRO';
        
        references.push({
          medicationName: medication.nome,
          mentionedName: medName,
          confidence: Math.min(0.8 + (mentionCount * 0.05), 1.0),
          sentiment: overallSentiment,
          efficacyMentioned,
          sideEffectsMentioned,
          adherenceMentioned,
          context: contexts.join(' | ')
        });
      }
    });
    
    console.log(`✅ Analisadas ${references.length} referências específicas`);
    return references.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Analisa padrões de adesão baseados em textos
   */
  static analyzeAdherencePatterns(
    texts: Array<{text: string, date: string}>,
    knownMedications: Medication[]
  ): AdheerencePattern[] {
    console.log('📊 Analisando padrões de adesão...');
    
    const patterns: AdheerencePattern[] = [];
    
    knownMedications.forEach(medication => {
      const medName = medication.nome.toLowerCase();
      let totalMentions = 0;
      let adherencePositive = 0;
      let adherenceNegative = 0;
      const adherenceEvents: Array<{
        date: string;
        text: string;
        adherenceType: 'TOMOU' | 'ESQUECEU' | 'PAROU' | 'AJUSTOU';
      }> = [];
      
      texts.forEach(textEntry => {
        const text = textEntry.text.toLowerCase();
        
        if (text.includes(medName)) {
          totalMentions++;
          
          // Verificar adesão positiva
          if (this.ADHERENCE_POSITIVE.some(term => text.includes(term))) {
            adherencePositive++;
            adherenceEvents.push({
              date: textEntry.date,
              text: textEntry.text,
              adherenceType: 'TOMOU'
            });
          }
          
          // Verificar adesão negativa
          if (this.ADHERENCE_NEGATIVE.some(term => text.includes(term))) {
            adherenceNegative++;
            
            let adherenceType: 'ESQUECEU' | 'PAROU' | 'AJUSTOU' = 'ESQUECEU';
            if (text.includes('parei') || text.includes('desisti')) {
              adherenceType = 'PAROU';
            } else if (text.includes('ajustei') || text.includes('mudei')) {
              adherenceType = 'AJUSTOU';
            }
            
            adherenceEvents.push({
              date: textEntry.date,
              text: textEntry.text,
              adherenceType
            });
          }
        }
      });
      
      if (totalMentions > 0) {
        const adherenceScore = adherencePositive / Math.max(totalMentions, 1);
        
        patterns.push({
          medicationName: medication.nome,
          totalMentions,
          adherencePositive,
          adherenceNegative,
          adherenceScore,
          patterns: adherenceEvents.sort((a, b) => a.date.localeCompare(b.date))
        });
      }
    });
    
    console.log(`✅ Analisados padrões de adesão para ${patterns.length} medicamentos`);
    return patterns.sort((a, b) => b.adherenceScore - a.adherenceScore);
  }
  
  /**
   * Analisa sentimento geral sobre tratamentos
   */
  static analyzeTreatmentSentiment(texts: Array<{text: string, date: string}>): TreatmentSentiment {
    console.log('🎯 Analisando sentimento geral sobre tratamentos...');
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let improvementMentions = 0;
    let worseningMentions = 0;
    
    const positiveTermsFound = new Set<string>();
    const negativeTermsFound = new Set<string>();
    
    texts.forEach(textEntry => {
      const text = textEntry.text.toLowerCase();
      let sentimentScore = 0;
      
      // Contar termos positivos
      this.POSITIVE_TERMS.forEach(term => {
        if (text.includes(term)) {
          sentimentScore += 1;
          positiveTermsFound.add(term);
          
          if (term.includes('melhor') || term.includes('aliviou')) {
            improvementMentions++;
          }
        }
      });
      
      // Contar termos negativos
      this.NEGATIVE_TERMS.forEach(term => {
        if (text.includes(term)) {
          sentimentScore -= 1;
          negativeTermsFound.add(term);
          
          if (term.includes('pior') || term.includes('mais dor')) {
            worseningMentions++;
          }
        }
      });
      
      // Classificar sentimento do texto
      if (sentimentScore > 0) {
        positiveCount++;
      } else if (sentimentScore < 0) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });
    
    const totalTexts = texts.length;
    const overallSentiment = positiveCount > negativeCount ? 'POSITIVO' :
                            negativeCount > positiveCount ? 'NEGATIVO' : 'NEUTRO';
    
    const confidence = totalTexts > 0 ? 
      Math.abs(positiveCount - negativeCount) / totalTexts : 0;
    
    const result: TreatmentSentiment = {
      overallSentiment,
      confidence,
      positiveCount,
      negativeCount,
      neutralCount,
      keyPositiveTerms: Array.from(positiveTermsFound).slice(0, 5),
      keyNegativeTerms: Array.from(negativeTermsFound).slice(0, 5),
      improvementMentions,
      worseningMentions
    };
    
    console.log(`✅ Sentimento analisado: ${overallSentiment} (${confidence.toFixed(2)} confiança)`);
    return result;
  }
  
  /**
   * Gera insights preditivos baseados na análise NLP
   */
  static generatePredictiveInsights(
    medicationReferences: MedicationReference[],
    adherencePatterns: AdheerencePattern[],
    treatmentSentiment: TreatmentSentiment,
    knownMedications: Medication[]
  ): MedicalInsight[] {
    console.log('🔮 Gerando insights preditivos...');
    
    const insights: MedicalInsight[] = [];
    
    // Insight 1: Medicamento com risco de abandono
    const lowAdherenceMeds = adherencePatterns.filter(p => p.adherenceScore < 0.6);
    if (lowAdherenceMeds.length > 0) {
      const worstMed = lowAdherenceMeds[0];
      insights.push({
        type: 'ADHERENCE_PATTERN',
        title: 'Risco de Abandono de Medicamento',
        description: `${worstMed.medicationName} apresenta baixa adesão (${(worstMed.adherenceScore * 100).toFixed(1)}%). Padrão detectado: ${worstMed.adherenceNegative} menções negativas vs ${worstMed.adherencePositive} positivas.`,
        recommendation: `Configure lembretes mais frequentes para ${worstMed.medicationName} e converse com seu médico sobre possíveis ajustes na posologia ou alternativas.`,
        priority: 'ALTA',
        confidence: 0.8,
        supportingData: worstMed
      });
    }
    
    // Insight 2: Medicamento com eficácia reportada
    const effectiveMeds = medicationReferences.filter(r => 
      r.sentiment === 'POSITIVO' && r.efficacyMentioned
    );
    if (effectiveMeds.length > 0) {
      const bestMed = effectiveMeds[0];
      insights.push({
        type: 'MEDICATION_EFFECTIVENESS',
        title: 'Medicamento com Eficácia Confirmada',
        description: `Você relatou efeitos positivos consistentes com ${bestMed.medicationName}. Sentimento geral: positivo.`,
        recommendation: `Continue o tratamento com ${bestMed.medicationName} e documente os benefícios para sua próxima consulta médica.`,
        priority: 'MEDIA',
        confidence: bestMed.confidence,
        supportingData: bestMed
      });
    }
    
    // Insight 3: Tendência geral de melhoria ou piora
    if (treatmentSentiment.improvementMentions > treatmentSentiment.worseningMentions * 2) {
      insights.push({
        type: 'TREATMENT_CORRELATION',
        title: 'Tendência Positiva de Tratamento',
        description: `Seus relatos indicam melhoria consistente: ${treatmentSentiment.improvementMentions} menções de melhoria vs ${treatmentSentiment.worseningMentions} de piora.`,
        recommendation: 'Continue com o plano de tratamento atual e mantenha o acompanhamento médico regular.',
        priority: 'MEDIA',
        confidence: treatmentSentiment.confidence,
        supportingData: treatmentSentiment
      });
    } else if (treatmentSentiment.worseningMentions > treatmentSentiment.improvementMentions) {
      insights.push({
        type: 'TREATMENT_CORRELATION',
        title: 'Necessidade de Revisão do Tratamento',
        description: `Detectamos mais relatos de piora (${treatmentSentiment.worseningMentions}) do que melhoria (${treatmentSentiment.improvementMentions}).`,
        recommendation: 'Agende uma consulta médica para revisar seu plano de tratamento atual.',
        priority: 'ALTA',
        confidence: treatmentSentiment.confidence,
        supportingData: treatmentSentiment
      });
    }
    
    // Insight 4: Padrão de efeitos colaterais
    const sideEffectMeds = medicationReferences.filter(r => r.sideEffectsMentioned);
    if (sideEffectMeds.length > 0) {
      insights.push({
        type: 'MEDICATION_EFFECTIVENESS',
        title: 'Efeitos Colaterais Detectados',
        description: `Identificamos relatos de possíveis efeitos colaterais em ${sideEffectMeds.length} medicamento(s).`,
        recommendation: 'Discuta estes efeitos com seu médico. Pode haver alternativas ou ajustes de dose.',
        priority: 'MEDIA',
        confidence: 0.7,
        supportingData: sideEffectMeds
      });
    }
    
    console.log(`✅ Gerados ${insights.length} insights preditivos`);
    return insights.sort((a, b) => {
      const priorityOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAIXA': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  // Métodos auxiliares privados
  private static extractContext(text: string, keyword: string, radius: number): string {
    const index = text.indexOf(keyword);
    if (index === -1) return '';
    
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + keyword.length + radius);
    
    return text.substring(start, end).trim();
  }
  
  private static determineSentiment(context: string): 'POSITIVO' | 'NEGATIVO' | 'NEUTRO' {
    let positiveScore = 0;
    let negativeScore = 0;
    
    this.POSITIVE_TERMS.forEach(term => {
      if (context.includes(term)) positiveScore++;
    });
    
    this.NEGATIVE_TERMS.forEach(term => {
      if (context.includes(term)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'POSITIVO';
    if (negativeScore > positiveScore) return 'NEGATIVO';
    return 'NEUTRO';
  }
  
  private static calculateKeywordConfidence(keyword: string, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Aumentar confiança se há contexto médico relevante
    if (context.includes('dor') || context.includes('tratamento') || 
        context.includes('medico') || context.includes('receita')) {
      confidence += 0.2;
    }
    
    // Aumentar confiança para termos específicos
    if (this.MEDICATION_KEYWORDS.includes(keyword) || 
        this.DOCTOR_KEYWORDS.includes(keyword)) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }
}

/**
 * Instância singleton para uso global
 */
export const medicalNLPService = new MedicalNLPService();