import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Pill, AlertCircle, CheckCircle, Sunrise, Moon, BookOpen, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { format, isToday, isYesterday, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces para as atividades recentes
interface QuizActivity {
  id: string;
  type: 'quiz';
  title: string;
  time: string;
  timestamp: Date;
  icon: any;
  iconColor: string;
  bgColor: string;
  quizType: string;
}

interface MedicationActivity {
  id: string;
  type: 'medication';
  title: string;
  time: string;
  timestamp: Date;
  icon: any;
  iconColor: string;
  bgColor: string;
  medicationName: string;
}

type Activity = QuizActivity | MedicationActivity;

export default function Home() {
  const { currentUser, firebaseUser } = useAuth();
  const [, setLocation] = useLocation();

  // Função para formatar o tempo relativo
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = differenceInMinutes(now, date);
    const diffInHours = differenceInHours(now, date);

    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInMinutes < 60) {
      return `Há ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Há ${diffInHours}h`;
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  };

  // Função para buscar atividades recentes
  const fetchRecentActivities = async (): Promise<Activity[]> => {
    if (!firebaseUser?.email) {
      console.log('❌ Usuário não autenticado');
      return [];
    }

    const activities: Activity[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Buscar quizzes dos últimos 2 dias
      const daysToCheck = [
        today.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0]
      ];

      for (const dateStr of daysToCheck) {
        const reportDocId = `${firebaseUser.email}_${dateStr}`;
        const reportRef = doc(db, 'report_diario', reportDocId);
        const reportDoc = await getDoc(reportRef);

        if (reportDoc.exists()) {
          const data = reportDoc.data();
          
          // Processar quizzes
          if (data.quizzes && Array.isArray(data.quizzes)) {
            data.quizzes.forEach((quiz: any, index: number) => {
              if (quiz.timestamp) {
                const timestamp = quiz.timestamp.toDate();
                const quizTypeMap: Record<string, { title: string; icon: any; color: string; bg: string }> = {
                  'matinal': { 
                    title: 'Diário da Manhã', 
                    icon: Sunrise, 
                    color: 'text-orange-500', 
                    bg: 'bg-orange-100' 
                  },
                  'noturno': { 
                    title: 'Diário da Noite', 
                    icon: Moon, 
                    color: 'text-indigo-500', 
                    bg: 'bg-indigo-100' 
                  },
                  'emergencial': { 
                    title: 'Registro de Crise', 
                    icon: AlertTriangle, 
                    color: 'text-red-500', 
                    bg: 'bg-red-100' 
                  },
                };

                const quizInfo = quizTypeMap[quiz.tipo] || {
                  title: 'Quiz',
                  icon: BookOpen,
                  color: 'text-blue-500',
                  bg: 'bg-blue-100'
                };

                activities.push({
                  id: `quiz-${dateStr}-${index}`,
                  type: 'quiz',
                  title: `${quizInfo.title} respondido`,
                  time: formatRelativeTime(timestamp),
                  timestamp,
                  icon: quizInfo.icon,
                  iconColor: quizInfo.color,
                  bgColor: quizInfo.bg,
                  quizType: quiz.tipo
                });
              }
            });
          }

          // Processar medicamentos
          if (data.medicamentos && Array.isArray(data.medicamentos)) {
            data.medicamentos.forEach((medication: any) => {
              if (medication.frequencia && Array.isArray(medication.frequencia)) {
                medication.frequencia.forEach((freq: any, freqIndex: number) => {
                  if (freq.status === 'tomado' && freq.timestampTomado) {
                    const timestamp = freq.timestampTomado.toDate();
                    activities.push({
                      id: `med-${dateStr}-${medication.medicamentoId}-${freqIndex}`,
                      type: 'medication',
                      title: `${medication.nome} tomado`,
                      time: formatRelativeTime(timestamp),
                      timestamp,
                      icon: CheckCircle,
                      iconColor: 'text-green-500',
                      bgColor: 'bg-green-100',
                      medicationName: medication.nome
                    });
                  }
                });
              }
            });
          }
        }
      }

      // Ordenar por timestamp (mais recente primeiro) e limitar a 10 itens
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('❌ Erro ao buscar atividades recentes:', error);
      return [];
    }
  };

  // Query para buscar atividades recentes
  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recent-activities', firebaseUser?.email],
    queryFn: fetchRecentActivities,
    enabled: !!firebaseUser?.email,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 text-primary-foreground mb-6">
        <h2 className="text-xl font-semibold mb-2" data-testid="text-welcome">
          Olá, {currentUser?.name || 'Usuário'}!
        </h2>
        <p className="text-primary-foreground/80">📊 Registre seu dia a dia para gerar relatórios profissionais e compartilhar insights valiosos com seu médico</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Ações Rápidas</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Registrar Crise - Vermelho com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 hover:border-red-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[0ms]"
            data-testid="button-register-pain"
            onClick={() => setLocation('/quiz/emergencial')}
          >
            <div className="bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-600 group-hover:to-red-700 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <AlertTriangle className="h-7 w-7 text-white group-hover:animate-pulse group-hover:rotate-12 transition-all duration-300 ease-out" />
            </div>
            <p className="text-sm font-semibold text-red-700 group-hover:text-red-800 group-hover:scale-105 transition-all duration-300 ease-out">Registrar Crise</p>
          </Button>
          
          {/* Tomar Remédio - Azul com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[150ms]"
            data-testid="button-take-medication"
            onClick={() => setLocation('medications')}
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Pill className="h-7 w-7 text-white group-hover:animate-bounce group-hover:-rotate-12 transition-all duration-300 ease-out" />
            </div>
            <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800 group-hover:scale-105 transition-all duration-300 ease-out">Tomar Remédio</p>
          </Button>
          
          {/* Diário Manhã - Laranja com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 border-orange-200 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[300ms]"
            data-testid="button-diary-morning"
            onClick={() => setLocation('/quiz/matinal')}
          >
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Sunrise className="h-7 w-7 text-white group-hover:animate-spin group-hover:scale-110 transition-all duration-500 ease-out" />
            </div>
            <p className="text-sm font-semibold text-orange-700 group-hover:text-orange-800 group-hover:scale-105 transition-all duration-300 ease-out">Diário Manhã</p>
          </Button>
          
          {/* Diário Noite - Índigo/Roxo com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-indigo-50 to-purple-100 hover:from-indigo-100 hover:to-purple-200 border-indigo-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[450ms]"
            data-testid="button-diary-night"
            onClick={() => setLocation('/quiz/noturno')}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 group-hover:from-indigo-700 group-hover:to-purple-800 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Moon className="h-7 w-7 text-white group-hover:animate-pulse group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 ease-out" />
            </div>
            <p className="text-sm font-semibold text-indigo-700 group-hover:text-indigo-800 group-hover:scale-105 transition-all duration-300 ease-out">Diário Noite</p>
          </Button>
        </div>
      </div>



      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Atividade Recente</h3>
        </div>
        
        {isLoadingActivities ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <Card 
                  key={activity.id} 
                  className="shadow-sm border border-border hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className={`${activity.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-transform hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground" data-testid={`text-activity-${activity.id}`}>
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-time-${activity.id}`}>
                          {activity.time}
                        </p>
                      </div>
                      {activity.type === 'quiz' && (
                        <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                          Quiz
                        </div>
                      )}
                      {activity.type === 'medication' && (
                        <div className="text-xs text-muted-foreground bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          Medicamento
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {recentActivities.length > 0 && (
              <div className="text-center pt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-view-reports"
                  onClick={() => setLocation('reports')}
                >
                  Ver histórico completo
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="shadow-sm border border-border">
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground mb-2">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhuma atividade recente</p>
                <p className="text-sm">Comece registrando um diário ou tomando um medicamento</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
