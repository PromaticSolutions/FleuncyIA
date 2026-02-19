import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { achievements, Achievement } from '@/data/achievements';
import { useToast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/lib/pushNotifications';

interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
}

interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
}

export const useAchievements = (userId: string | undefined) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user achievements
  const fetchAchievements = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const formatted: UserAchievement[] = (data || []).map((a) => ({
        id: a.id,
        achievementId: a.achievement_id,
        unlockedAt: new Date(a.unlocked_at),
        progress: a.progress || 0,
      }));

      setUserAchievements(formatted);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Unlock an achievement
  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!userId) return false;

    // Check if already unlocked
    const existing = userAchievements.find(a => a.achievementId === achievementId);
    if (existing) return false;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          progress: 100,
        });

      if (error) {
        if (error.code === '23505') return false; // Already exists
        throw error;
      }

      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement) {
        toast({
          title: '🏆 Nova Conquista!',
          description: `${achievement.icon} ${achievement.name}`,
        });

        // Send push notification for achievement
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          sendPushNotification({
            userId,
            title: '🏆 Nova Conquista Desbloqueada!',
            body: `${achievement.icon} ${achievement.name}`,
            url: '/achievements',
            tag: 'achievement',
            accessToken: session.access_token,
          });
        }
      }

      await fetchAchievements();
      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }, [userId, userAchievements, toast, fetchAchievements]);

  // Check and unlock achievements based on user stats
  const checkAchievements = useCallback(async (stats: {
    totalConversations: number;
    currentStreak: number;
    longestStreak: number;
    highestScore: number;
    completedScenarios: string[];
    currentLevel: string;
  }) => {
    if (!userId) return;

    const toUnlock: string[] = [];

    // Conversation achievements
    if (stats.totalConversations >= 1) toUnlock.push('first_conversation');
    if (stats.totalConversations >= 5) toUnlock.push('conversations_5');
    if (stats.totalConversations >= 10) toUnlock.push('conversations_10');
    if (stats.totalConversations >= 25) toUnlock.push('conversations_25');
    if (stats.totalConversations >= 50) toUnlock.push('conversations_50');

    // Streak achievements
    const maxStreak = Math.max(stats.currentStreak, stats.longestStreak);
    if (maxStreak >= 3) toUnlock.push('streak_3');
    if (maxStreak >= 7) toUnlock.push('streak_7');
    if (maxStreak >= 14) toUnlock.push('streak_14');
    if (maxStreak >= 30) toUnlock.push('streak_30');

    // Score achievements
    if (stats.highestScore >= 70) toUnlock.push('score_70');
    if (stats.highestScore >= 80) toUnlock.push('score_80');
    if (stats.highestScore >= 90) toUnlock.push('score_90');
    if (stats.highestScore >= 95) toUnlock.push('score_95');

    // Scenario achievements
    if (stats.completedScenarios.includes('restaurant')) toUnlock.push('scenario_restaurant');
    if (stats.completedScenarios.includes('interview')) toUnlock.push('scenario_interview');
    if (stats.completedScenarios.includes('hotel')) toUnlock.push('scenario_hotel');
    if (stats.completedScenarios.includes('airport')) toUnlock.push('scenario_airport');
    if (stats.completedScenarios.length >= 8) toUnlock.push('all_scenarios');

    // Level achievements
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(stats.currentLevel);
    if (currentIndex >= 1) toUnlock.push('level_a2');
    if (currentIndex >= 2) toUnlock.push('level_b1');
    if (currentIndex >= 3) toUnlock.push('level_b2');
    if (currentIndex >= 4) toUnlock.push('level_c1');

    // Unlock new achievements
    for (const achievementId of toUnlock) {
      await unlockAchievement(achievementId);
    }
  }, [userId, unlockAchievement]);

  // Get all achievements with status
  const allAchievements: AchievementWithStatus[] = achievements.map(achievement => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
    return {
      ...achievement,
      unlocked: !!userAchievement,
      unlockedAt: userAchievement?.unlockedAt,
      progress: userAchievement?.progress || 0,
    };
  });

  // Stats
  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return {
    achievements: allAchievements,
    unlockedCount,
    totalCount,
    progressPercent,
    isLoading,
    checkAchievements,
    unlockAchievement,
    refetch: fetchAchievements,
  };
};
