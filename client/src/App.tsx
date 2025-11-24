import React, { useEffect } from 'react';
import { Router, Route, Switch, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PremiumProtectedRoute from '@/components/PremiumProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { GoogleLoginTermsDialog } from '@/components/GoogleLoginTermsDialog';
import { ReminderNotifications } from '@/components/ReminderNotifications';

// Component to handle Google Login Terms Dialog
function GoogleTermsDialogContainer() {
  const { showGoogleTermsDialog, currentUser, acceptTermsAndNotifications } = useAuth();

  if (!showGoogleTermsDialog || !currentUser) {
    return null;
  }

  return (
    <GoogleLoginTermsDialog
      open={showGoogleTermsDialog}
      onOpenChange={() => {}} // Prevent manual close
      userId={currentUser.id}
      onComplete={acceptTermsAndNotifications}
    />
  );
}

// Simplified component for initial redirect
function InitialRedirect() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!loading) {
      console.log('🔄 InitialRedirect: User status:', { 
        currentUser: !!currentUser, 
        loading,
        pathname: window.location.pathname
      });
      
      // Check if we're at root and redirect accordingly
      const currentPath = window.location.pathname;
      const isAtRoot = currentPath === '/';
      
      if (isAtRoot) {
        const targetPath = currentUser ? '/home' : '/login';
        console.log('🔄 Redirecting from root to:', targetPath);
        navigate(targetPath, { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return null;
}

// Import pages with correct names
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Doctors from '@/pages/Doctors';
import Medications from '@/pages/Medications';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';
import MonthlyReportGenerator from '@/pages/MonthlyReportGenerator';
import AddDoctor from '@/pages/AddDoctor';
import AddMedication from '@/pages/AddMedication';
import Quiz from '@/pages/Quiz';
import Register from '@/pages/Register';
import NLPDemo from '@/pages/NLPDemo';
import RescueMedicationDemo from '@/pages/RescueMedicationDemo';
import NotificationSettings from '@/pages/NotificationSettings';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    console.log('🔧 App initialized:', {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      currentUrl: window.location.href
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router base="/">
          <Switch>
            <Route path="/" component={InitialRedirect} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            
            <Route path="/home">
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/doctors">
              <ProtectedRoute>
                <Layout>
                  <Doctors />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/doctors/add">
              <ProtectedRoute>
                <Layout>
                  <AddDoctor />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/medications">
              <ProtectedRoute>
                <Layout>
                  <Medications />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/medications/add">
              <ProtectedRoute>
                <Layout>
                  <AddMedication />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/reports">
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/reports/monthly">
              <ProtectedRoute>
                <PremiumProtectedRoute>
                  <Layout>
                    <MonthlyReportGenerator />
                  </Layout>
                </PremiumProtectedRoute>
              </ProtectedRoute>
            </Route>
            
            <Route path="/profile">
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/quiz/:type">
              <ProtectedRoute>
                <Layout>
                  <Quiz />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/nlp-demo">
              <ProtectedRoute>
                <Layout>
                  <NLPDemo />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/rescue-medication-demo">
              <ProtectedRoute>
                <Layout>
                  <RescueMedicationDemo />
                </Layout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/notification-settings">
              <ProtectedRoute>
                <Layout>
                  <NotificationSettings />
                </Layout>
              </ProtectedRoute>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </Router>
        <GoogleTermsDialogContainer />
        <ReminderNotifications />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;