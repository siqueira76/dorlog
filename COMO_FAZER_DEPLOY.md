# 🚀 Como Fazer Deploy das Cloud Functions

## ⚡ Modo Rápido (Recomendado)

### Via GitHub Actions (Automático)

```bash
# 1. Fazer commit das mudanças
git add .
git commit -m "feat: cloud functions para processamento em background"

# 2. Push para main
git push origin main

# 3. Aguardar ~3 minutos
# O GitHub Actions fará o deploy automaticamente
```

### Verificar Deploy

```bash
# Ver status do deployment
# Ir em: https://github.com/seu-usuario/seu-repo/actions

# OU usar Firebase CLI (se tiver instalado localmente)
firebase functions:list
```

## 🔧 Modo Manual (Se GitHub Actions falhar)

### Pré-requisitos

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Verificar projeto
firebase use
```

### Deploy

```bash
# Deploy apenas functions
firebase deploy --only functions

# OU deploy específico
firebase deploy --only functions:generateReportBackground
```

## ✅ Testar em Produção

### 1. Abrir aplicação

```
https://seu-app.web.app
```

### 2. Ir em Relatórios

```
Relatórios → Gerar Relatório Mensal
```

### 3. Selecionar período e gerar

```
- Escolher mês
- Clicar em "Gerar Relatório"
- FECHAR A ABA 👈 (teste principal!)
- Voltar depois de 1 minuto
- Verificar na Home se apareceu
```

## 📊 Monitorar

### Firebase Console

```
https://console.firebase.google.com/project/dorlog-fibro-diario/functions
```

### Logs em Tempo Real

```bash
firebase functions:log --only generateReportBackground --tail
```

## ⚠️ Importante

### Service Account Secret

Certifique-se de que o secret `FIREBASE_SERVICE_ACCOUNT` está configurado no GitHub:

```
GitHub → Settings → Secrets and variables → Actions
→ New repository secret
Name: FIREBASE_SERVICE_ACCOUNT
Value: <conteúdo do service-account.json>
```

### Custo

- **FREE** até 2 milhões de execuções/mês
- Seu volume: ~3.000/mês = **GRÁTIS** ✅

## 🎯 Comandos Úteis

```bash
# Ver lista de functions
firebase functions:list

# Ver logs (últimas 50 linhas)
firebase functions:log --only generateReportBackground --limit 50

# Deletar function
firebase functions:delete generateReportBackground

# Re-deploy forçado
firebase deploy --only functions --force
```

---

**Dúvidas?** Veja a documentação completa em `DEPLOY_CLOUD_FUNCTIONS_BACKGROUND.md`
