import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { saveExitIntentFeedback } from '@/lib/exitIntentFeedback';

interface ExitIntentFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateBack?: () => void;
  onTrackEvent?: (event: string) => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ExitIntentFeedbackModal({ open, onClose, onNavigateBack, onTrackEvent }: ExitIntentFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  if (!open) return null;

  const handleClose = () => {
    onTrackEvent?.('exit_intent_popup_closed');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setSubmitState('submitting');

    try {
      await saveExitIntentFeedback({
        page_url: window.location.href,
        page_title: document.title,
        nome: nome.trim() || undefined,
        email: email.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        feedback_message: feedbackMessage.trim(),
      });

      onTrackEvent?.('exit_intent_feedback_submitted');
      setSubmitState('success');

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-8">
          {submitState === 'success' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🙏</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Obrigado!</h2>
              <p className="text-muted-foreground text-sm">
                Seu feedback ajuda muito a melhorar nossa experiência.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Antes de você sair... 👋
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Somos uma startup em evolução e sua opinião é muito importante para nós. Você poderia nos contar rapidamente como foi sua experiência no site?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Sua avaliação <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${star} estrelas`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback message */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Seu feedback <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Conte como foi sua experiência, o que gostou ou o que poderia melhorar..."
                    rows={3}
                    required
                    className="resize-none text-sm"
                  />
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Nome <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <Input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      E-mail <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      type="email"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Error message */}
                {submitState === 'error' && (
                  <p className="text-sm text-destructive">
                    Não foi possível enviar seu feedback agora. Tente novamente em instantes.
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={submitState === 'submitting' || !feedbackMessage.trim()}
                    className="flex-1"
                  >
                    {submitState === 'submitting' ? 'Enviando...' : 'Enviar feedback'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={submitState === 'submitting'}
                  >
                    Agora não
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
