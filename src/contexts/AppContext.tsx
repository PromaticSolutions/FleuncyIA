import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  
  // Prevenir race conditions
  const isInitialized = useRef(false);
  const currentLoadingUserId = useRef<string | null>(null);

  // Carregar perfil do banco de dados
  const loadUserProfile = useCallback(async (userId: string, authEmail: string, authName: string): Promise<boolean> => {
    // Evitar carregar o mesmo usuário múltiplas vezes
    if (currentLoadingUserId.current === userId) {
      console.log('[AppContext] Already loading profile for:', userId);
      return false;
    }
    
    currentLoadingUserId.current = userId;
    console.log('[AppContext] Loading profile for:', userId);
    
    try {
      // Tentar buscar perfil existente
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AppContext] Error fetching profile:', error);
        throw error;
      }

      if (profileData) {
        console.log('[AppContext] Profile found:', profileData.has_completed_onboarding);
        setUser({
          id: userId,
          name: profileData.name !== 'Usuário' ? profileData.name : authName,
          email: profileData.email || authEmail,
          avatar: profileData.avatar_url || undefined,
          language: profileData.language as Language,
          level: profileData.level as Level,
          weeklyGoal: profileData.weekly_goal as WeeklyGoal,
          plan: profileData.plan as PlanType,
          createdAt: new Date(profileData.created_at),
        });
        setHasCompletedOnboarding(profileData.has_completed_onboarding);
        return true;
      }
      
      // Perfil não existe, aguardar trigger criar e tentar novamente
      console.log('[AppContext] Profile not found, waiting for trigger...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: retryProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (retryProfile) {
        console.log('[AppContext] Profile found on retry');
        setUser({
          id: userId,
          name: retryProfile.name !== 'Usuário' ? retryProfile.name : authName,
          email: retryProfile.email || authEmail,
          language: retryProfile.language as Language,
          level: retryProfile.level as Level,
          weeklyGoal: retryProfile.weekly_goal as WeeklyGoal,
          plan: retryProfile.plan as PlanType,
          createdAt: new Date(retryProfile.created_at),
        });
        setHasCompletedOnboarding(retryProfile.has_completed_onboarding);
        return true;
      }
      
      // Fallback: usar dados padrão
      console.warn('[AppContext] Profile not found, using defaults');
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
      return true;
      
    } catch (err) {
      console.error('[AppContext] Error loading user profile:', err);
      // Em caso de erro, usar dados básicos para não bloquear o app
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
      return true;
    } finally {
      currentLoadingUserId.current = null;
    }
  }, []);

  // Inicializar autenticação (evita loop / múltiplos listeners)
  useEffect(() => {
    let cancelled = false;

    const clearState = () => {
      setAuthUserId(null);
      setUser(null);
      setHasCompletedOnboarding(false);
      setConversations([]);
      setCurrentConversation(null);
    };

    const handleSession = async (session: any) => {
      if (!session?.user) {
        clearState();
        if (!cancelled) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setAuthUserId(session.user.id);

      await loadUserProfile(
        session.user.id,
        session.user.email || '',
        session.user.user_metadata?.name || 'Usuário'
      );

      if (!cancelled) {
        isInitialized.current = true;
        setIsLoading(false);
      }
    };

    // Listener primeiro (evita perder eventos)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AppContext] Auth state changed:', event);

      // Evita dupla carga (o getSession abaixo já faz a primeira)
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        clearState();
        if (!cancelled) setIsLoading(false);
        return;
      }

      await handleSession(session);
    });

    // Carga inicial
    (async () => {
      try {
        console.log('[AppContext] Initializing auth...');
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        await handleSession(session);
      } catch (error) {
        console.error('[AppContext] Error initializing auth:', error);
        clearState();
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const addConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !authUserId) return;

    setUser({ ...user, ...updates });

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
        isAuthenticated: !!authUserId,
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
