import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  User, 
  Mail, 
  Globe, 
  Target, 
  Clock, 
  MessageSquare,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/AppLayout';

const Profile: React.FC = () => {
  const { user, conversations } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

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

  const handleSave = () => {
    setIsEditing(false);
  };

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
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" />
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
                value={user ? languageLabels[user.language] : '-'}
              />
              <InfoItem 
                icon={<Target className="w-5 h-5" />}
                label="Nível"
                value={user ? levelLabels[user.level] : '-'}
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
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatItem 
                icon={<MessageSquare className="w-5 h-5" />}
                value={conversations.length.toString()}
                label="Conversas"
              />
              <StatItem 
                icon={<Clock className="w-5 h-5" />}
                value={`${totalMinutes} min`}
                label="Tempo total"
              />
              <StatItem 
                icon={<Target className="w-5 h-5" />}
                value="B1"
                label="Nível estimado"
              />
            </div>
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
}> = ({ icon, value, label }) => (
  <div className="text-center p-4 bg-muted/50 rounded-lg">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
      {icon}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
