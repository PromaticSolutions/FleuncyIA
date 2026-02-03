import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useMetrics } from '@/hooks/useMetrics';
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
  DollarSign,
  Activity,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendLabel,
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
}) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-slate-500">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
              }`}>
                <span>{isPositive ? '↑' : isNegative ? '↓' : '→'}</span>
                <span>{Math.abs(trend)}%</span>
                {trendLabel && <span className="text-slate-400 ml-1">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, adminData } = useAdminAuth();
  const [datePreset, setDatePreset] = useState('30d');
  
  const currentPreset = datePresets.find(p => p.value === datePreset) || datePresets[1];
  const dateRange = currentPreset.getDates();
  
  const { metrics, userGrowth, isLoading, refetch } = useMetrics(dateRange);

  const handleLogout = async () => {
    await logout();
    navigate('/dev');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
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
            {/* Date Range Selector */}
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

            {/* Actions */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
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
                <DropdownMenuItem>Exportar Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
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
            <h2 className="text-2xl font-bold text-slate-900">Visão do Investidor</h2>
            <p className="text-slate-500 mt-1">
              Período: {format(dateRange.start, 'dd MMM yyyy', { locale: ptBR })} - {format(dateRange.end, 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Dados em tempo real
          </div>
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="MAU"
            value={formatNumber(metrics?.mau || 0)}
            subtitle="Usuários ativos mensais"
            icon={Users}
            trend={metrics?.growthRate || 0}
            trendLabel="vs mês anterior"
          />
          <KPICard
            title="Retenção D30"
            value={`${metrics?.retentionD30 || 0}%`}
            subtitle="Usuários que voltaram"
            icon={Activity}
          />
          <KPICard
            title="Crescimento MoM"
            value={`${metrics?.growthRate || 0}%`}
            subtitle={`${metrics?.currentMonthUsers || 0} novos este mês`}
            icon={TrendingUp}
            trend={metrics?.growthRate || 0}
          />
          <KPICard
            title="MRR"
            value={formatCurrency(metrics?.mrr || 0)}
            subtitle={`ARPU: ${formatCurrency(metrics?.arpu || 0)}`}
            icon={DollarSign}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Crescimento de Usuários
              </CardTitle>
              <CardDescription className="text-slate-500">
                Novos cadastros por dia no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: ptBR })}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Novos usuários"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Comparison */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Métricas de Retenção
              </CardTitle>
              <CardDescription className="text-slate-500">
                Comparativo de retenção em diferentes períodos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'D1', value: metrics?.retentionD1 || 0 },
                      { name: 'D7', value: metrics?.retentionD7 || 0 },
                      { name: 'D30', value: metrics?.retentionD30 || 0 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={40} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Retenção']}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {[
                        { name: 'D1', value: metrics?.retentionD1 || 0 },
                        { name: 'D7', value: metrics?.retentionD7 || 0 },
                        { name: 'D30', value: metrics?.retentionD30 || 0 },
                      ].map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value > 50 ? '#10b981' : entry.value > 25 ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">LTV / CAC</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">LTV Estimado</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(metrics?.ltv || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">CAC (estimado)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(50)}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ratio LTV:CAC</span>
                  <span className={`font-bold ${(metrics?.ltv || 0) / 50 >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {((metrics?.ltv || 0) / 50).toFixed(1)}:1
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Engajamento</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">DAU / MAU</span>
                  <span className="font-semibold text-slate-900">
                    {metrics?.mau ? ((metrics.dau / metrics.mau) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Sessões por usuário</span>
                  <span className="font-semibold text-slate-900">{metrics?.sessionsPerUser || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Duração média</span>
                  <span className="font-semibold text-slate-900">{Math.round((metrics?.avgSessionDuration || 0) / 60)}min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Conversão</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Taxa de conversão</span>
                  <span className="font-semibold text-slate-900">{metrics?.conversionRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total de usuários</span>
                  <span className="font-semibold text-slate-900">{formatNumber(metrics?.totalUsers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total de conversas</span>
                  <span className="font-semibold text-slate-900">{formatNumber(metrics?.totalConversations || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
