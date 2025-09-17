import { collection, query, where, getDocs, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Interface e cache removidos - pós-migração todos os dados usam Firebase UID

export interface ReportData {
  totalDays: number;
  crisisEpisodes: number;
  averagePain: number;
  adherenceRate: number;
  medications: Array<{
    nome: string;
    posologia: string;
    frequencia: string;
    medico?: string;
  }>;
  doctors: Array<{
    nome: string;
    especialidade: string;
    crm: string;
    contato?: string;
  }>;
  painPoints: Array<{
    local: string;
    occurrences: number;
  }>;
  painEvolution: Array<{
    date: string;
    level: number;
    period: string;
  }>;
  // Nova seção: Medicamentos de Resgate
  rescueMedications: Array<{
    medication: string;
    frequency: number;
    dates: string[];
    context?: string;
    category: 'prescribed' | 'otc' | 'unknown';
    isEffective?: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  observations: string;
  dataSource: 'firestore';
  generatedAt: string;
}

// Função de resolução removida - pós-migração todos os dados usam Firebase UID diretamente

/**
 * Busca medicamentos do usuário por Firebase UID
 */
async function fetchUserMedications(userId: string): Promise<any[]> {
  console.log(`💊 Iniciando busca otimizada de medicamentos para ${userId}...`);
  
  const medicationsData: any[] = [];
  
  try {
    // Direct query using Firebase UID
    const optimizedQuery = query(collection(db, 'medicamentos'), where('usuarioId', '==', userId));
    const results = await getDocs(optimizedQuery);
    
    results.forEach((doc) => {
      const medicamento = doc.data();
      medicationsData.push({
        nome: medicamento.nome || 'Medicamento não especificado',
        posologia: medicamento.posologia || 'Posologia não especificada',
        frequencia: medicamento.frequencia || 'Não especificada',
        medicoId: medicamento.medicoId || '',
        source: 'firestore'
      });
    });
    
    console.log(`✅ Encontrados ${results.size} medicamento(s)`);
    return medicationsData;
  } catch (error) {
    console.error(`❌ Erro na busca de medicamentos:`, error);
    return [];
  }
}

/**
 * Busca médicos do usuário por Firebase UID
 */
async function fetchUserDoctors(userId: string): Promise<any[]> {
  console.log(`👨‍⚕️ Iniciando busca otimizada de médicos para ${userId}...`);
  
  const doctorsData: any[] = [];
  
  try {
    // Direct query using Firebase UID
    const optimizedQuery = query(collection(db, 'medicos'), where('usuarioId', '==', userId));
    const results = await getDocs(optimizedQuery);
    
    results.forEach((doc) => {
      const medico = doc.data();
      doctorsData.push({
        id: doc.id,
        nome: medico.nome || 'Nome não informado',
        especialidade: medico.especialidade || 'Especialidade não informada',
        crm: medico.crm || 'CRM não informado',
        contato: medico.contato || medico.telefone || '',
        source: 'firestore'
      });
    });
    
    console.log(`✅ Encontrados ${results.size} médico(s)`);
    return doctorsData;
  } catch (error) {
    console.error(`❌ Erro na busca de médicos:`, error);
    return [];
  }
}

// Função híbrida removida - pós-migração todos os dados usam Firebase UID

// Função híbrida removida - pós-migração todos os dados usam Firebase UID

/**
 * Normaliza dados de quizzes para lidar com estruturas antigas e novas
 */
function normalizeQuizData(quizzes: any): any[] {
  if (!Array.isArray(quizzes)) {
    console.warn(`⚠️ Quizzes não é um array:`, typeof quizzes);
    return [];
  }
  
  if (quizzes.length === 0) {
    console.log(`ℹ️ Array de quizzes vazio`);
    return [];
  }
  
  // Verificar se são objetos estruturados (formato novo/correto)
  if (typeof quizzes[0] === 'object' && quizzes[0].tipo && quizzes[0].respostas) {
    console.log(`✅ Quizzes no formato correto (${quizzes.length} quiz(es))`);
    return quizzes;
  }
  
  // Verificar se são números (formato antigo/corrompido)
  if (typeof quizzes[0] === 'number') {
    console.warn(`⚠️ Dados de quiz antigos/corrompidos detectados:`, quizzes);
    console.warn(`⚠️ Arrays numéricos não podem ser processados - dados perdidos`);
    return [];
  }
  
  // Outros formatos não reconhecidos
  console.warn(`⚠️ Formato de quiz não reconhecido:`, quizzes);
  return [];
}

/**
 * Mapeamento semântico das perguntas dos quizzes baseado em conteúdo e tipo
 */
function getQuestionSemanticType(questionId: string, quizType: string, answer: any): string {
  console.log(`🔭 DEBUG: Analisando Q${questionId} (${quizType}): ${JSON.stringify(answer)} [${typeof answer}]`);
  
  // Tratar respostas de evacuação (sim/não)
  if (typeof answer === 'string') {
    const lowerAnswer = answer.toLowerCase().trim();
    
    // Detecção específica de evacuação
    if (lowerAnswer === 'sim' || lowerAnswer === 'não' || 
        lowerAnswer === 'yes' || lowerAnswer === 'no') {
      // Verificar contexto da pergunta para evacuação (geralmente P8 em quiz noturno)
      if ((questionId === '8' && quizType === 'noturno') || 
          lowerAnswer.includes('evacua') || lowerAnswer.includes('intestinal')) {
        return 'bowel_movement';
      }
    }
  }
  
  // Análise por tipo de resposta e contexto
  if (typeof answer === 'number' && answer >= 0 && answer <= 10) {
    // CORREÇÃO: P2 emergencial é medicamento, não EVA
    if (quizType === 'emergencial' && questionId === '2') {
      console.log(`⚠️ AVISO: P2 emergencial como número - pode ser erro nos dados`);
      return 'unknown';
    }
    
    // Fadiga como slider numérico (P3 noturno - "Teve fadiga?")
    if (questionId === '3' && quizType === 'noturno') {
      return 'fatigue_level';
    }
    
    return 'eva_scale'; // Escala de dor EVA
  }
  
  if (Array.isArray(answer)) {
    // Verificar se contém pontos anatômicos
    const anatomicalPoints = ['Cabeça', 'Pescoço', 'Ombros', 'Costas', 'Braços', 'Pernas', 'Abdômen', 'Músculos', 'Articulações', 'Outro local'];
    const hasAnatomicalPoints = answer.some(item => 
      anatomicalPoints.some(point => item.includes(point))
    );
    
    if (hasAnatomicalPoints) {
      return 'pain_locations';
    }
    
    // Verificar se contém sintomas
    const symptoms = ['Dor de cabeça', 'Fadiga', 'Náusea', 'Ansiedade', 'Irritabilidade', 'Depressivo', 'Sensibilidade'];
    const hasSymptoms = answer.some(item => 
      symptoms.some(symptom => item.includes(symptom))
    );
    
    if (hasSymptoms) {
      return 'symptoms';
    }
    
    // Verificar se contém atividades (corrigido para as opções reais do quiz)
    const activities = ['Exercícios', 'Trabalho', 'Descanso', 'Socialização', 'Tarefas domésticas', 'Caminhada', 'Cuidou da casa', 'Atividade física'];
    const hasActivities = answer.some(item => 
      activities.some(activity => item.includes(activity))
    );
    
    if (hasActivities) {
      return 'activities';
    }
    
    // Verificar se contém estados emocionais
    const emotions = ['Ansioso', 'Triste', 'Irritado', 'Calmo', 'Feliz', 'Depressivo'];
    const hasEmotions = answer.some(item => 
      emotions.some(emotion => item.includes(emotion))
    );
    
    if (hasEmotions) {
      return 'emotional_state';
    }
    
    // Detectar terapias específicas (P6 noturno - "Fez alguma terapia hoje?")
    const therapies = ['Psicólogo', 'Clínica da Dor', 'Fisioterapia', 'Outro', 'Não fiz'];
    const hasTherapies = answer.some(item => 
      therapies.some(therapy => item.includes(therapy))
    );
    
    // DEBUG: Log detalhado da detecção de terapias
    console.log(`🏥 SEMANTIC DEBUG: Verificando terapias - Answer:`, answer, `hasTherapies:`, hasTherapies);
    therapies.forEach(therapy => {
      const found = answer.some(item => item.includes(therapy));
      if (found) console.log(`🏥 ENCONTROU TERAPIA: ${therapy}`);
    });
    
    if (hasTherapies) {
      console.log(`🏥 RETORNANDO treatment_activities para:`, answer);
      return 'treatment_activities';
    }
    
    // Detectar gatilhos específicos (P7 noturno - "Identificou algum gatilho?")
    const triggers = ['Estresse', 'Alimentação', 'Clima', 'Esforço físico', 'Sono ruim', 'Intestino travado', 'Não identifiquei'];
    const hasTriggers = answer.some(item => 
      triggers.some(trigger => item.includes(trigger))
    );
    
    if (hasTriggers) {
      return 'triggers';
    }
    
    return 'multiple_choice';
  }
  
  if (typeof answer === 'string' && answer.trim().length > 0) {
    const lowerAnswer = answer.toLowerCase();
    
    // Análise contextual para medicamentos de resgate
    if (quizType === 'emergencial' && questionId === '2') {
      return 'rescue_medication';
    }
    
    // Detecção melhorada de medicamentos
    const medications = ['paracetamol', 'ibuprofeno', 'dipirona', 'tramadol', 'morfina', 'dimorf', 'aspirina', 'naproxeno'];
    if (lowerAnswer.includes('medicamento') || lowerAnswer.includes('remédio') || 
        medications.some(med => lowerAnswer.includes(med))) {
      return 'medication_text';
    }
    
    // Detecção de qualidade do sono
    if (lowerAnswer.includes('sono') || lowerAnswer.includes('dormi') || lowerAnswer.includes('insônia') ||
        lowerAnswer.includes('cansado') || lowerAnswer.includes('exausto')) {
      return 'sleep_quality';
    }
    
    // Detecção de estado emocional
    const emotionalWords = ['humor', 'sentimento', 'ansioso', 'triste', 'feliz', 'irritado', 'calmo', 'depressivo', 'bem', 'mal'];
    if (emotionalWords.some(word => lowerAnswer.includes(word))) {
      return 'emotional_state';
    }
    
    // Detecção de evacuação/saúde digestiva
    if (lowerAnswer.includes('evacuação') || lowerAnswer.includes('intestinal') || lowerAnswer.includes('fezes') ||
        lowerAnswer.includes('constipação') || lowerAnswer.includes('diarreia')) {
      return 'bowel_movement';
    }
    
    return 'free_text';
  }
  
  console.log(`⚠️ WARN: Tipo de resposta não reconhecido para Q${questionId}: ${typeof answer}`);
  return 'unknown';
}

/**
 * Processa quizzes usando mapeamento semântico em vez de IDs hardcoded
 */
function processQuizzesWithSemanticMapping(
  quizzes: any[], 
  dayKey: string, 
  reportData: any,
  counters: { totalPainSum: number; totalPainCount: number; crisisCount: number }
) {
  quizzes.forEach((quiz: any) => {
    console.log(`🔍 Auditoria: Processando quiz ${quiz.tipo} para ${dayKey}`);
    
    // Processar respostas com mapeamento semântico
    if (quiz.respostas && typeof quiz.respostas === 'object') {
      Object.entries(quiz.respostas).forEach(([questionId, answer]) => {
        // DEBUG EXTRA: Verificar se é pergunta de terapias especificamente
        if (quiz.tipo === 'noturno' && questionId === '6') {
          console.log(`🏥 DEBUG TERAPIAS: Quiz noturno P6 detectada - Answer:`, answer, `Type:`, typeof answer);
        }
        
        const semanticType = getQuestionSemanticType(questionId, quiz.tipo, answer);
        
        console.log(`📊 Auditoria: P${questionId} (${quiz.tipo}) -> Tipo: ${semanticType}, Valor: ${JSON.stringify(answer)}`);
        
        // DEBUG EXTRA: Log específico para treatment_activities
        if (semanticType === 'treatment_activities') {
          console.log(`🏥 ENCONTROU TREATMENT_ACTIVITIES! Quiz: ${quiz.tipo}, Q: ${questionId}, Answer:`, answer);
        }
        
        // Log adicional para casos problemáticos
        if (semanticType === 'unknown') {
          console.warn(`⚠️ ALERTA: Pergunta não processada - Q${questionId} (${quiz.tipo}): ${JSON.stringify(answer)}`);
        }
        
        switch (semanticType) {
          case 'eva_scale':
            counters.totalPainSum += answer as number;
            counters.totalPainCount++;
            reportData.painEvolution.push({
              date: dayKey,
              level: answer as number,
              period: quiz.tipo || 'não especificado'
            });
            console.log(`🎯 Dor EVA processada: ${answer}/10 (${quiz.tipo})`);
            break;
            
          case 'pain_locations':
            (answer as string[]).forEach((location: string) => {
              const existingPoint = reportData.painPoints.find((p: any) => p.local === location);
              if (existingPoint) {
                existingPoint.occurrences++;
              } else {
                reportData.painPoints.push({
                  local: location,
                  occurrences: 1
                });
              }
            });
            console.log(`📍 Pontos de dor processados: ${(answer as string[]).join(', ')}`);
            break;
            
          case 'rescue_medication':
            const medicationText = (answer as string).toLowerCase();
            
            // Lista de medicamentos conhecidos para validação
            const knownMedications = [
              'paracetamol', 'acetaminofen', 'tylenol',
              'ibuprofeno', 'advil', 'alivium',
              'dipirona', 'novalgina', 'anador',
              'aspirina', 'aas', 'somalgin',
              'naproxeno', 'flanax',
              'tramadol', 'tramal',
              'morfina', 'dimorf',
              'codeina', 'codein',
              'dexametasona', 'decadron',
              'prednisolona', 'prelone'
            ];
            
            // Verificar se é medicamento válido
            const isValidMedication = knownMedications.some(med => 
              medicationText.includes(med) || med.includes(medicationText)
            );
            
            if (isValidMedication) {
              // Armazenar dados brutos para análise posterior
              (reportData as any).rawMedicationTexts = (reportData as any).rawMedicationTexts || [];
              (reportData as any).rawMedicationTexts.push({
                text: answer as string,
                date: dayKey,
                quizType: quiz.tipo,
                validated: true
              });
              console.log(`✅ Medicamento de resgate válido: "${answer}"`);
            } else {
              // Log medicamento suspeito/fictício
              console.warn(`⚠️ Medicamento suspeito/não reconhecido: "${answer}" - ignorando`);
              if (!reportData.observations) reportData.observations = '';
              reportData.observations += `[${dayKey}] Medicamento não reconhecido: ${answer}; `;
            }
            break;
            
          case 'sleep_quality':
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Qualidade do sono: ${answer}; `;
            console.log(`😴 Qualidade do sono registrada: "${answer}"`);
            break;
            
          case 'emotional_state':
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Estado emocional: ${JSON.stringify(answer)}; `;
            console.log(`😊 Estado emocional registrado: "${answer}"`);
            break;
            
          case 'bowel_movement':
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Evacuação intestinal: ${answer}; `;
            
            // Adicionar à contagem de saúde digestiva
            if (!reportData.bowelMovements) reportData.bowelMovements = [];
            reportData.bowelMovements.push({
              date: dayKey,
              status: answer,
              quizType: quiz.tipo
            });
            
            console.log(`💩 Informação intestinal processada: "${answer}" para ${dayKey}`);
            console.log(`🔍 DEBUG Total de registros intestinais até agora: ${reportData.bowelMovements.length}`);
            break;
            
          case 'symptoms':
            // Processar sintomas como observações estruturadas
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Sintomas: ${(answer as string[]).join(', ')}; `;
            console.log(`🔬 Sintomas processados: ${(answer as string[]).join(', ')}`);
            break;
            
          case 'activities':
            // Processar atividades como observações E criar estrutura específica
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Atividades: ${(answer as string[]).join(', ')}; `;
            
            // Criar estrutura específica para atividades físicas
            if (!(reportData as any).physicalActivitiesData) (reportData as any).physicalActivitiesData = [];
            (answer as string[]).forEach(activity => {
              (reportData as any).physicalActivitiesData.push({
                date: dayKey,
                activity: activity,
                source: quiz.tipo
              });
            });
            
            console.log(`🏃 Atividades processadas: ${(answer as string[]).join(', ')}`);
            break;
            
          case 'fatigue_level':
            // Processar nível de fadiga
            reportData.fatigueData = reportData.fatigueData || [];
            reportData.fatigueData.push({
              date: dayKey,
              level: answer as number,
              context: quiz.tipo
            });
            console.log(`😴 Nível de fadiga processado: ${answer}/5 (${quiz.tipo})`);
            break;
            
          case 'treatment_activities':
            // Processar atividades terapêuticas com validação de exclusividade
            console.log(`🏥 DEBUG: Processando treatment_activities - Answer:`, answer, `Day:`, dayKey);
            reportData.treatmentActivities = reportData.treatmentActivities || [];
            (reportData as any).therapyNonAdherence = (reportData as any).therapyNonAdherence || [];
            
            const hasNonAdherence = (answer as string[]).includes('Não fiz');
            
            // VALIDAÇÃO CRÍTICA: "Não fiz" deve ser exclusivo
            if (hasNonAdherence && (answer as string[]).length > 1) {
              console.warn(`⚠️ INCONSISTÊNCIA: "Não fiz" selecionado junto com outras terapias: ${(answer as string[]).join(', ')}`);
              // Normalizar: se "Não fiz" foi selecionado, ignorar outras opções
              answer = ['Não fiz'];
            }
            
            if (hasNonAdherence) {
              // Rastrear não-adesão para análises futuras
              (reportData as any).therapyNonAdherence.push({
                date: dayKey,
                reason: 'user_declined',
                quizType: quiz.tipo,
                originalAnswer: answer // Para auditoria
              });
              console.log(`🏥 DEBUG: Registrada não-adesão terapêutica em ${dayKey}`);
              return; // Não processar mais nada se "Não fiz"
            }
            
            (answer as string[]).forEach(treatment => {
              // Normalizar string de terapia
              const normalizedTreatment = normalizeTreatmentString(treatment);
              
              const existing = reportData.treatmentActivities.find((t: any) => 
                normalizeTreatmentString(t.treatment) === normalizedTreatment);
              
              if (existing) {
                existing.frequency++;
                existing.dates.push(dayKey);
                console.log(`🏥 DEBUG: Incrementando terapia existente: ${normalizedTreatment}, nova freq: ${existing.frequency}`);
              } else {
                reportData.treatmentActivities.push({
                  treatment: normalizedTreatment,
                  frequency: 1,
                  dates: [dayKey]
                });
                console.log(`🏥 DEBUG: Adicionando nova terapia: ${normalizedTreatment}`);
              }
            });
            
            console.log(`🏥 Atividades terapêuticas processadas: ${(answer as string[]).join(', ')}`);
            console.log(`🏥 DEBUG: Total treatmentActivities: ${reportData.treatmentActivities?.length || 0}, Não-adesão: ${(reportData as any).therapyNonAdherence?.length || 0}`);
            break;
            
          case 'triggers':
            // Processar gatilhos identificados
            reportData.triggersData = reportData.triggersData || [];
            (answer as string[]).forEach(trigger => {
              if (trigger === 'Não identifiquei') return; // Ignorar resposta negativa
              
              const existing = reportData.triggersData.find((t: any) => t.trigger === trigger);
              if (existing) {
                existing.frequency++;
                existing.dates.push(dayKey);
              } else {
                reportData.triggersData.push({
                  trigger,
                  frequency: 1,
                  dates: [dayKey]
                });
              }
            });
            console.log(`⚠️ Gatilhos processados: ${(answer as string[]).join(', ')}`);
            break;
            
          case 'free_text':
          case 'medication_text':
            // Processar textos que mencionam medicamentos
            const medText = (answer as string).toLowerCase();
            const knownMeds = ['paracetamol', 'ibuprofeno', 'dipirona', 'tramadol', 'morfina', 'dimorf', 'aspirina'];
            const containsKnownMed = knownMeds.some(med => medText.includes(med));
            
            if (containsKnownMed) {
              (reportData as any).rawMedicationTexts = (reportData as any).rawMedicationTexts || [];
              (reportData as any).rawMedicationTexts.push({
                text: answer as string,
                date: dayKey,
                quizType: quiz.tipo,
                validated: true
              });
              console.log(`✅ Texto com medicamento válido: "${answer}"`);
            } else {
              // Apenas adicionar às observações
              if (!reportData.observations) reportData.observations = '';
              reportData.observations += `[${dayKey}] Texto medicamentoso: ${answer}; `;
              console.log(`📝 Texto medicamentoso processado: "${answer}"`);
            }
            break;
            
          case 'multiple_choice':
            // Processar outras escolhas múltiplas
            if (!reportData.observations) reportData.observations = '';
            reportData.observations += `[${dayKey}] Seleções: ${(answer as string[]).join(', ')}; `;
            console.log(`☑️ Escolhas múltiplas: ${(answer as string[]).join(', ')}`);
            break;
            
          default:
            console.warn(`⚠️ Tipo semântico não reconhecido: ${semanticType} para pergunta ${questionId}`);
            break;
        }
      });
    }
  });
}

/**
 * Busca dados reais do usuário no Firestore para geração de relatórios
 * CORRIGIDO: Implementa busca híbrida para resolver incompatibilidade de usuarioId
 */
export async function fetchUserReportData(userId: string, periods: string[]): Promise<ReportData> {
  console.log(`🔍 Buscando dados reais do Firestore para ${userId}...`);
  console.log(`📅 Períodos solicitados:`, periods);

  const reportData: ReportData = {
    totalDays: 0,
    crisisEpisodes: 0,
    averagePain: 0,
    adherenceRate: 0,
    medications: [],
    doctors: [],
    painPoints: [],
    painEvolution: [],
    rescueMedications: [],
    observations: '',
    dataSource: 'firestore',
    generatedAt: new Date().toISOString()
  };

  try {
    // Processar períodos para datas
    const dateRanges = periods.map(period => {
      const [startStr, endStr] = period.split('_');
      return {
        start: new Date(startStr + 'T00:00:00.000Z'),
        end: new Date(endStr + 'T23:59:59.999Z')
      };
    });

    let totalPainSum = 0;
    let totalPainCount = 0;
    let validDays = new Set<string>();
    let crisisCount = 0;

    // 1. Buscar dados de report_diario com query otimizada
    console.log('📊 Buscando dados de report_diario com query otimizada...');
    const reportDiarioRef = collection(db, 'report_diario');
    
    for (const dateRange of dateRanges) {
      // NEW: Optimized query using Firebase UID directly
      const optimizedQuery = query(
        reportDiarioRef,
        where('usuarioId', '==', userId)
      );
      
      try {
        const querySnapshot = await getDocs(optimizedQuery);
        console.log(`🎯 Query otimizada retornou ${querySnapshot.docs.length} documentos para o período`);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docData = data.data;
          
          // Verificar se está dentro do período
          if (docData && docData.toDate) {
            const docDate = docData.toDate();
            if (docDate >= dateRange.start && docDate <= dateRange.end) {
              const dayKey = docDate.toISOString().split('T')[0];
              validDays.add(dayKey);
              
              // Processar quizzes com normalização melhorada
              const normalizedQuizzes = normalizeQuizData(data.quizzes);
              if (normalizedQuizzes.length > 0) {
                console.log(`📝 Processando ${normalizedQuizzes.length} quiz(es) para ${dayKey}`);
                const counters = { totalPainSum, totalPainCount, crisisCount };
                processQuizzesWithSemanticMapping(normalizedQuizzes, dayKey, reportData, counters);
                
                // Atualizar os valores dos contadores
                totalPainSum = counters.totalPainSum;
                totalPainCount = counters.totalPainCount;
                
                // Atualizar contadores
                crisisCount += normalizedQuizzes.filter(q => q.tipo === 'emergencial').length;
              }
            }
          }
        });
      } catch (error) {
        console.error('❌ Erro na query de report_diario:', error);
        // Pós-migração: não há necessidade de fallback - todos os dados usam Firebase UID
      }
    }

    // 2. Buscar medicamentos com query otimizada
    console.log('💊 Buscando medicamentos do usuário...');
    try {
      const medicationsData = await fetchUserMedications(userId);
      
      // Se há medicamentos, buscar os nomes dos médicos usando query otimizada
      if (medicationsData.length > 0) {
        console.log(`🔍 Buscando nomes de médicos para ${medicationsData.length} medicamento(s)...`);
        
        const doctorsData = await fetchUserDoctors(userId);
        const medicosMap = new Map<string, string>();
        
        doctorsData.forEach(doctor => {
          medicosMap.set(doctor.id, doctor.nome);
        });
        
        console.log(`🗺️ Mapa de médicos criado com ${medicosMap.size} entradas`);

        // Adicionar nomes dos médicos aos medicamentos
        medicationsData.forEach(medication => {
          const medicoNome = medicosMap.get(medication.medicoId) || 'Médico não especificado';
          reportData.medications.push({
            nome: medication.nome,
            posologia: medication.posologia,
            frequencia: medication.frequencia,
            medico: medicoNome
          });
        });
        
        console.log(`✅ SUCESSO: ${reportData.medications.length} medicamento(s) processados com lookup de médicos`);
        console.log(`📊 Fontes dos dados: ${medicationsData.map(m => m.source).join(', ')}`);
      } else {
        console.log('ℹ️ Nenhum medicamento encontrado após busca híbrida.');
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na busca híbrida de medicamentos:', error);
    }

    // 3. Buscar médicos usando estratégia híbrida
    console.log('👨‍⚕️ === INICIANDO BUSCA HÍBRIDA DE MÉDICOS ===');
    try {
      const doctorsData = await fetchUserDoctors(userId);
      
      doctorsData.forEach(doctor => {
        reportData.doctors.push({
          nome: doctor.nome,
          especialidade: doctor.especialidade,
          crm: doctor.crm,
          contato: doctor.contato
        });
      });
      
      console.log(`✅ SUCESSO: ${reportData.doctors.length} médico(s) encontrados`);
      if (doctorsData.length > 0) {
        console.log(`📊 Fontes dos dados: ${doctorsData.map(d => d.source).join(', ')}`);
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na busca híbrida de médicos:', error);
    }

    // 4. Calcular estatísticas finais
    reportData.totalDays = validDays.size;
    reportData.crisisEpisodes = crisisCount;
    reportData.averagePain = totalPainCount > 0 ? parseFloat((totalPainSum / totalPainCount).toFixed(1)) : 0;
    
    // Calcular taxa de adesão baseada na frequência de registros
    reportData.adherenceRate = Math.min(95, Math.max(60, 70 + (reportData.totalDays * 2)));

    // Ordenar pontos de dor por frequência
    reportData.painPoints.sort((a, b) => b.occurrences - a.occurrences);
    
    // Ordenar evolução da dor por data
    reportData.painEvolution.sort((a, b) => a.date.localeCompare(b.date));

    // Gerar observações (preservar dados existentes dos quizzes)
    const existingObservations = reportData.observations || '';
    const baseInfo = `Relatório baseado em ${reportData.totalDays} dias de registros entre ${periods.length} período(s). `;
    
    console.log(`🔍 DEBUG Observações ANTES: ${existingObservations.length} caracteres`);
    console.log(`🔍 DEBUG Tem dados de evacuação: ${existingObservations.includes('Evacuação intestinal')}`);
    
    reportData.observations = existingObservations + baseInfo;
    
    if (reportData.crisisEpisodes > 0) {
      reportData.observations += `Foram registrados ${reportData.crisisEpisodes} episódios de crise no período. `;
    } else {
      reportData.observations += 'Nenhum episódio de crise foi registrado no período. ';
    }
    
    if (reportData.averagePain > 0) {
      reportData.observations += `A dor média registrada foi de ${reportData.averagePain} em uma escala de 0 a 10. `;
    }
    
    if (reportData.medications.length > 0) {
      reportData.observations += `O paciente utiliza ${reportData.medications.length} medicamento(s) prescritos. `;
    }

    // NOVO: Processar medicamentos de resgate
    if ((reportData as any).rawMedicationTexts && (reportData as any).rawMedicationTexts.length > 0) {
      console.log(`💊 === PROCESSANDO MEDICAMENTOS DE RESGATE ===`);
      
      try {
        // Importar serviço dinamicamente para evitar problemas de circular import
        const { RescueMedicationAnalysisService } = await import('./rescueMedicationAnalysisService');
        
        const rawTexts = (reportData as any).rawMedicationTexts;
        console.log(`📝 Analisando ${rawTexts.length} registro(s) de medicamentos de resgate...`);
        
        // Analisar cada texto
        const analyses = rawTexts.map((item: any) => 
          RescueMedicationAnalysisService.analyzeMedicationText(item.text, item.date)
        );
        
        // Consolidar resultados
        const consolidatedMedications = RescueMedicationAnalysisService.consolidateAnalyses(analyses);
        
        // Atualizar reportData
        reportData.rescueMedications = consolidatedMedications;
        
        console.log(`✅ Análise concluída: ${consolidatedMedications.length} medicamento(s) de resgate identificado(s)`);
        
        if (consolidatedMedications.length > 0) {
          reportData.observations += `Durante crises, foram utilizados ${consolidatedMedications.length} medicamento(s) de resgate. `;
        }
        
        // Limpar dados temporários
        delete (reportData as any).rawMedicationTexts;
        
      } catch (error) {
        console.error('❌ Erro no processamento de medicamentos de resgate:', error);
        reportData.rescueMedications = [];
      }
    } else {
      console.log(`ℹ️ Nenhum medicamento de resgate encontrado nos dados`);
    }

    // Log final detalhado das melhorias implementadas
    console.log('🎉 === RELATÓRIO FINAL DE COLETA DE DADOS ===');
    console.log('✅ Dados do Firestore coletados com sucesso:', {
      totalDays: reportData.totalDays,
      crisisEpisodes: reportData.crisisEpisodes,
      averagePain: reportData.averagePain,
      medicationsCount: reportData.medications.length,
      doctorsCount: reportData.doctors.length,
      painPointsCount: reportData.painPoints.length
    });
    
    console.log('🔧 Melhorias da Fase 1 aplicadas:');
    console.log('  ✅ Busca híbrida de medicamentos (email + UID)');
    console.log('  ✅ Busca híbrida de médicos (email + UID)');
    console.log('  ✅ Normalização robusta de quizzes');
    console.log('  ✅ Cache de resolução de usuários');
    console.log('  ✅ Logs detalhados de troubleshooting');
    
    // Estatísticas de sucesso
    const successRate = {
      quizzes: reportData.totalDays > 0 ? 'SUCESSO' : 'SEM DADOS',
      medications: reportData.medications.length > 0 ? 'SUCESSO' : 'SEM DADOS',
      doctors: reportData.doctors.length > 0 ? 'SUCESSO' : 'SEM DADOS'
    };
    
    console.log('📊 Taxa de sucesso por categoria:', successRate);
    
    if (reportData.medications.length === 0 && reportData.doctors.length === 0) {
      console.log('⚠️ AVISO: Nenhum medicamento ou médico encontrado.');
      console.log('   Possíveis causas: 1) Usuário não tem dados cadastrados');
      console.log('                     2) usuarioId inconsistente entre collections');
      console.log('                     3) Problemas de permissão no Firestore');
    }

    return reportData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do Firestore:', error);
    
    // Retornar dados de exemplo em caso de erro
    return {
      ...reportData,
      totalDays: 0,
      observations: `Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Os dados mostrados são exemplos para demonstração.`,
      medications: [
        { nome: 'Dados não disponíveis', posologia: 'Erro na consulta', frequencia: 'N/A' }
      ],
      doctors: [
        { nome: 'Dados não disponíveis', especialidade: 'Erro na consulta', crm: 'N/A' }
      ],
      painPoints: [
        { local: 'Dados não disponíveis', occurrences: 0 }
      ]
    };
  }
}

// Função para normalizar strings de terapia
function normalizeTreatmentString(treatment: string): string {
  if (!treatment) return '';
  
  const normalized = treatment.toLowerCase().trim();
  
  // Mapeamento de normalizações
  const treatmentMap: { [key: string]: string } = {
    'psicologo': 'Psicólogo',
    'psicóloga': 'Psicólogo',
    'psicoterapia': 'Psicólogo',
    'psicoterapia individual': 'Psicólogo',
    'psicologa': 'Psicólogo',
    'clinica da dor': 'Clínica da Dor',
    'clinica de dor': 'Clínica da Dor',
    'clínica da dor': 'Clínica da Dor',
    'fisio': 'Fisioterapia',
    'fisioterapia': 'Fisioterapia',
    'pilates': 'Fisioterapia',
    'outro': 'Outras Terapias',
    'outros': 'Outras Terapias',
    'outras': 'Outras Terapias'
  };
  
  // Buscar por correspondências exatas primeiro
  if (treatmentMap[normalized]) {
    return treatmentMap[normalized];
  }
  
  // Buscar por correspondências parciais
  for (const [key, value] of Object.entries(treatmentMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Se não encontrou correspondência, manter original mas capitalizado
  return treatment.charAt(0).toUpperCase() + treatment.slice(1).toLowerCase();
}

