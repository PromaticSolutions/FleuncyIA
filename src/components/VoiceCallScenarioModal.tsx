import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Lock, X, Mic } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { scenarios, isScenarioLocked } from '@/data/scenarios';
import { useApp } from '@/contexts/AppContext';
import { PlanType } from '@/types';

interface VoiceCallScenarioModalProps {
  open: boolean;
  onClose: () => void;
}

const difficultyLabel: Record<string, string> = {
  basic: 'Básico',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export const VoiceCallScenarioModal: React.FC<VoiceCallScenarioModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useApp();

  const handleSelect = (scenarioId: string, locked: boolean) => {
    if (locked) {
      onClose();
      navigate('/plans');
      return;
    }
    onClose();
    navigate(`/voice-call/${scenarioId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-border flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-lg leading-tight">Chamada de Voz</SheetTitle>
                  <SheetDescription className="text-xs mt-0.5">
                    Conversa em tempo real com IA
                  </SheetDescription>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>

          {/* Mic permission hint */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Mic className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-600 dark:text-violet-400">
              O microfone será solicitado ao iniciar a chamada
            </p>
          </div>
        </div>

        {/* Scenario list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {scenarios.map(scenario => {
            const locked = user ? isScenarioLocked(scenario, user.plan as PlanType) : true;
            return (
              <button
                key={scenario.id}
                onClick={() => handleSelect(scenario.id, locked)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] ${
                  locked
                    ? 'border-border bg-muted/20 opacity-60'
                    : 'border-border bg-card hover:border-violet-400/60 hover:bg-violet-500/5'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center flex-shrink-0 text-xl shadow-sm`}>
                  {scenario.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {scenario.titleKey ? t(scenario.titleKey) : scenario.id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {difficultyLabel[scenario.difficulty] || scenario.difficulty}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {locked ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">Pro</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom safe area spacer */}
        <div className="h-4 flex-shrink-0" />
      </SheetContent>
    </Sheet>
  );
};
