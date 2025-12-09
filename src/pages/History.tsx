import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { Calendar, Clock, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { conversations } = useApp();

  const getScenario = (id: string) => scenarios.find(s => s.id === id);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Histórico</h1>
          <p className="text-muted-foreground">Suas conversas anteriores e feedbacks</p>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Nenhuma conversa ainda</h3>
            <p className="text-muted-foreground mb-6">Comece uma conversa para ver seu histórico</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Iniciar primeira conversa
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const scenario = getScenario(conversation.scenarioId);
              const duration = conversation.endedAt 
                ? Math.round((conversation.endedAt.getTime() - conversation.startedAt.getTime()) / 60000)
                : 0;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => navigate('/feedback', { 
                    state: { 
                      feedback: conversation.feedback, 
                      scenarioId: conversation.scenarioId 
                    } 
                  })}
                  className="w-full p-5 bg-card rounded-xl border border-border hover:border-primary hover:shadow-fluency-md transition-all flex items-center gap-4 text-left"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${scenario?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{scenario?.icon || '💬'}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">{scenario?.title || 'Conversa'}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(conversation.startedAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {duration} min
                      </span>
                    </div>
                  </div>

                  {conversation.feedback && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          <span className={`font-bold ${getScoreColor(conversation.feedback.overallScore)}`}>
                            {conversation.feedback.overallScore}
                          </span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Score geral</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default History;
