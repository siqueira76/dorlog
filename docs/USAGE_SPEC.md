# 📖 FibroDiário Freemium - Especificação de Uso

**Data:** 24 de novembro de 2025  
**Versão:** 1.0.0

---

## 🎯 Visão Geral

Este documento detalha como os usuários interagem com o sistema freemium do FibroDiário, desde o onboarding até o upgrade e gestão de assinatura.

---

## 👤 Jornada do Usuário

### 1. Novo Usuário - Trial Automático

#### Passo 1: Registro

**Opções de cadastro:**
- Email + senha
- Login com Google

**Experiência:**
```
[Tela de Registro]
┌─────────────────────────────────┐
│ Bem-vindo ao FibroDiário!       │
│                                  │
│ 🎁 Ganhe 14 dias Premium GRÁTIS │
│                                  │
│ ┌──────────────────────┐        │
│ │ Cadastrar com Google │        │
│ └──────────────────────┘        │
│         ou                       │
│ ┌──────────────────────┐        │
│ │ Email                │        │
│ │ Senha                │        │
│ │ [Criar Conta]        │        │
│ └──────────────────────┘        │
└─────────────────────────────────┘
```

#### Passo 2: Onboarding

**Ao completar registro:**
```
✅ Conta criada com sucesso!
🎁 Trial Premium iniciado: 14 dias grátis
📊 Acesso completo a todos os recursos
```

**Trial ativado automaticamente:**
- Sem necessidade de cartão
- Acesso imediato a recursos Premium
- Notificação de boas-vindas
- Badge "Trial Premium" no perfil

---

### 2. Durante o Trial (Dias 1-14)

#### Interface do Usuário

**Header/Navbar:**
```
┌────────────────────────────────────┐
│ 🏠 Home  📊 Relatórios  ⚙️ Perfil  │
│              [Trial Premium 🕐 12d] │
└────────────────────────────────────┘
```

**Home:**
```
┌─────────────────────────────────────┐
│ Olá, Maria!                         │
│ [Trial Premium] Restam 12 dias      │
│                                     │
│ 📊 Seus Dados (Ilimitado)           │
│ 📈 Análise NLP Disponível           │
│ 💊 Medicamentos: 5                  │
│ 👨‍⚕️ Médicos: 4                      │
│                                     │
│ [Gerar Relatório Completo]          │
└─────────────────────────────────────┘
```

**Recursos Habilitados:**
- ✅ Histórico ilimitado
- ✅ Médicos ilimitados
- ✅ Relatórios ilimitados com NLP
- ✅ Exportação avançada (PDF, HTML)
- ✅ Notificações push
- ✅ Suporte prioritário

#### Notificações de Trial

**Dia 12 (3 dias antes do fim):**
```
🕐 Seu trial termina em 3 dias
Não perca acesso aos recursos Premium!
[Fazer Upgrade por R$ 19,90/mês]
```

**Dia 14 (último dia):**
```
⚠️ Último dia de Premium!
Seu trial expira hoje à meia-noite.
Continue com todos os recursos por R$ 19,90/mês.
[Continuar Premium] [Ver Comparação]
```

---

### 3. Trial Expirado - Downgrade para Free

#### Passo 1: Transição Automática

**Meia-noite do Dia 15:**
```
Sistema automaticamente:
1. Altera subscriptionStatus: 'active'
2. Muda subscriptionTier: 'free'
3. Marca trialUsed: true
4. Remove badge Premium
5. Aplica limites Free
```

**Notificação ao usuário:**
```
ℹ️ Seu trial Premium expirou
Agora você está no plano Gratuito.
Ainda pode usar o FibroDiário com algumas limitações.

Plano Gratuito:
• Histórico: 30 dias
• Médicos: até 3
• Relatórios: 1 por mês

[Fazer Upgrade] [Ver Comparação]
```

#### Passo 2: Interface Free Tier

**Home:**
```
┌─────────────────────────────────────┐
│ Olá, Maria!                         │
│ Plano: Gratuito                     │
│                                     │
│ ⚠️ Histórico limitado a 30 dias     │
│ [Upgrade para ver tudo]             │
│                                     │
│ 📊 Dados Recentes (30 dias)         │
│ 💊 Medicamentos: 3/3 (limite)       │
│ 👨‍⚕️ Médicos: 2/3                     │
│                                     │
│ [Ver Histórico Limitado]            │
└─────────────────────────────────────┘
```

**Limites Aplicados:**
- ⚠️ Histórico: Apenas 30 dias (dados antigos ocultos)
- ⚠️ Médicos: Máximo 3 (botão "Adicionar" desabilitado)
- ⚠️ Relatórios: 1 por mês (contador visível)
- ❌ Análise NLP: Bloqueada
- ❌ Relatórios avançados: Bloqueados
- ❌ Exportação PDF/HTML: Bloqueada

---

### 4. Interação com Limites Free

#### Limite de Histórico (30 dias)

**Página de Relatórios:**
```
┌─────────────────────────────────────┐
│ 📊 Meus Relatórios                  │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ ⚠️ Histórico Limitado         │    │
│ │ Plano gratuito: 30 dias       │    │
│ │ Upgrade para acesso completo  │    │
│ │ [Fazer Upgrade - R$ 19,90/mês]│    │
│ └─────────────────────────────┘    │
│                                     │
│ Dados disponíveis:                  │
│ • 24/11/2025 - Hoje                 │
│ • 23/11/2025                        │
│ • ...                               │
│ • 25/10/2025 (30 dias atrás)        │
│                                     │
│ Dados ocultos: 120 dias anteriores  │
└─────────────────────────────────────┘
```

#### Limite de Médicos (3 máximo)

**Tentativa de adicionar 4º médico:**
```
┌─────────────────────────────────────┐
│ ⚠️ Limite Atingido                  │
│                                     │
│ Você atingiu o limite de 3 médicos  │
│ do plano Gratuito.                  │
│                                     │
│ Com Premium:                        │
│ • Cadastre quantos médicos precisar │
│ • Organize suas consultas           │
│ • Relatórios completos por médico   │
│                                     │
│ [Fazer Upgrade] [Ver Benefícios]    │
└─────────────────────────────────────┘
```

**Lista de Médicos (Free com 3):**
```
┌─────────────────────────────────────┐
│ 👨‍⚕️ Meus Médicos (3/3)              │
│                                     │
│ [➕ Adicionar] ← Desabilitado       │
│    ℹ️ Limite atingido (max 3)       │
│                                     │
│ 1. Dr. João Silva - Reumatologia    │
│ 2. Dra. Ana Costa - Fisioterapia    │
│ 3. Dr. Pedro Santos - Clínico Geral │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Precisa cadastrar mais médicos?     │
│ [Fazer Upgrade para ilimitado]      │
└─────────────────────────────────────┘
```

#### Limite de Relatórios (1/mês)

**Tentativa de gerar 2º relatório:**
```
┌─────────────────────────────────────┐
│ ⚠️ Quota Mensal Atingida            │
│                                     │
│ Você já gerou 1 relatório este mês. │
│ Próximo disponível: 01/12/2025      │
│                                     │
│ Com Premium:                        │
│ • Relatórios ilimitados             │
│ • Análise NLP com IA                │
│ • Insights avançados de saúde       │
│                                     │
│ [Fazer Upgrade - R$ 19,90/mês]      │
│ [Ver Exemplo de Relatório Premium]  │
└─────────────────────────────────────┘
```

#### Feature Bloqueada (NLP)

**Tentativa de acessar NLP:**
```
┌─────────────────────────────────────┐
│ 🔒 Recurso Premium                  │
│                                     │
│ Análise NLP com Inteligência        │
│ Artificial está disponível apenas   │
│ no plano Premium.                   │
│                                     │
│ Com NLP você tem:                   │
│ ✨ Análise de sentimentos            │
│ 📊 Padrões de sintomas              │
│ 🎯 Sugestões personalizadas         │
│ 📈 Predição de crises               │
│                                     │
│ [Começar Trial 14 dias] ← Se não usou│
│ [Fazer Upgrade - R$ 19,90/mês]      │
└─────────────────────────────────────┘
```

---

### 5. Processo de Upgrade

#### Passo 1: Decisão de Upgrade

**Triggers de conversão:**
1. Banner no topo (sempre visível)
2. Modal ao atingir limite
3. Card promocional na Home
4. CTAs contextuais

**Modal de Upgrade:**
```
┌─────────────────────────────────────┐
│ 👑 Upgrade para Premium              │
│                                     │
│ R$ 19,90/mês                        │
│ Cancele quando quiser               │
│                                     │
│ ✅ Histórico ilimitado               │
│ ✅ Médicos ilimitados                │
│ ✅ Relatórios ilimitados + NLP       │
│ ✅ Exportação avançada               │
│ ✅ Notificações push                 │
│ ✅ Suporte prioritário               │
│                                     │
│ [Começar Agora] [Ver Comparação]    │
└─────────────────────────────────────┘
```

#### Passo 2: Checkout Stripe

**Clique em "Começar Agora":**
```
1. Redireciona para Stripe Checkout
2. Email pré-preenchido
3. Formulário de pagamento Stripe
4. Opções: Cartão, PIX, boleto
```

**Stripe Checkout:**
```
┌─────────────────────────────────────┐
│ Checkout Seguro - Stripe            │
│                                     │
│ FibroDiário Premium                 │
│ R$ 19,90/mês                        │
│                                     │
│ maria@email.com ← Pré-preenchido    │
│                                     │
│ Método de pagamento:                │
│ [💳 Cartão] [📱 PIX] [🏦 Boleto]    │
│                                     │
│ Cobrança mensal automática          │
│ Cancele quando quiser               │
│                                     │
│ [Confirmar Pagamento]               │
└─────────────────────────────────────┘
```

#### Passo 3: Confirmação

**Pagamento aprovado:**
```
✅ Pagamento confirmado!

Bem-vindo ao Premium! 🎉

Seu acesso Premium foi ativado e você já pode aproveitar todos os recursos.

[Voltar ao FibroDiário]
```

**Webhook backend:**
```typescript
// Stripe envia webhook:
checkout.session.completed

// Backend atualiza Firestore:
{
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
  isSubscriptionActive: true,
  stripeCustomerId: 'cus_xxxxx',
  stripeSubscriptionId: 'sub_xxxxx'
}
```

#### Passo 4: Interface Premium Ativada

**Home após upgrade:**
```
┌─────────────────────────────────────┐
│ Olá, Maria!                         │
│ [Premium 👑] Desde 24/11/2025       │
│                                     │
│ 📊 Dados Completos (Ilimitado)      │
│ ✨ Análise NLP Ativa                │
│ 💊 Medicamentos: 5                  │
│ 👨‍⚕️ Médicos: 4 (sem limite)          │
│                                     │
│ [Gerar Relatório com NLP]           │
│ [Gerenciar Assinatura]              │
└─────────────────────────────────────┘
```

**Badge Premium:**
- Aparece no header
- Cor: Gradient amber→orange
- Ícone: Crown (👑)
- Texto: "Premium"

---

### 6. Gestão de Assinatura (Premium)

#### Customer Portal Stripe

**Acesso:**
```
Perfil > Assinatura > [Gerenciar Assinatura]
  ↓
Redireciona para Stripe Customer Portal
```

**Customer Portal:**
```
┌─────────────────────────────────────┐
│ Gerenciar Assinatura - Stripe      │
│                                     │
│ Status: Ativa ✅                    │
│ Próxima cobrança: 24/12/2025        │
│ Valor: R$ 19,90                     │
│                                     │
│ Método de pagamento:                │
│ •••• 1234 (Visa)                    │
│ [Atualizar Cartão]                  │
│                                     │
│ Histórico de faturas:               │
│ • 24/11/2025 - R$ 19,90 ✅          │
│                                     │
│ [Cancelar Assinatura]               │
└─────────────────────────────────────┘
```

#### Cancelamento

**Fluxo de cancelamento:**
```
1. Clique "Cancelar Assinatura"
   ↓
2. Modal de confirmação:
   "Tem certeza? Você perderá acesso a:
   • Histórico completo
   • Análise NLP
   • Relatórios ilimitados"
   [Sim, Cancelar] [Não, Manter]
   ↓
3. Webhook: customer.subscription.deleted
   ↓
4. Backend atualiza:
   subscriptionStatus: 'canceled'
   isSubscriptionActive: false
   subscriptionEndDate: now()
   ↓
5. Downgrade imediato para Free
```

**Notificação pós-cancelamento:**
```
ℹ️ Assinatura Cancelada

Sua assinatura Premium foi cancelada.
Você foi movido para o plano Gratuito.

Dados preservados:
• Todo seu histórico foi salvo
• Apenas os últimos 30 dias estão visíveis
• Upgrade novamente para acesso completo

[Ver Plano Gratuito] [Reativar Premium]
```

---

## 🔄 Casos de Uso Específicos

### Usuário com Trial Expirado Tenta Upgrade

**Cenário:** Trial já foi usado

**Experiência:**
```
[Clica em Fazer Upgrade]
  ↓
Redireciona para Stripe Checkout
(Sem novo trial)
  ↓
Pagamento aprovado
  ↓
Premium ativado imediatamente
```

**Não recebe novo trial** porque `trialUsed: true`

---

### Falha no Pagamento

**Scenario:** Cartão recusado

**Stripe comportamento:**
```
1. Primeira tentativa: Falha
   ↓
2. Retry automático após 3 dias
   ↓
3. Retry após 5 dias
   ↓
4. Retry após 7 dias
   ↓
5. Após 3 falhas: Assinatura cancelada
```

**Notificações ao usuário:**
```
⚠️ Falha no Pagamento

Seu pagamento de R$ 19,90 não foi processado.
Por favor, atualize seu método de pagamento.

[Atualizar Cartão] [Usar Outro Método]
```

**Se assinatura cancelada:**
```
❌ Assinatura Suspensa

Após 3 tentativas de pagamento, sua assinatura foi suspensa.

Você foi movido para o plano Gratuito.
Reative quando quiser!

[Reativar Premium]
```

---

### Reativação após Cancelamento

**Cenário:** Usuário cancelou e quer voltar

**Experiência:**
```
Perfil > Assinatura
  ↓
Status: Cancelada
[Reativar Premium]
  ↓
Checkout Stripe novamente
  ↓
Pagamento aprovado
  ↓
Premium reativado imediatamente
```

**Benefícios:**
- Histórico completo restaurado
- Limites removidos
- NLP disponível novamente

---

## 📱 Mobile/PWA

### Notificações Push (Premium)

**Free tier:**
```
Configurações > Notificações
  ↓
🔒 Notificações Push - Premium

Recurso disponível apenas no plano Premium.
[Fazer Upgrade]
```

**Premium:**
```
Configurações > Notificações
  ↓
✅ Notificações Push Ativadas

• Quiz matinal: 08:00
• Quiz noturno: 20:00
• Lembretes de medicamento
• Insights de saúde

[Gerenciar Notificações]
```

---

## 🎨 Elementos Visuais

### Badges e Indicators

**Trial Premium:**
```
Gradient: blue → indigo
Ícone: Clock 🕐
Texto: "Trial Premium"
Extra: "X dias restantes"
```

**Premium:**
```
Gradient: amber → orange
Ícone: Crown 👑
Texto: "Premium"
```

**Free:**
```
Sem badge visível
Texto discreto: "Plano Gratuito" (apenas em Perfil)
```

### CTAs de Upgrade

**Primário (bloqueio hard):**
```
Cor: Gradient amber→orange
Texto: "Fazer Upgrade - R$ 19,90/mês"
Tamanho: lg
Posição: Centro do modal
```

**Secundário (soft prompt):**
```
Cor: Outline amber
Texto: "Ver Benefícios Premium"
Tamanho: default
Posição: Banner no topo
```

**Terciário (link):**
```
Cor: Text amber-600
Texto: "Saiba mais sobre Premium"
Sublinhado ao hover
```

---

## 🔐 Segurança e Privacidade

### Dados do Usuário

**Downgrade Free:**
- ✅ Todos os dados preservados
- ⚠️ Apenas últimos 30 dias visíveis
- ✅ Dados antigos recuperáveis com upgrade

**Cancelamento:**
- ✅ Dados não são deletados
- ✅ Usuário pode exportar antes de cancelar
- ✅ Reativação restaura acesso completo

### Pagamentos

**Stripe PCI Compliance:**
- 🔒 Dados de cartão nunca passam pelo backend
- 🔒 Tokens Stripe usados internamente
- 🔒 3D Secure habilitado
- 🔒 Fraud detection automático

---

## 📊 Métricas de Sucesso

### Indicadores de UX

**Conversão Trial→Premium:**
- Meta: >15%
- Bom: >20%
- Excelente: >25%

**Time to Upgrade:**
- Ideal: Dentro do trial (dias 1-14)
- Aceitável: Até 30 dias após trial
- Problema: >30 dias = UX ruim

**Feature Discovery:**
- NLP: >60% descobrem durante trial
- Relatórios Avançados: >50%
- Exportação: >40%

---

## ✅ Checklist de Testes

### Fluxo Completo

- [ ] Registro novo usuário
- [ ] Trial iniciado automaticamente
- [ ] Badge "Trial Premium" aparece
- [ ] Todos recursos Premium funcionam
- [ ] Notificação "3 dias restantes"
- [ ] Trial expira e downgrade automático
- [ ] Limites Free aplicados corretamente
- [ ] Modal de upgrade ao atingir limite
- [ ] Checkout Stripe funciona
- [ ] Webhook ativa Premium
- [ ] Badge "Premium" aparece
- [ ] Limites removidos
- [ ] Customer Portal acessível
- [ ] Cancelamento funciona
- [ ] Downgrade para Free funciona
- [ ] Reativação funciona

---

## 🎯 Conclusão

Sistema freemium completo com experiência de usuário otimizada para conversão. Trial automático reduz fricção no onboarding, limites estratégicos criam pontos de conversão naturais, e processo de upgrade é simples e transparente.

**Próximos passos:**
1. Implementar analytics detalhado
2. A/B test de CTAs
3. Otimizar pontos de conversão
4. Monitorar métricas de engagement

---

**Documentação:** v1.0.0  
**Última atualização:** 24/11/2025
