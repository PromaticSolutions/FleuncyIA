import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ConversationFeedback } from '@/types';
import { scenarios } from '@/data/scenarios';
import { ArrowLeft, Check, X, TrendingUp, RotateCcw, ChevronRight, Trophy, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAchievements } from '@/hooks/useAchievements';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { AchievementCard } from '@/components/AchievementCard';
import { achievements as allAchievements } from '@/data/achievements';

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { authUserId } = useApp();
  const state = location.state as { 
    feedback: ConversationFeedback; 
    scenarioId: string;
    userLanguage?: string;
    fromVoiceCall?: boolean;
    conversationId?: string;
  } | null;

  const feedback = state?.feedback;
  const scenarioId = state?.scenarioId || '';
  const userLanguage = state?.userLanguage;
  const fromVoiceCall = state?.fromVoiceCall ?? false;

  const { checkAchievements, achievements } = useAchievements(authUserId || undefined);
  const { conversations } = useConversations(authUserId);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const scenario = scenarios.find(s => s.id === scenarioId);
  const scenarioTitle = scenario?.titleKey ? t(scenario.titleKey) : scenario?.title || scenarioId;

  // Check for new achievements after conversation
  useEffect(() => {
    const checkForNewAchievements = async () => {
      if (!authUserId || !feedback) return;

      // ... keep existing code (achievements logic)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('current_streak, longest_streak, total_conversations, current_adaptive_level')
        .eq('user_id', authUserId)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('last_practice_date, current_streak, longest_streak, total_conversations')
        .eq('user_id', authUserId)
        .maybeSingle();

      let newStreak = 1;
      if (currentProfile?.last_practice_date) {
        const lastDate = new Date(currentProfile.last_practice_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          newStreak = currentProfile.current_streak || 1;
        } else if (diffDays === 1) {
          newStreak = (currentProfile.current_streak || 0) + 1;
        }
      }

      const longestStreak = Math.max(newStreak, currentProfile?.longest_streak || 0);
      const totalConversations = (currentProfile?.total_conversations || 0) + 1;

      await supabase
        .from('user_profiles')
        .update({
          last_practice_date: today,
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_conversations: totalConversations,
        })
        .eq('user_id', authUserId);

      const completedScenarios = [...new Set(conversations.map(c => c.scenarioId))];
      if (!completedScenarios.includes(scenarioId)) {
        completedScenarios.push(scenarioId);
      }

      const allScores = conversations
        .filter(c => c.feedback?.overallScore)
        .map(c => c.feedback!.overallScore);
      const highestScore = Math.max(feedback.overallScore, ...allScores, 0);

      const previouslyUnlocked = achievements.filter(a => a.unlocked).map(a => a.id);

      await checkAchievements({
        totalConversations,
        currentStreak: newStreak,
        longestStreak,
        highestScore,
        completedScenarios,
        currentLevel: profile?.current_adaptive_level || feedback.estimatedLevel || 'A1',
      });

      setTimeout(() => {
        const nowUnlocked = achievements.filter(a => a.unlocked).map(a => a.id);
        const newlyUnlocked = nowUnlocked.filter(id => !previouslyUnlocked.includes(id));
        if (newlyUnlocked.length > 0) {
          setNewAchievements(newlyUnlocked);
        }
      }, 500);
    };

    checkForNewAchievements();
  }, [authUserId, scenarioId, feedback, conversations]);

  if (!feedback) {
    navigate('/home', { replace: true });
    return null;
  }

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
    { label: t('feedback.metrics.grammar'), value: feedback.grammar },
    { label: t('feedback.metrics.vocabulary'), value: feedback.vocabulary },
    { label: t('feedback.metrics.clarity'), value: feedback.clarity },
    { label: t('feedback.metrics.fluency'), value: feedback.fluency },
    { label: t('feedback.metrics.coherence'), value: feedback.contextCoherence },
  ];

  const newAchievementData = newAchievements.map(id => {
    const achievement = allAchievements.find(a => a.id === id);
    return achievement ? { ...achievement, unlocked: true, unlockedAt: new Date() } : null;
  }).filter(Boolean);

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
            <h1 className="text-lg sm:text-xl font-bold text-white">{t('feedback.title')}</h1>
            <p className="text-white/80 text-sm">{scenarioTitle}</p>
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
            <p className="text-muted-foreground">{t('feedback.overallScore')}</p>
            <p className="text-sm font-medium text-primary mt-1">
              {t('feedback.estimatedLevel')}: {feedback.estimatedLevel}
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

      {/* New Achievements */}
      {newAchievementData.length > 0 && (
        <div className="px-4 mt-6 max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {t('feedback.newAchievements')}
          </h2>
          <div className="space-y-3">
            {newAchievementData.map((achievement) => achievement && (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}

      {/* Errors Section */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <X className="w-5 h-5 text-destructive" />
          {t('feedback.mainErrors')}
        </h2>
        <div className="space-y-3">
          {feedback.errors.length > 0 ? (
            feedback.errors.map((error, index) => (
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
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('feedback.noErrors')}</p>
          )}
        </div>
      </div>

      {/* Correct Phrases */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          {t('feedback.correctPhrases')}
        </h2>
        <div className="space-y-2">
          {feedback.correctPhrases.length > 0 ? (
            feedback.correctPhrases.map((phrase, index) => (
              <div key={index} className="bg-success/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <p className="text-sm text-foreground">{phrase}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('feedback.keepPracticing')}</p>
          )}
        </div>
      </div>

      {/* Improvements */}
      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('feedback.improvements')}
        </h2>
        <div className="space-y-2">
          {feedback.improvements.length > 0 ? (
            feedback.improvements.map((improvement, index) => (
              <div key={index} className="bg-fluency-light-blue rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-primary" />
                </div>
                <p className="text-sm text-foreground">{improvement}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t('feedback.greatJob')}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-8 space-y-3 max-w-3xl mx-auto">
        <Button size="lg" className="w-full" onClick={() => navigate('/home')}>
          <Home className="w-5 h-5 mr-2" />
          {t('feedback.backToHome')}
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full"
          onClick={() => fromVoiceCall ? navigate(`/voice-call/${scenarioId}`) : navigate(`/chat/${scenarioId}`)}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          {fromVoiceCall ? 'Refazer chamada' : t('feedback.tryAgain')}
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
