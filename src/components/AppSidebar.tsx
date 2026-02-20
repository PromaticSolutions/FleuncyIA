import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  MessageSquare,
  History,
  BarChart3,
  User,
  Settings,
  LogOut,
  Crown,
  ChevronRight,
  Trophy,
  Users,
} from 'lucide-react';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useApp();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const menuItems = [
    { title: t('nav.dashboard'), icon: LayoutDashboard, path: '/home' },
    { title: t('nav.achievements'), icon: Trophy, path: '/achievements' },
    { title: t('nav.ranking'), icon: Users, path: '/leaderboard' },
    { title: t('nav.history'), icon: History, path: '/history' },
    { title: t('nav.analytics'), icon: BarChart3, path: '/analytics' },
    { title: t('nav.profile'), icon: User, path: '/profile' },
    { title: t('nav.settings'), icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const planLabels: Record<string, string> = {
    free_trial: 'Free Trial',
    beginner: 'Beginner',
    pro: 'Pro',
    fluency_plus: 'Fluency Plus',
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/home')}
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-foreground truncate">Fluency IA</h1>
              <p className="text-xs text-muted-foreground">{t('welcome.subtitle').substring(0, 20)}...</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="mx-2 mb-4 p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg overflow-hidden">
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.avatar || '👤'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Banner */}
        {!isCollapsed && (
          <button
            onClick={() => navigate('/plans')}
            className="mx-2 mb-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {user ? planLabels[user.plan] : 'Free Trial'}
              </p>
              <p className="text-xs text-muted-foreground">{t('nav.viewPlans')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        h-11 transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={t('nav.logout')}
              className="h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
