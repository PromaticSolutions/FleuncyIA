import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { useApp } from '@/contexts/AppContext';

const Achievements: React.FC = () => {
  const { authUserId } = useApp();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Conquistas
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e desbloqueie novas conquistas
          </p>
        </div>

        <AchievementsPanel userId={authUserId || undefined} />
      </div>
    </AppLayout>
  );
};

export default Achievements;
