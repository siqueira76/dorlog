import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Pill, Sunrise, Moon } from 'lucide-react';
import { useLocation } from 'wouter';
import { RecentReportsSection } from '@/components/RecentReportsSection';

export default function Home() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-5">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Registrar Crise - Vermelho com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 hover:border-red-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[0ms]"
            data-testid="button-register-pain"
            onClick={() => setLocation('/quiz/emergencial')}
          >
            <div className="bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-600 group-hover:to-red-700 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <AlertTriangle className="h-7 w-7 text-white group-hover:animate-pulse group-hover:rotate-12 transition-all duration-300 ease-out" />
            </div>
            <p className="text-sm font-semibold text-red-700 group-hover:text-red-800 group-hover:scale-105 transition-all duration-300 ease-out">Registrar Crise</p>
          </Button>
          
          {/* Tomar Remédio - Azul com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[150ms]"
            data-testid="button-take-medication"
            onClick={() => setLocation('/medications')}
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Pill className="h-7 w-7 text-white group-hover:animate-bounce group-hover:-rotate-12 transition-all duration-300 ease-out" />
            </div>
            <p className="text-sm font-semibold text-blue-700 group-hover:text-blue-800 group-hover:scale-105 transition-all duration-300 ease-out">Tomar Remédio</p>
          </Button>
          
          {/* Diário Manhã - Laranja com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 border-orange-200 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[300ms]"
            data-testid="button-diary-morning"
            onClick={() => setLocation('/quiz/matinal')}
          >
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Sunrise className="h-7 w-7 text-white group-hover:animate-spin group-hover:scale-110 transition-all duration-500 ease-out" />
            </div>
            <p className="text-sm font-semibold text-orange-700 group-hover:text-orange-800 group-hover:scale-105 transition-all duration-300 ease-out">Diário Manhã</p>
          </Button>
          
          {/* Diário Noite - Índigo/Roxo com gradiente */}
          <Button
            variant="outline"
            className="group bg-gradient-to-br from-indigo-50 to-purple-100 hover:from-indigo-100 hover:to-purple-200 border-indigo-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out h-28 flex-col space-y-3 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in-0 duration-500 delay-[450ms]"
            data-testid="button-diary-night"
            onClick={() => setLocation('/quiz/noturno')}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 group-hover:from-indigo-700 group-hover:to-purple-800 group-hover:scale-110 group-active:scale-95 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out">
              <Moon className="h-7 w-7 text-white group-hover:animate-pulse group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 ease-out" />
            </div>
            <p className="text-sm font-semibold text-indigo-700 group-hover:text-indigo-800 group-hover:scale-105 transition-all duration-300 ease-out">Diário Noite</p>
          </Button>
        </div>
      </div>

      {/* Recent Reports Section */}
      <RecentReportsSection />
    </div>
  );
}
