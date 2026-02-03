import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        setIsAdmin(false);
        setAdminData(null);
        return false;
      }

      setIsAdmin(true);
      setAdminData({
        id: data.id,
        user_id: data.user_id,
        role: data.role,
        permissions: data.permissions as string[],
      });
      return true;
    } catch {
      setIsAdmin(false);
      setAdminData(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setAdminData(null);
      }
      
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setAdminData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  const loginAsAdmin = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      throw error;
    }

    if (data.user) {
      const isAdminUser = await checkAdminStatus(data.user.id);
      
      if (!isAdminUser) {
        await supabase.auth.signOut();
        setIsLoading(false);
        throw new Error('Usuário não tem permissão de administrador');
      }
    }

    setIsLoading(false);
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAdminData(null);
  };

  return {
    user,
    adminData,
    isAdmin,
    isLoading,
    loginAsAdmin,
    logout,
  };
}
