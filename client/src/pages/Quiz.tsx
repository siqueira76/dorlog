import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, collection, getDocs, query, orderBy, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Quiz, QuizQuestion, QuizAnswer, QuizSession } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import QuestionRenderer from '../components/QuestionRenderer';

export default function QuizPage() {
  const [, params] = useRoute('/quiz/:quizId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentUser, firebaseUser } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  const quizId = params?.quizId;

  useEffect(() => {
    if (!quizId) {
      setError('ID do quiz não encontrado');
      setLoading(false);
      return;
    }

    loadQuiz(quizId);
  }, [quizId]);

  const loadQuiz = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🧪 Tentando carregar quiz:', id);
      
      // Verificar configuração do Firebase
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      
      if (!projectId || !apiKey || projectId === 'demo-project') {
        throw new Error('Configuração Firebase inválida');
      }

      const quizRef = doc(db, 'quizzes', id);
      
      console.log('📁 Tentando acessar documento quiz:', `quizzes/${id}`);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        console.log('❌ Documento do quiz não encontrado');
        
        // Criar quiz de exemplo temporário baseado no tipo
        const exampleQuiz: Quiz = id === 'emergencial' ? {
          nome: "Quiz Emergencial - Demonstração",
          disparo: "manual",
          perguntas: {
            "1": {
              id: 1,
              texto: "Qual é a intensidade da sua dor agora? (0 = sem dor, 10 = dor insuportável)",
              tipo: "eva"
            },
            "2": {
              id: 2,
              texto: "Onde você está sentindo dor?",
              tipo: "checkbox",
              opcoes: ["Cabeça", "Pescoço", "Ombros", "Costas", "Braços", "Pernas", "Abdômen", "Músculos", "Articulações", "Outro local"]
            },
            "3": {
              id: 3,
              texto: "Como você descreveria sua dor?",
              tipo: "checkbox",
              opcoes: ["Pulsante", "Latejante", "Aguda", "Queimação", "Formigamento", "Peso", "Pressão", "Pontada", "Cólica", "Contínua"]
            },
            "4": {
              id: 4,
              texto: "Há quanto tempo você está sentindo essa dor?",
              tipo: "opcoes",
              opcoes: ["Menos de 1 hora", "1-3 horas", "3-6 horas", "6-12 horas", "Mais de 12 horas", "Vários dias"]
            },
            "5": {
              id: 5,
              texto: "O que pode ter desencadeado essa crise?",
              tipo: "checkbox",
              opcoes: ["Estresse", "Mudança do tempo", "Falta de sono", "Atividade física", "Alimentação", "Postura", "Trabalho", "Não sei", "Outro"]
            },
            "6": {
              id: 6,
              texto: "Que outros sintomas você está sentindo?",
              tipo: "checkbox",
              opcoes: ["Náusea", "Vômito", "Tontura", "Sensibilidade à luz", "Sensibilidade ao som", "Fadiga", "Ansiedade", "Irritabilidade", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Você já tomou algum medicamento para essa dor?",
              tipo: "opcoes",
              opcoes: ["Sim, melhorou", "Sim, não fez efeito", "Sim, piorou", "Não tomei ainda", "Não tenho medicamento"]
            },
            "8": {
              id: 8,
              texto: "Descreva qualquer informação adicional sobre esta crise:",
              tipo: "texto"
            }
          }
        } : id === 'noturno' ? {
          nome: "Quiz Noturno - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como foi seu dia hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor agora? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Quais atividades você realizou hoje?",
              tipo: "checkbox",
              opcoes: ["Exercícios", "Trabalho", "Descanso", "Tarefas domésticas", "Socialização", "Outros"]
            },
            "4": {
              id: 4,
              texto: "Como você avalia sua qualidade de sono na noite anterior?",
              tipo: "slider",
              min: 1,
              max: 10
            },
            "5": {
              id: 5,
              texto: "Descreva como se sente ao final do dia:",
              tipo: "texto"
            },
            "6": {
              id: 6,
              texto: "Que sintomas você teve hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Fadiga", "Dor muscular", "Ansiedade", "Irritabilidade", "Depressivo", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Qual é sua expectativa para o sono de hoje?",
              tipo: "opcoes",
              opcoes: ["Muito boa", "Boa", "Regular", "Ruim", "Muito ruim"]
            },
            "8": {
              id: 8,
              texto: "Algo específico que gostaria de registrar sobre hoje?",
              tipo: "texto"
            },
            "9": {
              id: 9,
              texto: "Quer descrever algo a mais?",
              tipo: "texto"
            }
          }} : {
          nome: "Quiz Matinal - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como você se sente ao acordar hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor neste momento? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Que sintomas você está sentindo hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Náusea", "Fadiga", "Dor muscular", "Ansiedade", "Nenhum"]
            },
            "4": {
              id: 4,
              texto: "Descreva brevemente como foi sua noite de sono:",
              tipo: "texto"
            }
          }
        };

        console.log('🔧 Usando quiz de demonstração');
        setQuiz(exampleQuiz);

        // Ordenar perguntas por ID
        const questions = Object.values(exampleQuiz.perguntas).sort((a, b) => {
          const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
          return aId - bId;
        });

        setOrderedQuestions(questions);

        // Inicializar sessão do quiz
        const newSession: QuizSession = {
          quizId: id,
          answers: [],
          currentQuestionIndex: 0,
          startTime: new Date(),
        };

        setSession(newSession);
        
        toast({
          title: "Modo Demonstração",
          description: "Usando quiz de exemplo. Configure a coleção 'quizzes' no Firestore para usar dados reais.",
        });
        
        return;
      }

      console.log('✅ Documento do quiz encontrado');
      const quizData = quizSnap.data();
      
      console.log('📊 Dados do quiz:', quizData);
      
      // Agora buscar as perguntas na subcoleção
      console.log('📁 Buscando perguntas na subcoleção...');
      const perguntasRef = collection(db, 'quizzes', id, 'perguntas');
      const perguntasQuery = query(perguntasRef, orderBy('id'));
      const perguntasSnap = await getDocs(perguntasQuery);
      
      if (perguntasSnap.empty) {
        console.log('⚠️ Nenhuma pergunta encontrada na subcoleção');
        console.log('🔧 Usando quiz de demonstração');
        
        // Usar quiz de demonstração baseado no tipo quando não há perguntas na subcoleção
        const exampleQuiz: Quiz = id === 'emergencial' ? {
          nome: "Quiz Emergencial - Demonstração",
          disparo: "manual",
          perguntas: {
            "1": {
              id: 1,
              texto: "Qual é a intensidade da sua dor agora? (0 = sem dor, 10 = dor insuportável)",
              tipo: "eva"
            },
            "2": {
              id: 2,
              texto: "Onde você está sentindo dor?",
              tipo: "checkbox",
              opcoes: ["Cabeça", "Pescoço", "Ombros", "Costas", "Braços", "Pernas", "Abdômen", "Músculos", "Articulações", "Outro local"]
            },
            "3": {
              id: 3,
              texto: "Como você descreveria sua dor?",
              tipo: "checkbox",
              opcoes: ["Pulsante", "Latejante", "Aguda", "Queimação", "Formigamento", "Peso", "Pressão", "Pontada", "Cólica", "Contínua"]
            },
            "4": {
              id: 4,
              texto: "Há quanto tempo você está sentindo essa dor?",
              tipo: "opcoes",
              opcoes: ["Menos de 1 hora", "1-3 horas", "3-6 horas", "6-12 horas", "Mais de 12 horas", "Vários dias"]
            },
            "5": {
              id: 5,
              texto: "O que pode ter desencadeado essa crise?",
              tipo: "checkbox",
              opcoes: ["Estresse", "Mudança do tempo", "Falta de sono", "Atividade física", "Alimentação", "Postura", "Trabalho", "Não sei", "Outro"]
            },
            "6": {
              id: 6,
              texto: "Que outros sintomas você está sentindo?",
              tipo: "checkbox",
              opcoes: ["Náusea", "Vômito", "Tontura", "Sensibilidade à luz", "Sensibilidade ao som", "Fadiga", "Ansiedade", "Irritabilidade", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Você já tomou algum medicamento para essa dor?",
              tipo: "opcoes",
              opcoes: ["Sim, melhorou", "Sim, não fez efeito", "Sim, piorou", "Não tomei ainda", "Não tenho medicamento"]
            },
            "8": {
              id: 8,
              texto: "Descreva qualquer informação adicional sobre esta crise:",
              tipo: "texto"
            }
          }
        } : id === 'noturno' ? {
          nome: "Quiz Noturno - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como foi seu dia hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor agora? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Quais atividades você realizou hoje?",
              tipo: "checkbox",
              opcoes: ["Exercícios", "Trabalho", "Descanso", "Tarefas domésticas", "Socialização", "Outros"]
            },
            "4": {
              id: 4,
              texto: "Como você avalia sua qualidade de sono na noite anterior?",
              tipo: "slider",
              min: 1,
              max: 10
            },
            "5": {
              id: 5,
              texto: "Descreva como se sente ao final do dia:",
              tipo: "texto"
            },
            "6": {
              id: 6,
              texto: "Que sintomas você teve hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Fadiga", "Dor muscular", "Ansiedade", "Irritabilidade", "Depressivo", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Qual é sua expectativa para o sono de hoje?",
              tipo: "opcoes",
              opcoes: ["Muito boa", "Boa", "Regular", "Ruim", "Muito ruim"]
            },
            "8": {
              id: 8,
              texto: "Algo específico que gostaria de registrar sobre hoje?",
              tipo: "texto"
            },
            "9": {
              id: 9,
              texto: "Quer descrever algo a mais?",
              tipo: "texto"
            }
          }} : {
          nome: "Quiz Matinal - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como você se sente ao acordar hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor neste momento? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Que sintomas você está sentindo hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Náusea", "Fadiga", "Dor muscular", "Ansiedade", "Nenhum"]
            },
            "4": {
              id: 4,
              texto: "Descreva brevemente como foi sua noite de sono:",
              tipo: "texto"
            }
          }
        };

        setQuiz(exampleQuiz);
        const questions = Object.values(exampleQuiz.perguntas).sort((a, b) => {
          const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
          return aId - bId;
        });
        setOrderedQuestions(questions);
        
        const newSession: QuizSession = {
          quizId: id,
          answers: [],
          currentQuestionIndex: 0,
          startTime: new Date(),
        };
        setSession(newSession);
        
        toast({
          title: "Modo Demonstração",
          description: "Nenhuma pergunta encontrada na subcoleção. Usando quiz de demonstração.",
        });
        
        setLoading(false);
        return;
      }

      // Converter documentos da subcoleção para o formato esperado
      const perguntasMap: Record<string, QuizQuestion> = {};
      const questionsArray: QuizQuestion[] = [];
      
      perguntasSnap.forEach((doc) => {
        const perguntaData = doc.data() as QuizQuestion;
        const perguntaId = doc.id;
        
        console.log('📋 Pergunta carregada:', perguntaId, perguntaData);
        
        perguntasMap[perguntaId] = perguntaData;
        questionsArray.push(perguntaData);
      });

      const completeQuiz: Quiz = {
        nome: quizData?.nome || 'Quiz',
        disparo: quizData?.disparo || 'manual',
        perguntas: perguntasMap
      };

      setQuiz(completeQuiz);
      
      // Ordenar perguntas por ID
      const sortedQuestions = questionsArray.sort((a, b) => {
        const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
        return aId - bId;
      });
      
      console.log('📝 Perguntas ordenadas:', sortedQuestions);
      setOrderedQuestions(sortedQuestions);

      // Inicializar sessão do quiz
      const newSession: QuizSession = {
        quizId: id,
        answers: [],
        currentQuestionIndex: 0,
        startTime: new Date(),
      };

      setSession(newSession);
      
      console.log('✅ Quiz carregado com sucesso');
    } catch (err: any) {
      console.error('❌ Erro ao carregar quiz:', err);
      console.error('❌ Stack trace:', err.stack);
      console.error('❌ Erro completo:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Erro ao carregar quiz';
      
      if (err.code === 'permission-denied') {
        console.log('🔧 Usando quiz de demonstração devido ao erro de permissão');
        
        // Usar quiz de demonstração baseado no tipo como fallback
        const exampleQuiz: Quiz = id === 'emergencial' ? {
          nome: "Quiz Emergencial - Demonstração",
          disparo: "manual",
          perguntas: {
            "1": {
              id: 1,
              texto: "Qual é a intensidade da sua dor agora? (0 = sem dor, 10 = dor insuportável)",
              tipo: "eva"
            },
            "2": {
              id: 2,
              texto: "Onde você está sentindo dor?",
              tipo: "checkbox",
              opcoes: ["Cabeça", "Pescoço", "Ombros", "Costas", "Braços", "Pernas", "Abdômen", "Músculos", "Articulações", "Outro local"]
            },
            "3": {
              id: 3,
              texto: "Como você descreveria sua dor?",
              tipo: "checkbox",
              opcoes: ["Pulsante", "Latejante", "Aguda", "Queimação", "Formigamento", "Peso", "Pressão", "Pontada", "Cólica", "Contínua"]
            },
            "4": {
              id: 4,
              texto: "Há quanto tempo você está sentindo essa dor?",
              tipo: "opcoes",
              opcoes: ["Menos de 1 hora", "1-3 horas", "3-6 horas", "6-12 horas", "Mais de 12 horas", "Vários dias"]
            },
            "5": {
              id: 5,
              texto: "O que pode ter desencadeado essa crise?",
              tipo: "checkbox",
              opcoes: ["Estresse", "Mudança do tempo", "Falta de sono", "Atividade física", "Alimentação", "Postura", "Trabalho", "Não sei", "Outro"]
            },
            "6": {
              id: 6,
              texto: "Que outros sintomas você está sentindo?",
              tipo: "checkbox",
              opcoes: ["Náusea", "Vômito", "Tontura", "Sensibilidade à luz", "Sensibilidade ao som", "Fadiga", "Ansiedade", "Irritabilidade", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Você já tomou algum medicamento para essa dor?",
              tipo: "opcoes",
              opcoes: ["Sim, melhorou", "Sim, não fez efeito", "Sim, piorou", "Não tomei ainda", "Não tenho medicamento"]
            },
            "8": {
              id: 8,
              texto: "Descreva qualquer informação adicional sobre esta crise:",
              tipo: "texto"
            }
          }
        } : id === 'noturno' ? {
          nome: "Quiz Noturno - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como foi seu dia hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor agora? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Quais atividades você realizou hoje?",
              tipo: "checkbox",
              opcoes: ["Exercícios", "Trabalho", "Descanso", "Tarefas domésticas", "Socialização", "Outros"]
            },
            "4": {
              id: 4,
              texto: "Como você avalia sua qualidade de sono na noite anterior?",
              tipo: "slider",
              min: 1,
              max: 10
            },
            "5": {
              id: 5,
              texto: "Descreva como se sente ao final do dia:",
              tipo: "texto"
            },
            "6": {
              id: 6,
              texto: "Que sintomas você teve hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Fadiga", "Dor muscular", "Ansiedade", "Irritabilidade", "Depressivo", "Nenhum"]
            },
            "7": {
              id: 7,
              texto: "Qual é sua expectativa para o sono de hoje?",
              tipo: "opcoes",
              opcoes: ["Muito boa", "Boa", "Regular", "Ruim", "Muito ruim"]
            },
            "8": {
              id: 8,
              texto: "Algo específico que gostaria de registrar sobre hoje?",
              tipo: "texto"
            },
            "9": {
              id: 9,
              texto: "Quer descrever algo a mais?",
              tipo: "texto"
            }
          }} : {
          nome: "Quiz Matinal - Demonstração",
          disparo: "notificacao",
          perguntas: {
            "1": {
              id: 1,
              texto: "Como você se sente ao acordar hoje?",
              tipo: "emojis"
            },
            "2": {
              id: 2,
              texto: "Qual é o seu nível de dor neste momento? (0 = sem dor, 10 = dor máxima)",
              tipo: "eva"
            },
            "3": {
              id: 3,
              texto: "Que sintomas você está sentindo hoje?",
              tipo: "checkbox",
              opcoes: ["Dor de cabeça", "Náusea", "Fadiga", "Dor muscular", "Ansiedade", "Nenhum"]
            },
            "4": {
              id: 4,
              texto: "Descreva brevemente como foi sua noite de sono:",
              tipo: "texto"
            }
          }
        };

        setQuiz(exampleQuiz);
        const questions = Object.values(exampleQuiz.perguntas).sort((a, b) => {
          const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
          return aId - bId;
        });
        setOrderedQuestions(questions);
        
        const newSession: QuizSession = {
          quizId: id,
          answers: [],
          currentQuestionIndex: 0,
          startTime: new Date(),
        };
        setSession(newSession);
        
        toast({
          title: "Modo Demonstração",
          description: "Usando quiz de exemplo devido a erro de configuração.",
        });
        
        setLoading(false);
        return;
      } else if (err.code === 'unavailable') {
        errorMessage = 'Serviço indisponível. Verifique sua conexão com a internet.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Erro ao Carregar Quiz",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string | number, answer: any) => {
    if (!session) return;

    const existingAnswerIndex = session.answers.findIndex(
      (a) => a.questionId === questionId
    );

    let newAnswers = [...session.answers];
    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = { questionId, answer };
    } else {
      newAnswers.push({ questionId, answer });
    }

    setSession({
      ...session,
      answers: newAnswers,
    });
  };

  const goToNextQuestion = () => {
    if (!session || session.currentQuestionIndex >= orderedQuestions.length - 1) return;
    
    setSession({
      ...session,
      currentQuestionIndex: session.currentQuestionIndex + 1,
    });
  };

  const goToPreviousQuestion = () => {
    if (!session || session.currentQuestionIndex <= 0) return;
    
    setSession({
      ...session,
      currentQuestionIndex: session.currentQuestionIndex - 1,
    });
  };

  const completeQuiz = async () => {
    if (!session || !currentUser || saving) return;

    try {
      setSaving(true);
      const completedSession: QuizSession = {
        ...session,
        endTime: new Date(),
      };

      console.log('💾 Salvando respostas do quiz...');
      await saveQuizToReportDiario(completedSession);

      // Invalidar cache da query de episódios de crise se o quiz foi do tipo emergencial
      if (completedSession.quizId === 'emergencial') {
        console.log('🔄 Invalidando cache de episódios de crise...');
        queryClient.invalidateQueries({
          queryKey: ['crisis-episodes', firebaseUser?.uid]
        });
      }

      toast({
        title: "Quiz Concluído!",
        description: "Suas respostas foram registradas com sucesso.",
      });

      // Voltar para a home usando o router interno
      setLocation('/home');
    } catch (error) {
      console.error('❌ Erro ao salvar quiz:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Houve um problema ao salvar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveQuizToReportDiario = async (completedSession: QuizSession) => {
    if (!firebaseUser?.uid) {
      throw new Error('Usuário não autenticado');
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Document ID format: userId_YYYY-MM-DD (using Firebase UID)
    const reportDocId = `${firebaseUser.uid}_${today}`;
    const reportRef = doc(db, 'report_diario', reportDocId);

    // Prepare quiz data according to the Firebase structure shown in the image
    const quizData = {
      tipo: completedSession.quizId, // 'matinal', 'noturno', or 'emergencial'
      data: Timestamp.fromDate(now),
      timestamp: Timestamp.fromDate(now),
      respostas: completedSession.answers.reduce((acc, answer) => {
        acc[answer.questionId] = answer.answer;
        return acc;
      }, {} as Record<string, any>),
      inicioQuiz: Timestamp.fromDate(completedSession.startTime),
      fimQuiz: Timestamp.fromDate(completedSession.endTime || now)
    };

    console.log('📋 Dados do quiz preparados:', quizData);

    try {
      // Check if document exists for today
      const reportDoc = await getDoc(reportRef);
      
      if (reportDoc.exists()) {
        console.log('📄 Documento do report_diario já existe, atualizando...');
        const existingData = reportDoc.data();
        const existingQuizzes = existingData.quizzes || [];
        
        // Check if there's already a quiz of this type today
        const existingQuizIndex = existingQuizzes.findIndex((q: any) => q.tipo === completedSession.quizId);
        
        if (existingQuizIndex >= 0) {
          // Update existing quiz of same type
          console.log(`🔄 Atualizando quiz ${completedSession.quizId} existente...`);
          existingQuizzes[existingQuizIndex] = quizData;
        } else {
          // Add new quiz to array
          console.log(`➕ Adicionando novo quiz ${completedSession.quizId}...`);
          existingQuizzes.push(quizData);
        }
        
        await updateDoc(reportRef, {
          quizzes: existingQuizzes,
          ultimaAtualizacao: Timestamp.fromDate(now)
        });
        
        console.log('✅ Quiz atualizado no report_diario existente');
      } else {
        console.log('📄 Criando novo documento report_diario...');
        // Create new document
        const newReportData = {
          data: Timestamp.fromDate(now),
          usuarioId: firebaseUser.uid,
          userEmail: currentUser?.email || firebaseUser.email, // Keep email for reference
          quizzes: [quizData],
          criadoEm: Timestamp.fromDate(now),
          ultimaAtualizacao: Timestamp.fromDate(now)
        };
        
        await setDoc(reportRef, newReportData);
        console.log('✅ Novo report_diario criado com quiz');
      }
      
      console.log('💾 Quiz salvo com sucesso no Firestore');
    } catch (firestoreError) {
      console.error('❌ Erro ao salvar no Firestore:', firestoreError);
      throw firestoreError;
    }
  };

  const getCurrentAnswer = (questionId: string | number) => {
    return session?.answers.find(a => a.questionId === questionId)?.answer;
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz || !session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Não foi possível carregar o quiz'}
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = orderedQuestions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex === orderedQuestions.length - 1;
  const canGoNext = getCurrentAnswer(currentQuestion.id) !== undefined;

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* Header compacto fixo */}
      <div className="flex-shrink-0 px-4 py-3 bg-background border-b">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/home')}
            data-testid="button-back-home"
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
          <div className="text-sm text-muted-foreground">
            {session.currentQuestionIndex + 1} de {orderedQuestions.length}
          </div>
        </div>
        
        <h1 className="text-lg font-bold text-foreground mb-2" data-testid="text-quiz-title">
          {quiz.nome}
        </h1>
        
        {/* Progress Bar simplified - main progress is now at bottom */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{
              width: `${((session.currentQuestionIndex + 1) / orderedQuestions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Pergunta Atual - área scrollável */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <QuestionRenderer
              question={currentQuestion}
              answer={getCurrentAnswer(currentQuestion.id)}
              onAnswer={handleAnswer}
            />
            
            {/* Integrated navigation buttons within the question card */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center gap-3">
                {/* Previous button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    if ('vibrate' in navigator) {
                      navigator.vibrate(10);
                    }
                    goToPreviousQuestion();
                  }}
                  disabled={session.currentQuestionIndex === 0}
                  data-testid="button-previous-question-inline"
                  className={`
                    quiz-nav-button h-12 px-4 min-w-[100px] touch-target transition-all duration-200 font-medium
                    ${session.currentQuestionIndex === 0 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:shadow-md active:scale-95 hover:bg-gray-50'
                    }
                  `}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Anterior</span>
                </Button>

                {/* Progress info */}
                <div className="flex flex-col items-center px-2">
                  <div className="text-xs text-muted-foreground font-medium">
                    {session.currentQuestionIndex + 1} de {orderedQuestions.length}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {orderedQuestions.map((_, index) => (
                      <div
                        key={index}
                        className={`
                          w-2 h-2 rounded-full transition-colors duration-200
                          ${index <= session.currentQuestionIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                          }
                        `}
                      />
                    ))}
                  </div>
                </div>

                {/* Next/Complete button */}
                {isLastQuestion ? (
                  <Button
                    onClick={() => {
                      if ('vibrate' in navigator) {
                        navigator.vibrate([20, 50, 20]);
                      }
                      completeQuiz();
                    }}
                    disabled={!canGoNext || saving}
                    className={`
                      quiz-nav-button h-12 px-4 min-w-[100px] touch-target transition-all duration-200 font-medium
                      bg-green-600 hover:bg-green-700 text-white
                      ${(!canGoNext || saving)
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:shadow-md active:scale-95 shadow-green-200'
                      }
                    `}
                    data-testid="button-complete-quiz-inline"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Concluir</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if ('vibrate' in navigator) {
                        navigator.vibrate(15);
                      }
                      goToNextQuestion();
                    }}
                    disabled={!canGoNext}
                    data-testid="button-next-question-inline"
                    className={`
                      quiz-nav-button h-12 px-4 min-w-[100px] touch-target transition-all duration-200 font-medium
                      bg-blue-600 hover:bg-blue-700 text-white
                      ${!canGoNext 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:shadow-md active:scale-95 shadow-blue-200'
                      }
                    `}
                  >
                    <span>Próxima</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
              
              {/* Answer requirement hint */}
              {!canGoNext && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-full inline-block border border-amber-200">
                    Responda esta pergunta para continuar
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simplified progress footer - minimal and clean */}
      <div className="flex-shrink-0 bg-white border-t">
        {/* Progress indicator bar only */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ 
              width: `${((session.currentQuestionIndex + 1) / orderedQuestions.length) * 100}%` 
            }}
          />
        </div>
        
        {/* Optional quiz title reminder */}
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">{quiz.nome}</p>
        </div>
      </div>
    </div>
  );
}