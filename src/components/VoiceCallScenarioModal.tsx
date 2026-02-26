import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { scenarios, isScenarioLocked } from '@/data/scenarios';
import { useApp } from '@/contexts/AppContext';
import { PlanType } from '@/types';

interface VoiceCallScenarioModalProps {
  open: boolean;
  onClose: () => void;
}

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg">Chamada de Voz</DialogTitle>
          </div>
          <DialogDescription>
            Escolha um cenário para praticar por voz em tempo real com IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {scenarios.map(scenario => {
            const locked = user ? isScenarioLocked(scenario, user.plan as PlanType) : true;
            return (
              <button
                key={scenario.id}
                onClick={() => handleSelect(scenario.id, locked)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 group ${
                  locked
                    ? 'border-border bg-muted/20 opacity-60'
                    : 'border-border bg-card hover:border-violet-400/60 hover:bg-violet-500/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center flex-shrink-0 text-lg`}>
                  {scenario.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {scenario.titleKey ? t(scenario.titleKey) : scenario.id}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{scenario.difficulty}</p>
                </div>
                {locked ? (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Phone className="w-4 h-4 text-violet-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
