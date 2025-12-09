import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, LogOut, Crown, Clock, MessageSquare, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, conversations } = useApp();
  const { toast } = useToast();

  const languageNames: Record<string, string> = {
    english: 'Inglês',
    spanish: 'Espanhol',
    french: 'Francês',
    italian: 'Italiano',
    german: 'Alemão',
  };

  const levelNames: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  const handleLogout = () => {
    setUser(null);
    toast({
      title: "Até logo!",
      description: "Você foi desconectado com sucesso.",
    });
    navigate('/');
  };

  // Calculate total study time
  const totalMinutes = conversations.reduce((acc, c) => {
    if (c.endedAt) {
      return acc + Math.round((c.endedAt.getTime() - c.startedAt.getTime()) / 60000);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-24 rounded-b-3xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Perfil</h1>
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mb-4 border-4 border-white/30">
            {user?.avatar || '👤'}
          </div>
          <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
          <p className="text-white/80">{user?.email}</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 -mt-12">
        <div className="bg-card rounded-2xl shadow-fluency-lg p-4 border border-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-fluency-light-blue flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">{totalMinutes}</p>
            <p className="text-xs text-muted-foreground">min estudados</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-fluency-light-purple flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-lg font-bold text-foreground">{conversations.length}</p>
            <p className="text-xs text-muted-foreground">conversas</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <Crown className="w-5 h-5 text-warning" />
            </div>
            <p className="text-lg font-bold text-foreground capitalize">
              {user?.plan === 'free_trial' ? 'Trial' : 
               user?.plan === 'fluency_plus' ? 'Plus' : user?.plan}
            </p>
            <p className="text-xs text-muted-foreground">plano</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 mt-6 space-y-4">
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          <ProfileItem label="Nome" value={user?.name || '-'} />
          <ProfileItem label="Email" value={user?.email || '-'} />
          <ProfileItem 
            label="Idioma estudado" 
            value={user?.language ? languageNames[user.language] : '-'} 
          />
          <ProfileItem 
            label="Nível" 
            value={user?.level ? levelNames[user.level] : '-'} 
          />
          <ProfileItem 
            label="Meta semanal" 
            value={`${user?.weeklyGoal || 0} conversas/semana`} 
          />
        </div>

        <Button 
          variant="outline" 
          size="lg" 
          className="w-full"
          onClick={() => toast({ title: "Editar perfil", description: "Em breve!" })}
        >
          <Edit className="w-5 h-5 mr-2" />
          Editar Perfil
        </Button>

        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da conta
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

const ProfileItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;

  const navItems = [
    { icon: '🏠', label: 'Início', path: '/home' },
    { icon: '📚', label: 'Histórico', path: '/history' },
    { icon: '📊', label: 'Análises', path: '/analytics' },
    { icon: '👤', label: 'Perfil', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
              location === item.path 
                ? 'bg-fluency-light-blue' 
                : 'hover:bg-muted'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs font-medium ${
              location === item.path ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Profile;
