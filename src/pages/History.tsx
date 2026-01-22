import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { scenarios } from '@/data/scenarios';
import { 
  Calendar, 
  Clock, 
  Star, 
  ChevronRight, 
  MessageSquare, 
  Loader2,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const History: React.FC = () => {
  const navigate = useNavigate();
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'score'>('recent');
  
  // Get authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthUserId(authUser?.id);
    };
    getUser();
  }, []);
  
  const { conversations, isLoading, error } = useConversations(authUserId);

  const getScenario = (id: string) => scenarios.find(s => s.id === id);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter(conv => {
      const scenario = getScenario(conv.scenarioId);
      const matchesSearch = scenario?.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           searchQuery === '';
      const matchesScenario = scenarioFilter === 'all' || conv.scenarioId === scenarioFilter;
      return matchesSearch && matchesScenario;
    })
    .sort((a, b) => {
      if (sortOrder === 'recent') {
        return b.startedAt.getTime() - a.startedAt.getTime();
      }
      return (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0);
    });

  // Calculate stats
  const totalConversations = conversations.length;
  const avgScore = conversations.length > 0 
    ? Math.round(conversations.reduce((acc, c) => acc + (c.feedback?.overallScore || 0), 0) / conversations.length)
    : 0;
  const totalMinutes = conversations.reduce((acc, c) => {
    if (c.endedAt) {
      return acc + Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 60000);
    }
    return acc;
  }, 0);

  // Get unique scenarios from conversations
  const usedScenarios = [...new Set(conversations.map(c => c.scenarioId))];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Histórico</h1>
          <p className="text-muted-foreground">Suas conversas e progresso</p>
        </div>

        {/* Stats Cards */}
        {totalConversations > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalConversations}</p>
              <p className="text-xs text-muted-foreground">Conversas</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Score médio</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalMinutes}</p>
              <p className="text-xs text-muted-foreground">Min praticados</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {totalConversations > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cenários</SelectItem>
                {usedScenarios.map(id => {
                  const scenario = getScenario(id);
                  return scenario ? (
                    <SelectItem key={id} value={id}>
                      {scenario.icon} {scenario.title}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'recent' | 'score')}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="score">Maior score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando conversas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {conversations.length === 0 ? 'Nenhuma conversa ainda' : 'Nenhum resultado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {conversations.length === 0 
                ? 'Comece uma conversa para ver seu histórico' 
                : 'Tente ajustar os filtros'}
            </p>
            {conversations.length === 0 && (
              <Button onClick={() => navigate('/home')}>
                Iniciar primeira conversa
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const scenario = getScenario(conversation.scenarioId);
              const duration = conversation.endedAt 
                ? Math.round((conversation.endedAt.getTime() - conversation.startedAt.getTime()) / 60000)
                : 0;
              const score = conversation.feedback?.overallScore || 0;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => navigate('/feedback', { 
                    state: { 
                      feedback: conversation.feedback, 
                      scenarioId: conversation.scenarioId 
                    } 
                  })}
                  className="w-full p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-md transition-all flex items-center gap-3 text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenario?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xl">{scenario?.icon || '💬'}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                      {scenario?.title || 'Conversa'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(conversation.startedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration}min
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {conversation.messages.length}
                      </span>
                    </div>
                  </div>

                  {conversation.feedback && (
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg ${getScoreBg(score)}`}>
                        <div className="flex items-center gap-1">
                          <Star className={`w-3.5 h-3.5 ${getScoreColor(score)}`} />
                          <span className={`font-bold text-sm ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
