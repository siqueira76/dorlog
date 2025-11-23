/**
 * Notification Permission Dialog Component
 * Displays a user-friendly dialog to request notification permissions
 * Explains benefits and allows users to configure notification preferences
 */

import { useState } from 'react';
import { Bell, BellOff, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isFCMSupported, requestNotificationPermission, getNotificationPermission } from '@/lib/fcmUtils';
import { updateNotificationPreferences } from '@/services/fcmService';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentPreferences?: {
    enabled: boolean;
    morningQuiz: boolean;
    eveningQuiz: boolean;
    medicationReminders: boolean;
    healthInsights: boolean;
    emergencyAlerts: boolean;
  };
  onPreferencesUpdated?: () => void;
}

export function NotificationPermissionDialog({
  open,
  onOpenChange,
  userId,
  currentPreferences,
  onPreferencesUpdated
}: NotificationPermissionDialogProps) {
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [preferences, setPreferences] = useState(currentPreferences || {
    enabled: false,
    morningQuiz: true,
    eveningQuiz: true,
    medicationReminders: true,
    healthInsights: true,
    emergencyAlerts: true
  });

  const handleRequestPermission = async () => {
    if (!isFCMSupported()) {
      toast({
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.',
        variant: 'destructive'
      });
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        // Update preferences with notifications enabled
        const updatedPreferences = { ...preferences, enabled: true };
        await updateNotificationPreferences(userId, updatedPreferences);

        toast({
          title: 'Notificações ativadas!',
          description: 'Você receberá lembretes e alertas importantes sobre sua saúde.',
        });

        onPreferencesUpdated?.();
        onOpenChange(false);
      } else if (permission === 'denied') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisará habilitar notificações nas configurações do navegador.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await updateNotificationPreferences(userId, preferences);
      
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
      });

      onPreferencesUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas preferências.',
        variant: 'destructive'
      });
    }
  };

  const currentPermission = getNotificationPermission();
  const isPermissionGranted = currentPermission === 'granted';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-notification-permission">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Ativar Notificações
          </DialogTitle>
          <DialogDescription>
            Receba lembretes e alertas importantes para acompanhar melhor sua saúde
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-3 rounded-md bg-muted">
            <div className="flex items-center gap-2">
              {isPermissionGranted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {isPermissionGranted ? 'Notificações permitidas' : 'Notificações bloqueadas'}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Você receberá:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Lembretes para preencher o quiz matinal e noturno</li>
              <li>• Alertas de horário dos medicamentos</li>
              <li>• Insights sobre correlações de dor e sintomas</li>
              <li>• Notificação quando relatórios estiverem prontos</li>
            </ul>
          </div>

          {/* Preferences (only show if permission granted) */}
          {isPermissionGranted && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">Preferências de Notificação:</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="morning-quiz" className="text-sm">
                    Quiz Matinal (8h)
                  </Label>
                  <Switch
                    id="morning-quiz"
                    checked={preferences.morningQuiz}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, morningQuiz: checked }))
                    }
                    data-testid="switch-morning-quiz"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="evening-quiz" className="text-sm">
                    Quiz Noturno (20h)
                  </Label>
                  <Switch
                    id="evening-quiz"
                    checked={preferences.eveningQuiz}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, eveningQuiz: checked }))
                    }
                    data-testid="switch-evening-quiz"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="medication" className="text-sm">
                    Lembretes de Medicação
                  </Label>
                  <Switch
                    id="medication"
                    checked={preferences.medicationReminders}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, medicationReminders: checked }))
                    }
                    data-testid="switch-medication"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="insights" className="text-sm">
                    Insights de Saúde
                  </Label>
                  <Switch
                    id="insights"
                    checked={preferences.healthInsights}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, healthInsights: checked }))
                    }
                    data-testid="switch-insights"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="emergency" className="text-sm">
                    Alertas de Emergência
                  </Label>
                  <Switch
                    id="emergency"
                    checked={preferences.emergencyAlerts}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, emergencyAlerts: checked }))
                    }
                    disabled
                    data-testid="switch-emergency"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground pt-2 border-t">
            🔒 Seus dados são privados e seguros. As notificações são enviadas apenas para este dispositivo.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          
          {isPermissionGranted ? (
            <Button
              onClick={handleUpdatePreferences}
              data-testid="button-save-preferences"
            >
              Salvar Preferências
            </Button>
          ) : (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              data-testid="button-enable-notifications"
            >
              {isRequesting ? 'Solicitando...' : 'Ativar Notificações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
