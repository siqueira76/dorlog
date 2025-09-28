export const isStaticHosting = () => {
  return !window.location.hostname.includes('replit') && 
         !window.location.hostname.includes('localhost') &&
         !window.location.hostname.includes('127.0.0.1');
};

export const generateLocalReport = (reportData: any): string => {
  const { periodsText, userEmail } = reportData;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>FibroDiário - Relatório Mobile</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            background: #f8fafc;
            color: #1e293b;
            padding-bottom: 4rem; /* espaço para nav fixa */
        }
        header {
            background: linear-gradient(135deg, #9C27B0, #E1BEE7);
            color: white;
            text-align: center;
            padding: 1.5rem;
            border-radius: 0 0 1rem 1rem;
        }
        header h1 {
            font-size: 1.5rem;
            margin: 0;
        }
        header p {
            margin: 0.3rem 0 0;
            font-size: 0.9rem;
        }
        .section {
            margin: 1rem;
        }
        .card {
            background: white;
            border-radius: 1rem;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .card h2 {
            margin: 0 0 0.5rem;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .pain-emoji {
            font-size: 2.5rem;
            margin: 0.5rem 0;
            text-align: center;
        }
        .pain-value {
            text-align: center;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        ul, p {
            margin: 0.5rem 0;
            font-size: 0.9rem;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.5rem;
            text-align: center;
        }
        .stat-grid div {
            background: #f1f5f9;
            padding: 0.5rem;
            border-radius: 0.5rem;
            font-size: 0.85rem;
        }
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-around;
            background: white;
            border-top: 1px solid #e2e8f0;
            padding: 0.5rem 0;
        }
        .bottom-nav button {
            background: none;
            border: none;
            font-size: 1.2rem;
            color: #64748b;
        }
        .bottom-nav button.active {
            color: #9C27B0;
            font-weight: 700;
        }
        .demo-notice {
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin: 1rem 0;
            font-size: 0.85rem;
            text-align: center;
            color: #92400e;
        }
    </style>
</head>
<body>
    <header>
        <h1>FibroDiário</h1>
        <p>Relatório de Dor - ${periodsText}</p>
        <p>👤 ${userEmail}</p>
    </header>

    <!-- Seção Resumo -->
    <div class="section">
        <div class="card">
            <h2>📊 Resumo</h2>
            <div class="demo-notice">
                <strong>📊 Relatório de Demonstração</strong><br>
                Este relatório foi gerado localmente com dados realistas para demonstração do layout profissional.
            </div>
            <ul>
                <li>Dor média geral: ${reportData.averagePain || 'N/A'}</li>
                <li>Total de crises: ${reportData.crisisCount || 0} (últimos ${reportData.totalDays || 30} dias)</li>
                <li>Adesão medicação: ${reportData.medicationAdherence || 'N/A'}%</li>
                <li>Atividades principais: ${reportData.topActivities || 'Dados em coleta'}</li>
            </ul>
        </div>
    </div>

    <!-- Seção Manhãs -->
    <div class="section">
        <div class="card">
            <h2>🌅 Manhãs</h2>
            <div class="pain-emoji">${reportData.morningPain <= 3 ? '😊' : reportData.morningPain <= 6 ? '😐' : '😰'}</div>
            <div class="pain-value">Dor média: ${reportData.morningPain || 'N/A'}</div>
            <ul>
                <li>${reportData.morningRecords || 0} registros coletados</li>
                <li>Sono: ${reportData.sleepQuality || 'Não avaliado'} (${reportData.sleepAverage || 'N/A'}/4)</li>
                <li>Correlação: ${reportData.sleepCorrelation || 'Em análise'}</li>
            </ul>
        </div>
    </div>

    <!-- Seção Noites -->
    <div class="section">
        <div class="card">
            <h2>🌙 Noites</h2>
            <div class="pain-emoji">${reportData.eveningPain <= 3 ? '😊' : reportData.eveningPain <= 6 ? '😐' : '😰'}</div>
            <div class="pain-value">Dor média: ${reportData.eveningPain || 'N/A'}</div>
            <ul>
                <li>${reportData.eveningRecords || 0} registros coletados</li>
                <li>Humor: ${reportData.moodQuality || 'Não avaliado'} (${reportData.moodAverage || 'N/A'}/4)</li>
                <li>Correlação: ${reportData.moodCorrelation || 'Em análise'}</li>
            </ul>
        </div>
    </div>

    <!-- Seção Crises -->
    <div class="section">
        <div class="card">
            <h2>🚨 Crises</h2>
            <div class="pain-emoji">${reportData.crisisCount > 0 ? '😭' : '✅'}</div>
            <div class="pain-value">Intensidade Média: ${reportData.crisisIntensity || 'N/A'}</div>
            <div class="stat-grid">
                <div><strong>${reportData.crisisCount || 0}</strong><br>Crises em ${reportData.totalDays || 30} dias</div>
                <div><strong>${reportData.crisisFrequency || 0}%</strong><br>Frequência</div>
            </div>
            <p>Locais afetados: ${reportData.painLocations || 'Dados em coleta'}</p>
        </div>
    </div>

    <!-- Seção Digestiva -->
    <div class="section">
        <div class="card">
            <h2>💩 Saúde Digestiva</h2>
            <p>Status: ${reportData.digestiveStatus || 'Coletando dados'} ${reportData.digestiveIcon || '📊'}</p>
            <ul>
                <li>Intervalo médio: ${reportData.digestiveInterval || 'N/A'} dias</li>
                <li>Maior intervalo: ${reportData.digestiveMaxInterval || 'N/A'} dias</li>
                <li>Última evacuação: há ${reportData.digestiveLastDays || 'N/A'} dias</li>
            </ul>
            <p><strong>Recomendação:</strong> ${reportData.digestiveRecommendation || 'Continue monitorando regularmente.'}</p>
        </div>
    </div>

    <!-- Seção Atividades -->
    <div class="section">
        <div class="card">
            <h2>🏃 Atividades</h2>
            <ul>
                ${reportData.activities ? reportData.activities.slice(0, 5).map(activity => 
                  `<li>${activity.name || activity} - ${activity.frequency || 'N/A'}x/semana | ${activity.impact || 'Neutro'}</li>`
                ).join('') : '<li>Dados de atividades em coleta</li>'}
            </ul>
            <p>Correlação atividade ↔ recuperação: ${reportData.activityCorrelation || 'Em análise'}</p>
        </div>
    </div>

    <!-- Seção Insights -->
    <div class="section">
        <div class="card">
            <h2>💡 Insights</h2>
            <ul>
                ${reportData.insights ? reportData.insights.slice(0, 3).map(insight => 
                  `<li>${insight.text || insight}</li>`
                ).join('') : '<li>Coletando dados para análise de padrões</li><li>Continue registrando suas informações diárias</li><li>Insights serão gerados conforme dados disponíveis</li>'}
            </ul>
        </div>
    </div>

    <!-- Seção Medicamentos -->
    <div class="section">
        <div class="card">
            <h2>💊 Medicamentos</h2>
            <ul>
                ${reportData.medications ? reportData.medications.slice(0, 5).map(med => 
                  `<li>${med.name || med} - ${med.dosage || 'Dose não especificada'}</li>`
                ).join('') : '<li>Nenhum medicamento cadastrado</li><li>Cadastre seus medicamentos no menu "Medicamentos"</li>'}
            </ul>
        </div>
    </div>

    <!-- Seção Equipe Médica -->
    <div class="section">
        <div class="card">
            <h2>🏥 Equipe Médica</h2>
            <ul>
                ${reportData.doctors ? reportData.doctors.slice(0, 5).map(doctor => 
                  `<li>Dr(a). ${doctor.name} - ${doctor.specialty} (CRM ${doctor.crm})</li>`
                ).join('') : '<li>Nenhum médico cadastrado</li><li>Adicione sua equipe médica no menu "Médicos"</li>'}
            </ul>
        </div>
    </div>

    <!-- Seção Padrões Temporais -->
    <div class="section">
        <div class="card">
            <h2>⏰ Padrões Temporais</h2>
            <p>${reportData.temporalPattern || 'Analisando padrões temporais com base nos registros.'}</p>
        </div>
    </div>

    <!-- Rodapé -->
    <div class="section">
        <div class="card">
            <h2>ℹ️ Informações</h2>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - ID: RPT-${Date.now().toString().slice(-8)}</p>
            <p><em>Este relatório não substitui acompanhamento médico.</em></p>
        </div>
    </div>

    <!-- Navegação inferior -->
    <nav class="bottom-nav">
        <button class="active">🏠</button>
        <button>🌅</button>
        <button>🌙</button>
        <button>🚨</button>
        <button>💩</button>
    </nav>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new tab
  window.open(url, '_blank');
  
  return url;
};

export const createWhatsAppMessage = (reportUrl: string, periodsText: string) => {
  return `🩺 *DorLog - Relatório de Saúde*

📅 Período: ${periodsText}

Aqui está meu relatório de saúde gerado pelo DorLog. O relatório contém informações detalhadas sobre medicamentos, episódios de dor e estatísticas de saúde.

🔗 Visualizar relatório: ${reportUrl}

⏰ *Importante:* Este relatório será automaticamente removido após 1 dia.

_Este relatório foi gerado automaticamente pelo aplicativo DorLog._`;
};