import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationPermissionDialog } from '@/components/NotificationPermissionDialog';
import { getNotificationPermission } from '@/lib/fcmUtils';

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, loading, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, digite um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, digite um e-mail no formato válido.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite uma senha.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Termos de uso",
        description: "Aceite os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData.email, formData.password, formData.name);
      setJustRegistered(true);
      
      // Small delay to allow user context to update
      setTimeout(() => {
        setLocation('/home');
      }, 500);
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Auto-show notification dialog after successful registration
  useEffect(() => {
    if (justRegistered && currentUser) {
      const permission = getNotificationPermission();
      // Show dialog if permission not granted yet
      if (permission !== 'granted') {
        setTimeout(() => {
          setShowNotificationDialog(true);
        }, 1000); // 1 second delay for smooth UX
      }
    }
  }, [justRegistered, currentUser]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar Conta</h1>
          <p className="text-muted-foreground">Comece a gerenciar sua saúde hoje</p>
        </div>

        {/* Register Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="Seu nome completo"
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="seu@email.com"
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full rounded-xl"
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                  className="mt-1"
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  Aceito os{' '}
                  <Button variant="link" className="p-0 h-auto text-primary text-sm">
                    termos de uso
                  </Button>
                  {' '}e{' '}
                  <Button variant="link" className="p-0 h-auto text-primary text-sm">
                    política de privacidade
                  </Button>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                data-testid="button-register"
              >
                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Já tem uma conta?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation('/login')}
                  className="text-primary font-medium hover:text-primary/80 p-0"
                  data-testid="link-login"
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Notification Permission Dialog - Auto-shown after registration */}
      <NotificationPermissionDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        userId={currentUser?.id || ''}
        currentPreferences={currentUser?.notificationPreferences}
        onPreferencesUpdated={() => {
          toast({
            title: 'Bem-vindo ao FibroDiário!',
            description: 'Notificações configuradas com sucesso.',
          });
        }}
      />
    </div>
  );
}
