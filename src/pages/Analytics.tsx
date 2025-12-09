import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Download, 
  Share2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/hooks/use-toast';

const Analytics: React.FC = () => {
  const { user, conversations } = useApp();
  const { toast } = useToast();
  const isPremium = user?.plan === 'pro' || user?.plan === 'fluency_plus';

  // Calculate averages from conversations
  const feedbacks = conversations.filter(c => c.feedback).map(c => c.feedback!);
  
  const averages = feedbacks.length > 0 ? {
    grammar: Math.round(feedbacks.reduce((acc, f) => acc + f.grammar, 0) / feedbacks.length),
    vocabulary: Math.round(feedbacks.reduce((acc, f) => acc + f.vocabulary, 0) / feedbacks.length),
    clarity: Math.round(feedbacks.reduce((acc, f) => acc + f.clarity, 0) / feedbacks.length),
    fluency: Math.round(feedbacks.reduce((acc, f) => acc + f.fluency, 0) / feedbacks.length),
    pronunciation: Math.round(feedbacks.reduce((acc, f) => acc + (f.pronunciation || 0), 0) / feedbacks.length),
    contextual: Math.round(feedbacks.reduce((acc, f) => acc + f.contextCoherence, 0) / feedbacks.length),
  } : null;

  const commonErrors = [
    { type: 'Artigos', count: 12, example: '"the" vs "a" usage' },
    { type: 'Tempos verbais', count: 8, example: 'Past simple vs Present perfect' },
    { type: 'Preposições', count: 6, example: '"in" vs "on" vs "at"' },
  ];

  const recommendations = [
    'Pratique mais cenários de negócios para melhorar vocabulário profissional',
    'Foque em tempos verbais compostos nas próximas conversas',
    'Tente usar expressões idiomáticas para soar mais natural',
  ];

  const handleExportPDF = () => {
    if (isPremium) {
      toast({
        title: "Exportando PDF...",
        description: "Seu relatório será baixado em breve.",
      });
    } else {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para exportar PDFs.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Análises</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso detalhado</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              className="gap-2"
            >
              {!isPremium && <Lock className="w-4 h-4" />}
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => toast({ title: "Compartilhando...", description: "Link copiado!" })}
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>
        </div>

        {!averages ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Sem dados suficientes</h3>
            <p className="text-muted-foreground">Complete algumas conversas para ver suas análises</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Desempenho por Categoria
                </h2>
                
                <div className="space-y-4">
                  <MetricBar label="Gramática" value={averages.grammar} />
                  <MetricBar label="Vocabulário" value={averages.vocabulary} />
                  <MetricBar label="Clareza" value={averages.clarity} />
                  <MetricBar label="Fluência" value={averages.fluency} />
                  <MetricBar label="Pronúncia" value={averages.pronunciation} />
                  <MetricBar label="Coerência" value={averages.contextual} />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Resumo
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-foreground">{conversations.length}</p>
                    <p className="text-sm text-muted-foreground">Conversas</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-foreground">
                      {Math.round((averages.grammar + averages.vocabulary + averages.clarity + averages.fluency + averages.contextual) / 5)}
                    </p>
                    <p className="text-sm text-muted-foreground">Score Médio</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-foreground">B1</p>
                    <p className="text-sm text-muted-foreground">Nível Estimado</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-success">+12%</p>
                    <p className="text-sm text-muted-foreground">Evolução</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Errors */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Erros Mais Frequentes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {commonErrors.map((error, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{error.type}</span>
                      <span className="text-sm text-warning font-medium">{error.count}x</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{error.example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Recomendações Personalizadas
              </h2>
              
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-success';
    if (val >= 60) return 'bg-primary';
    if (val >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default Analytics;
