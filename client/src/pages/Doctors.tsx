import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCheck, Plus, Mail, Phone, Edit, Trash2, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Doctor type based on Firebase structure
interface Doctor {
  id: string; // This is the Firestore document ID, not a field in the document
  nome: string;
  especialidade: string;
  crm: string;
  contato: {
    telefone: string;
    email: string;
  };
  usuarioId: string;
}

export default function Doctors() {
  const [, setLocation] = useLocation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const handleAddDoctor = () => {
    setLocation('/doctors/add');
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDoctor || !firebaseUser) return;

    setIsUpdateLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updatedDoctor = {
        nome: formData.get('nome') as string,
        especialidade: formData.get('especialidade') as string,
        crm: formData.get('crm') as string,
        contato: {
          telefone: formData.get('telefone') as string,
          email: formData.get('email') as string,
        }
      };

      const doctorRef = doc(db, 'medicos', editingDoctor.id);
      await updateDoc(doctorRef, updatedDoctor);

      setIsEditDialogOpen(false);
      setEditingDoctor(null);
      fetchDoctors(); // Refresh the list

      toast({
        title: "Sucesso",
        description: "Médico atualizado com sucesso!"
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar médico:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o médico"
      });
    } finally {
      setIsUpdateLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    if (!firebaseUser) return;

    try {
      const doctorRef = doc(db, 'medicos', doctorId);
      await deleteDoc(doctorRef);

      fetchDoctors(); // Refresh the list

      toast({
        title: "Sucesso",
        description: `Médico ${doctorName} removido com sucesso!`
      });

    } catch (error) {
      console.error('❌ Erro ao deletar médico:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o médico"
      });
    }
  };

  // Fetch doctors from Firebase
  const fetchDoctors = async () => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Buscando médicos para usuário:', firebaseUser.uid);
      
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
          nome: data.nome || '',
          especialidade: data.especialidade || '',
          crm: data.crm || '',
          contato: {
            telefone: data.contato?.telefone || '',
            email: data.contato?.email || ''
          },
          usuarioId: data.usuarioId || ''
        });
      });

      // Sort doctors by name on the client side
      const sortedDoctors = doctorsData.sort((a, b) => a.nome.localeCompare(b.nome));
      setDoctors(sortedDoctors);
      console.log('✅ Médicos carregados:', sortedDoctors.length);

    } catch (error) {
      console.error('❌ Erro ao buscar médicos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de médicos"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [firebaseUser]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Meus Médicos</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie sua equipe médica e mantenha as informações atualizadas
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Meus Médicos</h2>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
            data-testid="button-add-doctor"
            onClick={handleAddDoctor}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Gerencie sua equipe médica e mantenha as informações atualizadas
        </p>
      </div>

      {/* Doctors List or Empty State */}
      {doctors.length === 0 ? (
        /* Empty State */
        <Card className="shadow-sm border border-border">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum médico cadastrado</h3>
              <p className="text-sm mb-6">
                Adicione seus médicos para ter acesso rápido às informações de contato e especialidades
              </p>
              <Button
                className="bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                data-testid="button-add-first-doctor"
                onClick={handleAddDoctor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Médico
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Doctors List */
        <div className="space-y-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="shadow-sm border border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{doctor.nome}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{doctor.especialidade}</p>
                    <p className="text-xs text-muted-foreground mb-3">CRM: {doctor.crm}</p>
                    
                    {/* Contact Information */}
                    <div className="space-y-1">
                      {doctor.contato.telefone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {doctor.contato.telefone}
                        </div>
                      )}
                      {doctor.contato.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2" />
                          {doctor.contato.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDoctor(doctor)}
                      data-testid={`button-edit-doctor-${doctor.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-doctor-${doctor.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o médico <strong>{doctor.nome}</strong>? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDoctor(doctor.id, doctor.nome)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Médico</DialogTitle>
          </DialogHeader>
          {editingDoctor && (
            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome*</Label>
                <Input
                  id="edit-nome"
                  name="nome"
                  defaultValue={editingDoctor.nome}
                  placeholder="Digite o nome completo"
                  required
                  data-testid="input-edit-nome"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-especialidade">Especialidade*</Label>
                <Input
                  id="edit-especialidade"
                  name="especialidade"
                  defaultValue={editingDoctor.especialidade}
                  placeholder="Ex: Cardiologia, Neurologia"
                  required
                  data-testid="input-edit-especialidade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-crm">CRM*</Label>
                <Input
                  id="edit-crm"
                  name="crm"
                  defaultValue={editingDoctor.crm}
                  placeholder="Digite o CRM"
                  required
                  data-testid="input-edit-crm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  name="telefone"
                  type="tel"
                  defaultValue={editingDoctor.contato.telefone}
                  placeholder="(11) 99999-9999"
                  data-testid="input-edit-telefone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingDoctor.contato.email}
                  placeholder="medico@exemplo.com"
                  data-testid="input-edit-email"
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdateLoading}
                  data-testid="button-update-doctor"
                >
                  {isUpdateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
