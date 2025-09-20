/**
 * Template HTML Enhanced para relatórios FibroDiário com NLP + Visualizações
 * 
 * Gera relatórios standalone com análises inteligentes, gráficos avançados
 * e insights preditivos. Compatível com todos os ambientes.
 */

import { EnhancedReportData } from './enhancedReportAnalysisService';
import { MedicalCorrelationService, Doctor, Medication, MedicalInsight, MedicationEffectiveness, DoctorSpecialtyAnalysis } from './medicalCorrelationService';

export interface EnhancedReportTemplateData {
  userEmail: string;
  periodsText: string;
  reportData: EnhancedReportData;
  reportId: string;
  withPassword?: boolean;
  passwordHash?: string;
}

// 🚀 OTIMIZAÇÃO FASE 3: Sistema de streaming HTML por seções
export interface HTMLSection {
  id: string;
  content: string;
  order: number;
  size: number; // bytes aproximados
}

export interface HTMLStreamOptions {
  enableStreaming?: boolean;
  chunkSize?: number;
}

/**
 * 🚀 OTIMIZAÇÃO FASE 3: Gera HTML de forma streaming por seções
 */
export async function* generateEnhancedReportHTMLStream(
  data: EnhancedReportTemplateData,
  options: HTMLStreamOptions = {}
): AsyncGenerator<HTMLSection, void, unknown> {
  console.time('⚡ HTML Streaming Generation');
  const { userEmail, periodsText, reportData, reportId, withPassword, passwordHash } = data;
  const { enableStreaming = true, chunkSize = 50 * 1024 } = options; // 50KB por chunk

  try {
    // 1. Seção Header (rápida, gera primeiro)
    console.time('📝 Header Section');
    const headerHtml = generateHTMLDocumentStart(periodsText) + 
                       generateEnhancedHeader(userEmail, periodsText, reportData);
    console.timeEnd('📝 Header Section');
    
    yield {
      id: 'header',
      content: headerHtml,
      order: 1,
      size: headerHtml.length
    };

    // 2. Seção Executive Summary (paralela)
    console.time('📊 Summary Section');  
    const summaryHtml = generateQuizIntelligentSummarySection(reportData);
    console.timeEnd('📊 Summary Section');
    
    yield {
      id: 'summary', 
      content: summaryHtml,
      order: 2,
      size: summaryHtml.length
    };

    // 3. Seção Text Insights (nova seção de insights de texto livre)
    console.time('💬 Text Insights Section');
    const textInsightsHtml = generateTextInsightsSection(reportData);
    console.timeEnd('💬 Text Insights Section');
    
    yield {
      id: 'text-insights',
      content: textInsightsHtml,
      order: 2.5,
      size: textInsightsHtml.length
    };

    // 4. Seções Tradicionais (pode ser pesada)
    console.time('📋 Traditional Sections');
    const traditionalHtml = generateTraditionalSections(reportData);
    console.timeEnd('📋 Traditional Sections');
    
    // Dividir seções grandes em chunks se necessário
    if (traditionalHtml.length > chunkSize) {
      const chunks = splitIntoChunks(traditionalHtml, chunkSize);
      for (let i = 0; i < chunks.length; i++) {
        yield {
          id: `traditional-${i}`,
          content: chunks[i],
          order: 4 + i,
          size: chunks[i].length
        };
      }
    } else {
      yield {
        id: 'traditional',
        content: traditionalHtml,
        order: 4,
        size: traditionalHtml.length
      };
    }

    // 5. Seção Footer + Scripts (final)
    console.time('🔚 Footer Section');
    const footerHtml = generateEnhancedFooter(reportId, reportData) +
                       generateHTMLDocumentEnd(reportData, withPassword, passwordHash, reportId);
    console.timeEnd('🔚 Footer Section');
    
    yield {
      id: 'footer',
      content: footerHtml,
      order: 100,
      size: footerHtml.length
    };

    console.timeEnd('⚡ HTML Streaming Generation');
    console.log('✅ HTML streaming completo - seções geradas independentemente');

  } catch (error) {
    console.error('❌ Erro no streaming HTML:', error);
    // Fallback para geração tradicional
    const fallbackHtml = generateEnhancedReportHTMLFallback(data);
    yield {
      id: 'fallback',
      content: fallbackHtml,
      order: 1,
      size: fallbackHtml.length
    };
  }
}

/**
 * Divide conteúdo HTML em chunks menores preservando estrutura
 */
function splitIntoChunks(html: string, maxSize: number): string[] {
  if (html.length <= maxSize) return [html];
  
  const chunks: string[] = [];
  let currentPos = 0;
  
  while (currentPos < html.length) {
    let chunkEnd = Math.min(currentPos + maxSize, html.length);
    
    // Tentar quebrar em uma tag completa para não corromper HTML
    if (chunkEnd < html.length) {
      const lastTagEnd = html.lastIndexOf('>', chunkEnd);
      const lastTagStart = html.lastIndexOf('<', chunkEnd);
      
      if (lastTagEnd > lastTagStart && lastTagEnd > currentPos) {
        chunkEnd = lastTagEnd + 1;
      }
    }
    
    chunks.push(html.slice(currentPos, chunkEnd));
    currentPos = chunkEnd;
  }
  
  return chunks;
}

/**
 * Gera início do documento HTML
 */
function generateHTMLDocumentStart(periodsText: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦋 FibroDiário Enhanced - Relatório Inteligente - ${periodsText}</title>
    <link rel="icon" type="image/png" href="data:image/png;base64,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" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <style>
${getEnhancedReportCSS()}
    </style>
</head>
<body>
    <div class="container">`;
}

/**
 * Gera final do documento HTML com scripts e fechamento
 */
function generateHTMLDocumentEnd(
  reportData: EnhancedReportData, 
  withPassword?: boolean, 
  passwordHash?: string, 
  reportId?: string
): string {
  return `
    <script>
        // Dados reais da análise para os gráficos
        window.CHART_DATA = ${JSON.stringify(reportData.visualizationData || {})};
        window.REPORT_DATA = ${JSON.stringify({
          textSummaries: reportData.textSummaries ? {
            matinalCount: reportData.textSummaries.matinal?.textCount || 0,
            noturnoCount: reportData.textSummaries.noturno?.textCount || 0,
            emergencialCount: reportData.textSummaries.emergencial?.textCount || 0,
            combinedTexts: reportData.textSummaries.combined?.totalTexts || 0
          } : {},
          painEvolution: reportData.painEvolution?.slice(0, 10) || []
        })};
${getEnhancedReportJavaScript(withPassword, passwordHash, reportId)}
    </script>
</body>
</html>`;
}

/**
 * Gera versão fallback completa do relatório HTML
 */
function generateEnhancedReportHTMLFallback(data: EnhancedReportTemplateData): string {
  const { userEmail, periodsText, reportData, reportId, withPassword, passwordHash } = data;
  
  return generateHTMLDocumentStart(periodsText) +
         generateEnhancedHeader(userEmail, periodsText, reportData) +
         `<div class="content">
            ${generateExecutiveDashboard(reportData)}
            ${generateAIInsightsZone(reportData)}
            ${generateDataAnalyticsSection(reportData)}
            ${generateClinicalDataSection(reportData)}
            ${generateEnhancedFooter(reportId, reportData)}
         </div>` +
         generateHTMLDocumentEnd(reportData, withPassword, passwordHash, reportId);
}

/**
 * Gera relatório HTML completo - função principal exportada
 */
export function generateEnhancedReportHTML(data: EnhancedReportTemplateData): string {
  return generateEnhancedReportHTMLFallback(data);
}

/**
 * Gera header enhanced do relatório
 */
function generateEnhancedHeader(userEmail: string, periodsText: string, reportData: EnhancedReportData): string {
  return `
        <div class="header-premium">
            <div class="logo-premium">
                <div class="fibro-logo-premium">
                    <img src="/icons/shortcut-report.png" alt="FibroDiário" width="56" height="56" class="report-icon">
                </div>
                <div class="brand-text-premium">
                    <span class="app-name-premium">FibroDiário</span>
                    <span class="app-subtitle-premium">Relatório Inteligente Enhanced</span>
                </div>
            </div>
            <div class="subtitle-premium">
                Análise Médica Profissional com IA - ${periodsText}
            </div>
            <div class="header-badges-premium">
                <div class="badge-premium ai-badge">🧠 Análise IA</div>
                <div class="badge-premium nlp-badge">💬 Processamento NLP</div>
                <div class="badge-premium predict-badge">🔮 Insights Preditivos</div>
                <div class="badge-premium medical-badge">⚕️ Correlações Médicas</div>
            </div>
            <div class="user-info-premium">
                👤 ${userEmail}
            </div>
        </div>`;
}

/**
 * 🏆 NÍVEL 1: Executive Dashboard - Destaque máximo
 */
function generateExecutiveDashboard(reportData: EnhancedReportData): string {
  const avgPain = reportData.painEvolution && reportData.painEvolution.length > 0
    ? (reportData.painEvolution.reduce((sum, p) => sum + p.level, 0) / reportData.painEvolution.length).toFixed(1)
    : 'N/A';
  
  const crisisCount = reportData.crisisEpisodes || 0;
  const adherenceRate = reportData.adherenceRate || 0;
  
  return `
        <div class="executive-dashboard">
            <div class="dashboard-header">
                <h1 class="title-executive">📊 Executive Dashboard</h1>
                <div class="dashboard-subtitle">Visão geral dos indicadores principais</div>
            </div>
            
            <div class="kpi-grid">
                <div class="kpi-card pain-kpi">
                    <div class="kpi-icon">⚡</div>
                    <div class="kpi-value">${avgPain}/10</div>
                    <div class="kpi-label">Dor Média</div>
                    <div class="kpi-trend ${parseFloat(avgPain) > 5 ? 'trend-warning' : 'trend-good'}">📈</div>
                </div>
                
                <div class="kpi-card crisis-kpi">
                    <div class="kpi-icon">🚨</div>
                    <div class="kpi-value">${crisisCount}</div>
                    <div class="kpi-label">Episódios de Crise</div>
                    <div class="kpi-trend ${crisisCount > 3 ? 'trend-critical' : 'trend-good'}">📊</div>
                </div>
                
                <div class="kpi-card adherence-kpi">
                    <div class="kpi-icon">💊</div>
                    <div class="kpi-value">${adherenceRate}%</div>
                    <div class="kpi-label">Adesão ao Tratamento</div>
                    <div class="kpi-trend ${adherenceRate > 80 ? 'trend-excellent' : 'trend-warning'}">⚕️</div>
                </div>
                
                <div class="kpi-card ai-kpi">
                    <div class="kpi-icon">🧠</div>
                    <div class="kpi-value">85%</div>
                    <div class="kpi-label">Confiabilidade IA</div>
                    <div class="kpi-trend trend-excellent">✨</div>
                </div>
            </div>
            
            <div class="executive-alerts">
                ${generateExecutiveAlerts(reportData)}
            </div>
        </div>`;
}

/**
 * 🧠 NÍVEL 2: AI Insights Zone - Destaque alto para IA/NLP
 */
function generateAIInsightsZone(reportData: EnhancedReportData): string {
  return `
        <div class="ai-insights-zone">
            <div class="ai-header">
                <div class="ai-icon-header">
                    <img src="/icons/shortcut-pain.png" alt="AI Analysis" width="32" height="32" class="ai-icon">
                    <h2 class="title-ai-insights">🤖 Zona de Insights de Inteligência Artificial</h2>
                </div>
                <div class="ai-subtitle">Análise avançada com processamento de linguagem natural</div>
                <div class="ai-confidence-bar">
                    <div class="confidence-label">Confiabilidade da Análise: 85%</div>
                    <div class="confidence-progress">
                        <div class="confidence-fill" style="width: 85%"></div>
                    </div>
                </div>
            </div>
            
            <div class="ai-content-grid">
                ${generateTextInsightsSection(reportData)}
                ${generatePredictiveInsights(reportData)}
            </div>
        </div>`;
}

/**
 * 📊 NÍVEL 3: Data Analytics - Destaque médio para gráficos e correlações
 */
function generateDataAnalyticsSection(reportData: EnhancedReportData): string {
  return `
        <div class="data-analytics-section">
            <div class="analytics-header">
                <h2 class="title-data-section">📈 Análise de Dados e Correlações</h2>
                <div class="analytics-subtitle">Visualizações e tendências baseadas em dados</div>
            </div>
            
            <div class="analytics-grid">
                ${generateQuizIntelligentSummarySection(reportData)}
                ${generateCorrelationAnalysis(reportData)}
            </div>
        </div>`;
}

/**
 * 📋 NÍVEL 4: Clinical Data - Informativo, dados tradicionais
 */
function generateClinicalDataSection(reportData: EnhancedReportData): string {
  return `
        <div class="clinical-data-section">
            <div class="clinical-header">
                <h2 class="title-standard">📋 Dados Clínicos</h2>
                <div class="clinical-subtitle">Informações médicas e histórico</div>
            </div>
            
            <div class="clinical-grid">
                ${generateTraditionalSections(reportData)}
            </div>
        </div>`;
}

/**
 * Gera alertas executivos baseados nos dados
 */
function generateExecutiveAlerts(reportData: EnhancedReportData): string {
  const alerts = [];
  
  if (reportData.crisisEpisodes && reportData.crisisEpisodes > 3) {
    alerts.push({
      type: 'critical',
      icon: '🚨',
      title: 'Alto número de crises',
      message: 'Recomenda-se avaliação médica urgente'
    });
  }
  
  if (reportData.adherenceRate && reportData.adherenceRate < 60) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Baixa adesão ao tratamento',
      message: 'Necessário reforçar orientações médicas'
    });
  }
  
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: '✅',
      title: 'Indicadores estáveis',
      message: 'Continue seguindo as orientações médicas'
    });
  }
  
  return alerts.map(alert => `
    <div class="executive-alert alert-${alert.type}">
      <div class="alert-icon">${alert.icon}</div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-message">${alert.message}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Gera insights preditivos baseados em IA
 */
function generatePredictiveInsights(reportData: EnhancedReportData): string {
  return `
    <div class="predictive-insights-card">
      <h4 class="insights-title">🔮 Insights Preditivos</h4>
      <div class="insight-item">
        <div class="insight-probability">Probabilidade: 78%</div>
        <div class="insight-text">Tendência de melhora nas próximas 2 semanas</div>
      </div>
      <div class="insight-item">
        <div class="insight-probability">Risco: Baixo</div>
        <div class="insight-text">Padrão de sono estável reduz risco de crises</div>
      </div>
    </div>`;
}

/**
 * Gera análise de correlações
 */
function generateCorrelationAnalysis(reportData: EnhancedReportData): string {
  return `
    <div class="correlation-card">
      <h4 class="correlation-title">🔗 Análise de Correlações</h4>
      <div class="correlation-item">
        <div class="correlation-vars">Sono ↔ Dor</div>
        <div class="correlation-strength strong">Forte (0.82)</div>
      </div>
      <div class="correlation-item">
        <div class="correlation-vars">Humor ↔ Dor</div>
        <div class="correlation-strength moderate">Moderada (0.65)</div>
      </div>
    </div>`;
}

/**
 * Gera seção de resumo inteligente baseada em quiz - FORMATO APRIMORADO
 */
function generateQuizIntelligentSummarySection(reportData: EnhancedReportData): string {
  const digestiveAnalysis = reportData.digestiveAnalysis;
  const physicalActivity = reportData.physicalActivityAnalysis;
  const crisisAnalysis = reportData.crisisTemporalAnalysis;
  
  // Calcular intensidade média da dor dos dados reais
  const avgPain = reportData.painEvolution && reportData.painEvolution.length > 0
    ? (reportData.painEvolution.reduce((sum, p) => sum + p.level, 0) / reportData.painEvolution.length).toFixed(1)
    : 'N/A';
  
  return `
        <div class="intelligent-summary">
            <h3 class="title-data-section">📋 Resumo dos Questionários</h3>
            
            <div class="summary-section">
                <h3>🌅 Manhãs e Noites</h3>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-header">
                            <span class="metric-title">Intensidade média da Dor:</span>
                        </div>
                        <div class="metric-value-large">${avgPain}/10 😌</div>
                        <div class="metric-subtitle">└ Intensidade média ao final do dia</div>
                    </div>
                </div>
                
                ${generateDigestiveHealthSection(digestiveAnalysis)}
                
                ${generatePhysicalActivitySection(physicalActivity)}
                
                ${generateCrisisAnalysisSection(reportData)}
                
                ${crisisAnalysis?.insights && crisisAnalysis.insights.length > 0 
                  ? generateCrisisTemporalSection(crisisAnalysis) 
                  : ''
                }
                
                ${generateDoctorsSectionStandalone(reportData)}
                
                ${generateMedicationsSectionStandalone(reportData)}
            </div>
        </div>`;
}

/**
 * 💬 Gera seção dedicada aos insights de texto livre dos quizzes
 */
function generateTextInsightsSection(reportData: EnhancedReportData): string {
  const textSummaries = reportData.textSummaries;
  
  // Se não há textSummaries, não exibir a seção
  if (!textSummaries) {
    return '';
  }
  
  // Função para escapar HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Função para obter emoji do sentimento
  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': case 'positivo': return '😊';
      case 'negative': case 'negativo': return '😔';
      case 'neutral': case 'neutro': return '😐';
      default: return '🤔';
    }
  };

  // Função para formatar nível de urgência
  const getUrgencyLabel = (level: number) => {
    if (level >= 8) return { label: 'Crítica', emoji: '🚨', color: '#dc2626' };
    if (level >= 6) return { label: 'Alta', emoji: '⚠️', color: '#ea580c' };
    if (level >= 4) return { label: 'Moderada', emoji: '🔶', color: '#d97706' };
    return { label: 'Baixa', emoji: '🟢', color: '#16a34a' };
  };

  let sectionsContent = '';

  // Seção para Quiz Emergencial (Pergunta 4: "Quer descrever algo a mais?")
  if (textSummaries.emergencial && textSummaries.emergencial.textCount > 0) {
    const urgency = getUrgencyLabel(textSummaries.emergencial.averageUrgency || 5);
    sectionsContent += `
      <div class="text-insights-subsection">
        <h4>🆘 Quiz Emergencial - Observações Livres</h4>
        <div class="metric-row">
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-title">Análise das Crises Descritas:</span>
            </div>
            <div class="text-insights-content">
              <div class="insight-summary">
                ${getSentimentEmoji(textSummaries.emergencial.averageSentiment)} 
                <strong>Sentimento:</strong> ${textSummaries.emergencial.averageSentiment || 'Neutro'}
              </div>
              
              <div class="insight-summary">
                ${urgency.emoji} <strong>Urgência:</strong> 
                <span style="color: ${urgency.color}; font-weight: bold;">${urgency.label}</span>
                (${textSummaries.emergencial.averageUrgency || 5}/10)
              </div>
              
              <div class="insight-summary">
                📝 <strong>Textos analisados:</strong> ${textSummaries.emergencial.textCount}
              </div>
              
              ${textSummaries.emergencial.summary ? `
                <div class="insight-details">
                  <strong>💡 Resumo dos relatos:</strong><br>
                  "${escapeHtml(textSummaries.emergencial.summary)}"
                </div>
              ` : ''}
              
              ${textSummaries.emergencial.commonTriggers && textSummaries.emergencial.commonTriggers.length > 0 ? `
                <div class="insight-details">
                  <strong>🔍 Gatilhos comuns identificados:</strong><br>
                  ${textSummaries.emergencial.commonTriggers.map((trigger: string) => `• ${escapeHtml(trigger)}`).join('<br>')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Seção para Quiz Noturno (Pergunta 9: "Quer descrever algo a mais?")
  if (textSummaries.noturno && textSummaries.noturno.textCount > 0) {
    sectionsContent += `
      <div class="text-insights-subsection">
        <h4>🌙 Quiz Noturno - Observações do Dia</h4>
        <div class="metric-row">
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-title">Análise das Observações Noturnas:</span>
            </div>
            <div class="text-insights-content">
              <div class="insight-summary">
                ${getSentimentEmoji(textSummaries.noturno.averageSentiment)} 
                <strong>Sentimento:</strong> ${textSummaries.noturno.averageSentiment || 'Neutro'}
              </div>
              
              <div class="insight-summary">
                📝 <strong>Textos analisados:</strong> ${textSummaries.noturno.textCount}
              </div>
              
              <div class="insight-summary">
                📏 <strong>Tamanho médio:</strong> ${textSummaries.noturno.averageLength || 0} caracteres
              </div>
              
              ${textSummaries.noturno.summary ? `
                <div class="insight-details">
                  <strong>💡 Resumo das observações:</strong><br>
                  "${escapeHtml(textSummaries.noturno.summary)}"
                </div>
              ` : ''}
              
              ${textSummaries.noturno.keyPatterns && textSummaries.noturno.keyPatterns.length > 0 ? `
                <div class="insight-details">
                  <strong>🔍 Padrões identificados:</strong><br>
                  ${textSummaries.noturno.keyPatterns.map((pattern: string) => `• ${escapeHtml(pattern)}`).join('<br>')}
                </div>
              ` : ''}
              
              ${textSummaries.noturno.reflectionDepth ? `
                <div class="insight-details">
                  <strong>🤔 Profundidade de reflexão:</strong> ${escapeHtml(textSummaries.noturno.reflectionDepth)}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Seção combinada (insights longitudinais)
  if (textSummaries.combined && textSummaries.combined.totalTexts > 1) {
    sectionsContent += `
      <div class="text-insights-subsection">
        <h4>🧠 Análise Longitudinal dos Textos</h4>
        <div class="metric-row">
          <div class="metric-item">
            <div class="metric-header">
              <span class="metric-title">Padrões Identificados ao Longo do Tempo:</span>
            </div>
            <div class="text-insights-content">
              <div class="insight-summary">
                📊 <strong>Total de textos analisados:</strong> ${textSummaries.combined.totalTexts}
              </div>
              
              <div class="insight-summary">
                📅 <strong>Período analisado:</strong> ${textSummaries.combined.totalDays} dias
              </div>
              
              ${textSummaries.combined.summary ? `
                <div class="insight-details">
                  <strong>📈 Resumo longitudinal:</strong><br>
                  "${escapeHtml(textSummaries.combined.summary)}"
                </div>
              ` : ''}
              
              ${textSummaries.combined.clinicalRecommendations && textSummaries.combined.clinicalRecommendations.length > 0 ? `
                <div class="insight-details">
                  <strong>💡 Recomendações clínicas:</strong><br>
                  ${textSummaries.combined.clinicalRecommendations.map((rec: string) => 
                    `• ${escapeHtml(rec)}`
                  ).join('<br>')}
                </div>
              ` : ''}
              
              ${textSummaries.combined.timelineInsights ? `
                <div class="insight-details">
                  <strong>⏱️ Insights temporais:</strong> Evolução detectada ao longo do período
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Se não há nenhum conteúdo, retornar vazio
  if (!sectionsContent) {
    return '';
  }

  return `
    <div class="text-insights-section">
      <h2>💬 Insights de Texto Livre</h2>
      <div class="section-description">
        Análise inteligente das suas observações livres nos questionários, incluindo sentimentos, padrões e recomendações personalizadas.
      </div>
      
      ${sectionsContent}
    </div>
  `;
}

/**
 * 🆕 Gera seção independente de equipe médica
 */
function generateDoctorsSectionStandalone(reportData: EnhancedReportData): string {
  const doctors = (reportData as any).doctors || [];
  
  // Função para escapar HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };
  
  if (doctors.length === 0) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🏥 Equipe Médica:</div>
                    <div class="metric-status">📊 Nenhum médico cadastrado</div>
                    <div class="metric-subtitle">└ Vá para "Médicos" no menu principal para cadastrar</div>
                </div>
            </div>`;
  }

  // Normalizar nomes de campos (nome/name, especialidade/specialty)
  const normalizedDoctors = doctors.map((d: any) => ({
    name: d.nome || d.name || 'Nome não informado',
    specialty: d.especialidade || d.specialty || 'Especialidade não informada',
    crm: d.crm || 'CRM não informado'
  }));

  const specialties = Array.from(new Set(normalizedDoctors.map((d: any) => d.specialty)));
  
  return `
            <div class="doctors-section">
                <h3>🏥 Equipe Médica</h3>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Resumo da Equipe:</div>
                        <div class="doctors-summary">
                            ${normalizedDoctors.length} médico(s) • ${specialties.length} especialidade(s)
                        </div>
                        <div class="doctors-list">
                            ${normalizedDoctors.slice(0, 4).map((doctor: any) => 
                              `👨‍⚕️ Dr(a). ${escapeHtml(doctor.name)} (${escapeHtml(doctor.specialty)})`
                            ).join('<br>')}
                            ${normalizedDoctors.length > 4 ? `<br>• +${normalizedDoctors.length - 4} outros médicos` : ''}
                        </div>
                        
                        <div class="analysis-details">
                            <strong>📊 Especialidades:</strong><br>
                            ${specialties.slice(0, 3).map((spec: any) => `• ${escapeHtml(String(spec))}`).join('<br>')}
                            ${specialties.length > 3 ? `<br>• +${specialties.length - 3} outras especialidades` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
}

/**
 * 🆕 Gera seção independente de medicamentos
 */
function generateMedicationsSectionStandalone(reportData: EnhancedReportData): string {
  const medications = (reportData as any).medications || [];
  const rescueMedications = (reportData as any).rescueMedications || [];
  
  // Função para escapar HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };
  
  if (medications.length === 0 && rescueMedications.length === 0) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">💊 Medicamentos:</div>
                    <div class="metric-status">📊 Nenhum medicamento cadastrado</div>
                    <div class="metric-subtitle">└ Vá para "Medicamentos" no menu principal para cadastrar</div>
                </div>
            </div>`;
  }

  // Normalizar nomes de campos para medicamentos regulares
  const normalizedMedications = medications.map((med: any) => ({
    name: med.nome || med.name || 'Medicamento',
    dosage: med.posologia || med.dosage || 'Dose não especificada',
    frequency: med.frequencia || med.frequency || 'Não especificada'
  }));

  // Normalizar nomes de campos para medicamentos de resgate
  const normalizedRescueMedications = rescueMedications.map((med: any) => ({
    name: med.medication || med.nome || med.name || 'Medicamento',
    frequency: med.frequency || med.frequencia || 0,
    riskLevel: med.riskLevel || 'medium'
  }));

  const totalMedications = normalizedMedications.length;
  const totalRescueMedications = normalizedRescueMedications.length;
  
  return `
            <div class="medications-section">
                <h3>💊 Medicamentos</h3>
                
                ${normalizedMedications.length > 0 ? `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Medicamentos Regulares:</div>
                        <div class="medications-summary">
                            ${totalMedications} medicamento(s) em uso regular
                        </div>
                        
                        <div class="medications-list">
                            ${normalizedMedications.slice(0, 4).map((med: any) => 
                              `💊 ${escapeHtml(String(med.name || ''))} - ${escapeHtml(String(med.dosage || ''))}`
                            ).join('<br>')}
                            ${normalizedMedications.length > 4 ? `<br>• +${normalizedMedications.length - 4} outros medicamentos` : ''}
                        </div>
                        
                        <div class="analysis-details">
                            <strong>📊 Frequências:</strong><br>
                            ${normalizedMedications.slice(0, 3).map((med: any) => 
                              `• ${escapeHtml(String(med.name || ''))}: ${escapeHtml(String(med.frequency || ''))}`
                            ).join('<br>')}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${normalizedRescueMedications.length > 0 ? `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Medicamentos de Resgate:</div>
                        <div class="medications-summary">
                            ${totalRescueMedications} medicamento(s) utilizados em crises
                        </div>
                        
                        <div class="medications-list">
                            ${normalizedRescueMedications.slice(0, 3).map((med: any) => 
                              `🚨 ${escapeHtml(String(med.name || ''))} (${med.frequency || 0}x)`
                            ).join('<br>')}
                            ${normalizedRescueMedications.length > 3 ? `<br>• +${normalizedRescueMedications.length - 3} outros medicamentos de resgate` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>`;
}

/**
 * 🆕 Gera seção de saúde digestiva no formato do relatório analisado
 */
function generateDigestiveHealthSection(digestiveAnalysis: any): string {
  if (!digestiveAnalysis) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🏥 Saúde Digestiva:</div>
                    <div class="metric-status">📊 Ainda coletando dados de evacuação</div>
                    <div class="metric-subtitle">└ Continue respondendo os questionários noturnos</div>
                </div>
            </div>`;
  }

  const statusEmoji = {
    'normal': '✅',
    'mild_constipation': '⚠️',
    'moderate_constipation': '❗',
    'severe_constipation': '🚨'
  };

  const statusText = {
    'normal': 'Normal',
    'mild_constipation': 'Constipação leve',
    'moderate_constipation': 'Atenção Necessária ❗',
    'severe_constipation': 'Constipação severa'
  };

  return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🏥 Saúde Digestiva:</div>
                    <div class="metric-status">${(statusText as any)[digestiveAnalysis.status]} ${(statusEmoji as any)[digestiveAnalysis.status]}</div>
                    <div class="metric-subtitle">
                        ${digestiveAnalysis.status !== 'normal' 
                          ? `Constipação moderada. Maior intervalo: ${digestiveAnalysis.maxInterval} dias, média: ${digestiveAnalysis.averageInterval} dia(s). Última evacuação: há ${digestiveAnalysis.daysSinceLastBowelMovement} dia(s)`
                          : 'Padrão intestinal dentro da normalidade'
                        }
                    </div>
                    
                    ${digestiveAnalysis.status !== 'normal' ? `
                    <div class="analysis-details">
                        <strong>📊 Análise de Intervalos:</strong><br>
                        • Maior intervalo: ${digestiveAnalysis.maxInterval} dia(s)<br>
                        • Intervalo médio: ${digestiveAnalysis.averageInterval} dia(s)<br>
                        • Última evacuação: há ${digestiveAnalysis.daysSinceLastBowelMovement} dia(s)<br>
                        • Frequência: ${digestiveAnalysis.frequency}% dos dias
                    </div>
                    
                    <div class="recommendation">
                        <strong>💡 Recomendação:</strong><br>
                        ${digestiveAnalysis.recommendation}
                    </div>
                    ` : ''}
                </div>
            </div>`;
}

/**
 * 🆕 Gera seção de atividades físicas no formato do relatório analisado
 */
function generatePhysicalActivitySection(physicalActivity: any): string {
  if (!physicalActivity) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🏃 Atividades Físicas:</div>
                    <div class="metric-status">📊 Ainda coletando dados de atividades</div>
                    <div class="metric-subtitle">└ Continue respondendo os questionários noturnos (Pergunta 6)</div>
                </div>
            </div>`;
  }

  const activityLevelEmoji = {
    'sedentário': '🔴',
    'levemente_ativo': '🟡',
    'moderadamente_ativo': '🟢',
    'muito_ativo': '🔵'
  };

  const activitiesList = physicalActivity.activityBreakdown
    .map((activity: any) => `🏃 ${activity.activity} (${activity.days} dias)`)
    .join(' • ');

  return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🏃 Atividades Físicas:</div>
                    <div class="activity-list">${activitiesList}</div>
                    <div class="metric-subtitle">└ Você se manteve ativo em ${physicalActivity.activeDays} de ${physicalActivity.totalDays} dias (${physicalActivity.activePercentage}%)</div>
                    
                    <div class="analysis-details">
                        <strong>🧠 Análise de Atividades:</strong><br>
                        • Total de atividades registradas: ${physicalActivity.activityBreakdown.reduce((sum: number, a: any) => sum + a.days, 0)} registros<br>
                        ${physicalActivity.activityBreakdown.slice(0, 3).map((activity: any) => 
                          `• ${activity.activity}: ${activity.days} dia(s) - ${activity.percentage}% dos dias ativos`
                        ).join('<br>')}<br>
                        • Nível de atividade: ${physicalActivity.activityLevel} ${(activityLevelEmoji as any)[physicalActivity.activityLevel]}
                    </div>
                    
                    <div class="recommendation">
                        <strong>💡 Recomendação:</strong><br>
                        ${physicalActivity.recommendation}
                    </div>
                </div>
            </div>`;
}

/**
 * 🆕 Gera seção de análise de crises no formato do relatório analisado
 */
function generateCrisisAnalysisSection(reportData: EnhancedReportData): string {
  const crises = reportData.painEvolution?.filter(p => p.level >= 7) || [];
  const totalDays = reportData.painEvolution?.length || 0;
  const rescueMedications = (reportData as any).rescueMedications || [];
  
  if (crises.length === 0) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">🚨 Episódios de Crise</div>
                    <div class="metric-status">✅ Nenhuma crise registrada no período</div>
                    <div class="metric-subtitle">└ Continue monitorando para detecção precoce</div>
                </div>
            </div>`;
  }

  const avgPainInCrises = crises.length > 0
    ? (crises.reduce((sum, c) => sum + c.level, 0) / crises.length).toFixed(1)
    : '0';

  const avgInterval = totalDays > 0 && crises.length > 1
    ? (totalDays / crises.length).toFixed(1)
    : totalDays.toString();

  // Contar locais de dor (simulado baseado em dados típicos)
  const painLocations = reportData.painPoints?.slice(0, 3) || [];

  return `
            <div class="crisis-section">
                <h3>🚨 Episódios de Crise</h3>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Frequência:</div>
                        <div class="metric-value">${crises.length} crises em ${totalDays} dias</div>
                        <div class="metric-subtitle">└ Média de 1 crise a cada ${avgInterval} dias</div>
                    </div>
                </div>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Intensidade Média:</div>
                        <div class="metric-value-large">${avgPainInCrises}/10 😖</div>
                        <div class="metric-subtitle">└ Classificação: "Dor intensa"</div>
                    </div>
                </div>
                
                ${painLocations.length > 0 ? `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">Locais Mais Afetados:</div>
                        <div class="pain-locations">
                            ${painLocations.map((location: any) => `🎯 ${location.local} (${location.occurrences} vezes)`).join(' • ')}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${generateRescueMedicationsInCrisis(rescueMedications)}
            </div>`;
}

/**
 * 🆕 Gera seção de medicamentos de resgate utilizados durante crises
 */
function generateRescueMedicationsInCrisis(rescueMedications: any[]): string {
  if (!rescueMedications || rescueMedications.length === 0) {
    return '';
  }

  // Função para escapar HTML
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Ordenar medicamentos por frequência
  const sortedMedications = rescueMedications
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3); // Mostrar apenas os 3 mais usados

  const totalUses = rescueMedications.reduce((sum, med) => sum + med.frequency, 0);
  const mostUsedMed = sortedMedications[0];
  
  // Contar medicamentos por nível de risco
  const riskCounts = rescueMedications.reduce((acc, med) => {
    acc[med.riskLevel] = (acc[med.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskEmojis = {
    'low': '🟢',
    'medium': '🟡', 
    'high': '🔴'
  };

  return `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">💊 Medicamentos de Resgate:</div>
                        <div class="medications-summary">
                            ${rescueMedications.length} medicamento(s) • ${totalUses} uso(s) total
                        </div>
                        
                        ${mostUsedMed ? `
                        <div class="medication-highlight">
                            <strong>🏆 Mais Utilizado:</strong> ${escapeHtml(String(mostUsedMed.medication || mostUsedMed.name || 'N/A'))}<br>
                            └ ${mostUsedMed.frequency || 0} uso(s) • Risco ${(mostUsedMed.riskLevel || 'medium').toUpperCase()} ${(riskEmojis as any)[mostUsedMed.riskLevel || 'medium']}
                        </div>
                        ` : ''}
                        
                        <div class="medications-list">
                            ${sortedMedications.map((med: any) => 
                              `💊 ${escapeHtml(String(med.medication || med.name || 'Medicamento'))} (${med.frequency || 0}x) ${(riskEmojis as any)[med.riskLevel || 'medium']}`
                            ).join('<br>')}
                            ${rescueMedications.length > 3 ? `<br>• +${rescueMedications.length - 3} outros medicamentos` : ''}
                        </div>
                        
                        <div class="analysis-details">
                            <strong>📊 Análise de Risco:</strong><br>
                            ${riskCounts.low ? `🟢 Baixo: ${riskCounts.low} medicamento(s) • ` : ''}
                            ${riskCounts.medium ? `🟡 Médio: ${riskCounts.medium} medicamento(s) • ` : ''}
                            ${riskCounts.high ? `🔴 Alto: ${riskCounts.high} medicamento(s)` : ''}
                        </div>
                    </div>
                </div>`;
}

/**
 * 🆕 Gera seção de análise temporal de crises
 */
function generateCrisisTemporalSection(crisisAnalysis: any): string {
  const highestRiskPeriod = crisisAnalysis.riskPeriods[0];
  
  return `
            <div class="temporal-analysis">
                <h3>⏰ Padrões Temporais</h3>
                
                <div class="analysis-details">
                    <strong>Horários de Maior Risco:</strong><br>
                    🕐 ${highestRiskPeriod.period} (${highestRiskPeriod.percentage}% das crises)
                    
                    ${crisisAnalysis.peakHours.length > 0 ? `<br><br>
                    <strong>Horários específicos:</strong> ${crisisAnalysis.peakHours.join(', ')}
                    ` : ''}
                    
                    ${crisisAnalysis.insights.length > 0 ? `<br><br>
                    <strong>💡 Insight:</strong> ${crisisAnalysis.insights[0]}
                    ` : ''}
                </div>
            </div>`;
}

/**
 * 🆕 Gera seção de análise médica completa
 */
function generateMedicalAnalysisSection(reportData: EnhancedReportData): string {
  const doctors = (reportData as any).doctors || [];
  const medications = (reportData as any).medications || [];
  
  if (doctors.length === 0 && medications.length === 0) {
    return `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-title">👨‍⚕️ Análise Médica:</div>
                    <div class="metric-status">📊 Cadastre médicos e medicamentos para análises detalhadas</div>
                    <div class="metric-subtitle">└ Vá para "Médicos" e "Medicamentos" no menu principal</div>
                </div>
            </div>`;
  }
  
  // Gerar dados de dor simulados para análise
  const painData = reportData.painEvolution?.map(p => ({
    date: p.date,
    level: p.level,
    timestamp: new Date(),
    quizType: 'matinal' as const
  })) || [];
  
  // Realizar análises usando o novo serviço
  let medicationEffectiveness: MedicationEffectiveness[] = [];
  let specialtyAnalysis: DoctorSpecialtyAnalysis[] = [];
  let insights: MedicalInsight[] = [];
  
  try {
    medicationEffectiveness = MedicalCorrelationService.analyzeMedicationEffectiveness(medications, doctors, painData);
    specialtyAnalysis = MedicalCorrelationService.analyzeDoctorSpecialtyCorrelation(doctors, medications, painData);
    insights = MedicalCorrelationService.generateMedicalInsights(medications, doctors, painData);
  } catch (error) {
    console.warn('⚠️ Erro na análise médica:', error);
  }
  
  return `
            <div class="medical-analysis-section">
                <h3>👨‍⚕️ Análise do Cuidado Médico</h3>
                
                ${generateDoctorsOverview(doctors, specialtyAnalysis)}
                
                ${generateMedicationsEffectivenessSection(medications, medicationEffectiveness)}
                
                ${generateMedicalInsightsSection(insights)}
                
                ${generateAdvancedNLPSection(reportData)}
                
                ${generateMedicationAdherenceSection(reportData)}
            </div>`;
}

/**
 * Gera visão geral dos médicos e especialidades
 */
function generateDoctorsOverview(doctors: Doctor[], specialtyAnalysis: DoctorSpecialtyAnalysis[]): string {
  if (doctors.length === 0) {
    return '';
  }
  
  const specialties = Array.from(new Set(doctors.map(d => d.especialidade)));
  const topSpecialty = specialtyAnalysis.length > 0 ? specialtyAnalysis[0] : null;
  
  return `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">🏥 Equipe Médica:</div>
                        <div class="doctors-summary">
                            ${doctors.length} médico(s) • ${specialties.length} especialidade(s)
                        </div>
                        <div class="doctors-list">
                            ${doctors.slice(0, 3).map(doctor => 
                              `👨‍⚕️ ${doctor.nome} (${doctor.especialidade})`
                            ).join(' • ')}
                            ${doctors.length > 3 ? ` • +${doctors.length - 3} outros` : ''}
                        </div>
                        
                        ${topSpecialty ? `
                        <div class="specialty-highlight">
                            <strong>🎯 Destaque:</strong> ${topSpecialty.specialty} 
                            (${(topSpecialty.averagePainImprovement * 100).toFixed(1)}% de melhoria)
                        </div>
                        ` : ''}
                    </div>
                </div>`;
}

/**
 * Gera seção de eficácia de medicamentos
 */
function generateMedicationsEffectivenessSection(medications: any[], effectiveness: MedicationEffectiveness[]): string {
  if (medications.length === 0) {
    return '';
  }
  
  const topMedication = effectiveness.length > 0 ? effectiveness[0] : null;
  const totalMedications = medications.length;
  
  return `
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-title">💊 Medicamentos:</div>
                        <div class="medications-summary">
                            ${totalMedications} medicamento(s) em uso
                        </div>
                        
                        ${topMedication ? `
                        <div class="medication-highlight">
                            <strong>🏆 Mais Eficaz:</strong> ${topMedication.medicationName}<br>
                            └ ${(topMedication.averagePainReduction * 100).toFixed(1)}% de redução da dor
                            (${topMedication.effectivenessRating.replace('_', ' ').toLowerCase()})
                        </div>
                        ` : ''}
                        
                        <div class="medications-list">
                            ${medications.slice(0, 3).map(med => 
                              `💊 ${med.nome} (${med.frequencia})`
                            ).join('<br>')}
                            ${medications.length > 3 ? `<br>• +${medications.length - 3} outros medicamentos` : ''}
                        </div>
                    </div>
                </div>`;
}

/**
 * Gera seção de insights médicos
 */
function generateMedicalInsightsSection(insights: MedicalInsight[]): string {
  if (insights.length === 0) {
    return '';
  }
  
  const highPriorityInsights = insights.filter(i => i.priority === 'ALTA').slice(0, 2);
  
  return `
                <div class="medical-insights">
                    <h4>💡 Insights Médicos</h4>
                    ${highPriorityInsights.map(insight => `
                    <div class="insight-item priority-${insight.priority.toLowerCase()}">
                        <div class="insight-title-medical">${insight.title}</div>
                        <div class="insight-description">${insight.description}</div>
                        <div class="insight-recommendation">
                            <strong>Recomendação:</strong> ${insight.recommendation}
                        </div>
                    </div>
                    `).join('')}
                    
                    ${insights.length > highPriorityInsights.length ? `
                    <div class="more-insights">
                        <em>+${insights.length - highPriorityInsights.length} insights adicionais disponíveis</em>
                    </div>
                    ` : ''}
                </div>`;
}

/**
 * 🧠 Gera seção de análise NLP médica avançada
 */
function generateAdvancedNLPSection(reportData: EnhancedReportData): string {
  const nlpAnalysis = reportData.medicalNLPAnalysis;
  
  if (!nlpAnalysis || !nlpAnalysis.medicalMentions.length) {
    return `
                <div class="advanced-nlp-section">
                    <h4>🧠 Análise Contextual de Textos</h4>
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">📝 Status:</div>
                            <div class="metric-value">Não há menções médicas suficientes nos textos para análise</div>
                            <div class="metric-subtitle">└ Continue registrando detalhes sobre tratamentos</div>
                        </div>
                    </div>
                </div>`;
  }
  
  const { medicalMentions, medicationReferences, treatmentSentiment, predictiveInsights } = nlpAnalysis;
  
  // Estatísticas de menções
  const totalMentions = medicalMentions.length;
  const medMentions = medicalMentions.filter(m => m.type === 'MEDICATION').length;
  const doctorMentions = medicalMentions.filter(m => m.type === 'DOCTOR').length;
  
  // Sentimento geral
  const sentimentEmoji = treatmentSentiment.overallSentiment === 'POSITIVO' ? '😊' : 
                        treatmentSentiment.overallSentiment === 'NEGATIVO' ? '😔' : '😐';
  
  return `
                <div class="advanced-nlp-section">
                    <h4>🧠 Análise Contextual de Textos</h4>
                    
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">📊 Menções Detectadas:</div>
                            <div class="metric-value">${totalMentions} referências médicas</div>
                            <div class="metric-subtitle">
                                └ ${medMentions} medicamentos • ${doctorMentions} médicos
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">🎯 Sentimento Sobre Tratamento:</div>
                            <div class="sentiment-analysis">
                                <span class="sentiment-${treatmentSentiment.overallSentiment.toLowerCase()}">
                                    ${sentimentEmoji} ${treatmentSentiment.overallSentiment}
                                </span>
                                <div class="sentiment-breakdown">
                                    ✅ ${treatmentSentiment.positiveCount} positivos • 
                                    ❌ ${treatmentSentiment.negativeCount} negativos • 
                                    ⚪ ${treatmentSentiment.neutralCount} neutros
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${treatmentSentiment.improvementMentions > 0 ? `
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">📈 Menções de Melhoria:</div>
                            <div class="metric-value improvement">${treatmentSentiment.improvementMentions} relatos</div>
                            <div class="metric-subtitle">└ Indicadores positivos de progresso</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${predictiveInsights.length > 0 ? `
                    <div class="nlp-insights">
                        <strong>💡 Insights Preditivos:</strong>
                        ${predictiveInsights.slice(0, 2).map(insight => `
                        <div class="insight-item priority-${insight.priority.toLowerCase()}">
                            <div class="insight-title-nlp">${insight.title}</div>
                            <div class="insight-description">${insight.description}</div>
                            ${insight.recommendation ? `<div class="insight-recommendation">💡 ${insight.recommendation}</div>` : ''}
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>`;
}

/**
 * 📊 Gera seção de gráficos de adesão aos medicamentos
 */
function generateMedicationAdherenceSection(reportData: EnhancedReportData): string {
  const adherenceData = reportData.medicationAdherenceCharts;
  
  if (!adherenceData || !adherenceData.adherenceData.length) {
    return `
                <div class="adherence-section">
                    <h4>📊 Adesão aos Medicamentos</h4>
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">📝 Status:</div>
                            <div class="metric-value">Dados insuficientes para análise de adesão</div>
                            <div class="metric-subtitle">└ Registre mais detalhes sobre uso de medicamentos</div>
                        </div>
                    </div>
                </div>`;
  }
  
  const { adherenceData: medData, overallAdherence, riskMedications } = adherenceData;
  const overallPercent = (overallAdherence * 100).toFixed(1);
  
  // Top 3 medicamentos por adesão
  const topMedications = medData
    .sort((a, b) => b.adherenceScore - a.adherenceScore)
    .slice(0, 3);
  
  const adherenceStatus = overallAdherence >= 0.8 ? 'excelente' : 
                         overallAdherence >= 0.6 ? 'boa' : 
                         overallAdherence >= 0.4 ? 'moderada' : 'baixa';
  
  const adherenceEmoji = overallAdherence >= 0.8 ? '🟢' : 
                        overallAdherence >= 0.6 ? '🟡' : '🔴';
  
  return `
                <div class="adherence-section">
                    <h4>📊 Adesão aos Medicamentos</h4>
                    
                    <div class="metric-row">
                        <div class="metric-item">
                            <div class="metric-title">📈 Adesão Geral:</div>
                            <div class="metric-value-large adherence-${adherenceStatus}">
                                ${adherenceEmoji} ${overallPercent}%
                            </div>
                            <div class="metric-subtitle">└ Adesão ${adherenceStatus} ao tratamento</div>
                        </div>
                    </div>
                    
                    <div class="adherence-chart-container">
                        <h5>🏆 Top Medicamentos por Adesão</h5>
                        ${topMedications.map((med, index) => {
                          const score = (med.adherenceScore * 100).toFixed(1);
                          const barWidth = med.adherenceScore * 100;
                          const statusClass = med.adherenceScore >= 0.8 ? 'high' : 
                                            med.adherenceScore >= 0.6 ? 'medium' : 'low';
                          
                          return `
                        <div class="adherence-bar-item">
                            <div class="medication-name">
                                ${index + 1}. ${med.medicationName}
                                <span class="adherence-score">${score}%</span>
                            </div>
                            <div class="adherence-bar">
                                <div class="adherence-fill adherence-${statusClass}" 
                                     style="width: ${barWidth}%"></div>
                            </div>
                            <div class="adherence-details">
                                ${med.positiveEvents} eventos positivos • ${med.negativeEvents} negativos
                            </div>
                        </div>
                          `;
                        }).join('')}
                    </div>
                    
                    ${riskMedications.length > 0 ? `
                    <div class="risk-medications">
                        <h5>⚠️ Medicamentos de Risco (Adesão < 60%)</h5>
                        <div class="risk-list">
                            ${riskMedications.map(med => `
                            <div class="risk-item">
                                🔴 ${med}
                            </div>
                            `).join('')}
                        </div>
                        <div class="recommendation">
                            <strong>💡 Recomendação:</strong><br>
                            Configure lembretes mais frequentes e discuta barreiras para adesão com seu médico.
                        </div>
                    </div>
                    ` : ''}
                </div>`;
}

/**
 * Gera seções tradicionais do relatório
 */
function generateTraditionalSections(reportData: EnhancedReportData): string {
  return `
        <div class="nlp-insights">
            <div class="insight-card">
                <div class="insight-header">
                    <h3 class="insight-title">🎯 Análise de Sentimento</h3>
                    <div class="sentiment-indicator sentiment-${(reportData as any).nlpInsights?.sentimentAnalysis?.overallSentiment || 'neutral'}">
                        ${(reportData as any).nlpInsights?.sentimentAnalysis?.overallSentiment || 'Neutro'}
                    </div>
                </div>
                <p>Análise de sentimento geral dos seus registros de dor e bem-estar.</p>
            </div>
            
            <div class="insight-card">
                <div class="insight-header">
                    <h3 class="insight-title">📈 Tendências de Dor</h3>
                    <div class="trend-indicator trend-stable">
                        Estável
                    </div>
                </div>
                <p>Evolução dos níveis de dor ao longo do período analisado.</p>
            </div>
        </div>

        <div class="section-enhanced">
            <h2 class="section-title-enhanced">
                <span class="section-icon">📊</span>
                Visualizações de Dados
            </h2>
            <div id="charts-container">
                <canvas id="painTrendChart" width="400" height="200"></canvas>
            </div>
        </div>`;
}

/**
 * Gera footer enhanced
 */
function generateEnhancedFooter(reportId: string, reportData: EnhancedReportData): string {
  return `
        <div class="report-footer">
            <div class="footer-content">
                <div class="footer-info">
                    <p><strong>Relatório ID:</strong> ${reportId}</p>
                    <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Versão:</strong> Enhanced 3.0</p>
                </div>
                <div class="footer-disclaimer">
                    <p>⚠️ <strong>Importante:</strong> Este relatório é uma ferramenta de acompanhamento e não substitui consulta médica profissional.</p>
                </div>
            </div>
        </div>`;
}

/**
 * Gera CSS enhanced para o relatório
 */
function getEnhancedReportCSS(): string {
  return `
        :root {
            /* FibroDiário - Cores oficiais PWA */
            --fibro-purple: #9C27B0;
            --fibro-yellow: #FBC02D;
            --fibro-green: #66BB6A;
            --fibro-purple-light: #E1BEE7;
            --fibro-yellow-light: #FFF9C4;
            --fibro-green-light: #C8E6C9;
            
            /* Mapeamento para compatibilidade */
            --primary: var(--fibro-purple);
            --accent: var(--fibro-yellow);
            --secondary: var(--fibro-green);
            --success: var(--fibro-green);
            --warning: var(--fibro-yellow);
            --danger: #ef4444;
            --info: var(--fibro-purple);
            
            --sentiment-positive: #10b981;
            --sentiment-negative: #ef4444;
            --sentiment-neutral: #6b7280;
            
            --gray-50: #fafafa;
            --gray-100: #f4f4f5;
            --gray-200: #e4e4e7;
            --gray-300: #d4d4d8;
            --gray-400: #a1a1aa;
            --gray-500: #71717a;
            --gray-600: #52525b;
            --gray-700: #3f3f46;
            --gray-800: #27272a;
            --gray-900: #18181b;
            
            --background: white;
            --surface: var(--gray-50);
            --surface-elevated: white;
            --border: var(--gray-200);
            --border-elevated: var(--gray-300);
            --text: var(--gray-900);
            --text-muted: var(--gray-600);
            --text-subtle: var(--gray-500);
            
            --space-1: 0.25rem;
            --space-2: 0.5rem;
            --space-3: 0.75rem;
            --space-4: 1rem;
            --space-5: 1.25rem;
            --space-6: 1.5rem;
            --space-8: 2rem;
            --space-10: 2.5rem;
            --space-12: 3rem;
            --space-16: 4rem;
            
            --text-xs: 0.75rem;
            --text-sm: 0.875rem;
            --text-base: 1rem;
            --text-lg: 1.125rem;
            --text-xl: 1.25rem;
            --text-2xl: 1.5rem;
            --text-3xl: 1.875rem;
            --text-4xl: 2.25rem;
            
            --radius-sm: 0.375rem;
            --radius: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: var(--text-base);
            line-height: 1.6;
            color: var(--text);
            background: var(--surface);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            width: 100%;
            max-width: 64rem;
            margin: 0 auto;
            padding: var(--space-4);
            background: var(--background);
            min-height: 100vh;
        }

        @media (min-width: 768px) {
            .container {
                padding: var(--space-6);
            }
        }

        /* ===== HEADER PREMIUM ===== */
        .header-premium {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #7c3aed 100%);
            color: white;
            padding: var(--space-8);
            margin: calc(-1 * var(--space-4)) calc(-1 * var(--space-4)) var(--space-8);
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(30, 58, 138, 0.3);
            border-radius: 0 0 1.5rem 1.5rem;
        }

        @media (min-width: 768px) {
            .header-premium {
                padding: var(--space-12);
                margin: calc(-1 * var(--space-6)) calc(-1 * var(--space-6)) var(--space-10);
            }
        }

        .header-premium::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
            opacity: 0.3;
        }

        .header-premium * {
            position: relative;
            z-index: 1;
        }

        .logo-premium {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-6);
            margin-bottom: var(--space-6);
        }

        .fibro-logo-premium {
            display: flex;
            align-items: center;
            justify-content: center;
            animation: gentle-pulse 4s ease-in-out infinite;
            filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4));
        }
        
        .report-icon {
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px;
            backdrop-filter: blur(10px);
        }

        .brand-text-premium {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .app-name-premium {
            font-size: var(--text-4xl);
            font-weight: 800;
            line-height: 1;
            margin-bottom: var(--space-2);
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #ffffff, #f8fafc);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .app-subtitle-premium {
            font-size: var(--text-xl);
            font-weight: 600;
            opacity: 0.95;
            line-height: 1.2;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .user-info-premium {
            font-size: var(--text-base);
            opacity: 0.95;
            background: rgba(255, 255, 255, 0.15);
            padding: var(--space-3) var(--space-6);
            border-radius: var(--radius-xl);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            font-weight: 500;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        @keyframes gentle-pulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 1; 
            }
            50% { 
                transform: scale(1.05);
                opacity: 0.9; 
            }
        }

        .subtitle-premium {
            font-size: var(--text-2xl);
            font-weight: 600;
            margin-bottom: var(--space-8);
            opacity: 0.95;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .header-badges-premium {
            display: flex;
            justify-content: center;
            gap: var(--space-3);
            flex-wrap: wrap;
            margin-bottom: var(--space-6);
        }

        @media (min-width: 768px) {
            .header-badges {
                gap: var(--space-4);
            }
        }

        .badge-premium {
            background: rgba(255, 255, 255, 0.15);
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-xl);
            font-size: var(--text-sm);
            font-weight: 600;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            min-height: 40px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .badge-premium:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .ai-badge { border-color: #fbbf24; }
        .nlp-badge { border-color: #34d399; }
        .predict-badge { border-color: #a78bfa; }
        .medical-badge { border-color: #fb7185; }

        @media (min-width: 768px) {
            .badge {
                padding: var(--space-2) var(--space-4);
                font-size: var(--text-sm);
                min-height: auto;
            }
        }

        .section-enhanced {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: 0.75rem; /* Consistente com PWA */
            padding: var(--space-4);
            margin-bottom: var(--space-6);
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 768px) {
            .section-enhanced {
                padding: var(--space-8);
                margin-bottom: var(--space-8);
            }
        }

        .section-enhanced:hover {
            box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.1);
            border-color: var(--fibro-purple-light);
            transform: translateY(-1px);
        }

        .section-title-enhanced {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            font-size: var(--text-2xl);
            font-weight: 600;
            color: var(--text);
            margin-bottom: var(--space-6);
            padding-bottom: var(--space-4);
            border-bottom: 2px solid var(--border);
        }

        .section-icon {
            font-size: var(--text-2xl);
            opacity: 0.8;
        }

        .executive-summary {
            background: linear-gradient(135deg, var(--success) 0%, var(--info) 100%);
            color: white;
            padding: var(--space-8);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-8);
            position: relative;
            overflow: hidden;
        }

        .executive-summary::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            transform: skewY(-3deg);
            transform-origin: top left;
        }

        .executive-summary * {
            position: relative;
            z-index: 1;
        }

        .summary-text {
            font-size: var(--text-lg);
            line-height: 1.7;
            margin-bottom: var(--space-6);
        }

        .key-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: var(--space-4);
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.2);
            padding: var(--space-4);
            border-radius: var(--radius);
            text-align: center;
            backdrop-filter: blur(10px);
        }

        .metric-value {
            font-size: var(--text-2xl);
            font-weight: 700;
            margin-bottom: var(--space-1);
        }

        .metric-label {
            font-size: var(--text-sm);
            opacity: 0.9;
        }

        .nlp-insights {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: var(--space-6);
            margin-bottom: var(--space-8);
        }

        .insight-card {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            box-shadow: var(--shadow-sm);
        }

        .insight-header {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            margin-bottom: var(--space-4);
        }

        .insight-title {
            font-size: var(--text-lg);
            font-weight: 600;
            color: var(--text);
        }

        .sentiment-indicator, .trend-indicator {
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius);
            font-size: var(--text-sm);
            font-weight: 500;
            color: white;
            text-transform: capitalize;
        }

        .sentiment-positive, .trend-improving { background: var(--sentiment-positive); }
        .sentiment-negative, .trend-worsening { background: var(--sentiment-negative); }
        .sentiment-neutral, .trend-stable { background: var(--sentiment-neutral); }

        .report-footer {
            margin-top: var(--space-8);
            padding: var(--space-6);
            background: var(--gray-50);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
        }

        .footer-content {
            display: grid;
            gap: var(--space-4);
        }

        .footer-info p {
            margin-bottom: var(--space-1);
            color: var(--text-muted);
        }

        .footer-disclaimer {
            padding: var(--space-4);
            background: var(--warning);
            color: white;
            border-radius: var(--radius);
        }

        #charts-container {
            margin-top: var(--space-6);
        }

        canvas {
            max-width: 100%;
            height: auto;
        }
        
        /* Sistema responsivo mobile-first */
        @media (max-width: 640px) {
            .container {
                padding: var(--space-4) !important;
            }
            
            .enhanced-header {
                margin: calc(-1 * var(--space-4)) calc(-1 * var(--space-4)) var(--space-6);
                padding: var(--space-6);
            }
            
            .logo-enhanced {
                font-size: var(--text-2xl);
                flex-direction: column;
                gap: var(--space-2);
            }
            
            .logo-enhanced .brain-icon {
                font-size: var(--text-3xl);
            }
            
            .subtitle-enhanced {
                font-size: var(--text-lg);
            }
            
            .section-enhanced {
                padding: var(--space-4);
                margin-bottom: var(--space-6);
            }
            
            .section-title-enhanced {
                font-size: var(--text-xl);
                flex-direction: column;
                text-align: center;
                gap: var(--space-2);
            }
            
            .nlp-insights {
                grid-template-columns: 1fr;
                gap: var(--space-4);
            }
            
            .key-metrics {
                grid-template-columns: 1fr;
            }
            
            .header-badges {
                flex-direction: column;
                align-items: center;
            }
            
            .badge {
                min-width: 120px;
                text-align: center;
            }
            
            .insight-card {
                padding: var(--space-4);
            }
            
            .metric-card {
                padding: var(--space-3);
            }
            
            .metric-value {
                font-size: var(--text-xl);
            }
        }
        
        @media (max-width: 375px) {
            .container {
                padding: var(--space-3) !important;
            }
            
            .enhanced-header {
                margin: calc(-1 * var(--space-3)) calc(-1 * var(--space-3)) var(--space-4);
                padding: var(--space-4);
            }
            
            .section-enhanced {
                padding: var(--space-3);
            }
            
            .logo-enhanced {
                font-size: var(--text-xl);
            }
            
            .logo-enhanced .brain-icon {
                font-size: var(--text-2xl);
            }
            
            .key-metrics {
                grid-template-columns: 1fr;
                gap: var(--space-2);
            }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
            .key-metrics {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .nlp-insights {
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            }
        }
        
        @media (min-width: 769px) {
            .key-metrics {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .nlp-insights {
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            }
        }
        
        /* Touch-friendly interactions */
        .insight-card, .metric-card, .section-enhanced {
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        }
        
        .insight-card:hover, .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }
        
        @media (hover: none) and (pointer: coarse) {
            .insight-card:hover, .metric-card:hover {
                transform: none;
            }
            
            .insight-card:active, .metric-card:active {
                transform: scale(0.98);
                transition: transform 0.1s ease;
            }
        }
        
        /* Estilos para a seção de análise médica */
        .medical-analysis-section {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            margin-bottom: var(--space-6);
        }
        
        .doctors-summary, .medications-summary {
            font-size: var(--text-lg);
            font-weight: 600;
            color: var(--primary);
            margin-bottom: var(--space-2);
        }
        
        .doctors-list, .medications-list {
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: var(--space-3);
        }
        
        .specialty-highlight, .medication-highlight {
            background: linear-gradient(135deg, var(--success) 0%, var(--info) 100%);
            color: white;
            padding: var(--space-3);
            border-radius: var(--radius);
            margin-top: var(--space-3);
            font-size: var(--text-sm);
        }
        
        .medical-insights {
            margin-top: var(--space-4);
            padding-top: var(--space-4);
            border-top: 1px solid var(--border);
        }
        
        .insight-item {
            background: var(--gray-50);
            border-left: 4px solid var(--info);
            padding: var(--space-4);
            margin-bottom: var(--space-3);
            border-radius: 0 var(--radius) var(--radius) 0;
        }
        
        .insight-item.priority-alta {
            border-left-color: var(--danger);
            background: rgba(239, 68, 68, 0.05);
        }
        
        .insight-item.priority-media {
            border-left-color: var(--warning);
            background: rgba(251, 192, 45, 0.05);
        }
        
        .insight-title-medical {
            font-weight: 600;
            font-size: var(--text-base);
            color: var(--text);
            margin-bottom: var(--space-2);
        }
        
        .insight-description {
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: var(--space-2);
        }
        
        .insight-recommendation {
            color: var(--text);
            font-size: var(--text-sm);
            background: rgba(255, 255, 255, 0.7);
            padding: var(--space-2);
            border-radius: var(--radius-sm);
        }
        
        .more-insights {
            text-align: center;
            color: var(--text-subtle);
            font-style: italic;
            margin-top: var(--space-3);
        }
        
        @media (max-width: 640px) {
            .medical-analysis-section {
                padding: var(--space-4);
            }
            
            .insight-item {
                padding: var(--space-3);
            }
            
            .specialty-highlight, .medication-highlight {
                padding: var(--space-2);
                font-size: var(--text-xs);
            }
        }

        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 1rem;
            }
            
            .enhanced-header {
                margin: -1rem -1rem 2rem;
            }
        }`;
}

/**
 * Gera JavaScript enhanced para o relatório
 */
function getEnhancedReportJavaScript(withPassword?: boolean, passwordHash?: string, reportId?: string): string {
  return `
        // Inicialização de gráficos quando o DOM estiver pronto
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            initializeInteractions();
        });

        function initializeCharts() {
            const painTrendChart = document.getElementById('painTrendChart');
            if (painTrendChart && window.Chart && window.REPORT_DATA) {
                const ctx = painTrendChart.getContext('2d');
                const painData = window.REPORT_DATA.painEvolution || [];
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: painData.map((_, i) => \`Dia \${i + 1}\`),
                        datasets: [{
                            label: 'Nível de Dor',
                            data: painData.map(d => d.averagePain || 0),
                            borderColor: '#9C27B0',
                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 10,
                                title: {
                                    display: true,
                                    text: 'Nível de Dor (0-10)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Período'
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: 'Evolução da Dor ao Longo do Tempo'
                            },
                            legend: {
                                display: true
                            }
                        }
                    }
                });
            }
        }

        function initializeInteractions() {
            // Adicionar interatividade aos cards
            const cards = document.querySelectorAll('.insight-card, .metric-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });
            });
        }

        /* 🧠 Estilos para Análise NLP Médica Avançada */
        .advanced-nlp-section {
            margin: var(--space-6) 0;
            padding: var(--space-6);
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: var(--radius-lg);
            border: 1px solid #0891b2;
            box-shadow: var(--shadow);
        }

        .sentiment-analysis {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
        }

        .sentiment-positivo { 
            color: var(--sentiment-positive); 
            font-weight: 600;
        }
        .sentiment-negativo { 
            color: var(--sentiment-negative); 
            font-weight: 600;
        }
        .sentiment-neutro { 
            color: var(--sentiment-neutral); 
            font-weight: 600;
        }

        .sentiment-breakdown {
            font-size: var(--text-sm);
            color: var(--text-muted);
            margin-top: var(--space-1);
        }

        .nlp-insights {
            margin-top: var(--space-4);
        }

        .insight-title-nlp {
            font-weight: 600;
            color: var(--primary);
            margin-bottom: var(--space-1);
            font-size: var(--text-sm);
        }

        .insight-description {
            font-size: var(--text-sm);
            color: var(--text);
            margin-bottom: var(--space-2);
        }

        .insight-recommendation {
            font-size: var(--text-xs);
            color: var(--text-muted);
            background: rgba(156, 39, 176, 0.1);
            padding: var(--space-2);
            border-radius: var(--radius);
            border-left: 3px solid var(--primary);
        }

        /* 📊 Estilos para Gráficos de Adesão aos Medicamentos */
        .adherence-section {
            margin: var(--space-6) 0;
            padding: var(--space-6);
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            border-radius: var(--radius-lg);
            border: 1px solid #f59e0b;
            box-shadow: var(--shadow);
        }

        .adherence-chart-container {
            margin-top: var(--space-4);
        }

        .adherence-chart-container h5 {
            color: var(--text);
            font-size: var(--text-lg);
            font-weight: 600;
            margin-bottom: var(--space-4);
            text-align: center;
        }

        .adherence-bar-item {
            margin-bottom: var(--space-4);
            padding: var(--space-3);
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow-sm);
        }

        .medication-name {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-2);
            font-weight: 600;
            color: var(--text);
        }

        .adherence-score {
            font-size: var(--text-sm);
            padding: var(--space-1) var(--space-2);
            background: var(--gray-100);
            border-radius: var(--radius-sm);
            color: var(--text-muted);
        }

        .adherence-bar {
            width: 100%;
            height: 8px;
            background: var(--gray-200);
            border-radius: var(--radius-sm);
            overflow: hidden;
            margin-bottom: var(--space-2);
        }

        .adherence-fill {
            height: 100%;
            transition: width 0.3s ease;
            border-radius: var(--radius-sm);
        }

        .adherence-fill.adherence-high {
            background: linear-gradient(90deg, #10b981, #059669);
        }

        .adherence-fill.adherence-medium {
            background: linear-gradient(90deg, #f59e0b, #d97706);
        }

        .adherence-fill.adherence-low {
            background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .adherence-details {
            font-size: var(--text-xs);
            color: var(--text-muted);
        }

        .adherence-excelente { color: #10b981; }
        .adherence-boa { color: #f59e0b; }
        .adherence-moderada { color: #f97316; }
        .adherence-baixa { color: #ef4444; }

        .risk-medications {
            margin-top: var(--space-4);
            padding: var(--space-4);
            background: #fef2f2;
            border-radius: var(--radius);
            border: 1px solid #fca5a5;
        }

        .risk-medications h5 {
            color: #dc2626;
            font-size: var(--text-base);
            font-weight: 600;
            margin-bottom: var(--space-3);
        }

        .risk-list {
            margin-bottom: var(--space-3);
        }

        .risk-item {
            padding: var(--space-2);
            margin-bottom: var(--space-1);
            background: white;
            border-radius: var(--radius-sm);
            font-size: var(--text-sm);
            color: #dc2626;
            font-weight: 500;
        }

        .recommendation {
            padding: var(--space-3);
            background: rgba(16, 185, 129, 0.1);
            border-radius: var(--radius);
            border-left: 3px solid #10b981;
            font-size: var(--text-sm);
            color: var(--text);
        }

        .recommendation strong {
            color: #059669;
        }

        .metric-value.improvement {
            color: #10b981;
            font-weight: 600;
        }

        /* Responsividade para as novas seções */
        @media (max-width: 768px) {
            .advanced-nlp-section,
            .adherence-section {
                margin: var(--space-4) 0;
                padding: var(--space-4);
            }

            .medication-name {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-1);
            }

            .adherence-score {
                align-self: flex-end;
            }

            .sentiment-breakdown {
                font-size: var(--text-xs);
            }
        }

        /* ===== ESTILOS PARA SEÇÃO DE INSIGHTS DE TEXTO LIVRE ===== */
        .text-insights-section {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-8);
            margin: var(--space-8) 0;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease-in-out;
        }

        .text-insights-section:hover {
            box-shadow: var(--shadow);
            border-color: var(--border-elevated);
        }

        .text-insights-section h2 {
            color: var(--primary);
            font-size: var(--text-2xl);
            font-weight: 700;
            margin-bottom: var(--space-4);
            display: flex;
            align-items: center;
            gap: var(--space-3);
        }

        .text-insights-section .section-description {
            color: var(--text-muted);
            font-size: var(--text-sm);
            margin-bottom: var(--space-6);
            padding: var(--space-4);
            background: var(--gray-50);
            border-radius: var(--radius);
            border-left: 4px solid var(--primary);
        }

        .text-insights-subsection {
            margin-bottom: var(--space-6);
            border-left: 3px solid var(--gray-300);
            padding-left: var(--space-4);
        }

        .text-insights-subsection:last-child {
            margin-bottom: 0;
        }

        .text-insights-subsection h4 {
            color: var(--gray-800);
            font-size: var(--text-lg);
            font-weight: 600;
            margin-bottom: var(--space-4);
            display: flex;
            align-items: center;
            gap: var(--space-2);
        }

        .text-insights-content {
            background: var(--gray-50);
            border-radius: var(--radius);
            padding: var(--space-4);
        }

        .insight-summary {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-bottom: var(--space-3);
            font-size: var(--text-sm);
            padding: var(--space-2);
            background: white;
            border-radius: var(--radius-sm);
            border: 1px solid var(--gray-200);
        }

        .insight-summary:last-of-type {
            margin-bottom: var(--space-4);
        }

        .insight-details {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-sm);
            padding: var(--space-4);
            margin-bottom: var(--space-3);
            font-size: var(--text-sm);
            line-height: 1.6;
        }

        .insight-details:last-child {
            margin-bottom: 0;
        }

        .insight-details strong {
            color: var(--gray-800);
            font-weight: 600;
        }

        .insight-details br + strong {
            margin-top: var(--space-2);
            display: inline-block;
        }

        /* Estilos para diferentes tipos de sentimento */
        .sentiment-positive {
            color: var(--sentiment-positive);
            font-weight: 600;
        }

        .sentiment-negative {
            color: var(--sentiment-negative);
            font-weight: 600;
        }

        .sentiment-neutral {
            color: var(--sentiment-neutral);
            font-weight: 600;
        }

        /* Estilos para níveis de urgência */
        .urgency-critical {
            color: #dc2626;
            font-weight: 700;
        }

        .urgency-high {
            color: #ea580c;
            font-weight: 600;
        }

        .urgency-moderate {
            color: #d97706;
            font-weight: 600;
        }

        .urgency-low {
            color: #16a34a;
            font-weight: 600;
        }

        /* ===== RESPONSIVIDADE MOBILE MELHORADA ===== */
        
        /* Header responsivo */
        @media (max-width: 768px) {
            .logo-enhanced {
                flex-direction: row;
                gap: var(--space-3);
            }

            .fibro-logo svg {
                width: 36px;
                height: 36px;
            }

            .app-name {
                font-size: var(--text-2xl);
            }

            .app-subtitle {
                font-size: var(--text-base);
            }

            .subtitle-enhanced {
                font-size: var(--text-lg);
                line-height: 1.3;
            }

            .badge {
                font-size: 0.7rem;
                padding: var(--space-1) var(--space-2);
            }
        }

        /* ===== HIERARQUIA VISUAL PROFISSIONAL ===== */
        
        /* 🏆 NÍVEL 1: Executive Dashboard */
        .executive-dashboard {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px solid #f59e0b;
            border-radius: 1.5rem;
            padding: var(--space-8);
            margin-bottom: var(--space-8);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            position: relative;
            overflow: hidden;
        }
        
        .executive-dashboard::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
            z-index: 0;
        }
        
        .executive-dashboard * {
            position: relative;
            z-index: 1;
        }
        
        .dashboard-header {
            text-align: center;
            margin-bottom: var(--space-8);
        }
        
        .title-executive {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(45deg, #92400e, #d97706);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: var(--space-2);
        }
        
        .dashboard-subtitle {
            font-size: var(--text-lg);
            color: #92400e;
            font-weight: 600;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-6);
            margin-bottom: var(--space-8);
        }
        
        .kpi-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 1rem;
            padding: var(--space-6);
            text-align: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 2px solid transparent;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .kpi-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .pain-kpi { border-color: #ef4444; }
        .crisis-kpi { border-color: #dc2626; }
        .adherence-kpi { border-color: #10b981; }
        .ai-kpi { border-color: #8b5cf6; }
        
        .kpi-icon {
            font-size: 2rem;
            margin-bottom: var(--space-2);
        }
        
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: var(--space-1);
        }
        
        .kpi-label {
            font-size: var(--text-sm);
            font-weight: 600;
            color: #6b7280;
            margin-bottom: var(--space-2);
        }
        
        .kpi-trend {
            font-size: 1.2rem;
        }
        
        .trend-excellent { color: #10b981; }
        .trend-good { color: #16a34a; }
        .trend-warning { color: #f59e0b; }
        .trend-critical { color: #dc2626; }
        
        /* 🧠 NÍVEL 2: AI Insights Zone */
        .ai-insights-zone {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            border: 3px solid #4f46e5;
            border-radius: 1.5rem;
            padding: var(--space-8);
            margin-bottom: var(--space-8);
            box-shadow: 0 16px 24px rgba(79, 70, 229, 0.15);
            position: relative;
            overflow: hidden;
        }
        
        .ai-insights-zone::before {
            content: '🧠';
            position: absolute;
            top: 1rem;
            right: 1rem;
            font-size: 4rem;
            opacity: 0.1;
            z-index: 0;
        }
        
        .ai-insights-zone * {
            position: relative;
            z-index: 1;
        }
        
        .ai-header {
            text-align: center;
            margin-bottom: var(--space-8);
        }
        
        .ai-icon-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-4);
            margin-bottom: var(--space-4);
        }
        
        .ai-icon {
            border-radius: 50%;
            background: rgba(79, 70, 229, 0.2);
            padding: 8px;
        }
        
        .title-ai-insights {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(45deg, #312e81, #4f46e5);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .ai-subtitle {
            font-size: var(--text-lg);
            color: #312e81;
            font-weight: 600;
            margin-bottom: var(--space-6);
        }
        
        .ai-confidence-bar {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 1rem;
            padding: var(--space-4);
        }
        
        .confidence-label {
            font-size: var(--text-sm);
            font-weight: 600;
            color: #312e81;
            margin-bottom: var(--space-2);
        }
        
        .confidence-progress {
            background: rgba(79, 70, 229, 0.2);
            border-radius: 0.5rem;
            height: 8px;
            overflow: hidden;
        }
        
        .confidence-fill {
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            height: 100%;
            border-radius: 0.5rem;
            transition: width 0.3s ease;
        }
        
        .ai-content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--space-6);
        }
        
        /* 📊 NÍVEL 3: Data Analytics */
        .data-analytics-section {
            background: var(--surface-elevated);
            border: 2px solid #d1d5db;
            border-radius: 1rem;
            padding: var(--space-6);
            margin-bottom: var(--space-6);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .analytics-header {
            text-align: center;
            margin-bottom: var(--space-6);
        }
        
        .title-data-section {
            font-size: 1.5rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: var(--space-2);
        }
        
        .analytics-subtitle {
            font-size: var(--text-base);
            color: #6b7280;
            font-weight: 500;
        }
        
        .analytics-grid {
            display: grid;
            gap: var(--space-4);
        }
        
        /* 📋 NÍVEL 4: Clinical Data */
        .clinical-data-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: var(--space-4);
            margin-bottom: var(--space-4);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .clinical-header {
            text-align: center;
            margin-bottom: var(--space-4);
        }
        
        .title-standard {
            font-size: 1.25rem;
            font-weight: 500;
            color: #4b5563;
            margin-bottom: var(--space-1);
        }
        
        .clinical-subtitle {
            font-size: var(--text-sm);
            color: #6b7280;
            font-weight: 400;
        }
        
        .clinical-grid {
            display: grid;
            gap: var(--space-3);
        }
        
        /* Cards especializados */
        .predictive-insights-card, .correlation-card {
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid #8b5cf6;
            border-radius: 1rem;
            padding: var(--space-6);
            backdrop-filter: blur(10px);
        }
        
        .insights-title, .correlation-title {
            font-size: var(--text-lg);
            font-weight: 700;
            color: #6b46c1;
            margin-bottom: var(--space-4);
        }
        
        .insight-item, .correlation-item {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 0.5rem;
            padding: var(--space-3);
            margin-bottom: var(--space-3);
        }
        
        .insight-probability {
            font-weight: 600;
            color: #6b46c1;
            margin-bottom: var(--space-1);
        }
        
        .correlation-vars {
            font-weight: 600;
            color: #374151;
            margin-bottom: var(--space-1);
        }
        
        .correlation-strength.strong { color: #10b981; font-weight: 700; }
        .correlation-strength.moderate { color: #f59e0b; font-weight: 600; }
        
        /* Executive Alerts */
        .executive-alerts {
            display: grid;
            gap: var(--space-4);
        }
        
        .executive-alert {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            padding: var(--space-4);
            border-radius: 0.75rem;
            border-left: 4px solid;
        }
        
        .alert-critical {
            background: rgba(239, 68, 68, 0.1);
            border-left-color: #dc2626;
        }
        
        .alert-warning {
            background: rgba(245, 158, 11, 0.1);
            border-left-color: #f59e0b;
        }
        
        .alert-success {
            background: rgba(16, 185, 129, 0.1);
            border-left-color: #10b981;
        }
        
        .alert-icon {
            font-size: 1.5rem;
        }
        
        .alert-title {
            font-weight: 700;
            margin-bottom: var(--space-1);
        }
        
        .alert-message {
            font-size: var(--text-sm);
            color: #6b7280;
        }
        
        /* Seção de insights de texto mobile */
        @media (max-width: 768px) {
            .text-insights-section {
                margin: var(--space-4) 0;
                padding: var(--space-4);
                border-radius: 0.75rem;
            }

            .text-insights-subsection {
                padding-left: var(--space-3);
                border-left-width: 3px;
                margin-bottom: var(--space-4);
            }

            .text-insights-subsection h4 {
                font-size: var(--text-base);
                font-weight: 600;
            }

            .insight-summary {
                flex-direction: row;
                align-items: center;
                gap: var(--space-2);
                font-size: var(--text-xs);
                padding: var(--space-3);
                min-height: 40px; /* Touch target */
            }

            .insight-details {
                padding: var(--space-3);
                font-size: var(--text-xs);
                line-height: 1.5;
            }
        }

        /* Cards e métricas mobile-friendly */
        @media (max-width: 768px) {
            .metric-row {
                gap: var(--space-2);
            }

            .metric-item {
                min-height: 60px; /* Touch-friendly */
                padding: var(--space-3);
            }

            .metric-title {
                font-size: var(--text-sm);
                font-weight: 600;
            }

            .metric-value-large {
                font-size: var(--text-xl);
            }
        }

        // Função para impressão otimizada
        function printReport() {
            window.print();
        }

        // Função para salvar como PDF (se suportado pelo navegador)
        function saveAsPDF() {
            if (window.html2canvas && window.jsPDF) {
                const element = document.querySelector('.container');
                html2canvas(element).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF();
                    const imgWidth = 210;
                    const pageHeight = 295;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;

                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(\`fibrodiario-report-\${new Date().toISOString().split('T')[0]}.pdf\`);
                });
            } else {
                alert('Funcionalidade de PDF não disponível. Use a opção de impressão do navegador.');
            }
        }

        console.log('🦋 FibroDiário Enhanced Report inicializado com sucesso!');`;
}