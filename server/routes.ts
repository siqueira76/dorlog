import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { spawn } from "child_process";
import path from "path";

// Function to generate report using child process
async function generateReportForUser(userId: string, reportMonth: string, reportData: any): Promise<any> {
  return new Promise((resolve) => {
    try {
      console.log(`📋 Iniciando geração de relatório para ${userId}...`);
      
      // Execute the report generation script
      const scriptPath = path.resolve(process.cwd(), 'generate_and_send_report.cjs');
      const child = spawn('node', [scriptPath], {
        env: { 
          ...process.env,
          REPORT_USER_ID: userId,
          REPORT_MONTH: reportMonth,
          REPORT_DATA: JSON.stringify(reportData || {})
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`📄 Script output: ${data.toString().trim()}`);
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`📄 Script error: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        const baseUrl = `https://${process.env.VITE_FIREBASE_PROJECT_ID || 'dorlog-fibro-diario'}.web.app`;
        
        if (code === 0) {
          // Parse output for success information - extract actual URL from script output
          const urlMatch = output.match(/🔗 Relatório disponível em: (https:\/\/[^\s]+)/);
          const reportUrl = urlMatch 
            ? urlMatch[1] 
            : `${baseUrl}/usuarios/report_${userId.replace('@', '_').replace('.', '_')}_${reportMonth}.html`;
          
          const fileNameMatch = reportUrl.match(/\/([^\/]+\.html)$/);
          const fileName = fileNameMatch ? fileNameMatch[1] : `report_${userId.replace('@', '_').replace('.', '_')}_${reportMonth}.html`;
          
          resolve({
            success: true,
            url: reportUrl,
            fileName: fileName,
            executionTime: 'completed'
          });
        } else {
          resolve({
            success: false,
            error: `Script exited with code ${code}: ${errorOutput || output}`
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to execute script: ${error instanceof Error ? error.message : String(error)}`
        });
      });
      
    } catch (error) {
      console.error(`❌ Erro ao gerar relatório: ${error instanceof Error ? error.message : String(error)}`);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check endpoint (required for Cloud Run)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'fibrodiario-backend'
    });
  });

  // Endpoint para forçar reset de lembretes (para uso em cronjobs ou testes)
  app.post('/api/reset-reminders', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      // Esta funcionalidade seria implementada no frontend via ReminderService
      // Por segurança, retornar apenas confirmação de que o endpoint existe
      res.json({ 
        message: 'Reset deve ser executado via ReminderService no frontend',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no endpoint reset-reminders:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para geração de relatórios HTML  
  app.post('/api/generate-report', async (req, res) => {
    try {
      const { userId, reportMonth, reportData } = req.body;
      
      if (!userId || !reportMonth) {
        return res.status(400).json({ 
          error: 'userId e reportMonth são obrigatórios',
          example: {
            userId: 'user@email.com',
            reportMonth: '2025-01',
            reportData: {
              periodsText: 'Janeiro 2025',
              periods: ['2025-01-01_2025-01-31']
            }
          }
        });
      }

      console.log(`📊 Solicitação de geração de relatório para ${userId} - ${reportMonth}`);
      console.log(`📅 Dados recebidos:`, { 
        periodsText: reportData?.periodsText,
        periodCount: reportData?.periods?.length || 0 
      });
      
      // Generate report directly using child process
      const result = await generateReportForUser(userId, reportMonth, reportData);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Relatório HTML gerado com dados reais do Firestore',
          userId,
          reportMonth,
          reportUrl: result.url,
          fileName: result.fileName,
          executionTime: result.executionTime,
          storageUrl: `https://storage.googleapis.com/${process.env.VITE_FIREBASE_PROJECT_ID || 'dorlog-fibro-diario'}.appspot.com`,
          dataSource: 'firestore'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Erro na geração do relatório',
          userId,
          reportMonth
        });
      }
      
    } catch (error) {
      console.error('Erro no endpoint generate-report:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para geração de relatórios mensais
  app.post('/api/generate-monthly-report', async (req, res) => {
    try {
      const { userId, periods, periodsText } = req.body;
      
      if (!userId || !periods || !Array.isArray(periods) || periods.length === 0) {
        return res.status(400).json({ 
          error: 'userId e periods (array) são obrigatórios',
          example: {
            userId: 'user@email.com',
            periods: ['2025-01-01_2025-01-31', '2025-02-01_2025-02-28'],
            periodsText: 'Janeiro até Fevereiro 2025'
          }
        });
      }

      console.log(`📊 Geração de relatório mensal para ${userId}`);
      console.log(`📅 Períodos: ${periodsText} (${periods.length} período(s))`);
      
      // Format report month for filename with timestamp to ensure uniqueness  
      const timestamp = Date.now();
      const baseName = periodsText?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'relatorio_mensal';
      const reportMonth = `${baseName}_${timestamp}`;
      
      // Generate report with period data
      const reportData = {
        periods,
        periodsText,
        isMonthlyReport: true
      };
      
      const result = await generateReportForUser(userId, reportMonth, reportData);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Relatório mensal gerado com dados de ${periods.length} período(s)`,
          userId,
          periods,
          periodsText,
          reportUrl: result.url,
          fileName: result.fileName,
          executionTime: result.executionTime,
          storageUrl: `https://storage.googleapis.com/${process.env.VITE_FIREBASE_PROJECT_ID || 'dorlog-fibro-diario'}.appspot.com`,
          dataSource: 'firestore'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Erro na geração do relatório mensal',
          userId,
          periods
        });
      }
      
    } catch (error) {
      console.error('Erro no endpoint generate-monthly-report:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
