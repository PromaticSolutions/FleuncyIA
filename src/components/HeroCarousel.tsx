import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, ChevronLeft, ChevronRight, MessageSquare, BarChart3, Mic, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import characterImg from '@/assets/character.png';

interface Slide {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  visual: 'mockup-chat' | 'mockup-analytics' | 'character' | 'mockup-voice';
}

const slides: Slide[] = [
  {
    badge: 'PRÁTICA REAL',
    title: 'Pratique inglês\nem cenários reais',
    subtitle: 'como se estivesse vivendo aquilo de verdade',
    description: 'Simule situações do dia a dia como entrevistas de emprego e viagens — com uma IA que responde como uma pessoa real.',
    visual: 'mockup-chat',
  },
  {
    badge: 'EVOLUÇÃO CONTÍNUA',
    title: 'Aprendizado\ncontínuo, não\nsuperficial',
    subtitle: 'progresso real a cada conversa',
    description: 'Você evolui a cada conversa, com prática real, repetição inteligente e progresso constante visível no seu painel.',
    visual: 'mockup-analytics',
  },
  {
    badge: 'IMERSÃO TOTAL',
    title: 'Converse como\nna vida real',
    subtitle: 'por voz ou texto, você escolhe',
    description: 'Personalize cenários e pratique por voz ou texto com uma IA que reage como uma pessoa real — sem scripts prontos.',
    visual: 'character',
  },
  {
    badge: 'SEU PROGRESSO',
    title: 'Acompanhe\nsua evolução',
    subtitle: 'identifique pontos de melhoria',
    description: 'Feedback detalhado após cada conversa. Veja o que melhorou, o que precisa de atenção e avance com consistência.',
    visual: 'mockup-voice',
  },
];

// Mockup: Chat conversation
const MockupChat: React.FC = () => (
  <div className="bg-card/90 backdrop-blur rounded-2xl border border-border/50 p-5 shadow-2xl w-full max-w-[400px]">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
        <span className="text-base">💼</span>
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">Job Interview</p>
        <p className="text-[11px] text-muted-foreground">Software Engineer • Senior</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] flex-shrink-0">🤖</div>
        <div className="bg-muted rounded-xl rounded-tl-sm p-2.5 max-w-[85%]">
          <p className="text-xs text-foreground">Tell me about a challenging project you've led recently.</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <div className="gradient-primary rounded-xl rounded-tr-sm p-2.5 max-w-[85%]">
          <p className="text-xs text-white">I led a migration from a monolith to microservices...</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] flex-shrink-0">👤</div>
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] flex-shrink-0">🤖</div>
        <div className="bg-muted rounded-xl rounded-tl-sm p-2.5 max-w-[85%]">
          <p className="text-xs text-foreground">Interesting! What were the main challenges you faced?</p>
        </div>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[10px]">
      <span className="text-green-400 flex items-center gap-1">✓ Grammar: Correct</span>
      <span className="text-muted-foreground">Score: 92/100</span>
    </div>
  </div>
);

// Mockup: Analytics dashboard
const MockupAnalytics: React.FC = () => (
  <div className="bg-card/90 backdrop-blur rounded-2xl border border-border/50 p-5 shadow-2xl w-full max-w-[400px]">
    <div className="flex items-center justify-between mb-4">
      <p className="font-semibold text-foreground text-sm">Seu Progresso</p>
      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">Últimos 30 dias</span>
    </div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: 'Conversas', value: '24', color: 'text-primary' },
        { label: 'Nota média', value: '87', color: 'text-green-400' },
        { label: 'Streak', value: '12d', color: 'text-amber-400' },
      ].map(s => (
        <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="space-y-2">
      {['Grammar', 'Vocabulary', 'Fluency'].map((skill, i) => (
        <div key={skill} className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground w-16">{skill}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${75 + i * 8}%` }} />
          </div>
          <span className="text-[11px] text-foreground font-medium">{75 + i * 8}%</span>
        </div>
      ))}
    </div>
  </div>
);

// Mockup: Voice interaction
const MockupVoice: React.FC = () => (
  <div className="bg-card/90 backdrop-blur rounded-2xl border border-border/50 p-5 shadow-2xl w-full max-w-[400px]">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
        <Mic className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">Feedback da Sessão</p>
        <p className="text-[11px] text-muted-foreground">Hotel Check-in • New York</p>
      </div>
    </div>
    <div className="space-y-3">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-green-400 mb-1">✦ Pontos fortes</p>
        <p className="text-[11px] text-muted-foreground">Boa pronúncia, vocabulário adequado ao contexto</p>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-amber-400 mb-1">△ Pontos de melhoria</p>
        <p className="text-[11px] text-muted-foreground">Trabalhar conectores e tempos verbais compostos</p>
      </div>
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-primary mb-1">→ Sugestão</p>
        <p className="text-[11px] text-muted-foreground">Pratique pedir informações em cenários de viagem</p>
      </div>
    </div>
  </div>
);

const HeroCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  const renderVisual = () => {
    switch (slide.visual) {
      case 'mockup-chat':
        return <MockupChat />;
      case 'mockup-analytics':
        return <MockupAnalytics />;
      case 'character':
        return (
          <div className="relative flex items-center justify-center">
            {/* Ambient glow */}
            <div className="absolute w-[280px] h-[280px] xl:w-[340px] xl:h-[340px] rounded-full bg-primary/15 blur-[80px]" />
            {/* Secondary glow */}
            <div className="absolute w-[180px] h-[180px] xl:w-[220px] xl:h-[220px] rounded-full bg-accent/10 blur-[60px] translate-y-8" />
            {/* Character */}
            <img
              src={characterImg}
              alt="Fluency IA"
              className="relative z-10 w-[340px] xl:w-[400px] h-auto object-contain drop-shadow-[0_8px_40px_rgba(155,107,242,0.35)] translate-y-2"
              loading="eager"
            />
          </div>
        );
      case 'mockup-voice':
        return <MockupVoice />;
      default:
        return null;
    }
  };

  return (
    <section
      className="pt-28 pb-16 px-6 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[440px]">
          {/* LEFT — Text */}
          <div key={`text-${current}`} className="animate-fade-in">
            <span className="inline-block px-3 py-1.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold tracking-wider mb-6">
              {slide.badge}
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-[3.2rem] xl:text-[3.5rem] font-bold text-foreground leading-[1.1] mb-4 whitespace-pre-line">
              {slide.title}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground/80 mb-3 font-medium">
              {slide.subtitle}
            </p>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {slide.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate('/auth')} className="gradient-primary border-0 px-7">
                Começar Agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="group" onClick={() => navigate('/demo')}>
                <Play className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                Ver Demonstração
              </Button>
            </div>
          </div>

          {/* RIGHT — Visual */}
          <div key={`visual-${current}`} className="hidden lg:flex items-center justify-center animate-fade-in">
            {renderVisual()}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-10">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-8 h-2.5 bg-primary'
                    : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Microcopy */}
        <p className="mt-6 text-xs text-muted-foreground/60">
          7 dias grátis • Sem cartão • Progresso visível desde o primeiro dia
        </p>
      </div>
    </section>
  );
};

export default HeroCarousel;
