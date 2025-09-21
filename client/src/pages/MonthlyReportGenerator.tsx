import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Share2, FileText, Calendar, Mail, Clock, CheckCircle, Loader2, X, CalendarDays, Brain, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { createNavigate } from '@/lib/navigation';
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type SelectionMode = 'single' | 'range';
type TemplateType = 'standard' | 'enhanced';

export default function MonthlyReportGenerator(): JSX.Element {
  const [, routerNavigate] = useLocation();
  const navigate = createNavigate(routerNavigate);
  const { currentUser, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [fromPeriod, setFromPeriod] = useState<string>('');
  const [toPeriod, setToPeriod] = useState<string>('');
  const [templateType, setTemplateType] = useState<TemplateType>('enhanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Gerar opções de períodos (últimos 12 meses + mês atual)
  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Últimos 12 meses (incluindo o atual)
    for (let i = 12; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      const value = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
      const label = format(date, 'MMMM yyyy', { locale: ptBR });
      
      options.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        date: date
      });
    }
    
    return options;
  };

  const periodOptions = generatePeriodOptions();

  // Definir o mês atual como padrão
  useEffect(() => {
    const currentDate = new Date();
    const currentMonthOption = periodOptions.find(option => {
      const optionDate = option.date;
      return optionDate.getMonth() === currentDate.getMonth() && 
             optionDate.getFullYear() === currentDate.getFullYear();
    });
    
    if (currentMonthOption && !selectedPeriod) {
      setSelectedPeriod(currentMonthOption.value);
    }
  }, [periodOptions, selectedPeriod]);

  // Função para validar se existe seleção válida
  const hasValidSelection = () => {
    if (selectionMode === 'single') {
      return selectedPeriod !== '';
    } else {
      return fromPeriod !== '' && toPeriod !== '';
    }
  };

  // Função para obter os períodos selecionados
  const getSelectedPeriods = () => {
    if (selectionMode === 'single') {
      return selectedPeriod ? [selectedPeriod] : [];
    } else {
      if (!fromPeriod || !toPeriod) return [];
      
      const fromOption = periodOptions.find(opt => opt.value === fromPeriod);
      const toOption = periodOptions.find(opt => opt.value === toPeriod);
      
      if (!fromOption || !toOption) return [];
      
      const periods = [];
      const fromDate = fromOption.date;
      const toDate = toOption.date;
      
      // Gerar todos os meses entre fromDate e toDate
      let currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const startDate = startOfMonth(currentDate);
        const endDate = endOfMonth(currentDate);
        const value = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
        periods.push(value);
        currentDate = addMonths(currentDate, 1);
      }
      
      return periods;
    }
  };

  // Função para obter o texto dos períodos selecionados
  const getSelectedPeriodsText = () => {
    if (selectionMode === 'single') {
      const option = periodOptions.find(opt => opt.value === selectedPeriod);
      return option ? option.label : '';
    } else {
      const fromOption = periodOptions.find(opt => opt.value === fromPeriod);
      const toOption = periodOptions.find(opt => opt.value === toPeriod);
      
      if (fromOption && toOption) {
        if (fromOption.value === toOption.value) {
          return fromOption.label;
        }
        return `${fromOption.label} até ${toOption.label}`;
      }
      return '';
    }
  };

  const handleShareWhatsApp = async () => {
    if (!hasValidSelection() || !firebaseUser?.uid) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado ou período não selecionado",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const periods = getSelectedPeriods();
      console.log('🔄 Gerando relatório HTML para compartilhamento WhatsApp:', periods);
      
      // Generate report by calling API (will be intercepted by GitHub Pages patch)
      const response = await fetch('/api/generate-monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          periods: periods,
          periodsText: getSelectedPeriodsText(),
          templateType: templateType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.reportUrl) {
        setGeneratedPdfUrl(result.reportUrl);
        
        // Create WhatsApp message
        const periodsText = getSelectedPeriodsText();
        const message = `🩺 *DorLog - Relatório de Saúde*

📅 Período: ${periodsText}

Aqui está meu relatório de saúde gerado pelo DorLog. O relatório contém informações detalhadas sobre medicamentos, episódios de dor e estatísticas de saúde.

🔗 Visualizar relatório: ${result.reportUrl}

_Este relatório foi gerado automaticamente pelo aplicativo DorLog._`;

        console.log('🚀 Iniciando compartilhamento mobile-first...');
        
        // Detect mobile environment
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasWebShareAPI = 'share' in navigator;
        
        console.log(`📱 Ambiente: ${isMobile ? 'Mobile' : 'Desktop'}, Web Share API: ${hasWebShareAPI}`);

        // Mobile-First Strategy: Prioritize Web Share API (shows native interface like in image)
        if (hasWebShareAPI && isMobile) {
          try {
            console.log('📱 Usando Web Share API nativa (interface como na imagem)');
            
            await navigator.share({
              title: '🩺 DorLog - Relatório de Saúde',
              text: message,
            });
            
            toast({
              title: "Relatório compartilhado!",
              description: "Conteúdo enviado com sucesso.",
              duration: 5000,
            });
            return;
            
          } catch (shareError: unknown) {
            const error = shareError as Error;
            if (error.name === 'AbortError') {
              console.log('📱 Compartilhamento cancelado pelo usuário');
              return;
            }
            
            console.log('📱 Web Share API falhou, tentando fallback:', error.message);
          }
        }

        // Fallback for Desktop or Web Share API not available
        console.log('💻 Usando fallback para desktop/navegadores antigos');
        
        // Copy to clipboard as backup
        let clipboardSuccess = false;
        try {
          await navigator.clipboard.writeText(message);
          clipboardSuccess = true;
          console.log('📋 Mensagem copiada como backup');
        } catch (clipboardError) {
          console.log('📋 Clipboard não disponível');
        }

        // Show fallback options for desktop
        toast({
          title: "Compartilhar relatório:",
          description: "Escolha uma opção abaixo",
          duration: 12000,
          action: (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                  window.open(whatsappWebUrl, '_blank');
                  
                  toast({
                    title: "WhatsApp Web",
                    description: "Mensagem pré-preenchida no WhatsApp Web.",
                    duration: 5000,
                  });
                }}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                💬 WhatsApp Web
              </button>
              
              <button 
                onClick={() => {
                  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                📱 App WhatsApp
              </button>
              
              {clipboardSuccess && (
                <span className="text-xs text-gray-600">
                  ✅ Mensagem copiada!
                </span>
              )}
            </div>
          ),
        });
        
      } else {
        throw new Error(result.error || 'Erro desconhecido na geração do relatório');
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório HTML:', error);
      toast({
        title: "Erro",
        description: `Falha ao gerar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareEmail = async () => {
    if (!hasValidSelection() || !firebaseUser?.email) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado ou período não selecionado",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const periods = getSelectedPeriods();
      console.log('🔄 Gerando relatório HTML para compartilhamento Email:', periods);
      
      // Generate report by calling API (will be intercepted by GitHub Pages patch)
      const response = await fetch('/api/generate-monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          periods: periods,
          periodsText: getSelectedPeriodsText(),
          templateType: templateType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.reportUrl) {
        setGeneratedPdfUrl(result.reportUrl);
        
        // Create email content
        const periodsText = getSelectedPeriodsText();
        const subject = `DorLog - Relatório de Saúde - ${periodsText}`;
        const body = `Olá,

Segue em anexo meu relatório de saúde gerado pelo DorLog para o período: ${periodsText}

O relatório contém informações detalhadas sobre:
- Medicamentos e aderência ao tratamento
- Episódios de dor e evolução
- Estatísticas de saúde e pontos de dor

Link para visualizar o relatório: ${result.reportUrl}

Atenciosamente,
${currentUser?.email || firebaseUser?.email || 'Usuário DorLog'}

---
Este relatório foi gerado automaticamente pelo aplicativo DorLog.`;

        // Open email client
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl);
        
        toast({
          title: "Email preparado!",
          description: "O cliente de email foi aberto com o relatório anexado.",
          duration: 5000,
        });
        
      } else {
        throw new Error(result.error || 'Erro desconhecido na geração do relatório');
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório para email:', error);
      toast({
        title: "Erro",
        description: `Falha ao gerar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerador de Relatório Mensal</h1>
            <p className="text-muted-foreground">Gere e compartilhe relatórios detalhados de saúde</p>
          </div>
        </div>

        {/* Card Único Centralizado */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gerador de Relatório Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Modo de Seleção</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectionMode === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('single')}
                    className="flex-1"
                  >
                    Mês Único
                  </Button>
                  <Button
                    variant={selectionMode === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('range')}
                    className="flex-1"
                  >
                    Intervalo
                  </Button>
                </div>
              </div>

              {/* Single Period Selection */}
              {selectionMode === 'single' && (
                <div className="space-y-3">
                  <Label htmlFor="period" className="text-sm font-medium">
                    Selecionar Mês
                  </Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Range Selection */}
              {selectionMode === 'range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="from-period" className="text-sm font-medium">
                      De
                    </Label>
                    <Select value={fromPeriod} onValueChange={setFromPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mês inicial" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="to-period" className="text-sm font-medium">
                      Até
                    </Label>
                    <Select 
                      value={toPeriod} 
                      onValueChange={setToPeriod}
                      disabled={!fromPeriod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mês final" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions
                          .filter(option => {
                            if (!fromPeriod) return false;
                            const fromOption = periodOptions.find(opt => opt.value === fromPeriod);
                            return fromOption ? option.date >= fromOption.date : false;
                          })
                          .map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />

              {/* Template Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Relatório</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      templateType === 'standard' 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setTemplateType('standard')}
                    data-testid="card-template-standard"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">Relatório Básico</h3>
                        <p className="text-xs text-muted-foreground">Dados essenciais e resumo clínico</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">~30 segundos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      templateType === 'enhanced' 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setTemplateType('enhanced')}
                    data-testid="card-template-enhanced"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">Relatório Avançado com IA</h3>
                        <p className="text-xs text-muted-foreground">Análise NLP e insights inteligentes</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600">~2-3 minutos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Template Features Preview */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {templateType === 'standard' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Dados de medicamentos e médicos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Episódios de dor e evolução</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Estatísticas básicas de saúde</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-purple-600" />
                          <span>Tudo do relatório básico +</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-purple-600" />
                          <span>Análise de sentimento e NLP</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-3 w-3 text-purple-600" />
                          <span>Insights preditivos e correlações</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-purple-600" />
                          <span>Visualizações avançadas</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Action Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Compartilhar Relatório</Label>
                </div>

                <Button
                  onClick={handleShareWhatsApp}
                  disabled={!hasValidSelection() || isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      📱 Compartilhar Relatório
                    </>
                  )}
                </Button>

                {!hasValidSelection() && (
                  <p className="text-xs text-muted-foreground text-center">
                    Selecione um período para habilitar o compartilhamento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}