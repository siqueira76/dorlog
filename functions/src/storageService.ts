/**
 * Firebase Storage Service for Cloud Functions
 * 
 * Faz upload de relatórios HTML para Firebase Storage
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

/**
 * Gera ID único para relatório
 */
export function generateReportId(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(3).toString('hex');
  const userPrefix = userId.substring(0, 6);
  
  return `${userPrefix}_${timestamp}_${random}`;
}

/**
 * Gera hash seguro de senha para proteção de relatório
 * 
 * Usa SHA-256 com salt aleatório para segurança
 */
export function generatePasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  // Retorna salt:hash para poder verificar depois
  return `${salt}:${hash}`;
}

/**
 * Verifica se senha bate com hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const testHash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  return testHash === hash;
}

/**
 * Upload de relatório HTML para Storage (PRIVADO com signed URL)
 * 
 * SEGURANÇA:
 * - NÃO torna arquivo público (contém dados médicos confidenciais)
 * - Gera signed URL com 7 dias de validade
 * - Apenas quem tem o link pode acessar
 */
export async function uploadReportToStorage(
  reportId: string,
  htmlContent: string,
  userId: string
): Promise<{ url: string; fileName: string }> {
  console.log(`📤 Fazendo upload do relatório ${reportId}...`);
  
  const bucket = admin.storage().bucket();
  const fileName = `reports/${userId}/${reportId}.html`;
  const file = bucket.file(fileName);

  try {
    // Upload do HTML (NÃO PUBLIC)
    await file.save(htmlContent, {
      metadata: {
        contentType: 'text/html; charset=utf-8',
        cacheControl: 'private, max-age=604800', // 7 dias, PRIVATE
        metadata: {
          userId,
          reportId,
          generatedAt: new Date().toISOString(),
          confidential: 'true', // Marca como confidencial
          dataType: 'PHI' // Protected Health Information
        }
      }
    });

    // SEGURANÇA: Gerar signed URL ao invés de tornar público
    // Signed URL expira em 7 dias
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    console.log(`✅ Upload concluído com signed URL (privado, expira em 7 dias)`);

    return {
      url: signedUrl,
      fileName
    };

  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    throw error;
  }
}

/**
 * Salva relatório no histórico do usuário (recentReports array)
 */
export async function saveToRecentReports(
  userId: string,
  reportData: {
    reportId: string;
    reportUrl: string;
    fileName: string;
    periodsText: string;
    periods: string[];
    templateType: 'standard' | 'enhanced';
  }
): Promise<void> {
  console.log(`💾 Salvando no histórico de ${userId}...`);
  
  const db = admin.firestore();
  const userRef = db.collection('usuarios').doc(userId);

  try {
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.warn('⚠️ Documento do usuário não encontrado');
      return;
    }

    const userData = userDoc.data();
    const existingReports = userData?.recentReports || [];

    // Criar novo registro
    const newReport = {
      reportId: reportData.reportId,
      reportUrl: reportData.reportUrl,
      fileName: reportData.fileName,
      periodsText: reportData.periodsText,
      periods: reportData.periods,
      templateType: reportData.templateType,
      generatedAt: admin.firestore.Timestamp.now()
    };

    // Manter apenas últimos 3 (FIFO)
    const updatedReports = [newReport, ...existingReports].slice(0, 3);

    // Atualizar documento
    await userRef.update({
      recentReports: updatedReports,
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`✅ Relatório salvo no array recentReports (${updatedReports.length}/3)`);

  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    // Não falha a operação inteira se histórico falhar
  }
}
