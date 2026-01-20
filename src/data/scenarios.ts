import { Scenario, PlanType } from '@/types';

export const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Restaurante',
    description: 'Peça comida e converse com o garçom',
    icon: '🍽️',
    color: 'from-orange-400 to-red-500',
    requiredPlan: ['pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'interview',
    title: 'Entrevista',
    description: 'Treine respostas profissionais',
    icon: '💼',
    color: 'from-blue-400 to-indigo-500',
    requiredPlan: ['free_trial', 'beginner', 'pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'airport',
    title: 'Aeroporto',
    description: 'Check-in, imigração e embarque',
    icon: '✈️',
    color: 'from-sky-400 to-blue-500',
    requiredPlan: ['pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'hotel',
    title: 'Hotel',
    description: 'Reservas, pedidos e problemas',
    icon: '🏨',
    color: 'from-purple-400 to-pink-500',
    requiredPlan: ['free_trial', 'beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'shopping',
    title: 'Compras',
    description: 'Pergunte preços, tamanhos e compare itens',
    icon: '🛍️',
    color: 'from-pink-400 to-rose-500',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
  {
    id: 'business',
    title: 'Reunião de Negócios',
    description: 'Converse de forma profissional',
    icon: '📊',
    color: 'from-emerald-400 to-teal-500',
    requiredPlan: ['fluency_plus'],
    difficulty: 'advanced',
  },
  {
    id: 'hospital',
    title: 'Hospital',
    description: 'Descreva sintomas e receba instruções',
    icon: '🏥',
    color: 'from-red-400 to-pink-500',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'intermediate',
  },
  {
    id: 'transport',
    title: 'Uber/Transporte',
    description: 'Converse com motorista',
    icon: '🚗',
    color: 'from-gray-600 to-gray-800',
    requiredPlan: ['beginner', 'pro', 'fluency_plus'],
    difficulty: 'basic',
  },
];

export const getAvailableScenarios = (plan: PlanType): Scenario[] => {
  return scenarios.filter(scenario => scenario.requiredPlan.includes(plan));
};

export const isScenarioLocked = (scenario: Scenario, plan: PlanType): boolean => {
  return !scenario.requiredPlan.includes(plan);
};
