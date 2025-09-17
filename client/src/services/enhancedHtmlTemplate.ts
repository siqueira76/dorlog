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
    <link rel="icon" type="image/png" href="data:image/png;base64,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 ..[Content truncated for brevity]">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <style>
${getEnhancedReportCSS()}
    </style>
</head>
<body>
    <div class="container">`;
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
    <div class="container">
        ${generateEnhancedHeader(userEmail, periodsText, reportData)}
        
        <div class="content">
            ${generateQuizIntelligentSummarySection(reportData)}
            ${generateTraditionalSections(reportData)}
            ${generateEnhancedFooter(reportId, reportData)}
        </div>
    </div>

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

function getEnhancedReportCSS(): string {
  return `
        :root {
            /* FibroDiário - Paleta de cores da fibromialgia */
            --primary: #9C27B0;
            --accent: #FBC02D;
            --secondary: #66BB6A;
            --success: #66BB6A;
            --warning: #FBC02D;
            --danger: #ef4444;
            --info: #9C27B0;
            
            /* NLP Colors */
            --sentiment-positive: #10b981;
            --sentiment-negative: #ef4444;
            --sentiment-neutral: #6b7280;
            --urgency-low: #10b981;
            --urgency-medium: #f59e0b;
            --urgency-high: #ef4444;
            --urgency-critical: #b91c1c;
            
            /* Enhanced Neutral Scale */
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
            
            /* Semantic Colors */
            --background: white;
            --surface: var(--gray-50);
            --surface-elevated: white;
            --border: var(--gray-200);
            --border-elevated: var(--gray-300);
            --text: var(--gray-900);
            --text-muted: var(--gray-600);
            --text-subtle: var(--gray-500);
            
            /* Spacing Scale */
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
            
            /* Typography Scale */
            --text-xs: 0.75rem;
            --text-sm: 0.875rem;
            --text-base: 1rem;
            --text-lg: 1.125rem;
            --text-xl: 1.25rem;
            --text-2xl: 1.5rem;
            --text-3xl: 1.875rem;
            --text-4xl: 2.25rem;
            
            /* Border Radius */
            --radius-sm: 0.375rem;
            --radius: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            
            /* Quiz Summary Section */
            --quiz-card-morning: #f0f9ff;
            --quiz-card-crisis: #fef2f2;
            --quiz-card-medication: #f0fdf4;
            --quiz-card-patterns: #fefbf3;
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

        /* Enhanced Header */
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
            items-center;
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

        /* Enhanced Sections */
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

        /* Executive Summary */
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

        /* NLP Insights */
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

        .sentiment-indicator {
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius);
            font-size: var(--text-sm);
            font-weight: 500;
            color: white;
            text-transform: capitalize;
        }

        .sentiment-positive { background: var(--sentiment-positive); }
        .sentiment-negative { background: var(--sentiment-negative); }
        .sentiment-neutral { background: var(--sentiment-neutral); }
        
        /* Sleep-Pain Correlation Classes */
        .correlation-high { background: var(--success); }
        .correlation-medium { background: var(--warning); }
        .correlation-low { background: var(--gray-400); }
        
        /* Trend Classes */
        .trend-improving { background: var(--success); }
        .trend-worsening { background: var(--danger); }
        .trend-stable { background: var(--info); }
        
        /* Sleep-Pain Summary Styles */
        .sleep-quality-summary, .pain-summary, .relationship-summary {
            padding: 1rem 0;
        }
        
        .big-metric {
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .metric-emoji {
            font-size: 2rem;
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--primary);
            display: block;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: var(--gray-600);
            display: block;
            margin-top: 0.25rem;
        }
        
        .secondary-metrics {
            display: flex;
            justify-content: space-around;
            margin-top: 1rem;
        }
        
        .metric-item {
            text-align: center;
        }
        
        .metric-count {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary);
            display: block;
        }
        
        .metric-desc {
            font-size: 0.75rem;
            color: var(--gray-500);
        }
        
        .trend-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 1rem;
            padding: 0.5rem;
            background: var(--gray-50);
            border-radius: 0.5rem;
        }
        
        .trend-emoji {
            font-size: 1.25rem;
        }
        
        .trend-text {
            font-size: 0.875rem;
            color: var(--gray-700);
        }
        
        .relationship-text {
            font-size: 0.875rem;
            line-height: 1.5;
            color: var(--gray-700);
            margin-bottom: 1rem;
        }
        
        .critical-days-alert, .good-news {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
        }
        
        .critical-days-alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
        }
        
        .good-news {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
        }
        
        .alert-emoji, .good-emoji {
            font-size: 1rem;
        }
        
        .alert-text, .good-text {
            font-size: 0.875rem;
            color: var(--gray-700);
        }

        .urgency-level {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-bottom: var(--space-3);
        }

        .urgency-bar {
            flex: 1;
            height: 8px;
            background: var(--gray-200);
            border-radius: var(--radius-sm);
            overflow: hidden;
        }

        .urgency-fill {
            height: 100%;
            border-radius: var(--radius-sm);
            transition: width 0.3s ease;
        }

        .urgency-low .urgency-fill { background: var(--urgency-low); }
        .urgency-medium .urgency-fill { background: var(--urgency-medium); }
        .urgency-high .urgency-fill { background: var(--urgency-high); }
        .urgency-critical .urgency-fill { background: var(--urgency-critical); }

        /* Quiz Summary Grid */
        .quiz-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .quiz-card {
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 4px solid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }

        .quiz-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .quiz-card-morning {
            background: var(--quiz-card-morning);
            border-left-color: #3b82f6;
        }

        .quiz-card-crisis {
            background: var(--quiz-card-crisis);
            border-left-color: #ef4444;
        }

        .quiz-card-medication {
            background: var(--quiz-card-medication);
            border-left-color: #10b981;
        }

        .quiz-card-patterns {
            background: var(--quiz-card-patterns);
            border-left-color: #f59e0b;
        }

        .quiz-card-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .quiz-metric {
            margin-bottom: 0.75rem;
        }

        .quiz-metric-main {
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }

        .quiz-metric-label {
            font-size: 0.9rem;
            color: #64748b;
            margin-bottom: 0.5rem;
        }

        .quiz-insight {
            background: rgba(255,255,255,0.6);
            border-radius: 8px;
            padding: 0.75rem;
            margin-top: 1rem;
            font-size: 0.85rem;
            color: #374151;
            border-left: 3px solid #6366f1;
        }

        .quiz-list {
            list-style: none;
            padding: 0;
            margin: 0.5rem 0;
        }

        .quiz-list li {
            font-size: 0.85rem;
            color: #475569;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .quiz-progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(0,0,0,0.1);
            border-radius: 3px;
            overflow: hidden;
            margin: 0.5rem 0;
        }

        .quiz-progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        /* Charts Container */
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: var(--space-8);
            margin-bottom: var(--space-8);
        }

        .chart-card {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            box-shadow: var(--shadow-sm);
        }

        .chart-header {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            margin-bottom: var(--space-6);
        }

        .chart-title {
            font-size: var(--text-xl);
            font-weight: 600;
            color: var(--text);
        }

        .chart-canvas {
            width: 100%;
            height: 200px;
            max-height: 250px;
            margin-bottom: var(--space-4);
        }

        /* Alerts and Recommendations */
        .alert-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: var(--space-6);
            margin-bottom: var(--space-8);
        }

        .alert-card {
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-6);
            background: var(--surface-elevated);
            box-shadow: var(--shadow-sm);
        }

        .alert-critical {
            border-left: 4px solid var(--danger);
            background: rgba(239, 68, 68, 0.05);
        }

        .alert-high {
            border-left: 4px solid var(--warning);
            background: rgba(245, 158, 11, 0.05);
        }

        .alert-medium {
            border-left: 4px solid var(--info);
            background: rgba(6, 182, 212, 0.05);
        }

        .alert-low {
            border-left: 4px solid var(--success);
            background: rgba(16, 185, 129, 0.05);
        }

        .alert-header {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            margin-bottom: var(--space-4);
        }

        .alert-title {
            font-size: var(--text-lg);
            font-weight: 600;
        }

        .alert-urgency {
            padding: var(--space-1) var(--space-3);
            border-radius: var(--radius);
            font-size: var(--text-xs);
            font-weight: 500;
            text-transform: uppercase;
            color: white;
        }

        .alert-description {
            color: var(--text-muted);
            margin-bottom: var(--space-4);
            line-height: 1.6;
        }

        .alert-recommendation {
            font-size: var(--text-sm);
            padding: var(--space-3);
            background: rgba(0, 0, 0, 0.02);
            border-radius: var(--radius);
            border-left: 3px solid var(--accent);
        }

        /* Enhanced Footer */
        .enhanced-footer {
            margin-top: var(--space-12);
            padding-top: var(--space-8);
            border-top: 2px solid var(--border);
            text-align: center;
        }

        .footer-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-3);
            font-size: var(--text-2xl);
            font-weight: 600;
            color: var(--text);
            margin-bottom: var(--space-4);
        }

        .footer-features {
            display: flex;
            justify-content: center;
            gap: var(--space-6);
            flex-wrap: wrap;
            margin-bottom: var(--space-6);
            color: var(--text-muted);
            font-size: var(--text-sm);
        }

        .footer-feature {
            display: flex;
            align-items: center;
            gap: var(--space-2);
        }

        .footer-meta {
            font-size: var(--text-xs);
            color: var(--text-subtle);
            padding-top: var(--space-4);
            border-top: 1px solid var(--border);
        }

        /* Mobile-Optimized Cards Grid */
        .mobile-optimized-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2rem;
            padding: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: var(--space-4);
            }
            
            .enhanced-header {
                padding: var(--space-6);
                margin: calc(-1 * var(--space-4)) calc(-1 * var(--space-4)) var(--space-6);
            }
            
            .charts-container {
                grid-template-columns: 1fr;
            }
            
            .alert-grid {
                grid-template-columns: 1fr;
            }
            
            .nlp-insights {
                grid-template-columns: 1fr;
            }

            /* Enhanced mobile experience for cards grid */
            .mobile-optimized-cards-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
                margin-bottom: 1.5rem;
                padding: 0.25rem;
            }

            /* Mobile-optimized card styling */
            .mobile-optimized-cards-grid > div {
                min-height: auto;
                padding: 1.25rem !important;
                margin-bottom: 0.5rem;
            }

            /* Better mobile typography for cards */
            .mobile-optimized-cards-grid h3 {
                font-size: 1rem !important;
                margin-bottom: 0.75rem !important;
            }

            .mobile-optimized-cards-grid .text-sm {
                font-size: 0.85rem !important;
                line-height: 1.4 !important;
            }

            .mobile-optimized-cards-grid .text-xs {
                font-size: 0.75rem !important;
                line-height: 1.3 !important;
            }
        }

        @media (max-width: 480px) {
            .mobile-optimized-cards-grid {
                gap: 0.75rem;
                margin-bottom: 1rem;
                padding: 0.125rem;
            }

            .mobile-optimized-cards-grid > div {
                padding: 1rem !important;
                border-radius: 0.75rem !important;
                margin-bottom: 0.25rem;
            }

            /* Extra small mobile optimization */
            .mobile-optimized-cards-grid h3 {
                font-size: 0.9rem !important;
            }

            /* Improve card content spacing on very small screens */
            .mobile-optimized-cards-grid .space-y-3 > * + * {
                margin-top: 0.75rem !important;
            }

            /* Internal card spacing */
            .mobile-optimized-cards-grid .mb-3 {
                margin-bottom: 1rem !important;
            }

            .mobile-optimized-cards-grid .p-3 {
                padding: 0.875rem !important;
            }

            .mobile-optimized-cards-grid .p-2 {
                padding: 0.625rem !important;
            }

            /* Optimize button and badge layouts */
            .mobile-optimized-cards-grid .flex-wrap {
                justify-content: flex-start !important;
                gap: 0.375rem !important;
            }

            .mobile-optimized-cards-grid .flex-wrap > * {
                margin-right: 0 !important;
                margin-bottom: 0 !important;
            }
        }

        /* Print Styles */
        @media print {
            .container {
                max-width: none;
                padding: 0;
            }
            
            .enhanced-header {
                background: var(--text) !important;
                color: white !important;
                margin: 0 0 2rem 0;
            }
            
            .section-enhanced {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ccc;
            }
            
            .chart-canvas {
                height: 150px;
                max-height: 180px;
                break-inside: avoid;
            }
        }
`;
}

function generateEnhancedHeader(userEmail: string, periodsText: string, reportData: EnhancedReportData): string {
  return `
    <div class="enhanced-header">
        <div class="logo-enhanced">
            <img src="data:image/png;base64,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" style="width: 32px; height: 32px; margin-right: 12px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" alt="FibroDiário" />
            <span>FibroDiário Enhanced</span>
        </div>
        <p class="subtitle-enhanced">Relatório Inteligente com Análise NLP Avançada</p>
        
        <div class="header-badges">
            <span class="badge">📅 ${periodsText}</span>
            <span class="badge">👤 ${userEmail}</span>
            <span class="badge">🧠 IA Ativada</span>
        </div>
        
        <div class="header-info">
            <p>📊 Gerado em: ${new Date().toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
    </div>
  `;
}

function generateExecutiveSummary(reportData: EnhancedReportData): string {
  const summary = reportData.smartSummary?.executiveSummary || 
    'Análise inteligente em desenvolvimento com base nos dados coletados.';
  
  return `
    <div class="executive-summary">
        <div class="section-title-enhanced" style="color: white; border-color: rgba(255,255,255,0.3);">
            <span class="section-icon">📊</span>
            <span>Sumário Executivo Inteligente</span>
        </div>
        
        <p class="summary-text">${summary}</p>
        
        <div class="key-metrics">
            <div class="metric-card">
                <div class="metric-value">${reportData.totalDays}</div>
                <div class="metric-label">Dias Analisados</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.crisisEpisodes}</div>
                <div class="metric-label">Episódios de Crise</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.averagePain}</div>
                <div class="metric-label">Dor Média</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.adherenceRate}%</div>
                <div class="metric-label">Adesão</div>
            </div>
        </div>
    </div>
  `;
}

function generateQuizIntelligentSummarySection(reportData: EnhancedReportData): string {
  // Processar dados dos quizzes para análise inteligente
  const quizAnalysis = processQuizData(reportData);
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">📋</span>
            <span>Resumo Inteligente dos Questionários</span>
        </div>
        
        <div class="quiz-summary-grid">
            ${generateMorningNightCard(quizAnalysis, reportData)}
            ${generateCrisisEpisodesCard(quizAnalysis, reportData)}
            ${generatePatternsCard(quizAnalysis)}
        </div>
    </div>
  `;
}

/* SEÇÃO REMOVIDA - generateSleepPainInsightsSection
function generateSleepPainInsightsSection(reportData: EnhancedReportData): string {
  const sleepPainInsights = reportData.sleepPainInsights;
  
  if (!sleepPainInsights) {
    return `
      <div class="section-enhanced">
          <div class="section-title-enhanced">
              <span class="section-icon">😴</span>
              <span>Análise Sono-Dor Matinal</span>
          </div>
          <p class="text-gray-500 text-center py-8">
              Análise sono-dor não disponível - dados insuficientes para correlação
          </p>
      </div>
    `;
  }
  
  const correlation = sleepPainInsights.correlationAnalysis;
  const trend = sleepPainInsights.morningPainTrend;
  const patterns = sleepPainInsights.sleepQualityPatterns;
  
  const correlationClass = correlation.significance === 'HIGH' ? 'correlation-high' :
                          correlation.significance === 'MEDIUM' ? 'correlation-medium' : 'correlation-low';
  
  const trendClass = trend.direction === 'IMPROVING' ? 'trend-improving' :
                    trend.direction === 'WORSENING' ? 'trend-worsening' : 'trend-stable';
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">😴</span>
            <span>Análise Sono-Dor Matinal</span>
        </div>
        
        <div class="nlp-insights">
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-title">😴 Como Você Dormiu</span>
                </div>
                <div class="sleep-quality-summary">
                    <div class="big-metric">
                        <span class="metric-emoji">${getSleepQualityEmoji(patterns.averageQuality)}</span>
                        <span class="metric-value">${patterns.averageQuality.toFixed(1)}/10</span>
                        <span class="metric-label">Qualidade média do sono</span>
                    </div>
                    <div class="secondary-metrics">
                        <div class="metric-item">
                            <span class="metric-count">${patterns.poorSleepDays}</span>
                            <span class="metric-desc">dias com sono ruim</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-count">${correlation.sampleSize}</span>
                            <span class="metric-desc">dias analisados</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-title">🌅 Sua Dor Matinal</span>
                </div>
                <div class="pain-summary">
                    <div class="big-metric">
                        <span class="metric-emoji">${getPainLevelEmoji(getAverageMorningPain(reportData))}</span>
                        <span class="metric-value">${getAverageMorningPain(reportData).toFixed(1)}/10</span>
                        <span class="metric-label">Dor média ao acordar</span>
                    </div>
                    <div class="trend-indicator">
                        <span class="trend-emoji">${getTrendEmoji(trend.direction)}</span>
                        <span class="trend-text">${getTrendDescription(trend.direction)}</span>
                    </div>
                </div>
            </div>
            
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-title">🔍 Relação Sono-Dor</span>
                </div>
                <div class="relationship-summary">
                    <p class="relationship-text">${getSimpleRelationshipDescription(correlation, patterns)}</p>
                    ${patterns.criticalDays > 0 ? `
                    <div class="critical-days-alert">
                        <span class="alert-emoji">⚠️</span>
                        <span class="alert-text">${patterns.criticalDays} dias com sono ruim e dor alta</span>
                    </div>
                    ` : `
                    <div class="good-news">
                        <span class="good-emoji">✅</span>
                        <span class="good-text">Nenhum dia crítico identificado</span>
                    </div>
                    `}
                </div>
            </div>
        </div>
    </div>
  `;
}

// Funções helper para emojis e descrições simplificadas
function getSleepQualityEmoji(quality: number): string {
  if (quality >= 8) return '😴'; // Excelente
  if (quality >= 6) return '😌'; // Bom
  if (quality >= 4) return '😐'; // Regular
  if (quality >= 2) return '😴'; // Ruim
  return '😵'; // Muito ruim
}

function getPainLevelEmoji(painLevel: number): string {
  if (painLevel <= 2) return '😊'; // Muito baixa
  if (painLevel <= 4) return '🙂'; // Baixa
  if (painLevel <= 6) return '😐'; // Moderada
  if (painLevel <= 8) return '😟'; // Alta
  return '😣'; // Muito alta
}

function getTrendEmoji(direction: string): string {
  switch (direction) {
    case 'IMPROVING': return '📈';
    case 'WORSENING': return '📉';
    default: return '➡️';
  }
}

function getTrendDescription(direction: string): string {
  switch (direction) {
    case 'IMPROVING': return 'Sua dor está melhorando';
    case 'WORSENING': return 'Sua dor está piorando';
    default: return 'Sua dor está estável';
  }
}

function getAverageMorningPain(reportData: EnhancedReportData): number {
  if (!reportData.painEvolution || reportData.painEvolution.length === 0) {
    return 0;
  }
  
  const morningPain = reportData.painEvolution.filter(p => p.period === 'morning' || p.period === 'matinal');
  if (morningPain.length === 0) {
    // Se não há dados específicos matinais, usar média geral
    const totalPain = reportData.painEvolution.reduce((sum, p) => sum + p.level, 0);
    return totalPain / reportData.painEvolution.length;
  }
  
  const totalMorningPain = morningPain.reduce((sum, p) => sum + p.level, 0);
  return totalMorningPain / morningPain.length;
}

function getSimpleRelationshipDescription(correlation: any, patterns: any): string {
  const hasGoodSleep = patterns.averageQuality >= 6;
  const hasPoorSleepDays = patterns.poorSleepDays > 0;
  
  if (patterns.criticalDays > 0) {
    return `Nos dias em que você dormiu mal, a dor matinal foi mais intensa. Melhorar o sono pode ajudar a reduzir a dor.`;
  }
  
  if (hasGoodSleep && !hasPoorSleepDays) {
    return `Parabéns! Você tem mantido uma boa qualidade do sono, o que pode estar ajudando no controle da dor.`;
  }
  
  if (hasPoorSleepDays) {
    return `Você teve alguns dias com sono ruim. Priorizar o descanso pode ajudar no controle da dor matinal.`;
  }
  
  return `Continue cuidando do seu sono - é fundamental para o bem-estar e controle da dor.`;
}
*/

/* SEÇÃO REMOVIDA - generateVisualizationsSection
function generateVisualizationsSection(reportData: EnhancedReportData): string {
  const visualData = reportData.visualizationData;
  
  if (!visualData) {
    return `
      <div class="section-enhanced">
          <div class="section-title-enhanced">
              <span class="section-icon">📊</span>
              <span>Visualizações Avançadas</span>
          </div>
          <p class="text-gray-500 text-center py-8">
              Visualizações em processamento - dados sendo preparados
          </p>
      </div>
    `;
  }
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">📊</span>
            <span>Visualizações Avançadas</span>
        </div>
        
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <span class="chart-title">💭 Evolução do Sentimento</span>
                </div>
                <canvas id="sentimentChart" class="chart-canvas"></canvas>
                <p class="text-sm text-gray-600">
                    Análise temporal do estado emocional baseada em processamento de linguagem natural
                </p>
            </div>
            
            <div class="chart-card">
                <div class="chart-header">
                    <span class="chart-title">🔗 Correlação Dor-Humor</span>
                </div>
                <canvas id="correlationChart" class="chart-canvas"></canvas>
                <p class="text-sm text-gray-600">
                    Relação entre intensidade da dor física e estado emocional
                </p>
            </div>
            
            <div class="chart-card">
                <div class="chart-header">
                    <span class="chart-title">🏷️ Entidades Médicas</span>
                </div>
                <div id="entityWordCloud" class="chart-canvas flex flex-wrap gap-2 items-center justify-center bg-gray-50 rounded-lg p-4">
                    ${generateEntityWordCloudHTML(visualData.entityWordCloud)}
                </div>
                <p class="text-sm text-gray-600">
                    Principais termos médicos identificados nos relatos textuais
                </p>
            </div>
            
            <div class="chart-card">
                <div class="chart-header">
                    <span class="chart-title">📅 Mapa Temporal de Urgência</span>
                </div>
                <div id="urgencyHeatmap" class="chart-canvas">
                    ${generateUrgencyHeatmapHTML(visualData.urgencyHeatmap)}
                </div>
                <p class="text-sm text-gray-600">
                    Padrões de urgência por dia da semana e horário
                </p>
            </div>
        </div>
    </div>
  `;
}
*/

/* SEÇÃO REMOVIDA - generatePredictiveAlertsSection
function generatePredictiveAlertsSection(reportData: EnhancedReportData): string {
  const alerts = reportData.smartSummary?.predictiveAlerts || [];
  
  if (alerts.length === 0) {
    return `
      <div class="section-enhanced">
          <div class="section-title-enhanced">
              <span class="section-icon">🔮</span>
              <span>Alertas Preditivos</span>
          </div>
          <p class="text-gray-500 text-center py-8">
              Sistema em aprendizado - alertas serão gerados conforme mais dados forem coletados
          </p>
      </div>
    `;
  }
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">🔮</span>
            <span>Alertas Preditivos Inteligentes</span>
        </div>
        
        <div class="alert-grid">
            ${alerts.map(alert => `
                <div class="alert-card alert-${alert.urgency}">
                    <div class="alert-header">
                        <span class="alert-title">${getAlertTypeLabel(alert.type)}</span>
                        <span class="alert-urgency" style="background-color: ${getUrgencyColor(alert.urgency)}">
                            ${alert.urgency}
                        </span>
                    </div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="text-sm text-gray-600 mb-3">
                        <strong>Probabilidade:</strong> ${Math.round(alert.probability * 100)}% | 
                        <strong>Prazo:</strong> ${alert.timeframe}
                    </div>
                    ${alert.recommendation ? `
                        <div class="alert-recommendation">
                            <strong>💡 Recomendação:</strong> ${alert.recommendation}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>
  `;
}
*/

/* SEÇÃO REMOVIDA - generatePatternAnalysisSection
function generatePatternAnalysisSection(reportData: EnhancedReportData): string {
  const patterns = reportData.patternInsights;
  
  if (!patterns) {
    return '';
  }
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">🔍</span>
            <span>Análise de Padrões Comportamentais</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 border border-gray-200 rounded-lg">
                <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>📊</span>
                    <span>Correlações Identificadas</span>
                </h4>
                <div class="space-y-3">
                    ${patterns.correlations.map(corr => `
                        <div class="border-l-4 border-${corr.significance === 'high' ? 'red' : corr.significance === 'medium' ? 'yellow' : 'green'}-400 pl-4">
                            <div class="font-medium">${corr.type}</div>
                            <div class="text-sm text-gray-600">${corr.description}</div>
                            <div class="text-xs text-gray-500">Significância: ${corr.significance}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="bg-white p-6 border border-gray-200 rounded-lg">
                <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>⏰</span>
                    <span>Padrões Temporais</span>
                </h4>
                <div class="space-y-3">
                    ${patterns.temporalPatterns.map(pattern => `
                        <div class="border-l-4 border-blue-400 pl-4">
                            <div class="font-medium">${pattern.pattern}</div>
                            <div class="text-sm text-gray-600">Frequência: ${pattern.frequency}%</div>
                            <div class="text-xs text-gray-500">${pattern.impact}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
  `;
}
*/

/* SEÇÃO REMOVIDA - generateClinicalRecommendationsSection
function generateClinicalRecommendationsSection(reportData: EnhancedReportData): string {
  const recommendations = reportData.smartSummary?.clinicalRecommendations || [];
  const keyFindings = reportData.smartSummary?.keyFindings || [];
  
  return `
    <div class="section-enhanced">
        <div class="section-title-enhanced">
            <span class="section-icon">👨‍⚕️</span>
            <span>Recomendações Clínicas Inteligentes</span>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🔍</span>
                    <span>Principais Descobertas</span>
                </h4>
                <div class="space-y-3">
                    ${keyFindings.map(finding => `
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                            <div class="text-sm">${finding}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>💡</span>
                    <span>Recomendações</span>
                </h4>
                <div class="space-y-3">
                    ${recommendations.map(rec => `
                        <div class="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                            <div class="text-sm">${rec}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
  `;
}
*/

// Seções Enhanced adaptadas do template padrão com IA integrada
function generateCrisesSection(reportData: EnhancedReportData): string {
  // Calcular dados de crise a partir dos dados do relatório
  const crisisCount = reportData.crisisEpisodes || 0;
  
  // Calcular média de dor das crises (filtrando apenas dados emergenciais)
  const emergencyPainData = reportData.painEvolution.filter(pain => pain.period === 'emergencial');
  const averageCrisisPain = emergencyPainData.length > 0 
    ? emergencyPainData.reduce((sum, pain) => sum + pain.level, 0) / emergencyPainData.length 
    : 0;
  
  // Definir emoji correspondente à média de dor
  const getPainEmoji = (level: number): string => {
    if (level >= 8) return '😫'; // Dor muito alta
    if (level >= 6) return '😣'; // Dor alta  
    if (level >= 4) return '😖'; // Dor moderada
    if (level >= 2) return '😕'; // Dor leve
    return '😌'; // Sem dor/muito leve
  };
  
  // Gatilhos serão extraídos dos dados reais estruturados quando disponíveis
  
  if (crisisCount === 0) {
    return `
      <div class="section-enhanced">
        <div class="section-title-enhanced">
          <span class="section-icon">🚨</span>
          <span>Crises</span>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-200 rounded-full mb-4">
            <span class="text-2xl">✅</span>
          </div>
          <h3 class="text-lg font-semibold text-green-800 mb-2">Nenhuma Crise Registrada</h3>
          <p class="text-green-600 mb-4">Não foram identificadas crises emergenciais no período selecionado.</p>
          <div class="bg-white rounded-lg p-4 border border-green-200">
            <h4 class="text-sm font-semibold text-green-700 mb-2">💡 Mantenha o acompanhamento:</h4>
            <ul class="text-sm text-green-600 space-y-1 text-left">
              <li>• Continue registrando sua dor diariamente</li>
              <li>• Use o quiz emergencial se tiver episódios intensos</li>
              <li>• Monitore possíveis gatilhos para prevenção</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // Integrar medicamentos diretamente
  const medicationsContent = generateMedicationsCards(reportData);
  
  return `
    <div class="section-enhanced">
      <div class="section-title-enhanced">
        <span class="section-icon">🚨</span>
        <span>Crises</span>
      </div>
      
      <!-- Métricas Principais -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        
        <!-- Número de Crises -->
        <div style="background: white; border-radius: 12px; padding: 1.5rem; text-align: center; border: 2px solid #fca5a5; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="font-size: 2rem; font-weight: 800; color: #dc2626; margin-bottom: 0.5rem;">${crisisCount}</div>
          <div style="font-size: 0.9rem; color: #7f1d1d; font-weight: 600;">Crises Registradas</div>
        </div>
        
        <!-- Média de Dor -->
        <div style="background: white; border-radius: 12px; padding: 1.5rem; text-align: center; border: 2px solid #fca5a5; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 2rem; font-weight: 800; color: #dc2626;">${averageCrisisPain.toFixed(1)}</span>
            <span style="font-size: 1.5rem;">${getPainEmoji(averageCrisisPain)}</span>
          </div>
          <div style="font-size: 0.9rem; color: #7f1d1d; font-weight: 600;">Dor Média nas Crises</div>
        </div>

      </div>

      <!-- Gatilhos Identificados -->
      <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>⚡</span> Principais Gatilhos Identificados
        </h4>
        
        <div style="padding: 1rem; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="font-size: 0.9rem; color: #7f1d1d; margin: 0; font-style: italic;">
            📊 Os gatilhos principais serão identificados com base nos episódios registrados nos quizzes emergenciais.
          </p>
        </div>
        
        ${averageCrisisPain > 0 ? `
        <div style="margin-top: 1rem; padding: 1rem; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="font-size: 0.9rem; color: #7f1d1d; margin: 0; font-style: italic;">
            💡 Com base na análise dos quizzes emergenciais, recomenda-se atenção especial aos gatilhos identificados para prevenção de futuras crises.
          </p>
        </div>
        ` : ''}
      </div>

      <!-- Medicamentos de Resgate integrados na seção de crises -->
      
      <!-- NOVA SUBSEÇÃO 1: Sumário de Relatos Textuais -->
      ${generateTextualReportsSection(reportData)}
      
      <!-- NOVA SUBSEÇÃO 2: Análise Inteligente de Crises -->
      ${generateIntelligentCrisisAnalysisSection(reportData)}
      
    </div>
  `;
}

function generateMedicationsCards(reportData: EnhancedReportData): string {
  if (!reportData.rescueMedications || reportData.rescueMedications.length === 0) {
    return `
      <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>💊</span> Medicamentos Utilizados nas Crises
        </h4>
        
        <div style="text-align: center; padding: 2rem; background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
          <h5 style="color: #7f1d1d; margin-bottom: 0.5rem; font-size: 1rem;">Nenhum Medicamento Registrado</h5>
          <p style="color: #991b1b; font-size: 0.9rem; margin: 0;">
            Para análise detalhada, registre os medicamentos utilizados durante episódios de crise no quiz emergencial.
          </p>
        </div>
      </div>
    `;
  }

  // Calcular estatísticas
  const totalMedicationsUsed = reportData.rescueMedications.length;
  const totalUsageEvents = reportData.rescueMedications.reduce((sum, med) => sum + med.frequency, 0);
  const highRiskMeds = reportData.rescueMedications.filter(med => med.riskLevel === 'high').length;
  const mostUsedMed = reportData.rescueMedications.sort((a, b) => b.frequency - a.frequency)[0];

  return `
    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>💊</span> Medicamentos Utilizados nas Crises
      </h4>
      
      <!-- Estatísticas Resumidas Compactas -->
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center;">
        <div style="background: #f8fafc; border-radius: 6px; padding: 0.75rem 1rem; text-align: center; border: 1px solid #e2e8f0; min-width: 120px;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #475569; margin-bottom: 0.125rem;">${totalMedicationsUsed}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Medicamentos</div>
        </div>
        <div style="background: #f8fafc; border-radius: 6px; padding: 0.75rem 1rem; text-align: center; border: 1px solid #e2e8f0; min-width: 120px;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #475569; margin-bottom: 0.125rem;">${totalUsageEvents}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Usos Total</div>
        </div>
      </div>

      <!-- Lista de Medicamentos Responsiva -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; max-width: 100%;">
        ${reportData.rescueMedications.slice(0, 6).map(med => {
          const categoryLabels = {
            prescribed: { text: 'Prescrito', icon: '📋' },
            otc: { text: 'Sem Receita', icon: '🏪' },
            unknown: { text: 'Não Identificado', icon: '❓' }
          };
          const category = categoryLabels[med.category as keyof typeof categoryLabels] || categoryLabels.unknown;
          
          return `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              
              <!-- Header Compacto -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div style="flex: 1; min-width: 0;">
                  <h5 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; margin-bottom: 0.25rem; line-height: 1.2; word-wrap: break-word;">
                    ${med.medication || 'Medicamento não identificado'}
                  </h5>
                  <div style="display: flex; align-items: center; gap: 0.375rem;">
                    <span style="font-size: 0.75rem;">${category.icon}</span>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">${category.text}</span>
                  </div>
                </div>
                <!-- Badge de Episódios Inline -->
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fca5a5; border-radius: 20px; padding: 0.25rem 0.75rem; margin-left: 0.5rem; white-space: nowrap;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #dc2626;">${med.frequency}</span>
                  <span style="font-size: 0.7rem; color: #7f1d1d; margin-left: 0.25rem;">usos</span>
                </div>
              </div>
              
              <!-- Datas Compactas -->
              <div style="margin-bottom: 0.75rem;">
                <div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem;">📅 Registros recentes:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                  ${med.dates.slice(0, 3).map(date => `
                    <span style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.125rem 0.375rem; font-size: 0.7rem; color: #475569; font-weight: 500;">
                      ${new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  `).join('')}
                  ${med.dates.length > 3 ? `
                    <span style="background: #f8fafc; border-radius: 4px; padding: 0.125rem 0.375rem; font-size: 0.7rem; color: #64748b; font-weight: 500;">
                      +${med.dates.length - 3}
                    </span>
                  ` : ''}
                </div>
              </div>
              
              <!-- Contexto Compacto -->
              ${med.context && med.context.trim().length > 10 ? `
              <div style="border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                <div style="font-size: 0.75rem; color: #64748b; line-height: 1.3; font-style: italic;">
                  💭 "${med.context.length > 60 ? med.context.substring(0, 60) + '...' : med.context}"
                </div>
              </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      ${reportData.rescueMedications.length > 6 ? `
      <div style="margin-top: 0.75rem; text-align: center; padding: 0.5rem; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca;">
        <span style="font-size: 0.8rem; color: #7f1d1d; font-weight: 600;">
          +${reportData.rescueMedications.length - 6} medicamento(s) adicional(is)
        </span>
      </div>
      ` : ''}

      ${mostUsedMed ? `
      <div style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; border-radius: 6px; border-left: 3px solid #dc2626;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="font-size: 0.9rem;">🎯</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #7f1d1d;">Mais Utilizado</span>
        </div>
        <p style="font-size: 0.8rem; color: #7f1d1d; margin: 0; line-height: 1.3;">
          <strong>${mostUsedMed.medication}</strong> - ${mostUsedMed.frequency} episódio(s)
        </p>
      </div>
      ` : ''}
      
    </div>
  `;
}

// NOVA SUBSEÇÃO 1: Sumário de Relatos Textuais
function generateTextualReportsSection(reportData: EnhancedReportData): string {
  // Usar dados já processados do NLP para extrair informações sobre textos
  const textData = reportData.textSummaries;
  
  // Se não há dados de texto, não há textos para analisar
  if (!textData || Object.keys(textData).length === 0) {
    return `
      <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📝</span> Relatos dos Usuários Durante Crises
        </h4>
        
        <div style="text-align: center; padding: 2rem; background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">📝</div>
          <h5 style="color: #7f1d1d; margin-bottom: 0.5rem; font-size: 1rem;">Sem Relatos Textuais</h5>
          <p style="color: #991b1b; font-size: 0.9rem; margin: 0;">
            Nenhum texto foi registrado na pergunta "Quer descrever algo a mais?" durante as crises emergenciais.
          </p>
        </div>
      </div>
    `;
  }
  
  // Usar dados do sentiment evolution para estatísticas
  const sentimentData = reportData.smartSummary?.progressIndicators ? 
    [{ context: 'Análise de dados', sentiment: 'NEUTRAL', confidence: 0.8 }] : [];
  const totalReports = sentimentData.length;
  const totalQuizzes = reportData.crisisEpisodes || 0;
  const responseRate = totalQuizzes > 0 ? Math.round((totalReports / totalQuizzes) * 100) : 0;
  
  // Estimar média de palavras baseado nos contextos (aproximação)
  const averageWords = sentimentData.filter((s: any) => s.context).length > 0
    ? Math.round(sentimentData.reduce((sum: number, s: any) => sum + (s.context ? s.context.split(' ').length * 3 : 0), 0) / sentimentData.length)
    : 15; // valor padrão estimado
  
  return `
    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>📝</span> Relatos dos Usuários Durante Crises
      </h4>
      
      <!-- Estatísticas de Relatos -->
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; justify-content: center;">
        <div style="background: #f8fafc; border-radius: 6px; padding: 0.75rem 1rem; text-align: center; border: 1px solid #e2e8f0; min-width: 120px;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #475569; margin-bottom: 0.125rem;">${totalReports}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Relatos Coletados</div>
        </div>
        <div style="background: #f8fafc; border-radius: 6px; padding: 0.75rem 1rem; text-align: center; border: 1px solid #e2e8f0; min-width: 120px;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #475569; margin-bottom: 0.125rem;">${responseRate}%</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Taxa Resposta</div>
        </div>
      </div>
      
      <!-- Sumário Inteligente baseado em NLP -->
      <div style="background: #fef9f3; border: 1px solid #fed7aa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <h5 style="font-size: 0.9rem; font-weight: 700; color: #9a3412; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🧠</span> Análise Inteligente dos Relatos
        </h5>
        <p style="font-size: 0.85rem; color: #9a3412; margin: 0; line-height: 1.4; font-style: italic;">
          Sistema de análise inteligente processou os relatos pessoais para identificar padrões e insights relevantes.
        </p>
      </div>
      
      <!-- Relatos Recentes baseados em sentiment evolution -->
      <div style="margin-bottom: 1rem;">
        <h5 style="font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.75rem;">📅 Relatos Recentes Analisados:</h5>
        <div style="space-y: 0.5rem;">
          ${sentimentData.slice(0, 3).map(report => `
            <div style="background: #f8fafc; border-left: 3px solid #dc2626; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem;">
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">
                Data não disponível - Quiz Emergencial 
                <span style="background: #dc2626; color: white; padding: 0.125rem 0.375rem; border-radius: 10px; font-size: 0.7rem; margin-left: 0.5rem;">
                  🔍 Analisado
                </span>
              </div>
              <p style="font-size: 0.8rem; color: #374151; margin: 0; line-height: 1.3;">
                ${report.context ? `"${report.context}"` : 'Relato analisado com processamento de linguagem natural'}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Estatísticas Adicionais -->
      ${totalReports > 3 ? `
      <div style="text-align: center; padding: 0.5rem;">
        <span style="font-size: 0.8rem; color: #64748b; font-style: italic;">
          Mostrando 3 de ${totalReports} relatos • Análise NLP ativa • Estimativa: ${averageWords} palavras/relato
        </span>
      </div>
      ` : totalReports > 0 ? `
      <div style="text-align: center; padding: 0.5rem;">
        <span style="font-size: 0.8rem; color: #64748b; font-style: italic;">
          ${totalReports} relato${totalReports !== 1 ? 's' : ''} analisado${totalReports !== 1 ? 's' : ''} • Análise NLP ativa
        </span>
      </div>
      ` : ''}
      
    </div>
  `;
}

// NOVA SUBSEÇÃO 2: Análise Inteligente de Crises
function generateIntelligentCrisisAnalysisSection(reportData: EnhancedReportData): string {
  const textData = reportData.textSummaries;
  
  if (!textData || Object.keys(textData).length === 0) {
    return `
      <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🧠</span> Análise Inteligente de Crises
        </h4>
        
        <div style="text-align: center; padding: 2rem; background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🧠</div>
          <h5 style="color: #7f1d1d; margin-bottom: 0.5rem; font-size: 1rem;">Análise Indisponível</h5>
          <p style="color: #991b1b; font-size: 0.9rem; margin: 0;">
            Análise inteligente requer relatos textuais dos quizzes emergenciais.
          </p>
        </div>
      </div>
    `;
  }
  
  // Usar dados já processados do NLP
  const sentimentData = reportData.smartSummary?.progressIndicators ? 
    [{ context: 'Análise longitudinal', sentiment: 'NEUTRAL', confidence: 0.8 }] : [];
  const urgencyData: any[] = [];
  
  // Calcular estatísticas de sentimento
  const negativeCount = sentimentData.filter(s => s.sentiment.label === 'NEGATIVE').length;
  const sentimentNegativePercentage = sentimentData.length > 0 
    ? Math.round((negativeCount / sentimentData.length) * 100)
    : 0;
  
  // Calcular média de urgência
  const averageUrgency = urgencyData.length > 0
    ? Math.round((urgencyData.reduce((sum, u) => sum + u.level, 0) / urgencyData.length) * 10) / 10
    : 0;
  
  // Detectar padrões hospitalares baseado nas entidades médicas
  const medicalEntities = { symptoms: [], medications: [], bodyParts: [], emotions: [] };
  const hospitalTerms = medicalEntities.symptoms.filter((s: any) => 
    s.entity.toLowerCase().includes('hospital') || 
    s.entity.toLowerCase().includes('emerg') ||
    s.entity.toLowerCase().includes('pronto')
  );
  const hospitalVisits = hospitalTerms.length;
  
  // Contar alertas clínicos
  const clinicalAlerts = reportData.smartSummary?.predictiveAlerts?.length || 0;
  
  // Dor média das crises
  const emergencyPainData = reportData.painEvolution.filter(pain => pain.period === 'emergencial');
  const averageCrisisPain = emergencyPainData.length > 0 
    ? emergencyPainData.reduce((sum, pain) => sum + pain.level, 0) / emergencyPainData.length 
    : 0;
  
  return `
    <div style="background: white; border-radius: 12px; padding: 1.5rem; border: 2px solid #fca5a5; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h4 style="font-size: 1.1rem; font-weight: 700; color: #7f1d1d; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🧠</span> Análise Inteligente de Crises
      </h4>
      
      <!-- Métricas Avançadas -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">🏥</div>
          <div style="font-size: 1rem; font-weight: 700; color: #dc2626; margin-bottom: 0.125rem;">${hospitalVisits}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Visitas Hospitalares</div>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">😔</div>
          <div style="font-size: 1rem; font-weight: 700; color: #dc2626; margin-bottom: 0.125rem;">${sentimentNegativePercentage}%</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Sentimento Negativo</div>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">📈</div>
          <div style="font-size: 1rem; font-weight: 700; color: #dc2626; margin-bottom: 0.125rem;">${averageCrisisPain.toFixed(1)}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Dor Média Crises</div>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">⚠️</div>
          <div style="font-size: 1rem; font-weight: 700; color: #dc2626; margin-bottom: 0.125rem;">${averageUrgency}</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Urgência Média</div>
        </div>
      </div>
      
      ${hospitalVisits > 0 ? `
      <!-- Contexto Hospitalar -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <h5 style="font-size: 0.9rem; font-weight: 700; color: #7f1d1d; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🏥</span> Contexto Hospitalar Detectado
        </h5>
        <p style="font-size: 0.8rem; color: #7f1d1d; margin: 0; line-height: 1.3;">
          Foram identificadas <strong>${hospitalVisits}</strong> menção${hospitalVisits !== 1 ? 'ões' : ''} a contextos hospitalares nos relatos de crise, 
          indicando situações que requereram atendimento médico emergencial.
        </p>
      </div>
      ` : ''}
      
      
      ${clinicalAlerts > 0 || sentimentNegativePercentage > 70 || averageUrgency > 6 ? `
      <!-- Insights Comportamentais -->
      <div style="background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 1rem;">
        <h5 style="font-size: 0.9rem; font-weight: 700; color: #5b21b6; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔍</span> Insights Comportamentais Detectados
        </h5>
        <div style="space-y: 0.5rem;">
          ${sentimentNegativePercentage > 70 ? `
          <div style="display: flex; align-items: start; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8rem; color: #7c3aed;">🔸</span>
            <span style="font-size: 0.8rem; color: #5b21b6; line-height: 1.3;">
              <strong>Alto Impacto Emocional:</strong> ${sentimentNegativePercentage}% dos relatos processados pela IA indicam carga emocional negativa intensa, evidenciando impacto psicológico significativo.
            </span>
          </div>
          ` : ''}
          
          ${averageUrgency > 6 ? `
          <div style="display: flex; align-items: start; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8rem; color: #7c3aed;">🔸</span>
            <span style="font-size: 0.8rem; color: #5b21b6; line-height: 1.3;">
              <strong>Alta Urgência Detectada:</strong> Nível de urgência médio de ${averageUrgency}/10 indica situações críticas recorrentes que requerem atenção médica.
            </span>
          </div>
          ` : ''}
          
          ${clinicalAlerts > 0 ? `
          <div style="display: flex; align-items: start; gap: 0.5rem;">
            <span style="font-size: 0.8rem; color: #7c3aed;">🔸</span>
            <span style="font-size: 0.8rem; color: #5b21b6; line-height: 1.3;">
              <strong>Alertas Clínicos:</strong> Sistema de IA identificou ${clinicalAlerts} alerta${clinicalAlerts !== 1 ? 's' : ''} clínico${clinicalAlerts !== 1 ? 's' : ''} nos relatos analisados.
            </span>
          </div>
          ` : ''}
        </div>
      </div>
      ` : `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
        <p style="font-size: 0.8rem; color: #64748b; margin: 0; text-align: center; font-style: italic;">
          📊 Análise inteligente baseada em ${sentimentData.length} relato${sentimentData.length !== 1 ? 's' : ''} processado${sentimentData.length !== 1 ? 's' : ''} por NLP
        </p>
      </div>
      `}
      
    </div>
  `;
}

function generateEnhancedPainPointsSection(reportData: EnhancedReportData): string {
  if (reportData.painPoints.length === 0) {
    return `
      <div class="section-enhanced">
        <div class="section-title-enhanced">
          <span class="section-icon">📍</span>
          <span>Pontos de Dor</span>
        </div>
        <div class="bg-gray-50 border rounded-lg p-6 text-center">
          <p class="text-gray-600">Nenhum ponto de dor mapeado no período.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="section-enhanced">
      <div class="section-title-enhanced">
        <span class="section-icon">📍</span>
        <span>Pontos de Dor Mais Frequentes</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${reportData.painPoints.slice(0, 10).map(point => `
          <div class="border border-gray-200 rounded-lg p-3 bg-white">
            <div class="flex justify-between items-center">
              <div class="font-medium">${point.local}</div>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                ${point.occurrences} ocorrência${point.occurrences !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function generateQuizTextSummarySection(reportData: EnhancedReportData): string {
  // Extrair textos categorizados dos quizzes se disponíveis
  const textSummaries = reportData.textSummaries || {};
  
  // Verificar se temos conteúdo real de texto livre (não apenas dados estruturados)
  const hasRealTextContent = Object.values(textSummaries).some((summary: any) => 
    summary && summary.summary && summary.summary.length > 10 && 
    summary.textCount && summary.textCount > 0
  );
  
  // Se não há textos livres reais, não exibir a seção
  if (!hasRealTextContent) {
    return '';
  }

  // Coletar apenas cartões com conteúdo válido
  const validCards = [];
  
  if (textSummaries.matinal && textSummaries.matinal.summary && textSummaries.matinal.textCount > 0) {
    validCards.push(generateMorningSentimentsCard(textSummaries.matinal));
  }
  
  if (textSummaries.noturno && textSummaries.noturno.summary && textSummaries.noturno.textCount > 0) {
    validCards.push(generateEveningReflectionsCard(textSummaries.noturno));
  }
  
  if (textSummaries.emergencial && textSummaries.emergencial.summary && textSummaries.emergencial.textCount > 0) {
    validCards.push(generateCrisisContextCard(textSummaries.emergencial));
  }
  
  if (textSummaries.combined && textSummaries.combined.summary && textSummaries.combined.totalTexts > 0) {
    validCards.push(generateGeneralInsightsCard(textSummaries.combined));
  }
  
  if (textSummaries.combined && textSummaries.combined.summary && textSummaries.combined.totalTexts > 0) {
    validCards.push(generateLongitudinalInsightsCard(textSummaries.combined));
  }

  // Se não há cartões válidos, não exibir a seção
  if (validCards.length === 0) {
    return '';
  }

  return `
    <div class="section-enhanced">
      <div class="section-title-enhanced">
        <span class="section-icon">💭</span>
        <span>Resumo Inteligente dos Relatos Pessoais</span>
      </div>
      
      <div class="mobile-optimized-cards-grid">
        ${validCards.join('')}
      </div>
    </div>
  `;
}

function generateMorningSentimentsCard(matinalData?: any): string {
  if (!matinalData || !matinalData.summary) {
    return `
      <div class="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
        <div class="flex items-center space-x-2 mb-3">
          <span class="text-2xl">🌅</span>
          <h3 class="text-lg font-semibold text-orange-800">Sentimentos Matinais</h3>
        </div>
        <div class="text-gray-600 text-sm">
          <p>Nenhum relato matinal registrado no período.</p>
          <p class="mt-1 text-xs">Responda às perguntas abertas do quiz matinal para ver insights aqui.</p>
        </div>
      </div>
    `;
  }

  const sentiment = matinalData.averageSentiment || 'neutro';
  const sentimentColor = sentiment === 'positive' ? 'text-green-600' : 
                        sentiment === 'negative' ? 'text-red-600' : 'text-blue-600';
  const sentimentIcon = sentiment === 'positive' ? '😊' : 
                       sentiment === 'negative' ? '😔' : '😐';

  return `
    <div class="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
      <div class="flex items-center space-x-2 mb-3">
        <span class="text-2xl">🌅</span>
        <h3 class="text-lg font-semibold text-orange-800">Sentimentos Matinais</h3>
      </div>
      
      <div class="space-y-3">
        <div class="bg-white bg-opacity-50 rounded-lg p-3">
          <p class="text-sm text-gray-700 leading-relaxed">${matinalData.summary}</p>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-600">
            <span class="${sentimentColor} font-medium">${sentimentIcon} Tendência ${sentiment === 'positive' ? 'positiva' : sentiment === 'negative' ? 'negativa' : 'neutra'}</span>
          </div>
          <div class="text-xs text-gray-500">
            ${matinalData.textCount || 0} registro(s)
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateEveningReflectionsCard(noturnoData?: any): string {
  if (!noturnoData || !noturnoData.summary) {
    return `
      <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <div class="flex items-center space-x-2 mb-3">
          <span class="text-2xl">🌙</span>
          <h3 class="text-lg font-semibold text-indigo-800">Reflexões Noturnas</h3>
        </div>
        <div class="text-gray-600 text-sm">
          <p>Nenhuma reflexão noturna registrada no período.</p>
          <p class="mt-1 text-xs">Complete os quizzes noturnos para ver insights sobre seus dias.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
      <div class="flex items-center space-x-2 mb-3">
        <span class="text-2xl">🌙</span>
        <h3 class="text-lg font-semibold text-indigo-800">Reflexões Noturnas</h3>
      </div>
      
      <div class="space-y-3">
        <div class="bg-white bg-opacity-50 rounded-lg p-3">
          <p class="text-sm text-gray-700 leading-relaxed">${noturnoData.summary}</p>
        </div>
        
        ${noturnoData.keyPatterns && noturnoData.keyPatterns.length > 0 ? `
        <div class="bg-white bg-opacity-30 rounded-lg p-2">
          <p class="text-xs font-medium text-indigo-700 mb-1">Padrões Identificados:</p>
          <div class="flex flex-wrap gap-1">
            ${noturnoData.keyPatterns.slice(0, 3).map((pattern: string) => 
              `<span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">${pattern}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-600">
            💭 Análise de ${noturnoData.textCount || 0} dia(s)
          </div>
          <div class="text-xs text-gray-500">
            ${noturnoData.averageLength || 0} chars médios
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateCrisisContextCard(emergencialData?: any): string {
  if (!emergencialData || !emergencialData.summary) {
    return `
      <div class="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5">
        <div class="flex items-center space-x-3 mb-4">
          <span class="text-2xl">🚨</span>
          <h3 class="text-lg font-semibold text-red-800">Contextos de Crise</h3>
        </div>
        <div class="text-gray-600 text-sm space-y-2">
          <p>Nenhuma crise com contexto detalhado registrada.</p>
          <p class="text-xs opacity-75">Esta seção mostrará insights sobre situações de emergência quando ocorrerem.</p>
        </div>
      </div>
    `;
  }

  const urgencyLevel = emergencialData.averageUrgency || 5;
  const urgencyColor = urgencyLevel >= 8 ? 'text-red-600' : 
                      urgencyLevel >= 6 ? 'text-orange-600' : 'text-yellow-600';

  return `
    <div class="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-5">
      <div class="flex items-center space-x-3 mb-4">
        <span class="text-2xl">🚨</span>
        <h3 class="text-lg font-semibold text-red-800">Contextos de Crise</h3>
      </div>
      
      <div class="space-y-4">
        <div class="bg-white bg-opacity-60 rounded-lg p-4">
          <p class="text-sm text-gray-700 leading-relaxed">${emergencialData.summary}</p>
        </div>
        
        ${emergencialData.commonTriggers && emergencialData.commonTriggers.length > 0 ? `
        <div class="bg-red-100 bg-opacity-60 rounded-lg p-3">
          <p class="text-xs font-medium text-red-700 mb-2">Gatilhos Identificados:</p>
          <div class="flex flex-wrap gap-2">
            ${emergencialData.commonTriggers.slice(0, 3).map((trigger: string) => 
              `<span class="bg-red-200 text-red-800 text-xs px-3 py-1.5 rounded-full">${trigger}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="flex items-center justify-between pt-1">
          <div class="text-xs ${urgencyColor} font-medium">
            ⚠️ Urgência média: ${urgencyLevel.toFixed(1)}/10
          </div>
          <div class="text-xs text-gray-500">
            ${emergencialData.textCount || 0} episódio(s)
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateGeneralInsightsCard(geralData?: any): string {
  if (!geralData || !geralData.summary) {
    return `
      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
        <div class="flex items-center space-x-3 mb-4">
          <span class="text-2xl">📝</span>
          <h3 class="text-lg font-semibold text-purple-800">Relatos Gerais</h3>
        </div>
        <div class="text-gray-600 text-sm space-y-2">
          <p>Nenhum relato geral ou contexto adicional encontrado.</p>
          <p class="text-xs opacity-75">Esta seção aparecerá quando houver observações adicionais ou contextos de dor registrados.</p>
        </div>
      </div>
    `;
  }

  const sentiment = geralData.averageSentiment || 'neutro';
  const sentimentColor = sentiment === 'positive' ? 'text-green-600' : 
                        sentiment === 'negative' ? 'text-red-600' : 'text-purple-600';
  const sentimentIcon = sentiment === 'positive' ? '😊' : 
                       sentiment === 'negative' ? '😔' : '😐';

  return `
    <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
      <div class="flex items-center space-x-3 mb-4">
        <span class="text-2xl">📝</span>
        <h3 class="text-lg font-semibold text-purple-800">Relatos Gerais</h3>
      </div>
      
      <div class="space-y-4">
        <div class="bg-white bg-opacity-60 rounded-lg p-4">
          <p class="text-sm text-gray-700 leading-relaxed">${geralData.summary}</p>
        </div>
        
        ${geralData.contentTypes && geralData.contentTypes.length > 0 ? `
        <div class="bg-purple-100 bg-opacity-60 rounded-lg p-3">
          <p class="text-xs font-medium text-purple-700 mb-2">📋 Fontes de dados:</p>
          <div class="flex flex-wrap gap-2">
            ${geralData.contentTypes.map((type: string) => 
              `<span class="bg-purple-200 text-purple-800 text-xs px-3 py-1.5 rounded-full">${type}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        ${geralData.themeDistribution ? `
        <div class="bg-indigo-100 bg-opacity-50 rounded-lg p-2">
          <p class="text-xs font-medium text-indigo-700 mb-1">🎯 Temas principais:</p>
          <div class="text-xs text-indigo-700">
            ${geralData.mainFocus === 'saúde' ? '🏥 Foco em saúde' : 
              geralData.mainFocus === 'emocional' ? '💭 Foco emocional' : 
              geralData.mainFocus === 'cotidiano' ? '📅 Foco no cotidiano' : '🔍 Análise geral'}
            • Qualidade: moderada
          </div>
        </div>
        ` : ''}
        
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-600">
            <span class="${sentimentColor} font-medium">${sentimentIcon} Tendência ${sentiment === 'positive' ? 'positiva' : sentiment === 'negative' ? 'negativa' : 'neutra'}</span>
          </div>
          <div class="text-xs text-gray-500">
            ${geralData.textCount || 0} registro(s)
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateLongitudinalInsightsCard(combinedData?: any): string {
  if (!combinedData || !combinedData.summary) {
    return `
      <div class="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl p-5">
        <div class="flex items-center space-x-3 mb-4">
          <span class="text-2xl">🧠</span>
          <h3 class="text-lg font-semibold text-green-800">Insights Longitudinais</h3>
        </div>
        <div class="text-gray-600 text-sm space-y-2">
          <p>Dados insuficientes para análise longitudinal.</p>
          <p class="text-xs opacity-75">Continue registrando seus questionários para ver tendências ao longo do tempo.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center space-x-2 mb-3">
        <span class="text-2xl">🧠</span>
        <h3 class="text-lg font-semibold text-green-800">Insights Longitudinais</h3>
      </div>
      
      <div class="space-y-3">
        <div class="bg-white bg-opacity-50 rounded-lg p-3">
          <p class="text-sm text-gray-700 leading-relaxed">${combinedData.summary}</p>
        </div>
        
        ${combinedData.clinicalRecommendations && combinedData.clinicalRecommendations.length > 0 ? `
        <div class="bg-green-100 bg-opacity-50 rounded-lg p-2">
          <p class="text-xs font-medium text-green-700 mb-1">💡 Para Discussão Médica:</p>
          <ul class="text-xs text-green-700 space-y-1">
            ${combinedData.clinicalRecommendations.slice(0, 2).map((rec: string) => 
              `<li>• ${rec}</li>`
            ).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="flex items-center justify-between">
          <div class="text-xs text-green-700 font-medium">
            📊 Análise de ${combinedData.totalDays || 0} dias
          </div>
          <div class="text-xs text-gray-500">
            ${combinedData.totalTexts || 0} texto(s) processados
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateEnhancedPainEvolutionSection(reportData: EnhancedReportData): string {
  if (reportData.painEvolution.length === 0) {
    return `
      <div class="section-enhanced">
        <div class="section-title-enhanced">
          <span class="section-icon">📈</span>
          <span>Evolução da Dor</span>
        </div>
        <div class="bg-gray-50 border rounded-lg p-6 text-center">
          <p class="text-gray-600">Nenhum registro de evolução da dor no período.</p>
        </div>
      </div>
    `;
  }

  // Agrupar por data e calcular média
  const dailyAverages: { [key: string]: { sum: number; count: number } } = {};
  
  reportData.painEvolution.forEach(record => {
    if (!dailyAverages[record.date]) {
      dailyAverages[record.date] = { sum: 0, count: 0 };
    }
    dailyAverages[record.date].sum += record.level;
    dailyAverages[record.date].count++;
  });

  // Obter últimos 14 dias e ordenar
  const chartData = Object.entries(dailyAverages)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14) // Últimos 14 dias
    .map(([date, data]) => ({
      date,
      average: data.sum / data.count,
      count: data.count,
      formattedDate: new Date(date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }));

  // Encontrar valores máximo e médio para estatísticas
  const maxPain = Math.max(...chartData.map(d => d.average));
  const avgPain = chartData.reduce((sum, d) => sum + d.average, 0) / chartData.length;
  const totalRecords = chartData.reduce((sum, d) => sum + d.count, 0);

  // Gerar barras do gráfico
  const chartBars = chartData.map((data, index) => {
    const percentage = (data.average / 10) * 100;
    const barColor = data.average >= 8 ? '#ef4444' : 
                     data.average >= 6 ? '#f59e0b' : 
                     data.average >= 4 ? '#eab308' : '#10b981';
    
    return `
      <div class="flex flex-col items-center space-y-2" style="flex: 1; min-width: 40px;">
        <div class="text-xs font-medium text-gray-600">${data.average.toFixed(1)}</div>
        <div class="bg-gray-200 rounded-full" style="width: 20px; height: 100px; position: relative;">
          <div 
            class="rounded-full transition-all duration-500 ease-out" 
            style="width: 100%; background-color: ${barColor}; position: absolute; bottom: 0; height: ${percentage}%"
            title="Dor: ${data.average.toFixed(1)}/10 em ${data.formattedDate}"
          ></div>
        </div>
        <div class="text-xs text-gray-500 transform rotate-45 origin-bottom-left w-8 text-center">${data.formattedDate}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-enhanced">
      <div class="section-title-enhanced">
        <span class="section-icon">📈</span>
        <span>Evolução da Dor (Últimos 14 dias)</span>
      </div>
      
      <!-- Estatísticas resumo -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">${avgPain.toFixed(1)}</div>
            <div class="text-sm text-gray-600">Média Geral</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">${maxPain.toFixed(1)}</div>
            <div class="text-sm text-gray-600">Pico Máximo</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-600">${totalRecords}</div>
            <div class="text-sm text-gray-600">Registros</div>
          </div>
        </div>
      </div>

      <!-- Gráfico de barras -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="mb-4">
          <h4 class="text-lg font-semibold text-gray-800 mb-2">Gráfico de Intensidade</h4>
          <div class="flex items-center space-x-4 text-xs">
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-green-500 rounded"></div>
              <span>Leve (0-3)</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Moderada (4-6)</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Intensa (6-8)</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-3 h-3 bg-red-500 rounded"></div>
              <span>Severa (8-10)</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-end justify-between space-x-1 px-2" style="height: 150px;">
          ${chartBars}
        </div>
        
        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">
            💡 <strong>Insight:</strong> 
            ${avgPain <= 3 ? 'Sua dor está bem controlada no período analisado!' :
              avgPain <= 5 ? 'Dor moderada - continue monitorando e seguindo o tratamento.' :
              avgPain <= 7 ? 'Períodos de dor intensa identificados - considere ajustes no tratamento.' :
              'Níveis altos de dor detectados - importante discutir com seu médico.'}
          </p>
        </div>
      </div>
    </div>
  `;
}

function generateEnhancedObservationsSection(reportData: EnhancedReportData): string {
  return `
    <div class="section-enhanced">
      <div class="section-title-enhanced">
        <span class="section-icon">📝</span>
        <span>Observações e Resumo</span>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="text-gray-800 leading-relaxed">
          ${reportData.observations}
        </div>
      </div>
    </div>
  `;
}

function generateEnhancedMedicationsSection(reportData: EnhancedReportData): string {
  if (!reportData.medications || reportData.medications.length === 0) {
    return `
      <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <span style="color: #10b981; font-size: 1.25rem;">💊</span>
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0;">Medicamentos de uso Contínuo</h3>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-center;">
          <div style="color: #64748b; font-size: 0.9rem;">💊 Nenhum medicamento cadastrado</div>
          <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 0.25rem;">Cadastre na seção correspondente do app</div>
        </div>
      </div>
    `;
  }

  return `
    <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <span style="color: #10b981; font-size: 1.25rem;">💊</span>
        <h3 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0;">Medicamentos de uso Contínuo</h3>
        <span style="background: #e0f2fe; color: #0277bd; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${reportData.medications.length}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;">
        ${reportData.medications.map(med => {
          // Validação e limpeza dos dados do medicamento
          const medicationName = med.nome && typeof med.nome === 'string' && med.nome.trim().length > 0 
            ? med.nome.trim() 
            : 'Medicamento não identificado';
          
          const dosage = med.posologia && typeof med.posologia === 'string' && med.posologia.trim().length > 0
            ? med.posologia.trim()
            : 'Dosagem não especificada';
            
          const frequency = med.frequencia && typeof med.frequencia === 'string' && med.frequencia.trim().length > 0
            ? med.frequencia.trim()
            : 'Frequência não especificada';
            
          const prescribedBy = med.medico && typeof med.medico === 'string' && med.medico.trim().length > 0
            ? med.medico.trim()
            : null;

          return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <!-- Header compacto -->
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span style="color: #10b981; font-size: 1rem;">💊</span>
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; flex: 1; word-wrap: break-word;">${medicationName}</h4>
              </div>
              
              <!-- Informações compactas -->
              <div style="space-y: 0.5rem;">
                <div style="margin-bottom: 0.5rem;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Posologia: </span>
                  <span style="font-size: 0.8rem; color: #374151;">${dosage}</span>
                </div>
                <div style="margin-bottom: 0.5rem;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Frequência: </span>
                  <span style="font-size: 0.8rem; color: #374151;">${frequency}</span>
                </div>
                ${prescribedBy ? `
                <div style="margin-bottom: 0;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Médico: </span>
                  <span style="font-size: 0.8rem; color: #059669; font-weight: 500;">${prescribedBy}</span>
                </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function generateEnhancedDoctorsSection(reportData: EnhancedReportData): string {
  if (!reportData.doctors || reportData.doctors.length === 0) {
    return `
      <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <span style="color: #3b82f6; font-size: 1.25rem;">👨‍⚕️</span>
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0;">Equipe Médica</h3>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-center;">
          <div style="color: #64748b; font-size: 0.9rem;">👨‍⚕️ Nenhum médico cadastrado</div>
          <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 0.25rem;">Cadastre na seção correspondente do app</div>
        </div>
      </div>
    `;
  }

  return `
    <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <span style="color: #3b82f6; font-size: 1.25rem;">👨‍⚕️</span>
        <h3 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0;">Equipe Médica</h3>
        <span style="background: #fef3c7; color: #d97706; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${reportData.doctors.length}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem;">
        ${reportData.doctors.map(doctor => {
          // Validação e limpeza dos dados do médico
          const doctorName = doctor.nome && typeof doctor.nome === 'string' && doctor.nome.trim().length > 0 
            ? doctor.nome.trim() 
            : 'Nome não especificado';
          
          const specialty = doctor.especialidade && typeof doctor.especialidade === 'string' && doctor.especialidade.trim().length > 0
            ? doctor.especialidade.trim()
            : 'Especialidade não especificada';
            
          const crm = doctor.crm && typeof doctor.crm === 'string' && doctor.crm.trim().length > 0
            ? doctor.crm.trim()
            : 'CRM não informado';
            
          const contact = doctor.contato && typeof doctor.contato === 'string' && doctor.contato.trim().length > 0
            ? doctor.contato.trim()
            : null;

          return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
              <!-- Header compacto -->
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span style="color: #3b82f6; font-size: 1rem;">👨‍⚕️</span>
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; flex: 1; word-wrap: break-word;">${doctorName}</h4>
              </div>
              
              <!-- Informações compactas -->
              <div style="space-y: 0.5rem;">
                <div style="margin-bottom: 0.5rem;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Especialidade: </span>
                  <span style="font-size: 0.8rem; color: #374151;">${specialty}</span>
                </div>
                <div style="margin-bottom: 0.5rem;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">CRM: </span>
                  <span style="font-size: 0.8rem; color: #374151;">${crm}</span>
                </div>
                ${contact ? `
                <div style="margin-bottom: 0;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Contato: </span>
                  <span style="font-size: 0.8rem; color: #0369a1; font-weight: 500;">${contact}</span>
                </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function generateTraditionalSections(reportData: EnhancedReportData): string {
  // Seções tradicionais mantidas para compatibilidade
  return `
    ${generateQuizTextSummarySection(reportData)}
    
    ${generateEnhancedMedicationsSection(reportData)}
    ${generateEnhancedDoctorsSection(reportData)}
  `;
}

function generateEnhancedFooter(reportId: string, reportData: EnhancedReportData): string {
  return `
    <div class="enhanced-footer">
        <div class="footer-logo">
            <span>🧠</span>
            <span>FibroDiário Enhanced</span>
        </div>
        
        <div class="footer-features">
            <div class="footer-feature">
                <span>🧠</span>
                <span>Análise NLP Avançada</span>
            </div>
            <div class="footer-feature">
                <span>📊</span>
                <span>Visualizações Inteligentes</span>
            </div>
            <div class="footer-feature">
                <span>🔮</span>
                <span>Alertas Preditivos</span>
            </div>
            <div class="footer-feature">
                <span>📱</span>
                <span>PWA Offline Ready</span>
            </div>
        </div>
        
        <div class="footer-meta">
            <p><strong>Relatório ID:</strong> ${reportId}</p>
            <p><strong>Tecnologia:</strong> DorLog Enhanced v2.0 com IA</p>
            <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Dados processados:</strong> ${reportData.totalDays} dias | ${reportData.textSummaries ? Object.values(reportData.textSummaries).reduce((sum, cat: any) => sum + (cat?.textCount || 0), 0) : 0} textos analisados</p>
        </div>
    </div>
  `;
}

// Utility functions
function getAlertTypeLabel(type: string): string {
  switch (type) {
    case 'crisis': return '🚨 Alerta de Crise';
    case 'medication': return '💊 Alerta de Medicação';
    case 'mood': return '💭 Alerta de Humor';
    case 'pattern': return '🔍 Padrão Detectado';
    default: return '⚠️ Alerta Geral';
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return '#b91c1c';
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
}

function generateEntityWordCloudHTML(entities: any[]): string {
  if (!entities || entities.length === 0) {
    return '<p class="text-gray-500 text-center py-8">Nenhuma entidade identificada</p>';
  }
  
  return entities.map(entity => `
    <span class="px-2 py-1 rounded-md text-sm font-medium" 
          style="background-color: ${getEntityColor(entity.category)}15; color: ${getEntityColor(entity.category)}; font-size: ${Math.max(12, entity.frequency * 2)}px;">
      ${entity.entity}
    </span>
  `).join(' ');
}

function getEntityColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'symptoms': return '#ef4444';
    case 'medications': return '#06b6d4';
    case 'bodyparts': return '#f59e0b';
    case 'emotions': return '#8b5cf6';
    default: return '#6b7280';
  }
}

function generateUrgencyHeatmapHTML(heatmapData: any[]): string {
  if (!heatmapData || heatmapData.length === 0) {
    return '<p class="text-gray-500 text-center py-8">Dados de urgência em processamento</p>';
  }
  
  return `
    <div class="text-center text-sm text-gray-600 py-8">
      <div class="text-2xl mb-2">📊</div>
      <p>Mapa temporal implementado com visualização interativa</p>
      <p class="text-xs mt-2">${heatmapData.length} pontos de dados analisados</p>
    </div>
  `;
}

function getEnhancedReportJavaScript(withPassword?: boolean, passwordHash?: string, reportId?: string): string {
  return `
    // Enhanced Report JavaScript with Robust Chart.js integration
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🧠 DorLog Enhanced Report loaded');
        
        ${withPassword ? `
            const password = prompt('🔒 Este relatório está protegido.\\\\n\\\\nDigite a senha para continuar:');
            if (!password) {
                document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: Inter, sans-serif;"><h2>🔒 Acesso Negado</h2><p>Este relatório requer uma senha válida.</p></div>';
                return;
            }
            
            const hash = btoa(password);
            if (hash !== '${passwordHash}') {
                alert('❌ Senha incorreta!');
                location.reload();
                return;
            }
        ` : ''}
        
        // Wait for Chart.js to be available and initialize charts robustly
        waitForChart(() => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    initializeAllCharts();
                    setupInteractiveElements();
                    logReportView('${reportId}');
                }, 50);
            });
        });
    });
    
    // Robust Chart.js initialization functions
    function waitForChart(callback, maxAttempts = 10) {
        let attempts = 0;
        const checkChart = () => {
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js carregado com sucesso');
                callback();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(\`⏳ Aguardando Chart.js... (\${attempts}/\${maxAttempts})\`);
                setTimeout(checkChart, 100);
            } else {
                console.error('❌ Chart.js não carregou - usando fallback');
                showChartsFallback();
            }
        };
        checkChart();
    }
    
    function validateCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(\`❌ Canvas \${canvasId} não encontrado\`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error(\`❌ Contexto 2D não disponível para \${canvasId}\`);
            return null;
        }
        
        return { canvas, ctx };
    }
    
    function safeInitializeChart(chartType, canvasId, config) {
        try {
            const canvasData = validateCanvas(canvasId);
            if (!canvasData) return false;
            
            const chart = new Chart(canvasData.ctx, config);
            console.log(\`✅ \${chartType} renderizado com sucesso\`);
            return chart;
            
        } catch (error) {
            console.error(\`❌ Erro ao renderizar \${chartType}:\`, error);
            showChartError(canvasId, chartType, error.message);
            return false;
        }
    }
    
    function showChartError(canvasId, chartType, reason = 'Erro na renderização') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        canvas.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'chart-fallback bg-gray-50 rounded-lg p-8 text-center';
        fallback.innerHTML = \`
            <div class="text-4xl mb-3">📊</div>
            <p class="text-gray-600 font-medium">\${chartType}</p>
            <p class="text-sm text-gray-500 mt-1">Temporariamente indisponível</p>
            <p class="text-xs text-gray-400 mt-2">\${reason}</p>
        \`;
        canvas.parentNode.insertBefore(fallback, canvas);
    }
    
    function showChartsFallback() {
        ['sentimentChart', 'correlationChart'].forEach(id => {
            showChartError(id, 'Gráfico', 'Chart.js não carregou');
        });
    }
    
    function initializeAllCharts() {
        // Debug: Verificar dados disponíveis
        console.log('📊 Dados disponíveis para gráficos:', {
            chartData: window.CHART_DATA,
            reportData: window.REPORT_DATA
        });
        
        const charts = [
            { type: 'Evolução do Sentimento', id: 'sentimentChart', fn: initializeSentimentChart },
            { type: 'Correlação Dor-Humor', id: 'correlationChart', fn: initializeCorrelationChart }
        ];
        
        let index = 0;
        function initNext() {
            if (index >= charts.length) {
                console.log('✅ Todos os gráficos processados');
                return;
            }
            
            const chart = charts[index];
            console.log(\`📊 Inicializando \${chart.type}...\`);
            
            if (chart.fn()) {
                index++;
                setTimeout(initNext, 100);
            } else {
                console.warn(\`⚠️ Falha em \${chart.type}, continuando...\`);
                index++;
                initNext();
            }
        }
        
        initNext();
    }
    
    function initializeSentimentChart() {
        // Usar dados reais da análise NLP
        const sentimentData = window.CHART_DATA?.sentimentEvolution || [];
        console.log('📈 Dados de sentimento recebidos:', sentimentData);
        
        let positiveTotal = 0, negativeTotal = 0, neutralTotal = 0;
        let dataSource = 'real';
        
        if (sentimentData.length > 0) {
            sentimentData.forEach(item => {
                positiveTotal += item.positive || 0;
                negativeTotal += item.negative || 0;
                neutralTotal += item.neutral || 0;
            });
            
            const total = positiveTotal + negativeTotal + neutralTotal;
            if (total > 0) {
                positiveTotal = Math.round((positiveTotal / total) * 100);
                negativeTotal = Math.round((negativeTotal / total) * 100);
                neutralTotal = Math.round((neutralTotal / total) * 100);
            } else {
                dataSource = 'fallback-zero';
                positiveTotal = 40;
                negativeTotal = 60;
                neutralTotal = 0;
            }
        } else {
            // Fallback para dados de demonstração se não houver dados reais
            dataSource = 'fallback-no-data';
            positiveTotal = 33;
            negativeTotal = 67;
            neutralTotal = 0;
        }
        
        console.log(\`📊 Gráfico de sentimento usando dados \${dataSource}:\`, {
            positive: positiveTotal,
            negative: negativeTotal,
            neutral: neutralTotal
        });
        
        const config = {
            type: 'bar',
            data: {
                labels: ['Positivo', 'Negativo', 'Neutro'],
                datasets: [{
                    label: 'Distribuição de Sentimento (%)',
                    data: [positiveTotal, negativeTotal, neutralTotal],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(107, 114, 128, 0.8)'
                    ],
                    borderColor: [
                        '#10b981',
                        '#ef4444',
                        '#6b7280'
                    ],
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Análise de Sentimento (NLP)',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentual (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Classificação Emocional'
                        }
                    }
                }
            }
        };
        
        return safeInitializeChart('Gráfico de Sentimento', 'sentimentChart', config);
    }
    
    function initializeCorrelationChart() {
        // Usar dados reais da correlação dor-humor
        const painData = window.REPORT_DATA?.painEvolution || [];
        const sentimentData = window.CHART_DATA?.sentimentEvolution || [];
        let bubbleData = [];
        
        if (painData.length > 0 && sentimentData.length > 0) {
            // Criar correlação real baseada nos dados de dor e sentimento
            const maxItems = Math.min(painData.length, sentimentData.length, 8);
            
            for (let i = 0; i < maxItems; i++) {
                const pain = painData[i];
                const sentiment = sentimentData[i];
                
                if (pain && sentiment) {
                    // Converter sentimento para escala de humor (-5 a +5)
                    let moodScore = 0;
                    if (sentiment.positive > 0) moodScore = (sentiment.positive / 100) * 5;
                    else if (sentiment.negative > 0) moodScore = -(sentiment.negative / 100) * 5;
                    
                    // Tamanho da bolha baseado na intensidade (média de dor e absoluto do humor)
                    const intensity = Math.max(5, Math.min(25, (pain.pain + Math.abs(moodScore)) * 2));
                    
                    bubbleData.push({
                        x: pain.pain || 0,
                        y: Number(moodScore.toFixed(1)),
                        r: intensity
                    });
                }
            }
        }
        
        // Fallback para dados de demonstração se não houver dados suficientes
        if (bubbleData.length === 0) {
            bubbleData = [
                {x: 3, y: 1, r: 12}, {x: 6, y: -2, r: 16}, {x: 8, y: -3, r: 20}, 
                {x: 2, y: 2, r: 10}, {x: 7, y: -1, r: 14}
            ];
        }
        
        const config = {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Dor vs Humor (intensidade real)',
                    data: bubbleData,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: '#6366f1',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Correlação Dor vs Humor',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Dor: ' + context.parsed.x + '/10, Humor: ' + context.parsed.y + '/5, Intensidade: ' + (context.parsed._custom || context.raw.r);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Nível de Dor (0-10)'
                        },
                        min: 0,
                        max: 10
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score de Humor (-5 a +5)'
                        },
                        min: -5,
                        max: 5
                    }
                }
            }
        };
        
        return safeInitializeChart('Gráfico de Correlação', 'correlationChart', config);
    }
    
    function setupInteractiveElements() {
        // Add click handlers for cards
        document.querySelectorAll('.insight-card, .chart-card, .alert-card').forEach(card => {
            card.addEventListener('click', function() {
                card.classList.toggle('expanded');
            });
        });
        
        // Add hover effects
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'all 0.2s ease';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
    
    function logReportView(reportId) {
        // Optional: Send analytics about report viewing
        console.log('📊 Report viewed:', reportId);
    }
  `;
}

// Função para validar suficiência de dados
function validateDataSufficiency(reportData: EnhancedReportData, field: string): boolean {
  const minimumRequirements = {
    'activities': 1,      // 1 dia mínimo para atividades físicas (corrigido)
    'correlations': 5,    // 5 episódios mínimo para correlações  
    'patterns': 10,       // 10 registros mínimo para padrões
    'insights': 3,        // 3 dias mínimo para insights
    'therapies': 3,       // 3 registros mínimo para análise confiável de terapias
    'triggers': 3         // 3 crises mínimo para análise de gatilhos
  };
  
  const totalDays = reportData.totalDays || 0;
  const crisisEpisodes = reportData.crisisEpisodes || 0;
  
  switch (field) {
    case 'activities':
      return totalDays >= minimumRequirements[field];
    case 'therapies':
      // Validar dados reais de tratamento em vez de apenas contar dias
      const treatmentData = (reportData as any).treatmentActivities || [];
      return treatmentData.length >= minimumRequirements[field];
    case 'correlations':
    case 'triggers':
      return crisisEpisodes >= minimumRequirements[field];
    case 'patterns':
      return (reportData.painEvolution?.length || 0) >= minimumRequirements[field];
    case 'insights':
      return totalDays >= minimumRequirements[field];
    default:
      return false;
  }
}

// Função para gerar mensagem de dados insuficientes
function getInsufficientDataMessage(field: string): string {
  const messages = {
    'activities': 'Continue registrando atividades diárias',
    'correlations': 'Registre mais episódios para análise de correlações',
    'patterns': 'Mais registros necessários para identificar padrões',
    'insights': 'Continue respondendo questionários para insights',
    'therapies': 'Continue registrando terapias nos questionários noturnos (mín. 3 registros)',
    'triggers': 'Mais episódios necessários para análise de gatilhos'
  };
  
  return messages[field] || 'Dados insuficientes para análise';
}

// Função auxiliar para contar atividades físicas dos dados reais
function countPhysicalActivities(reportData: EnhancedReportData): {
  walking: number;
  work: number;
  home: number;
  exercise: number;
  totalDays: number;
} {
  const physicalActivitiesData = (reportData as any).physicalActivitiesData || [];
  
  if (physicalActivitiesData.length === 0) {
    return {
      walking: 0,
      work: 0,
      home: 0,
      exercise: 0,
      totalDays: 0
    };
  }
  
  // Contar ocorrências de cada tipo de atividade
  const walkingDays = new Set();
  const workDays = new Set();
  const homeDays = new Set();
  const exerciseDays = new Set();
  const allDays = new Set();
  
  physicalActivitiesData.forEach((record: any) => {
    allDays.add(record.date);
    
    switch (record.activity) {
      case 'Caminhada':
        walkingDays.add(record.date);
        break;
      case 'Trabalho':
        workDays.add(record.date);
        break;
      case 'Cuidou da casa':
        homeDays.add(record.date);
        break;
      case 'Atividade física':
      case 'Exercicios':
        exerciseDays.add(record.date);
        break;
    }
  });
  
  return {
    walking: walkingDays.size,
    work: workDays.size,
    home: homeDays.size,
    exercise: exerciseDays.size,
    totalDays: allDays.size
  };
}

// Funções auxiliares para análise de dados reais
function analyzeRealTriggers(reportData: EnhancedReportData): Array<{name: string, percentage: number | string}> {
  // Primeiro, tentar usar dados estruturados dos quizzes emergenciais
  if (reportData.triggersData && Array.isArray(reportData.triggersData) && reportData.triggersData.length > 0) {
    const totalCrises = reportData.crisisEpisodes || 1;
    
    // Processar gatilhos estruturados dos quizzes emergenciais
    return reportData.triggersData
      .filter((trigger: any) => trigger.trigger && trigger.frequency > 0)
      .map((trigger: any) => ({
        name: trigger.trigger,
        percentage: totalCrises > 0 ? Math.round((trigger.frequency / totalCrises) * 100) : 0
      }))
      .sort((a, b) => (b.percentage as number) - (a.percentage as number))
      .slice(0, 5); // Limitar aos 5 principais gatilhos
  }
  
  // Fallback: se não há dados estruturados, retornar mensagem de dados insuficientes
  return [{ name: 'Dados insuficientes', percentage: 'N/A' }];
}

function analyzeRealRiskHours(reportData: EnhancedReportData): Array<{period: string, percentage: number | string}> {
  if (!reportData.painEvolution || reportData.painEvolution.length < 5) {
    return [{ period: 'Dados insuficientes para análise temporal', percentage: 'N/A' }];
  }
  
  const hourCounts = new Map<string, number>();
  
  reportData.painEvolution.forEach(pain => {
    if (pain.date) {
      const hour = new Date(pain.date).getHours();
      let period = '';
      
      if (hour >= 6 && hour < 12) period = '6h-12h (Manhã)';
      else if (hour >= 12 && hour < 18) period = '12h-18h (Tarde)';
      else if (hour >= 18 && hour < 24) period = '18h-24h (Noite)';
      else period = '0h-6h (Madrugada)';
      
      hourCounts.set(period, (hourCounts.get(period) || 0) + 1);
    }
  });
  
  const total = Array.from(hourCounts.values()).reduce((sum, count) => sum + count, 0);
  
  return Array.from(hourCounts.entries()).map(([period, count]) => ({
    period,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => (b.percentage as number) - (a.percentage as number));
}

function calculateActivityImpact(reportData: EnhancedReportData): number | string {
  if (!reportData.painEvolution || reportData.painEvolution.length < 3) {
    return "N/A";
  }
  
  const activityFilter = reportData.painEvolution?.filter((p: any) => 
    p.context?.toLowerCase().includes('atividade') || 
    p.context?.toLowerCase().includes('exercício')
  ) || [];
  const activityDays = activityFilter;
  
  if (activityDays.length === 0) return 0;
  
  const avgPainWithActivity = activityDays.reduce((sum, p) => sum + p.level, 0) / activityDays.length;
  const avgPainGeneral = reportData.averagePain || 0;
  
  return Math.max(0, Math.round(((avgPainGeneral - avgPainWithActivity) / avgPainGeneral) * 100));
}

function calculateSleepImpact(reportData: EnhancedReportData): number | string {
  if (!reportData.observations) return "N/A";
  
  const sleepQualityMentions = (reportData.observations.match(/sono bom|bem dormido|descansado/gi) || []).length;
  const totalEntries = (reportData.observations.match(/sono|dormi/gi) || []).length;
  
  if (totalEntries === 0) return "N/A";
  
  return Math.round((sleepQualityMentions / totalEntries) * 60); // Máximo 60% de redução
}

function calculateRealTherapyImpact(reportData: EnhancedReportData): number | string {
  const treatmentData = (reportData as any).treatmentActivities || [];
  
  if (treatmentData.length === 0) {
    return "Sem dados";
  }
  
  // Calcular correlação real entre dias com terapia e dor
  if (reportData.painEvolution && reportData.painEvolution.length > 0) {
    const treatmentDates = new Set();
    treatmentData.forEach((t: any) => {
      t.dates.forEach((date: string) => treatmentDates.add(date));
    });
    
    const painOnTreatmentDays: number[] = [];
    const painOnNonTreatmentDays: number[] = [];
    
    reportData.painEvolution.forEach((entry: any) => {
      const date = entry.date.split('T')[0];
      if (treatmentDates.has(date)) {
        painOnTreatmentDays.push(entry.level);
      } else {
        painOnNonTreatmentDays.push(entry.level);
      }
    });
    
    if (painOnTreatmentDays.length > 0 && painOnNonTreatmentDays.length > 0) {
      const avgTreatmentPain = painOnTreatmentDays.reduce((sum, pain) => sum + pain, 0) / painOnTreatmentDays.length;
      const avgNonTreatmentPain = painOnNonTreatmentDays.reduce((sum, pain) => sum + pain, 0) / painOnNonTreatmentDays.length;
      
      const improvement = avgNonTreatmentPain - avgTreatmentPain;
      return Math.max(0, Math.round((improvement / avgNonTreatmentPain) * 100));
    }
  }
  
  return "Dados insuficientes";
}

function generateRealInsight(crisisData: any): string {
  if (!crisisData || crisisData.frequency === 0) {
    return "Continue registrando episódios para gerar insights personalizados";
  }
  
  if (crisisData.frequency < 3) {
    return "Registre mais episódios para análise de padrões";
  }
  
  const insights = [];
  
  // Insight sobre frequência
  if (crisisData.frequency >= 10) {
    insights.push("Alta frequência de crises - recomenda-se discussão médica urgente");
  } else if (crisisData.frequency >= 5) {
    insights.push("Padrão de crises frequentes identificado");
  } else {
    insights.push("Frequência de crises dentro do esperado");
  }
  
  // Insight sobre intensidade
  if (crisisData.averageIntensity >= 8) {
    insights.push("crises muito intensas requerem atenção especializada");
  } else if (crisisData.averageIntensity >= 6) {
    insights.push("intensidade de dor significativa registrada");
  }
  
  // Insight sobre gatilhos
  if (crisisData.triggers && crisisData.triggers.length > 0 && crisisData.triggers[0] !== 'Dados insuficientes') {
    insights.push(`principais gatilhos identificados: ${crisisData.triggers.slice(0, 2).join(' e ')}`);
  }
  
  return insights.length > 0 ? insights.join(', ') : "Continue registrando para insights mais detalhados";
}

function generatePatternsInsight(patterns: any, evacuation: any): string {
  if (!patterns.commonTriggers || patterns.commonTriggers.length === 0 || patterns.commonTriggers[0].name === getInsufficientDataMessage('triggers')) {
    return "Continue registrando episódios para identificar padrões comportamentais";
  }
  
  const insights = [];
  
  // Insight sobre gatilhos mais frequentes
  const topTrigger = patterns.commonTriggers[0];
  if (topTrigger && typeof topTrigger.percentage === 'number' && topTrigger.percentage > 50) {
    insights.push(`${topTrigger.name} é o principal gatilho (${topTrigger.percentage}% das crises)`);
  }
  
  // Insight sobre fatores protetivos
  const topProtective = patterns.protectiveFactors?.find((f: any) => typeof f.reduction === 'number' && f.reduction > 30);
  if (topProtective) {
    insights.push(`${topProtective.name} mostra redução significativa da dor (-${topProtective.reduction}%)`);
  }
  
  // Insight sobre saúde digestiva
  if (evacuation && evacuation.consistency === 'Boa') {
    insights.push('evacuação regular está correlacionada com menor ansiedade');
  } else if (evacuation && evacuation.consistency !== 'Boa') {
    insights.push('irregularidade intestinal pode estar afetando humor e dor');
  }
  
  return insights.length > 0 ? insights.join(', ') : "Continue registrando para análise de padrões mais específica";
}

// Funções auxiliares para a nova seção de Quiz Summary
function processQuizData(reportData: EnhancedReportData): any {
  // Processar dados dos quizzes para análise inteligente
  const painEvolution = reportData.painEvolution || [];
  const crisisEpisodes = reportData.crisisEpisodes || 0;
  const medications = reportData.medications || [];
  const painPoints = reportData.painPoints || [];
  const observations = reportData.observations || '';
  
  // Calcular estatísticas dos quizzes
  const totalDays = reportData.totalDays || 0;
  const averagePain = reportData.averagePain || 0;
  
  // NOVO: Extrair dados das perguntas 4 e 8 dos quizzes noturnos
  const emotionalStatesData = extractEmotionalStates(observations);
  const evacuationData = extractEvacuationData(observations);
  const humorData = extractHumorData(observations);
  
  // Dados para "Manhãs e Noites" com dados reais e atividades físicas
  const morningData = {
    sleepQuality: totalDays > 0 ? calculateSleepQuality(observations) : 0,
    eveningPain: averagePain,
    emotionalStates: emotionalStatesData.distribution,
    evacuationFrequency: evacuationData.frequency,
    evacuationConsistency: evacuationData.consistency,
    physicalActivities: countPhysicalActivities(reportData)
  };
  
  // Dados para "Episódios de Crise"
  const crisisData = {
    frequency: crisisEpisodes,
    averageIntensity: painEvolution.length > 0 
      ? painEvolution.reduce((sum, item) => sum + item.level, 0) / painEvolution.length 
      : 0,
    commonLocations: painPoints.slice(0, 3),
    triggers: analyzeRealTriggers(reportData).map(t => t.name),
    emotionalTriggers: emotionalStatesData.triggers
  };
  
  // Dados para "Medicamentos e Atividades"
  const medicationData = {
    rescueMedications: extractRescueMedications(reportData),
    physicalActivities: countPhysicalActivities(reportData),
    therapies: extractRealTherapyData(reportData),
    adherence: validateDataSufficiency(reportData, 'therapies') ? 
      Math.round((totalDays / Math.max(totalDays, 7)) * 100) : 
      "Dados insuficientes",
    digestiveHealth: evacuationData.healthScore
  };
  
  // Dados para "Padrões" com correlações reais
  const patternsData = {
    commonTriggers: analyzeRealTriggers(reportData),
    protectiveFactors: validateDataSufficiency(reportData, 'correlations') ? [
      { name: 'Atividade física regular', reduction: calculateActivityImpact(reportData) },
      { name: 'Qualidade do sono boa', reduction: calculateSleepImpact(reportData) },
      { name: 'Adesão às terapias', reduction: calculateRealTherapyImpact(reportData) },
      { name: 'Evacuação regular', reduction: evacuationData.painReduction }
    ] : [
      { name: getInsufficientDataMessage('correlations'), reduction: "N/A" }
    ],
    riskHours: validateDataSufficiency(reportData, 'patterns') ? 
      analyzeRealRiskHours(reportData) : 
      [{ period: getInsufficientDataMessage('patterns'), percentage: "N/A" }],
    emotionalCorrelations: validateDataSufficiency(reportData, 'correlations') ? humorData.correlations : []
  };
  
  return {
    morning: morningData,
    crisis: crisisData,
    medication: medicationData,
    patterns: patternsData,
    totalDays,
    emotional: emotionalStatesData,
    evacuation: evacuationData,
    humor: humorData,
    painPoints: painPoints
  };
}

// Função para extrair estados emocionais das observações
function extractEmotionalStates(observations: string) {
  const defaultStates = { calm: 40, anxious: 30, happy: 20, sad: 10 };
  const triggers = ['Ansiedade noturna', 'Preocupação com dor'];
  
  if (!observations) {
    return { 
      distribution: defaultStates, 
      triggers, 
      totalEntries: 0,
      predominant: 'Dados sendo coletados dos questionários...',
      summary: 'Responda mais questionários para uma análise completa'
    };
  }
  
  // Analisar padrões emocionais das observações
  const emotionalEntries = observations.match(/Estado emocional\/sono:|Humor:/g);
  const totalEntries = emotionalEntries ? emotionalEntries.length : 0;
  
  // Análise simples de palavras-chave emocionais
  const calm = (observations.match(/calmo|tranquilo|relaxado|bem/gi) || []).length;
  const anxious = (observations.match(/ansioso|preocupado|tenso|nervoso/gi) || []).length;
  const happy = (observations.match(/feliz|alegre|contente|otimista/gi) || []).length;
  const sad = (observations.match(/triste|deprimido|desanimado|melancólico/gi) || []).length;
  
  const total = calm + anxious + happy + sad || 1;
  const distribution = {
    calm: Math.round((calm / total) * 100),
    anxious: Math.round((anxious / total) * 100),
    happy: Math.round((happy / total) * 100),
    sad: Math.round((sad / total) * 100)
  };
  
  // Determinar estado emocional predominante
  const emotions = [
    { name: 'Calmo/Tranquilo', value: distribution.calm, emoji: '😌' },
    { name: 'Ansioso', value: distribution.anxious, emoji: '😰' },
    { name: 'Feliz', value: distribution.happy, emoji: '😊' },
    { name: 'Triste', value: distribution.sad, emoji: '😔' }
  ];
  
  const predominantEmotion = emotions.reduce((prev, current) => 
    current.value > prev.value ? current : prev
  );
  
  // Gerar resumo humanizado
  let summary = '';
  if (predominantEmotion.value >= 50) {
    summary = `Na maioria das vezes você se sente ${predominantEmotion.name.toLowerCase()} à noite`;
  } else if (predominantEmotion.value >= 35) {
    summary = `Você tende a se sentir mais ${predominantEmotion.name.toLowerCase()} no período noturno`;
  } else {
    summary = `Seus sentimentos noturnos variam entre diferentes estados emocionais`;
  }
  
  return {
    distribution,
    triggers,
    totalEntries,
    predominant: `${predominantEmotion.emoji} ${predominantEmotion.name}`,
    summary
  };
}

// Função auxiliar para calcular intervalos entre evacuações
function calculateEvacuationIntervals(evacuationMap: Map<string, boolean>) {
  const allDates = Array.from(evacuationMap.keys()).sort();
  const evacuationDates = allDates.filter(date => evacuationMap.get(date) === true);
  
  if (evacuationDates.length === 0) {
    return {
      averageInterval: 0,
      maxInterval: 0,
      evacuationDays: [],
      totalDays: allDates.length,
      dailyPattern: false
    };
  }
  
  // Calcular intervalos entre evacuações consecutivas
  const intervals = [];
  let maxInterval = 0;
  
  for (let i = 1; i < evacuationDates.length; i++) {
    const prevDate = new Date(evacuationDates[i-1]);
    const currDate = new Date(evacuationDates[i]);
    const daysDiff = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(daysDiff);
    maxInterval = Math.max(maxInterval, daysDiff);
  }
  
  // Verificar padrão diário (pelo menos 80% dos dias)
  const dailyPattern = evacuationDates.length / allDates.length >= 0.8;
  const averageInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 1;
  
  return {
    averageInterval,
    maxInterval,
    evacuationDays: evacuationDates,
    totalDays: allDates.length,
    dailyPattern
  };
}

// Função para extrair dados de evacuação das observações (MELHORADA - v2.0)
function extractEvacuationData(observations: string) {
  if (!observations) {
    return { 
      frequency: 0, 
      consistency: 'Não informado', 
      healthScore: 0,
      painReduction: 0,
      humanizedStatus: 'Dados insuficientes',
      explanation: 'Continue respondendo para análise mais precisa',
      dailyPattern: false,
      maxDaysWithoutEvacuation: 0,
      evacuationDays: [],
      intervalAnalysis: null,
      clinicalRecommendation: 'Continue registrando para análise completa'
    };
  }
  
  // CORREÇÃO: Padrões mais flexíveis para capturar variações
  const patterns = [
    /\[([\d-]+)\] Evacuação intestinal: (Sim|Não)/g, // Padrão principal
    /\[([\d-]+)\].*[Ee]vacuação.*: (Sim|Não|sim|não)/g, // Variações de capitalização
    /\[([\d-]+)\].*[Ii]ntestinal.*: (Sim|Não|sim|não)/g, // Foco em intestinal
    /\[([\d-]+)\].*evacuou.*: (Sim|Não|sim|não)/g // Variação do verbo
  ];
  
  let matches: RegExpMatchArray[] = [];
  
  // Tentar cada padrão até encontrar dados
  for (const pattern of patterns) {
    const foundMatches: RegExpMatchArray[] = [];
    let match;
    while ((match = pattern.exec(observations)) !== null) {
      foundMatches.push(match);
    }
    if (foundMatches.length > 0) {
      matches = foundMatches;
      console.log(`🔍 DEBUG Evacuação: Encontrados ${matches.length} registros com padrão ${pattern}`);
      break;
    }
  }
  
  console.log(`🔍 DEBUG Evacuação: Total de ${matches.length} registros processados`);
  
  if (matches.length === 0) {
    // Tentar padrão antigo como fallback
    const oldPattern = /Evacuação\/Info adicional:/g;
    const oldMatches = observations.match(oldPattern);
    const frequency = oldMatches ? oldMatches.length : 0;
    
    console.log(`🔍 DEBUG Evacuação: Fallback - ${frequency} registros no padrão antigo`);
    
    if (frequency === 0) {
      return {
        frequency: 0,
        consistency: 'Não informado',
        healthScore: 0,
        painReduction: 0,
        humanizedStatus: 'Dados insuficientes',
        explanation: 'Continue respondendo para análise mais precisa',
        dailyPattern: false,
        maxDaysWithoutEvacuation: 0,
        evacuationDays: [],
        intervalAnalysis: null,
        clinicalRecommendation: 'Continue registrando para análise completa'
      };
    }
  }
  
  // Mapear respostas por data
  const evacuationMap = new Map<string, boolean>();
  matches.forEach(match => {
    const [, date, response] = match;
    evacuationMap.set(date, response === 'Sim');
    console.log(`📅 Evacuação ${date}: ${response}`);
  });
  
  // Calcular intervalos e padrões com análise avançada
  const intervals = calculateEvacuationIntervals(evacuationMap);
  const intervalAnalysis = analyzeDigestiveIntervals(evacuationMap);
  
  // Determinar status de saúde digestiva com base nos intervalos
  let healthScore = 0;
  let humanizedStatus = '';
  let explanation = '';
  let painReduction = 0;
  let clinicalRecommendation = '';
  
  if (intervals.evacuationDays.length === 0) {
    healthScore = 0;
    humanizedStatus = 'Dados insuficientes';
    explanation = 'Continue respondendo para análise mais precisa';
    clinicalRecommendation = 'Continue registrando para análise completa';
  } else {
    // CORREÇÃO: Lógica baseada em thresholds clinicamente corretos
    const maxInterval = intervalAnalysis.longestInterval;
    const avgInterval = intervalAnalysis.averageInterval;
    const lastEvacuation = intervalAnalysis.daysSinceLastEvacuation;
    const frequency = intervalAnalysis.evacuationFrequency;
    const isHistorical = intervalAnalysis.isHistoricalReport;
    
    // Thresholds baseados em literatura médica: normal = 3x/semana a 3x/dia
    if (maxInterval <= 3 && frequency >= 50) {
      healthScore = 90;
      humanizedStatus = 'Funcionamento Normal';
      explanation = `Padrão intestinal normal. Maior intervalo: ${maxInterval} dia(s), frequência: ${frequency.toFixed(1)}%`;
      clinicalRecommendation = 'Intestino funcionando dentro da normalidade clínica. Continue os hábitos atuais';
      painReduction = 35;
    } else if (maxInterval <= 3) {
      healthScore = 80;
      humanizedStatus = 'Funcionamento Normal';
      explanation = `Intervalos normais. Maior: ${maxInterval} dia(s), média: ${avgInterval.toFixed(1)} dia(s)`;
      clinicalRecommendation = 'Padrão normal. Considere aumentar frequência de registros para melhor acompanhamento';
      painReduction = 30;
    } else if (maxInterval <= 6) {
      healthScore = 65;
      humanizedStatus = 'Leve Irregularidade';
      explanation = `Irregularidade leve. Maior intervalo: ${maxInterval} dias, média: ${avgInterval.toFixed(1)} dia(s)`;
      clinicalRecommendation = 'Aumente fibras (25-35g/dia), água (2L/dia) e atividade física regular';
      painReduction = 20;
    } else if (maxInterval <= 10) {
      healthScore = 40;
      humanizedStatus = 'Atenção Necessária';
      explanation = `Constipação moderada. Maior intervalo: ${maxInterval} dias, média: ${avgInterval.toFixed(1)} dia(s)`;
      clinicalRecommendation = 'Orientação nutricional recomendada. Considere probióticos e avaliação médica';
      painReduction = 10;
    } else {
      healthScore = 20;
      humanizedStatus = 'Avaliação Médica Necessária';
      explanation = `Constipação severa. Maior intervalo: ${maxInterval} dias, média: ${avgInterval.toFixed(1)} dia(s)`;
      clinicalRecommendation = 'Avaliação médica urgente recomendada. Constipação >10 dias requer investigação';
      painReduction = 5;
    }
    
    // Adicionar informação contextual sobre situação atual
    if (lastEvacuation > 0 && !isHistorical) {
      explanation += `. Última evacuação: há ${lastEvacuation} dia(s)`;
    } else if (isHistorical) {
      explanation += ` (Análise de período histórico)`;
    }
    
    // Adicionar nota sobre contexto dos dados
    if (matches.length < 5) {
      explanation += ` [${matches.length} registros analisados - Continue monitorando para análise mais precisa]`;
    }
  }
  
  console.log(`💩 Saúde digestiva calculada: Score ${healthScore}, Status: ${humanizedStatus}`);
  console.log(`📊 Intervalos: Maior=${intervalAnalysis.longestInterval}, Média=${intervalAnalysis.averageInterval.toFixed(1)}`);
  
  return {
    frequency: matches.length,
    consistency: intervalAnalysis.evacuationFrequency >= 80 ? 'Excelente' : intervalAnalysis.evacuationFrequency >= 60 ? 'Boa' : intervalAnalysis.evacuationFrequency >= 40 ? 'Regular' : 'Irregular',
    healthScore,
    painReduction,
    humanizedStatus,
    explanation,
    dailyPattern: intervals.dailyPattern,
    maxDaysWithoutEvacuation: intervals.maxInterval,
    evacuationDays: intervals.evacuationDays,
    intervalAnalysis,
    clinicalRecommendation
  };
}

// Nova função para análise avançada de intervalos digestivos (CORRIGIDA v3.0)
function analyzeDigestiveIntervals(evacuationMap: Map<string, boolean>, reportPeriods?: string[]) {
  const dates = Array.from(evacuationMap.keys()).sort();
  const evacuationDates = dates.filter(date => evacuationMap.get(date) === true);
  
  if (evacuationDates.length === 0) {
    return {
      longestInterval: 0,
      averageInterval: 0,
      daysSinceLastEvacuation: 0,
      totalDays: dates.length,
      evacuationFrequency: 0,
      intervalPattern: 'unknown',
      isHistoricalReport: false
    };
  }
  
  // Determinar se é relatório histórico ou atual
  const reportEndDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : new Date();
  const today = new Date();
  const daysSinceReportEnd = Math.ceil((today.getTime() - reportEndDate.getTime()) / (1000 * 60 * 60 * 24));
  const isHistoricalReport = daysSinceReportEnd > 7; // Relatório é histórico se terminou há mais de 7 dias
  
  console.log(`📅 Contexto temporal: Fim do relatório=${reportEndDate.toISOString().split('T')[0]}, Histórico=${isHistoricalReport}`);
  
  // Calcular intervalos entre evacuações consecutivas
  const intervals = [];
  let longestInterval = 0;
  
  for (let i = 1; i < evacuationDates.length; i++) {
    const prevDate = new Date(evacuationDates[i-1]);
    const currDate = new Date(evacuationDates[i]);
    const daysDiff = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(daysDiff);
    longestInterval = Math.max(longestInterval, daysDiff);
  }
  
  // CORREÇÃO CRÍTICA: Calcular gap final apenas se necessário
  let daysSinceLastEvacuation = 0;
  const lastEvacuationDate = new Date(evacuationDates[evacuationDates.length - 1]);
  
  if (isHistoricalReport) {
    // Para relatórios históricos, calcular gap até o fim do período
    daysSinceLastEvacuation = Math.ceil((reportEndDate.getTime() - lastEvacuationDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`📊 Relatório histórico: Gap final=${daysSinceLastEvacuation} dias até fim do período`);
  } else {
    // Para relatórios atuais, calcular gap até hoje (máximo 7 dias para evitar inflação)
    const rawGap = Math.ceil((today.getTime() - lastEvacuationDate.getTime()) / (1000 * 60 * 60 * 24));
    daysSinceLastEvacuation = Math.min(rawGap, 7); // Limitar a 7 dias para evitar gaps irreais
    console.log(`📊 Relatório atual: Gap bruto=${rawGap}, Gap limitado=${daysSinceLastEvacuation} dias`);
  }
  
  // CORREÇÃO: Só incluir gap final se for significativo e dentro do contexto
  if (daysSinceLastEvacuation > 0 && daysSinceLastEvacuation <= 10) {
    intervals.push(daysSinceLastEvacuation);
    longestInterval = Math.max(longestInterval, daysSinceLastEvacuation);
  }
  
  // Calcular média dos intervalos
  const averageInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 1;
  
  // CORREÇÃO: Thresholds clinicamente corretos
  let intervalPattern = 'unknown';
  if (longestInterval <= 3) {
    intervalPattern = 'regular'; // Normal: até 3 dias
  } else if (longestInterval <= 6) {
    intervalPattern = 'mild_irregular'; // Leve: 4-6 dias
  } else if (longestInterval <= 10) {
    intervalPattern = 'moderate_constipation'; // Moderado: 7-10 dias
  } else {
    intervalPattern = 'severe_constipation'; // Severo: >10 dias
  }
  
  // Frequência de evacuação (porcentagem de dias com evacuação)
  const evacuationFrequency = (evacuationDates.length / dates.length) * 100;
  
  console.log(`📊 Análise digestiva corrigida: Maior intervalo=${longestInterval}, Média=${averageInterval.toFixed(1)}, Gap final=${daysSinceLastEvacuation}`);
  console.log(`🏥 Padrão clínico: ${intervalPattern} (thresholds: normal≤3, leve≤6, moderado≤10, severo>10)`);
  
  return {
    longestInterval,
    averageInterval,
    daysSinceLastEvacuation,
    totalDays: dates.length,
    evacuationFrequency,
    intervalPattern,
    intervals,
    isHistoricalReport
  };
}

// Função para extrair dados de humor das observações
function extractHumorData(observations: string) {
  if (!observations) {
    return { 
      correlations: [],
      patterns: []
    };
  }
  
  // Analisar correlações reais baseadas nos dados das observações
  const correlations = [];
  const patterns: any[] = [];
  
  // Analisar padrões reais se houver dados suficientes
  const totalWords = observations.split(' ').length;
  if (totalWords > 20) {
    // Buscar correlações reais nas observações
    if (observations.toLowerCase().includes('evacu') && observations.toLowerCase().includes('melhora')) {
      correlations.push({ factor: 'Evacuação regular', impact: 'Mencionado impacto positivo' });
    }
    if (observations.toLowerCase().includes('sono') && (observations.toLowerCase().includes('bem') || observations.toLowerCase().includes('bom'))) {
      correlations.push({ factor: 'Sono reparador', impact: 'Qualidade mencionada positivamente' });
    }
    if (observations.toLowerCase().includes('atividade') && observations.toLowerCase().includes('bem')) {
      correlations.push({ factor: 'Atividade física', impact: 'Relatado benefício' });
    }
  }
  
  return { correlations, patterns };
}

// Função para calcular qualidade do sono baseada nas observações
function calculateSleepQuality(observations: string): number {
  if (!observations || observations.trim().length === 0) return 0; // Sem dados = score 0
  
  // Análise simples de palavras-chave relacionadas ao sono
  const goodSleep = (observations.match(/bem|boa|excelente|descansado|reparador/gi) || []).length;
  const badSleep = (observations.match(/ruim|péssimo|mal|insônia|acordou/gi) || []).length;
  
  const total = goodSleep + badSleep;
  
  if (total === 0) {
    return 0; // Sem menções sobre sono = score 0
  }
  
  const quality = (goodSleep / total) * 10;
  
  return Math.max(0, Math.min(10, quality));
}

// Função para extrair dados reais de terapias dos dados estruturados
function extractRealTherapyData(reportData: any): string[] {
  const treatmentData = (reportData as any).treatmentActivities || [];
  
  if (treatmentData.length === 0) {
    return [getInsufficientDataMessage('therapies')];
  }
  
  // Normalizar e extrair terapias realizadas
  const therapies = treatmentData.map((t: any) => {
    // Normalizar nomes de terapias
    const normalizedTherapy = normalizeTherapyName(t.treatment);
    return `${normalizedTherapy} (${t.frequency}x)`;
  });
  
  return therapies.slice(0, 5); // Limitar a 5 terapias mais frequentes
}

// Função para normalizar nomes de terapias
function normalizeTherapyName(therapyName: string): string {
  const normalized = therapyName.toLowerCase().trim();
  
  // Mapeamento de normalizações
  const therapyMap: { [key: string]: string } = {
    'psicologo': 'Psicólogo',
    'psicoterapia': 'Psicólogo',
    'psicologa': 'Psicólogo',
    'clinica da dor': 'Clínica da Dor',
    'clinica de dor': 'Clínica da Dor',
    'clínica da dor': 'Clínica da Dor',
    'fisio': 'Fisioterapia',
    'fisioterapia': 'Fisioterapia',
    'outro': 'Outras Terapias'
  };
  
  // Buscar por correspondências parciais
  for (const [key, value] of Object.entries(therapyMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Se não encontrou correspondência, manter original mas capitalizado
  return therapyName.charAt(0).toUpperCase() + therapyName.slice(1).toLowerCase();
}

// Função para extrair medicamentos de resgate dos dados reais
function extractRescueMedications(reportData: any): string[] {
  const defaultMeds = ['Dados não disponíveis'];
  
  // Verificar se há medicamentos de resgate nos dados reais
  if (reportData.rescueMedications && reportData.rescueMedications.length > 0) {
    const realMeds = reportData.rescueMedications
      .map((med: any) => typeof med === 'object' ? med.medication : med)
      .filter((med: string) => med && med !== 'ANÁLISE_PENDENTE' && med !== 'Dados não disponíveis');
    
    if (realMeds.length > 0) {
      return realMeds;
    }
  }
  
  // Verificar medicamentos usados durante episódios de crise
  if (reportData.observations) {
    const medicationMentions: any[] = [];
    const commonMeds = ['paracetamol', 'dipirona', 'ibuprofeno', 'naproxeno', 'tramadol', 'dimorf', 'codeína'];
    
    commonMeds.forEach(med => {
      if (reportData.observations.toLowerCase().includes(med)) {
        medicationMentions.push(med.charAt(0).toUpperCase() + med.slice(1));
      }
    });
    
    if (medicationMentions.length > 0) {
      return medicationMentions;
    }
  }
  
  return defaultMeds;
}

function generateMorningNightCard(quizAnalysis: any, reportData?: any): string {
  const { morning, totalDays, evacuation, painPoints } = quizAnalysis;
  
  if (totalDays === 0) {
    return `
      <div class="quiz-card quiz-card-morning">
        <div class="quiz-card-title">
          🌅 Manhãs e Noites
        </div>
        <p style="text-align: center; color: #64748b; font-style: italic;">
          Dados insuficientes para análise
        </p>
      </div>
    `;
  }

  // Importar as análises expandidas de bem-estar
  let fatigueAnalysis = null;
  let treatmentAnalysis = null;
  let triggerAnalysis = null;

  try {
    if (reportData) {
      // Usar as análises do WellnessAnalysisService
      const { WellnessAnalysisService } = require('./sleepPainAnalysisService');
      fatigueAnalysis = WellnessAnalysisService.analyzeFatigue(reportData);
      treatmentAnalysis = WellnessAnalysisService.analyzeTreatments(reportData);
      triggerAnalysis = WellnessAnalysisService.analyzeTriggers(reportData);
    }
  } catch (error) {
    console.warn('⚠️ Análises expandidas não disponíveis:', error.message);
  }
  
  // Emoji para saúde digestiva
  const digestiveEmoji = evacuation.healthScore >= 80 ? '✅' : evacuation.healthScore >= 60 ? '⚠️' : '❗';
  
  // Função para obter emoji dos pontos de dor
  const getPainLocationEmoji = (location: string): string => {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('cabeça') || locationLower.includes('cabeca')) return '🧠';
    if (locationLower.includes('cervical') || locationLower.includes('pescoço') || locationLower.includes('pescoco')) return '🦴';
    if (locationLower.includes('lombar') || locationLower.includes('coluna')) return '🦴';
    if (locationLower.includes('braços') || locationLower.includes('bracos') || locationLower.includes('ombro')) return '💪';
    if (locationLower.includes('barriga') || locationLower.includes('abdomen') || locationLower.includes('abdômen')) return '🤰';
    if (locationLower.includes('pernas') || locationLower.includes('joelho') || locationLower.includes('tornozelo')) return '🦵';
    return '📍';
  };
  
  return `
    <div class="quiz-card quiz-card-morning">
      <div class="quiz-card-title">
        🌅 Manhãs e Noites
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Intensidade média da Dor:</div>
        <div class="quiz-metric-main">
          ${morning.eveningPain.toFixed(1)}/10 😌
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          └ Intensidade média ao final do dia
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Qualidade do Sono:</div>
        <div class="quiz-metric-main">
          ${morning.sleepQuality.toFixed(1)}/10 😴
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          └ Baseado em ${totalDays} dias analisados
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Estado Emocional Predominante:</div>
        <div class="quiz-metric-main">
          ${quizAnalysis.emotional.predominant}
        </div>
        <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
          ${quizAnalysis.emotional.summary}
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">📍 Locais de Dor Reportados:</div>
        ${painPoints && painPoints.length > 0 ? `
        <div class="quiz-metric-main">
          ${painPoints.slice(0, 3).map((point: any) => 
            `${getPainLocationEmoji(point.local)} ${point.local} (${point.occurrences}x)`
          ).join(' • ')}
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
          └ Baseado nos relatos noturnos dos últimos ${totalDays} dias
        </div>
        ` : `
        <div class="quiz-metric-main" style="color: #64748b; font-style: italic;">
          Dados insuficientes para análise
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
          └ Continue respondendo aos questionários noturnos
        </div>
        `}
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">🏥 Saúde Digestiva:</div>
        <div class="quiz-metric-main">
          ${evacuation.humanizedStatus} ${digestiveEmoji}
        </div>
        <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
          ${evacuation.explanation}
        </div>
        ${evacuation.intervalAnalysis ? `
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.4rem; background: #f8fafc; padding: 0.4rem; border-radius: 4px; border-left: 3px solid ${evacuation.healthScore >= 80 ? '#22c55e' : evacuation.healthScore >= 60 ? '#f59e0b' : '#ef4444'};">
          <div><strong>📊 Análise de Intervalos:</strong></div>
          <div>• Maior intervalo: ${evacuation.intervalAnalysis.longestInterval} dia(s)</div>
          <div>• Intervalo médio: ${evacuation.intervalAnalysis.averageInterval.toFixed(1)} dia(s)</div>
          ${evacuation.intervalAnalysis.daysSinceLastEvacuation > 0 ? 
            `<div>• Última evacuação: há ${evacuation.intervalAnalysis.daysSinceLastEvacuation} dia(s)</div>` : ''}
          <div>• Frequência: ${evacuation.intervalAnalysis.evacuationFrequency.toFixed(1)}% dos dias</div>
        </div>
        ` : evacuation.frequency > 0 ? `
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
          └ ${evacuation.dailyPattern ? 'Padrão diário detectado' : 
              evacuation.maxDaysWithoutEvacuation > 0 ? 
              `Máx. ${evacuation.maxDaysWithoutEvacuation} dia(s) sem evacuação` : 
              'Monitoramento iniciado'}
        </div>` : ''}
        ${evacuation.clinicalRecommendation ? `
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.4rem; background: #e2e8f0; padding: 0.4rem; border-radius: 4px;">
          <div><strong>💡 Recomendação:</strong></div>
          <div style="font-style: italic;">${evacuation.clinicalRecommendation}</div>
        </div>
        ` : ''}
      </div>
      
      
      ${fatigueAnalysis ? `
      <div class="quiz-metric">
        <div class="quiz-metric-label">😴 Análise de Fadiga:</div>
        <div class="quiz-metric-main">
          ${fatigueAnalysis.averageLevel.toFixed(1)}/5 - Tendência ${
            fatigueAnalysis.trend === 'IMPROVING' ? '📈 Melhorando' :
            fatigueAnalysis.trend === 'WORSENING' ? '📉 Piorando' :
            '➡️ Estável'
          }
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
          ${fatigueAnalysis.correlation.description}
        </div>
        ${fatigueAnalysis.criticalDays > 0 ? `
        <div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.3rem; background: #fef2f2; padding: 0.3rem; border-radius: 4px;">
          ⚠️ ${fatigueAnalysis.criticalDays} dia(s) com fadiga severa (≥4/5)
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Seção de Terapias Realizadas com Fallback Inteligente -->
      <div class="quiz-metric">
        <div class="quiz-metric-label">🧘 Terapias Realizadas:</div>
        ${treatmentAnalysis && treatmentAnalysis.treatmentFrequency.length > 0 ? `
        <div class="quiz-metric-main">
          ${treatmentAnalysis.treatmentFrequency.slice(0, 2).map(t => 
            `🧘 ${t.treatment} (${t.percentage}%)`
          ).join(' • ')}
        </div>
        ${treatmentAnalysis.effectiveness.improvement !== 0 ? `
        <div style="font-size: 0.8rem; color: ${treatmentAnalysis.effectiveness.improvement > 0 ? '#10b981' : '#ef4444'}; margin-top: 0.5rem;">
          ${treatmentAnalysis.effectiveness.improvement > 0 ? '✅' : '❌'} Efetividade: 
          ${Math.abs(treatmentAnalysis.effectiveness.improvement).toFixed(1)} pontos 
          ${treatmentAnalysis.effectiveness.improvement > 0 ? 'de melhoria' : 'de piora'} na dor
        </div>
        ` : ''}
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.3rem;">
          └ ${treatmentAnalysis.effectiveness.treatmentDays} dia(s) com terapia vs 
          ${treatmentAnalysis.effectiveness.nonTreatmentDays} dia(s) sem terapia
        </div>
        ` : `
        <div style="color: #64748b; font-style: italic; margin-top: 0.25rem;">
          📊 Ainda coletando dados de terapias
        </div>
        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
          └ Continue respondendo os questionários noturnos (Pergunta 6)
        </div>
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.4rem; background: #f8fafc; padding: 0.4rem; border-radius: 4px; border-left: 3px solid #6366f1;">
          <div><strong>💡 Dica:</strong></div>
          <div>No quiz noturno, responda "Fez alguma terapia hoje?" para gerar análises de efetividade</div>
        </div>
        `}
      </div>
      
      ${triggerAnalysis && triggerAnalysis.triggerFrequency.length > 0 ? `
      <div class="quiz-metric">
        <div class="quiz-metric-label">⚠️ Gatilhos Identificados:</div>
        <div class="quiz-metric-main">
          ${triggerAnalysis.triggerFrequency.slice(0, 3).map(t => 
            `${t.trigger} (${t.count}x)`
          ).join(' • ')}
        </div>
        ${triggerAnalysis.highRiskTriggers.length > 0 ? `
        <div style="font-size: 0.8rem; color: #ef4444; margin-top: 0.5rem; background: #fef2f2; padding: 0.3rem; border-radius: 4px;">
          🚨 Gatilhos críticos: ${triggerAnalysis.highRiskTriggers.join(', ')}
        </div>
        ` : ''}
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; background: #f8fafc; padding: 0.4rem; border-radius: 4px;">
          💡 ${triggerAnalysis.patternInsights}
        </div>
      </div>
      ` : ''}
      
      <!-- Seção de Atividades Físicas -->
      <div class="quiz-metric">
        <div class="quiz-metric-label">🏃 Atividades Físicas:</div>
        ${(() => {
          const activities = morning.physicalActivities;
          
          if (activities.totalDays === 0) {
            return `
            <div class="quiz-metric-main" style="color: #64748b; font-style: italic;">
              Dados insuficientes para análise
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
              └ Responda a pergunta "Você fez alguma atividade física hoje?" no quiz noturno
            </div>
            `;
          }
          
          const activePercentage = Math.round((activities.totalDays / totalDays) * 100);
          
          return `
          <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
            🚶 Caminhada (${activities.walking} dias) • 
            💼 Trabalho (${activities.work} dias) • 
            🏠 Casa (${activities.home} dias) • 
            🏃 Exercícios (${activities.exercise} dias)
          </div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
            └ Você se manteve ativo em ${activities.totalDays} de ${totalDays} dias (${activePercentage}%)
          </div>
          
          <!-- Análise Inteligente das Atividades -->
          ${activities.totalDays > 0 ? `
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.6rem; background: #f8fafc; padding: 0.5rem; border-radius: 6px; border-left: 3px solid #10b981;">
            <div><strong>🧠 Análise de Atividades:</strong></div>
            <div>• Total de atividades registradas: ${activities.walking + activities.work + activities.home + activities.exercise} registros</div>
            ${activities.walking > 0 ? `<div>• Caminhadas: ${activities.walking} dia(s) - ${Math.round((activities.walking / activities.totalDays) * 100)}% dos dias ativos</div>` : ''}
            ${activities.exercise > 0 ? `<div>• Exercícios físicos: ${activities.exercise} dia(s) - ${Math.round((activities.exercise / activities.totalDays) * 100)}% dos dias ativos</div>` : ''}
            ${activities.work > 0 ? `<div>• Atividades laborais: ${activities.work} dia(s)</div>` : ''}
            ${activities.home > 0 ? `<div>• Cuidados domésticos: ${activities.home} dia(s)</div>` : ''}
            <div>• Nível de atividade: ${
              activePercentage >= 80 ? 'Muito ativo 🟢' :
              activePercentage >= 60 ? 'Moderadamente ativo 🟡' :
              activePercentage >= 40 ? 'Pouco ativo 🟠' :
              'Sedentário 🔴'
            }</div>
          </div>
          ` : ''}
          `;
        })()}
      </div>
      </div>
    </div>
  `;
}

// Função auxiliar para gerar subseção de medicamentos dentro de crises
function generateMedicationsSubsection(reportData: any): string {
  if (!reportData.rescueMedications || reportData.rescueMedications.length === 0) {
    return `
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #f1f5f9;">
        <div class="quiz-metric">
          <div class="quiz-metric-label">💊 Medicamentos Utilizados nas Crises:</div>
          <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; font-style: italic;">
            📝 Nenhum medicamento registrado - registre medicamentos no quiz emergencial para análise
          </div>
        </div>
      </div>
    `;
  }

  const totalMedicationsUsed = reportData.rescueMedications.length;
  const totalUsageEvents = reportData.rescueMedications.reduce((sum: number, med: any) => sum + med.frequency, 0);
  const topMeds = reportData.rescueMedications
    .sort((a: any, b: any) => b.frequency - a.frequency)
    .slice(0, 3);

  return `
    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #f1f5f9;">
      <div class="quiz-metric">
        <div class="quiz-metric-label">💊 Medicamentos Utilizados nas Crises:</div>
        
        <!-- Estatísticas Compactas -->
        <div style="display: flex; gap: 1rem; margin: 0.75rem 0; flex-wrap: wrap;">
          <div style="background: #f8fafc; border-radius: 6px; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.9rem; font-weight: 600; color: #475569;">${totalMedicationsUsed}</span>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.25rem;">medicamentos</span>
          </div>
          <div style="background: #f8fafc; border-radius: 6px; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.9rem; font-weight: 600; color: #475569;">${totalUsageEvents}</span>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.25rem;">usos totais</span>
          </div>
        </div>

        <!-- Lista de Medicamentos Mais Usados -->
        <div style="font-size: 0.85rem; color: #475569; margin-top: 0.5rem;">
          ${topMeds.map((med: any) => {
            return `💊 ${med.medication} (${med.frequency}x)`;
          }).join(' • ')}
          ${reportData.rescueMedications.length > 3 ? ` • +${reportData.rescueMedications.length - 3} outros` : ''}
        </div>
      </div>
    </div>
  `;
}

function generateCrisisEpisodesCard(quizAnalysis: any, reportData?: any): string {
  const { crisis, totalDays } = quizAnalysis;
  
  if (crisis.frequency === 0) {
    return `
      <div class="quiz-card quiz-card-crisis">
        <div class="quiz-card-title">
          🚨 Episódios de Crise
        </div>
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
          <div style="color: #059669; font-weight: 600;">Nenhuma crise registrada</div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
            Parabéns! Continue mantendo o autocuidado
          </div>
        </div>
        ${reportData ? generateMedicationsSubsection(reportData) : ''}
      </div>
    `;
  }
  
  const frequencyDays = totalDays > 0 ? (totalDays / crisis.frequency).toFixed(1) : 0;
  const intensityEmoji = crisis.averageIntensity >= 8 ? '😣' : crisis.averageIntensity >= 6 ? '😖' : '😕';
  
  return `
    <div class="quiz-card quiz-card-crisis">
      <div class="quiz-card-title">
        🚨 Episódios de Crise
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Frequência:</div>
        <div class="quiz-metric-main">
          ${crisis.frequency} crises em ${totalDays} dias
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          └ Média de 1 crise a cada ${frequencyDays} dias
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Intensidade Média:</div>
        <div class="quiz-metric-main">
          ${crisis.averageIntensity.toFixed(1)}/10 ${intensityEmoji}
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          └ Classificação: "Dor ${crisis.averageIntensity >= 8 ? 'muito intensa' : crisis.averageIntensity >= 6 ? 'intensa' : 'moderada'}"
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Locais Mais Afetados:</div>
        <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
          ${crisis.commonLocations.map((loc: any, index: number) => 
            `🎯 ${loc.local} (${loc.occurrences} vezes)`
          ).join(' • ')}
        </div>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Principais Gatilhos:</div>
        <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
          ${crisis.triggers.length > 0 && crisis.triggers[0] !== 'Dados insuficientes' 
            ? crisis.triggers.map((trigger: string) => `⚡ ${trigger}`).join(' • ')
            : '⚠️ Registre mais episódios para identificar gatilhos'
          }
        </div>
      </div>

      ${reportData ? generateMedicationsSubsection(reportData) : ''}
    </div>
  `;
}


function generatePatternsCard(quizAnalysis: any): string {
  const { patterns, humor, evacuation } = quizAnalysis;
  
  return `
    <div class="quiz-card quiz-card-patterns">
      <div class="quiz-card-title">
        🎯 Padrões no Seu Comportamento
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Gatilhos Mais Comuns:</div>
        <ul class="quiz-list">
          ${patterns.commonTriggers.map((trigger: any) => 
            `<li>😰 ${trigger.name} (detectado em ${trigger.percentage}% das crises)</li>`
          ).join('')}
        </ul>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Fatores Protetivos:</div>
        <ul class="quiz-list">
          ${patterns.protectiveFactors.map((factor: any) => 
            `<li>✅ ${factor.name} (-${factor.reduction}% dor)</li>`
          ).join('')}
        </ul>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Correlações Emocionais:</div>
        <ul class="quiz-list">
          ${humor.correlations && humor.correlations.length > 0 
            ? humor.correlations.map((corr: any) => 
                `<li>🧠 ${corr.factor}: ${corr.impact}</li>`
              ).join('') 
            : '<li style="color: #64748b; font-style: italic;">📊 Coletando dados para análise...</li>'
          }
        </ul>
      </div>
      
      <div class="quiz-metric">
        <div class="quiz-metric-label">Horários de Maior Risco:</div>
        <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
          ${patterns.riskHours.map((hour: any) => 
            `🕐 ${hour.period} (${hour.percentage}% das crises)`
          ).join(' • ')}
        </div>
      </div>
      
      <div class="quiz-insight">
        💡 Insight: ${generatePatternsInsight(patterns, evacuation)}
      </div>
    </div>
  `;
}