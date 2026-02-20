import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/hooks/useTheme';
import {
  Globe,
  Bell,
  Volume2,
  Mic,
  Shield,
  Trash2,
  Crown,
  ChevronRight,
  Moon,
  Sun,
  CreditCard,
  Loader2,
  Languages,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { changeUILanguage, getCurrentUILanguage } from '@/locales';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout, authUserId } = useApp();
  const { toast } = useToast();
  const { theme, setTheme, isDark, loadThemeFromDB } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [uiLanguage, setUILanguage] = useState<'pt-BR' | 'en'>(getCurrentUILanguage());

  const saveSettings = useCallback(async (field: string, value: boolean | string) => {
    if (!authUserId) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ [field]: value })
        .eq('user_id', authUserId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, [authUserId]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!authUserId) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setNotifications(data.notifications_enabled);
        setSounds(data.voice_enabled);
        // Theme is already loaded by useTheme hook
      }
    };

    loadSettings();
    
    // Load theme from DB if user is authenticated
    if (authUserId) {
      loadThemeFromDB(authUserId);
    }
  }, [authUserId, loadThemeFromDB]);

  const handleThemeChange = (newDarkMode: boolean) => {
    const newTheme = newDarkMode ? 'dark' : 'light';
    setTheme(newTheme);
    saveSettings('theme', newTheme);
  };

  const handleUILanguageChange = (lang: 'pt-BR' | 'en') => {
    setUILanguage(lang);
    changeUILanguage(lang);
  };

  const planLabels: Record<string, string> = {
    free_trial: 'Free Trial',
    beginner: 'Beginner',
    pro: 'Pro',
    fluency_plus: 'Fluency Plus',
  };

  const handleDeleteAccount = () => {
    if (confirm(t('settings.dangerZone.confirmDelete'))) {
      logout();
      navigate('/');
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: t('common.error'),
        description: t('settings.subscription.error'),
        variant: "destructive",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleTestPush = async () => {
    setLoadingPush(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('No session');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: '🎯 Fluency IA - Teste',
            body: 'As notificações push estão funcionando! 🚀',
            url: '/home',
            tag: 'fluency-test',
          }),
        }
      );
      const data = await res.json();
      toast({
        title: 'Push enviado!',
        description: `Enviado para ${data.sent || 0} de ${data.total || 0} dispositivos.`,
      });
    } catch (error) {
      console.error('Error sending test push:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPush(false);
    }
  };

  const studyLanguageLabels: Record<string, string> = {
    english: t('onboarding.languages.english'),
    spanish: t('onboarding.languages.spanish'),
    french: t('onboarding.languages.french'),
    italian: t('onboarding.languages.italian'),
    german: t('onboarding.languages.german'),
    portuguese: t('onboarding.languages.portuguese'),
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Plan Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('settings.subscription.title')}</h3>
            
            <button
              onClick={() => navigate('/plans')}
              className="w-full p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl flex items-center gap-4 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors mb-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">
                  {user ? planLabels[user.plan] : 'Free Trial'}
                </p>
                <p className="text-sm text-muted-foreground">{t('settings.subscription.viewOrChange')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {user?.plan !== 'free_trial' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('settings.subscription.loading')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('settings.subscription.manage')}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Language Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('settings.language.title')}</h3>
            
            <div className="space-y-4">
              {/* UI Language Selector */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-muted-foreground"><Languages className="w-5 h-5" /></div>
                  <p className="font-medium text-foreground">{t('settings.uiLanguage.title')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={uiLanguage === 'pt-BR' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUILanguageChange('pt-BR')}
                    className="flex-1"
                  >
                    🇧🇷 {t('settings.uiLanguage.portuguese')}
                  </Button>
                  <Button
                    variant={uiLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUILanguageChange('en')}
                    className="flex-1"
                  >
                    🇬🇧 {t('settings.uiLanguage.english')}
                  </Button>
                </div>
              </div>

              <SettingItem
                icon={<Globe className="w-5 h-5" />}
                label={t('settings.language.studyLanguage')}
                value={user?.language ? studyLanguageLabels[user.language] : '-'}
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('settings.preferences.title')}</h3>
            
            <div className="space-y-4">
              <ToggleSetting
                icon={<Bell className="w-5 h-5" />}
                label={t('settings.preferences.notifications')}
                description={t('settings.preferences.notificationsDesc')}
                checked={notifications}
                onChange={(checked) => {
                  setNotifications(checked);
                  saveSettings('notifications_enabled', checked);
                }}
              />
              <ToggleSetting
                icon={<Volume2 className="w-5 h-5" />}
                label={t('settings.preferences.sounds')}
                description={t('settings.preferences.soundsDesc')}
                checked={sounds}
                onChange={(checked) => {
                  setSounds(checked);
                  saveSettings('voice_enabled', checked);
                }}
              />
              <ToggleSetting
                icon={isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                label={t('settings.preferences.darkMode')}
                description={t('settings.preferences.darkModeDesc')}
                checked={isDark}
                onChange={handleThemeChange}
              />
              <SettingItem
                icon={<Mic className="w-5 h-5" />}
                label={t('settings.preferences.aiVoice')}
                value={t('settings.preferences.femaleUS')}
              />

              {/* Test Push Notification */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground"><Send className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Testar notificação push</p>
                    <p className="text-sm text-muted-foreground">Envia para todos os dispositivos inscritos</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestPush}
                    disabled={loadingPush}
                  >
                    {loadingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('settings.privacy.title')}</h3>
            
            <div className="space-y-4">
              <SettingItem
                icon={<Shield className="w-5 h-5" />}
                label={t('settings.privacy.privacyPolicy')}
                value=""
                showArrow
                onClick={() => navigate('/privacy')}
              />
              <SettingItem
                icon={<Shield className="w-5 h-5" />}
                label={t('settings.privacy.termsOfUse')}
                value=""
                showArrow
                onClick={() => navigate('/terms')}
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-xl border border-destructive/30 p-6">
            <h3 className="font-semibold text-destructive mb-4">{t('settings.dangerZone.title')}</h3>
            
            <Button 
              variant="outline" 
              className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('settings.dangerZone.deleteAccount')}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('settings.dangerZone.deleteWarning')}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const SettingItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  showArrow?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, showArrow, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1 text-left">
      <p className="font-medium text-foreground">{label}</p>
    </div>
    {value && <span className="text-sm text-muted-foreground">{value}</span>}
    {showArrow && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
  </button>
);

const ToggleSetting: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ icon, label, description, checked, onChange }) => (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default Settings;
