# 🔄 INSTRUÇÕES DE MIGRAÇÃO - REPORT_DIARIO

## 📋 **OVERVIEW**
Este documento contém instruções detalhadas para migrar a collection `report_diario` de identificação por **email** para identificação por **Firebase UID**.

## 🚨 **ATENÇÃO - LEIA ANTES DE CONTINUAR**
- ⚠️ **Esta migração é IRREVERSÍVEL sem backup**
- ⚠️ **Execute APENAS em horário de baixo tráfego (2-6h da madrugada)**
- ⚠️ **Usuários não devem usar o sistema durante a migração**
- ⚠️ **Tenha um backup completo antes de iniciar**

## 📅 **CRONOGRAMA RECOMENDADO**
```
Preparação: 1-2 horas
Backup: 2-3 horas  
Migração: 4-8 horas
Validação: 1-2 horas
TOTAL: 8-15 horas
```

---

## 🔧 **PRÉ-REQUISITOS**

### 1. Ambiente de Desenvolvimento
```bash
# Node.js 18+ instalado
node --version

# Firebase CLI instalado e autenticado
npm install -g firebase-tools
firebase login
```

### 2. Acesso ao Console Firebase
- Acesso administrativo ao projeto Firebase
- Permissões para export/import de dados
- Configuração das regras de segurança (temporariamente mais permissivas)

### 3. Configuração do Script
```bash
# Copie o arquivo migration-script.js para seu projeto
cp migration-script.js ./

# Configure as credenciais Firebase no script
# Edite migration-script.js e adicione seu firebaseConfig
```

---

## 📦 **ETAPA 1: BACKUP COMPLETO**

### 1.1 Backup via Firebase CLI
```bash
# Backup da collection report_diario
firebase firestore:export gs://seu-bucket/backup/report_diario_$(date +%Y%m%d_%H%M%S) \
  --collection-ids=report_diario

# Backup da collection usuarios (para resolução de emails)
firebase firestore:export gs://seu-bucket/backup/usuarios_$(date +%Y%m%d_%H%M%S) \
  --collection-ids=usuarios

# Backup completo (recomendado)
firebase firestore:export gs://seu-bucket/backup/full_backup_$(date +%Y%m%d_%H%M%S)
```

### 1.2 Backup via Console Firebase
1. Acesse Firebase Console → Firestore Database
2. Vá em Settings → Export/Import
3. Selecione collections: `report_diario`, `usuarios`
4. Exporte para Cloud Storage
5. **Anote a URL do backup** para possível restore

### 1.3 Validação do Backup
```bash
# Verifique se os arquivos foram criados
gsutil ls gs://seu-bucket/backup/

# Valide o tamanho dos arquivos
gsutil du -sh gs://seu-bucket/backup/report_diario_*
```

---

## 🔍 **ETAPA 2: ANÁLISE PRÉ-MIGRAÇÃO**

### 2.1 Executar Análise
```bash
# Execute o script em modo análise apenas
node migration-script.js --analyze-only
```

### 2.2 Revisar Resultados
O script deve mostrar:
- Total de documentos encontrados
- Quantos são baseados em email vs UID
- Lista de emails órfãos (sem UID correspondente)
- Estimativa de tempo de migração

### 2.3 Resolver Emails Órfãos (se necessário)
Se houver emails órfãos, você tem opções:
```bash
# Opção 1: Criar documentos de usuário em falta
# Opção 2: Excluir dados órfãos manualmente
# Opção 3: Migrar para uma collection separada (orphaned_data)
```

---

## ⚡ **ETAPA 3: EXECUÇÃO DA MIGRAÇÃO**

### 3.1 Configurar Janela de Manutenção
```bash
# 1. Notificar usuários 72h antes
# 2. Colocar sistema em modo manutenção
# 3. Confirmar que não há usuários ativos
```

### 3.2 Configurar Regras Temporárias
```javascript
// Regras temporárias mais permissivas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3.3 Executar Migração
```bash
# Execute a migração completa
node migration-script.js --execute

# OU execute por etapas para controle maior
node migration-script.js --step=1  # Análise
node migration-script.js --step=2  # Resolução de emails
node migration-script.js --step=3  # Migração
node migration-script.js --step=4  # Validação
```

### 3.4 Monitoramento Durante Execução
- Acompanhe os logs em tempo real
- Verifique uso de CPU/Memória do Firestore
- Monitore mensagens de erro
- Prepare rollback se necessário

---

## ✅ **ETAPA 4: VALIDAÇÃO PÓS-MIGRAÇÃO**

### 4.1 Verificação Automática
```bash
# O script automaticamente validará:
# - Integridade dos dados migrados
# - Remoção de documentos antigos
# - Consistência dos campos usuarioId
# - Preservação de dados de quizzes e medicamentos
```

### 4.2 Verificação Manual
```javascript
// Console Firebase - Query para verificar
// Collection: report_diario

// 1. Contar documentos com pattern antigo (email_date)
// Deve retornar 0
where('__name__', '>=', 'a@')
where('__name__', '<', 'z@')

// 2. Contar documentos com pattern novo (uid_date)
// Deve retornar total esperado
where('usuarioId', '!=', '')

// 3. Verificar campo migrated existe
where('migrated', '==', true)
```

### 4.3 Teste de Funcionalidade
```bash
# 1. Fazer login com usuário teste
# 2. Completar um quiz
# 3. Marcar medicamento como tomado
# 4. Gerar relatório
# 5. Verificar se dados aparecem corretamente
```

---

## 🔄 **ETAPA 5: ATIVAÇÃO DO SISTEMA OTIMIZADO**

### 5.1 Restaurar Regras de Segurança
```javascript
// Restaurar regras originais
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Suas regras originais aqui
  }
}
```

### 5.2 Remover Modo Manutenção
```bash
# Reativar sistema para usuários
# Remover avisos de manutenção
```

### 5.3 Monitoramento Intensivo
- Monitore por 24-48h após migração
- Verifique logs de erro
- Acompanhe performance de queries
- Confirme que relatórios são gerados corretamente

---

## 🚨 **PROCEDIMENTO DE ROLLBACK**

### Em caso de problemas críticos:

```bash
# 1. PARAR imediatamente nova persistência
# Reverter commits de código

# 2. RESTAURAR dados do backup
firebase firestore:import gs://seu-bucket/backup/full_backup_YYYYMMDD_HHMMSS

# 3. VALIDAR restore
# Verificar se documentos originais voltaram

# 4. INVESTIGAR problemas
# Analisar logs de erro da migração
# Identificar causa raiz do problema

# 5. PLANEJAR nova tentativa
# Corrigir problemas identificados
# Testar em ambiente staging
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### ✅ A migração foi bem-sucedida se:
- ✅ 0 documentos com format `email_YYYY-MM-DD` 
- ✅ Todos documentos têm `usuarioId` = Firebase UID
- ✅ Campo `userEmail` preservado para referência
- ✅ Quizzes funcionam normalmente
- ✅ Medicamentos funcionam normalmente  
- ✅ Relatórios são gerados em 15-20s (vs 45-55s antes)
- ✅ Zero erros nos logs após 24h

### ❌ Sinais de problema:
- ❌ Dados duplicados ou perdidos
- ❌ Usuários não conseguem fazer login
- ❌ Quizzes não são salvos
- ❌ Relatórios não são gerados
- ❌ Erros 500 no console

---

## 🔧 **TROUBLESHOOTING**

### Problema: "Timeout durante migração"
```bash
# Solução: Reduzir batch size
node migration-script.js --batch-size=50
```

### Problema: "Muitos emails órfãos"
```bash
# Investigar por que usuários não têm registro em 'usuarios'
# Possivelmente usuários muito antigos
```

### Problema: "Queries ainda lentas"
```bash
# Verificar se indexes foram criados corretamente
# Console Firebase → Firestore → Indexes
# Criar index composto: usuarioId ASC, data DESC
```

### Problema: "Dados inconsistentes"
```bash
# Executar script de verificação
node migration-script.js --validate-only

# Fazer limpeza manual se necessário
```

### Problema: "Colisões de documentos"
```bash
# O script detecta automaticamente colisões (uid_date já existe)
# E faz merge seguro dos arrays quizzes/medicamentos
# Verificar logs para identificar documentos com merge:
# "✅ Merge realizado com sucesso para xyz_2024-09-11"
```

---

## 📞 **SUPORTE**

### Em caso de emergência:
1. **PARE a migração imediatamente**
2. **Execute rollback se necessário** 
3. **Documente o problema detalhadamente**
4. **Não tente "consertar" sem análise completa**

### Logs importantes:
- Logs do script de migração
- Logs do Firebase Console
- Logs da aplicação
- Screenshots de erros

---

## ✅ **CHECKLIST PRE-MIGRAÇÃO**

- [ ] Backup completo realizado e validado
- [ ] Script de migração testado em staging
- [ ] Usuários notificados sobre manutenção
- [ ] Equipe de desenvolvimento disponível
- [ ] Rollback procedure testada
- [ ] Monitoramento configurado
- [ ] Regras de segurança temporárias preparadas

---

## ✅ **CHECKLIST PÓS-MIGRAÇÃO**

- [ ] Validação automática passou
- [ ] Verificação manual concluída
- [ ] Testes de funcionalidade passaram
- [ ] Performance melhorada conforme esperado
- [ ] Zero erros nos logs por 24h
- [ ] Usuários conseguem usar sistema normalmente
- [ ] Regras de segurança restauradas

---

## Status da Migração

**✅ CONCLUÍDA: Sistema totalmente normalizado para Firebase UID**

- ✅ **Fase 1 (Validação)**: Concluída - migração manual validada
- ✅ **Fase 2 (Simplificação)**: Concluída - fallbacks removidos  
- ✅ **Fase 3 (Limpeza)**: Concluída - sistema otimizado

### Melhorias de Performance Implementadas

- ✅ **Eliminação de queries duplicadas**: Sistema híbrido removido
- ✅ **Cache de resolução removido**: Não mais necessário com UIDs
- ✅ **Queries diretas**: Acesso imediato aos dados por Firebase UID
- ✅ **Código simplificado**: ~200 linhas de compatibilidade removidas
- ✅ **Funções híbridas removidas**: fetchUserMedicationsHybrid, fetchUserDoctorsHybrid
- ✅ **Sistema de resolução removido**: resolveUserIdentifiers e UserIdentifiers interface
- ✅ **Nomenclatura padronizada**: Funções renomeadas para padrões mais simples

### Próximas Otimizações Recomendadas

O architect identificou algumas melhorias adicionais que podem ser implementadas:

1. **Otimizar queries report_diario**: Adicionar filtros de data via Firestore Timestamp para evitar filtragem client-side
2. **Limpeza repo-wide**: Verificar se há referências residuais a funções híbridas em outros arquivos
3. **Logs de produção**: Implementar flag de debug para reduzir verbosidade em produção

---

**🎉 PARABÉNS! A normalização de identificadores foi concluída com sucesso!**

O sistema agora está otimizado e pronto para crescer de forma escalável.