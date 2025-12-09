import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-primary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl gradient-primary shadow-fluency-glow flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center animate-bounce-soft">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Fluency IA
        </h1>
        <p className="text-white/80 text-lg font-medium">
          Aprenda conversando
        </p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default Splash;
