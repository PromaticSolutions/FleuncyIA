import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConversationFeedback } from '@/types';
import { scenarios } from '@/data/scenarios';
import { ArrowLeft, Check, X, TrendingUp, Save, RotateCcw, ChevronRight } from 'lucide-react';
import { HelpButton } from '@/components/HelpButton';

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { feedback, scenarioId } = location.state as { feedback: ConversationFeedback; scenarioId: string };

  const scenario = scenarios.find(s => s.id === scenarioId);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const metrics = [
    { label: 'Gramática', value: feedback.grammar },
    { label: 'Vocabulário', value: feedback.vocabulary },
    { label: 'Clareza', value: feedback.clarity },
    { label: 'Fluência', value: feedback.fluency },
    { label: 'Coerência', value: feedback.contextCoherence },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-primary px-4 sm:px-6 pt-8 sm:pt-12 pb-20 sm:pb-24 rounded-b-3xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 max-w-3xl mx-auto">
          <button 
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Feedback</h1>
            <p className="text-white/80 text-sm">{scenario?.title}</p>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="px-4 -mt-14 sm:-mt-16 max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-fluency-lg p-6 border border-border">
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)} mb-2`}>
              {feedback.overallScore}
            </div>
            <p className="text-muted-foreground">Pontuação Geral</p>
            <p className="text-sm font-medium text-primary mt-1">
              Nível estimado: {feedback.estimatedLevel}
            </p>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                    {metric.value}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBarColor(metric.value)} rounded-full transition-all duration-500`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Errors Section */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <X className="w-5 h-5 text-destructive" />
          Principais Erros
        </h2>
        <div className="space-y-3">
          {feedback.errors.map((error, index) => (
            <div key={index} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-destructive line-through">{error.original}</p>
                  <p className="text-sm text-success font-medium">{error.corrected}</p>
                  <p className="text-xs text-muted-foreground mt-1">{error.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Correct Phrases */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          O que você acertou
        </h2>
        <div className="space-y-2">
          {feedback.correctPhrases.map((phrase, index) => (
            <div key={index} className="bg-success/10 rounded-xl p-4 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-success" />
              </div>
              <p className="text-sm text-foreground">{phrase}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          O que melhorar
        </h2>
        <div className="space-y-2">
          {feedback.improvements.map((improvement, index) => (
            <div key={index} className="bg-fluency-light-blue rounded-xl p-4 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-3 h-3 text-primary" />
              </div>
              <p className="text-sm text-foreground">{improvement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-8 space-y-3 max-w-3xl mx-auto">
        <Button size="lg" className="w-full" onClick={() => navigate('/history')}>
          <Save className="w-5 h-5 mr-2" />
          Salvar conversa
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full"
          onClick={() => navigate(`/chat/${scenarioId}`)}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Tentar novamente
        </Button>
      </div>

      <HelpButton />
    </div>
  );
};

export default Feedback;
