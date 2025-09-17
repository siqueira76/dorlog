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

// Import and apply unified report system for all environments (reactivated with normalized identifiers)
import('./patches/unifiedReportActivator').then(({ UnifiedReportActivator }) => {
  return UnifiedReportActivator.activate();
}).then(() => {
  console.log(`✅ Sistema unificado ativado com identificadores normalizados para ${isGitHubPages ? 'GitHub Pages' : 'Replit/Local'}`);
}).catch(error => {
  console.error('❌ Falha no sistema unificado:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
