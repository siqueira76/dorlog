# Deploy de Cloud Functions - Processamento em Background

## 📋 Resumo

Migração completa do processamento de relatórios para Firebase Cloud Functions, permitindo que o usuário saia da tela ou feche a aba enquanto o relatório é gerado.

## ✨ Novidades

### Cloud Function: `generateReportBackground`

**Funcionalidades:**
- ✅ Processamento 100% server-side
- ✅ Continua mesmo se fechar aba/navegador
- ✅ Mais rápido (servidor tem mais recursos)
- ✅ Não trava o navegador do usuário
- ✅ Upload automático para Firebase Storage
- ✅ Salva em `recentReports` automaticamente
- ✅ Suporte a NLP enhanced reports
- ✅ Timeout de 9 minutos (vs 2-3 min no navegador)

**Configuração:**
- Memória: 4GB
- Timeout: 540s (9 minutos)
- Concorrência: 50 usuários simultâneos
- Região: us-central1

## 📁 Arquivos Criados

### Backend (Cloud Functions)

```
functions/src/
├── firestoreDataService.ts     # Busca dados do Firestore
├── storageService.ts            # Upload para Firebase Storage
├── htmlTemplateService.ts       # Gera HTML (versão MVP)
└── index.ts                     # Atualizado com generateReportBackground
```

### Frontend

```
client/src/services/
└── backgroundReportService.ts   # Wrapper para chamar Cloud Function
```

## 🚀 Deploy via GitHub Actions

### Pré-requisitos

1. **Secret `FIREBASE_SERVICE_ACCOUNT` configurado**
   - Ir em: GitHub → Settings → Secrets → Actions
   - Adicionar secret `FIREBASE_SERVICE_ACCOUNT` com o conteúdo do service account JSON

2. **Workflow já configurado**
   - Arquivo: `.github/workflows/deploy-functions.yml`
   - Triggers: Push em `main` com mudanças em `functions/**`

### Como Fazer Deploy

#### Opção 1: Push no branch main (automático)

```bash
git add functions/
git commit -m "feat: adicionar generateReportBackground Cloud Function"
git push origin main
```

O GitHub Actions irá automaticamente:
1. Compilar TypeScript
2. Deploy para Firebase Functions
3. Disponibilizar a função em produção

#### Opção 2: Trigger Manual

1. Ir em: GitHub → Actions → "Deploy Firebase Functions"
2. Clicar em "Run workflow"
3. Selecionar branch `main`
4. Clicar em "Run workflow"

### Verificar Deploy

Após deploy bem-sucedido:

```bash
# Verificar status
firebase functions:list

# Ver logs
firebase functions:log --only generateReportBackground --limit 50
```

## 🔧 Integração no Frontend

### Uso Básico

```typescript
import { generateReportBackground } from '@/services/backgroundReportService';

// Gerar relatório em background
const result = await generateReportBackground({
  periods: ['2025-11'],
  periodsText: 'Novembro 2025',
  templateType: 'enhanced', // ou 'standard'
  withPassword: false
});

if (result.success) {
  console.log('✅ Relatório gerado:', result.reportUrl);
  // Home page será atualizada automaticamente
} else {
  console.error('❌ Erro:', result.error);
}
```

### UX Recommendations

```typescript
// 1. Mostrar loading
setLoading(true);
showToast({ title: "Gerando relatório em background..." });

// 2. Chamar function
const result = await generateReportBackground(options);

// 3. Permitir navegação
setLoading(false);
showToast({ 
  title: "✅ Relatório em processamento!",
  description: "Você pode sair desta tela. O relatório aparecerá na Home em alguns instantes."
});

// 4. Navegar para Home
navigate('/home');
```

## 📊 Monitoramento

### Firebase Console

```
https://console.firebase.google.com/project/dorlog-fibro-diario/functions
```

### Métricas Importantes

- **Execuções/dia**: Quantos relatórios foram gerados
- **Tempo médio**: Tempo de processamento médio
- **Taxa de erro**: Porcentagem de falhas
- **Uso de memória**: Pico de memória utilizada

### Custos Estimados

Firebase Functions - Preços Brasil:
- Gratuito: 2 milhões de execuções/mês
- Após free tier: ~$0.40 por milhão de execuções
- Memória (4GB): ~$0.0000025 por GB-segundo

**Exemplo prático:**
- 100 relatórios/dia = 3.000/mês
- Tempo médio: 30s
- Custo: **GRÁTIS** (dentro do free tier)

## ⚠️ Limitações Atuais (MVP)

### Template HTML Simplificado

A função atual usa um template HTML básico. Para usar o template completo do frontend (~7k linhas), fazer em um próximo PR:

```typescript
// TODO: Migrar template completo
// client/src/services/enhancedHtmlTemplate.ts → functions/src/htmlTemplateService.ts
```

### Sem Proteção por Senha

```typescript
// TODO: Implementar hash de senha
passwordHash: withPassword && password ? hashPassword(password) : undefined
```

## 🔍 Troubleshooting

### Erro: "Function not found"

```bash
# Verificar se função foi deployed
firebase functions:list

# Re-deploy
firebase deploy --only functions
```

### Erro: "Timeout"

```bash
# Aumentar timeout (já está em 540s)
# Se necessário, otimizar:
# 1. Processar NLP em paralelo (já implementado)
# 2. Cachear modelos NLP
# 3. Reduzir batch size
```

### Erro: "Out of memory"

```bash
# Aumentar memória (já está em 4GB)
# Se necessário:
# 1. Processar dados em chunks menores
# 2. Liberar memória após cada etapa
```

## 📝 Próximos Passos

### Melhorias Futuras

1. **Template HTML Completo**
   - Migrar `enhancedHtmlTemplate.ts` completo
   - Manter paridade visual com versão cliente

2. **Cache de Modelos NLP**
   - Cachear modelos entre invocações
   - Reduzir cold start time

3. **Notificações Push**
   - Enviar FCM quando relatório finalizar
   - "Seu relatório está pronto!"

4. **Retry Logic**
   - Retry automático em caso de falha
   - Exponential backoff

5. **Progress Tracking**
   - Firestore real-time para progresso
   - "Processando... 60%"

## 🎯 Comandos Úteis

```bash
# Compilar functions localmente
cd functions
npm run build

# Testar localmente com emulador
npm run serve

# Deploy manual (se GitHub Actions falhar)
firebase deploy --only functions:generateReportBackground

# Ver logs em tempo real
firebase functions:log --only generateReportBackground --tail

# Deletar função específica
firebase functions:delete generateReportBackground
```

## ✅ Checklist de Deploy

- [x] TypeScript compila sem erros
- [x] Testes locais passando
- [ ] Service account configurado no GitHub Secrets
- [ ] Push para main OU trigger manual do workflow
- [ ] Verificar deploy no Firebase Console
- [ ] Testar geração de relatório em produção
- [ ] Monitorar logs por 24h

---

**Autor:** Replit Agent  
**Data:** 24 de novembro de 2025  
**Versão:** 1.0.0
