import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { playNotificationSound, playQuietBeep, isAudioEnabled } from '@/utils/notificationSound';
import { Volume2, VolumeX, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettings() {
  const [audioSupported, setAudioSupported] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setAudioSupported(isAudioEnabled());
    
    // Carregar preferência salva
    const savedPref = localStorage.getItem('medicationSoundEnabled');
    if (savedPref !== null) {
      setSoundEnabled(savedPref === 'true');
    }
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('medicationSoundEnabled', enabled.toString());
    
    toast({
      title: enabled ? '🔊 Som ativado' : '🔇 Som desativado',
      description: enabled 
        ? 'Você receberá alertas sonoros para medicamentos'
        : 'Apenas notificações visuais serão exibidas',
      duration: 2000,
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Configurações de Notificações</h1>
        <p className="text-muted-foreground">
          Personalize como você recebe alertas de medicamentos
        </p>
      </div>

      {!audioSupported && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <VolumeX className="w-5 h-5" />
              Áudio não suportado
            </CardTitle>
            <CardDescription>
              Seu navegador não suporta reprodução de áudio. Você receberá apenas notificações visuais.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Alertas Sonoros
          </CardTitle>
          <CardDescription>
            Toque um som quando for hora de tomar medicamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-toggle" className="text-base">
                Som de notificação
              </Label>
              <p className="text-sm text-muted-foreground">
                Tocar alerta sonoro junto com a notificação visual
              </p>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
              disabled={!audioSupported}
              data-testid="switch-notification-sound"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Testar Sons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => playNotificationSound()}
                disabled={!audioSupported}
                data-testid="button-test-notification-sound"
              >
                <Bell className="w-4 h-4 mr-2" />
                Som de Notificação
              </Button>
              <Button
                variant="outline"
                onClick={() => playQuietBeep()}
                disabled={!audioSupported}
                data-testid="button-test-quiet-beep"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Bip Discreto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Clique nos botões acima para ouvir os diferentes sons disponíveis
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">1</span>
            </div>
            <div>
              <p className="font-medium">Lembrete Configurado</p>
              <p className="text-muted-foreground">
                Quando você define horários para seus medicamentos
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">2</span>
            </div>
            <div>
              <p className="font-medium">Hora do Medicamento</p>
              <p className="text-muted-foreground">
                Na hora marcada, você recebe uma notificação visual (toast) e sonora
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">3</span>
            </div>
            <div>
              <p className="font-medium">Confirmação</p>
              <p className="text-muted-foreground">
                Clique em "Já tomei" para registrar no seu relatório diário
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">💡 Dica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Para garantir que você nunca perca um lembrete, mantenha a aba do FibroDiário aberta
          no seu navegador. As notificações funcionam mesmo se você estiver em outra aba!
        </CardContent>
      </Card>
    </div>
  );
}
