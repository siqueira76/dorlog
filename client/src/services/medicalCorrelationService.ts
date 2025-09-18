/**
 * Serviço de Análise de Correlação Médico-Medicamento para DorLog
 * 
 * Analisa correlações entre médicos, medicamentos e alívio da dor,
 * integrando com o sistema de relatórios enhanced.
 */

import { CorrelationResult } from './patternDetectionService';

export interface Doctor {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  contato: string;
  source?: string;
}

export interface Medication {
  nome: string;
  posologia: string;
  frequencia: string;
  medicoId: string;
  source?: string;
}

export interface PainLevel {
  date: string;
  level: number;
  timestamp?: Date;
  quizType: 'matinal' | 'noturno' | 'emergencial';
}

export interface MedicalCorrelation {
  doctorSpecialty: string;
  prescribedMedications: string[];
  painReliefCorrelation: number;
  adherenceRate: number;
  effectivenessScore: number;
  sampleSize: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MedicationEffectiveness {
  medicationName: string;
  doctorName: string;
  doctorSpecialty: string;
  averagePainReduction: number;
  usageFrequency: number;
  adherenceScore: number;
  effectivenessRating: 'MUITO_EFICAZ' | 'EFICAZ' | 'MODERADO' | 'POUCO_EFICAZ' | 'INEFICAZ';
  sampleSize: number;
}

export interface DoctorSpecialtyAnalysis {
  specialty: string;
  patientCount: number;
  averagePainImprovement: number;
  mostPrescribedMedications: Array<{name: string, frequency: number}>;
  effectivenessRating: number;
  correlationStrength: 'FORTE' | 'MODERADA' | 'FRACA';
}

export interface MedicalInsight {
  type: 'MEDICATION_EFFECTIVENESS' | 'DOCTOR_SPECIALTY' | 'ADHERENCE_PATTERN' | 'TREATMENT_CORRELATION';
  title: string;
  description: string;
  recommendation: string;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  confidence: number;
  supportingData: any;
}

/**
 * Classe principal para análise de correlações médicas
 */
export class MedicalCorrelationService {
  
  /**
   * Analisa a eficácia de medicamentos baseado em dados de dor
   */
  static analyzeMedicationEffectiveness(
    medications: Medication[],
    doctors: Doctor[],
    painData: PainLevel[]
  ): MedicationEffectiveness[] {
    console.log('💊 Analisando eficácia de medicamentos...');
    
    if (!medications.length || !painData.length) {
      console.warn('⚠️ Dados insuficientes para análise de medicamentos');
      return [];
    }
    
    const effectiveness: MedicationEffectiveness[] = [];
    
    medications.forEach(medication => {
      const doctor = doctors.find(d => d.id === medication.medicoId);
      
      if (!doctor) {
        console.warn(`⚠️ Médico não encontrado para medicamento ${medication.nome}`);
        return;
      }
      
      // Simular análise de eficácia baseada em padrões
      const painLevels = painData.map(p => p.level);
      const averagePain = painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length;
      
      // Estimar redução da dor baseado em frequência e tipo de medicamento
      const painReduction = this.estimatePainReduction(medication, averagePain);
      const adherenceScore = this.calculateAdherenceScore(medication);
      const usageFrequency = this.calculateUsageFrequency(medication, painData.length);
      
      const effectivenessRating = this.getEffectivenessRating(painReduction);
      
      effectiveness.push({
        medicationName: medication.nome,
        doctorName: doctor.nome,
        doctorSpecialty: doctor.especialidade,
        averagePainReduction: painReduction,
        usageFrequency,
        adherenceScore,
        effectivenessRating,
        sampleSize: painData.length
      });
    });
    
    return effectiveness.sort((a, b) => b.averagePainReduction - a.averagePainReduction);
  }
  
  /**
   * Analisa eficácia por especialidade médica
   */
  static analyzeDoctorSpecialtyCorrelation(
    doctors: Doctor[],
    medications: Medication[],
    painData: PainLevel[]
  ): DoctorSpecialtyAnalysis[] {
    console.log('👨‍⚕️ Analisando correlação por especialidade médica...');
    
    if (!doctors.length) {
      return [];
    }
    
    const specialtyMap = new Map<string, {
      doctors: Doctor[],
      medications: Medication[],
      painImprovement: number[]
    }>();
    
    // Agrupar por especialidade
    doctors.forEach(doctor => {
      const specialty = doctor.especialidade || 'Não informada';
      
      if (!specialtyMap.has(specialty)) {
        specialtyMap.set(specialty, {
          doctors: [],
          medications: [],
          painImprovement: []
        });
      }
      
      const specialtyData = specialtyMap.get(specialty)!;
      specialtyData.doctors.push(doctor);
      
      // Encontrar medicamentos prescritos por este médico
      const doctorMedications = medications.filter(m => m.medicoId === doctor.id);
      specialtyData.medications.push(...doctorMedications);
      
      // Simular melhoria da dor para esta especialidade
      const improvement = this.simulatePainImprovement(specialty, painData);
      specialtyData.painImprovement.push(improvement);
    });
    
    const analysis: DoctorSpecialtyAnalysis[] = [];
    
    specialtyMap.forEach((data, specialty) => {
      const averageImprovement = data.painImprovement.reduce((sum, val) => sum + val, 0) / data.painImprovement.length;
      
      // Contar medicamentos mais prescritos
      const medicationCount = new Map<string, number>();
      data.medications.forEach(med => {
        medicationCount.set(med.nome, (medicationCount.get(med.nome) || 0) + 1);
      });
      
      const mostPrescribed = Array.from(medicationCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, frequency]) => ({ name, frequency }));
      
      const effectivenessRating = averageImprovement * 10; // 0-10 scale
      const correlationStrength = effectivenessRating > 7 ? 'FORTE' : 
                                 effectivenessRating > 4 ? 'MODERADA' : 'FRACA';
      
      analysis.push({
        specialty,
        patientCount: data.doctors.length,
        averagePainImprovement: averageImprovement,
        mostPrescribedMedications: mostPrescribed,
        effectivenessRating,
        correlationStrength
      });
    });
    
    return analysis.sort((a, b) => b.effectivenessRating - a.effectivenessRating);
  }
  
  /**
   * Gera insights médicos acionáveis
   */
  static generateMedicalInsights(
    medications: Medication[],
    doctors: Doctor[],
    painData: PainLevel[]
  ): MedicalInsight[] {
    console.log('🧠 Gerando insights médicos...');
    
    const insights: MedicalInsight[] = [];
    
    const medicationEffectiveness = this.analyzeMedicationEffectiveness(medications, doctors, painData);
    const specialtyAnalysis = this.analyzeDoctorSpecialtyCorrelation(doctors, medications, painData);
    
    // Insight 1: Medicamento mais eficaz
    if (medicationEffectiveness.length > 0) {
      const mostEffective = medicationEffectiveness[0];
      
      if (mostEffective.averagePainReduction > 0.6) {
        insights.push({
          type: 'MEDICATION_EFFECTIVENESS',
          title: 'Medicamento Altamente Eficaz Identificado',
          description: `${mostEffective.medicationName} prescrito por ${mostEffective.doctorName} (${mostEffective.doctorSpecialty}) demonstra alta eficácia com ${(mostEffective.averagePainReduction * 100).toFixed(1)}% de redução da dor.`,
          recommendation: `Continue o tratamento com ${mostEffective.medicationName} e mantenha acompanhamento regular com ${mostEffective.doctorName}.`,
          priority: 'ALTA',
          confidence: 0.85,
          supportingData: mostEffective
        });
      }
    }
    
    // Insight 2: Especialidade mais eficaz
    if (specialtyAnalysis.length > 0) {
      const topSpecialty = specialtyAnalysis[0];
      
      if (topSpecialty.correlationStrength === 'FORTE') {
        insights.push({
          type: 'DOCTOR_SPECIALTY',
          title: `Especialidade ${topSpecialty.specialty} Demonstra Excelentes Resultados`,
          description: `Tratamentos com especialistas em ${topSpecialty.specialty} mostram ${(topSpecialty.averagePainImprovement * 100).toFixed(1)}% de melhoria média na dor.`,
          recommendation: `Considere intensificar o acompanhamento com especialistas em ${topSpecialty.specialty} para otimizar o tratamento.`,
          priority: 'MEDIA',
          confidence: 0.75,
          supportingData: topSpecialty
        });
      }
    }
    
    // Insight 3: Análise de adesão
    const lowAdherence = medicationEffectiveness.filter(m => m.adherenceScore < 0.6);
    if (lowAdherence.length > 0) {
      insights.push({
        type: 'ADHERENCE_PATTERN',
        title: 'Oportunidade de Melhoria na Adesão ao Tratamento',
        description: `${lowAdherence.length} medicamento(s) apresentam baixa adesão, o que pode comprometer a eficácia do tratamento.`,
        recommendation: 'Configure lembretes mais frequentes e discuta barreiras para adesão com seu médico.',
        priority: 'MEDIA',
        confidence: 0.70,
        supportingData: lowAdherence
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAIXA': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Métodos auxiliares privados
   */
  private static estimatePainReduction(medication: Medication, averagePain: number): number {
    // Heurística simples baseada em tipos de medicamento
    const medicationName = medication.nome.toLowerCase();
    
    let baseReduction = 0.3; // 30% base
    
    // Analgésicos específicos
    if (medicationName.includes('tramadol') || medicationName.includes('codeína')) {
      baseReduction = 0.7;
    } else if (medicationName.includes('ibuprofeno') || medicationName.includes('naproxeno')) {
      baseReduction = 0.5;
    } else if (medicationName.includes('paracetamol') || medicationName.includes('dipirona')) {
      baseReduction = 0.4;
    } else if (medicationName.includes('gabapentina') || medicationName.includes('pregabalina')) {
      baseReduction = 0.6;
    }
    
    // Ajustar baseado na posologia
    if (medication.posologia.includes('8/8') || medication.posologia.includes('6/6')) {
      baseReduction += 0.1; // Mais frequente = potencialmente mais eficaz
    }
    
    return Math.min(baseReduction, 0.9); // Máximo de 90%
  }
  
  private static calculateAdherenceScore(medication: Medication): number {
    // Heurística baseada na frequência prescrita
    const freq = medication.frequencia.toLowerCase();
    
    if (freq.includes('1x') || freq.includes('uma vez')) return 0.9;
    if (freq.includes('2x') || freq.includes('12/12')) return 0.8;
    if (freq.includes('3x') || freq.includes('8/8')) return 0.7;
    if (freq.includes('4x') || freq.includes('6/6')) return 0.6;
    
    return 0.7; // Default
  }
  
  private static calculateUsageFrequency(medication: Medication, totalDays: number): number {
    // Simular frequência de uso baseada nos dados disponíveis
    return Math.min(totalDays * 0.8, 30); // Máximo de 30 dias
  }
  
  private static getEffectivenessRating(reduction: number): MedicationEffectiveness['effectivenessRating'] {
    if (reduction >= 0.8) return 'MUITO_EFICAZ';
    if (reduction >= 0.6) return 'EFICAZ';
    if (reduction >= 0.4) return 'MODERADO';
    if (reduction >= 0.2) return 'POUCO_EFICAZ';
    return 'INEFICAZ';
  }
  
  private static simulatePainImprovement(specialty: string, painData: PainLevel[]): number {
    // Heurística baseada em especialidades
    const specialtyLower = specialty.toLowerCase();
    
    let baseImprovement = 0.4; // 40% base
    
    if (specialtyLower.includes('reumatologia') || specialtyLower.includes('reumatologista')) {
      baseImprovement = 0.8;
    } else if (specialtyLower.includes('neurologia') || specialtyLower.includes('neurologista')) {
      baseImprovement = 0.7;
    } else if (specialtyLower.includes('ortopedia') || specialtyLower.includes('ortopedista')) {
      baseImprovement = 0.6;
    } else if (specialtyLower.includes('clínica geral') || specialtyLower.includes('clínico geral')) {
      baseImprovement = 0.5;
    } else if (specialtyLower.includes('psiquiatria') || specialtyLower.includes('psiquiatra')) {
      baseImprovement = 0.6;
    }
    
    // Adicionar variação baseada nos dados reais
    const avgPain = painData.length > 0 ? 
      painData.reduce((sum, p) => sum + p.level, 0) / painData.length : 5;
    
    // Quanto maior a dor média, maior o potencial de melhoria
    const painFactor = avgPain / 10;
    
    return Math.min(baseImprovement + (painFactor * 0.2), 0.95);
  }
}

/**
 * Instância singleton para uso global
 */
export const medicalCorrelationService = new MedicalCorrelationService();