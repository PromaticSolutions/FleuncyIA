import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Mic, ArrowRight, Briefcase, Hotel } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScenarioSetupModalProps {
  open: boolean;
  onClose: () => void;
  scenarioId: 'interview' | 'hotel';
}

// --- Interview Setup ---
interface InterviewConfig {
  jobTitle: string;
  level: string;
  language: string;
  companyType: string;
  tone: string;
  accent: string;
}

// --- Hotel Setup ---
interface HotelConfig {
  destination: string;
  situation: string;
  difficulty: string;
  accent: string;
  hotelType: string;
}

type InteractionMode = 'text' | 'voice';

const ChipSelect: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          value === opt.value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const ScenarioSetupModal: React.FC<ScenarioSetupModalProps> = ({ open, onClose, scenarioId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Interview state
  const [interview, setInterview] = useState<InterviewConfig>({
    jobTitle: '',
    level: 'pleno',
    language: 'english',
    companyType: 'startup',
    tone: 'formal',
    accent: 'american',
  });

  // Hotel state
  const [hotel, setHotel] = useState<HotelConfig>({
    destination: '',
    situation: 'checkin',
    difficulty: 'medium',
    accent: 'american',
    hotelType: 'business',
  });

  const [mode, setMode] = useState<InteractionMode | null>(null);
  const [step, setStep] = useState<'config' | 'mode'>('config');

  const isInterviewValid = interview.jobTitle.trim().length > 0;
  const isHotelValid = hotel.destination.trim().length > 0;
  const isValid = scenarioId === 'interview' ? isInterviewValid : isHotelValid;

  const handleNext = () => {
    if (!isValid) return;
    setStep('mode');
  };

  const handleStart = () => {
    if (!mode) return;

    const config = scenarioId === 'interview' ? interview : hotel;
    const params = new URLSearchParams();
    params.set('mode', mode);
    Object.entries(config).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    onClose();
    if (mode === 'voice') {
      navigate(`/voice-call/${scenarioId}?${params.toString()}`);
    } else {
      navigate(`/chat/${scenarioId}?${params.toString()}`);
    }
  };

  const handleClose = () => {
    setStep('config');
    setMode(null);
    onClose();
  };

  const icon = scenarioId === 'interview' ? '💼' : '🏨';
  const title = scenarioId === 'interview' ? 'Entrevista de Emprego' : 'Hotel';
  const subtitle = scenarioId === 'interview'
    ? 'Configure sua simulação de entrevista'
    : 'Configure sua simulação no hotel';

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-border flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg text-xl">
                  {icon}
                </div>
                <div>
                  <SheetTitle className="text-lg leading-tight">{title}</SheetTitle>
                  <SheetDescription className="text-xs mt-0.5">{subtitle}</SheetDescription>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 'config' && scenarioId === 'interview' && (
            <div className="space-y-4">
              {/* Job Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nome da vaga *</Label>
                <Input
                  placeholder="Ex: Software Engineer, Product Manager..."
                  value={interview.jobTitle}
                  onChange={e => setInterview(p => ({ ...p, jobTitle: e.target.value }))}
                  maxLength={100}
                />
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nível *</Label>
                <ChipSelect
                  value={interview.level}
                  onChange={v => setInterview(p => ({ ...p, level: v }))}
                  options={[
                    { value: 'junior', label: 'Júnior' },
                    { value: 'pleno', label: 'Pleno' },
                    { value: 'senior', label: 'Sênior' },
                  ]}
                />
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Idioma da entrevista *</Label>
                <ChipSelect
                  value={interview.language}
                  onChange={v => setInterview(p => ({ ...p, language: v }))}
                  options={[
                    { value: 'english', label: '🇺🇸 Inglês' },
                    { value: 'spanish', label: '🇪🇸 Espanhol' },
                    { value: 'french', label: '🇫🇷 Francês' },
                    { value: 'german', label: '🇩🇪 Alemão' },
                    { value: 'italian', label: '🇮🇹 Italiano' },
                  ]}
                />
              </div>

              {/* Company Type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de empresa</Label>
                <ChipSelect
                  value={interview.companyType}
                  onChange={v => setInterview(p => ({ ...p, companyType: v }))}
                  options={[
                    { value: 'startup', label: 'Startup' },
                    { value: 'multinational', label: 'Multinacional' },
                    { value: 'traditional', label: 'Tradicional' },
                  ]}
                />
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tom da entrevista</Label>
                <ChipSelect
                  value={interview.tone}
                  onChange={v => setInterview(p => ({ ...p, tone: v }))}
                  options={[
                    { value: 'formal', label: 'Formal' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'challenging', label: 'Desafiador' },
                  ]}
                />
              </div>

              {/* Accent */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sotaque</Label>
                <ChipSelect
                  value={interview.accent}
                  onChange={v => setInterview(p => ({ ...p, accent: v }))}
                  options={[
                    { value: 'american', label: 'Americano' },
                    { value: 'british', label: 'Britânico' },
                    { value: 'neutral', label: 'Neutro' },
                  ]}
                />
              </div>
            </div>
          )}

          {step === 'config' && scenarioId === 'hotel' && (
            <div className="space-y-4">
              {/* Destination */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Destino *</Label>
                <Input
                  placeholder="Ex: New York, London, Paris..."
                  value={hotel.destination}
                  onChange={e => setHotel(p => ({ ...p, destination: e.target.value }))}
                  maxLength={100}
                />
              </div>

              {/* Situation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Situação *</Label>
                <ChipSelect
                  value={hotel.situation}
                  onChange={v => setHotel(p => ({ ...p, situation: v }))}
                  options={[
                    { value: 'checkin', label: 'Check-in' },
                    { value: 'room_service', label: 'Pedido no quarto' },
                    { value: 'reservation_issue', label: 'Problema com reserva' },
                    { value: 'complaint', label: 'Reclamação' },
                  ]}
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dificuldade</Label>
                <ChipSelect
                  value={hotel.difficulty}
                  onChange={v => setHotel(p => ({ ...p, difficulty: v }))}
                  options={[
                    { value: 'easy', label: 'Fácil' },
                    { value: 'medium', label: 'Médio' },
                    { value: 'hard', label: 'Difícil' },
                  ]}
                />
              </div>

              {/* Accent */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sotaque</Label>
                <ChipSelect
                  value={hotel.accent}
                  onChange={v => setHotel(p => ({ ...p, accent: v }))}
                  options={[
                    { value: 'american', label: 'Americano' },
                    { value: 'british', label: 'Britânico' },
                    { value: 'local', label: 'Local' },
                  ]}
                />
              </div>

              {/* Hotel Type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo de hotel</Label>
                <ChipSelect
                  value={hotel.hotelType}
                  onChange={v => setHotel(p => ({ ...p, hotelType: v }))}
                  options={[
                    { value: 'luxury', label: 'Luxo' },
                    { value: 'budget', label: 'Econômico' },
                    { value: 'business', label: 'Business' },
                  ]}
                />
              </div>
            </div>
          )}

          {step === 'mode' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Como você quer interagir?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('text')}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    mode === 'text'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-foreground">Texto</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Chat por escrito</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('voice')}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                    mode === 'voice'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-foreground">Voz</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Conversa real</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 border-t border-border flex-shrink-0">
          {step === 'config' ? (
            <Button
              onClick={handleNext}
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={!mode}
              className="w-full"
              size="lg"
            >
              Começar simulação
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
