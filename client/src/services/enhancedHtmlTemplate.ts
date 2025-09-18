/**
 * Template HTML Enhanced para relatórios FibroDiário com NLP + Visualizações
 * 
 * Gera relatórios standalone com análises inteligentes, gráficos avançados
 * e insights preditivos. Compatível com todos os ambientes.
 */

import { EnhancedReportData } from './enhancedReportAnalysisService';

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

    // 3. Seções Tradicionais (pode ser pesada)
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
          order: 3 + i,
          size: chunks[i].length
        };
      }
    } else {
      yield {
        id: 'traditional',
        content: traditionalHtml,
        order: 3,
        size: traditionalHtml.length
      };
    }

    // 4. Seção Footer + Scripts (final)
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
            ${generateQuizIntelligentSummarySection(reportData)}
            ${generateTraditionalSections(reportData)}
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
        <div class="enhanced-header">
            <div class="logo-enhanced">
                <span class="brain-icon">🧠</span>
                FibroDiário Enhanced
            </div>
            <div class="subtitle-enhanced">
                Relatório Inteligente de Análise da Dor - ${periodsText}
            </div>
            <div class="header-badges">
                <div class="badge">✨ Análise NLP</div>
                <div class="badge">📊 Visualizações Interativas</div>
                <div class="badge">🤖 Insights Preditivos</div>
            </div>
            <div style="font-size: 0.9rem; opacity: 0.8;">
                Usuário: ${userEmail}
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
            <h2>📋 Resumo Inteligente dos Questionários</h2>
            
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
            </div>
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
            --primary: #9C27B0;
            --accent: #FBC02D;
            --secondary: #66BB6A;
            --success: #66BB6A;
            --warning: #FBC02D;
            --danger: #ef4444;
            --info: #9C27B0;
            
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
            padding: var(--space-6);
            background: var(--background);
            min-height: 100vh;
        }

        .enhanced-header {
            background: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%);
            color: white;
            padding: var(--space-8);
            margin: calc(-1 * var(--space-6)) calc(-1 * var(--space-6)) var(--space-8);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .enhanced-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            opacity: 0.1;
        }

        .enhanced-header * {
            position: relative;
            z-index: 1;
        }

        .logo-enhanced {
            font-size: var(--text-3xl);
            font-weight: 700;
            margin-bottom: var(--space-3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-3);
        }

        .logo-enhanced .brain-icon {
            font-size: var(--text-4xl);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .subtitle-enhanced {
            font-size: var(--text-xl);
            font-weight: 500;
            margin-bottom: var(--space-6);
            opacity: 0.95;
        }

        .header-badges {
            display: flex;
            justify-content: center;
            gap: var(--space-4);
            flex-wrap: wrap;
            margin-bottom: var(--space-4);
        }

        .badge {
            background: rgba(255, 255, 255, 0.2);
            padding: var(--space-2) var(--space-4);
            border-radius: var(--radius-xl);
            font-size: var(--text-sm);
            font-weight: 500;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-enhanced {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-8);
            margin-bottom: var(--space-8);
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease-in-out;
        }

        .section-enhanced:hover {
            box-shadow: var(--shadow);
            border-color: var(--border-elevated);
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
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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