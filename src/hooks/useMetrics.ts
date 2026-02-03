import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format, startOfDay, subDays, endOfDay } from 'date-fns';

export interface MetricsSummary {
  // Active users
  dau: number;
  wau: number;
  mau: number;
  
  // Retention
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  
  // Growth
  currentMonthUsers: number;
  previousMonthUsers: number;
  growthRate: number;
  
  // Engagement
  avgSessionDuration: number;
  sessionsPerUser: number;
  
  // Monetization
  mrr: number;
  arpu: number;
  conversionRate: number;
  ltv: number;
  
  // Totals
  totalUsers: number;
  totalConversations: number;
  totalSessions: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface FunnelData {
  step: string;
  count: number;
  percentage: number;
}

export interface TopFeature {
  name: string;
  count: number;
}

export function useMetrics(dateRange: { start: Date; end: Date }) {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [userGrowth, setUserGrowth] = useState<TimeSeriesData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<FunnelData[]>([]);
  const [topFeatures, setTopFeatures] = useState<TopFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch active users metrics
      const { data: activeUsers } = await supabase
        .rpc('get_active_users_metrics');
      
      // Fetch retention metrics
      const { data: retention } = await supabase
        .rpc('get_retention_metrics');
      
      // Fetch growth metrics
      const { data: growth } = await supabase
        .rpc('get_growth_metrics');

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total conversations
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      // Fetch total sessions
      const { count: totalSessions } = await supabase
        .from('analytics_sessions')
        .select('*', { count: 'exact', head: true });

      // Fetch average session duration
      const { data: sessionStats } = await supabase
        .from('analytics_sessions')
        .select('duration_seconds')
        .not('duration_seconds', 'is', null);

      const avgDuration = sessionStats?.length 
        ? sessionStats.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionStats.length 
        : 0;

      // Calculate sessions per user
      const sessionsPerUser = totalUsers && totalSessions 
        ? Math.round((totalSessions / totalUsers) * 10) / 10 
        : 0;

      // Fetch conversion metrics (users who paid)
      const { count: paidUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .neq('plan', 'free_trial');

      const conversionRate = totalUsers 
        ? Math.round(((paidUsers || 0) / totalUsers) * 100 * 10) / 10 
        : 0;

      // Estimate MRR (assuming R$29/month average)
      const mrr = (paidUsers || 0) * 29;
      const arpu = totalUsers ? mrr / totalUsers : 0;
      const ltv = arpu * 12; // Simple 12-month estimate

      setMetrics({
        dau: activeUsers?.[0]?.daily_active_users || 0,
        wau: activeUsers?.[0]?.weekly_active_users || 0,
        mau: activeUsers?.[0]?.monthly_active_users || 0,
        retentionD1: retention?.[0]?.retention_d1 || 0,
        retentionD7: retention?.[0]?.retention_d7 || 0,
        retentionD30: retention?.[0]?.retention_d30 || 0,
        currentMonthUsers: growth?.[0]?.current_month_users || 0,
        previousMonthUsers: growth?.[0]?.previous_month_users || 0,
        growthRate: growth?.[0]?.growth_rate || 0,
        avgSessionDuration: Math.round(avgDuration),
        sessionsPerUser,
        mrr,
        arpu: Math.round(arpu * 100) / 100,
        conversionRate,
        ltv: Math.round(ltv),
        totalUsers: totalUsers || 0,
        totalConversations: totalConversations || 0,
        totalSessions: totalSessions || 0,
      });

      // Fetch user growth time series
      const { data: userGrowthData } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (userGrowthData) {
        const dailyCounts: Record<string, number> = {};
        userGrowthData.forEach(user => {
          const date = format(new Date(user.created_at), 'yyyy-MM-dd');
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        const growthSeries: TimeSeriesData[] = [];
        let currentDate = new Date(dateRange.start);
        while (currentDate <= dateRange.end) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          growthSeries.push({
            date: dateStr,
            value: dailyCounts[dateStr] || 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        setUserGrowth(growthSeries);
      }

      // Fetch conversion funnel
      const { count: signups } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'user_signup')
        .gte('created_at', dateRange.start.toISOString());

      const { count: onboarded } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('has_completed_onboarding', true)
        .gte('created_at', dateRange.start.toISOString());

      const { count: firstConversation } = await supabase
        .from('conversations')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', dateRange.start.toISOString());

      const { count: planViews } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'plan_viewed')
        .gte('created_at', dateRange.start.toISOString());

      const funnelTotal = signups || totalUsers || 1;
      setConversionFunnel([
        { step: 'Cadastro', count: signups || totalUsers || 0, percentage: 100 },
        { step: 'Onboarding', count: onboarded || 0, percentage: Math.round(((onboarded || 0) / funnelTotal) * 100) },
        { step: 'Primeira conversa', count: firstConversation || 0, percentage: Math.round(((firstConversation || 0) / funnelTotal) * 100) },
        { step: 'Visualizou planos', count: planViews || 0, percentage: Math.round(((planViews || 0) / funnelTotal) * 100) },
        { step: 'Converteu', count: paidUsers || 0, percentage: Math.round(((paidUsers || 0) / funnelTotal) * 100) },
      ]);

      // Fetch top features
      const { data: featureEvents } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('event_name', 'feature_used')
        .gte('created_at', dateRange.start.toISOString());

      if (featureEvents) {
        const featureCounts: Record<string, number> = {};
        featureEvents.forEach(event => {
          const feature = (event.metadata as Record<string, unknown>)?.feature as string;
          if (feature) {
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
          }
        });

        const sortedFeatures = Object.entries(featureCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setTopFeatures(sortedFeatures);
      }

    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    userGrowth,
    conversionFunnel,
    topFeatures,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
