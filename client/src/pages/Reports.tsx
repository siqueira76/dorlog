import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Calendar, Download, AlertTriangle, MapPin, BookOpen, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { insightGenerationService } from '@/services/insightGenerationService';

export default function Reports() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  // Interface para dados de correlação dor-humor
  interface PainMoodCorrelation {
    painLevel: number;
    mood: string;
    moodValue: number; // Valor numérico para o humor
    date: string;
    count: number; // Número de ocorrências deste par
  }

  // Função para buscar episódios de crise
  const fetchCrisisEpisodes = async (): Promise<number> => {
    if (!currentUser?.email) {
      return 0;
    }

    try {
      console.log('🔍 Buscando episódios de crise para:', currentUser.email);
      
      // Calcular data de 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      
      console.log('📅 Filtro de data - últimos 30 dias desde:', thirtyDaysAgo.toISOString());
      
      const reportDiarioRef = collection(db, 'report_diario');
      const q = query(reportDiarioRef);
      
      const querySnapshot = await getDocs(q);
      console.log('📄 Total de documentos encontrados:', querySnapshot.docs.length);
      
      let crisisCount = 0;
      let documentsChecked = 0;
      
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        const data = doc.data();
        
        // Verificar se o documento pertence ao usuário atual
        if (docId.startsWith(`${currentUser.email}_`) || data.usuarioId === currentUser.email || data.email === currentUser.email) {
          
          // Verificar se o documento está dentro dos últimos 30 dias
          const docData = data.data;
          if (docData && typeof docData.toDate === 'function' && docData >= thirtyDaysAgoTimestamp) {
            documentsChecked++;
            console.log('📋 Documento válido encontrado:', docId, 'Data:', docData.toDate().toISOString());
            
            // Contar quizzes do tipo 'emergencial' (usando normalização)
            if (data.quizzes && Array.isArray(data.quizzes)) {
              // Aplicar mesma normalização usada no firestoreDataService
              const normalizedQuizzes = data.quizzes.filter((quiz: any) => {
                return quiz && typeof quiz === 'object' && quiz.tipo && quiz.respostas;
              });
              
              const emergencyQuizzes = normalizedQuizzes.filter((quiz: any) => quiz.tipo === 'emergencial');
              console.log(`🚨 ${emergencyQuizzes.length} quiz(zes) emergencial(is) estruturado(s) encontrado(s) em ${docId}`);
              
              if (emergencyQuizzes.length === 0 && data.quizzes.length > 0) {
                console.log(`⚠️ ${data.quizzes.length} quiz(zes) em formato antigo/inválido ignorado(s) em ${docId}`);
              }
              
              crisisCount += emergencyQuizzes.length;
            }
          }
        }
      });
      
      console.log(`✅ Busca concluída. Documentos verificados: ${documentsChecked}, Crises encontradas: ${crisisCount}`);
      return crisisCount;
    } catch (error) {
      console.error('Erro ao buscar episódios de crise:', error);
      return 0;
    }
  };

  // Função para buscar dados de correlação dor-humor
  const fetchPainMoodCorrelation = async (): Promise<PainMoodCorrelation[]> => {
    if (!currentUser?.email) {
      return [];
    }

    try {
      console.log('🧠 Buscando dados de correlação dor-humor para:', currentUser.email);
      
      // Calcular data de 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      
      const reportDiarioRef = collection(db, 'report_diario');
      const q = query(reportDiarioRef);
      
      const querySnapshot = await getDocs(q);
      const correlationData: Map<string, PainMoodCorrelation> = new Map();
      
      // Mapeamento de humor para valores numéricos (incluindo valores reais do Firestore)
      const moodToValue: { [key: string]: number } = {
        // Valores do quiz noturno (pergunta 9 - humor)
        'Depressivo': 1,
        'Triste': 2,
        'Irritado': 3,
        'Ansioso': 4,
        'Calmo': 5,
        'Feliz': 6,
        // Valores do quiz matinal (pergunta 1 - qualidade do sono como proxy de humor)
        'Ruim': 2,
        'Não dormiu': 1,
        'Médio': 4,
        'Bem': 6,
        // Valores de fallback do QuestionRenderer para emojis
        'muito-ruim': 1,
        'ruim': 2,
        'bom': 5,
        'muito-bom': 6,
        'excelente': 6
      };
      
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        const data = doc.data();
        
        // Verificar se o documento pertence ao usuário
        if (docId.startsWith(`${currentUser.email}_`) || data.usuarioId === currentUser.email || data.email === currentUser.email) {
          const docData = data.data;
          
          // Verificar se está dentro dos últimos 30 dias
          if (docData && typeof docData.toDate === 'function' && docData >= thirtyDaysAgoTimestamp) {
            const dayKey = (docData.toDate() as Date).toISOString().split('T')[0];
            let dayPainLevel: number | null = null;
            let dayMood: string | null = null;
            
            // Processar quizzes do dia (com normalização)
            if (data.quizzes && Array.isArray(data.quizzes)) {
              // Aplicar normalização para filtrar apenas quizzes válidos
              const normalizedQuizzes = data.quizzes.filter((quiz: any) => {
                return quiz && typeof quiz === 'object' && quiz.tipo && quiz.respostas;
              });
              
              if (normalizedQuizzes.length === 0 && data.quizzes.length > 0) {
                console.log(`⚠️ Quizzes em formato antigo ignorados em ${docId}`);
              }
              
              normalizedQuizzes.forEach((quiz: any) => {
                // Capturar nível de dor baseado no tipo de quiz
                if (quiz.respostas && typeof quiz.respostas === 'object') {
                  // Para quiz noturno e matinal: dor está na pergunta 2
                  // Para quiz emergencial: dor está na pergunta 1
                  let painQuestionId = '2';
                  if (quiz.tipo === 'emergencial') {
                    painQuestionId = '1';
                  }
                  
                  if (quiz.respostas[painQuestionId] !== undefined) {
                    const painResponse = quiz.respostas[painQuestionId];
                    if (typeof painResponse === 'number') {
                      dayPainLevel = painResponse;
                    } else if (typeof painResponse === 'string') {
                      const painValue = parseInt(painResponse, 10);
                      if (!isNaN(painValue)) {
                        dayPainLevel = painValue;
                      }
                    }
                  }
                  
                  // Capturar humor baseado no tipo de quiz
                  if (quiz.tipo === 'noturno' && quiz.respostas['9'] !== undefined) {
                    // Quiz noturno: humor na pergunta 9
                    dayMood = quiz.respostas['9'];
                  } else if (quiz.tipo === 'matinal' && quiz.respostas['1'] !== undefined) {
                    // Quiz matinal: humor na pergunta 1
                    dayMood = quiz.respostas['1'];
                  }
                }
              });
            }
            
            // Se temos ambos os dados, criar ponto de correlação
            if (dayPainLevel !== null && dayMood && moodToValue[dayMood]) {
              const key = `${dayPainLevel}-${dayMood}`;
              const existing = correlationData.get(key);
              
              if (existing) {
                existing.count++;
              } else {
                correlationData.set(key, {
                  painLevel: dayPainLevel,
                  mood: dayMood,
                  moodValue: moodToValue[dayMood],
                  date: dayKey,
                  count: 1
                });
              }
            }
          }
        }
      });
      
      const result = Array.from(correlationData.values());
      console.log('🎯 Dados de correlação encontrados:', result.length, 'pontos');
      console.log('📊 Amostra dos dados de correlação:', result.slice(0, 3));
      return result;
    } catch (error) {
      console.error('Erro ao buscar correlação dor-humor:', error);
      return [];
    }
  };

  // Função para verificar adesão ao diário
  const fetchDiaryAdherence = async (): Promise<{ daysSinceLastEntry: number; message: string; status: 'good' | 'warning' | 'danger' | 'empty' }> => {
    if (!currentUser?.email) {
      return { daysSinceLastEntry: 0, message: 'Usuário não autenticado', status: 'empty' };
    }

    try {
      console.log('📖 === VERIFICANDO ADESÃO AO DIÁRIO ===');
      console.log('📖 Verificando adesão ao diário para:', currentUser.email);
      
      const reportDiarioRef = collection(db, 'report_diario');
      const q = query(reportDiarioRef);
      
      const querySnapshot = await getDocs(q);
      let lastEntryDate: Date | null = null;
      let userDocuments = 0;
      let todayHasRecord = false;
      
      // CORREÇÃO: Usar UTC para evitar problemas de fuso horário
      const now = new Date();
      
      // Obter data de hoje em UTC (para coincidir com Firestore)
      const nowUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const todayStartUTC = new Date(Date.UTC(nowUTC.getFullYear(), nowUTC.getMonth(), nowUTC.getDate(), 0, 0, 0));
      const todayEndUTC = new Date(Date.UTC(nowUTC.getFullYear(), nowUTC.getMonth(), nowUTC.getDate(), 23, 59, 59));
      
      console.log('🕐 Verificando registros para o dia:', nowUTC.toLocaleDateString('pt-BR'));
      console.log('🕐 Intervalo UTC: ', todayStartUTC.toISOString(), 'a', todayEndUTC.toISOString());
      
      // Encontrar a data do último registro do usuário
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        const data = doc.data();
        
        if (docId.startsWith(`${currentUser.email}_`) || data.usuarioId === currentUser.email || data.email === currentUser.email) {
          userDocuments++;
          const docData = data.data;
          if (docData && typeof docData.toDate === 'function') {
            const entryDate = docData.toDate();
            
            // Verificar se o registro é de hoje (comparação em UTC)
            if (entryDate >= todayStartUTC && entryDate <= todayEndUTC) {
              todayHasRecord = true;
              console.log('✅ Registro encontrado para hoje (UTC):', docId, entryDate.toISOString());
            } else {
              console.log('ℹ️ Registro fora do intervalo de hoje:', docId, entryDate.toISOString());
            }
            
            // Atualizar último registro geral
            if (!lastEntryDate || entryDate > lastEntryDate) {
              lastEntryDate = entryDate;
            }
          }
        }
      });

      console.log(`📊 Documentos do usuário encontrados: ${userDocuments}`);
      console.log('📅 Último registro encontrado:', lastEntryDate ? (lastEntryDate as Date).toISOString() : null);
      console.log('🎯 Tem registro hoje?', todayHasRecord);

      // Se não há registros
      if (!lastEntryDate || userDocuments === 0) {
        return {
          daysSinceLastEntry: 0,
          message: 'Você ainda não fez nenhum registro no Diário',
          status: 'empty'
        };
      }

      // CORREÇÃO: Usar verificação melhorada para hoje
      if (todayHasRecord) {
        console.log('🎉 Usuário tem registro para hoje!');
        return {
          daysSinceLastEntry: 0,
          message: 'Você está em dia com os registros no Diário',
          status: 'good'
        };
      }

      // Verificar se o último registro foi ontem (usando UTC)
      const yesterdayUTC = new Date(todayStartUTC.getTime() - 24 * 60 * 60 * 1000);
      const dayAfterYesterdayUTC = new Date(yesterdayUTC.getTime() + 24 * 60 * 60 * 1000);
      
      if (lastEntryDate && lastEntryDate instanceof Date && lastEntryDate >= yesterdayUTC && lastEntryDate < dayAfterYesterdayUTC) {
        console.log('⚠️ Último registro foi ontem');
        return {
          daysSinceLastEntry: 1,
          message: 'Você ainda não fez nenhum registro hoje',
          status: 'warning'
        };
      }

      // Calcular dias desde o último registro (usando UTC)
      const diffTime = (lastEntryDate && lastEntryDate instanceof Date) ? (todayStartUTC.getTime() - lastEntryDate.getTime()) : 0;
      const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`📈 Dias desde último registro: ${daysSince}`);

      return {
        daysSinceLastEntry: daysSince,
        message: `${daysSince} ${daysSince === 1 ? 'dia' : 'dias'} sem registros`,
        status: daysSince > 7 ? 'danger' : 'warning'
      };

    } catch (error) {
      console.error('❌ Erro ao verificar adesão ao diário:', error);
      return { daysSinceLastEntry: 0, message: 'Erro ao verificar registros', status: 'empty' };
    }
  };

  // Função para buscar pontos de dor (resposta 2 dos quizzes noturnos)
  const fetchPainPoints = async (): Promise<Array<{ point: string; count: number }>> => {
    if (!currentUser?.email) {
      return [];
    }

    try {
      console.log('🎯 Buscando pontos de dor para:', currentUser.email);
      
      // Calcular data de 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      
      const reportDiarioRef = collection(db, 'report_diario');
      const q = query(reportDiarioRef);
      
      const querySnapshot = await getDocs(q);
      const painPointsCount: { [key: string]: number } = {};
      
      // Processar documentos e extrair pontos de dor
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        const data = doc.data();
        
        // Verificar se o documento pertence ao usuário atual
        if (docId.startsWith(`${currentUser.email}_`) || data.usuarioId === currentUser.email || data.email === currentUser.email) {
          // Verificar se o documento está dentro dos últimos 30 dias
          const docData = data.data;
          if (docData && typeof docData.toDate === 'function' && docData >= thirtyDaysAgoTimestamp) {
            
            // Procurar por quizzes do tipo 'noturno'
            if (data.quizzes && Array.isArray(data.quizzes)) {
              const nightQuizzes = data.quizzes.filter((quiz: any) => quiz.tipo === 'noturno');
              
              nightQuizzes.forEach((quiz: any) => {
                // Obter resposta da pergunta 2 (pontos de dor)
                if (quiz.respostas && quiz.respostas['2'] !== undefined) {
                  const painPoints = quiz.respostas['2'];
                  
                  // Se a resposta é um array, processar cada item
                  if (Array.isArray(painPoints)) {
                    painPoints.forEach((point: string) => {
                      if (point && point.trim() !== '') {
                        const pointName = point.trim();
                        painPointsCount[pointName] = (painPointsCount[pointName] || 0) + 1;
                      }
                    });
                  } else if (typeof painPoints === 'string' && painPoints.trim() !== '') {
                    // Se a resposta é uma string única
                    const pointName = painPoints.trim();
                    painPointsCount[pointName] = (painPointsCount[pointName] || 0) + 1;
                  }
                }
              });
            }
          }
        }
      });
      
      // Converter para array e ordenar por frequência
      const painPointsArray = Object.entries(painPointsCount)
        .map(([point, count]) => ({ point, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Limitar aos 8 pontos mais frequentes
      
      console.log(`🎯 Pontos de dor encontrados: ${painPointsArray.length} diferentes`);
      console.log('📊 Amostra dos dados:', painPointsArray.slice(0, 3));
      
      return painPointsArray;
    } catch (error) {
      console.error('Erro ao buscar pontos de dor:', error);
      return [];
    }
  };

  // Função para buscar dados de evolução da dor (quizzes noturnos)
  const fetchPainEvolution = async (): Promise<Array<{ date: string; pain: number; dateStr: string }>> => {
    if (!currentUser?.email) {
      return [];
    }

    try {
      console.log('📊 Buscando evolução da dor para:', currentUser.email);
      
      // Calcular data de 30 dias atrás
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      
      const reportDiarioRef = collection(db, 'report_diario');
      const q = query(reportDiarioRef);
      
      const querySnapshot = await getDocs(q);
      const painData: Array<{ date: string; pain: number; dateStr: string }> = [];
      
      // Processar documentos e extrair dados de dor
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        const data = doc.data();
        
        // Verificar se o documento pertence ao usuário atual
        if (docId.startsWith(`${currentUser.email}_`) || data.usuarioId === currentUser.email || data.email === currentUser.email) {
          // Verificar se o documento está dentro dos últimos 30 dias
          const docData = data.data;
          if (docData && typeof docData.toDate === 'function' && docData >= thirtyDaysAgoTimestamp) {
            
            // Procurar por quizzes do tipo 'noturno'
            if (data.quizzes && Array.isArray(data.quizzes)) {
              const nightQuizzes = data.quizzes.filter((quiz: any) => quiz.tipo === 'noturno');
              
              nightQuizzes.forEach((quiz: any) => {
                // Obter resposta da pergunta 1 (intensidade da dor)
                if (quiz.respostas && quiz.respostas['1'] !== undefined) {
                  const painIntensity = parseInt(quiz.respostas['1'], 10);
                  if (!isNaN(painIntensity)) {
                    const entryDate = docData.toDate();
                    const dateStr = entryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const isoDate = entryDate.toISOString().split('T')[0];
                    
                    painData.push({
                      date: isoDate,
                      pain: painIntensity,
                      dateStr: dateStr
                    });
                  }
                }
              });
            }
          }
        }
      });
      
      // Ordenar por data e remover duplicatas (manter o último registro do dia)
      const uniquePainData = painData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.date === current.date);
          if (existingIndex >= 0) {
            acc[existingIndex] = current; // Substituir pelo mais recente
          } else {
            acc.push(current);
          }
          return acc;
        }, [] as Array<{ date: string; pain: number; dateStr: string }>);
      
      console.log(`📈 Dados de evolução da dor encontrados: ${uniquePainData.length} registros`);
      console.log('📊 Amostra dos dados:', uniquePainData.slice(0, 3));
      
      return uniquePainData;
    } catch (error) {
      console.error('Erro ao buscar evolução da dor:', error);
      return [];
    }
  };

  // Queries para buscar dados
  const { data: crisisEpisodes, isLoading: isLoadingCrisis } = useQuery({
    queryKey: ['crisis-episodes', currentUser?.email],
    queryFn: fetchCrisisEpisodes,
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: diaryAdherence, isLoading: isLoadingDiary } = useQuery({
    queryKey: ['diary-adherence', currentUser?.email],
    queryFn: fetchDiaryAdherence,
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: painPoints, isLoading: isLoadingPainPoints } = useQuery({
    queryKey: ['pain-points', currentUser?.email],
    queryFn: fetchPainPoints,
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: painEvolution, isLoading: isLoadingEvolution } = useQuery({
    queryKey: ['pain-evolution', currentUser?.email],
    queryFn: fetchPainEvolution,
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para buscar correlação dor-humor
  const { data: painMoodCorrelation, isLoading: isLoadingCorrelation } = useQuery({
    queryKey: ['pain-mood-correlation', currentUser?.email],
    queryFn: fetchPainMoodCorrelation,
    enabled: !!currentUser?.email,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para gerar insights NLP sobre correlação dor-humor
  const generateCorrelationInsights = (correlationData: PainMoodCorrelation[]) => {
    if (!correlationData || correlationData.length === 0) return null;

    const insights = [];
    
    // Análise de tendências de humor
    const avgPainLevel = correlationData.reduce((sum, item) => sum + item.painLevel, 0) / correlationData.length;
    const avgMoodValue = correlationData.reduce((sum, item) => sum + item.moodValue, 0) / correlationData.length;
    
    // Insight sobre nível geral de dor
    if (avgPainLevel > 7) {
      insights.push(`Níveis altos de dor (média: ${avgPainLevel.toFixed(1)}/10) - considere consultar seu médico`);
    } else if (avgPainLevel < 3) {
      insights.push(`Níveis baixos de dor (média: ${avgPainLevel.toFixed(1)}/10) - boa gestão da dor`);
    }
    
    // Insight sobre humor predominante
    if (avgMoodValue > 5) {
      insights.push(`Humor predominantemente positivo - isso pode ajudar no controle da dor`);
    } else if (avgMoodValue < 3) {
      insights.push(`Humor frequentemente baixo - pode estar relacionado aos níveis de dor`);
    }
    
    // Análise de correlação
    const highPainHighMood = correlationData.filter(item => item.painLevel > 6 && item.moodValue > 4).length;
    const highPainLowMood = correlationData.filter(item => item.painLevel > 6 && item.moodValue < 3).length;
    
    if (highPainHighMood > highPainLowMood) {
      insights.push(`Resiliência emocional: mesmo com dor alta, você mantém humor positivo`);
    } else if (highPainLowMood > 0) {
      insights.push(`Dor intensa impacta seu humor - estratégias de bem-estar podem ajudar`);
    }
    
    return insights.length > 0 ? insights : null;
  };

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <Button
            onClick={() => setLocation('/reports/monthly')}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            data-testid="button-generate-pdf-report"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Relatorio Mensal</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Acompanhe sua evolução e padrões de saúde
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="shadow-sm border border-border">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            </div>
            <div className="text-xl font-bold mb-1 text-red-600" data-testid="text-crisis-episodes">
              {isLoadingCrisis ? '...' : (crisisEpisodes || 0)}
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">Episódios de Crise</p>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-border">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className={`h-4 w-4 mr-1 ${
                diaryAdherence?.status === 'good' ? 'text-green-500' :
                diaryAdherence?.status === 'warning' ? 'text-yellow-500' :
                diaryAdherence?.status === 'danger' ? 'text-red-500' :
                'text-gray-400'
              }`} />
            </div>
            <div className={`text-xl font-bold mb-1 ${
              diaryAdherence?.status === 'good' ? 'text-green-600' :
              diaryAdherence?.status === 'warning' ? 'text-yellow-600' :
              diaryAdherence?.status === 'danger' ? 'text-red-600' :
              'text-gray-400'
            }`} data-testid="text-diary-adherence">
              {isLoadingDiary ? '...' : (diaryAdherence?.daysSinceLastEntry || 0)}
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">Adesão ao Diário</p>
            <p className="text-xs text-muted-foreground leading-tight">
              {isLoadingDiary ? 'Verificando...' : (diaryAdherence?.message || 'Carregando...')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução da Dor */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Evolução da Dor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Evolução da intensidade da dor nos últimos 30 dias
            </p>
            {isLoadingEvolution ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Carregando dados...
                </p>
              </div>
            ) : !painEvolution || painEvolution.length === 0 ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Complete alguns diários noturnos para ver sua evolução
                </p>
              </div>
            ) : (
              <div className="h-80 w-full p-3">
                {/* Header info */}
                <div className="mb-4 text-center">
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                    {painEvolution?.length || 0} registros nos últimos 30 dias
                  </span>
                </div>
                
                <ResponsiveContainer width="100%" height="70%">
                  <LineChart
                    data={painEvolution}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="1 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.3}
                      horizontal={true}
                      vertical={false}
                    />
                    
                    <XAxis 
                      dataKey="dateStr" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      dy={10}
                    />
                    
                    <YAxis 
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      dx={-10}
                      label={{ 
                        value: 'Dor (0-10)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { 
                          textAnchor: 'middle', 
                          fontSize: '10px', 
                          fill: '#64748b',
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '8px 12px',
                        backdropFilter: 'blur(8px)'
                      }}
                      labelStyle={{ 
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}
                      formatter={(value: number) => [
                        <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '14px' }}>
                          {value}/10
                        </span>, 
                        'Dor'
                      ]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="pain" 
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{
                        fill: '#3b82f6',
                        strokeWidth: 2,
                        stroke: '#ffffff',
                        r: 5
                      }}
                      activeDot={{
                        r: 6,
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                        fill: '#ffffff'
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Legenda e estatísticas */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                      <span>Intensidade da dor</span>
                    </div>
                    {painEvolution && painEvolution.length > 0 && (
                      <div className="text-xs text-slate-600">
                        Média: <span className="font-semibold text-blue-600">
                          {(painEvolution.reduce((sum, item) => sum + item.pain, 0) / painEvolution.length).toFixed(1)}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pontos de Dor */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-2 text-orange-500" />
              Pontos de Dor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Frequência dos pontos de dor relatados nos últimos 30 dias
            </p>
            {isLoadingPainPoints ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Carregando dados...
                </p>
              </div>
            ) : !painPoints || painPoints.length === 0 ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Complete alguns diários noturnos para ver os pontos de dor
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={painPoints}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="1 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.3}
                      horizontal={true}
                      vertical={false}
                    />
                    
                    <XAxis 
                      dataKey="point" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 10, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      dx={-10}
                      label={{ 
                        value: 'Frequência', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { 
                          textAnchor: 'middle', 
                          fontSize: '10px', 
                          fill: '#64748b',
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '8px 12px',
                        backdropFilter: 'blur(8px)'
                      }}
                      labelStyle={{ 
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}
                      formatter={(value: number) => [
                        <span style={{ color: '#f97316', fontWeight: 700, fontSize: '14px' }}>
                          {value}x
                        </span>, 
                        'Relatado'
                      ]}
                      labelFormatter={(label) => label}
                    />
                    
                    <Bar 
                      dataKey="count" 
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Correlação Dor-Humor */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              Correlação Dor-Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relação entre intensidade da dor e estado de humor nos últimos 30 dias
            </p>
            {isLoadingCorrelation ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Carregando dados...
                </p>
              </div>
            ) : !painMoodCorrelation || painMoodCorrelation.length === 0 ? (
              <div className="bg-muted rounded-xl p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Complete alguns diários noturnos e registre episódios de dor para ver a correlação
                </p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart
                    data={painMoodCorrelation}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="1 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.3}
                    />
                    
                    <XAxis 
                      type="number"
                      dataKey="painLevel"
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      label={{ 
                        value: 'Intensidade da Dor (0-10)', 
                        position: 'insideBottom',
                        offset: -10,
                        style: { 
                          textAnchor: 'middle', 
                          fontSize: '11px', 
                          fill: '#64748b',
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <YAxis 
                      type="number"
                      dataKey="moodValue"
                      domain={[1, 6]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ 
                        fontSize: 11, 
                        fill: '#64748b',
                        fontWeight: 500
                      }}
                      tickFormatter={(value) => {
                        const moodLabels: { [key: number]: string } = {
                          1: 'Depressivo',
                          2: 'Triste', 
                          3: 'Irritado',
                          4: 'Ansioso',
                          5: 'Calmo',
                          6: 'Feliz'
                        };
                        return moodLabels[value] || '';
                      }}
                      label={{ 
                        value: 'Estado de Humor', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { 
                          textAnchor: 'middle', 
                          fontSize: '11px', 
                          fill: '#64748b',
                          fontWeight: 500
                        }
                      }}
                    />
                    
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '8px 12px',
                        backdropFilter: 'blur(8px)'
                      }}
                      labelStyle={{ 
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        if (name === 'painLevel') {
                          return [
                            <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '14px' }}>
                              {value}/10
                            </span>, 
                            'Nível de Dor'
                          ];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `Humor: ${data.mood} | Ocorrências: ${data.count}`;
                        }
                        return '';
                      }}
                    />
                    
                    <Scatter dataKey="painLevel" fill="#8b5cf6">
                      {painMoodCorrelation?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.moodValue <= 2 ? '#ef4444' :  // Depressivo/Triste - vermelho
                            entry.moodValue <= 4 ? '#f59e0b' :  // Irritado/Ansioso - laranja
                            '#10b981'  // Calmo/Feliz - verde
                          }
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                
                {/* Insights NLP sobre correlação */}
                {(() => {
                  const insights = generateCorrelationInsights(painMoodCorrelation);
                  return insights && insights.length > 0 ? (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Insights Automáticos</h4>
                          <ul className="space-y-1">
                            {insights.map((insight, index) => (
                              <li key={index} className="text-xs text-blue-800 leading-relaxed">
                                • {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Legenda */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-slate-600">Humor Baixo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-slate-600">Humor Neutro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-slate-600">Humor Positivo</span>
                    </div>
                  </div>
                  {painMoodCorrelation && painMoodCorrelation.length > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-slate-600">
                        Total de registros correlacionados: <span className="font-semibold text-purple-600">
                          {painMoodCorrelation.reduce((sum, item) => sum + item.count, 0)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Resumo */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* Resumo Mensal */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Resumo Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relatório completo das suas atividades de saúde
            </p>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              data-testid="button-generate-monthly-report"
              onClick={() => setLocation('/reports/monthly')}
            >
              Gerar Relatório Mensal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}