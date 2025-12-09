import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Language, Level, WeeklyGoal } from '@/types';
import { Check, Globe, Target, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

const languages = [
  { id: 'english', name: 'Inglês', flag: '🇺🇸' },
  { id: 'spanish', name: 'Espanhol', flag: '🇪🇸' },
  { id: 'french', name: 'Francês', flag: '🇫🇷' },
  { id: 'italian', name: 'Italiano', flag: '🇮🇹' },
  { id: 'german', name: 'Alemão', flag: '🇩🇪' },
];

const levels = [
  { id: 'basic', name: 'Básico', description: 'Estou começando do zero' },
  { id: 'intermediate', name: 'Intermediário', description: 'Conheço o básico' },
  { id: 'advanced', name: 'Avançado', description: 'Quero aperfeiçoar' },
];

const goals = [
  { id: 2, name: '2 conversas/semana', description: 'Ritmo tranquilo' },
  { id: 5, name: '5 conversas/semana', description: 'Equilíbrio ideal' },
  { id: 10, name: '10 conversas/semana', description: 'Aprendizado intenso' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserProfile, setHasCompletedOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [selectedLevel, setSelectedLevel] = useState<Level>('basic');
  const [selectedGoal, setSelectedGoal] = useState<WeeklyGoal>(5);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateUserProfile({
        language: selectedLanguage,
        level: selectedLevel,
        weeklyGoal: selectedGoal,
      });
      setHasCompletedOnboarding(true);
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="p-4 flex items-center gap-4">
        {step > 1 && (
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex-1 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'gradient-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Qual idioma você quer aprender?
            </h1>
            <p className="text-muted-foreground mb-8">
              Escolha o idioma que você deseja praticar
            </p>

            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as Language)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedLanguage === lang.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="font-semibold text-foreground">{lang.name}</span>
                  {selectedLanguage === lang.id && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Qual é o seu nível?
            </h1>
            <p className="text-muted-foreground mb-8">
              Vamos adaptar as conversas para você
            </p>

            <div className="space-y-3">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id as Level)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedLevel === level.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{level.name}</p>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                  {selectedLevel === level.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-fluency-md">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Qual é seu objetivo semanal?
            </h1>
            <p className="text-muted-foreground mb-8">
              Defina quantas conversas você quer fazer
            </p>

            <div className="space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id as WeeklyGoal)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    selectedGoal === goal.id
                      ? 'border-primary bg-fluency-light-blue'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  {selectedGoal === goal.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-8">
        <Button size="xl" className="w-full" onClick={handleNext}>
          {step === 3 ? 'Começar a praticar' : 'Continuar'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
