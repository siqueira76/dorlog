# Firebase Hosting Setup - DorLog Reports

## 📋 Visão Geral

Este documento explica como configurar e usar o sistema de relatórios HTML hospedados no Firebase Hosting do projeto DorLog.

## 🏗️ Estrutura Criada

```
reports/                          # Pasta pública do Firebase Hosting
├── assets/                       # Assets estáticos
│   ├── css/
│   │   └── report.css           # Estilos para relatórios
│   ├── js/
│   │   └── report.js            # Scripts JavaScript
│   └── imagens/                 # Imagens dos relatórios
├── usuarios/                     # Relatórios dos usuários
│   └── *.html                   # Arquivos de relatório gerados
└── index.html                   # Página inicial do sistema

Arquivos de configuração:
├── firebase.json                 # Configuração do Firebase Hosting
├── generate_and_send_report.cjs  # Script de geração de relatórios
├── deploy.sh                     # Script de deploy automatizado
└── server/services/reportHostingService.js  # Serviço de integração
```

## ⚙️ Configuração Inicial

### 1. Autenticação Firebase

```bash
# Fazer login no Firebase
firebase login

# Verificar projetos disponíveis
firebase projects:list

# Definir projeto padrão (se necessário)
firebase use dorlog-fibro-diario
```

### 2. Configuração do Hosting

O arquivo `firebase.json` já está configurado com:

- **Diretório público**: `reports/`
- **Rewrites**: Configurados para SPA
- **Headers**: Otimizados para cache de assets
- **Ignore**: Arquivos desnecessários excluídos

### 3. Estrutura de Assets

#### CSS (`reports/assets/css/report.css`)
- Estilos responsivos para relatórios
- Suporte a impressão
- Tema claro otimizado para leitura
- Classes utilitárias para componentes

#### JavaScript (`reports/assets/js/report.js`)
- Animações de entrada
- Funcionalidades de impressão
- Compartilhamento nativo (Web Share API)
- Sistema de busca simples
- Tooltips informativos

## 🚀 Como Usar

### Método 1: Script Automatizado

```bash
# Gerar relatório de exemplo
node generate_and_send_report.cjs

# O script irá:
# 1. Gerar HTML do relatório
# 2. Salvar em reports/usuarios/
# 3. Fazer deploy no Firebase
# 4. Remover arquivo local após sucesso
```

### Método 2: Deploy Manual

```bash
# Usar o script de deploy
./deploy.sh

# Ou manualmente
firebase deploy --only hosting --project dorlog-fibro-diario
```

### Método 3: API do Servidor

```javascript
// POST /api/generate-report
{
  "userId": "user@email.com",
  "reportMonth": "2025-01",
  "reportData": {
    "totalDays": 28,
    "crisisEpisodes": 3,
    "averagePain": 4.2,
    // ... outros dados
  }
}
```

## 📊 Formato dos Dados do Relatório

```javascript
const reportData = {
  // Estatísticas gerais
  totalDays: 28,                    // Dias com registro
  crisisEpisodes: 3,                // Episódios de crise
  averagePain: 4.2,                 // Dor média (0-10)
  medicationCompliance: 85,         // Adesão medicamentosa (%)
  
  // Medicamentos
  medications: [
    {
      nome: 'Paracetamol',
      dosagem: '500mg',
      frequencia: 3                 // Vezes por dia
    }
  ],
  
  // Médicos
  doctors: [
    {
      nome: 'Dr. João Silva',
      especialidade: 'Reumatologia',
      crm: '12345'
    }
  ],
  
  // Observações
  observations: 'Observações do período...'
};
```

## 🔗 URLs Geradas

### Base do Sistema
- **Site principal**: `https://dorlog-fibro-diario.web.app`
- **Índice de relatórios**: `https://dorlog-fibro-diario.web.app/`

### Relatórios Individuais
- **Padrão**: `https://dorlog-fibro-diario.web.app/usuarios/report_{userId}_{month}.html`
- **Exemplo**: `https://dorlog-fibro-diario.web.app/usuarios/report_user@email.com_Janeiro_2025.html`

## 🛠️ Funcionalidades dos Relatórios

### Recursos Automáticos
- ✅ **Design responsivo** (mobile e desktop)
- ✅ **Otimizado para impressão** (PDF)
- ✅ **Animações suaves** ao carregar
- ✅ **Botão de impressão** integrado
- ✅ **Compartilhamento nativo** (Web Share API)
- ✅ **Busca interna** no conteúdo
- ✅ **Tooltips informativos**
- ✅ **Timestamp de visualização**

### Seções do Relatório
1. **Header**: Logo, período e identificação do usuário
2. **Resumo Executivo**: Estatísticas principais em cards
3. **Medicamentos**: Lista de medicações com dosagens
4. **Equipe Médica**: Profissionais acompanhando o caso
5. **Observações**: Comentários e análises do período
6. **Footer**: Data de geração e informações legais

## 🔒 Segurança e Privacidade

### Medidas Implementadas
- **HTTPS obrigatório** via Firebase Hosting
- **Headers de segurança** configurados
- **URLs não indexáveis** pelos motores de busca
- **Acesso via URL direta** (não há listagem pública)
- **Dados sensíveis** tratados com cuidado

### Recomendações
- Compartilhar URLs apenas com pessoas autorizadas
- URLs contêm informações de identificação do usuário
- Relatórios devem ser tratados como documentos médicos confidenciais

## 📝 Customização

### Modificar Estilos
Edite o arquivo `reports/assets/css/report.css`:

```css
/* Personalizar cores */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* ... outras variáveis */
}
```

### Adicionar Funcionalidades
Edite o arquivo `reports/assets/js/report.js`:

```javascript
// Adicionar nova funcionalidade
function novaFuncionalidade() {
  // Seu código aqui
}
```

### Modificar Template HTML
Edite a função `generateReportHTML()` em `generate_and_send_report.cjs`

## 🐛 Solução de Problemas

### Deploy Falha
```bash
# Verificar autenticação
firebase login --reauth

# Verificar projeto
firebase use --add

# Tentar deploy novamente
firebase deploy --only hosting
```

### Erro de Permissions
```bash
# Verificar permissões do projeto
firebase projects:list

# Usar conta com permissões adequadas
firebase login:add
```

### Assets Não Carregam
- Verificar se os arquivos CSS/JS existem
- Confirmar que o deploy foi concluído
- Limpar cache do navegador

## 📈 Monitoramento

### Logs do Firebase
```bash
# Ver logs de deploy
firebase hosting:logs

# Verificar status do projeto
firebase projects:info
```

### Analytics (se configurado)
- Acessos aos relatórios podem ser monitorados via Firebase Analytics
- Dados de desempenho disponíveis no console Firebase

## 🔄 Manutenção

### Limpeza de Arquivos
```bash
# Remover relatórios antigos (manual)
find reports/usuarios -name "*.html" -mtime +30 -delete

# Ou usar script personalizado
```

### Backup
- Relatórios são armazenados temporariamente em `reports/usuarios/`
- Firebase Hosting mantém histórico de deploys
- Considerar backup dos dados fonte (Firestore)

## 📚 Recursos Adicionais

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)

---

**Criado em**: 20/08/2025  
**Projeto**: DorLog - Gestão de Saúde  
**Versão**: 1.0