import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { scenarios, isScenarioLocked } from '@/data/scenarios';
import { Lock, TrendingUp, Target, BookOpen } from 'lucide-react';
import { Scenario } from '@/types';
import { AppLayout } from '@/components/AppLayout';
import { useCredits } from '@/hooks/useCredits';
import { CreditsDisplay } from '@/components/CreditsDisplay';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasCompletedOnboarding, isLoading, authUserId } = useApp();
  const { credits, hasUnlimitedCredits } = useCredits(authUserId || undefined, user?.plan);

  // Redirecionar se não estiver autenticado ou não completou onboarding
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/auth');
      } else if (!hasCompletedOnboarding) {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, navigate]);

  const languageLabels: Record<string, string> = {
    english: 'Inglês',
    spanish: 'Espanhol',
    french: 'Francês',
    italian: 'Italiano',
    german: 'Alemão',
  };

  const levelLabels: Record<string, string> = {
    basic: 'Básico (A1-A2)',
    intermediate: 'Intermediário (B1-B2)',
    advanced: 'Avançado (C1-C2)',
  };

  const handleScenarioClick = (scenario: Scenario) => {
    if (user && isScenarioLocked(scenario, user.plan)) {
      navigate('/plans');
    } else {
      navigate(`/chat/${scenario.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Estudante'}
            </h1>
            <p className="text-muted-foreground">
              Continue praticando para alcançar suas metas semanais
            </p>
          </div>
          
          {/* Credits Display */}
          {credits && (
            <CreditsDisplay
              totalCredits={credits.total_credits}
              usedCredits={credits.used_credits}
              remainingCredits={credits.remaining_credits}
              trialEndsAt={credits.trial_ends_at}
              isExpired={credits.is_trial_expired}
              hasUnlimitedCredits={hasUnlimitedCredits}
              className="self-start"
            />
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Idioma"
            value={user?.language ? languageLabels[user.language] || user.language : 'Não definido'}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Nível"
            value={user?.level ? levelLabels[user.level] || user.level : 'Não definido'}
            color="bg-secondary/10 text-secondary"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Esta semana"
            value="3 conversas"
            color="bg-success/10 text-success"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Meta semanal"
            value={`${user?.weeklyGoal || 5} conversas`}
            color="bg-warning/10 text-warning"
          />
        </div>

        {/* Scenarios Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Cenários Disponíveis</h2>
            <p className="text-sm text-muted-foreground">
              {scenarios.filter(s => !user || !isScenarioLocked(s, user.plan)).length} de {scenarios.length} desbloqueados
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scenarios.map((scenario) => {
              const locked = user ? isScenarioLocked(scenario, user.plan) : true;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className={`relative p-5 rounded-xl border text-left transition-all duration-200 group ${
                    locked 
                      ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed' 
                      : 'border-border bg-card hover:border-primary hover:shadow-fluency-md'
                  }`}
                >
                  {locked && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center mb-4 transition-transform ${!locked && 'group-hover:scale-110'}`}>
                    <span className="text-2xl">{scenario.icon}</span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1.5">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                  
                  {!locked && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <span className="text-xs text-primary font-medium">Iniciar conversa →</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="p-5 bg-card rounded-xl border border-border">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold text-foreground">{value}</p>
  </div>
);

export default Home;
