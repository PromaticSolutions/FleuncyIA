import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, TrendingUp, AlertCircle, Lightbulb, BarChart3, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, user } = useApp();
  const { toast } = useToast();

  // Calculate averages
  const averages = {
    grammar: 0,
    vocabulary: 0,
    clarity: 0,
    fluency: 0,
    overall: 0,
  };

  if (conversations.length > 0) {
    conversations.forEach(c => {
      if (c.feedback) {
        averages.grammar += c.feedback.grammar;
        averages.vocabulary += c.feedback.vocabulary;
        averages.clarity += c.feedback.clarity;
        averages.fluency += c.feedback.fluency;
        averages.overall += c.feedback.overallScore;
      }
    });

    Object.keys(averages).forEach(key => {
      averages[key as keyof typeof averages] = Math.round(averages[key as keyof typeof averages] / conversations.length);
    });
  }

  const commonErrors = [
    { category: 'Gramática', issue: 'Uso incorreto de artigos', frequency: 5 },
    { category: 'Vocabulário', issue: 'Repetição de palavras', frequency: 3 },
    { category: 'Gramática', issue: 'Tempos verbais inconsistentes', frequency: 4 },
  ];

  const recommendations = [
    'Pratique o uso de artigos definidos e indefinidos',
    'Expanda seu vocabulário com sinônimos',
    'Revise os tempos verbais do passado',
    'Tente usar mais expressões idiomáticas',
  ];

  const handleExportPDF = () => {
    if (user?.plan === 'fluency_plus') {
      toast({
        title: "Exportando PDF...",
        description: "Seu relatório será baixado em breve.",
      });
    } else {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para Fluency Plus para exportar PDFs.",
      });
      navigate('/plans');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Análises</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Overview Card */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Visão Geral</h2>
              <p className="text-sm text-muted-foreground">
                Baseado em {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Complete conversas para ver suas análises
            </p>
          ) : (
            <div className="space-y-4">
              <MetricBar label="Gramática" value={averages.grammar} />
              <MetricBar label="Vocabulário" value={averages.vocabulary} />
              <MetricBar label="Clareza" value={averages.clarity} />
              <MetricBar label="Fluência" value={averages.fluency} />
            </div>
          )}
        </div>

        {/* Evolution */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Evolução</h2>
              <p className="text-sm text-muted-foreground">Seu progresso ao longo do tempo</p>
            </div>
          </div>

          <div className="h-32 bg-muted rounded-xl flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Gráfico de evolução disponível após 5 conversas
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
              <p className="text-xs text-muted-foreground">Conversas</p>
            </div>
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{averages.overall || '-'}</p>
              <p className="text-xs text-muted-foreground">Média Geral</p>
            </div>
          </div>
        </div>

        {/* Common Errors */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Erros Frequentes</h2>
              <p className="text-sm text-muted-foreground">Pontos a melhorar</p>
            </div>
          </div>

          <div className="space-y-3">
            {commonErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{error.issue}</p>
                  <p className="text-xs text-muted-foreground">{error.category}</p>
                </div>
                <span className="text-sm font-bold text-destructive">{error.frequency}x</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Recomendações</h2>
              <p className="text-sm text-muted-foreground">Dicas personalizadas</p>
            </div>
          </div>

          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-fluency-light-blue rounded-xl">
                <span className="text-primary font-bold">{index + 1}.</span>
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1"
            onClick={handleExportPDF}
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar PDF
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1"
            onClick={() => toast({ title: "Compartilhando...", description: "Link copiado!" })}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-success';
    if (v >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;

  const navItems = [
    { icon: '🏠', label: 'Início', path: '/home' },
    { icon: '📚', label: 'Histórico', path: '/history' },
    { icon: '📊', label: 'Análises', path: '/analytics' },
    { icon: '👤', label: 'Perfil', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
              location === item.path 
                ? 'bg-fluency-light-blue' 
                : 'hover:bg-muted'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs font-medium ${
              location === item.path ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
