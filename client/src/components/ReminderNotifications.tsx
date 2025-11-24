import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReminderMonitor, ActiveReminder } from '@/hooks/useReminderMonitor';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pill, Clock } from 'lucide-react';

/**
 * Componente global que monitora e exibe notificações de lembretes de medicamentos
 * Deve ser incluído uma vez no App.tsx
 */
export function ReminderNotifications() {
  const { firebaseUser } = useAuth();
  const { activeReminders, isMonitoring } = useReminderMonitor(firebaseUser?.uid || null);
  const { toast } = useToast();
  const previousRemindersRef = useRef<Set<string>>(new Set());

  // Função para marcar medicamento como tomado
  const markAsTaken = async (reminder: ActiveReminder) => {
    if (!firebaseUser?.uid) return;

    try {
      console.log('✅ Marcando medicamento como tomado:', reminder);

      // Buscar dados atuais do medicamento
      const medicationRef = doc(db, 'medicamentos', reminder.medicationId);
      const medicationSnapshot = await getDoc(medicationRef);
      
      if (!medicationSnapshot.exists()) {
        throw new Error('Medicamento não encontrado');
      }

      const medicationData = medicationSnapshot.data();
      const lembretes = medicationData.lembrete || [];

      // Atualizar o status do lembrete específico
      lembretes[reminder.reminderIndex] = {
        ...lembretes[reminder.reminderIndex],
        status: true
      };

      // Salvar no Firestore
      await updateDoc(medicationRef, { lembrete: lembretes });

      // Registrar no relatório diário
      const today = new Date().toISOString().split('T')[0];
      const reportRef = doc(db, 'report_diario', `${firebaseUser.uid}_${today}`);
      const reportSnap = await getDoc(reportRef);
      
      const medicationEntry = {
        nome: reminder.medicationName,
        hora: reminder.reminderTime,
        timestamp: Timestamp.now()
      };
      
      if (reportSnap.exists()) {
        const currentData = reportSnap.data();
        const currentMedications = currentData.medicamentos || [];
        await updateDoc(reportRef, {
          medicamentos: [...currentMedications, medicationEntry],
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(reportRef, {
          usuarioId: firebaseUser.uid,
          data: today,
          medicamentos: [medicationEntry],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      toast({
        title: '✅ Medicamento registrado',
        description: `${reminder.medicationName} às ${reminder.reminderTime}`,
        duration: 3000,
      });

    } catch (error) {
      console.error('❌ Erro ao marcar medicamento como tomado:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível registrar o medicamento',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  // Resetar cache quando usuário mudar (prevenir leakage entre sessões)
  useEffect(() => {
    previousRemindersRef.current.clear();
    console.log('🔄 Cache de lembretes limpo (mudança de usuário)');
  }, [firebaseUser?.uid]);

  // Exibir toast quando novos lembretes aparecerem
  useEffect(() => {
    if (!isMonitoring) return;

    // Se não há lembretes ativos, limpar o cache completamente
    if (activeReminders.length === 0) {
      if (previousRemindersRef.current.size > 0) {
        previousRemindersRef.current.clear();
        console.log('🧹 Cache de lembretes limpo (nenhum ativo)');
      }
      return;
    }

    // Construir set dos IDs ativos
    const activeIds = new Set(
      activeReminders.map(r => `${r.medicationId}-${r.reminderIndex}`)
    );

    // Verificar quais lembretes são novos
    activeReminders.forEach(reminder => {
      const reminderId = `${reminder.medicationId}-${reminder.reminderIndex}`;
      
      // Se é um lembrete novo (não estava no set anterior)
      if (!previousRemindersRef.current.has(reminderId)) {
        console.log('🔔 Novo lembrete ativo:', reminder);
        
        // Adicionar ao set de lembretes já exibidos
        previousRemindersRef.current.add(reminderId);

        // Exibir toast persistente
        toast({
          title: '💊 Hora do Medicamento!',
          description: `${reminder.medicationName} - ${reminder.reminderTime}`,
          duration: 300000, // 5 minutos (persistente)
          action: (
            <Button
              size="sm"
              onClick={() => markAsTaken(reminder)}
              data-testid={`button-mark-taken-${reminder.medicationId}`}
            >
              Já tomei
            </Button>
          ),
        });
      }
    });

    // Limpar lembretes que não estão mais ativos
    previousRemindersRef.current.forEach(id => {
      if (!activeIds.has(id)) {
        previousRemindersRef.current.delete(id);
      }
    });

  }, [activeReminders, isMonitoring, toast]);

  // Componente não renderiza nada visualmente (usa apenas toasts)
  return null;
}
