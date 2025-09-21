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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🩺 DorLog - Relatório de Saúde</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .logo {
            font-size: 2.5rem;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin: 0;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1.4rem;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
            display: block;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        .medication-list, .pain-list {
            list-style: none;
            padding: 0;
        }
        .medication-item, .pain-item {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
        }
        .item-name {
            font-weight: bold;
            color: #2c3e50;
        }
        .item-details {
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        .demo-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">🩺 DorLog</h1>
            <p class="subtitle">Relatório de Saúde</p>
            <p>📅 ${periodsText}</p>
            <p>👤 ${userEmail}</p>
        </div>
        
        <div class="content">
            <div class="demo-notice">
                <strong>📊 Relatório de Demonstração - GitHub Pages</strong><br>
                Este relatório foi gerado localmente com dados realistas para demonstração do layout profissional.
            </div>
            
            <div class="section">
                <h2 class="section-title">📊 Estatísticas Gerais</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">28</span>
                        <span class="stat-label">Dias Monitorados</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">12</span>
                        <span class="stat-label">Episódios de Dor</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">92%</span>
                        <span class="stat-label">Adesão Medicação</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">6.2</span>
                        <span class="stat-label">Dor Média (0-10)</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">💊 Medicamentos</h2>
                <ul class="medication-list">
                    <li class="medication-item">
                        <div class="item-name">Pregabalina</div>
                        <div class="item-details">150mg - 2x ao dia (Dr. Silva)</div>
                    </li>
                    <li class="medication-item">
                        <div class="item-name">Amitriptilina</div>
                        <div class="item-details">25mg - 1x ao dia (Dr. Silva)</div>
                    </li>
                    <li class="medication-item">
                        <div class="item-name">Gabapentina</div>
                        <div class="item-details">300mg - 3x ao dia (Dr. Santos)</div>
                    </li>
                </ul>
            </div>
            
            <div class="section">
                <h2 class="section-title">📍 Pontos de Dor Mais Frequentes</h2>
                <ul class="pain-list">
                    <li class="pain-item">
                        <div class="item-name">Região lombar</div>
                        <div class="item-details">(15 ocorrências)</div>
                    </li>
                    <li class="pain-item">
                        <div class="item-name">Pescoço</div>
                        <div class="item-details">(12 ocorrências)</div>
                    </li>
                    <li class="pain-item">
                        <div class="item-name">Ombros</div>
                        <div class="item-details">(10 ocorrências)</div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
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