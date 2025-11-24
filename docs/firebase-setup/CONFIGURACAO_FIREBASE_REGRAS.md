# ✅ Configuração das Regras do Firebase - SOLUÇÃO DEFINITIVA

## 🚨 ERRO ATUAL
```
FirebaseError: Missing or insufficient permissions (permission-denied)
```

## 📋 PASSOS PARA CORRIGIR

### 1. Acesse o Firebase Console
- Vá para: https://console.firebase.google.com
- Selecione seu projeto DorLog

### 2. Configure as Regras do Firestore
1. No menu lateral, clique em **"Firestore Database"**
2. Clique na aba **"Rules"** (Regras)
3. **SUBSTITUA** todo o conteúdo atual pelas regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir leitura e escrita para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Publique as Regras
- Clique no botão **"Publish"** (Publicar)
- Aguarde a confirmação de que as regras foram aplicadas

## 🎯 SOLUÇÃO ESPECÍFICA PARA O QUIZ

Se preferir regras mais restritivas, use esta configuração:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuários podem acessar seus próprios dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Assinaturas - leitura por email
    match /assinaturas/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
    }
    
    // QUIZZES - LEITURA PARA TODOS OS USUÁRIOS AUTENTICADOS
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
    }
    
    // Respostas de quiz - usuário pode salvar suas próprias respostas
    match /quiz_responses/{responseId} {
      allow read, write: if request.auth != null;
    }
    
    // Report diário - usuários podem criar e acessar seus próprios relatórios
    match /report_diario/{reportId} {
      allow read, write: if request.auth != null && request.auth.token.email in reportId;
    }
  }
}
```

## 📂 CRIAR O DOCUMENTO DO QUIZ

Após configurar as regras, crie o documento do quiz:

### 1. No Firestore Database:
- Clique em **"Start collection"**
- Nome da coleção: `quizzes`
- ID do documento: `matinal`

### 2. Adicione os seguintes dados:

🚨 **ATENÇÃO**: Você deve criar TODOS os campos, especialmente o campo `perguntas`

```json
{
  "nome": "Quiz Matinal",
  "disparo": "notificacao",
  "perguntas": {
    "1": {
      "id": 1,
      "texto": "Como você se sente ao acordar hoje?",
      "tipo": "emojis"
    },
    "2": {
      "id": 2,
      "texto": "Qual é o seu nível de dor neste momento? (0 = sem dor, 10 = dor máxima)",
      "tipo": "eva"
    },
    "3": {
      "id": 3,
      "texto": "Que sintomas você está sentindo hoje?",
      "tipo": "checkbox",
      "opcoes": ["Dor de cabeça", "Náusea", "Fadiga", "Dor muscular", "Ansiedade", "Nenhum"]
    },
    "4": {
      "id": 4,
      "texto": "Como foi sua qualidade de sono na noite passada?",
      "tipo": "opcoes",
      "opcoes": ["Muito ruim", "Ruim", "Regular", "Boa", "Excelente"]
    }
  }
}
```

### 🎯 ESTRUTURA IDENTIFICADA NA IMAGEM
O usuário criou corretamente a estrutura com **subcoleção**:

```
📂 quizzes (coleção)
 └── 📄 matinal (documento)
     ├── nome: "Quiz Matinal"  
     ├── disparo: "notificacao"
     └── 📂 perguntas (subcoleção)
          ├── 📄 1 (documento com dados da pergunta)
          └── 📄 2 (documento com dados da pergunta)
```

### ✅ FORMATO CORRETO PARA CADA PERGUNTA
Cada documento na subcoleção `perguntas` deve ter:

**Documento ID: `1`**
```json
{
  "id": 1,
  "texto": "Como você dormiu?",
  "tipo": "opcoes",
  "opcoes": ["Bom", "Médio", "Ruim", "Não dormi"]
}
```

**Documento ID: `2`**  
```json
{
  "id": 2,
  "texto": "Qual seu nível de dor?",
  "tipo": "eva"
}
```

O código foi atualizado para funcionar com subcoleções!

## ⚡ TESTE RÁPIDO

Para testar se funcionou:
1. Salve as regras no Firebase
2. Recarregue a página do DorLog
3. Clique em "Diário Manhã"
4. Você deve ver o quiz carregando sem erros

## 🔧 RESULTADO ESPERADO

Após a configuração, você verá nos logs:
- ✅ "Documento do quiz encontrado"
- ✅ "Quiz carregado com sucesso"

Em vez de:
- ❌ "permission-denied"