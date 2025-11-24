import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { RecentReport } from '@/types/user';

/**
 * Hook para buscar os últimos relatórios gerados pelo usuário
 * Usado na seção "Últimos Relatórios" da Home page
 * 
 * Lê diretamente do campo recentReports do usuário (max 3 itens)
 * Filtra automaticamente relatórios com URLs expirados
 */
export function useRecentReports() {
  const { currentUser, loading: isAuthLoading } = useAuth();

  const recentReports = useMemo(() => {
    if (!currentUser?.recentReports) {
      return [];
    }

    const now = new Date();
    
    // Filter out expired reports (URLs expire after 7 days)
    const validReports = currentUser.recentReports.filter((report) => {
      // Handle both Date objects and Firestore Timestamps
      let expiresAt: Date;
      if (report.expiresAt instanceof Date) {
        expiresAt = report.expiresAt;
      } else if (typeof report.expiresAt === 'object' && 'toDate' in report.expiresAt) {
        // Firestore Timestamp
        expiresAt = (report.expiresAt as any).toDate();
      } else {
        // Fallback: try to parse as ISO string
        expiresAt = new Date(report.expiresAt);
      }
      
      // Validate date is valid
      if (isNaN(expiresAt.getTime())) {
        console.warn('⚠️ [useRecentReports] Invalid expiresAt date:', report.expiresAt);
        return false;
      }
      
      return expiresAt > now;
    });

    console.log(`📊 [useRecentReports] ${validReports.length} relatórios válidos de ${currentUser.recentReports.length} total`);
    
    return validReports;
  }, [currentUser?.recentReports]);

  return {
    data: recentReports,
    isLoading: isAuthLoading, // Reflect auth loading state
    error: null
  };
}
