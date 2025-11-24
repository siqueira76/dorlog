# 💰 Análise de Custos Detalhada - FibroDiário Freemium

**Data:** 24 de novembro de 2025  
**Análise:** Custos operacionais e projeções de receita

---

## 📊 Estrutura de Custos

### 1. Custos Fixos Mensais

#### Firebase (Google Cloud)
```
Plano: Blaze (Pay as you go)
Baseline: R$ 100-200/mês

Inclui:
- Firestore: 50K reads/day grátis
- Auth: Ilimitado usuários
- Storage: 5GB grátis
- FCM: Ilimitado (push notifications)
- Functions: 2M invocações grátis
```

#### Neon Database (PostgreSQL)
```
Plano: Pro (se necessário)
Custo: R$ 50-100/mês

Specs:
- 10GB storage
- Autoscaling compute
- Point-in-time recovery
- 99.9% uptime SLA
```

#### Stripe
```
Plano: Pay as you go
Custo base: R$ 0

Fees:
- 2.9% + R$ 0,30 por transação
- Sem taxas mensais fixas
- Sem taxas de setup
```

#### Hosting
```
Frontend: Vercel/Netlify Free Tier
Backend: Replit/Railway Free Tier
Total: R$ 0
```

**Total Fixo: R$ 150-300/mês**

---

### 2. Custos Variáveis (Por Usuário)

#### Usuário Free

**Firestore Reads/Writes:**
```
Ações diárias:
- Login: 1 read (usuarios)
- View Home: 2 reads (medications, doctors)
- Quiz matinal: 1 write + 1 read
- Quiz noturno: 1 write + 1 read
- View histórico: 5 reads (últimos 30 dias)

Total/dia: ~11 operações
Total/mês: ~330 operações
Custo: R$ 0,002/mês (dentro do free tier)
```

**Storage:**
```
Quiz data: ~2KB/dia
Histórico 30 dias: ~60KB
Total: Negligível (dentro do free tier)
```

**Total por usuário Free: ~R$ 0,002/mês**

---

#### Usuário Premium

**Firestore Reads/Writes:**
```
Ações diárias:
- Mesmas ações Free: 11 ops
- NLP Analysis: 3 reads (histórico completo)
- Advanced Reports: 10 reads (query complexas)
- Export data: 5 reads

Total/dia: ~29 operações
Total/mês: ~870 operações
Custo: R$ 0,005/mês
```

**Cloud Functions (NLP):**
```
Processamento NLP:
- 1 função/relatório mensal
- Duração: ~30s
- Memória: 512MB

Custo: R$ 0,10/relatório
```

**Storage (Relatórios HTML):**
```
Relatórios mensais: 3-5 PDFs
Tamanho médio: 500KB
Total: R$ 0,01/mês
```

**Stripe Fee:**
```
Transação mensal: R$ 19,90
Fee: R$ 19,90 × 2,9% + R$ 0,30 = R$ 0,88
```

**Total por usuário Premium: ~R$ 1,04/mês**

---

## 💸 Receita vs Custos

### Cenário Base (1000 novos usuários/mês)

#### Mês 1
```
Novos usuários: 1000
Trial conversão: 15% = 150 Premium

Receita:
150 × R$ 19,90 = R$ 2.985,00

Custos:
- Fixos: R$ 200
- Variáveis Free (850): R$ 1,70
- Variáveis Premium (150): R$ 156
- Total: R$ 357,70

Lucro: R$ 2.627,30
Margem: 88%
```

#### Mês 3
```
Total usuários: 3000
Premium: 450 (15% conversão acumulada)

Receita:
450 × R$ 19,90 = R$ 8.955,00

Custos:
- Fixos: R$ 200
- Variáveis Free (2550): R$ 5,10
- Variáveis Premium (450): R$ 468
- Total: R$ 673,10

Lucro: R$ 8.281,90
Margem: 92,5%
```

#### Mês 6
```
Total usuários: 6000
Premium: 900

Receita: R$ 17.910,00
Custos: R$ 1.146,20
Lucro: R$ 16.763,80
Margem: 93,6%
```

#### Mês 12
```
Total usuários: 12000
Premium: 1800

Receita: R$ 35.820,00
Custos: R$ 2.092,40
Lucro: R$ 33.727,60
Margem: 94,2%
```

---

## 📈 Projeções de Crescimento

### Cenário Conservador (500 usuários/mês)

| Mês | Total Users | Premium | MRR | Custos | Lucro | Margem |
|-----|-------------|---------|-----|--------|-------|--------|
| 1 | 500 | 75 | R$ 1.493 | R$ 278 | R$ 1.215 | 81% |
| 6 | 3000 | 450 | R$ 8.955 | R$ 673 | R$ 8.282 | 92% |
| 12 | 6000 | 900 | R$ 17.910 | R$ 1.146 | R$ 16.764 | 94% |
| 18 | 9000 | 1350 | R$ 26.865 | R$ 1.619 | R$ 25.246 | 94% |
| 24 | 12000 | 1800 | R$ 35.820 | R$ 2.092 | R$ 33.728 | 94% |

**ARR (Ano 2):** R$ 429.840  
**Lucro Anual:** ~R$ 404.736

---

### Cenário Otimista (2000 usuários/mês)

| Mês | Total Users | Premium | MRR | Custos | Lucro | Margem |
|-----|-------------|---------|-----|--------|-------|--------|
| 1 | 2000 | 300 | R$ 5.970 | R$ 512 | R$ 5.458 | 91% |
| 6 | 12000 | 1800 | R$ 35.820 | R$ 2.092 | R$ 33.728 | 94% |
| 12 | 24000 | 3600 | R$ 71.640 | R$ 3.984 | R$ 67.656 | 94% |
| 18 | 36000 | 5400 | R$ 107.460 | R$ 5.876 | R$ 101.584 | 95% |
| 24 | 48000 | 7200 | R$ 143.280 | R$ 7.768 | R$ 135.512 | 95% |

**ARR (Ano 2):** R$ 1.719.360  
**Lucro Anual:** ~R$ 1.626.144

---

## 🎯 Break-Even Analysis

### Ponto de Equilíbrio

**Custos fixos:** R$ 200/mês

**Receita necessária:**
```
Break-even = Custos Fixos / (1 - Margem Variável)
           = R$ 200 / (1 - 0,05)
           = R$ 210,53

Usuários Premium necessários:
R$ 210,53 / R$ 19,90 = ~11 usuários
```

**Atingido:** Mês 1 (150 Premium) ✅

---

### Escalabilidade de Custos

```
Por cada 1000 usuários Premium adicionais:

Custos variáveis:
- Firestore: R$ 5
- Storage: R$ 10
- Functions: R$ 100
- Stripe fees: R$ 880
- Total: R$ 995

Receita:
1000 × R$ 19,90 = R$ 19.900

Margem incremental: R$ 18.905 (95%)
```

**Conclusão:** Sistema escala muito bem. Custos crescem linearmente mas margem permanece ~95%.

---

## 💳 Análise Stripe Detalhada

### Fee Structure

```
Transação Premium (R$ 19,90):
- Taxa percentual: 2,9% = R$ 0,58
- Taxa fixa: R$ 0,30
- Total fee: R$ 0,88
- Líquido: R$ 19,02 (95,6%)
```

### Custos Adicionais Stripe

**Chargebacks:**
```
Taxa de disputa: R$ 15,00 cada
Estimativa: 0,1% das transações
Custo/1000 usuários: R$ 15
```

**Failed Payments:**
```
Retry automático: Grátis
Email dunning: Grátis
Recovery rate: ~70%
```

**International Cards:**
```
Taxa extra: +1,5% cross-border
Custo: R$ 0,30 adicional
Total: R$ 1,18 por transação internacional
```

---

## 🌐 Custos Firebase Detalhados

### Firestore Pricing

```
Leituras:
- Primeiros 50K/dia: Grátis
- Depois: $0,06 / 100K reads
- Conversão BRL: ~R$ 0,30 / 100K reads

Escritas:
- Primeiros 20K/dia: Grátis
- Depois: $0,18 / 100K writes
- Conversão BRL: ~R$ 0,90 / 100K writes
```

**Exemplo 10.000 usuários:**
```
Free users (8500):
- Reads/dia: 8500 × 11 = 93.500
- Writes/dia: 8500 × 4 = 34.000
- Custo reads: Dentro do free tier
- Custo writes: R$ 0,63/dia = R$ 19/mês

Premium users (1500):
- Reads/dia: 1500 × 29 = 43.500
- Writes/dia: 1500 × 6 = 9.000
- Custo reads: Dentro do free tier
- Custo writes: Dentro do free tier

Total Firestore: ~R$ 19/mês
```

### Cloud Storage Pricing

```
Armazenamento:
- Primeiros 5GB: Grátis
- Depois: $0,026 / GB
- Conversão BRL: ~R$ 0,13 / GB

Download:
- Primeiros 1GB/dia: Grátis
- Depois: $0,12 / GB
- Conversão BRL: ~R$ 0,60 / GB
```

**Exemplo 1000 Premium:**
```
Relatórios armazenados:
- 1000 usuários × 3 relatórios/mês × 500KB = 1,5GB
- Custo: Dentro do free tier

Downloads:
- Compartilhamentos: ~10% × 500KB = 50MB/mês
- Custo: Dentro do free tier

Total Storage: R$ 0/mês (dentro do free tier)
```

### Cloud Functions Pricing

```
Invocações:
- Primeiros 2M/mês: Grátis
- Depois: $0,40 / 1M invocations
- Conversão BRL: ~R$ 2,00 / 1M invocations

Compute:
- Primeiros 400K GB-sec/mês: Grátis
- Depois: $0,0000025 / GB-sec
- Conversão BRL: ~R$ 0,000013 / GB-sec
```

**Exemplo NLP Processing (Premium):**
```
1000 usuários Premium:
- Relatórios/mês: 1000 × 1 = 1000
- Função NLP: 30s × 512MB = 15.360 MB-sec = 15 GB-sec
- Total compute: 1000 × 15 = 15.000 GB-sec

Custo:
- Invocações: Dentro do free tier
- Compute: R$ 0,20/mês

Total Functions: R$ 0,20/mês
```

---

## 🔄 Análise de Churn e LTV

### Churn Rate Estimado

**Benchmark SaaS B2C:**
- Mês 1-3: 10-15% (trial ends)
- Mês 4-12: 5-7%
- Mês 12+: 3-5%
- Média anual: ~5%

### Customer Lifetime Value (LTV)

```
LTV = ARPU × (1 / Churn Rate)

Com churn 5%:
LTV = R$ 19,90 × (1 / 0,05)
    = R$ 19,90 × 20
    = R$ 398,00
```

### Customer Acquisition Cost (CAC)

**Orgânico (SEO, Word-of-mouth):**
```
CAC: R$ 0 - R$ 5
LTV:CAC = 398:5 = 79,6:1 ✅
```

**Paid Ads (Google, Facebook):**
```
Estimado CPC: R$ 2,00
Conversion rate: 5%
CAC: R$ 40

LTV:CAC = 398:40 = 9,95:1 ✅
```

**Ideal:** LTV:CAC > 3:1 ✅

---

## 📊 Sensitivity Analysis

### Variação na Conversão Trial→Premium

| Trial Conv | Premium (1k users) | MRR | Lucro Anual |
|------------|-------------------|-----|-------------|
| 10% | 100 | R$ 1.990 | R$ 20.880 |
| 15% | 150 | R$ 2.985 | R$ 31.524 |
| 20% | 200 | R$ 3.980 | R$ 42.168 |
| 25% | 250 | R$ 4.975 | R$ 52.812 |

**Diferença 10%→25%:** +R$ 31.932/ano  
**Impacto:** Conversão é CRÍTICA

---

### Variação no Churn

| Churn | LTV | Payback (CAC R$40) |
|-------|-----|-------------------|
| 3% | R$ 663 | 2 meses |
| 5% | R$ 398 | 2 meses |
| 7% | R$ 284 | 2,1 meses |
| 10% | R$ 199 | 2,4 meses |

**Diferença 3%→10%:** -R$ 464 LTV  
**Impacto:** Moderado (payback ainda <3 meses)

---

### Variação no Preço

| Preço | Conv Esperada | MRR (150) | Lucro Anual |
|-------|---------------|-----------|-------------|
| R$ 14,90 | 18% | R$ 2.682 | R$ 28.344 |
| R$ 19,90 | 15% | R$ 2.985 | R$ 31.524 |
| R$ 24,90 | 12% | R$ 2.988 | R$ 31.560 |
| R$ 29,90 | 10% | R$ 2.990 | R$ 31.584 |

**Sweet spot:** R$ 19,90 - R$ 24,90  
**Recomendação:** Iniciar R$ 19,90, testar R$ 24,90 após validação

---

## 🎯 ROI por Canal

### Marketing de Conteúdo (Blog/SEO)

```
Investimento:
- Redator: R$ 500/mês
- SEO tools: R$ 200/mês
- Total: R$ 700/mês

Resultado esperado (Mês 6):
- Tráfego: 5000 visitas/mês
- Conversão: 2% = 100 signups
- Trial→Premium: 15% = 15 novos Premium

ROI:
Receita: 15 × R$ 19,90 = R$ 298,50/mês
Custo: R$ 700/mês
ROI: -57% (curto prazo)

Ano 1: 
Receita acumulada: R$ 35.820 (15×12×R$19,90)
Custo acumulado: R$ 8.400
ROI: +326% ✅
```

---

### Google Ads

```
Investimento:
- Budget: R$ 2.000/mês
- CPC médio: R$ 2,00
- Clicks: 1000/mês
- Conversão: 5% = 50 signups
- Trial→Premium: 15% = 7,5 novos Premium/mês

ROI:
Receita: 7,5 × R$ 19,90 = R$ 149,25/mês
Custo: R$ 2.000/mês
ROI: -92,5% ❌

LTV (7,5 usuários):
7,5 × R$ 398 = R$ 2.985
Payback: 13 meses (ruim)

Recomendação: Evitar até PMF comprovado
```

---

### Programa de Indicação

```
Incentivo:
- Indicador: 1 mês grátis Premium
- Indicado: 1 mês grátis Premium
- Custo por conversão: R$ 19,90 × 2 = R$ 39,80

Estimativa:
- 10% Premium indicam por mês
- 30% indicados convertem
- Exemplo 100 Premium: 10 indicações × 30% = 3 novos Premium

ROI:
Receita (LTV): 3 × R$ 398 = R$ 1.194
Custo: 3 × R$ 39,80 = R$ 119,40
ROI: +900% ✅✅✅

Recomendação: IMPLEMENTAR ASAP
```

---

## 💡 Otimizações de Custo

### 1. Firestore Query Optimization

**Atual (ineficiente):**
```typescript
// Busca diária individual
for (let i = 0; i < 30; i++) {
  const doc = await getDoc(doc(db, 'report_diario', `${email}_${date}`));
}
// Custo: 30 reads (mesmo sem dados)
```

**Otimizado:**
```typescript
// Query única com range
const reports = await getDocs(query(
  collection(db, 'report_diario'),
  where('usuarioId', '==', userId),
  where('dataTimestamp', '>=', thirtyDaysAgo),
  orderBy('dataTimestamp', 'desc')
));
// Custo: 1 read + número de documentos
// Economia: ~85% em reads
```

**Impacto:**
- 1000 Free users × 30 reads → 5 reads médio
- Economia: 25.000 reads/dia = R$ 0,075/dia = R$ 2,25/mês

---

### 2. CDN para Relatórios

**Problema atual:**
```
Relatórios armazenados em Firebase Storage
Download direto toda vez
Custo bandwidth: Pode escalar rapidamente
```

**Solução:**
```
Cloudflare CDN (Free tier):
- Cache automático de PDFs
- Bandwidth ilimitado grátis
- Reduces Firebase egress

Economia estimada:
1000 Premium × 3 downloads/mês × 500KB = 1,5GB/mês
Economia: R$ 0,90/mês (pequena mas útil)
```

---

### 3. Lazy Loading NLP Analysis

**Atual:**
```
Análise NLP roda automaticamente em todo relatório
Custo: R$ 0,10 × todos os relatórios
```

**Otimizado:**
```
NLP apenas quando usuário abre "Insights Avançados"
Estimativa: 60% nunca abrem
Economia: 40% do custo NLP

1000 Premium:
Custo atual: R$ 100/mês
Custo otimizado: R$ 60/mês
Economia: R$ 40/mês = R$ 480/ano
```

---

## 📋 Checklist de Monitoramento

### Métricas Diárias
- [ ] MRR atual
- [ ] Novos signups
- [ ] Trial conversions
- [ ] Churn rate
- [ ] Failed payments

### Métricas Semanais
- [ ] Custos Firebase
- [ ] Custos Stripe
- [ ] CAC por canal
- [ ] Upgrade trigger analytics

### Métricas Mensais
- [ ] LTV vs CAC
- [ ] Margem de lucro
- [ ] Burn rate (se fundraising)
- [ ] Unit economics
- [ ] Projeção 3 meses

---

## 🎯 Conclusão

### Resumo Executivo

**Modelo Financeiro:**
- ✅ Break-even em <20 usuários Premium
- ✅ Margem de ~94% no steady state
- ✅ Custos escaláveis e previsíveis
- ✅ LTV:CAC excelente (10:1 orgânico)

**Riscos:**
- ⚠️ Conversão Trial→Premium (<10% = problema)
- ⚠️ Churn alto (>7% = insustentável)
- ⚠️ Firebase custos com escala (monitorar)

**Recomendações:**
1. **Foco inicial:** Conversão trial (meta: >15%)
2. **Retention:** Implementar dunning + engagement
3. **Growth:** Orgânico primeiro, ads depois
4. **Pricing:** Testar R$ 24,90 após 6 meses

**Viabilidade:** ✅ **ALTA**  
Modelo sustentável desde o primeiro mês com margem excelente.

---

**Documento:** v1.0.0  
**Última atualização:** 24/11/2025  
**Preparado por:** FibroDiário Financial Analysis Team
