# 🚀 Guia de Deploy - FibroDiário

Este diretório contém guias completos para fazer o deploy das Cloud Functions do Firebase.

## 📋 Arquivos Disponíveis

### **PASSO-A-PASSO-DEPLOY.html** (RECOMENDADO)
Guia visual interativo com instruções passo-a-passo para fazer o deploy das Cloud Functions via GitHub Actions.

**Como usar:**
1. Abra o arquivo no navegador (duplo-click)
2. Siga os 7 passos numerados
3. Cada passo tem links diretos para os consoles necessários

### **DEPLOY_INSTRUCTIONS.md**
Versão em texto markdown com:
- 3 métodos de deploy explicados
- Troubleshooting
- Instruções de verificação

---

## ⚡ Quick Start

### Método 1: Service Account (RECOMENDADO)

1. **Gerar Service Account Key**
   - https://console.firebase.google.com/project/dorlog-fibro-diario/settings/serviceaccounts/adminsdk
   - Click "Generate new private key" → Baixa um arquivo JSON

2. **Adicionar Secret no GitHub**
   - https://github.com/siqueira76/dorlog/settings/secrets/actions
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Cole TODO o conteúdo do JSON

3. **Fazer Commit**
   ```bash
   git add .
   git commit -m "Deploy Cloud Functions"
   git push origin main
   ```

4. **Verificar Deploy**
   - GitHub Actions: https://github.com/siqueira76/dorlog/actions
   - Firebase Functions: https://console.firebase.google.com/project/dorlog-fibro-diario/functions

---

## 🎯 O Que Será Deployado

4 Cloud Functions:
- ✅ `sendMorningQuizReminders` - Notificações às 8h (horário local do usuário)
- ✅ `sendEveningQuizReminders` - Notificações às 20h (horário local do usuário)
- ✅ `nlpAnalyze` - Análise NLP de textos
- ✅ `nlpHealth` - Health check do NLP

2 Cloud Schedulers (criados automaticamente):
- ✅ Morning Quiz Reminders (executa a cada hora)
- ✅ Evening Quiz Reminders (executa a cada hora)

---

## ❓ Problemas Comuns

### "firebase login não funciona no Replit"
✅ Normal! Use o método Service Account descrito acima.

### "Workflow failed"
- Verifique se adicionou o secret `FIREBASE_SERVICE_ACCOUNT` corretamente
- Veja os logs do GitHub Actions para o erro específico

### "Functions deployadas mas notificações não chegam"
- Usuário precisa aceitar termos e ativar notificações no app
- FCM token deve estar salvo no Firestore (`usuarios/{uid}/fcmTokens`)
- Teste envio manual via Firebase Console → Messaging

---

## 🧪 Testar Notificações

### Método 1: Arquivo de Teste
Abra `docs/testing/test-notification.html` no navegador para:
1. Obter seu FCM token
2. Testar permissões
3. Ver instruções de envio manual

### Método 2: Firebase Console
1. https://console.firebase.google.com/project/dorlog-fibro-diario/messaging
2. "Send your first message"
3. "Send test message"
4. Cole seu FCM token
5. Envie!

---

## 📚 Mais Documentação

- **Firebase Setup**: `docs/firebase-setup/`
- **Migration Guides**: `docs/migration/`
- **Testing Tools**: `docs/testing/`
