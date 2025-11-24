import { fetchUserReportData, ReportData } from './firestoreDataService';
import { generateEnhancedReportHTML, EnhancedReportTemplateData } from './enhancedHtmlTemplate';
import { uploadReportToStorage, generateReportId, generatePasswordHash } from './firebaseStorageService';
import { EnhancedReportAnalysisService } from './enhancedReportAnalysisService';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UnifiedReportOptions {
  userId: string;
  periods: string[];
  periodsText: string;
  templateType?: 'standard' | 'enhanced';
  withPassword?: boolean;
  password?: string;
}

export interface UnifiedReportResult {
  success: boolean;
  reportUrl?: string;
  fileName?: string;
  reportId?: string;
  executionTime?: string;
  error?: string;
  message?: string;
}

/**
 * Unified report generation service - works in both Replit and GitHub Pages
 * Generates HTML with real Firestore data and uploads to Firebase Storage
 */
export class UnifiedReportService {
  
  /**
   * Check if user has active premium subscription
   */
  static async checkPremiumAccess(userId: string): Promise<boolean> {
    try {
      // Resolve UID to email for subscription check (assinaturas collection uses email as key)
      const userEmail = await this.resolveUIDToEmail(userId);
      const subscriptionRef = doc(db, 'assinaturas', userEmail);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        return false;
      }

      const subscriptionData = subscriptionSnap.data();
      
      // Check if there's an explicit active field first
      if ('active' in subscriptionData && typeof subscriptionData.active === 'boolean') {
        return subscriptionData.active;
      }
      
      const subscriptionDate = subscriptionData.data;
      const currentDate = new Date();

      let subscriptionDateObj: Date;
      
      if (subscriptionDate && typeof subscriptionDate === 'object' && 'toDate' in subscriptionDate) {
        subscriptionDateObj = (subscriptionDate as any).toDate();
      } else if (subscriptionDate instanceof Date) {
        subscriptionDateObj = subscriptionDate;
      } else {
        subscriptionDateObj = new Date(subscriptionDate as any);
      }

      // Check if subscription date is in the past (which means it was created/activated)
      // This assumes subscriptions remain active until explicitly deactivated
      return subscriptionDateObj < currentDate;
    } catch (error) {
      console.error('❌ Erro ao verificar acesso premium:', error);
      return false;
    }
  }

  /**
   * Generate report with real data and upload to Firebase Storage
   */
  static async generateReport(options: UnifiedReportOptions): Promise<UnifiedReportResult> {
    const startTime = Date.now();
    console.log(`🚀 Iniciando geração de relatório unificado para ${options.userId}...`);
    console.log(`📅 Períodos: ${options.periodsText} (${options.periods.length} período(s))`);
    
    try {
      // NOTE: Premium access validation removed - now handled by:
      // 1. Frontend UI (MonthlyReportGenerator.tsx)
      // 2. Client-side enforcement (unifiedReportPatch.ts) - PRIMARY LAYER
      // 3. Server-side validation (routes.ts) - Defense in depth
      // Free tier users CAN generate reports (1/month, current period only)
      
      // 1. Generate unique report ID
      const reportId = generateReportId(options.userId);
      console.log(`🆔 Report ID gerado: ${reportId}`);
      
      // 2. Fetch real data from Firestore
      console.log(`🔍 Buscando dados reais do Firestore...`);
      const reportData = await fetchUserReportData(options.userId, options.periods);
      console.log(`✅ Dados coletados:`, {
        totalDays: reportData.totalDays,
        crisisEpisodes: reportData.crisisEpisodes,
        medicationsCount: reportData.medications.length,
        doctorsCount: reportData.doctors.length
      });
      
      // 3. Add digestive health analysis to basic report
      console.log(`💩 Processando análise de saúde digestiva...`);
      (reportData as any).digestiveAnalysis = EnhancedReportAnalysisService.analyzeDigestiveIntervals(reportData);
      console.log(`✅ Análise digestiva concluída:`, (reportData as any).digestiveAnalysis.status);
      
      // 4. Prepare enhanced template data
      // Resolve UID to email for proper display in template
      const userEmail = await UnifiedReportService.resolveUIDToEmail(options.userId);
      
      const templateData: EnhancedReportTemplateData = {
        userEmail: userEmail,
        periodsText: options.periodsText,
        reportData,
        reportId,
        withPassword: options.withPassword || false,
        passwordHash: options.password ? generatePasswordHash(options.password) : undefined
      };
      
      // 5. Generate enhanced HTML with all features
      console.log(`🧠 Processando análise NLP e gerando relatório enhanced...`);
      const htmlContent = generateEnhancedReportHTML(templateData);
      console.log(`✅ HTML Enhanced gerado: ${Math.round(htmlContent.length / 1024)}KB`);
      
      // 6. Upload to Firebase Storage
      console.log(`☁️ Fazendo upload para Firebase Storage...`);
      const uploadResult = await uploadReportToStorage(htmlContent, reportId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Falha no upload');
      }
      
      // 7. Calculate execution time
      const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
      
      console.log(`🎉 Relatório gerado com sucesso!`);
      console.log(`⏱️ Tempo total: ${executionTime}`);
      console.log(`🔗 URL: ${uploadResult.downloadUrl}`);
      
      return {
        success: true,
        reportUrl: uploadResult.downloadUrl,
        fileName: uploadResult.fileName,
        reportId,
        executionTime,
        message: 'Relatório gerado com dados reais do Firestore e armazenado no Firebase Storage'
      };
      
    } catch (error) {
      const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
      
      console.error('❌ Erro na geração do relatório:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        executionTime
      };
    }
  }
  
  /**
   * Resolve Firebase UID para email usando a coleção usuarios
   */
  private static async resolveUIDToEmail(uid: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.email || userData.userEmail || uid;
      }
      return uid; // Fallback seguro
    } catch (error) {
      console.warn('⚠️ Erro ao resolver email do usuário, usando UID:', error);
      return uid; // Fallback seguro
    }
  }
  
  /**
   * Check if all required services are properly configured
   */
  static checkConfiguration(): { isReady: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Check Firebase configuration - check if imported modules are available
      if (!db || !storage) {
        issues.push('Firebase não está inicializado completamente');
      }
      
      // Check Firestore access
      if (!db) {
        issues.push('Firestore não está acessível');
      }
      
      // Check Firebase Storage
      if (!storage) {
        issues.push('Firebase Storage não está configurado');
      }
      
      return {
        isReady: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Erro na verificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      return {
        isReady: false,
        issues
      };
    }
  }
  
  /**
   * Generate a simple enhanced report for testing (without upload)
   */
  static async generateTestReport(options: UnifiedReportOptions): Promise<string> {
    console.log(`🧪 Gerando relatório enhanced de teste...`);
    
    const reportId = generateReportId(options.userId);
    const reportData = await fetchUserReportData(options.userId, options.periods);
    
    // Resolve UID to email for proper display in template
    const userEmail = await UnifiedReportService.resolveUIDToEmail(options.userId);
    
    const templateData: EnhancedReportTemplateData = {
      userEmail: userEmail,
      periodsText: options.periodsText,
      reportData,
      reportId
    };
    
    return generateEnhancedReportHTML(templateData);
  }
}

