import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, Language, Level, WeeklyGoal, PlanType, Conversation } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const VALID_PLANS: PlanType[] = ['free_trial', 'beginner', 'pro', 'fluency_plus'];
const isValidPlanType = (value: unknown): value is PlanType =>
  typeof value === 'string' && (VALID_PLANS as string[]).includes(value);

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
  refreshProfile: () => Promise<void>;
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

  // Carregar perfil do banco de dados com retry melhorado
  const loadUserProfile = useCallback(async (userId: string, authEmail: string, authName: string, retryCount = 0): Promise<boolean> => {
    // Evitar carregar o mesmo usuário múltiplas vezes
    if (currentLoadingUserId.current === userId && retryCount === 0) {
      console.log('[AppContext] Already loading profile for:', userId);
      return false;
    }
    
    currentLoadingUserId.current = userId;
    console.log('[AppContext] Loading profile for:', userId, 'retry:', retryCount);
    
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
        console.log('[AppContext] Profile found:', profileData.name, 'onboarding:', profileData.has_completed_onboarding);
        
        // Usar nome do auth se o perfil tem nome padrão
        const displayName = (profileData.name && profileData.name !== 'Usuário') 
          ? profileData.name 
          : (authName && authName !== 'Usuário' ? authName : profileData.name);
        
        setUser({
          id: userId,
          name: displayName,
          email: profileData.email || authEmail,
          avatar: profileData.avatar_url || undefined,
          language: profileData.language as Language,
          level: profileData.level as Level,
          weeklyGoal: profileData.weekly_goal as WeeklyGoal,
          plan: isValidPlanType(profileData.plan) ? profileData.plan : 'free_trial',
          createdAt: new Date(profileData.created_at),
        });
        setHasCompletedOnboarding(profileData.has_completed_onboarding);
        return true;
      }
      
      // Perfil não existe, aguardar trigger criar e tentar novamente (máx 3 tentativas)
      if (retryCount < 3) {
        console.log('[AppContext] Profile not found, waiting for trigger... retry:', retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, 1500));
        currentLoadingUserId.current = null; // Reset para permitir retry
        return loadUserProfile(userId, authEmail, authName, retryCount + 1);
      }
      
      // Fallback após todas tentativas: usar dados padrão
      console.warn('[AppContext] Profile not found after retries, using defaults');
      setUser({
        id: userId,
        name: authName || 'Usuário',
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
        name: authName || 'Usuário',
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

  // Função para atualizar perfil manualmente
  const refreshProfile = useCallback(async () => {
    if (!authUserId) return;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await loadUserProfile(
        authUser.id,
        authUser.email || '',
        authUser.user_metadata?.name || authUser.user_metadata?.full_name || ''
      );
    }
  }, [authUserId, loadUserProfile]);

  // Load theme from database and apply it
  const loadAndApplyTheme = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data?.theme) {
        const root = document.documentElement;
        if (data.theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        localStorage.setItem('fluency_theme', data.theme);
      }
    } catch (err) {
      console.error('[AppContext] Error loading theme:', err);
    }
  };

  // Inicializar autenticação
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

      setAuthUserId(session.user.id);

      // Extrair nome do metadata (Google OAuth ou signup)
      const userName = session.user.user_metadata?.name 
        || session.user.user_metadata?.full_name 
        || session.user.email?.split('@')[0] 
        || '';

      await loadUserProfile(
        session.user.id,
        session.user.email || '',
        userName
      );

      // Load and apply theme from database
      await loadAndApplyTheme(session.user.id);

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

      // Para TOKEN_REFRESHED, não recarregar se já temos usuário
      if (event === 'TOKEN_REFRESHED' && user) {
        console.log('[AppContext] Token refreshed, keeping current user');
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
        refreshProfile,
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
