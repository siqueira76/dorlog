import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply Unified Report System for all environments
const isGitHubPages = !window.location.hostname.includes('replit') && 
                      !window.location.hostname.includes('localhost') &&
                      !window.location.hostname.includes('127.0.0.1');

// Always activate unified report system for consistency
console.log('🔧 Ativando Sistema Unificado de Relatórios...');
console.log(`📍 Ambiente: ${isGitHubPages ? 'GitHub Pages' : 'Replit/Local'}`);

// Import and apply unified report system for all environments (temporarily disabled for debugging)
/*
import('./patches/unifiedReportActivator').then(({ activateUnifiedReports }) => {
  activateUnifiedReports();
  console.log(`✅ Sistema unificado ativado para ${isGitHubPages ? 'GitHub Pages' : 'Replit/Local'}`);
}).catch(error => {
  console.warn('⚠️ Erro ao carregar sistema unificado:', error);
});
*/

createRoot(document.getElementById("root")!).render(<App />);
