import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementCard } from './AchievementCard';
import { categoryNames, Achievement } from '@/data/achievements';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Loader2 } from 'lucide-react';

interface AchievementsPanelProps {
  userId: string | undefined;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { achievements, unlockedCount, totalCount, progressPercent, isLoading } = useAchievements(userId);
  const [activeCategory, setActiveCategory] = useState<Achievement['category'] | 'all'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Translated category names
  const translatedCategoryNames: Record<string, string> = {
    conversations: t('achievements.categories.conversations'),
    streaks: t('achievements.categories.streaks'),
    scores: t('achievements.categories.scores'),
    exploration: t('achievements.categories.exploration'),
    milestones: t('achievements.categories.milestones'),
  };

  const categories: (Achievement['category'] | 'all')[] = ['all', 'conversations', 'streaks', 'scores', 'exploration', 'milestones'];
  
  const filteredAchievements = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  // Sort: unlocked first, then by tier
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{t('achievements.title')}</h2>
            <p className="text-muted-foreground">
              {unlockedCount} {t('achievements.of')} {totalCount} {t('achievements.unlocked')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-primary">{progressPercent}%</span>
          </div>
        </div>
        <Progress value={progressPercent} className="mt-4 h-2" />
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="flex-1 min-w-fit">
            {t('achievements.all')}
          </TabsTrigger>
          {Object.entries(translatedCategoryNames).map(([key, name]) => (
            <TabsTrigger key={key} value={key} className="flex-1 min-w-fit">
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid gap-3 overflow-y-auto max-h-[55vh] sm:max-h-[60vh] pr-1">
            {sortedAchievements.map(achievement => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent unlocks */}
      {achievements.filter(a => a.unlocked).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">{t('achievements.recent')}</h3>
          <div className="flex gap-2 flex-wrap">
            {achievements
              .filter(a => a.unlocked)
              .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
              .slice(0, 5)
              .map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement}
                  compact
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
