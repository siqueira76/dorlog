/**
 * Firestore Data Fetching Service for Cloud Functions
 * 
 * Busca dados do Firestore para geração de relatórios server-side
 */

import * as admin from 'firebase-admin';

export interface ReportData {
  totalDays: number;
  crisisEpisodes: number;
  averagePain: number;
  medications: any[];
  doctors: any[];
  quizData: any[];
  painPoints: any[];
  evacuations: any[];
  rescueMedications: any[];
}

/**
 * Busca todos os dados necessários para gerar um relatório
 */
export async function fetchUserReportData(
  userId: string,
  periods: string[]
): Promise<ReportData> {
  console.log(`🔍 Buscando dados para ${userId}, períodos:`, periods);
  
  const db = admin.firestore();
  const startTime = Date.now();

  try {
    // 1. Buscar quizzes do período
    const quizData = await fetchQuizData(db, userId, periods);
    console.log(`✅ Quizzes: ${quizData.length} registros`);

    // 2. Buscar medicamentos e médicos em PARALELO
    const [medications, doctors] = await Promise.all([
      fetchMedications(db, userId),
      fetchDoctors(db, userId)
    ]);
    console.log(`✅ Medicamentos: ${medications.length}, Médicos: ${doctors.length}`);

    // 3. Processar dados de quiz para extrair informações
    const { 
      totalDays,
      crisisEpisodes,
      averagePain,
      painPoints,
      evacuations,
      rescueMedications
    } = processQuizData(quizData);

    const elapsed = Date.now() - startTime;
    console.log(`⚡ Dados coletados em ${elapsed}ms`);

    return {
      totalDays,
      crisisEpisodes,
      averagePain,
      medications,
      doctors,
      quizData,
      painPoints,
      evacuations,
      rescueMedications
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    throw error;
  }
}

/**
 * Busca dados de quizzes (report_diario)
 */
async function fetchQuizData(
  db: admin.firestore.Firestore,
  userId: string,
  periods: string[]
): Promise<any[]> {
  const reportRef = db.collection('report_diario');
  const allData: any[] = [];

  // Buscar dados de cada período
  for (const period of periods) {
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const snapshot = await reportRef
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'desc')
      .get();

    snapshot.forEach(doc => {
      allData.push({ id: doc.id, ...doc.data() });
    });
  }

  return allData;
}

/**
 * Busca medicamentos do usuário
 */
async function fetchMedications(
  db: admin.firestore.Firestore,
  userId: string
): Promise<any[]> {
  const snapshot = await db
    .collection('medicamentos')
    .where('userId', '==', userId)
    .get();

  const medications: any[] = [];
  snapshot.forEach(doc => {
    medications.push({ id: doc.id, ...doc.data() });
  });

  return medications;
}

/**
 * Busca médicos do usuário
 */
async function fetchDoctors(
  db: admin.firestore.Firestore,
  userId: string
): Promise<any[]> {
  const snapshot = await db
    .collection('medicos')
    .where('userId', '==', userId)
    .get();

  const doctors: any[] = [];
  snapshot.forEach(doc => {
    doctors.push({ id: doc.id, ...doc.data() });
  });

  return doctors;
}

/**
 * Processa dados de quiz para extrair métricas
 */
function processQuizData(quizData: any[]): {
  totalDays: number;
  crisisEpisodes: number;
  averagePain: number;
  painPoints: any[];
  evacuations: any[];
  rescueMedications: any[];
} {
  const totalDays = quizData.length;
  let totalPain = 0;
  let crisisEpisodes = 0;
  const painPoints: any[] = [];
  const evacuations: any[] = [];
  const rescueMedications: any[] = [];

  quizData.forEach(day => {
    // Dor média
    const pain = day.evaScale || day.eva_scale || 0;
    totalPain += pain;

    // Crises (dor >= 7)
    if (pain >= 7) {
      crisisEpisodes++;
    }

    // Pontos de dor
    if (day.pain_locations || day.painLocations) {
      const locations = day.pain_locations || day.painLocations;
      if (Array.isArray(locations)) {
        painPoints.push(...locations);
      }
    }

    // Evacuações
    if (day.bowel_movement || day.bowelMovement) {
      evacuations.push({
        date: day.timestamp,
        ...day.bowel_movement || day.bowelMovement
      });
    }

    // Medicamentos de resgate
    if (day.rescue_medication || day.rescueMedication) {
      rescueMedications.push({
        date: day.timestamp,
        ...day.rescue_medication || day.rescueMedication
      });
    }
  });

  const averagePain = totalDays > 0 ? totalPain / totalDays : 0;

  return {
    totalDays,
    crisisEpisodes,
    averagePain,
    painPoints,
    evacuations,
    rescueMedications
  };
}

/**
 * Resolve UID para email (para buscar assinatura)
 */
export async function resolveUIDToEmail(userId: string): Promise<string> {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('usuarios').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.email || '';
    }

    // Fallback: tentar pelo Firebase Auth
    const userRecord = await admin.auth().getUser(userId);
    return userRecord.email || '';

  } catch (error) {
    console.error('❌ Erro ao resolver UID:', error);
    throw error;
  }
}
