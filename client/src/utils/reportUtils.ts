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
                <li>Dor média geral: 6.2</li>
                <li>Total de crises: 12 (últimos 28 dias)</li>
                <li>Adesão medicação: 92%</li>
                <li>Atividades principais: Caminhada, Trabalho, Cuidar da casa</li>
            </ul>
        </div>
    </div>

    <!-- Seção Manhãs -->
    <div class="section">
        <div class="card">
            <h2>🌅 Manhãs</h2>
            <div class="pain-emoji">😐</div>
            <div class="pain-value">Dor média: 5.7</div>
            <ul>
                <li>28 registros coletados</li>
                <li>Sono: Regular (3.1/4)</li>
                <li>Correlação moderada: sono de qualidade pode reduzir a dor matinal</li>
            </ul>
        </div>
    </div>

    <!-- Seção Noites -->
    <div class="section">
        <div class="card">
            <h2>🌙 Noites</h2>
            <div class="pain-emoji">😰</div>
            <div class="pain-value">Dor média: 6.5</div>
            <ul>
                <li>28 registros coletados</li>
                <li>Humor: Neutro (2/4)</li>
                <li>Correlação fraca: humor e dor parecem independentes</li>
            </ul>
        </div>
    </div>

    <!-- Seção Crises -->
    <div class="section">
        <div class="card">
            <h2>🚨 Crises</h2>
            <div class="pain-emoji">😭</div>
            <div class="pain-value">Intensidade Média: 8.1</div>
            <div class="stat-grid">
                <div><strong>12</strong><br>Crises em 28 dias</div>
                <div><strong>43%</strong><br>Frequência</div>
            </div>
            <p>Locais afetados: Região lombar (50%), Pescoço (33%)</p>
        </div>
    </div>

    <!-- Seção Digestiva -->
    <div class="section">
        <div class="card">
            <h2>💩 Saúde Digestiva</h2>
            <p>Status: Padrão normal ✅</p>
            <ul>
                <li>Intervalo médio: 2.1 dias</li>
                <li>Maior intervalo: 4 dias</li>
                <li>Última evacuação: há 1 dia</li>
            </ul>
            <p><strong>Recomendação:</strong> Continue monitorando regularmente.</p>
        </div>
    </div>

    <!-- Seção Atividades -->
    <div class="section">
        <div class="card">
            <h2>🏃 Atividades</h2>
            <ul>
                <li>Cuidou da casa - 5x/semana | Muito Positivo</li>
                <li>Caminhada - 4x/semana | Positivo</li>
                <li>Trabalho - 4x/semana | Positivo</li>
                <li>Atividade física - 3x/semana | Positivo</li>
                <li>Descanso - 2x/semana | Neutro</li>
            </ul>
            <p>Correlação atividade ↔ recuperação: 0.24 (fraca)</p>
        </div>
    </div>

    <!-- Seção Insights -->
    <div class="section">
        <div class="card">
            <h2>💡 Insights</h2>
            <ul>
                <li>Padrão estável de dor sem grandes variações.</li>
                <li>Atividade física regular correlaciona-se com recuperação positiva.</li>
                <li>Sono irregular aumenta intensidade da dor matinal.</li>
            </ul>
        </div>
    </div>

    <!-- Seção Medicamentos -->
    <div class="section">
        <div class="card">
            <h2>💊 Medicamentos</h2>
            <ul>
                <li>Pregabalina - 150mg, 2x ao dia</li>
                <li>Amitriptilina - 25mg, 1x ao dia</li>
                <li>Gabapentina - 300mg, 3x ao dia</li>
            </ul>
        </div>
    </div>

    <!-- Seção Equipe Médica -->
    <div class="section">
        <div class="card">
            <h2>🏥 Equipe Médica</h2>
            <ul>
                <li>Dr. Silva - Reumatologista (CRM 12345)</li>
                <li>Dr. Santos - Neurologista (CRM 67890)</li>
            </ul>
        </div>
    </div>

    <!-- Seção Padrões Temporais -->
    <div class="section">
        <div class="card">
            <h2>⏰ Padrões Temporais</h2>
            <p>Dor mais intensa durante o período noturno (18h - 22h).</p>
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