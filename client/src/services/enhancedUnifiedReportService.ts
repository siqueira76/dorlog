/**
 * Serviço Unificado Enhanced para Relatórios DorLog
 * 
 * Integra análise NLP, visualizações avançadas e insights preditivos
 * com o sistema de relatórios existente. Mantém compatibilidade total.
 */

import { UnifiedReportService, UnifiedReportOptions, UnifiedReportResult } from './unifiedReportService';
import { fetchUserReportData } from './firestoreDataService';
import { EnhancedReportAnalysisService, EnhancedReportData } from './enhancedReportAnalysisService';
import { generateEnhancedReportHTML, EnhancedReportTemplateData } from './enhancedHtmlTemplate';
import { uploadReportToStorage, generateReportId, generatePasswordHash } from './firebaseStorageService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface EnhancedReportOptions extends UnifiedReportOptions {
  useEnhancedAnalysis?: boolean;
  includeNLPInsights?: boolean;
  includeVisualizationCharts?: boolean;
  includePredictiveAlerts?: boolean;
  textResponses?: string[] | Array<{text: string, date: string, timestamp?: string, quizType: string}>; // Textos livres para análise NLP
}

export interface EnhancedReportResult extends UnifiedReportResult {
  analysisType?: 'standard' | 'enhanced';
  nlpProcessed?: boolean;
  chartsGenerated?: boolean;
  alertsGenerated?: number;
  enhancedFeatures?: {
    sentimentAnalysis: boolean;
    patternDetection: boolean;
    predictiveAlerts: boolean;
    visualizations: boolean;
  };
}

/**
 * Serviço Enhanced que estende o UnifiedReportService
 */
export class EnhancedUnifiedReportService {
  
  /**
   * Gera relatório enhanced com todas as funcionalidades avançadas
   */
  static async generateEnhancedReport(options: EnhancedReportOptions): Promise<EnhancedReportResult> {
    const startTime = Date.now();
    console.log(`🧠 Iniciando geração de relatório enhanced para ${options.userId}...`);
    
    try {
      // 1. Validate premium access
      console.log(`🔐 Verificando acesso premium para ${options.userId}...`);
      const hasPremiumAccess = await UnifiedReportService.checkPremiumAccess(options.userId);
      
      if (!hasPremiumAccess) {
        console.log(`❌ Acesso negado: usuário ${options.userId} não possui assinatura ativa`);
        return {
          success: false,
          error: 'Acesso negado: funcionalidade exclusiva para usuários Premium',
          analysisType: 'standard',
          nlpProcessed: false,
          chartsGenerated: false,
          alertsGenerated: 0
        };
      }
      
      console.log(`✅ Acesso premium confirmado para ${options.userId}`);
      
      // 2. Validar se enhanced features estão habilitadas
      const useEnhanced = options.useEnhancedAnalysis !== false; // Default true
      
      if (!useEnhanced) {
        console.log('📄 Fallback para relatório padrão');
        return this.generateStandardReport(options);
      }
      
      // 2. Gerar ID único e buscar dados básicos
      const reportId = generateReportId(options.userId);
      console.log(`🆔 Report Enhanced ID: ${reportId}`);
      
      // 3. Buscar dados reais do Firestore
      console.log(`🔍 Coletando dados do Firestore...`);
      const baseReportData = await fetchUserReportData(options.userId, options.periods);
      
      // 4. Aplicar análise enhanced se houver textos para processar
      let enhancedData: EnhancedReportData = baseReportData;
      let nlpProcessed = false;
      
      if (options.includeNLPInsights !== false && options.textResponses && options.textResponses.length > 0) {
        console.log(`🧠 Processando análise NLP de ${options.textResponses.length} textos...`);
        try {
          enhancedData = await EnhancedReportAnalysisService.enhanceReportData(
            baseReportData, 
            options.textResponses
          );
          nlpProcessed = true;
          console.log(`✅ Análise NLP concluída`);
        } catch (error) {
          console.warn('⚠️ Falha na análise NLP, continuando com dados básicos:', error);
        }
      }
      
      // 5. Preparar dados do template enhanced  
      // Resolve UID to email for proper display using centralized function
      const userEmail = await this.resolveUIDToEmail(options.userId);
      
      const templateData: EnhancedReportTemplateData = {
        userEmail: userEmail, // Proper email display
        periodsText: options.periodsText,
        reportData: enhancedData,
        reportId,
        withPassword: options.withPassword || false,
        passwordHash: options.password ? generatePasswordHash(options.password) : undefined
      };
      
      // 6. Gerar HTML enhanced
      console.log(`🎨 Gerando template HTML enhanced...`);
      const htmlContent = generateEnhancedReportHTML(templateData);
      console.log(`✅ HTML enhanced gerado: ${Math.round(htmlContent.length / 1024)}KB`);
      
      // 7. Upload para Firebase Storage
      console.log(`☁️ Fazendo upload para Firebase Storage...`);
      const uploadResult = await uploadReportToStorage(htmlContent, reportId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Falha no upload');
      }
      
      // 8. Calcular métricas de execução
      const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
      const alertsCount = enhancedData.smartSummary?.predictiveAlerts?.length || 0;
      
      console.log(`🎉 Relatório enhanced gerado com sucesso!`);
      console.log(`⏱️ Tempo total: ${executionTime}`);
      console.log(`🔗 URL: ${uploadResult.downloadUrl}`);
      console.log(`📊 Features: NLP=${nlpProcessed}, Alertas=${alertsCount}`);
      
      return {
        success: true,
        reportUrl: uploadResult.downloadUrl,
        fileName: uploadResult.fileName,
        reportId,
        executionTime,
        analysisType: 'enhanced',
        nlpProcessed,
        chartsGenerated: true,
        alertsGenerated: alertsCount,
        enhancedFeatures: {
          sentimentAnalysis: nlpProcessed,
          patternDetection: nlpProcessed,
          predictiveAlerts: alertsCount > 0,
          visualizations: true
        },
        message: `Relatório enhanced gerado com ${nlpProcessed ? 'análise NLP' : 'dados básicos'} e ${alertsCount} alertas preditivos`
      };
      
    } catch (error) {
      const executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
      
      console.error('❌ Erro na geração enhanced, tentando fallback:', error);
      
      // Fallback para relatório padrão em caso de erro
      try {
        return await this.generateStandardReportFallback(options, executionTime);
      } catch (fallbackError) {
        console.error('❌ Falha completa no fallback:', fallbackError);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido na geração enhanced',
          executionTime,
          analysisType: 'enhanced'
        };
      }
    }
  }
  
  /**
   * Gera relatório padrão (fallback)
   */
  private static async generateStandardReport(options: EnhancedReportOptions): Promise<EnhancedReportResult> {
    const standardOptions: UnifiedReportOptions = {
      userId: options.userId,
      periods: options.periods,
      periodsText: options.periodsText,
      withPassword: options.withPassword,
      password: options.password
    };
    
    const result = await UnifiedReportService.generateReport(standardOptions);
    
    return {
      ...result,
      analysisType: 'standard',
      nlpProcessed: false,
      chartsGenerated: false,
      alertsGenerated: 0,
      enhancedFeatures: {
        sentimentAnalysis: false,
        patternDetection: false,
        predictiveAlerts: false,
        visualizations: false
      }
    };
  }
  
  /**
   * Fallback para relatório padrão em caso de erro no enhanced
   */
  private static async generateStandardReportFallback(
    options: EnhancedReportOptions, 
    executionTime: string
  ): Promise<EnhancedReportResult> {
    console.log('🔄 Executando fallback para relatório padrão...');
    
    const fallbackResult = await this.generateStandardReport(options);
    
    return {
      ...fallbackResult,
      executionTime,
      message: 'Relatório gerado em modo padrão (fallback do enhanced)'
    };
  }
  
  /**
   * Verifica se o sistema enhanced está pronto
   */
  static checkEnhancedConfiguration(): { 
    isReady: boolean; 
    issues: string[]; 
    features: {
      nlpAvailable: boolean;
      chartsAvailable: boolean;
      storageAvailable: boolean;
    };
  } {
    const issues: string[] = [];
    
    // Verificar sistema base
    const baseCheck = UnifiedReportService.checkConfiguration();
    if (!baseCheck.isReady) {
      issues.push(...baseCheck.issues);
    }
    
    // Verificar NLP
    let nlpAvailable = true;
    try {
      // Verificar se o serviço NLP pode ser importado
      import('./nlpAnalysisService').then(() => {
        console.log('✅ NLP Service disponível');
      }).catch(() => {
        nlpAvailable = false;
        issues.push('Serviço NLP não disponível');
      });
    } catch (error) {
      nlpAvailable = false;
      issues.push('Erro ao verificar NLP Service');
    }
    
    return {
      isReady: issues.length === 0,
      issues,
      features: {
        nlpAvailable,
        chartsAvailable: true, // Charts são sempre disponíveis (Chart.js via CDN)
        storageAvailable: baseCheck.isReady
      }
    };
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
   * Gera relatório de teste enhanced (sem upload)
   */
  static async generateEnhancedTestReport(options: EnhancedReportOptions): Promise<string> {
    console.log(`🧪 Gerando relatório enhanced de teste...`);
    
    const reportId = generateReportId(options.userId);
    const baseData = await fetchUserReportData(options.userId, options.periods);
    
    // Aplicar análise enhanced se possível
    let enhancedData: EnhancedReportData = baseData;
    if (options.textResponses && options.textResponses.length > 0) {
      try {
        enhancedData = await EnhancedReportAnalysisService.enhanceReportData(
          baseData, 
          options.textResponses
        );
      } catch (error) {
        console.warn('Usando dados básicos para teste:', error);
      }
    }
    
    const templateData: EnhancedReportTemplateData = {
      userEmail: options.userId,
      periodsText: options.periodsText,
      reportData: enhancedData,
      reportId
    };
    
    return generateEnhancedReportHTML(templateData);
  }
  
  /**
   * Cache global para definições de quiz (otimização de performance)
   */
  private static quizDefinitionsCache = new Map<string, {
    textQuestions: string[],
    evaQuestions: string[],
    checkboxQuestions: string[],
    lastUpdated: number
  }>();
  
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca definições de quiz do Firebase para identificar tipos de questão
   */
  private static async getQuizDefinition(quizType: string) {
    const cached = this.quizDefinitionsCache.get(quizType);
    
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached;
    }
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const quizRef = collection(db, 'quizzes', quizType, 'perguntas');
      const snapshot = await getDocs(quizRef);
      
      const definition = {
        textQuestions: [] as string[],
        evaQuestions: [] as string[],
        checkboxQuestions: [] as string[],
        lastUpdated: Date.now()
      };
      
      snapshot.forEach(doc => {
        const question = doc.data();
        const questionId = question.id?.toString() || doc.id;
        
        switch (question.tipo) {
          case 'texto':
            definition.textQuestions.push(questionId);
            break;
          case 'eva':
            definition.evaQuestions.push(questionId);
            break;
          case 'checkbox':
            definition.checkboxQuestions.push(questionId);
            break;
        }
      });
      
      this.quizDefinitionsCache.set(quizType, definition);
      console.log(`📋 Definições carregadas para ${quizType}:`, definition);
      return definition;
      
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar definições para ${quizType}:`, error);
      return {
        textQuestions: [],
        evaQuestions: [],
        checkboxQuestions: [],
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Utilitário para extrair textos de respostas de quizzes preservando contexto temporal
   */
  static async extractTextResponsesWithContext(reportData: any): Promise<Array<{
    text: string;
    date: string;
    timestamp?: string;
    quizType: string;
    questionId?: string;
    documentId?: string;
  }>> {
    const textsWithContext: Array<{
      text: string;
      date: string;
      timestamp?: string;
      quizType: string;
      questionId?: string;
      documentId?: string;
    }> = [];
    
    try {
      console.log('🔍 Iniciando extração de textos com contexto temporal...');
      
      // Extrair observações gerais (mantido para compatibilidade)
      if (reportData.observations && typeof reportData.observations === 'string') {
        textsWithContext.push({
          text: reportData.observations,
          date: reportData.generatedAt ? new Date(reportData.generatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          timestamp: reportData.generatedAt || new Date().toISOString(),
          quizType: 'observacoes',
          questionId: 'general'
        });
      }
      
      // Processar quizzes se existirem no reportData
      if (reportData.quizzes && Array.isArray(reportData.quizzes)) {
        console.log(`📊 Processando ${reportData.quizzes.length} quiz(es) com contexto temporal...`);
        
        for (const quiz of reportData.quizzes) {
          const quizType = quiz.tipo;
          const quizDate = quiz.date || quiz.timestamp;
          console.log(`🔎 Analisando quiz tipo: ${quizType} - Data: ${quizDate}`);
          
          // Buscar definições de questões de texto para este tipo de quiz
          const definition = await this.getQuizDefinition(quizType);
          
          if (quiz.respostas && typeof quiz.respostas === 'object') {
            // Extrair respostas de texto baseado nas definições
            definition.textQuestions.forEach((questionId: string) => {
              const answer = quiz.respostas[questionId];
              if (answer && typeof answer === 'string' && answer.trim().length > 5) {
                textsWithContext.push({
                  text: answer,
                  date: quizDate ? new Date(quizDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  timestamp: quizDate || new Date().toISOString(),
                  quizType: quizType,
                  questionId: questionId,
                  documentId: quiz.documentId || quiz.id
                });
                console.log(`📝 Texto extraído da questão ${questionId} em ${quizDate}: "${answer.substring(0, 50)}..."`);
              }
            });
          }
        }
      }
      
      // Buscar em outras estruturas possíveis se não encontrou nos quizzes
      if (textsWithContext.length === 0) {
        console.log('🔍 Tentando extrair de outras fontes...');
        
        // Extrair textos de painEvolution se houver contexto
        if (reportData.painEvolution) {
          reportData.painEvolution.forEach((pain: any) => {
            if (pain.context && typeof pain.context === 'string') {
              textsWithContext.push({
                text: pain.context,
                date: pain.date || new Date().toISOString().split('T')[0],
                timestamp: pain.timestamp || new Date().toISOString(),
                quizType: 'painEvolution',
                questionId: 'context'
              });
            }
          });
        }
        
        // Tentar extrair de outras fontes de texto livre
        if (reportData.textualResponses && Array.isArray(reportData.textualResponses)) {
          reportData.textualResponses.forEach((textResponse: any, index: number) => {
            if (typeof textResponse === 'string' && textResponse.trim().length > 5) {
              textsWithContext.push({
                text: textResponse,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                quizType: 'textualResponses',
                questionId: `response_${index}`
              });
            }
          });
        }
      }
      
      console.log(`✅ Extração concluída: ${textsWithContext.length} texto(s) com contexto encontrado(s)`);
      
    } catch (error) {
      console.warn('❌ Erro ao extrair textos:', error);
    }
    
    // Ordenar por data para manter cronologia
    return textsWithContext
      .filter(item => item.text && item.text.trim().length > 5)
      .sort((a, b) => new Date(a.timestamp || a.date).getTime() - new Date(b.timestamp || b.date).getTime());
  }

  /**
   * Método de compatibilidade para retornar apenas os textos (para não quebrar código existente)
   */
  static async extractTextResponsesFromReportData(reportData: any): Promise<string[]> {
    const textsWithContext = await this.extractTextResponsesWithContext(reportData);
    return textsWithContext.map(item => item.text);
  }
  
  /**
   * Método de conveniência para gerar relatório com auto-detecção de features
   */
  static async generateIntelligentReport(options: UnifiedReportOptions): Promise<EnhancedReportResult> {
    console.log(`🤖 Gerando relatório inteligente com auto-detecção...`);
    
    try {
      // 1. Buscar dados básicos para análise
      const baseData = await fetchUserReportData(options.userId, options.periods);
      
      // 2. Auto-detectar textos disponíveis (agora usando definições dinâmicas com contexto temporal)
      const extractedTextsWithContext = await this.extractTextResponsesWithContext(baseData);
      const extractedTexts = extractedTextsWithContext.map(item => item.text);
      
      // 3. Determinar se usar enhanced baseado na disponibilidade de dados (critério otimizado)
      const useEnhanced = extractedTexts.length >= 1 || 
                         (baseData.totalDays > 3 && baseData.crisisEpisodes > 0) ||
                         baseData.totalDays > 7;
      
      console.log(`📊 Auto-detecção: Enhanced=${useEnhanced}, Textos=${extractedTexts.length}, Dias=${baseData.totalDays}`);
      
      // 4. Configurar opções enhanced
      const enhancedOptions: EnhancedReportOptions = {
        ...options,
        useEnhancedAnalysis: useEnhanced,
        includeNLPInsights: extractedTexts.length > 0,
        includeVisualizationCharts: useEnhanced,
        includePredictiveAlerts: useEnhanced && baseData.totalDays > 5,
        textResponses: extractedTextsWithContext
      };
      
      // 5. Gerar relatório apropriado
      return await this.generateEnhancedReport(enhancedOptions);
      
    } catch (error) {
      console.error('❌ Erro no relatório inteligente:', error);
      
      // Fallback para relatório padrão
      const result = await UnifiedReportService.generateReport(options);
      return {
        ...result,
        analysisType: 'standard',
        nlpProcessed: false,
        chartsGenerated: false,
        alertsGenerated: 0
      };
    }
  }
}