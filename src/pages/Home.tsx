import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { scenarios, isScenarioLocked } from '@/data/scenarios';
import { Settings, Lock, Crown, ChevronRight } from 'lucide-react';
import { Scenario } from '@/types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const languageFlags: Record<string, string> = {
    english: '🇺🇸',
    spanish: '🇪🇸',
    french: '🇫🇷',
    italian: '🇮🇹',
    german: '🇩🇪',
  };

  const handleScenarioClick = (scenario: Scenario) => {
    if (user && isScenarioLocked(scenario, user.plan)) {
      navigate('/plans');
    } else {
      navigate(`/chat/${scenario.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
              {user?.avatar || '👤'}
            </div>
            <div>
              <p className="text-white/80 text-sm">Olá,</p>
              <h1 className="text-white font-bold text-lg">{user?.name || 'Estudante'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-2">
              <span className="text-lg">{user && languageFlags[user.language]}</span>
              <span className="text-white text-sm font-medium capitalize">
                {user?.language === 'english' ? 'Inglês' : 
                 user?.language === 'spanish' ? 'Espanhol' :
                 user?.language === 'french' ? 'Francês' :
                 user?.language === 'italian' ? 'Italiano' : 'Alemão'}
              </span>
            </div>
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Esta semana" value="3" subtitle="conversas" />
          <StatCard label="Meta" value={`${user?.weeklyGoal || 5}`} subtitle="conversas" />
          <StatCard label="Nível" value={user?.level === 'basic' ? 'A1' : user?.level === 'intermediate' ? 'B1' : 'C1'} subtitle="" />
        </div>
      </div>

      {/* Plan Banner */}
      <div className="px-4 -mt-4">
        <button
          onClick={() => navigate('/plans')}
          className="w-full p-4 bg-card rounded-2xl shadow-fluency-md flex items-center gap-4 border border-border"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">
              {user?.plan === 'free_trial' ? 'Free Trial' : 
               user?.plan === 'beginner' ? 'Beginner' :
               user?.plan === 'pro' ? 'Pro' : 'Fluency Plus'}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.plan === 'free_trial' ? 'Faça upgrade para desbloquear tudo' : 'Ver detalhes do plano'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Scenarios */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Cenários Disponíveis</h2>
        <div className="grid grid-cols-2 gap-3">
          {scenarios.map((scenario) => {
            const locked = user ? isScenarioLocked(scenario, user.plan) : true;
            return (
              <button
                key={scenario.id}
                onClick={() => handleScenarioClick(scenario)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  locked 
                    ? 'border-border bg-muted/50 opacity-70' 
                    : 'border-border bg-card hover:border-primary hover:shadow-fluency-md'
                }`}
              >
                {locked && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center mb-3`}>
                  <span className="text-2xl">{scenario.icon}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{scenario.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{scenario.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; subtitle: string }> = ({ label, value, subtitle }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
    <p className="text-white/70 text-xs mb-1">{label}</p>
    <p className="text-white font-bold text-xl">{value}</p>
    <p className="text-white/70 text-xs">{subtitle}</p>
  </div>
);

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

export default Home;
