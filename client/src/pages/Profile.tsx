import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Brain, Bell, BellOff } from 'lucide-react';
import { Link } from 'wouter';
import { NotificationPermissionDialog } from '@/components/NotificationPermissionDialog';
import { getNotificationPermission } from '@/lib/fcmUtils';

export default function Profile() {
  const { currentUser, updateUserProfile, updateUserPassword, testFirestoreConnection } = useAuth();
  const { toast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isTestingFirestore, setIsTestingFirestore] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  
  // Check notification permission status
  const notificationPermission = getNotificationPermission();
  const hasNotificationPermission = notificationPermission === 'granted';

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(profileForm.name.trim());
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos de senha.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password update error:', error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFirestoreTest = async () => {
    setIsTestingFirestore(true);
    try {
      const result = await testFirestoreConnection();
      toast({
        title: result ? "Firestore Funcional" : "Firestore Indisponível",
        description: result 
          ? "Conexão com Firestore bem-sucedida! A coleção 'usuarios' pode ser criada."
          : "Não foi possível conectar ao Firestore. Verifique as configurações do Firebase.",
        variant: result ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar conexão com Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsTestingFirestore(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Profile Information */}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="profileName" className="block text-sm font-medium text-foreground mb-2">
                Nome
              </Label>
              <Input
                id="profileName"
                type="text"
                value={profileForm.name}
                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                className="w-full rounded-xl"
                data-testid="input-profile-name"
              />
            </div>
            
            <div>
              <Label htmlFor="profileEmail" className="block text-sm font-medium text-foreground mb-2">
                E-mail
              </Label>
              <Input
                id="profileEmail"
                type="email"
                value={profileForm.email}
                className="w-full rounded-xl bg-muted text-muted-foreground"
                readOnly
                data-testid="input-profile-email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-update-profile"
            >
              {isUpdatingProfile ? 'Salvando...' : 'Salvar Informações'}
            </Button>
          </form>

          <Separator />

          {/* Subscription Status */}
          <div>
            <h4 className="font-medium text-foreground mb-6">Plano de Assinatura</h4>
            
            {currentUser?.isSubscriptionActive ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 text-sm font-semibold border border-green-300">
                      🏆 Premium Ativo
                    </Badge>
                    <h5 className="text-lg font-bold text-green-800 mt-3">Você é Premium!</h5>
                    <p className="text-sm text-green-700 mt-2 max-w-md mx-auto leading-relaxed">
                      Desfrute de acesso completo a todos os recursos avançados do DorLog, 
                      incluindo relatórios detalhados e sincronização em nuvem.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  
                  <div>
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-4 py-2 text-sm font-semibold border border-orange-300">
                      📦 Plano Gratuito
                    </Badge>
                    <h5 className="text-xl font-bold text-gray-800 mt-3">
                      Potencialize sua experiência!
                    </h5>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                      Desbloqueie relatórios avançados, sincronização automática, 
                      lembretes inteligentes e backup em nuvem.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={() => window.open(import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'https://checkout.stripe.com/pay/cs_test_premium_dorlog', '_blank')}
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-base py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Upgrade para Premium
                      </div>
                    </Button>
                    
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                        💳 A partir de R$ 9,99/mês
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                        ✨ Cancele quando quiser
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Password Change */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Alterar Senha</h4>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                  Senha atual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="••••••••"
                  data-testid="input-current-password"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                  Nova senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="••••••••"
                  data-testid="input-new-password"
                />
              </div>

              <div>
                <Label htmlFor="confirmNewPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirmar nova senha
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="••••••••"
                  data-testid="input-confirm-new-password"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                data-testid="button-update-password"
              >
                {isUpdatingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </div>

          <Separator />

          {/* NLP Demo Section */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Análise Inteligente (Beta)</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Experimente nosso sistema de análise NLP para insights automáticos dos seus dados de saúde.
            </p>
            
            <Link href="/nlp-demo">
              <Button
                variant="outline"
                className="w-full rounded-xl font-medium transition-colors bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                data-testid="button-nlp-demo"
              >
                <Brain className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Demonstração NLP</span>
              </Button>
            </Link>
            
            <div className="mt-2 text-xs text-center text-gray-500">
              🧠 Sistema isolado • Não interfere nas funcionalidades existentes
            </div>
          </div>

          <Separator />

          {/* Notification Preferences Section */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Preferências de Notificação</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Configure lembretes e alertas importantes para acompanhar melhor sua saúde.
            </p>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border mb-4">
              <div className="flex items-center gap-3">
                {hasNotificationPermission ? (
                  <>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Notificações Ativadas</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser?.notificationPreferences?.enabled 
                          ? 'Você receberá lembretes e alertas' 
                          : 'Configure suas preferências'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <BellOff className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Notificações Desativadas</p>
                      <p className="text-xs text-muted-foreground">Ative para receber lembretes</p>
                    </div>
                  </>
                )}
              </div>
              
              {hasNotificationPermission && currentUser?.notificationPreferences?.enabled && (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Ativo
                </Badge>
              )}
            </div>
            
            <Button
              onClick={() => setShowNotificationDialog(true)}
              variant="outline"
              className="w-full rounded-xl font-medium transition-colors"
              data-testid="button-notification-settings"
            >
              <Bell className="mr-2 h-4 w-4" />
              {hasNotificationPermission ? 'Gerenciar Preferências' : 'Ativar Notificações'}
            </Button>
          </div>

          <Separator />

          {/* Firestore Diagnostics */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Diagnóstico do Sistema</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Teste a conectividade com o Firestore para verificar se a coleção 'usuarios' pode ser criada.
            </p>
            
            <Button
              onClick={handleFirestoreTest}
              disabled={isTestingFirestore}
              variant="outline"
              className="w-full rounded-xl font-medium transition-colors"
              data-testid="button-test-firestore"
            >
              {isTestingFirestore ? 'Testando conexão...' : 'Testar Firestore'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification Permission Dialog */}
      <NotificationPermissionDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        userId={currentUser?.id || ''}
        currentPreferences={currentUser?.notificationPreferences}
        onPreferencesUpdated={() => {
          toast({
            title: 'Preferências atualizadas',
            description: 'Suas configurações de notificação foram salvas.',
          });
        }}
      />
    </div>
  );
}
