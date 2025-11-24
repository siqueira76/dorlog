# 📊 Índices Firestore Necessários para FibroDiário

Este documento lista todos os índices compostos (composite indexes) que precisam ser criados no Firestore para o funcionamento correto da aplicação.

## 🔥 Como Criar Índices no Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto **FibroDiário**
3. Navegue para **Firestore Database** → **Indexes** (aba superior)
4. Clique em **Create Index** (ou "Criar Índice")
5. Configure conforme as especificações abaixo

---

## 📋 Índices Obrigatórios

### 1. **Histórico de Relatórios (Recent Reports)**

**Collection ID:** `relatorios_historico`

**Campos indexados:**
- `userId` - **Ascending** (crescente)
- `generatedAt` - **Descending** (decrescente)

**Query Scope:** Collection

**Usado em:**
- Hook `useRecentReports` (Home page)
- Query: `where('userId', '==', uid).orderBy('generatedAt', 'desc').limit(3)`

**Como criar:**
```javascript
// Collection: relatorios_historico
// Fields indexed:
//   - userId (Ascending)
//   - generatedAt (Descending)
// Query scope: Collection
```

**Status:** ⚠️ **CRÍTICO - Necessário para "Últimos Relatórios" funcionar**

---

## 🚀 Criação Automática via Console

Ao executar a query pela primeira vez no ambiente de desenvolvimento, o Firestore mostrará um erro com um **link direto** para criar o índice automaticamente.

**Exemplo de erro:**
```
FAILED_PRECONDITION: The query requires an index. 
You can create it here: https://console.firebase.google.com/v1/...
```

**Solução rápida:**
1. Copie o link do erro
2. Cole no navegador
3. Clique em "Create Index"
4. Aguarde 2-5 minutos para propagação

---

## 📝 Verificar Índices Criados

1. Firebase Console → Firestore → **Indexes**
2. Verifique se há algum índice com status **"Building"**
3. Aguarde até status mudar para **"Enabled"**
4. Teste a query novamente na aplicação

---

## 🔍 Monitoramento de Performance

Após criar os índices, monitore o desempenho:

- Firebase Console → **Firestore** → **Usage** tab
- Verifique **Read/Write operations**
- Monitore **Query performance** no painel

---

**Última atualização:** 24 de Novembro de 2025  
**Mantido por:** Equipe FibroDiário
