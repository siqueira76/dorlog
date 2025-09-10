import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fibroLogo from '@assets/logo-removebg-preview_1757388974002.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, loading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, digite seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua senha.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, digite um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      setLocation('home');
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      setLocation('home');
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={fibroLogo} 
            alt="FibroDiário" 
            className="w-16 h-16 object-contain animate-pulse"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
        
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={fibroLogo} 
              alt="FibroDiário" 
              className="w-20 h-20 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo ao FibroDiário</h1>
          <p className="text-muted-foreground">Gerencie sua saúde de forma inteligente</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                    data-testid="checkbox-remember"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Lembrar-me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:text-primary/80 p-0"
                  data-testid="button-forgot-password"
                >
                  Esqueci a senha
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                data-testid="button-login"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Google Sign In */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">ou</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="mt-4 w-full border-border text-foreground rounded-xl font-medium hover:bg-accent transition-colors flex items-center justify-center"
                data-testid="button-google-signin"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </Button>
            </div>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Não tem uma conta?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation('register')}
                  className="text-primary font-medium hover:text-primary/80 p-0"
                  data-testid="link-register"
                >
                  Cadastre-se
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
