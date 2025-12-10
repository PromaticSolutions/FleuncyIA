import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { plans } from '@/data/plans';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, Check, Crown, Sparkles, Zap, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const planIcons = {
  free_trial: Zap,
  beginner: Star,
  pro: Crown,
  fluency_plus: Sparkles,
};

const planColors = {
  free_trial: 'from-gray-400 to-gray-600',
  beginner: 'from-blue-400 to-blue-600',
  pro: 'from-purple-400 to-purple-600',
  fluency_plus: 'from-amber-400 to-orange-500',
};

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useApp();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSelectPlan = async (planId: string, stripePriceId?: string) => {
    if (planId === 'free_trial') {
      updateUserProfile({ plan: planId as any });
      toast({
        title: "Free Trial ativo!",
        description: "Aproveite 7 dias de acesso gratuito.",
      });
      navigate('/home');
      return;
    }

    if (!stripePriceId) {
      toast({
        title: "Erro",
        description: "Plano não disponível para assinatura.",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa estar logado para assinar um plano.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoadingPlan(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: stripePriceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-16 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Escolha seu plano</h1>
        </div>
        <p className="text-white/80 text-center">
          Desbloqueie todo o potencial do Fluency IA
        </p>
      </div>

      {/* Plans */}
      <div className="px-4 -mt-8 pb-8 space-y-4">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id];
          const isCurrentPlan = user?.plan === plan.id;
          const isLoading = loadingPlan === plan.id;
          
          return (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl border-2 overflow-hidden transition-all ${
                isCurrentPlan ? 'border-primary shadow-fluency-lg' : 'border-border shadow-fluency-sm'
              }`}
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${planColors[plan.id]} p-4 flex items-center gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-2xl font-bold">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-white/80 text-sm">
                      /{plan.period === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
                {isCurrentPlan && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                    Atual
                  </span>
                )}
              </div>

              {/* Features */}
              <div className="p-4">
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  size="lg"
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id, plan.stripePriceId)}
                  disabled={isCurrentPlan || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : isCurrentPlan ? (
                    'Plano atual'
                  ) : plan.id === 'free_trial' ? (
                    'Começar grátis'
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
