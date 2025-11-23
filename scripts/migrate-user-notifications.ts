/**
 * Migration Script: Backfill Notification Fields
 * 
 * Este script corrige usuários que foram criados antes da implementação
 * completa do sistema de notificações, adicionando os campos faltantes:
 * - timezone, timezoneOffset, timezoneAutoDetected
 * - fcmTokens (array)
 * - notificationPreferences (objeto completo)
 * 
 * COMO USAR:
 * 
 * 1. Via Firebase Console (Mais fácil):
 *    - Abra o Firebase Console
 *    - Vá em Firestore Database
 *    - Execute o código manualmente em cada documento
 * 
 * 2. Via Node.js (Requer credenciais Admin):
 *    - npm install firebase-admin
 *    - Configure GOOGLE_APPLICATION_CREDENTIALS
 *    - Execute: npx tsx scripts/migrate-user-notifications.ts
 * 
 * 3. Via Cloud Function (Recomendado para produção):
 *    - Deploy como callable function
 *    - Execute via Firebase Console Functions
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (uncomment if running as standalone script)
// const serviceAccount = require('./path-to-service-account-key.json');
// initializeApp({
//   credential: cert(serviceAccount)
// });

const db = getFirestore();

interface UserDocument {
  id: string;
  name?: string;
  email?: string;
  timezone?: string;
  timezoneOffset?: number;
  timezoneAutoDetected?: boolean;
  fcmTokens?: any[];
  notificationPreferences?: {
    enabled?: boolean;
    morningQuiz?: boolean;
    eveningQuiz?: boolean;
    medicationReminders?: boolean;
    healthInsights?: boolean;
    emergencyAlerts?: boolean;
  };
}

/**
 * Backfill missing notification fields for all users
 */
async function migrateUsers() {
  console.log('🚀 Iniciando migração de usuários...');
  
  try {
    const usersRef = db.collection('usuarios');
    const snapshot = await usersRef.get();
    
    console.log(`📊 Total de usuários: ${snapshot.size}`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data() as UserDocument;
      const userId = doc.id;
      
      // Check what needs to be migrated
      const needsMigration = 
        !userData.timezone ||
        typeof userData.timezoneOffset === 'undefined' ||
        !userData.notificationPreferences ||
        typeof userData.notificationPreferences.enabled === 'undefined' ||
        !userData.fcmTokens ||
        !Array.isArray(userData.fcmTokens);
      
      if (!needsMigration) {
        console.log(`✅ ${userId} - Já possui todos os campos`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔧 ${userId} - Migrando...`);
      
      try {
        const updates: any = {
          updatedAt: new Date()
        };
        
        // Add timezone if missing
        if (!userData.timezone) {
          updates.timezone = 'America/Sao_Paulo'; // Default timezone
          updates.timezoneOffset = 180; // UTC-3
          updates.timezoneAutoDetected = false;
          console.log(`  ├─ Adicionando timezone: America/Sao_Paulo`);
        }
        
        // Add notification preferences if missing or incomplete
        if (!userData.notificationPreferences || 
            typeof userData.notificationPreferences.enabled === 'undefined') {
          updates.notificationPreferences = {
            enabled: false,
            morningQuiz: true,
            eveningQuiz: true,
            medicationReminders: true,
            healthInsights: true,
            emergencyAlerts: true
          };
          console.log(`  ├─ Adicionando notificationPreferences`);
        }
        
        // Add fcmTokens if missing or not an array
        if (!userData.fcmTokens || !Array.isArray(userData.fcmTokens)) {
          updates.fcmTokens = [];
          console.log(`  ├─ Inicializando fcmTokens array`);
        }
        
        // Apply updates
        await usersRef.doc(userId).update(updates);
        
        console.log(`  └─ ✅ Migrado com sucesso`);
        migratedCount++;
      } catch (error: any) {
        console.error(`  └─ ❌ Erro ao migrar ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log(`📊 Resumo:`);
    console.log(`  - Total: ${snapshot.size} usuários`);
    console.log(`  - Migrados: ${migratedCount}`);
    console.log(`  - Já atualizados: ${skippedCount}`);
    console.log(`  - Erros: ${errorCount}`);
    
    return {
      total: snapshot.size,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };
  } catch (error: any) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  }
}

/**
 * Migrar um único usuário (útil para testes)
 */
async function migrateUser(userId: string) {
  console.log(`🔧 Migrando usuário: ${userId}`);
  
  try {
    const userRef = db.collection('usuarios').doc(userId);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new Error('Usuário não encontrado');
    }
    
    const userData = doc.data() as UserDocument;
    
    const updates: any = {
      updatedAt: new Date()
    };
    
    // Add timezone if missing
    if (!userData.timezone) {
      updates.timezone = 'America/Sao_Paulo';
      updates.timezoneOffset = 180;
      updates.timezoneAutoDetected = false;
    }
    
    // Add notification preferences if missing or incomplete
    if (!userData.notificationPreferences || 
        typeof userData.notificationPreferences.enabled === 'undefined') {
      updates.notificationPreferences = {
        enabled: false,
        morningQuiz: true,
        eveningQuiz: true,
        medicationReminders: true,
        healthInsights: true,
        emergencyAlerts: true
      };
    }
    
    // Add fcmTokens if missing or not an array
    if (!userData.fcmTokens || !Array.isArray(userData.fcmTokens)) {
      updates.fcmTokens = [];
    }
    
    await userRef.update(updates);
    
    console.log(`✅ Usuário ${userId} migrado com sucesso!`);
    return { success: true, userId, updates };
  } catch (error: any) {
    console.error(`❌ Erro ao migrar usuário ${userId}:`, error.message);
    throw error;
  }
}

// Execute migration (uncomment to run as standalone script)
// migrateUsers()
//   .then(result => {
//     console.log('✅ Migração finalizada:', result);
//     process.exit(0);
//   })
//   .catch(error => {
//     console.error('❌ Migração falhou:', error);
//     process.exit(1);
//   });

// Export functions for use in Cloud Functions
export { migrateUsers, migrateUser };
