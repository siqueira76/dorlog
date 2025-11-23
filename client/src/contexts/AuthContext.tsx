import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User, Subscription } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import ReminderService from '@/services/reminderService';
import { detectUserTimezone, hasTimezoneChanged } from '@/lib/timezoneUtils';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  testFirestoreConnection: () => Promise<boolean>;
  checkSubscriptionStatus: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create or update user document in Firestore with controlled error handling and subscription check
  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: any, requireSave: boolean = false) => {
    if (!firebaseUser?.uid) {
      console.log('❌ createUserDocument: firebaseUser.uid não encontrado');
      return null;
    }

    // Check Firebase configuration
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const hasValidConfig = projectId && apiKey && projectId !== 'demo-project';
    
    console.log('🔧 Configuração Firebase:', {
      projectId: projectId ? '✓ Configurado' : '❌ Ausente',
      apiKey: apiKey ? '✓ Configurado' : '❌ Ausente',
      hasValidConfig
    });
    
    if (!hasValidConfig) {
      console.log('❌ Configuração Firebase incompleta - pulando Firestore');
      if (requireSave) {
        throw new Error('Configuração do Firebase incompleta');
      }
      return null;
    }

    try {
      console.log('🔑 Obtendo token de autenticação...');
      const token = await firebaseUser.getIdToken(true);
      if (!token) {
        console.log('❌ Token de autenticação não obtido');
        return null;
      }
      console.log('✅ Token obtido com sucesso');

      console.log('📁 Tentando acessar coleção "usuarios"...');
      const userRef = doc(db, 'usuarios', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      console.log('📊 Resultado da consulta:', userSnap.exists() ? 'Documento existe' : 'Documento não existe');

      let userData: User;

      if (!userSnap.exists()) {
        const { displayName, email } = firebaseUser;
        const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
        
        // Check subscription status for the user
        const isSubscriptionActive = email ? await checkSubscriptionStatus(email) : false;
        
        // Detect user's timezone automatically
        const timezoneInfo = detectUserTimezone();
        console.log('🌍 Novo usuário - timezone detectado:', timezoneInfo);
        
        userData = {
          id: firebaseUser.uid,
          name: displayName || additionalData?.name || '',
          email: email || '',
          provider,
          createdAt: new Date(),
          updatedAt: new Date(),
          isSubscriptionActive,
          
          // Timezone information (automatically detected)
          timezone: timezoneInfo.timezone,
          timezoneOffset: timezoneInfo.timezoneOffset,
          timezoneAutoDetected: timezoneInfo.timezoneAutoDetected,
          
          // Initialize empty FCM tokens array
          fcmTokens: [],
          
          // Initialize notification preferences (all enabled by default)
          notificationPreferences: {
            enabled: false, // User needs to explicitly enable notifications
            morningQuiz: true,
            eveningQuiz: true,
            medicationReminders: true,
            healthInsights: true,
            emergencyAlerts: true
          }
        };

        console.log('💾 Criando novo documento no Firestore:', {
          uid: firebaseUser.uid,
          email: userData.email,
          name: userData.name,
          provider: userData.provider,
          isSubscriptionActive
        });

        await setDoc(userRef, userData);
        console.log('✅ Documento criado, verificando...');
        
        // Verify creation
        const verifySnap = await getDoc(userRef);
        if (verifySnap.exists()) {
          console.log('✅ Usuário salvo e verificado no Firestore!');
          return userData;
        } else {
          console.log('❌ Verificação falhou - documento não foi criado');
          if (requireSave) throw new Error('Falha ao verificar usuário salvo');
          return null;
        }
      } else {
        console.log('✅ Usuário existente encontrado no Firestore');
        const existingUserData = userSnap.data() as User;
        
        // Check subscription status for existing user
        const isSubscriptionActive = existingUserData.email ? 
          await checkSubscriptionStatus(existingUserData.email) : false;
        
        // Check if timezone has changed (e.g., user traveling)
        const currentTimezoneInfo = detectUserTimezone();
        const timezoneHasChanged = hasTimezoneChanged(existingUserData.timezone);
        
        // Update the user data with current subscription status
        userData = {
          ...existingUserData,
          isSubscriptionActive,
        };
        
        // Prepare update object
        const updateData: any = { 
          isSubscriptionActive,
          updatedAt: new Date()
        };
        
        // If user doesn't have timezone yet OR timezone changed, update it
        if (!existingUserData.timezone || timezoneHasChanged) {
          updateData.timezone = currentTimezoneInfo.timezone;
          updateData.timezoneOffset = currentTimezoneInfo.timezoneOffset;
          updateData.timezoneAutoDetected = currentTimezoneInfo.timezoneAutoDetected;
          
          userData.timezone = currentTimezoneInfo.timezone;
          userData.timezoneOffset = currentTimezoneInfo.timezoneOffset;
          userData.timezoneAutoDetected = currentTimezoneInfo.timezoneAutoDetected;
          
          console.log('🌍 Timezone atualizado:', {
            previous: existingUserData.timezone,
            current: currentTimezoneInfo.timezone
          });
        }
        
        // Defensive normalization: Check if notification preferences are properly initialized
        // This handles both missing field AND empty object from earlier versions
        const needsPreferencesInit = !existingUserData.notificationPreferences || 
          typeof existingUserData.notificationPreferences.enabled === 'undefined';
        
        if (needsPreferencesInit) {
          updateData.notificationPreferences = {
            enabled: false,
            morningQuiz: true,
            eveningQuiz: true,
            medicationReminders: true,
            healthInsights: true,
            emergencyAlerts: true
          };
          userData.notificationPreferences = updateData.notificationPreferences;
          console.log('🔔 Inicializando preferências de notificação');
        }
        
        // Defensive normalization: Initialize fcmTokens if missing or not an array
        const needsTokensInit = !existingUserData.fcmTokens || !Array.isArray(existingUserData.fcmTokens);
        
        if (needsTokensInit) {
          updateData.fcmTokens = [];
          userData.fcmTokens = [];
          console.log('📱 Inicializando array de tokens FCM');
        }
        
        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await updateDoc(userRef, updateData);
          
          console.log('🔄 Dados do usuário atualizados:', {
            isSubscriptionActive,
            timezoneUpdated: !!updateData.timezone,
            preferencesInitialized: !!updateData.notificationPreferences,
            fcmTokensInitialized: !!updateData.fcmTokens,
            fieldsUpdated: Object.keys(updateData)
          });
        } else {
          console.log('ℹ️ Nenhuma atualização necessária');
        }
        
        return userData;
      }
    } catch (error: any) {
      console.error('❌ Erro ao interagir com Firestore:', {
        message: error.message,
        code: error.code
      });
      
      if (error.code === 'permission-denied') {
        console.error('🚨 ERRO DE PERMISSÃO FIRESTORE:');
        console.error('- Configure as regras no Firebase Console');
        console.error('- Vá para Firestore Database > Rules');
        console.error('- Permita acesso à coleção "usuarios" para usuários autenticados');
        console.error('- Verifique FIRESTORE_SETUP.md para instruções detalhadas');
      }
      
      if (requireSave) {
        throw new Error(`Falha crítica no Firestore: ${error.message}`);
      }
      
      return null;
    }
  };

  // Check subscription status in Firestore
  const checkSubscriptionStatus = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 Verificando status de assinatura para:', email);
      
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const hasValidConfig = projectId && apiKey && projectId !== 'demo-project';
      
      if (!hasValidConfig) {
        console.log('❌ Configuração Firebase incompleta - não é possível verificar assinaturas');
        return false;
      }

      const subscriptionRef = doc(db, 'assinaturas', email);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        console.log('📋 Nenhuma assinatura encontrada para:', email);
        return false;
      }

      const subscriptionData = subscriptionSnap.data() as Subscription;
      const subscriptionDate = subscriptionData.data;
      const currentDate = new Date();

      let subscriptionDateObj: Date;
      
      // Handle Firestore Timestamp objects and regular Date objects
      if (subscriptionDate && typeof subscriptionDate === 'object' && 'toDate' in subscriptionDate) {
        // It's a Firestore Timestamp
        subscriptionDateObj = (subscriptionDate as any).toDate();
      } else if (subscriptionDate instanceof Date) {
        // It's already a Date
        subscriptionDateObj = subscriptionDate;
      } else {
        // Try to parse as string or other format
        subscriptionDateObj = new Date(subscriptionDate as any);
      }

      // Check if subscription date is in the past (which means it's active)
      const isActive = subscriptionDateObj < currentDate;
      
      console.log('📊 Status da assinatura:', {
        email,
        subscriptionDate: subscriptionDateObj.toISOString(),
        currentDate: currentDate.toISOString(),
        isActive
      });

      return isActive;
    } catch (error: any) {
      console.error('❌ Erro ao verificar assinatura:', {
        email,
        message: error.message,
        code: error.code
      });
      return false;
    }
  };

  // Test Firestore connection directly
  const testFirestoreConnection = async (): Promise<boolean> => {
    try {
      console.log('🧪 Testando conexão direta com Firestore...');
      
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      
      if (!projectId || !apiKey || projectId === 'demo-project') {
        console.log('❌ Configuração Firebase inválida para teste');
        return false;
      }
      
      // Test with a simple document creation
      const testRef = doc(db, 'test', 'connection');
      const testData = {
        timestamp: new Date(),
        test: true
      };
      
      await setDoc(testRef, testData);
      console.log('✅ Documento de teste criado');
      
      // Verify it was created
      const testSnap = await getDoc(testRef);
      if (testSnap.exists()) {
        console.log('✅ Verificação bem-sucedida - Firestore funcional');
        
        // Clean up test document
        await deleteDoc(testRef);
        console.log('🗑️ Documento de teste removido');
        
        return true;
      } else {
        console.log('❌ Verificação falhou');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro no teste de conexão Firestore:', error);
      return false;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Wait for auth token
      await result.user.getIdToken();
      
      // Try to get/create user document but don't block login if it fails
      const userDoc = await createUserDocument(result.user);
      if (userDoc) {
        setCurrentUser(userDoc);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao DorLog.",
        });
      } else {
        // Create fallback user data
        const fallbackUser: User = {
          id: result.user.uid,
          name: result.user.displayName || '',
          email: result.user.email || '',
          provider: 'email',
        };
        setCurrentUser(fallbackUser);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao DorLog.",
        });
      }
    } catch (error: any) {
      let errorMessage = "Erro no login. Tente novamente.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "E-mail não cadastrado. Crie uma conta primeiro.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta. Verifique e tente novamente.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de e-mail inválido.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas. Aguarde antes de tentar novamente.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Esta conta foi desabilitada.";
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Register with email and password - requires Firestore save
  const register = async (email: string, password: string, name: string) => {
    let firebaseUser: FirebaseUser | null = null;
    
    try {
      console.log('🔄 Iniciando processo de registro...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = result.user;
      
      // Update display name
      await updateProfile(result.user, {
        displayName: name,
      });

      console.log('🔄 Iniciando processo de registro no Firestore...');
      // For new registrations, try to save in Firestore but don't fail if blocked
      const userDoc = await createUserDocument(result.user, { name }, false);
      
      if (userDoc) {
        setCurrentUser(userDoc);
        toast({
          title: "Conta criada com sucesso!",
          description: "Usuário registrado no sistema.",
        });
      } else {
        // Use fallback even for new registrations
        const fallbackUser: User = {
          id: result.user.uid,
          name: name,
          email: result.user.email || '',
          provider: 'email',
        };
        setCurrentUser(fallbackUser);
        toast({
          title: "Conta criada com sucesso!",
          description: "Registro concluído. Configure o Firestore para funcionalidade completa.",
        });
      }
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este e-mail já está cadastrado. Faça login ou use outro e-mail.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Método de registro não permitido.";
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Login with Google - Check if user exists, create if new
  const loginWithGoogle = async () => {
    try {
      console.log('🔄 Iniciando login com Google...');
      const result = await signInWithPopup(auth, googleProvider);
      
      // Wait for authentication token to be available
      await result.user.getIdToken();
      
      // Small delay to ensure Firebase Auth is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to get/create user document but don't block login if it fails
      const userDoc = await createUserDocument(result.user, undefined, false);
      
      if (userDoc) {
        setCurrentUser(userDoc);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao DorLog.",
        });
      } else {
        // Use fallback for Google login
        const fallbackUser: User = {
          id: result.user.uid,
          name: result.user.displayName || '',
          email: result.user.email || '',
          provider: 'google',
        };
        setCurrentUser(fallbackUser);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao DorLog.",
        });
      }
    } catch (error: any) {
      let errorMessage = "Erro no login com Google. Tente novamente.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login cancelado. Tente novamente.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup bloqueado pelo navegador. Permita popups para este site.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Esta conta já existe com outro método de login.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Login com Google não está configurado.";
      }
      
      toast({
        title: "❌ Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Erro no logout",
        description: "Erro ao sair. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (name: string) => {
    if (!firebaseUser || !currentUser) return;

    try {
      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: name,
      });

      // Update Firestore document
      const userRef = doc(db, 'usuarios', firebaseUser.uid);
      await updateDoc(userRef, {
        name,
        updatedAt: new Date(),
      });

      // Update local state
      setCurrentUser({
        ...currentUser,
        name,
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Erro ao atualizar informações. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser) return;

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, newPassword);

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    } catch (error: any) {
      console.error('Update password error:', error);
      let errorMessage = "Erro ao alterar senha. Tente novamente.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Senha atual incorreta.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "A nova senha deve ter pelo menos 6 caracteres.";
      }
      
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Create immediate fallback user to prevent loading issues
        const fallbackUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
        };

        setCurrentUser(fallbackUser);
        setLoading(false);

        // Only try Firestore if we have proper Firebase config
        const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_PROJECT_ID && 
                                 import.meta.env.VITE_FIREBASE_API_KEY;
        
        if (hasFirebaseConfig) {
          // Debounced Firestore enhancement to prevent multiple calls
          const timeoutId = setTimeout(async () => {
            try {
              const userDoc = await createUserDocument(firebaseUser);
              if (userDoc) {
                setCurrentUser(userDoc);
              }

              // Verificar e resetar lembretes se necessário (diariamente às 0h)
              try {
                await ReminderService.checkAndResetIfNeeded(firebaseUser.uid);
              } catch (error) {
                console.error('Erro ao verificar reset de lembretes:', error);
                // Não mostrar erro ao usuário, apenas log
              }
            } catch (error) {
              // Silently handle Firestore errors to prevent console spam
            }
          }, 2000);

          // Cleanup function to prevent memory leaks
          return () => clearTimeout(timeoutId);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile,
    updateUserPassword,
    testFirestoreConnection,
    checkSubscriptionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
