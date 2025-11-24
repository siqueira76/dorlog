import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RelatorioHistorico } from '@/services/unifiedReportService';
import { useAuth } from './useAuth';

/**
 * Hook para buscar os últimos relatórios gerados pelo usuário
 * Usado na seção "Últimos Relatórios" da Home page
 */
export function useRecentReports(limitCount: number = 3) {
  const { user } = useAuth();

  return useQuery<RelatorioHistorico[]>({
    queryKey: ['/api/relatorios-historico', user?.uid, limitCount],
    queryFn: async () => {
      if (!user?.uid) {
        return [];
      }

      try {
        // Query Firestore for recent reports
        const reportsRef = collection(db, 'relatorios_historico');
        const q = query(
          reportsRef,
          where('userId', '==', user.uid),
          orderBy('generatedAt', 'desc'),
          limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        
        const reports: RelatorioHistorico[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({
            id: doc.id,
            ...doc.data()
          } as RelatorioHistorico);
        });

        console.log(`📊 [useRecentReports] Encontrados ${reports.length} relatórios recentes`);
        return reports;
      } catch (error) {
        console.error('❌ [useRecentReports] Erro ao buscar relatórios:', error);
        throw error;
      }
    },
    enabled: !!user?.uid, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  });
}
