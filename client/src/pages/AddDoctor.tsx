import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Validation schema based on Firebase structure
const doctorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  especialidade: z.string().min(1, 'Especialidade é obrigatória'),
  crm: z.string().min(1, 'CRM é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal(''))
});

type DoctorFormData = z.infer<typeof doctorSchema>;

export default function AddDoctor() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      nome: '',
      especialidade: '',
      crm: '',
      telefone: '',
      email: ''
    }
  });

  const onSubmit = async (data: DoctorFormData) => {
    if (!firebaseUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare doctor data according to Firebase structure
      const doctorData = {
        nome: data.nome,
        especialidade: data.especialidade,
        crm: data.crm,
        contato: {
          telefone: data.telefone || '',
          email: data.email || ''
        },
        usuarioId: firebaseUser.uid,
        createdAt: serverTimestamp()
      };

      // Add to Firestore medicos collection
      const docRef = await addDoc(collection(db, 'medicos'), doctorData);
      
      console.log('✅ Médico adicionado com sucesso:', docRef.id);

      toast({
        title: "Sucesso!",
        description: "Médico cadastrado com sucesso"
      });

      // Navigate back to doctors page
      setLocation('doctors');
      
      // Force refresh the doctors page by adding a query parameter
      window.location.reload();

    } catch (error) {
      console.error('❌ Erro ao adicionar médico:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o médico. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('doctors')}
            className="mr-2 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground">Adicionar Médico</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Cadastre um novo médico para sua equipe de cuidados
        </p>
      </div>

      {/* Form Card */}
      <Card className="shadow-sm border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <UserPlus className="h-5 w-5 mr-2 text-primary" />
            Dados do Médico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Dr. João Silva"
                {...form.register('nome')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
              )}
            </div>

            {/* Especialidade */}
            <div className="space-y-2">
              <Label htmlFor="especialidade" className="text-sm font-medium">
                Especialidade *
              </Label>
              <Input
                id="especialidade"
                type="text"
                placeholder="Cardiologia"
                {...form.register('especialidade')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.especialidade && (
                <p className="text-sm text-red-500">{form.formState.errors.especialidade.message}</p>
              )}
            </div>

            {/* CRM */}
            <div className="space-y-2">
              <Label htmlFor="crm" className="text-sm font-medium">
                CRM *
              </Label>
              <Input
                id="crm"
                type="text"
                placeholder="123456/SP"
                {...form.register('crm')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.crm && (
                <p className="text-sm text-red-500">{form.formState.errors.crm.message}</p>
              )}
            </div>

            {/* Contact Information (Optional) */}
            <div className="border-t pt-4 mt-6">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Informações de Contato (Opcional)
              </h4>
              
              {/* Telefone */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="telefone" className="text-sm font-medium">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  {...form.register('telefone')}
                  className="rounded-xl"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doutor@clinica.com"
                  {...form.register('email')}
                  className="rounded-xl"
                  disabled={isSubmitting}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('doctors')}
                className="flex-1 rounded-xl"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Médico'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}