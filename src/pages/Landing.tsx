import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.nav.features')}</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.nav.howItWorks')}</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.nav.pricing')}</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              {t('landing.nav.login')}
            </Button>
            <Button onClick={() => navigate('/auth')} className="gradient-primary border-0">
              {t('landing.nav.getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-foreground/80 mb-6">
                <Zap className="w-4 h-4 text-primary" />
                {t('landing.hero.badge')}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {t('landing.hero.title')}{' '}
                <span className="text-gradient">{t('landing.hero.titleHighlight')}</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('landing.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="xl" onClick={() => navigate('/auth')} className="gradient-primary border-0">
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="xl" variant="outline" className="group">
                  <Play className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                  {t('landing.hero.demo')}
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  {t('landing.hero.freeTrial')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  {t('landing.hero.noCard')}
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
                    <p className="font-semibold text-foreground">{t('landing.chat.scenario')}: {t('landing.method.scenarios.restaurant')}</p>
                    <p className="text-xs text-muted-foreground">{t('landing.chat.level')}</p>
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
                      {t('landing.chat.correctGrammar')}
                    </span>
                    <span className="text-muted-foreground">Score: 95/100</span>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-4 py-2 shadow-fluency-md">
                <p className="text-xs text-muted-foreground">{t('landing.features.instantFeedback.title')}</p>
                <p className="font-bold text-foreground">{t('landing.chat.realTimeFeedback')}</p>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-4 py-2 shadow-fluency-md">
                <p className="text-xs text-muted-foreground">{t('landing.chat.scenario')}</p>
                <p className="font-bold text-foreground">{t('landing.chat.scenarios')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* TBLT Methodology Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.method.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.method.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MethodCard 
              emoji="🍽️"
              scenario={t('landing.method.scenarios.restaurant')}
              subtitle={t('landing.method.methodology')}
              badge={t('landing.method.badge')}
              messages={[
                { role: 'ai', text: "Welcome! What would you like to order today?" },
                { role: 'user', text: "I'd like a main course and a drink, please." },
                { role: 'ai', text: "Great choice. Would you like to see today's specials?" }
              ]}
              objective={t('landing.method.objectives.order')}
              method="Task-Based Learning"
              feedback={t('landing.method.feedbackTypes.communication')}
              t={t}
            />
            <MethodCard 
              emoji="✈️"
              scenario={t('landing.method.scenarios.travel')}
              subtitle={t('landing.method.methodology')}
              badge={t('landing.method.badge')}
              messages={[
                { role: 'ai', text: "Good morning! May I see your boarding pass, please?" },
                { role: 'user', text: "Sure, here it is. Can I have a window seat?" },
                { role: 'ai', text: "Let me check availability. Yes, seat 12A is free." }
              ]}
              objective={t('landing.method.objectives.checkin')}
              method="Task-Based Learning"
              feedback={t('landing.method.feedbackTypes.vocabulary')}
              t={t}
            />
            <MethodCard 
              emoji="💼"
              scenario={t('landing.method.scenarios.businessMeeting')}
              subtitle={t('landing.method.methodology')}
              badge={t('landing.method.badge')}
              messages={[
                { role: 'ai', text: "Let's discuss the quarterly results. Any thoughts?" },
                { role: 'user', text: "I believe we should focus on the marketing budget." },
                { role: 'ai', text: "Good point. Can you elaborate on your proposal?" }
              ]}
              objective={t('landing.method.objectives.meeting')}
              method="Task-Based Learning"
              feedback={t('landing.method.feedbackTypes.fluency')}
              t={t}
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('landing.method.footer')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<MessageSquare className="w-6 h-6" />}
              title={t('landing.features.contextualConversations.title')}
              description={t('landing.features.contextualConversations.description')}
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title={t('landing.features.detailedAnalytics.title')}
              description={t('landing.features.detailedAnalytics.description')}
            />
            <FeatureCard 
              icon={<Mic className="w-6 h-6" />}
              title={t('landing.features.audioSupport.title')}
              description={t('landing.features.audioSupport.description')}
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title={t('landing.features.fiveLanguages.title')}
              description={t('landing.features.fiveLanguages.description')}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title={t('landing.features.instantFeedback.title')}
              description={t('landing.features.instantFeedback.description')}
            />
            <FeatureCard 
              icon={<Award className="w-6 h-6" />}
              title={t('landing.features.adaptiveLevels.title')}
              description={t('landing.features.adaptiveLevels.description')}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="01"
              title={t('landing.howItWorks.step1.title')}
              description={t('landing.howItWorks.step1.description')}
            />
            <StepCard 
              number="02"
              title={t('landing.howItWorks.step2.title')}
              description={t('landing.howItWorks.step2.description')}
            />
            <StepCard 
              number="03"
              title={t('landing.howItWorks.step3.title')}
              description={t('landing.howItWorks.step3.description')}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6">
            <PricingCard 
              name={t('landing.pricing.freeTrial.name')}
              price={t('landing.pricing.freeTrial.price')}
              period={t('landing.pricing.freeTrial.period')}
              features={t('landing.pricing.freeTrial.features', { returnObjects: true }) as string[]}
              ctaText={t('landing.pricing.freeTrial.cta')}
              onClick={() => navigate('/auth')}
            />
            <PricingCard 
              name={t('landing.pricing.beginner.name')}
              price={t('landing.pricing.beginner.price')}
              period={t('landing.pricing.beginner.period')}
              features={t('landing.pricing.beginner.features', { returnObjects: true }) as string[]}
              ctaText={t('landing.pricing.beginner.cta')}
              onClick={() => navigate('/auth')}
            />
            <PricingCard 
              name={t('landing.pricing.pro.name')}
              price={t('landing.pricing.pro.price')}
              period={t('landing.pricing.pro.period')}
              features={t('landing.pricing.pro.features', { returnObjects: true }) as string[]}
              ctaText={t('landing.pricing.pro.cta')}
              onClick={() => navigate('/auth')}
              highlighted
              badge={t('landing.pricing.pro.badge')}
            />
            <PricingCard 
              name={t('landing.pricing.fluencyPlus.name')}
              price={t('landing.pricing.fluencyPlus.price')}
              period={t('landing.pricing.fluencyPlus.period')}
              features={t('landing.pricing.fluencyPlus.features', { returnObjects: true }) as string[]}
              ctaText={t('landing.pricing.fluencyPlus.cta')}
              onClick={() => navigate('/auth')}
              badge={t('landing.pricing.fluencyPlus.badge')}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="gradient-primary rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              {t('landing.cta.description')}
            </p>
            <Button 
              size="xl" 
              variant="white"
              onClick={() => navigate('/auth')}
            >
              {t('landing.cta.button')}
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
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.terms')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.privacy')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.contact')}</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright')}
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
  badge?: string;
}> = ({ name, price, period, features, ctaText, onClick, highlighted, badge }) => (
  <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-fluency-md ${
    highlighted 
      ? 'gradient-primary border-transparent scale-[1.02] shadow-fluency-lg' 
      : 'bg-card border-border hover:border-primary/30'
  }`}>
    {badge && (
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
        highlighted ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'
      }`}>
        {badge}
      </div>
    )}
    <div className="mb-4">
      <h3 className={`font-semibold text-lg mb-3 ${highlighted ? 'text-white' : 'text-foreground'}`}>
        {name}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${highlighted ? 'text-white' : 'text-foreground'}`}>
          {price}
        </span>
        <span className={`text-sm ${highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
          {period}
        </span>
      </div>
    </div>
    <ul className="space-y-3 mb-6 flex-1">
      {features.map((feature, i) => (
        <li key={i} className={`flex items-start gap-2 text-sm ${
          highlighted ? 'text-white/90' : 'text-muted-foreground'
        }`}>
          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? 'text-white' : 'text-success'}`} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button 
      onClick={onClick}
      className={`w-full font-medium ${highlighted ? '!bg-white !text-primary hover:!bg-white/90 shadow-md' : ''}`}
      variant={highlighted ? 'secondary' : 'outline'}
    >
      {ctaText}
    </Button>
  </div>
);

type MessageType = { role: 'ai' | 'user'; text: string };

const MethodCard: React.FC<{ 
  emoji: string;
  scenario: string;
  subtitle: string;
  badge: string;
  messages: MessageType[];
  objective: string;
  method: string;
  feedback: string;
  t: (key: string) => string;
}> = ({ emoji, scenario, subtitle, badge, messages, objective, method, feedback, t }) => (
  <div className="relative bg-card rounded-2xl border border-border p-6 shadow-fluency-md hover:shadow-fluency-lg transition-all duration-300">
    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {badge}
    </div>
    
    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
        <span className="text-lg">{emoji}</span>
      </div>
      <div>
        <p className="font-semibold text-foreground">{t('landing.chat.scenario')}: {scenario}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    
    <div className="space-y-3 mb-4">
      {messages.map((msg, i) => (
        msg.role === 'ai' ? (
          <div key={i} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">🤖</div>
            <div className="flex-1 bg-muted rounded-xl rounded-tl-sm p-2.5">
              <p className="text-sm text-foreground">{msg.text}</p>
            </div>
          </div>
        ) : (
          <div key={i} className="flex gap-2 justify-end">
            <div className="flex-1 max-w-[85%] gradient-primary rounded-xl rounded-tr-sm p-2.5">
              <p className="text-sm text-white">{msg.text}</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">👤</div>
          </div>
        )
      ))}
    </div>

    <div className="pt-4 border-t border-border space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t('landing.method.objective')}:</span>
        <span className="text-foreground font-medium">{objective}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t('landing.method.methodLabel')}:</span>
        <span className="text-foreground font-medium">{method}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t('landing.method.feedback')}:</span>
        <span className="text-foreground font-medium">{feedback}</span>
      </div>
    </div>
  </div>
);

export default Landing;
