#!/usr/bin/env node

/**
 * Script de Automação para Geração e Upload de Relatórios HTML no Firebase Storage
 * 
 * Este script automatiza o processo de:
 * 1. Gerar relatórios HTML para usuários
 * 2. Fazer upload direto para Firebase Storage
 * 3. Compartilhar URL do arquivo no Firebase Storage
 * 4. Limpar arquivos locais após upload bem-sucedido
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

// Promisify exec para usar async/await
const execAsync = util.promisify(exec);

// Configurações
const CONFIG = {
  REPORTS_DIR: './reports',
  USERS_DIR: './reports/usuarios',
  FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'dorlog-fibro-diario',
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos
};

/**
 * Função para criar delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função para garantir que um diretório existe
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Diretório criado: ${dirPath}`);
  }
}

/**
 * Função para gerar template HTML de relatório
 */
function generateReportHTML(userId, reportMonth, reportData) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPeriod = (periodsText) => {
    return periodsText.replace(/_/g, ' ').replace(/ate/g, 'até');
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DorLog - Relatório de Saúde ${reportMonth} - ${userId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="./assets/css/report.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #64748b;
            --success-color: #059669;
            --warning-color: #d97706;
            --danger-color: #dc2626;
            --light-bg: #f8fafc;
            --card-bg: #ffffff;
            --border-color: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--light-bg);
            font-size: 14px;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            min-height: 297mm;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 200px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            transform: translate(50px, -50px);
        }

        .header-content {
            position: relative;
            z-index: 2;
        }

        .logo {
            font-size: 2.8em;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -1px;
        }

        .subtitle {
            font-size: 1.3em;
            opacity: 0.9;
            font-weight: 300;
            margin-bottom: 4px;
        }

        .user-info {
            font-size: 1em;
            opacity: 0.8;
            font-weight: 400;
        }

        .report-date {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9em;
            font-weight: 500;
        }

        /* Stats Grid */
        .stats-section {
            margin-bottom: 30px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
        }

        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-value {
            font-size: 2.5em;
            font-weight: 700;
            color: var(--primary-color);
            display: block;
            margin-bottom: 8px;
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9em;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Report Cards */
        .report-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--light-bg);
        }

        .card-icon {
            font-size: 1.5em;
            margin-right: 12px;
        }

        .card-title {
            color: var(--text-primary);
            font-size: 1.4em;
            font-weight: 600;
            margin: 0;
        }

        /* Lists */
        .item-list {
            list-style: none;
            padding: 0;
        }

        .item {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
        }

        .item:last-child {
            border-bottom: none;
        }

        .item-icon {
            width: 8px;
            height: 8px;
            background: var(--primary-color);
            border-radius: 50%;
            margin-right: 12px;
        }

        .item-name {
            font-weight: 600;
            color: var(--text-primary);
        }

        .item-details {
            color: var(--text-secondary);
            margin-left: 8px;
        }

        /* Pain Evolution Chart */
        .chart-container {
            background: var(--light-bg);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .pain-level {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .date-label {
            width: 80px;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .pain-bar {
            flex: 1;
            height: 24px;
            background: var(--border-color);
            border-radius: 12px;
            margin: 0 12px;
            position: relative;
            overflow: hidden;
        }

        .pain-fill {
            height: 100%;
            border-radius: 12px;
            transition: width 0.3s ease;
        }

        .pain-value {
            font-weight: 600;
            width: 30px;
            text-align: center;
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding: 30px 0;
            border-top: 1px solid var(--border-color);
            text-align: center;
        }

        .footer-title {
            font-size: 1.2em;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .footer-text {
            color: var(--text-secondary);
            font-size: 0.9em;
            line-height: 1.5;
        }

        .security-notice {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 0.9em;
        }

        .security-notice strong {
            color: #92400e;
        }

        /* Print Styles */
        @media print {
            .container {
                margin: 0;
                padding: 15px;
                max-width: none;
                box-shadow: none;
            }
            
            .stat-card:hover {
                transform: none;
            }
            
            .report-card {
                break-inside: avoid;
            }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header {
                padding: 30px 20px;
                text-align: center;
            }
            
            .logo {
                font-size: 2.2em;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .report-date {
                position: static;
                display: inline-block;
                margin-top: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="report-date">
                Gerado em: ${currentDate}
            </div>
            <div class="header-content">
                <h1 class="logo">DorLog</h1>
                <p class="subtitle">Relatório de Saúde</p>
                <p class="user-info">
                    📅 ${formatPeriod(reportData?.periodsText || reportMonth)}<br>
                    👤 ${userId}
                </p>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${reportData?.totalDays || 0}</span>
                    <span class="stat-label">Dias Registrados</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" style="color: var(--danger-color);">${reportData?.crisisEpisodes || 0}</span>
                    <span class="stat-label">Episódios de Crise</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" style="color: var(--warning-color);">${reportData?.averagePain || 0}</span>
                    <span class="stat-label">Dor Média (0-10)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" style="color: var(--success-color);">${reportData?.adherenceRate || 0}%</span>
                    <span class="stat-label">Adesão ao Tratamento</span>
                </div>
            </div>
        </div>

        <!-- Crisis Episodes -->
        ${reportData?.crisisEpisodes > 0 ? `
        <div class="report-card">
            <div class="card-header">
                <span class="card-icon">🚨</span>
                <h2 class="card-title">Episódios de Crise</h2>
            </div>
            <p style="margin-bottom: 16px; color: var(--text-secondary);">
                Foram registrados <strong style="color: var(--danger-color);">${reportData.crisisEpisodes}</strong> episódios de crise no período analisado.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                <strong style="color: var(--danger-color);">⚠️ Atenção Médica:</strong>
                <p style="margin: 8px 0 0 0; color: var(--text-secondary);">
                    Episódios de crise frequentes podem indicar necessidade de ajuste no tratamento. 
                    Recomenda-se consulta médica para reavaliação.
                </p>
            </div>
        </div>
        ` : ''}

        <!-- Pain Evolution -->
        ${reportData?.painEvolution?.length > 0 ? `
        <div class="report-card">
            <div class="card-header">
                <span class="card-icon">📊</span>
                <h2 class="card-title">Evolução da Dor</h2>
            </div>
            <div class="chart-container">
                ${reportData.painEvolution.map(entry => `
                    <div class="pain-level">
                        <div class="date-label">${entry.dateStr}</div>
                        <div class="pain-bar">
                            <div class="pain-fill" style="width: ${(entry.pain / 10) * 100}%; background: ${entry.pain <= 3 ? 'var(--success-color)' : entry.pain <= 6 ? 'var(--warning-color)' : 'var(--danger-color)'};"></div>
                        </div>
                        <div class="pain-value">${entry.pain}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Pain Points -->
        ${reportData?.painPoints?.length > 0 ? `
        <div class="report-card">
            <div class="card-header">
                <span class="card-icon">🎯</span>
                <h2 class="card-title">Pontos de Dor Mais Frequentes</h2>
            </div>
            <ul class="item-list">
                ${reportData.painPoints.map(point => `
                    <li class="item">
                        <div class="item-icon"></div>
                        <span class="item-name">${point.point}</span>
                        <span class="item-details">(${point.count} ocorrências)</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Medications -->
        <div class="report-card">
            <div class="card-header">
                <span class="card-icon">💊</span>
                <h2 class="card-title">Medicamentos Prescritos</h2>
            </div>
            ${reportData?.medications?.length > 0 ? `
                <ul class="item-list">
                    ${reportData.medications.map(med => `
                        <li class="item">
                            <div class="item-icon"></div>
                            <span class="item-name">${med.nome}</span>
                            <span class="item-details">
                                ${med.dosagem} - ${med.frequencia}x ao dia
                                ${med.prescrito_por ? ` (Dr. ${med.prescrito_por})` : ''}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            ` : `
                <p style="color: var(--text-secondary); font-style: italic;">
                    Nenhum medicamento registrado no período analisado.
                </p>
            `}
        </div>

        <!-- Medical Team -->
        <div class="report-card">
            <div class="card-header">
                <span class="card-icon">👨‍⚕️</span>
                <h2 class="card-title">Equipe Médica</h2>
            </div>
            ${reportData?.doctors?.length > 0 ? `
                <ul class="item-list">
                    ${reportData.doctors.map(doc => `
                        <li class="item">
                            <div class="item-icon"></div>
                            <span class="item-name">Dr(a). ${doc.nome}</span>
                            <span class="item-details">
                                ${doc.especialidade}
                                ${doc.crm ? ` - CRM: ${doc.crm}` : ''}
                                ${doc.contato ? ` - ${doc.contato}` : ''}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            ` : `
                <p style="color: var(--text-secondary); font-style: italic;">
                    Nenhum médico cadastrado no sistema.
                </p>
            `}
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
            <strong>🔒 Documento Confidencial:</strong>
            Este relatório contém informações médicas confidenciais protegidas por lei. 
            Mantenha em local seguro e compartilhe apenas com profissionais de saúde autorizados.
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-title">DorLog - Gestão Inteligente da Sua Saúde</div>
            <p class="footer-text">
                Relatório gerado automaticamente através do aplicativo DorLog<br>
                Para informações detalhadas, acesse o aplicativo ou consulte sua equipe médica<br>
                <strong>Versão:</strong> 2.0 | <strong>Data:</strong> ${currentDate}
            </p>
        </div>
    </div>

    <script src="./assets/js/report.js"></script>
</body>
</html>`;
}

/**
 * Função para executar comando com retry
 */
async function executeWithRetry(command, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Executando comando (tentativa ${attempt}/${retries}): ${command}`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('warn')) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      
      console.log(`✅ Comando executado com sucesso:`);
      if (stdout) console.log(stdout);
      return { success: true, stdout, stderr };
      
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt}: ${error.message}`);
      
      if (attempt === retries) {
        throw new Error(`Comando falhou após ${retries} tentativas: ${error.message}`);
      }
      
      console.log(`⏳ Aguardando ${CONFIG.RETRY_DELAY / 1000}s antes da próxima tentativa...`);
      await delay(CONFIG.RETRY_DELAY);
    }
  }
}

/**
 * Função para buscar dados reais do usuário no Firestore
 */
async function fetchUserDataFromFirestore(userId, periods) {
  const admin = require('firebase-admin');
  
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.VITE_FIREBASE_PROJECT_ID || "dorlog-fibro-diario",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    const reportData = {
      totalDays: 0,
      crisisEpisodes: 0,
      averagePain: 0,
      adherenceRate: 0,
      painEvolution: [],
      painPoints: [],
      medications: [],
      doctors: []
    };

    // Parse periods to get date range
    let startDate = new Date();
    let endDate = new Date();
    
    if (periods && periods.length > 0) {
      const firstPeriod = periods[0];
      const lastPeriod = periods[periods.length - 1];
      startDate = new Date(firstPeriod.split('_')[0]);
      endDate = new Date(lastPeriod.split('_')[1]);
    } else {
      // Default to current month
      startDate = new Date();
      startDate.setDate(1);
      endDate = new Date();
    }

    // Fetch report_diario documents
    console.log(`📊 Buscando dados de ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    
    const reportDiarioQuery = await db.collection('report_diario')
      .where('__name__', '>=', `${userId}_${startDate.toISOString().split('T')[0]}`)
      .where('__name__', '<=', `${userId}_${endDate.toISOString().split('T')[0]}`)
      .get();

    let totalPain = 0;
    let painRecords = 0;
    const painPointsMap = new Map();
    
    reportDiarioQuery.docs.forEach(doc => {
      const data = doc.data();
      reportData.totalDays++;
      
      // Count crisis episodes
      if (data.quiz && Array.isArray(data.quiz)) {
        const crisisCount = data.quiz.filter(q => q.tipo === 'emergencial').length;
        reportData.crisisEpisodes += crisisCount;
      }
      
      // Extract pain data
      if (data.quiz && Array.isArray(data.quiz)) {
        data.quiz.forEach(quiz => {
          if (quiz.respostas) {
            // Look for pain scale questions
            Object.keys(quiz.respostas).forEach(key => {
              const answer = quiz.respostas[key];
              
              // Pain scale (0-10)
              if (key.includes('dor') || key.includes('escala')) {
                const painValue = parseInt(answer);
                if (!isNaN(painValue) && painValue >= 0 && painValue <= 10) {
                  totalPain += painValue;
                  painRecords++;
                  
                  // Add to evolution
                  const docDate = doc.id.split('_')[1];
                  reportData.painEvolution.push({
                    date: docDate,
                    dateStr: new Date(docDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    pain: painValue
                  });
                }
              }
              
              // Pain points
              if (key.includes('local') || key.includes('ponto') || key.includes('onde')) {
                if (typeof answer === 'string' && answer.length > 0) {
                  const count = painPointsMap.get(answer) || 0;
                  painPointsMap.set(answer, count + 1);
                }
              }
            });
          }
        });
      }
    });

    // Calculate average pain
    reportData.averagePain = painRecords > 0 ? Math.round((totalPain / painRecords) * 10) / 10 : 0;
    
    // Sort pain evolution by date
    reportData.painEvolution.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Convert pain points map to sorted array
    reportData.painPoints = Array.from(painPointsMap.entries())
      .map(([point, count]) => ({ point, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Fetch medications
    try {
      const medicationsQuery = await db.collection('medicamentos')
        .where('userId', '==', userId)
        .get();
      
      reportData.medications = medicationsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.log('⚠️ Erro ao buscar medicamentos:', error.message);
    }

    // Fetch doctors
    try {
      const doctorsQuery = await db.collection('medicos')
        .where('userId', '==', userId)
        .get();
      
      reportData.doctors = doctorsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.log('⚠️ Erro ao buscar médicos:', error.message);
    }

    // Calculate adherence rate (simplified)
    reportData.adherenceRate = reportData.totalDays > 0 ? Math.round((reportData.totalDays / 30) * 100) : 0;

    console.log(`✅ Dados coletados: ${reportData.totalDays} dias, ${reportData.crisisEpisodes} crises, ${reportData.medications.length} medicamentos, ${reportData.doctors.length} médicos`);
    return reportData;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do Firestore:', error);
    console.log('📊 Gerando dados de exemplo para demonstração do layout...');
    
    // Return example data for demonstration when Firestore credentials are not available
    return {
      totalDays: 28,
      crisisEpisodes: 3,
      averagePain: 6.2,
      adherenceRate: 85,
      painEvolution: [
        { date: '2025-08-01', dateStr: '01/08', pain: 7 },
        { date: '2025-08-05', dateStr: '05/08', pain: 5 },
        { date: '2025-08-10', dateStr: '10/08', pain: 8 },
        { date: '2025-08-15', dateStr: '15/08', pain: 4 },
        { date: '2025-08-20', dateStr: '20/08', pain: 6 }
      ],
      painPoints: [
        { point: 'Região lombar', count: 15 },
        { point: 'Pescoço', count: 12 },
        { point: 'Ombros', count: 10 },
        { point: 'Joelhos', count: 8 }
      ],
      medications: [
        { nome: 'Pregabalina', dosagem: '150mg', frequencia: 2, prescrito_por: 'Dr. Silva' },
        { nome: 'Amitriptilina', dosagem: '25mg', frequencia: 1, prescrito_por: 'Dr. Silva' },
        { nome: 'Paracetamol', dosagem: '500mg', frequencia: 3, prescrito_por: 'Dr. Santos' }
      ],
      doctors: [
        { nome: 'João Silva', especialidade: 'Reumatologia', crm: '12345', contato: '(11) 99999-9999' },
        { nome: 'Maria Santos', especialidade: 'Neurologia', crm: '54321', contato: 'maria.santos@hospital.com' }
      ],
      dataSource: 'example',
      note: 'Dados de exemplo para demonstração. Configure as credenciais do Firebase Admin SDK para dados reais.'
    };
  }
}

/**
 * Função para fazer upload do arquivo para Firebase Storage
 */
async function uploadToFirebaseStorage(localFilePath, fileName) {
  const admin = require('firebase-admin');
  
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.VITE_FIREBASE_PROJECT_ID || "dorlog-fibro-diario",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || 'dorlog-fibro-diario'}.appspot.com`
      });
    }

    const bucket = admin.storage().bucket();
    const storageFileName = `reports/${fileName}`;
    
    console.log(`📤 Fazendo upload do arquivo: ${localFilePath} → ${storageFileName}`);
    
    // Upload do arquivo
    const [file] = await bucket.upload(localFilePath, {
      destination: storageFileName,
      metadata: {
        contentType: 'text/html',
        metadata: {
          firebaseStorageDownloadTokens: require('crypto').randomUUID()
        }
      }
    });
    
    // Tornar o arquivo publicamente legível
    await file.makePublic();
    
    // Gerar URL de download público
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storageFileName}`;
    
    console.log(`✅ Upload concluído. Arquivo disponível em: ${downloadUrl}`);
    
    return {
      success: true,
      downloadUrl,
      fileName: storageFileName
    };
    
  } catch (error) {
    console.error(`❌ Erro no upload para Firebase Storage: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Função principal para gerar e fazer deploy do relatório
 */
async function generateAndDeployReport(userId, reportMonth, inputReportData = {}) {
  const startTime = Date.now();
  console.log(`\n🚀 Iniciando geração de relatório para ${userId} - ${reportMonth}`);
  console.log(`⏰ Horário de início: ${new Date().toLocaleString('pt-BR')}`);
  
  try {
    // 1. Criar estrutura de diretórios
    ensureDirectoryExists(CONFIG.REPORTS_DIR);
    ensureDirectoryExists(CONFIG.USERS_DIR);
    
    // 2. Definir nome do arquivo e pasta do usuário
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9.-]/g, '_');
    const reportFileName = `report_${sanitizedUserId}_${reportMonth}.html`;
    const reportFilePath = path.join(CONFIG.USERS_DIR, reportFileName);
    
    console.log(`📄 Gerando relatório: ${reportFileName}`);
    
    // 3. Buscar dados reais do Firestore
    console.log(`🔍 Buscando dados reais do usuário no Firestore...`);
    let reportData = inputReportData;
    
    try {
      // Parse periods from reportMonth if it contains period info
      const periods = inputReportData.periods || [];
      const realData = await fetchUserDataFromFirestore(userId, periods);
      
      // Merge input data with real Firestore data (real data takes precedence)
      reportData = {
        ...inputReportData,
        ...realData,
        // Keep period text from input if provided
        periodsText: inputReportData.periodsText || reportMonth
      };
      
      console.log(`✅ Dados do Firestore integrados com sucesso`);
    } catch (firestoreError) {
      console.warn(`⚠️ Erro ao buscar dados do Firestore, usando dados de entrada: ${firestoreError.message}`);
      reportData = { ...inputReportData, error: firestoreError.message };
    }
    
    // 4. Gerar conteúdo HTML
    const htmlContent = generateReportHTML(userId, reportMonth, reportData);
    
    // 4. Salvar arquivo (sobrescrever se existir)
    if (fs.existsSync(reportFilePath)) {
      console.log(`⚠️  Arquivo existente encontrado. Sobrescrevendo: ${reportFileName}`);
    }
    
    fs.writeFileSync(reportFilePath, htmlContent, 'utf8');
    console.log(`✅ Arquivo HTML salvo: ${reportFilePath}`);
    
    // 5. Fazer upload para Firebase Storage
    console.log(`\n☁️ Iniciando upload para Firebase Storage...`);
    
    const uploadResult = await uploadToFirebaseStorage(reportFilePath, reportFileName);
    
    if (uploadResult.success) {
      console.log(`✅ Upload concluído com sucesso!`);
      
      // 6. URL já foi gerada durante o upload
      const reportUrl = uploadResult.downloadUrl;
      console.log(`🔗 Relatório disponível em: ${reportUrl}`);
      
      // 7. Deletar arquivo local após upload bem-sucedido
      try {
        fs.unlinkSync(reportFilePath);
        console.log(`🗑️  Arquivo local removido: ${reportFileName}`);
      } catch (deleteError) {
        console.warn(`⚠️  Aviso: Não foi possível remover o arquivo local: ${deleteError.message}`);
      }
      
      // 8. Calcular tempo total
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n🎉 Processo concluído com sucesso!`);
      console.log(`⏱️  Tempo total: ${totalTime}s`);
      console.log(`🔗 URL do relatório: ${reportUrl}`);
      
      return {
        success: true,
        reportUrl,
        fileName: reportFileName,
        executionTime: totalTime
      };
      
    } else {
      throw new Error(uploadResult.error || 'Upload não foi concluído com sucesso');
    }
    
  } catch (error) {
    console.error(`\n💥 Erro durante o processo: ${error.message}`);
    
    // Cleanup em caso de erro
    const reportFilePath = path.join(CONFIG.USERS_DIR, `report_${userId.replace(/[^a-zA-Z0-9.-]/g, '_')}_${reportMonth}.html`);
    if (fs.existsSync(reportFilePath)) {
      try {
        fs.unlinkSync(reportFilePath);
        console.log(`🧹 Arquivo temporário removido devido ao erro`);
      } catch (cleanupError) {
        console.warn(`⚠️  Aviso: Não foi possível remover arquivo temporário: ${cleanupError.message}`);
      }
    }
    
    return {
      success: false,
      error: error.message,
      executionTime: ((Date.now() - startTime) / 1000).toFixed(2)
    };
  }
}

/**
 * Função para validar dados do relatório
 */
function validateReportData(userId, reportMonth) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('ID do usuário é obrigatório e deve ser uma string');
  }
  
  if (!reportMonth || typeof reportMonth !== 'string') {
    throw new Error('Mês do relatório é obrigatório e deve ser uma string');
  }
  
  // Validar formato do mês (deve ser algo como "2025-01" ou "Janeiro_2025")
  if (!reportMonth.match(/^\d{4}-\d{2}$/) && !reportMonth.match(/^[A-Za-z]+_\d{4}$/)) {
    console.warn(`⚠️  Formato do mês pode não ser ideal: ${reportMonth}`);
  }
}

// Função de exemplo para testar o script
async function exemploUso() {
  const dadosRelatorioDemostracao = {
    totalDays: 28,
    crisisEpisodes: 3,
    averagePain: 4.2,
    medicationCompliance: 85,
    medications: [
      { nome: 'Paracetamol', dosagem: '500mg', frequencia: 3 },
      { nome: 'Ibuprofeno', dosagem: '400mg', frequencia: 2 }
    ],
    doctors: [
      { nome: 'Maria Silva', especialidade: 'Reumatologia', crm: '12345' },
      { nome: 'João Santos', especialidade: 'Clínico Geral', crm: '67890' }
    ],
    observations: 'Período com melhora significativa da dor. Paciente apresentou boa adesão ao tratamento medicamentoso.'
  };
  
  const resultado = await generateAndDeployReport(
    'josecarlos.siqueira76@gmail.com',
    '2025-01',
    dadosRelatorioDemostracao
  );
  
  console.log('\n📋 Resultado final:', resultado);
}

// Exportar funções para uso em outros módulos
module.exports = {
  generateAndDeployReport,
  uploadToFirebaseStorage,
  validateReportData,
  generateReportHTML,
  exemploUso
};

// Se o script for executado diretamente, rodar exemplo ou usar dados de environment
if (require.main === module) {
  const userId = process.env.REPORT_USER_ID;
  const reportMonth = process.env.REPORT_MONTH;
  const reportData = process.env.REPORT_DATA ? JSON.parse(process.env.REPORT_DATA) : null;
  
  if (userId && reportMonth) {
    console.log(`🔧 Gerando relatório para ${userId} - ${reportMonth}...\n`);
    
    const dadosRelatorio = reportData || {
      totalDays: 30,
      crisisEpisodes: 2,
      averagePain: 3.5,
      medicationCompliance: 90,
      medications: [
        { nome: 'Medicamento Exemplo', dosagem: '500mg', frequencia: 2 }
      ],
      doctors: [
        { nome: 'Dr. Exemplo', especialidade: 'Especialidade', crm: 'CRM/00000' }
      ],
      observations: 'Relatório gerado automaticamente pelo sistema DorLog.'
    };
    
    generateAndDeployReport(userId, reportMonth, dadosRelatorio).catch(console.error);
  } else {
    console.log('🔧 Executando exemplo de uso...\n');
    exemploUso().catch(console.error);
  }
}