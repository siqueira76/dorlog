# 🔥 Firebase Functions - Setup & Deploy Guide

## 📋 **Visão Geral**

Firebase Functions para análise NLP server-side implementadas com sucesso! Esta documentação cobre o processo de deploy e configuração.

---

## 🏗️ **Arquitetura**

```
┌──────────────────────────────────────────────────────────┐
│           🔥 FIREBASE HOSTING                            │
│           https://dorlog-fibro-diario.web.app            │
│                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│   │  Frontend   │  │  Cloud Run  │  │  Functions    │   │
│   │  (React)    │─▶│  (API REST) │  │  (NLP)        │   │
│   │             │  │             │  │               │   │
│   └─────────────┘  └─────────────┘  └───────────────┘   │
│         ↑                /api/**      nlpAnalyze()       │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 **Estrutura de Arquivos**

```
fibrodiario/
├── functions/                           # 🆕 Firebase Functions
│   ├── src/
│   │   ├── index.ts                     # Entry point (nlpAnalyze, nlpHealth)
│   │   └── nlpService.ts                # Serviço NLP com @xenova/transformers
│   ├── package.json                     # Dependências
│   ├── tsconfig.json                    # TypeScript config
│   └── .gitignore
├── client/
│   └── src/services/
│       └── nlpServiceProxy.ts           # 🆕 Proxy híbrido (client/server)
├── firebase.json                        # ✏️ Atualizado (+ functions config)
└── FIREBASE_FUNCTIONS_SETUP.md         # 📄 Esta documentação
```

---

## ⚙️ **Configuração Inicial**

### **1. Instalar Dependências**

```bash
cd functions/
npm install
```

**Pacotes instalados:**
- `@xenova/transformers` (^2.17.0) - Modelos NLP
- `firebase-admin` (^12.0.0) - Admin SDK
- `firebase-functions` (^5.0.0) - Functions SDK v2

---

### **2. Autenticar Firebase CLI**

```bash
firebase login
```

Isso abre o navegador para login com Google. Faça login com a conta que tem acesso ao projeto `dorlog-fibro-diario`.

---

### **3. Verificar Projeto**

```bash
firebase projects:list
```

Deve mostrar `dorlog-fibro-diario` na lista.

---

## 🚀 **Deploy**

### **Opção 1: Deploy Apenas Functions**

```bash
firebase deploy --only functions
```

**Output esperado:**
```
✔ functions[nlpAnalyze(us-central1)] Successful create operation.
✔ functions[nlpHealth(us-central1)] Successful create operation.

Functions deploy complete!
```

**Tempo:** ~2-3 minutos

---

### **Opção 2: Deploy Completo (Hosting + Functions)**

```bash
firebase deploy
```

Faz deploy de tudo:
- Hosting (frontend)
- Functions (NLP)

---

## 🧪 **Testar Localmente**

### **1. Iniciar Emuladores**

```bash
# No diretório raiz do projeto
firebase emulators:start
```

Isso inicia:
- Functions Emulator (porta 5001)
- Hosting Emulator (porta 5000)
- Firestore Emulator (porta 8080)

### **2. Testar Function Diretamente**

```bash
# Em outro terminal
curl -X POST http://localhost:5001/dorlog-fibro-diario/us-central1/nlpHealth
```

**Resposta esperada:**
```json
{
  "result": {
    "status": "ok",
    "service": "nlp-analysis",
    "timestamp": "2025-11-22T...",
    "version": "1.0.0"
  }
}
```

### **3. Testar no App**

1. Abrir http://localhost:5000
2. Gerar relatório mensal
3. Verificar console do navegador:
   ```
   🧠 NLP Proxy: processando X textos...
   🔧 Conectando ao Functions Emulator
   ☁️ Usando NLP server-side para X textos
   ⚡ Server-side completado em XXXms
   ```

---

## 🔍 **Verificar Deploy em Produção**

### **1. Checar Functions**

```bash
firebase functions:list
```

**Output esperado:**
```
┌──────────────┬──────────────┬─────────┐
│ Function     │ Trigger      │ Region  │
├──────────────┼──────────────┼─────────┤
│ nlpAnalyze   │ HTTPS Callable│us-central1│
│ nlpHealth    │ HTTPS Callable│us-central1│
└──────────────┴──────────────┴─────────┘
```

### **2. Testar Function em Produção**

```bash
# Health check
curl https://us-central1-dorlog-fibro-diario.cloudfunctions.net/nlpHealth
```

### **3. Monitorar Logs**

```bash
# Logs em tempo real
firebase functions:log --only nlpAnalyze

# Últimos logs
firebase functions:log --only nlpAnalyze --limit 50
```

---

## 📊 **Monitoramento**

### **Firebase Console**

1. Acesse: https://console.firebase.google.com/project/dorlog-fibro-diario
2. Menu lateral: **Functions**
3. Visualize:
   - Invocations/dia
   - Latência média
   - Erros
   - Custos estimados

### **Métricas Importantes**

| Métrica | O que observar |
|---------|----------------|
| **Invocations** | < 2M/mês (free tier) |
| **Latência** | < 2s (cold start), < 500ms (warm) |
| **Erros** | < 1% (taxa de erro) |
| **CPU Time** | < 200k GHz-s/mês (free tier) |
| **Memory** | < 400k GB-s/mês (free tier) |

---

## 💰 **Custos Estimados**

### **Free Tier (Plano Blaze)**

| Recurso | Limite Grátis/Mês | Status (1k users) |
|---------|-------------------|-------------------|
| Invocations | 2.000.000 | ✅ 16.000 (0.8%) |
| CPU Time | 200.000 GHz-s | ✅ 24.000 (12%) |
| Memory | 400.000 GB-s | ✅ 48.000 (12%) |

**Custo atual:** $0/mês (100% dentro do free tier)

### **Projeção de Escala**

| Usuários | Invocations/mês | Custo Estimado |
|----------|-----------------|----------------|
| 1.000 | 16.000 | **$0** |
| 10.000 | 160.000 | **~$0.60** |
| 100.000 | 1.600.000 | **~$5** |

---

## 🎯 **Como o Sistema Funciona**

### **Detecção Automática de Estratégia**

O sistema decide automaticamente entre client-side ou server-side:

```typescript
// 1. Offline? → Client-side
if (!navigator.onLine) return false;

// 2. Preferência do usuário? → Usar preferência
if (userPreference === 'server') return true;

// 3. Dispositivo low-end? → Server-side (sempre)
if (memory < 4GB || cores < 4) return true;

// 4. Dispositivo capaz - transição inteligente:
//    Primeira vez → Server (evita download 330MB)
//    Após server executar → Client (hora de baixar modelos)
//    Com modelos cached → Client (sempre)
const hasServerExecuted = localStorage.nlp_server_executed;
if (!hasServerExecuted && !hasModelsCache) return true;  // 1ª vez
if (hasServerExecuted && !hasModelsCache) return false;  // 2ª vez (download)

// 5. Default → Client-side (privacy-first)
return false;
```

### **Fluxo de Execução**

**Dispositivo Capaz (High-end):**
```
1ª execução:
  ├─ Decisão: Server (evita download 330MB)
  ├─ Firebase Functions processa
  ├─ Marca: nlp_server_executed = true
  └─ Retorna resultados (rápido)

2ª execução:
  ├─ Decisão: Client (hora de baixar modelos)
  ├─ Baixa @xenova/transformers (~330MB)
  ├─ Marca: nlp_models_cached = true
  └─ Retorna resultados (1ª vez mais lenta)

3ª+ execuções:
  ├─ Decisão: Client (modelos cached)
  ├─ Browser processa localmente
  └─ Retorna resultados (rápido + offline)
```

**Dispositivo Low-end:**
```
Todas execuções:
  ├─ Decisão: Server (sempre)
  ├─ Firebase Functions processa
  └─ Retorna resultados (30-50% mais rápido)
```

---

## 🛠️ **Configurações Avançadas**

### **Preferência do Usuário**

```typescript
import { nlpServiceProxy } from '@/services/nlpServiceProxy';

// Forçar server-side
nlpServiceProxy.setPreference('server');

// Forçar client-side
nlpServiceProxy.setPreference('client');

// Auto-detectar (padrão)
nlpServiceProxy.setPreference('auto');

// Ver configuração atual
const pref = nlpServiceProxy.getPreference();
```

### **Info do Dispositivo**

```typescript
const info = nlpServiceProxy.getDeviceInfo();
console.log(info);
// {
//   isLowEnd: false,
//   memory: 8,
//   cores: 8,
//   online: true,
//   effectiveType: '4g'
// }
```

---

## 🧹 **Gerenciamento de Cache**

### **Flags localStorage**

O sistema usa 3 flags para gerenciar a estratégia híbrida:

| Flag | Quando definida | Propósito |
|------|-----------------|-----------|
| `nlp_server_executed` | Após 1ª execução server-side bem-sucedida | Permite transição para client-side |
| `nlp_models_cached` | Após download completo dos modelos | Indica que modelos estão prontos |
| `nlp_preference` | Configuração manual do usuário | Força server/client/auto |

### **Limpar Cache (Reset)**

```typescript
// Resetar para comportamento padrão
localStorage.removeItem('nlp_server_executed');
localStorage.removeItem('nlp_models_cached');
localStorage.removeItem('nlp_preference');

// Força próxima execução a começar do zero
```

---

## 🔧 **Troubleshooting**

### **Erro: "Unauthenticated"**

**Causa:** Usuário não está logado no Firebase Auth

**Solução:** Verificar que o usuário está autenticado antes de chamar NLP

```typescript
const user = auth.currentUser;
if (!user) {
  // Redirecionar para login
}
```

### **Erro: "Invalid argument"**

**Causa:** Dados inválidos enviados para a function

**Solução:** Validar que `texts` é um array de strings não vazio

```typescript
if (!Array.isArray(texts) || texts.length === 0) {
  console.error('Textos inválidos');
  return;
}
```

### **Cold Start Lento (>3s)**

**Causa:** Function estava fria (sem uso recente)

**Solução (opcional):** Configurar min-instances

```typescript
// functions/src/index.ts
export const nlpAnalyze = onCall({
  memory: '2GiB',
  timeoutSeconds: 120,
  concurrency: 80,
  minInstances: 1  // 🆕 Mantém 1 instância warm (~$8/mês)
}, ...);
```

⚠️ **Custo adicional:** ~$8/mês para manter 1 instância sempre warm

---

## 📈 **Próximos Passos**

### **Opcional: CI/CD Automático**

Adicionar deploy automático de Functions via GitHub Actions:

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Firebase Functions

on:
  push:
    branches: [main]
    paths:
      - 'functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          cd functions
          npm ci
          npm run deploy
```

**Requer:** Configurar `FIREBASE_TOKEN` no GitHub Secrets

---

## ✅ **Checklist de Deploy**

- [ ] `cd functions/ && npm install`
- [ ] `firebase login` (se ainda não fez)
- [ ] `firebase deploy --only functions`
- [ ] Verificar `firebase functions:list`
- [ ] Testar em produção (gerar relatório)
- [ ] Monitorar logs: `firebase functions:log`
- [ ] Verificar custos no Firebase Console

---

## 📞 **Suporte**

- **Firebase Docs:** https://firebase.google.com/docs/functions
- **@xenova/transformers:** https://huggingface.co/docs/transformers.js

---

**Implementado com sucesso! 🎉**
