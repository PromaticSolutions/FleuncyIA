import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { ArrowLeft, Clock, Star, ChevronRight, MessageSquare } from 'lucide-react';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { conversations } = useApp();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
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
        <h1 className="text-xl font-bold text-foreground">Histórico</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma conversa ainda
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Comece a praticar para ver seu histórico
            </p>
            <button
              onClick={() => navigate('/home')}
              className="text-primary font-medium hover:underline"
            >
              Ir para cenários
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const scenario = scenarios.find(s => s.id === conversation.scenarioId);
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
                  className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-4 hover:shadow-fluency-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenario?.color} flex items-center justify-center`}>
                    <span className="text-2xl">{scenario?.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{scenario?.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration} min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {conversation.startedAt.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(conversation.feedback?.overallScore || 0)}`}>
                      {conversation.feedback?.overallScore}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-xs text-muted-foreground">
                        {conversation.feedback?.estimatedLevel}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
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

export default History;
