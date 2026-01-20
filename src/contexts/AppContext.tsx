import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Language, Level, WeeklyGoal, PlanType, Conversation } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  authUserId: string | null;
  conversations: Conversation[];
  addConversation: (conversation: Conversation) => void;
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (complete: boolean) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar perfil do banco de dados
  const loadUserProfile = useCallback(async (userId: string, authEmail: string, authName: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profileData) {
        // Usuário existe no banco
        setUser({
          id: userId,
          name: profileData.name || authName,
          email: profileData.email || authEmail,
          avatar: profileData.avatar_url || undefined,
          language: profileData.language as Language,
          level: profileData.level as Level,
          weeklyGoal: profileData.weekly_goal as WeeklyGoal,
          plan: profileData.plan as PlanType,
          createdAt: new Date(profileData.created_at),
        });
        setHasCompletedOnboarding(profileData.has_completed_onboarding);
      } else {
        // Perfil será criado automaticamente pelo trigger do banco
        // Aguardar um momento e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: retryProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (retryProfile) {
          setUser({
            id: userId,
            name: retryProfile.name || authName,
            email: retryProfile.email || authEmail,
            language: retryProfile.language as Language,
            level: retryProfile.level as Level,
            weeklyGoal: retryProfile.weekly_goal as WeeklyGoal,
            plan: retryProfile.plan as PlanType,
            createdAt: new Date(retryProfile.created_at),
          });
          setHasCompletedOnboarding(retryProfile.has_completed_onboarding);
        } else {
          // Fallback: usar dados padrão se o trigger falhar
          console.warn('Profile not found, using defaults');
          setUser({
            id: userId,
            name: authName,
            email: authEmail,
            language: 'english',
            level: 'basic',
            weeklyGoal: 5,
            plan: 'free_trial',
            createdAt: new Date(),
          });
          setHasCompletedOnboarding(false);
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }, []);

  // Inicializar autenticação
  useEffect(() => {
    // Primeiro, configurar o listener de mudança de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AppContext] Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        setAuthUserId(session.user.id);
        await loadUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || 'Usuário'
        );
      } else {
        setAuthUserId(null);
        setUser(null);
        setHasCompletedOnboarding(false);
        setConversations([]);
        setCurrentConversation(null);
      }
      setIsLoading(false);
    });

    // Depois, verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AppContext] Initial session:', session?.user?.id);
      if (session?.user) {
        setAuthUserId(session.user.id);
        loadUserProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || 'Usuário'
        );
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const addConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !authUserId) return;

    // Atualizar estado local
    setUser({ ...user, ...updates });

    // Atualizar no banco de dados
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.language) dbUpdates.language = updates.language;
    if (updates.level) dbUpdates.level = updates.level;
    if (updates.weeklyGoal) dbUpdates.weekly_goal = updates.weeklyGoal;
    if (updates.plan) dbUpdates.plan = updates.plan;
    if (updates.avatar) dbUpdates.avatar_url = updates.avatar;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('user_id', authUserId);

      if (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUserId(null);
    setConversations([]);
    setCurrentConversation(null);
    setHasCompletedOnboarding(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        authUserId,
        conversations,
        addConversation,
        currentConversation,
        setCurrentConversation,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        updateUserProfile,
        logout,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
