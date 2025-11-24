# Regras de Segurança do Firestore para DorLog

Para que o sistema de quiz funcione corretamente, você precisa configurar as seguintes regras de segurança no Firebase Console.

## Como Configurar

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Clique na aba **Rules**
5. Substitua o conteúdo pelas regras abaixo:

## Regras de Segurança Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para usuários autenticados
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Regras para usuários - permite leitura e escrita dos próprios dados
    match /usuarios/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Regras para assinaturas - permite leitura dos próprios dados de assinatura
    match /assinaturas/{email} {
      allow read: if isAuthenticated() && request.auth.token.email == email;
    }
    
    // Regras para médicos - permite CRUD dos próprios médicos
    match /medicos/{medicoId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.usuarioId;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.usuarioId;
    }
    
    // Regras para medicamentos - permite CRUD dos próprios medicamentos
    match /medicamentos/{medicamentoId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.usuarioId;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.usuarioId;
    }
    
    // Regras para quizzes - permite leitura para usuários autenticados
    match /quizzes/{quizId} {
      allow read: if isAuthenticated();
    }
    
    // Regras para respostas de quiz (se implementado no futuro)
    match /quiz_responses/{responseId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Estrutura da Coleção Quizzes

Para criar o quiz matinal, adicione o seguinte documento na coleção `quizzes`:

**Nome do Documento:** `matinal`

**Dados do Documento:**
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
    },
    "5": {
      "id": 5,
      "texto": "Descreva brevemente como você está se sentindo:",
      "tipo": "texto"
    }
  }
}
```

## Tipos de Pergunta Suportados

- **opcoes**: Múltipla escolha (uma opção)
- **eva**: Escala visual analógica (0-10)
- **slider**: Controle deslizante customizado
- **checkbox**: Múltipla escolha (várias opções)
- **texto**: Campo de texto livre
- **emojis**: Seleção baseada em emojis
- **imagem**: Upload de imagem (em desenvolvimento)

## Status Atual

✅ **Sistema implementado com fallback**: Se as regras de segurança não estiverem configuradas ou o documento não existir, o sistema usa um quiz de demonstração automaticamente.

⚠️ **Para produção**: Configure as regras de segurança e crie o documento do quiz no Firestore para usar dados reais.