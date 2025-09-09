#!/usr/bin/env node

// Script para build do cliente apenas (sem servidor)
import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  plugins: [
    (await import('@vitejs/plugin-react')).default(),
  ],
  root: resolve(__dirname, 'client'),
  build: {
    outDir: resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: '[name].[hash].[ext]',
        chunkFileNames: '[name].[hash].js',
        entryFileNames: '[name].[hash].js'
      }
    },
    assetsDir: 'assets',
  },
  base: process.env.NODE_ENV === 'production' ? '/dorlog/' : '/',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.PUBLIC_URL': JSON.stringify(process.env.NODE_ENV === 'production' ? '/dorlog' : '')
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client', 'src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets'),
    },
  },
};

async function buildClient() {
  try {
    console.log('🏗️  Construindo cliente para GitHub Pages...');
    await build(config);
    
    // Copy 404.html to handle SPA routing
    const fs = await import('fs/promises');
    const path404Source = resolve(__dirname, 'client/public/404.html');
    const path404Dest = resolve(__dirname, 'dist/public/404.html');
    
    try {
      await fs.copyFile(path404Source, path404Dest);
      console.log('✅ 404.html copiado para SPA routing');
    } catch (copyError) {
      console.log('⚠️  404.html não encontrado, criando automaticamente...');
      const html404 = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DorLog - Redirecionando...</title>
  <script>
    // GitHub Pages SPA redirect script for DorLog
    (function() {
      var currentPath = window.location.pathname;
      var basePath = '/dorlog/';
      
      console.log('🔄 404.html redirect logic:', {
        currentPath: currentPath,
        basePath: basePath,
        origin: window.location.origin
      });
      
      // Store the intended route in sessionStorage so the React app can read it
      var route = currentPath.replace(basePath, '');
      
      console.log('🔄 Extracted route:', route);
      
      if (route && route !== '' && route !== 'index.html') {
        // Store the intended path for the React app to read
        sessionStorage.setItem('dorlog_intended_path', '/' + route);
        console.log('💾 Saved intended path to sessionStorage:', '/' + route);
      }
      
      // Always redirect to the main app
      var redirectUrl = window.location.origin + basePath;
      console.log('🚀 Redirecting to:', redirectUrl);
      window.location.replace(redirectUrl);
    })();
  </script>
</head>
<body>
  <div style="text-align: center; padding-top: 50px;">
    <h2>Redirecionando...</h2>
    <p>Você está sendo redirecionado para o DorLog.</p>
  </div>
</body>
</html>`;
      await fs.writeFile(path404Dest, html404);
      console.log('✅ 404.html criado automaticamente');
    }
    
    // Copy PWA assets (manifest, service worker, icons)
    const pwaCopyTasks = [
      { src: 'manifest.json', desc: 'PWA Manifest' },
      { src: 'sw.js', desc: 'Service Worker' },
      { src: 'offline.html', desc: 'Página Offline' },
      { src: 'browserconfig.xml', desc: 'Browser Config' }
    ];
    
    for (const task of pwaCopyTasks) {
      try {
        const sourcePath = resolve(__dirname, 'client/public', task.src);
        const destPath = resolve(__dirname, 'dist/public', task.src);
        await fs.copyFile(sourcePath, destPath);
        console.log(`✅ ${task.desc} copiado`);
      } catch (error) {
        console.log(`⚠️  ${task.desc} não encontrado:`, task.src);
      }
    }
    
    // Copy icons directory
    try {
      await fs.cp(
        resolve(__dirname, 'client/public/icons'),
        resolve(__dirname, 'dist/public/icons'),
        { recursive: true }
      );
      console.log('✅ Ícones PWA copiados');
    } catch (error) {
      console.log('⚠️  Diretório de ícones não encontrado');
    }
    
    // Copy screenshots directory
    try {
      await fs.cp(
        resolve(__dirname, 'client/public/screenshots'),
        resolve(__dirname, 'dist/public/screenshots'),
        { recursive: true }
      );
      console.log('✅ Screenshots copiados');
    } catch (error) {
      console.log('⚠️  Screenshots não encontrados (opcional)');
    }
    
    // Verificar e corrigir paths no index.html se necessário
    const indexPath = resolve(__dirname, 'dist/public/index.html');
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    
    // Garantir que todos os assets tenham o base path correto
    indexContent = indexContent.replace(/src="\/(?!dorlog)/g, 'src="/dorlog/');
    indexContent = indexContent.replace(/href="\/(?!dorlog)/g, 'href="/dorlog/');
    
    await fs.writeFile(indexPath, indexContent);
    console.log('✅ Base paths verificados e corrigidos no index.html');
    
    console.log('✅ Build do cliente concluído!');
    console.log('📁 Arquivos gerados em: dist/public/');
  } catch (error) {
    console.error('❌ Erro durante o build:', error);
    process.exit(1);
  }
}

buildClient();