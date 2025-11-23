/**
 * Google Login Terms Dialog Component
 * Combined terms acceptance and notification activation for Google login users
 */

import { useState } from 'react';
import { Bell, FileText, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  requestFCMToken, 
  registerFCMToken,
  updateNotificationPreferences 
} from '@/services/fcmService';
import { isFCMSupported } from '@/lib/fcmUtils';

interface GoogleLoginTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: (termsAccepted: boolean, notificationsEnabled: boolean) => Promise<void>;
}

export function GoogleLoginTermsDialog({
  open,
  onOpenChange,
  userId,
  onComplete
}: GoogleLoginTermsDialogProps) {
  const { toast } = useToast();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Pre-checked
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!termsAccepted) {
      toast({
        title: 'Termos não aceitos',
        description: 'Você precisa aceitar os termos de uso para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📋 Processando aceite de termos e notificações...', {
        termsAccepted,
        notificationsEnabled,
        userId
      });

      // Handle notifications if enabled
      if (notificationsEnabled) {
        console.log('🔔 Ativando notificações...');
        
        if (!isFCMSupported()) {
          console.warn('⚠️ FCM não suportado neste navegador');
          toast({
            title: 'Notificações não suportadas',
            description: 'Seu navegador não suporta notificações. Continuando sem ativar notificações.',
          });
        } else {
          try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              console.log('✅ Permissão concedida, obtendo token FCM...');
              
              // Get and register FCM token
              const fcmToken = await requestFCMToken();
              
              if (fcmToken) {
                console.log('📱 Token FCM obtido, registrando no Firestore...');
                await registerFCMToken(userId, fcmToken);
                console.log('✅ Token FCM registrado com sucesso');
              } else {
                console.warn('⚠️ Não foi possível obter token FCM');
              }
              
              // Set all notification preferences to true
              const allPreferences = {
                enabled: true,
                morningQuiz: true,
                eveningQuiz: true,
                medicationReminders: true,
                healthInsights: true,
                emergencyAlerts: true
              };
              
              await updateNotificationPreferences(userId, allPreferences);
              console.log('✅ Todas as preferências de notificação ativadas');
              
              toast({
                title: 'Notificações ativadas!',
                description: 'Você receberá lembretes e alertas sobre sua saúde.',
              });
            } else {
              console.log('⚠️ Permissão de notificação negada pelo usuário');
              setNotificationsEnabled(false);
            }
          } catch (error) {
            console.error('❌ Erro ao configurar notificações:', error);
            // Don't block the flow if notifications fail
            toast({
              title: 'Aviso',
              description: 'Não foi possível ativar notificações, mas você pode ativá-las depois no perfil.',
            });
          }
        }
      }

      // Call parent completion handler
      await onComplete(termsAccepted, notificationsEnabled);

      toast({
        title: 'Configuração concluída!',
        description: 'Bem-vindo ao FibroDiário.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('❌ Erro ao processar configuração inicial:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a configuração. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Bem-vindo ao FibroDiário
          </DialogTitle>
          <DialogDescription>
            Para começar, precisamos que você aceite nossos termos e configure algumas preferências.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Terms of Use */}
          <div className="flex items-start space-x-3 p-4 rounded-xl border border-border bg-muted/30">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-1"
              data-testid="checkbox-terms"
            />
            <div className="flex-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Aceito os Termos de Uso
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Li e concordo com os{' '}
                <a
                  href="/termos-de-uso"
                  target="_blank"
                  className="text-primary underline hover:text-primary/80"
                >
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a
                  href="/politica-de-privacidade"
                  target="_blank"
                  className="text-primary underline hover:text-primary/80"
                >
                  Política de Privacidade
                </a>
                .
              </p>
            </div>
          </div>

          {/* Notification Activation */}
          <div className="flex items-start space-x-3 p-4 rounded-xl border border-border bg-green-50 dark:bg-green-950/20">
            <Checkbox
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) => setNotificationsEnabled(checked === true)}
              className="mt-1"
              data-testid="checkbox-notifications"
            />
            <div className="flex-1">
              <Label
                htmlFor="notifications"
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-green-600" />
                Ativar Notificações
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Receba lembretes para questionários diários, medicações e insights sobre sua saúde.
                Todas as notificações serão ativadas automaticamente.
              </p>
              {isFCMSupported() && (
                <div className="mt-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  ✓ Recomendado para melhor acompanhamento
                </div>
              )}
            </div>
          </div>

          {!isFCMSupported() && (
            <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
              ⚠️ Seu navegador não suporta notificações push. Você pode continuar sem notificações.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!termsAccepted || isProcessing}
            className="w-full"
            data-testid="button-confirm-terms"
          >
            {isProcessing ? 'Configurando...' : 'Confirmar e Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
