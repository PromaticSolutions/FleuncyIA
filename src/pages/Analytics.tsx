import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Download, 
  Share2,
  Lock,
  Target,
  Calendar,
  Award,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);
  const [userPlan, setUserPlan] = useState<string>('trial');
  
  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthUserId(authUser?.id);
      
      if (authUser?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('plan')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (profile?.plan) {
          setUserPlan(profile.plan);
        }
      }
    };
    getUser();
  }, []);
  
  const { conversations, isLoading } = useConversations(authUserId);
  const isPremium = userPlan === 'pro' || userPlan === 'fluency_plus';

  // Calculate real averages from conversations
  const feedbacks = conversations.filter(c => c.feedback).map(c => c.feedback!);
  
  const averages = feedbacks.length > 0 ? {
    grammar: Math.round(feedbacks.reduce((acc, f) => acc + f.grammar, 0) / feedbacks.length),
    vocabulary: Math.round(feedbacks.reduce((acc, f) => acc + f.vocabulary, 0) / feedbacks.length),
    clarity: Math.round(feedbacks.reduce((acc, f) => acc + f.clarity, 0) / feedbacks.length),
    fluency: Math.round(feedbacks.reduce((acc, f) => acc + f.fluency, 0) / feedbacks.length),
    pronunciation: Math.round(feedbacks.reduce((acc, f) => acc + (f.pronunciation || 0), 0) / feedbacks.length),
    contextual: Math.round(feedbacks.reduce((acc, f) => acc + f.contextCoherence, 0) / feedbacks.length),
  } : null;

  // Calculate overall score
  const overallScore = averages 
    ? Math.round((averages.grammar + averages.vocabulary + averages.clarity + averages.fluency + averages.contextual) / 5)
    : 0;

  // Determine estimated level based on score
  const getEstimatedLevel = (score: number) => {
    if (score >= 90) return { level: 'C1', label: 'Avançado' };
    if (score >= 75) return { level: 'B2', label: 'Intermediário-Alto' };
    if (score >= 60) return { level: 'B1', label: 'Intermediário' };
    if (score >= 45) return { level: 'A2', label: 'Básico-Alto' };
    return { level: 'A1', label: 'Básico' };
  };

  const estimatedLevel = getEstimatedLevel(overallScore);

  // Calculate total practice time
  const totalMinutes = conversations.reduce((acc, c) => {
    if (c.endedAt) {
      return acc + Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 60000);
    }
    return acc;
  }, 0);

  // Get most common errors from all feedbacks
  const allErrors = feedbacks.flatMap(f => f.errors || []);
  const errorCounts: Record<string, number> = {};
  allErrors.forEach(error => {
    const key = error.category || 'outro';
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  });
  const errorLabels: Record<string, string> = {
    grammar: 'Gramática',
    vocabulary: 'Vocabulário',
    pronunciation: 'Pronúncia',
    context: 'Contexto',
    outro: 'Outro'
  };
  const topErrors = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ type: errorLabels[category] || category, count }));

  // Generate personalized recommendations
  const getRecommendations = () => {
    if (!averages) return [];
    const recs = [];
    
    if (averages.grammar < 60) {
      recs.push('Foque em exercícios de gramática, especialmente tempos verbais');
    }
    if (averages.vocabulary < 60) {
      recs.push('Amplie seu vocabulário praticando novos cenários');
    }
    if (averages.fluency < 60) {
      recs.push('Pratique conversas mais longas para melhorar a fluência');
    }
    if (averages.contextual < 60) {
      recs.push('Preste atenção ao contexto das situações para respostas mais adequadas');
    }
    if (conversations.length < 5) {
      recs.push('Continue praticando! Quanto mais conversas, melhor seu progresso');
    }
    if (recs.length === 0) {
      recs.push('Excelente progresso! Continue praticando para manter o nível');
    }
    
    return recs.slice(0, 3);
  };

  const recommendations = getRecommendations();

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
      navigate('/plans');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando análises...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Análises</h1>
            <p className="text-muted-foreground">Seu progresso detalhado</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              {!isPremium && <Lock className="w-3.5 h-3.5" />}
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link copiado!" });
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
          </div>
        </div>

        {!averages || conversations.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Sem dados suficientes</h3>
            <p className="text-muted-foreground mb-6">Complete algumas conversas para ver suas análises</p>
            <Button onClick={() => navigate('/home')}>
              Iniciar conversa
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{overallScore}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Score Médio</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{estimatedLevel.level}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{estimatedLevel.label}</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{conversations.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Conversas</p>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalMinutes}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Min praticados</p>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Desempenho por Categoria
              </h2>
              
              <div className="space-y-4">
                <MetricBar label="Gramática" value={averages.grammar} />
                <MetricBar label="Vocabulário" value={averages.vocabulary} />
                <MetricBar label="Clareza" value={averages.clarity} />
                <MetricBar label="Fluência" value={averages.fluency} />
                <MetricBar label="Coerência" value={averages.contextual} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Common Errors */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Pontos de Atenção
                </h2>
                
                {topErrors.length > 0 ? (
                  <div className="space-y-3">
                    {topErrors.map((error, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-foreground">{error.type}</span>
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {error.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Continue praticando para identificar padrões de erro.
                  </p>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Recomendações
                </h2>
                
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Continue evoluindo!</h3>
                  <p className="text-sm text-muted-foreground">
                    Pratique mais para melhorar seu score e subir de nível.
                  </p>
                </div>
                <Button onClick={() => navigate('/home')} className="gap-2 w-full sm:w-auto">
                  Nova conversa
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
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
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-primary';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (val: number) => {
    if (val >= 80) return 'text-green-600 dark:text-green-400';
    if (val >= 60) return 'text-primary';
    if (val >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold ${getTextColor(value)}`}>{value}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default Analytics;
