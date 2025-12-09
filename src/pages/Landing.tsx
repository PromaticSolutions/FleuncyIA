import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  BarChart3, 
  Globe, 
  Mic, 
  CheckCircle, 
  ArrowRight,
  Play,
  Users,
  Award,
  Zap
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">Fluency IA</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/auth')} className="gradient-primary border-0">
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground mb-6">
                <Zap className="w-4 h-4 text-primary" />
                Aprendizado acelerado com IA
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Domine idiomas através de{' '}
                <span className="text-gradient">conversas reais</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Pratique inglês, espanhol, francês e outros idiomas em cenários do mundo real 
                com nossa IA avançada. Receba feedback instantâneo e análises detalhadas do seu progresso.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="xl" onClick={() => navigate('/auth')} className="gradient-primary border-0">
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="xl" variant="outline" className="group">
                  <Play className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                  Ver Demonstração
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  7 dias grátis
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Sem cartão de crédito
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up">
              <div className="relative bg-card rounded-2xl border border-border p-6 shadow-fluency-lg">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-lg">🍽️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Cenário: Restaurante</p>
                    <p className="text-xs text-muted-foreground">Nível Intermediário</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">🤖</div>
                    <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-3">
                      <p className="text-sm text-foreground">Good evening! Welcome to La Bella Italia. Do you have a reservation?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 max-w-[80%] gradient-primary rounded-2xl rounded-tr-sm p-3">
                      <p className="text-sm text-white">Yes, I have a reservation for two under the name Johnson.</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">👤</div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">🤖</div>
                    <div className="flex-1 bg-muted rounded-2xl rounded-tl-sm p-3">
                      <p className="text-sm text-foreground">Perfect! Right this way, please. Would you like to see our wine menu?</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Gramática correta
                    </span>
                    <span className="text-muted-foreground">Score: 95/100</span>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-4 py-2 shadow-fluency-md">
                <p className="text-xs text-muted-foreground">Feedback em</p>
                <p className="font-bold text-foreground">Tempo Real</p>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-4 py-2 shadow-fluency-md">
                <p className="text-xs text-muted-foreground">Cenários</p>
                <p className="font-bold text-foreground">8+ Situações</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="10k+" label="Usuários Ativos" />
            <StatItem value="500k+" label="Conversas Realizadas" />
            <StatItem value="5" label="Idiomas Disponíveis" />
            <StatItem value="98%" label="Satisfação" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos que impulsionam seu aprendizado
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta combinada com metodologia comprovada para resultados reais
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<MessageSquare className="w-6 h-6" />}
              title="Conversas Contextuais"
              description="Pratique em cenários reais como restaurantes, aeroportos, reuniões de negócios e muito mais."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Análises Detalhadas"
              description="Acompanhe seu progresso com métricas de gramática, vocabulário, fluência e pronúncia."
            />
            <FeatureCard 
              icon={<Mic className="w-6 h-6" />}
              title="Suporte a Áudio"
              description="Pratique sua pronúncia com reconhecimento de voz e feedback detalhado."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title="5 Idiomas"
              description="Inglês, Espanhol, Francês, Italiano e Alemão disponíveis para prática."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Feedback Instantâneo"
              description="Receba correções e sugestões em tempo real durante suas conversas."
            />
            <FeatureCard 
              icon={<Award className="w-6 h-6" />}
              title="Níveis Adaptativos"
              description="A IA ajusta a dificuldade automaticamente conforme seu progresso."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece a praticar em apenas 3 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="01"
              title="Escolha um cenário"
              description="Selecione entre 8 cenários do mundo real, desde restaurantes até reuniões de negócios."
            />
            <StepCard 
              number="02"
              title="Converse com a IA"
              description="Pratique conversas naturais com nossa IA avançada que simula situações reais."
            />
            <StepCard 
              number="03"
              title="Receba feedback"
              description="Analise seu desempenho com métricas detalhadas e sugestões de melhoria."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e evolua conforme suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PricingCard 
              name="Free Trial"
              price="R$ 0"
              period="7 dias"
              features={['2 cenários', '10 mensagens/dia', 'Feedback básico']}
              ctaText="Começar Grátis"
              onClick={() => navigate('/auth')}
            />
            <PricingCard 
              name="Beginner"
              price="R$ 14,99"
              period="/mês"
              features={['4 cenários', 'Conversas ilimitadas', 'Feedback completo', 'Histórico ilimitado']}
              ctaText="Assinar"
              onClick={() => navigate('/auth')}
            />
            <PricingCard 
              name="Pro"
              price="R$ 27,99"
              period="/mês"
              features={['6 cenários', 'Tudo do Beginner', 'Suporte a áudio', 'Análises avançadas']}
              ctaText="Assinar"
              onClick={() => navigate('/auth')}
              highlighted
            />
            <PricingCard 
              name="Fluency Plus"
              price="R$ 150"
              period="/ano"
              features={['Todos os cenários', 'Tudo do Pro', 'Exportar PDF', 'Suporte prioritário']}
              ctaText="Assinar Anual"
              onClick={() => navigate('/auth')}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="gradient-primary rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para dominar um novo idioma?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão aprendendo idiomas de forma mais eficiente com Fluency IA.
            </p>
            <Button 
              size="xl" 
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-white/90"
            >
              Começar Agora — É Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">Fluency IA</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 Fluency IA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ 
  icon, title, description 
}) => (
  <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-fluency-md transition-all duration-300">
    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

const StepCard: React.FC<{ number: string; title: string; description: string }> = ({ 
  number, title, description 
}) => (
  <div className="relative p-8 bg-card rounded-2xl border border-border">
    <span className="text-6xl font-bold text-muted/50 absolute top-4 right-6">{number}</span>
    <h3 className="font-semibold text-xl text-foreground mb-3 relative z-10">{title}</h3>
    <p className="text-muted-foreground leading-relaxed relative z-10">{description}</p>
  </div>
);

const PricingCard: React.FC<{ 
  name: string; 
  price: string; 
  period: string; 
  features: string[]; 
  ctaText: string;
  onClick: () => void;
  highlighted?: boolean;
}> = ({ name, price, period, features, ctaText, onClick, highlighted }) => (
  <div className={`p-6 rounded-2xl border ${
    highlighted 
      ? 'gradient-primary border-transparent' 
      : 'bg-card border-border'
  }`}>
    <h3 className={`font-semibold text-lg mb-2 ${highlighted ? 'text-white' : 'text-foreground'}`}>
      {name}
    </h3>
    <div className="mb-4">
      <span className={`text-3xl font-bold ${highlighted ? 'text-white' : 'text-foreground'}`}>
        {price}
      </span>
      <span className={highlighted ? 'text-white/70' : 'text-muted-foreground'}>{period}</span>
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((feature, i) => (
        <li key={i} className={`flex items-center gap-2 text-sm ${
          highlighted ? 'text-white/90' : 'text-muted-foreground'
        }`}>
          <CheckCircle className={`w-4 h-4 ${highlighted ? 'text-white' : 'text-success'}`} />
          {feature}
        </li>
      ))}
    </ul>
    <Button 
      onClick={onClick}
      className={`w-full ${highlighted ? 'bg-white text-primary hover:bg-white/90' : ''}`}
      variant={highlighted ? 'default' : 'outline'}
    >
      {ctaText}
    </Button>
  </div>
);

export default Landing;
