import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, Globe, Brain, Mic } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-1/2 gradient-primary opacity-5" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-8 w-20 h-20 bg-fluency-light-blue rounded-full blur-2xl" />
      <div className="absolute bottom-40 left-8 w-32 h-32 bg-fluency-light-purple rounded-full blur-3xl" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="relative mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-2xl gradient-primary shadow-fluency-lg flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center shadow-fluency-sm">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          Aprenda idiomas<br />
          <span className="text-gradient">conversando com IA</span>
        </h1>

        <p 
          className="text-muted-foreground text-center text-lg mb-12 max-w-sm animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          Pratique em cenários reais e receba feedback instantâneo
        </p>

        {/* Features */}
        <div 
          className="grid grid-cols-3 gap-4 mb-12 w-full max-w-sm animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <FeatureItem icon={<Globe className="w-5 h-5" />} label="5 idiomas" />
          <FeatureItem icon={<Brain className="w-5 h-5" />} label="IA adaptativa" />
          <FeatureItem icon={<Mic className="w-5 h-5" />} label="Áudio" />
        </div>

        {/* Illustration placeholder */}
        <div 
          className="w-full max-w-sm h-48 rounded-3xl bg-gradient-to-br from-fluency-light-blue to-fluency-light-purple mb-12 flex items-center justify-center animate-slide-up overflow-hidden relative"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-white rounded-2xl px-4 py-2 shadow-fluency-sm">
            <p className="text-xs text-muted-foreground">Hello! How are you?</p>
          </div>
          <div className="absolute top-4 right-4 bg-primary rounded-2xl px-4 py-2 shadow-fluency-sm">
            <p className="text-xs text-white">I'm great!</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div 
        className="px-6 pb-8 animate-slide-up"
        style={{ animationDelay: '0.6s' }}
      >
        <Button 
          size="xl" 
          className="w-full"
          onClick={() => navigate('/auth')}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50">
    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
      {icon}
    </div>
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
  </div>
);

export default Welcome;
