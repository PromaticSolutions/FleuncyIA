import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, conversations, authUserId, updateUserProfile, isLoading: isAppLoading } = useApp();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    english: t('onboarding.languages.english'),
    spanish: t('onboarding.languages.spanish'),
    french: t('onboarding.languages.french'),
    italian: t('onboarding.languages.italian'),
    german: t('onboarding.languages.german'),
    portuguese: t('onboarding.languages.portuguese'),
  };

  const levelLabels: Record<string, string> = {
    basic: t('onboarding.levels.basic'),
    intermediate: t('onboarding.levels.intermediate'),
    advanced: t('onboarding.levels.advanced'),
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUserId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('common.error'), description: 'Selecione uma imagem válida.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('common.error'), description: 'A imagem deve ter no máximo 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${authUserId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateUserProfile({ avatar: avatarUrl });

      toast({ title: t('common.success'), description: 'Foto atualizada!' });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast({ title: t('common.error'), description: 'Não foi possível enviar a foto.', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl overflow-hidden relative"
                  >
                    {user?.avatar && user.avatar.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.avatar || '👤'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </button>
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
                    {t('common.save')}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  {t('common.edit')}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem 
                icon={<Globe className="w-5 h-5" />}
                label={t('profile.studyLanguage')}
                value={user ? languageLabels[user.language] || user.language : '-'}
              />
              <InfoItem 
                icon={<Target className="w-5 h-5" />}
                label={t('profile.level')}
                value={user ? levelLabels[user.level] || user.level : '-'}
              />
              <InfoItem 
                icon={<Target className="w-5 h-5" />}
                label={t('profile.weeklyGoal')}
                value={`${user?.weeklyGoal || 0} ${t('home.stats.conversations')}`}
              />
              <InfoItem 
                icon={<Mail className="w-5 h-5" />}
                label={t('profile.email')}
                value={user?.email || '-'}
              />
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('profile.stats.title')}</h3>
            
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
                  label={t('profile.stats.conversations')}
                />
                <StatItem 
                  icon={<Clock className="w-5 h-5" />}
                  value={`${totalMinutes} min`}
                  label={t('profile.stats.totalTime')}
                />
                <StatItem 
                  icon={<Flame className="w-5 h-5" />}
                  value={profileStats.currentStreak.toString()}
                  label={t('profile.stats.currentStreak')}
                  highlight={profileStats.currentStreak >= 3}
                />
                <StatItem 
                  icon={<Target className="w-5 h-5" />}
                  value={profileStats.currentLevel}
                  label={t('profile.stats.estimatedLevel')}
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
