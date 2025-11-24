import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, X, Zap, TrendingUp, Users, FileText, Download, Bell, HeadphonesIcon } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { SubscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/hooks/useAuth';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightFeature?: string;
}

const FEATURE_COMPARISON = [
  {
    name: 'Histórico de dados',
    free: '30 dias',
    premium: 'Ilimitado',
    icon: TrendingUp,
  },
  {
    name: 'Médicos cadastrados',
    free: 'Até 3',
    premium: 'Ilimitados',
    icon: Users,
  },
  {
    name: 'Relatórios mensais',
    free: '1 por mês',
    premium: 'Ilimitados',
    icon: FileText,
  },
  {
    name: 'Análise NLP com IA',
    free: false,
    premium: true,
    icon: Zap,
  },
  {
    name: 'Relatórios avançados',
    free: false,
    premium: true,
    icon: FileText,
  },
  {
    name: 'Exportação de dados',
    free: 'Básica (CSV)',
    premium: 'Avançada (PDF, HTML)',
    icon: Download,
  },
  {
    name: 'Notificações push',
    free: false,
    premium: true,
    icon: Bell,
  },
  {
    name: 'Suporte prioritário',
    free: false,
    premium: true,
    icon: HeadphonesIcon,
  },
];

export function UpgradeModal({ open, onOpenChange, highlightFeature }: UpgradeModalProps) {
  const { currentUser } = useAuth();

  const handleUpgrade = () => {
    const checkoutUrl = SubscriptionService.getCheckoutUrl(
      currentUser?.id || '',
      currentUser?.email || ''
    );
    window.open(checkoutUrl, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-upgrade-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            Upgrade para Premium
          </DialogTitle>
          <DialogDescription>
            Desbloqueie todo o potencial do FibroDiário com recursos avançados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pricing Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl">Premium</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">
                    R$ {SUBSCRIPTION_PLANS.premium.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">por mês</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 p-3 rounded-md mb-4">
                <Zap className="w-4 h-4" />
                <span className="font-medium">14 dias de teste grátis para novos usuários!</span>
              </div>
              
              <Button
                onClick={handleUpgrade}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg font-bold shadow-lg"
                data-testid="button-start-premium-checkout"
              >
                <Crown className="w-5 h-5 mr-2" />
                Começar Premium
              </Button>
            </CardContent>
          </Card>

          {/* Feature Comparison Table */}
          <div>
            <h3 className="text-lg font-bold mb-4">Compare os Planos</h3>
            <div className="grid gap-2">
              {/* Header */}
              <div className="grid grid-cols-[2fr,1fr,1fr] gap-4 pb-2 border-b font-semibold text-sm">
                <div>Recurso</div>
                <div className="text-center">Gratuito</div>
                <div className="text-center text-amber-600">Premium</div>
              </div>

              {/* Rows */}
              {FEATURE_COMPARISON.map((feature, index) => {
                const Icon = feature.icon;
                const isHighlighted = highlightFeature === feature.name;
                
                return (
                  <div
                    key={index}
                    className={`grid grid-cols-[2fr,1fr,1fr] gap-4 py-3 px-2 rounded-md ${
                      isHighlighted ? 'bg-amber-100 border border-amber-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                    
                    <div className="text-center text-sm">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{feature.free}</span>
                      )}
                    </div>
                    
                    <div className="text-center text-sm font-medium">
                      {typeof feature.premium === 'boolean' ? (
                        feature.premium ? (
                          <Check className="w-5 h-5 text-amber-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-amber-600">{feature.premium}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por que Premium?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium">Análise Inteligente com IA</div>
                  <p className="text-sm text-muted-foreground">
                    NLP avançado analisa seus sintomas e sugere padrões de melhora
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium">Histórico Completo</div>
                  <p className="text-sm text-muted-foreground">
                    Acesse todos os seus dados desde o primeiro dia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium">Relatórios Profissionais</div>
                  <p className="text-sm text-muted-foreground">
                    Gere quantos relatórios precisar para suas consultas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center text-sm text-muted-foreground">
            Cancele quando quiser. Sem compromisso.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
