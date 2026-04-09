import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import characterImg from '@/assets/character.png';

interface Slide {
  title: string;
  description: string;
  showCharacter: boolean;
  characterPosition?: 'right' | 'left';
}

const slides: Slide[] = [
  {
    title: 'Pratique inglês em cenários reais',
    description: 'Simule situações do dia a dia como entrevistas e viagens — como se estivesse vivendo aquilo de verdade.',
    showCharacter: true,
    characterPosition: 'right',
  },
  {
    title: 'Aprendizado contínuo, não superficial',
    description: 'Você evolui a cada conversa, com prática real, repetição e progresso constante.',
    showCharacter: false,
  },
  {
    title: 'Converse como na vida real',
    description: 'Personalize cenários e pratique por voz ou texto com uma IA que reage como uma pessoa real.',
    showCharacter: true,
    characterPosition: 'right',
  },
  {
    title: 'Acompanhe sua evolução',
    description: 'Identifique pontos de melhoria e avance no idioma com consistência.',
    showCharacter: false,
  },
];

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

  return (
    <section
      className="pt-32 pb-20 px-6 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="relative min-h-[420px] md:min-h-[380px] flex items-center">
          {/* Text content */}
          <div
            className={`w-full ${slide.showCharacter ? 'lg:w-3/5' : 'lg:w-4/5 mx-auto text-center'} z-10 transition-all duration-500`}
            key={current}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl animate-fade-in">
              {slide.description}
            </p>
          </div>

          {/* Character */}
          {slide.showCharacter && (
            <div className="hidden lg:flex absolute right-0 bottom-0 w-[320px] xl:w-[380px] items-end justify-center animate-fade-in">
              <img
                src={characterImg}
                alt="Fluency IA mascot"
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="eager"
              />
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mt-8">
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

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Button size="xl" onClick={() => navigate('/auth')} className="gradient-primary border-0">
            Começar agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <span className="text-sm text-muted-foreground">
            7 dias grátis • Sem cartão • Progresso visível desde o primeiro dia
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
