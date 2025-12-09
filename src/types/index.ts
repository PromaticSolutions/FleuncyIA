export type Language = 'english' | 'spanish' | 'french' | 'italian' | 'german';

export type Level = 'basic' | 'intermediate' | 'advanced';

export type WeeklyGoal = 2 | 5 | 10;

export type PlanType = 'free_trial' | 'beginner' | 'pro' | 'fluency_plus';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  language: Language;
  level: Level;
  weeklyGoal: WeeklyGoal;
  plan: PlanType;
  createdAt: Date;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requiredPlan: PlanType[];
  difficulty: Level;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  scenarioId: string;
  userId: string;
  messages: Message[];
  startedAt: Date;
  endedAt?: Date;
  feedback?: ConversationFeedback;
}

export interface ConversationFeedback {
  overallScore: number;
  grammar: number;
  vocabulary: number;
  clarity: number;
  fluency: number;
  pronunciation?: number;
  contextCoherence: number;
  errors: FeedbackError[];
  improvements: string[];
  correctPhrases: string[];
  estimatedLevel: string;
}

export interface FeedbackError {
  original: string;
  corrected: string;
  category: 'grammar' | 'vocabulary' | 'pronunciation' | 'context';
  explanation: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  scenarios: string[];
  messagesPerDay?: number;
  hasAudio: boolean;
  hasPronunciation: boolean;
  hasAdvancedAnalytics: boolean;
}
