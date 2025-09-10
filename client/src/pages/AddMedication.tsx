import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Pill, Loader2, Clock, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// Validation schema based on Firebase structure
const medicationSchema = z.object({
  nome: z.string().min(1, 'Nome do medicamento é obrigatório'),
  posologia: z.string().min(1, 'Dosagem é obrigatória'),
  frequencia: z.string().min(1, 'Frequência é obrigatória'),
  medicoId: z.string().min(1, 'Médico é obrigatório'),
  horarios: z.array(z.string()).min(1, 'Pelo menos um horário é obrigatório')
});

type MedicationFormData = z.infer<typeof medicationSchema>;

// Doctor interface for dropdown
interface Doctor {
  id: string;
  nome: string;
}

export default function AddMedication() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [horarios, setHorarios] = useState<string[]>(['']);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      nome: '',
      posologia: '',
      frequencia: '',
      medicoId: '',
      horarios: ['']
    }
  });

  // Functions to handle multiple reminder times
  const addHorario = () => {
    const newHorarios = [...horarios, ''];
    setHorarios(newHorarios);
    form.setValue('horarios', newHorarios);
  };

  const removeHorario = (index: number) => {
    if (horarios.length > 1) {
      const newHorarios = horarios.filter((_, i) => i !== index);
      setHorarios(newHorarios);
      form.setValue('horarios', newHorarios);
    }
  };

  const updateHorario = (index: number, value: string) => {
    const newHorarios = [...horarios];
    newHorarios[index] = value;
    setHorarios(newHorarios);
    form.setValue('horarios', newHorarios);
  };

  // Fetch doctors for dropdown
  const fetchDoctors = async () => {
    if (!firebaseUser) {
      setLoadingDoctors(false);
      return;
    }

    try {
      const doctorsCollection = collection(db, 'medicos');
      const q = query(
        doctorsCollection,
        where('usuarioId', '==', firebaseUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const doctorsData: Doctor[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        doctorsData.push({
          id: doc.id,
          nome: data.nome || ''
        });
      });

      const sortedDoctors = doctorsData.sort((a, b) => a.nome.localeCompare(b.nome));
      setDoctors(sortedDoctors);

    } catch (error) {
      console.error('❌ Erro ao buscar médicos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de médicos"
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [firebaseUser]);

  const onSubmit = async (data: MedicationFormData) => {
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
      // Filter out empty times and create lembrete array
      const validHorarios = data.horarios.filter(hora => hora.trim() !== '');
      
      if (validHorarios.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Pelo menos um horário de lembrete deve ser informado"
        });
        return;
      }

      // Prepare medication data according to Firebase structure
      const medicationData = {
        nome: data.nome,
        posologia: data.posologia,
        frequencia: data.frequencia,
        medicoId: data.medicoId,
        lembrete: validHorarios.map(hora => ({
          hora,
          status: false // false = não tomou ainda
        })),
        usuarioId: firebaseUser.uid,
        createdAt: serverTimestamp()
      };

      // Add to Firestore medicamentos collection
      const docRef = await addDoc(collection(db, 'medicamentos'), medicationData);
      
      console.log('✅ Medicamento adicionado com sucesso:', docRef.id);

      toast({
        title: "Sucesso!",
        description: "Medicamento cadastrado com sucesso"
      });

      // Navigate back to medications page
      setLocation('medications');
      
      // Force refresh the medications page
      window.location.reload();

    } catch (error) {
      console.error('❌ Erro ao adicionar medicamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o medicamento. Tente novamente."
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
            onClick={() => setLocation('medications')}
            className="mr-2 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground">Adicionar Medicamento</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Cadastre um novo medicamento para seu tratamento
        </p>
      </div>

      {/* Form Card */}
      <Card className="shadow-sm border border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Pill className="h-5 w-5 mr-2 text-primary" />
            Dados do Medicamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome do Medicamento *
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Ex: Paracetamol"
                {...form.register('nome')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
              )}
            </div>

            {/* Dosagem (Posologia) */}
            <div className="space-y-2">
              <Label htmlFor="posologia" className="text-sm font-medium">
                Dosagem *
              </Label>
              <Input
                id="posologia"
                type="text"
                placeholder="Ex: 500mg"
                {...form.register('posologia')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.posologia && (
                <p className="text-sm text-red-500">{form.formState.errors.posologia.message}</p>
              )}
            </div>

            {/* Frequência */}
            <div className="space-y-2">
              <Label htmlFor="frequencia" className="text-sm font-medium">
                Frequência *
              </Label>
              <Input
                id="frequencia"
                type="text"
                placeholder="Ex: 3x ao dia"
                {...form.register('frequencia')}
                className="rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.frequencia && (
                <p className="text-sm text-red-500">{form.formState.errors.frequencia.message}</p>
              )}
            </div>

            {/* Médico */}
            <div className="space-y-2">
              <Label htmlFor="medicoId" className="text-sm font-medium">
                Médico Responsável *
              </Label>
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando médicos...</span>
                </div>
              ) : doctors.length === 0 ? (
                <div className="p-4 border border-border rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum médico cadastrado. Cadastre um médico primeiro.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/doctors/add')}
                    className="w-full mt-2"
                  >
                    Cadastrar Médico
                  </Button>
                </div>
              ) : (
                <Select
                  onValueChange={(value) => form.setValue('medicoId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.formState.errors.medicoId && (
                <p className="text-sm text-red-500">{form.formState.errors.medicoId.message}</p>
              )}
            </div>

            {/* Horários dos Lembretes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horários dos Lembretes *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHorario}
                  className="text-xs"
                  disabled={isSubmitting}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-2">
                {horarios.map((horario, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={horario}
                      onChange={(e) => updateHorario(index, e.target.value)}
                      className="rounded-xl flex-1"
                      disabled={isSubmitting}
                      placeholder="Selecione o horário"
                    />
                    {horarios.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHorario(index)}
                        className="p-2"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {form.formState.errors.horarios && (
                <p className="text-sm text-red-500">{form.formState.errors.horarios.message}</p>
              )}
              
              <p className="text-xs text-muted-foreground">
                Adicione todos os horários em que deve tomar o medicamento. 
                O status será marcado automaticamente quando você confirmar que tomou.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('medications')}
                className="flex-1 rounded-xl"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                disabled={isSubmitting || (doctors.length === 0 && !loadingDoctors)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Medicamento'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}