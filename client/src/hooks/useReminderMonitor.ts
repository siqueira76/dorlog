import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReminderService from '@/services/reminderService';

export interface ActiveReminder {
  medicationId: string;
  medicationName: string;
  reminderTime: string;
  reminderIndex: number;
}

interface UseReminderMonitorReturn {
  activeReminders: ActiveReminder[];
  isMonitoring: boolean;
}

/**
 * Hook que monitora lembretes de medicamentos em tempo real
 * Verifica a cada minuto se algum lembrete chegou ao horário configurado
 */
export function useReminderMonitor(userId: string | null): UseReminderMonitorReturn {
  const [activeReminders, setActiveReminders] = useState<ActiveReminder[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!userId) {
      setActiveReminders([]);
      setIsMonitoring(false);
      return;
    }

    console.log('💊 Iniciando monitoramento de lembretes para usuário:', userId);
    setIsMonitoring(true);

    // Função que verifica lembretes pendentes
    const checkReminders = async () => {
      try {
        // Buscar medicamentos do usuário
        const medicationsCollection = collection(db, 'medicamentos');
        const q = query(
          medicationsCollection,
          where('usuarioId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setActiveReminders([]);
          return;
        }

        const pendingReminders: ActiveReminder[] = [];

        querySnapshot.forEach((docSnapshot) => {
          const medication = docSnapshot.data();
          const medicationId = docSnapshot.id;
          const medicationName = medication.nome || 'Medicamento';
          const lembretes = medication.lembrete || [];

          // Verificar cada lembrete do medicamento
          lembretes.forEach((lembrete: any, index: number) => {
            const { hora, status } = lembrete;
            
            // Se ainda não foi tomado e está dentro do horário
            if (!status && ReminderService.isReminderTime(hora, 30)) {
              pendingReminders.push({
                medicationId,
                medicationName,
                reminderTime: hora,
                reminderIndex: index
              });
            }
          });
        });

        // Atualizar apenas se houve mudança
        setActiveReminders(prev => {
          const prevIds = prev.map(r => `${r.medicationId}-${r.reminderIndex}`).sort();
          const newIds = pendingReminders.map(r => `${r.medicationId}-${r.reminderIndex}`).sort();
          
          if (prevIds.join(',') !== newIds.join(',')) {
            console.log('⏰ Lembretes ativos atualizados:', pendingReminders.length);
            return pendingReminders;
          }
          
          return prev;
        });

      } catch (error) {
        console.error('❌ Erro ao verificar lembretes:', error);
      }
    };

    // Verificar imediatamente
    checkReminders();

    // Verificar a cada 1 minuto
    const intervalId = setInterval(checkReminders, 60000); // 60 segundos

    return () => {
      console.log('💊 Parando monitoramento de lembretes');
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [userId]);

  return { activeReminders, isMonitoring };
}
