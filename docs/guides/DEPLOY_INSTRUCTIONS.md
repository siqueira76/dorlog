# 🚀 Guia de Deploy das Cloud Functions

## Você Não Precisa do Firebase CLI!

Este guia mostra como fazer o deploy das Cloud Functions **sem instalar nada no Replit**.

---

## Método 1️⃣: Service Account (RECOMENDADO)

### Passo 1: Gerar Service Account Key

1. Vá em: https://console.firebase.google.com/project/dorlog-fibro-diario/settings/serviceaccounts/adminsdk

2. Click na aba **"Service accounts"**

3. Click em **"Generate new private key"**

4. Confirme clicando em **"Generate key"**
   - Um arquivo JSON será baixado (algo como `dorlog-fibro-diario-xxxxx.json`)

5. Abra o arquivo JSON no seu editor de texto
   - Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)

### Passo 2: Adicionar como Secret no GitHub

1. Vá em: https://github.com/siqueira76/dorlog/settings/secrets/actions

2. Click em **"New repository secret"**

3. Preencha:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Cole TODO o conteúdo do JSON que você copiou
   - Click em **"Add secret"**

### Passo 3: Triggerar o Deploy

Agora basta fazer um commit:

```bash
git add .
git commit -m "Deploy Cloud Functions"
git push origin main
```

O GitHub Actions vai **automaticamente**:
- ✅ Compilar as functions
- ✅ Autenticar com Firebase usando o Service Account
- ✅ Fazer o deploy das 4 Cloud Functions
- ✅ Configurar o Cloud Scheduler

---

## Método 2️⃣: Firebase Token (Alternativo)

Se você tiver o Firebase CLI instalado **no seu computador local** (Windows/Mac/Linux):

### No Terminal do Seu Computador:

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Gerar token
firebase login:ci
```

Isso vai:
1. Abrir o navegador
2. Fazer login na sua conta Google
3. Mostrar um token (algo como `1//AbCdEf123...`)
4. **Copie esse token**

### Adicionar como Secret no GitHub:

1. Vá em: https://github.com/siqueira76/dorlog/settings/secrets/actions
2. Click em **"New repository secret"**
3. Name: `FIREBASE_TOKEN`
4. Value: Cole o token
5. Click **"Add secret"**

Depois faça commit e push (igual ao método 1).

---

## ✅ Verificar Deployment

### 1. Acompanhar no GitHub Actions
- URL: https://github.com/siqueira76/dorlog/actions
- Você verá o workflow "Deploy Firebase Functions" rodando
- Aguarde ~2-3 minutos
- Status verde ✅ = Deploy concluído!

### 2. Verificar no Firebase Console
- Functions: https://console.firebase.google.com/project/dorlog-fibro-diario/functions
- Você deve ver **4 functions**:
  - ✅ `sendMorningQuizReminders`
  - ✅ `sendEveningQuizReminders`
  - ✅ `nlpAnalyze`
  - ✅ `nlpHealth`

### 3. Verificar Cloud Scheduler
- Cloud Scheduler: https://console.firebase.google.com/project/dorlog-fibro-diario/functions/scheduler
- Você deve ver 2 agendamentos:
  - ✅ Morning Quiz Reminders (roda a cada hora, envia para usuários às 8h local)
  - ✅ Evening Quiz Reminders (roda a cada hora, envia para usuários às 20h local)

---

## 🧪 Testar Notificação Manual

Abra o arquivo `test-notification.html` no navegador para:
1. Obter seu FCM token
2. Testar envio manual via Firebase Console

---

## ❓ Troubleshooting

### "Workflow não está rodando"
- Verifique se o secret foi adicionado corretamente
- Vá em Settings → Secrets → Actions
- Deve ter `FIREBASE_SERVICE_ACCOUNT` ou `FIREBASE_TOKEN`

### "Deploy failed"
- Click no workflow que falhou
- Leia os logs para ver o erro
- Geralmente é problema de permissão ou secret inválido

### "Functions deployadas mas notificações não chegam"
- Verifique se o usuário aceitou os termos e ativou notificações
- Verifique se o FCM token foi salvo no Firestore (`usuarios/{uid}/fcmTokens`)
- Teste envio manual via Firebase Console → Messaging
