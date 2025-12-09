import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
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
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/AppLayout';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const planLabels: Record<string, string> = {
    free_trial: 'Free Trial',
    beginner: 'Beginner',
    pro: 'Pro',
    fluency_plus: 'Fluency Plus',
  };

  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      logout();
      navigate('/');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência</p>
        </div>

        <div className="space-y-6">
          {/* Plan Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Assinatura</h3>
            
            <button
              onClick={() => navigate('/plans')}
              className="w-full p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl flex items-center gap-4 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">
                  {user ? planLabels[user.plan] : 'Free Trial'}
                </p>
                <p className="text-sm text-muted-foreground">Toque para ver ou alterar seu plano</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Language Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Idioma</h3>
            
            <div className="space-y-4">
              <SettingItem
                icon={<Globe className="w-5 h-5" />}
                label="Idioma do app"
                value="Português (BR)"
              />
              <SettingItem
                icon={<Globe className="w-5 h-5" />}
                label="Idioma de estudo"
                value={user?.language === 'english' ? 'Inglês' : 
                       user?.language === 'spanish' ? 'Espanhol' :
                       user?.language === 'french' ? 'Francês' :
                       user?.language === 'italian' ? 'Italiano' : 'Alemão'}
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Preferências</h3>
            
            <div className="space-y-4">
              <ToggleSetting
                icon={<Bell className="w-5 h-5" />}
                label="Notificações"
                description="Receba lembretes de prática"
                checked={notifications}
                onChange={setNotifications}
              />
              <ToggleSetting
                icon={<Volume2 className="w-5 h-5" />}
                label="Sons do app"
                description="Efeitos sonoros e alertas"
                checked={sounds}
                onChange={setSounds}
              />
              <ToggleSetting
                icon={darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                label="Modo escuro"
                description="Alterne entre tema claro e escuro"
                checked={darkMode}
                onChange={setDarkMode}
              />
              <SettingItem
                icon={<Mic className="w-5 h-5" />}
                label="Voz da IA"
                value="Feminina (US)"
              />
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Privacidade</h3>
            
            <div className="space-y-4">
              <SettingItem
                icon={<Shield className="w-5 h-5" />}
                label="Política de privacidade"
                value=""
                showArrow
              />
              <SettingItem
                icon={<Shield className="w-5 h-5" />}
                label="Termos de uso"
                value=""
                showArrow
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-xl border border-destructive/30 p-6">
            <h3 className="font-semibold text-destructive mb-4">Zona de perigo</h3>
            
            <Button 
              variant="outline" 
              className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir minha conta
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Esta ação é irreversível. Todos os seus dados serão perdidos.
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
}> = ({ icon, label, value, showArrow }) => (
  <button className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
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
