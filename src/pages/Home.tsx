import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { scenarios, isScenarioLocked } from '@/data/scenarios';
import { Lock, TrendingUp, Target, BookOpen, Trophy, Users, ChevronRight } from 'lucide-react';
import { Scenario } from '@/types';
import { AppLayout } from '@/components/AppLayout';
import { useCredits } from '@/hooks/useCredits';
import { CreditsDisplay } from '@/components/CreditsDisplay';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, hasCompletedOnboarding, isLoading, authUserId } = useApp();
  const { credits, hasUnlimitedCredits } = useCredits(authUserId || undefined, user?.plan);

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
    english: t('onboarding.languages.english'),
    spanish: t('onboarding.languages.spanish'),
    french: t('onboarding.languages.french'),
    italian: t('onboarding.languages.italian'),
    german: t('onboarding.languages.german'),
    portuguese: t('onboarding.languages.portuguese'),
  };

  const levelLabels: Record<string, string> = {
    basic: t('home.levelLabels.basic'),
    intermediate: t('home.levelLabels.intermediate'),
    advanced: t('home.levelLabels.advanced'),
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
              {t('home.welcome')} {user?.name?.split(' ')[0] || t('home.student')}
            </h1>
            <p className="text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>
          
          {/* Credits Display */}
          {credits && (
            <CreditsDisplay
              totalCredits={credits.total_credits}
              usedCredits={credits.used_credits}
              remainingCredits={credits.remaining_credits}
              totalAudioCredits={credits.total_audio_credits}
              usedAudioCredits={credits.used_audio_credits}
              remainingAudioCredits={credits.remaining_audio_credits}
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
            label={t('home.stats.language')}
            value={user?.language ? languageLabels[user.language] || user.language : '-'}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label={t('home.stats.level')}
            value={user?.level ? levelLabels[user.level] || user.level : '-'}
            color="bg-secondary/10 text-secondary"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t('home.stats.thisWeek')}
            value={`3 ${t('home.stats.conversations')}`}
            color="bg-success/10 text-success"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label={t('home.stats.weeklyGoal')}
            value={`${user?.weeklyGoal || 5} ${t('home.stats.conversations')}`}
            color="bg-warning/10 text-warning"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/achievements')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl hover:from-amber-500/20 hover:to-orange-500/20 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">{t('home.quickActions.achievements')}</p>
              <p className="text-sm text-muted-foreground">{t('home.quickActions.achievementsDesc')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl hover:from-blue-500/20 hover:to-indigo-500/20 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">{t('home.quickActions.ranking')}</p>
              <p className="text-sm text-muted-foreground">{t('home.quickActions.rankingDesc')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scenarios Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('home.scenarios.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {scenarios.filter(s => !user || !isScenarioLocked(s, user.plan)).length} {t('home.scenarios.of')} {scenarios.length} {t('home.scenarios.unlocked')}
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
                  
                  <h3 className="font-semibold text-foreground mb-1.5">{scenario.titleKey ? t(scenario.titleKey) : scenario.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{scenario.descriptionKey ? t(scenario.descriptionKey) : scenario.description}</p>
                  
                  {!locked && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <span className="text-xs text-primary font-medium">{t('home.scenarios.startConversation')}</span>
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
