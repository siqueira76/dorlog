/**
 * SCRIPT DE MIGRAÇÃO - REPORT_DIARIO
 * 
 * Este script migra documentos da collection report_diario 
 * de identificação por email para identificação por Firebase UID
 * 
 * ATENÇÃO: Execute apenas após backup completo!
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  getDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Configure your Firebase config here
const firebaseConfig = {
  // YOUR FIREBASE CONFIG
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class ReportDiarioMigration {
  constructor() {
    this.stats = {
      totalDocuments: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      orphanedDocuments: 0,
      skippedDocuments: 0
    };
    
    this.errors = [];
    this.orphanedEmails = [];
    this.migratedDocuments = [];
  }

  /**
   * ETAPA 1: Análise pré-migração
   */
  async analyzeCurrentData() {
    console.log('📊 ETAPA 1: Analisando dados atuais...');
    
    const reportDiarioRef = collection(db, 'report_diario');
    const snapshot = await getDocs(reportDiarioRef);
    
    const analysis = {
      emailBasedDocs: 0,
      uidBasedDocs: 0,
      unknownFormatDocs: 0,
      emailsFound: new Set(),
      uidFound: new Set()
    };
    
    snapshot.forEach((doc) => {
      const docId = doc.id;
      const data = doc.data();
      
      this.stats.totalDocuments++;
      
      if (docId.includes('@')) {
        analysis.emailBasedDocs++;
        const email = docId.split('_')[0];
        analysis.emailsFound.add(email);
      } else if (docId.length > 20 && !docId.includes('@')) {
        analysis.uidBasedDocs++;
        const uid = docId.split('_')[0];
        analysis.uidFound.add(uid);
      } else {
        analysis.unknownFormatDocs++;
      }
    });
    
    console.log('📈 Análise Completa:');
    console.log(`   Total de documentos: ${this.stats.totalDocuments}`);
    console.log(`   Documentos baseados em email: ${analysis.emailBasedDocs}`);
    console.log(`   Documentos baseados em UID: ${analysis.uidBasedDocs}`);
    console.log(`   Documentos formato desconhecido: ${analysis.unknownFormatDocs}`);
    console.log(`   Emails únicos encontrados: ${analysis.emailsFound.size}`);
    console.log(`   UIDs únicos encontrados: ${analysis.uidFound.size}`);
    
    return analysis;
  }

  /**
   * ETAPA 2: Resolver emails para Firebase UIDs
   */
  async resolveEmailsToUIDs(emails) {
    console.log('🔍 ETAPA 2: Resolvendo emails para Firebase UIDs...');
    
    const emailToUID = new Map();
    const usuariosRef = collection(db, 'usuarios');
    
    for (const email of emails) {
      try {
        const userQuery = query(usuariosRef, where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.docs.length > 0) {
          const uid = userSnapshot.docs[0].id;
          emailToUID.set(email, uid);
          console.log(`✅ Resolvido: ${email} → ${uid}`);
        } else {
          this.orphanedEmails.push(email);
          console.warn(`⚠️ Órfão: Email ${email} não encontrado na collection usuarios`);
        }
      } catch (error) {
        this.errors.push(`Erro ao resolver ${email}: ${error.message}`);
        console.error(`❌ Erro ao resolver ${email}:`, error);
      }
    }
    
    console.log(`✅ Mapeamento concluído: ${emailToUID.size} emails resolvidos`);
    console.log(`⚠️ Emails órfãos: ${this.orphanedEmails.length}`);
    
    return emailToUID;
  }

  /**
   * ETAPA 3: Executar migração em lotes
   */
  async executeMigration(emailToUID, batchSize = 100) {
    console.log(`⚡ ETAPA 3: Executando migração em lotes de ${batchSize}...`);
    
    const reportDiarioRef = collection(db, 'report_diario');
    const snapshot = await getDocs(reportDiarioRef);
    
    let batch = writeBatch(db);
    let operationsInBatch = 0;
    let batchCount = 0;
    
    for (const documentSnapshot of snapshot.docs) {
      const docId = documentSnapshot.id;
      const data = documentSnapshot.data();
      
      // Skip se não é baseado em email
      if (!docId.includes('@')) {
        this.stats.skippedDocuments++;
        continue;
      }
      
      const [email, datePart] = docId.split('_');
      const uid = emailToUID.get(email);
      
      if (!uid) {
        this.stats.failedMigrations++;
        this.errors.push(`Não foi possível migrar ${docId}: UID não encontrado para ${email}`);
        continue;
      }
      
      try {
        // Criar novo documento com UID
        const newDocId = `${uid}_${datePart}`;
        const newDocRef = doc(db, 'report_diario', newDocId);
        
        // CRITICAL FIX: Check for collision before creating new document
        const existingDocSnapshot = await getDoc(newDocRef);
        
        if (existingDocSnapshot.exists()) {
          console.log(`⚠️ COLISÃO DETECTADA: ${newDocId} já existe. Fazendo merge dos dados...`);
          
          const existingData = existingDocSnapshot.data();
          const mergedData = {
            ...existingData,
            // Merge arrays if they exist
            quizzes: [...(existingData.quizzes || []), ...(data.quizzes || [])],
            medicamentos: [...(existingData.medicamentos || []), ...(data.medicamentos || [])],
            // Keep migration metadata
            migrated: true,
            migratedAt: new Date(),
            collisionResolved: true,
            originalDocIds: [...(existingData.originalDocIds || []), docId]
          };
          
          // Use set with merge to avoid overwriting existing data
          batch.set(newDocRef, mergedData, { merge: true });
          batch.delete(documentSnapshot.ref);
          
          console.log(`✅ Merge realizado com sucesso para ${newDocId}`);
        } else {
          // No collision, proceed normally
          const newData = {
            ...data,
            usuarioId: uid,
            userEmail: email,
            migrated: true,
            migratedAt: new Date(),
            originalDocId: docId
          };
          
          batch.set(newDocRef, newData);
          batch.delete(documentSnapshot.ref);
        }
        
        operationsInBatch += 2; // set + delete
        
        // Executar batch se atingir o limite
        if (operationsInBatch >= batchSize) {
          await batch.commit();
          batchCount++;
          console.log(`✅ Lote ${batchCount} executado (${operationsInBatch/2} documentos migrados)`);
          
          batch = writeBatch(db);
          operationsInBatch = 0;
          
          // Pequeno delay para não sobrecarregar o Firestore
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.stats.successfulMigrations++;
        this.migratedDocuments.push({
          original: docId,
          new: newDocId,
          email: email,
          uid: uid
        });
        
      } catch (error) {
        this.stats.failedMigrations++;
        this.errors.push(`Erro ao migrar ${docId}: ${error.message}`);
        console.error(`❌ Erro ao migrar ${docId}:`, error);
      }
    }
    
    // Executar batch restante
    if (operationsInBatch > 0) {
      await batch.commit();
      batchCount++;
      console.log(`✅ Lote final ${batchCount} executado (${operationsInBatch/2} documentos migrados)`);
    }
    
    console.log(`🎉 Migração concluída! ${batchCount} lotes executados.`);
  }

  /**
   * ETAPA 4: Validação pós-migração
   */
  async validateMigration() {
    console.log('🔍 ETAPA 4: Validando migração...');
    
    let validationErrors = 0;
    
    for (const migration of this.migratedDocuments) {
      try {
        // Verificar se novo documento existe
        const newDocRef = doc(db, 'report_diario', migration.new);
        const newDoc = await getDoc(newDocRef);
        
        if (!newDoc.exists()) {
          validationErrors++;
          console.error(`❌ Documento migrado não encontrado: ${migration.new}`);
          continue;
        }
        
        // Verificar se documento antigo foi removido
        const oldDocRef = doc(db, 'report_diario', migration.original);
        const oldDoc = await getDoc(oldDocRef);
        
        if (oldDoc.exists()) {
          validationErrors++;
          console.error(`❌ Documento original não foi removido: ${migration.original}`);
        }
        
        // Verificar integridade dos dados
        const newData = newDoc.data();
        if (newData.usuarioId !== migration.uid) {
          validationErrors++;
          console.error(`❌ UsuarioId incorreto em ${migration.new}: esperado ${migration.uid}, encontrado ${newData.usuarioId}`);
        }
        
        if (newData.userEmail !== migration.email) {
          validationErrors++;
          console.error(`❌ UserEmail incorreto em ${migration.new}: esperado ${migration.email}, encontrado ${newData.userEmail}`);
        }
        
      } catch (error) {
        validationErrors++;
        console.error(`❌ Erro na validação de ${migration.new}:`, error);
      }
    }
    
    console.log(`✅ Validação concluída. Erros encontrados: ${validationErrors}`);
    return validationErrors === 0;
  }

  /**
   * Executar migração completa
   */
  async runFullMigration() {
    const startTime = Date.now();
    console.log('🚀 INICIANDO MIGRAÇÃO COMPLETA - REPORT_DIARIO');
    console.log('=' . repeat(60));
    
    try {
      // Etapa 1: Análise
      const analysis = await this.analyzeCurrentData();
      
      if (analysis.emailBasedDocs === 0) {
        console.log('✅ Nenhum documento para migrar. Todos já estão no formato correto.');
        return;
      }
      
      // Etapa 2: Resolver emails
      const emailToUID = await this.resolveEmailsToUIDs(analysis.emailsFound);
      
      if (emailToUID.size === 0) {
        console.log('❌ Nenhum email pôde ser resolvido. Migração abortada.');
        return;
      }
      
      // Etapa 3: Migração
      await this.executeMigration(emailToUID);
      
      // Etapa 4: Validação
      const isValid = await this.validateMigration();
      
      // Relatório final
      this.printFinalReport(startTime, isValid);
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error);
      throw error;
    }
  }

  /**
   * Imprimir relatório final
   */
  printFinalReport(startTime, isValid) {
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n' + '=' . repeat(60));
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO');
    console.log('=' . repeat(60));
    console.log(`⏱️  Tempo de execução: ${duration.toFixed(2)} segundos`);
    console.log(`📄 Total de documentos processados: ${this.stats.totalDocuments}`);
    console.log(`✅ Migrações bem-sucedidas: ${this.stats.successfulMigrations}`);
    console.log(`❌ Migrações com falha: ${this.stats.failedMigrations}`);
    console.log(`⏭️  Documentos ignorados: ${this.stats.skippedDocuments}`);
    console.log(`👻 Emails órfãos: ${this.orphanedEmails.length}`);
    console.log(`🔍 Validação: ${isValid ? 'PASSOU' : 'FALHOU'}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.orphanedEmails.length > 0) {
      console.log('\n👻 EMAILS ÓRFÃOS:');
      this.orphanedEmails.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email}`);
      });
    }
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    console.log('=' . repeat(60));
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new ReportDiarioMigration();
  
  migration.runFullMigration()
    .then(() => {
      console.log('✅ Script de migração concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script de migração falhou:', error);
      process.exit(1);
    });
}

export default ReportDiarioMigration;