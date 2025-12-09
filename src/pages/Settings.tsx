import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
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
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);

  const handleDeleteAccount = () => {
    toast({
      title: "Deletar conta",
      description: "Entre em contato com o suporte para deletar sua conta.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Plan Section */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Assinatura</h2>
          </div>
          <button
            onClick={() => navigate('/plans')}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">
                {user?.plan === 'free_trial' ? 'Free Trial' : 
                 user?.plan === 'beginner' ? 'Beginner' :
                 user?.plan === 'pro' ? 'Pro' : 'Fluency Plus'}
              </p>
              <p className="text-sm text-muted-foreground">Ver ou alterar plano</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Language Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Idiomas</h2>
          </div>
          <SettingsItem 
            icon={<Globe className="w-5 h-5" />}
            label="Idioma do app"
            value="Português"
            onClick={() => toast({ title: "Idioma", description: "Em breve mais idiomas!" })}
          />
          <SettingsItem 
            icon={<Globe className="w-5 h-5" />}
            label="Idioma de estudo"
            value={user?.language === 'english' ? 'Inglês' : 
                   user?.language === 'spanish' ? 'Espanhol' :
                   user?.language === 'french' ? 'Francês' :
                   user?.language === 'italian' ? 'Italiano' : 'Alemão'}
            onClick={() => navigate('/onboarding')}
          />
        </div>

        {/* Preferences */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Preferências</h2>
          </div>
          <SettingsToggle 
            icon={<Bell className="w-5 h-5" />}
            label="Notificações"
            description="Lembretes de estudo"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
          <SettingsToggle 
            icon={<Volume2 className="w-5 h-5" />}
            label="Sons do app"
            description="Efeitos sonoros"
            checked={sounds}
            onCheckedChange={setSounds}
          />
          <SettingsItem 
            icon={<Mic className="w-5 h-5" />}
            label="Voz da IA"
            value="Feminina"
            onClick={() => toast({ title: "Voz", description: "Em breve mais vozes!" })}
          />
        </div>

        {/* Privacy */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Privacidade</h2>
          </div>
          <SettingsItem 
            icon={<Shield className="w-5 h-5" />}
            label="Política de Privacidade"
            onClick={() => toast({ title: "Privacidade", description: "Abrindo política..." })}
          />
          <SettingsItem 
            icon={<Trash2 className="w-5 h-5 text-destructive" />}
            label="Excluir conta"
            labelClass="text-destructive"
            onClick={handleDeleteAccount}
          />
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Fluency IA v1.0.0</p>
          <p className="mt-1">Feito com ❤️ para você aprender</p>
        </div>
      </div>
    </div>
  );
};

const SettingsItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  labelClass?: string;
  onClick?: () => void;
}> = ({ icon, label, value, labelClass, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 flex items-center gap-4 hover:bg-muted transition-colors border-b border-border last:border-b-0"
  >
    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className={`font-medium ${labelClass || 'text-foreground'}`}>{label}</p>
    </div>
    {value && (
      <span className="text-sm text-muted-foreground">{value}</span>
    )}
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

const SettingsToggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ icon, label, description, checked, onCheckedChange }) => (
  <div className="p-4 flex items-center gap-4 border-b border-border last:border-b-0">
    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground">{label}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Settings;
