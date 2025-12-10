import { Plan } from '@/types';

// Stripe product and price IDs mapping
export const stripePrices = {
  beginner: {
    price_id: 'price_1ScrTzHBpM4SjtcoZd4qv5aC',
    product_id: 'prod_Ta1XL52XUjhYRK',
  },
  pro: {
    price_id: 'price_1ScrUdHBpM4SjtcoSMiUvuO4',
    product_id: 'prod_Ta1XISqaR3sTCg',
  },
  fluency_plus: {
    price_id: 'price_1ScrVBHBpM4Sjtco4pfVTC2v',
    product_id: 'prod_Ta1YWTtOqI7Rev',
  },
};

export const plans: Plan[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    period: 'month',
    features: [
      '7 dias de acesso',
      '2 cenários disponíveis',
      '10 mensagens por dia',
      'Feedback básico',
    ],
    scenarios: ['interview', 'hotel'],
    messagesPerDay: 10,
    hasAudio: false,
    hasPronunciation: false,
    hasAdvancedAnalytics: false,
  },
  {
    id: 'beginner',
    name: 'Beginner',
    price: 14.99,
    period: 'month',
    features: [
      'Conversas ilimitadas',
      '5 cenários disponíveis',
      'Feedback completo',
      'Histórico ilimitado',
    ],
    scenarios: ['interview', 'hotel', 'shopping', 'hospital', 'transport'],
    hasAudio: false,
    hasPronunciation: false,
    hasAdvancedAnalytics: false,
    stripePriceId: 'price_1ScrTzHBpM4SjtcoZd4qv5aC',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 27.99,
    period: 'month',
    features: [
      'Tudo do Beginner +',
      'Suporte a áudio',
      'Avaliação de pronúncia',
      'Análises avançadas',
      'Estatísticas de progresso',
    ],
    scenarios: ['restaurant', 'interview', 'airport', 'hotel', 'shopping', 'hospital', 'transport'],
    hasAudio: true,
    hasPronunciation: true,
    hasAdvancedAnalytics: true,
    stripePriceId: 'price_1ScrUdHBpM4SjtcoSMiUvuO4',
  },
  {
    id: 'fluency_plus',
    name: 'Fluency Plus',
    price: 150,
    period: 'year',
    features: [
      'Tudo do Pro +',
      'Desconto anual',
      'Prioridade no feedback',
      'Exportar PDF',
      'Todos os cenários',
    ],
    scenarios: ['restaurant', 'interview', 'airport', 'hotel', 'shopping', 'business', 'hospital', 'transport'],
    hasAudio: true,
    hasPronunciation: true,
    hasAdvancedAnalytics: true,
    stripePriceId: 'price_1ScrVBHBpM4Sjtco4pfVTC2v',
  },
];

export const getPlanById = (id: string): Plan | undefined => {
  return plans.find(plan => plan.id === id);
};
