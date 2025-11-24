import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ExternalLink, Clock, FileText, AlertCircle } from 'lucide-react';
import { useRecentReports } from '@/hooks/useRecentReports';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { useLocation } from 'wouter';

/**
 * Seção "Últimos Relatórios Gerados" para a Home page
 * Exibe os últimos 3 relatórios gerados pelo usuário com acesso rápido
 */
export function RecentReportsSection() {
  const { data: reports, isLoading, error } = useRecentReports(3);
  const [, navigate] = useLocation();

  // Função para formatar timestamp do Firestore para data relativa
  const formatRelativeTime = (timestamp: Timestamp | Date): string => {
    try {
      let date: Date;
      
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else {
        date = timestamp;
      }
      
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data indisponível';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Últimos Relatórios</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Últimos Relatórios</h3>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Erro ao carregar relatórios recentes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!reports || reports.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Últimos Relatórios</h3>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Você ainda não gerou nenhum relatório
            </p>
            <Button 
              onClick={() => navigate('/reports/monthly')}
              data-testid="button-create-first-report"
            >
              Gerar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reports list
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Últimos Relatórios</h3>
        </div>
        {reports.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports/monthly')}
            data-testid="button-view-all-reports"
            className="text-sm"
          >
            Ver todos
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {reports.map((report, index) => (
          <Card 
            key={report.id || index}
            className="hover-elevate cursor-pointer transition-all"
            onClick={() => window.open(report.reportUrl, '_blank')}
            data-testid={`card-recent-report-${index}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <p 
                      className="font-medium text-sm truncate" 
                      data-testid={`text-report-period-${index}`}
                    >
                      {report.periodsText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <p 
                      className="text-xs"
                      data-testid={`text-report-time-${index}`}
                    >
                      {formatRelativeTime(report.generatedAt)}
                    </p>
                  </div>
                </div>
                <ExternalLink 
                  className="h-4 w-4 text-muted-foreground shrink-0" 
                  data-testid={`icon-external-link-${index}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
