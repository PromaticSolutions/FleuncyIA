import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Globe, 
  Target, 
  Clock, 
  MessageSquare,
  Edit2,
  Save,
  X,
  Mail,
  Flame,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

const Profile: React.FC = () => {
  const { user, conversations, authUserId, updateUserProfile, isLoading: isAppLoading } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [profileStats, setProfileStats] = useState<{
    currentStreak: number;
    longestStreak: number;
    totalConversations: number;
    currentLevel: string;
  }>({ currentStreak: 0, longestStreak: 0, totalConversations: 0, currentLevel: 'A1' });

  useEffect(() => {
    if (user?.name) {
      setEditedName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!authUserId) return;
      setIsLoadingStats(true);
      
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('current_streak, longest_streak, total_conversations, current_adaptive_level')
          .eq('user_id', authUserId)
          .maybeSingle();

        if (data) {
          setProfileStats({
            currentStreak: data.current_streak || 0,
            longestStreak: data.longest_streak || 0,
            totalConversations: data.total_conversations || 0,
            currentLevel: data.current_adaptive_level || 'A1',
          });
        }
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [authUserId]);

  const languageLabels: Record<string, string> = {
    english: 'Inglês',
    spanish: 'Espanhol',
    french: 'Francês',
    italian: 'Italiano',
    german: 'Alemão',
  };

  const levelLabels: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  const totalMinutes = conversations.reduce((acc, c) => {
    if (c.endedAt) {
      return acc + Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 60000);
    }
    return acc;
  }, 0);

  const handleSave = async () => {
    if (editedName.trim() && editedName !== user?.name) {
      setIsSaving(true);
      try {
        await updateUserProfile({ name: editedName.trim() });
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  if (isAppLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
                  {user?.avatar || '👤'}
                </div>
                <div>
                  {isEditing ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="font-semibold text-lg mb-1"
                    />
                  ) : (
                    <h2 className="font-semibold text-xl text-foreground">{user?.name}</h2>
                  )}
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Salvar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem 
                icon={<Globe className="w-5 h-5" />}
                label="Idioma de estudo"
                value={user ? languageLabels[user.language] || user.language : '-'}
              />
              <InfoItem 
                icon={<Target className="w-5 h-5" />}
                label="Nível"
                value={user ? levelLabels[user.level] || user.level : '-'}
              />
              <InfoItem 
                icon={<Target className="w-5 h-5" />}
                label="Meta semanal"
                value={`${user?.weeklyGoal || 0} conversas`}
              />
              <InfoItem 
                icon={<Mail className="w-5 h-5" />}
                label="Email"
                value={user?.email || '-'}
              />
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Estatísticas</h3>
            
            {isLoadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
                    <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-2" />
                    <Skeleton className="h-8 w-16 mx-auto mb-1" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem 
                  icon={<MessageSquare className="w-5 h-5" />}
                  value={profileStats.totalConversations.toString()}
                  label="Conversas"
                />
                <StatItem 
                  icon={<Clock className="w-5 h-5" />}
                  value={`${totalMinutes} min`}
                  label="Tempo total"
                />
                <StatItem 
                  icon={<Flame className="w-5 h-5" />}
                  value={profileStats.currentStreak.toString()}
                  label="Sequência atual"
                  highlight={profileStats.currentStreak >= 3}
                />
                <StatItem 
                  icon={<Target className="w-5 h-5" />}
                  value={profileStats.currentLevel}
                  label="Nível estimado"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const InfoItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const StatItem: React.FC<{ 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  highlight?: boolean;
}> = ({ icon, value, label, highlight }) => (
  <div className={`text-center p-4 rounded-lg ${highlight ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted/50'}`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
      highlight ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-primary/10 text-primary'
    }`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
