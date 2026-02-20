export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'conversations' | 'streaks' | 'scores' | 'exploration' | 'milestones';
  requirement: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const achievements: Achievement[] = [
  // Conversation milestones
  {
    id: 'first_conversation',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira conversa',
    icon: '🎯',
    category: 'conversations',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'conversations_5',
    name: 'Praticante',
    description: 'Complete 5 conversas',
    icon: '💬',
    category: 'conversations',
    requirement: 5,
    tier: 'bronze',
  },
  {
    id: 'conversations_10',
    name: 'Comunicador',
    description: 'Complete 10 conversas',
    icon: '🗣️',
    category: 'conversations',
    requirement: 10,
    tier: 'silver',
  },
  {
    id: 'conversations_25',
    name: 'Fluente',
    description: 'Complete 25 conversas',
    icon: '🌟',
    category: 'conversations',
    requirement: 25,
    tier: 'gold',
  },
  {
    id: 'conversations_50',
    name: 'Expert',
    description: 'Complete 50 conversas',
    icon: '🏆',
    category: 'conversations',
    requirement: 50,
    tier: 'platinum',
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Consistente',
    description: 'Mantenha uma sequência de 3 dias',
    icon: '🔥',
    category: 'streaks',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'streak_7',
    name: 'Determinado',
    description: 'Mantenha uma sequência de 7 dias',
    icon: '⚡',
    category: 'streaks',
    requirement: 7,
    tier: 'silver',
  },
  {
    id: 'streak_14',
    name: 'Dedicado',
    description: 'Mantenha uma sequência de 14 dias',
    icon: '💪',
    category: 'streaks',
    requirement: 14,
    tier: 'gold',
  },
  {
    id: 'streak_30',
    name: 'Imbatível',
    description: 'Mantenha uma sequência de 30 dias',
    icon: '👑',
    category: 'streaks',
    requirement: 30,
    tier: 'platinum',
  },

  // Score achievements
  {
    id: 'score_70',
    name: 'Bom Desempenho',
    description: 'Alcance score de 70+ em uma conversa',
    icon: '📊',
    category: 'scores',
    requirement: 70,
    tier: 'bronze',
  },
  {
    id: 'score_80',
    name: 'Excelente',
    description: 'Alcance score de 80+ em uma conversa',
    icon: '🎖️',
    category: 'scores',
    requirement: 80,
    tier: 'silver',
  },
  {
    id: 'score_90',
    name: 'Perfeição',
    description: 'Alcance score de 90+ em uma conversa',
    icon: '🏅',
    category: 'scores',
    requirement: 90,
    tier: 'gold',
  },
  {
    id: 'score_95',
    name: 'Mestre',
    description: 'Alcance score de 95+ em uma conversa',
    icon: '💎',
    category: 'scores',
    requirement: 95,
    tier: 'platinum',
  },

  // Exploration achievements
  {
    id: 'scenario_restaurant',
    name: 'Gourmet',
    description: 'Complete uma conversa no restaurante',
    icon: '🍽️',
    category: 'exploration',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'scenario_interview',
    name: 'Profissional',
    description: 'Complete uma entrevista de emprego',
    icon: '💼',
    category: 'exploration',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'scenario_hotel',
    name: 'Viajante',
    description: 'Complete uma conversa no hotel',
    icon: '🏨',
    category: 'exploration',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'scenario_airport',
    name: 'Globetrotter',
    description: 'Complete uma conversa no aeroporto',
    icon: '✈️',
    category: 'exploration',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'all_scenarios',
    name: 'Explorador',
    description: 'Complete todos os cenários disponíveis',
    icon: '🗺️',
    category: 'exploration',
    requirement: 8,
    tier: 'gold',
  },

  // Level milestones
  {
    id: 'level_a2',
    name: 'Iniciante Avançado',
    description: 'Alcance o nível A2',
    icon: '📈',
    category: 'milestones',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'level_b1',
    name: 'Intermediário',
    description: 'Alcance o nível B1',
    icon: '📊',
    category: 'milestones',
    requirement: 1,
    tier: 'silver',
  },
  {
    id: 'level_b2',
    name: 'Intermediário Superior',
    description: 'Alcance o nível B2',
    icon: '🎯',
    category: 'milestones',
    requirement: 1,
    tier: 'gold',
  },
  {
    id: 'level_c1',
    name: 'Avançado',
    description: 'Alcance o nível C1',
    icon: '🌟',
    category: 'milestones',
    requirement: 1,
    tier: 'platinum',
  },
];

export const tierColors: Record<Achievement['tier'], { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-600 dark:text-orange-400' },
  silver: { bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300' },
  gold: { bg: 'bg-amber-50 dark:bg-amber-950/25', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400' },
  platinum: { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-300 dark:border-violet-700', text: 'text-violet-600 dark:text-violet-400' },
};

export const categoryNames: Record<Achievement['category'], string> = {
  conversations: 'Conversas',
  streaks: 'Sequências',
  scores: 'Pontuações',
  exploration: 'Exploração',
  milestones: 'Marcos',
};
