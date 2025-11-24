/**
 * HTML Template Service for Cloud Functions
 * 
 * Gera HTML de relatórios server-side (versão simplificada)
 * TODO: Migrar template completo do frontend depois
 */

import type { ReportData } from './firestoreDataService';
import type { NLPAnalysisResult } from './nlpService';

export interface ReportTemplateData {
  reportId: string;
  periodsText: string;
  userName: string;
  userEmail: string;
  generatedAt: Date;
  reportData: ReportData;
  nlpResults?: NLPAnalysisResult[];
  withPassword?: boolean;
  passwordHash?: string;
}

/**
 * Gera HTML simplificado do relatório
 * Versão MVP - será melhorado com template completo depois
 */
export function generateReportHTML(data: ReportTemplateData): string {
  const { reportId, periodsText, userName, generatedAt, reportData, nlpResults } = data;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Médico - ${periodsText}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.95;
        }
        
        .meta-info {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .meta-label {
            font-weight: 600;
            color: #495057;
        }
        
        .meta-value {
            color: #6c757d;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        
        .metric-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
        }
        
        .metric-unit {
            font-size: 16px;
            font-weight: 400;
            color: #6c757d;
            margin-left: 4px;
        }
        
        .list-item {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .list-item-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        
        .list-item-detail {
            font-size: 14px;
            color: #6c757d;
        }
        
        .nlp-insight {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .nlp-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório Médico</h1>
            <p>FibroDiário - Acompanhamento de Fibromialgia</p>
        </div>
        
        <div class="meta-info">
            <div class="meta-row">
                <span class="meta-label">Paciente:</span>
                <span class="meta-value">${userName}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Período:</span>
                <span class="meta-value">${periodsText}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Data de Geração:</span>
                <span class="meta-value">${formatDate(generatedAt)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">ID do Relatório:</span>
                <span class="meta-value">${reportId}</span>
            </div>
        </div>
        
        <div class="content">
            <!-- Métricas Gerais -->
            <div class="section">
                <h2 class="section-title">📈 Visão Geral</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total de Dias</div>
                        <div class="metric-value">${reportData.totalDays}<span class="metric-unit">dias</span></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Episódios de Crise</div>
                        <div class="metric-value">${reportData.crisisEpisodes}<span class="metric-unit">vezes</span></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Dor Média</div>
                        <div class="metric-value">${reportData.averagePain.toFixed(1)}<span class="metric-unit">/10</span></div>
                    </div>
                </div>
            </div>
            
            <!-- Medicamentos -->
            <div class="section">
                <h2 class="section-title">💊 Medicamentos</h2>
                ${generateMedicationsList(reportData.medications)}
            </div>
            
            <!-- Médicos -->
            <div class="section">
                <h2 class="section-title">👨‍⚕️ Equipe Médica</h2>
                ${generateDoctorsList(reportData.doctors)}
            </div>
            
            <!-- Análise NLP (se disponível) -->
            ${nlpResults && nlpResults.length > 0 ? `
            <div class="section">
                <h2 class="section-title">🧠 Análise Inteligente (NLP)</h2>
                ${generateNLPInsights(nlpResults)}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo FibroDiário</p>
            <p>Este documento contém informações médicas confidenciais</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Formata data para exibição
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Gera lista de medicamentos
 */
function generateMedicationsList(medications: any[]): string {
  if (medications.length === 0) {
    return '<div class="empty-state">Nenhum medicamento cadastrado</div>';
  }

  return medications.map(med => `
    <div class="list-item">
      <div class="list-item-title">${escapeHtml(med.nome || med.name || 'Medicamento')}</div>
      <div class="list-item-detail">
        Dosagem: ${escapeHtml(med.dosagem || med.dosage || 'Não informada')} | 
        Horário: ${escapeHtml(med.horario || med.schedule || 'Não informado')}
      </div>
    </div>
  `).join('');
}

/**
 * Gera lista de médicos
 */
function generateDoctorsList(doctors: any[]): string {
  if (doctors.length === 0) {
    return '<div class="empty-state">Nenhum médico cadastrado</div>';
  }

  return doctors.map(doc => `
    <div class="list-item">
      <div class="list-item-title">Dr(a). ${escapeHtml(doc.nome || doc.name || 'Médico')}</div>
      <div class="list-item-detail">
        ${escapeHtml(doc.especialidade || doc.specialty || 'Especialidade não informada')}
        ${doc.telefone || doc.phone ? ` | Tel: ${escapeHtml(doc.telefone || doc.phone)}` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Gera insights de NLP
 */
function generateNLPInsights(nlpResults: NLPAnalysisResult[]): string {
  return nlpResults.map(result => `
    <div class="nlp-insight">
      <div>
        <span class="nlp-badge">${result.sentiment.label}</span>
        <span class="nlp-badge">Urgência: ${result.urgencyLevel}/10</span>
        <span class="nlp-badge">Relevância: ${result.clinicalRelevance}/10</span>
      </div>
      ${result.summary ? `<p style="margin-top: 12px;">${escapeHtml(result.summary.summary)}</p>` : ''}
      ${result.entities.length > 0 ? `
        <div style="margin-top: 12px;">
          <strong>Entidades detectadas:</strong>
          ${result.entities.map(e => `<span class="nlp-badge">${escapeHtml(e.entity)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, (m) => map[m]);
}
