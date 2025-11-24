import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscriptionService';

interface UpgradePromptBannerProps {
  context?: 'history-limit' | 'doctor-limit' | 'report-limit' | 'trial-ending';
  customMessage?: string;
  onUpgradeClick?: () => void;
}

export function UpgradePromptBanner({ 
  context = 'history-limit',
  customMessage,
  onUpgradeClick 
}: UpgradePromptBannerProps) {
  const { currentUser } = useAuth();
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!currentUser?.id) return;
      
      try {
        const status = await SubscriptionService.getSubscriptionStatus(currentUser.id);
        if (status.isTrialing) {
          setTrialDaysRemaining(status.trialDaysRemaining);
        }
      } catch (error) {
        console.error('Erro ao verificar status trial:', error);
      }
    };

    checkTrialStatus();
  }, [currentUser]);

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      const checkoutUrl = SubscriptionService.getCheckoutUrl(
        currentUser?.id || '',
        currentUser?.email || ''
      );
      window.open(checkoutUrl, '_blank');
    }
  };

  const getContextualMessage = () => {
    switch (context) {
      case 'history-limit':
        return {
          title: 'Histórico Limitado a 30 Dias',
          description: 'Upgrade para ver todos os seus dados desde o início',
          icon: TrendingUp,
        };
      case 'doctor-limit':
        return {
          title: 'Limite de 3 Médicos Atingido',
          description: 'Cadastre quantos médicos precisar com Premium',
          icon: Sparkles,
        };
      case 'report-limit':
        return {
          title: 'Limite Mensal de Relatórios',
          description: 'Gere relatórios ilimitados com análise NLP',
          icon: TrendingUp,
        };
      case 'trial-ending':
        return {
          title: `Trial Termina em ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'Dia' : 'Dias'}`,
          description: 'Não perca acesso às funcionalidades Premium',
          icon: Clock,
        };
      default:
        return {
          title: 'Desbloqueie Recursos Premium',
          description: 'Obtenha acesso completo ao FibroDiário',
          icon: Crown,
        };
    }
  };

  const message = getContextualMessage();
  const Icon = message.icon;

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-amber-900 mb-1">
              {customMessage || message.title}
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              {message.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                data-testid="button-upgrade-premium-banner"
              >
                <Crown className="w-4 h-4 mr-2" />
                Fazer Upgrade - R$ 19,90/mês
              </Button>
              
              {context === 'trial-ending' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/reports'}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Ver Benefícios
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
