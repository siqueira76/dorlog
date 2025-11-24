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

**⚠️ CRÍTICO - Necessário para "Últimos Relatórios" funcionar**

#### 📝 **Configuração Passo a Passo (Interface em Português)**

**Campos para indexar:**

| # | Campo | Valor a Preencher | Dropdown de Ordenação |
|---|-------|-------------------|-----------------------|
| **1** | Collection ID | `relatorios_historico` | **Crescente** ▼ |
| **2** | Caminho do campo | `userId` | **Crescente** ▼ |
| **3** | Caminho do campo | `generatedAt` | **Decrescente** ▼ |

#### 🎯 **Instruções Exatas**

1. **Campo 1 (Collection ID):**
   - Deixe como `relatorios_historico`
   - Dropdown: **Crescente**

2. **Campo 2 (clique em "Adicionar campo"):**
   - **Caminho do campo:** Digite `userId`
   - **Dropdown:** Selecione **Crescente**

3. **Campo 3 (clique em "Adicionar campo" novamente):**
   - **Caminho do campo:** Digite `generatedAt`
   - **Dropdown:** Selecione **Decrescente**

4. **Query Scope:** Deixe como padrão (Collection)

5. Clique em **"Criar"** ou **"Create"**

#### 📌 **Informações Técnicas**

**Usado em:**
- Hook `useRecentReports` (Home page)
- Query: `where('userId', '==', uid).orderBy('generatedAt', 'desc').limit(3)`

**Tradução dos termos:**
- **Crescente** = Ascending (ordem A→Z, 0→9)
- **Decrescente** = Descending (ordem Z→A, 9→0)
- **Matrizes** = Array contains (para arrays)

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
