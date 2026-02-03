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
  Target,
  Zap,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export default function ProductDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, adminData } = useAdminAuth();
  const [datePreset, setDatePreset] = useState('30d');
  
  const currentPreset = datePresets.find(p => p.value === datePreset) || datePresets[1];
  const dateRange = currentPreset.getDates();
  
  const { metrics, conversionFunnel, topFeatures, isLoading, refetch } = useMetrics(dateRange);

  const handleLogout = async () => {
    await logout();
    navigate('/dev');
  };

  const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

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
            <h2 className="text-2xl font-bold text-slate-900">Dashboard de Produto</h2>
            <p className="text-slate-500 mt-1">
              Período: {format(dateRange.start, 'dd MMM yyyy', { locale: ptBR })} - {format(dateRange.end, 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Funil de Conversão
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500">
                Jornada do usuário desde o cadastro até a conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((step, index) => (
                  <div key={step.step} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{step.step}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{step.count}</span>
                        <span className={`text-sm font-semibold ${
                          step.percentage >= 50 ? 'text-emerald-600' : 
                          step.percentage >= 25 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {step.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div 
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ 
                          width: `${step.percentage}%`,
                          backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                        }}
                      />
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Funnel Insights */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Insights</h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  {conversionFunnel[1] && conversionFunnel[0] && conversionFunnel[1].percentage < 80 && (
                    <li>• {100 - conversionFunnel[1].percentage}% dos usuários não completam o onboarding</li>
                  )}
                  {conversionFunnel[4] && (
                    <li>• Taxa de conversão final: {conversionFunnel[4].percentage}%</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Top Features */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Funcionalidades Mais Utilizadas
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500">
                Ranking de features por número de interações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topFeatures.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topFeatures}
                      layout="vertical"
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'Interações']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Nenhum dado de feature tracking disponível</p>
                    <p className="text-sm mt-1">Implemente o tracking de features para ver dados aqui</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Core Metrics */}
          <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Métricas do Core Feature
              </CardTitle>
              <CardDescription className="text-slate-500">
                Indicadores da funcionalidade principal do produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Total de Conversas</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics?.totalConversations || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Conversas por Usuário</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metrics?.totalUsers ? (metrics.totalConversations / metrics.totalUsers).toFixed(1) : 0}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {conversionFunnel[2]?.percentage || 0}%
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Sessões Médias</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics?.sessionsPerUser || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
