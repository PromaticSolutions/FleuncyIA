import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  LogOut,
  Calendar,
  ChevronDown,
  RefreshCw,
  Download,
  Users,
  Share2,
  Globe,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Navigation items
const navItems = [
  { id: 'investor', label: 'Visão do Investidor', icon: LayoutDashboard, path: '/dev/dashboard' },
  { id: 'product', label: 'Produto', icon: Package, path: '/dev/dashboard/product' },
  { id: 'acquisition', label: 'Aquisição & Growth', icon: TrendingUp, path: '/dev/dashboard/acquisition' },
];

// Date range presets
const datePresets = [
  { label: 'Últimos 7 dias', value: '7d', getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Últimos 30 dias', value: '30d', getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Últimos 90 dias', value: '90d', getDates: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: 'Este mês', value: 'month', getDates: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: 'Mês anterior', value: 'prev_month', getDates: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
];

const CHANNEL_COLORS = {
  direct: '#3b82f6',
  organic: '#10b981',
  social: '#8b5cf6',
  paid: '#f59e0b',
  referral: '#ec4899',
};

interface ChannelData {
  channel: string;
  count: number;
  percentage: number;
}

export default function AcquisitionDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, adminData } = useAdminAuth();
  const [datePreset, setDatePreset] = useState('30d');
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [invitesSent, setInvitesSent] = useState(0);
  const [invitesAccepted, setInvitesAccepted] = useState(0);
  
  const currentPreset = datePresets.find(p => p.value === datePreset) || datePresets[1];
  const dateRange = currentPreset.getDates();

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch channel distribution
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select('source_channel')
        .gte('started_at', dateRange.start.toISOString())
        .lte('started_at', dateRange.end.toISOString());

      if (sessions) {
        const channelCounts: Record<string, number> = {};
        sessions.forEach(s => {
          const channel = s.source_channel || 'direct';
          channelCounts[channel] = (channelCounts[channel] || 0) + 1;
        });

        const total = sessions.length;
        const channelArray = Object.entries(channelCounts)
          .map(([channel, count]) => ({
            channel,
            count,
            percentage: Math.round((count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        setChannelData(channelArray);
      }

      // Fetch total users
      const { count: users } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateRange.start.toISOString());
      setTotalUsers(users || 0);

      // Fetch invites sent
      const { count: sent } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'invite_sent')
        .gte('created_at', dateRange.start.toISOString());
      setInvitesSent(sent || 0);

      // Fetch invites accepted
      const { count: accepted } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'invite_accepted')
        .gte('created_at', dateRange.start.toISOString());
      setInvitesAccepted(accepted || 0);

    } catch (error) {
      console.error('Error fetching acquisition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [datePreset]);

  const handleLogout = async () => {
    await logout();
    navigate('/dev');
  };

  // Calculate K-Factor
  const kFactor = totalUsers > 0 ? ((invitesSent / totalUsers) * (invitesAccepted / (invitesSent || 1))).toFixed(2) : '0.00';

  const channelLabels: Record<string, string> = {
    direct: 'Direto',
    organic: 'Orgânico',
    social: 'Social',
    paid: 'Pago',
    referral: 'Indicação',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">Fluency IA</h1>
                <p className="text-xs text-slate-500">Painel de Métricas</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-48 bg-white border-slate-200">
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={isLoading}
              className="border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-200">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                <DropdownMenuItem>Exportar CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-600">
                  <span className="text-sm">{adminData?.role || 'Admin'}</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Period Info */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Aquisição & Growth</h2>
            <p className="text-slate-500 mt-1">
              Período: {format(dateRange.start, 'dd MMM yyyy', { locale: ptBR })} - {format(dateRange.end, 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Novos Usuários</p>
                  <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Indicações Enviadas</p>
                  <p className="text-2xl font-bold text-slate-900">{invitesSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Indicações Aceitas</p>
                  <p className="text-2xl font-bold text-slate-900">{invitesAccepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">K-Factor</p>
                  <p className={`text-2xl font-bold ${parseFloat(kFactor) >= 1 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {kFactor}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Distribution - Pie Chart */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Distribuição por Canal
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500">
                Origem dos usuários por canal de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channelData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ channel, percentage }) => `${channelLabels[channel] || channel} (${percentage}%)`}
                      >
                        {channelData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHANNEL_COLORS[entry.channel as keyof typeof CHANNEL_COLORS] || '#64748b'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [value, channelLabels[props.payload.channel] || props.payload.channel]}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Nenhum dado de canal disponível</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channel Distribution - Bar Chart */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Usuários por Canal
              </CardTitle>
              <CardDescription className="text-slate-500">
                Comparativo de canais de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channelData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="channel" 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(value) => channelLabels[value] || value}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip 
                        formatter={(value) => [value, 'Usuários']}
                        labelFormatter={(value) => channelLabels[value] || value}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {channelData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHANNEL_COLORS[entry.channel as keyof typeof CHANNEL_COLORS] || '#64748b'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viralidade Insights */}
          <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Métricas de Viralidade
              </CardTitle>
              <CardDescription className="text-slate-500">
                Indicadores de crescimento viral do produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-4">Indicações por Usuário</h4>
                  <p className="text-4xl font-bold text-slate-900">
                    {totalUsers > 0 ? (invitesSent / totalUsers).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Média de indicações enviadas por usuário
                  </p>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-4">Taxa de Conversão</h4>
                  <p className="text-4xl font-bold text-slate-900">
                    {invitesSent > 0 ? ((invitesAccepted / invitesSent) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Indicações que resultaram em cadastro
                  </p>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-4">K-Factor</h4>
                  <p className={`text-4xl font-bold ${parseFloat(kFactor) >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {kFactor}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {parseFloat(kFactor) >= 1 
                      ? '✓ Crescimento viral sustentável' 
                      : 'K-Factor < 1: crescimento depende de aquisição paga'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
