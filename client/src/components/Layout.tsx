import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import DrawerNavigation from './DrawerNavigation';

interface LayoutProps {
  children: ReactNode;
}

const pageTitle: Record<string, string> = {
  '/home': 'Início',
  '/doctors': 'Médicos',
  '/medications': 'Medicamentos',
  '/reports': 'Relatórios',
  '/profile': 'Meu Perfil',
  '/notification-settings': 'Configurações',
};

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const currentTitle = pageTitle[location] || 'DorLog';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header title={currentTitle} onMenuClick={handleMenuClick} />
      
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      <BottomNavigation onNavigate={handleNavigate} />
      
      <DrawerNavigation
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
