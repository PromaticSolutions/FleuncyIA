import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-6 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            {isPt ? 'Política de Privacidade' : 'Privacy Policy'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 prose prose-sm dark:prose-invert">
        {isPt ? <PrivacyContentPt /> : <PrivacyContentEn />}
      </main>
    </div>
  );
};

const PrivacyContentPt = () => (
  <>
    <p className="text-muted-foreground text-sm">Última atualização: 20 de fevereiro de 2026</p>

    <h2 className="text-lg font-semibold text-foreground mt-6">1. Informações que coletamos</h2>
    <p className="text-muted-foreground">Ao utilizar o Fluency IA, coletamos as seguintes informações:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Nome, email e dados de cadastro fornecidos durante o registro.</li>
      <li>Dados de uso, como conversas realizadas, pontuações e progresso.</li>
      <li>Dados técnicos como tipo de dispositivo, navegador e endereço IP.</li>
      <li>Gravações de áudio enviadas voluntariamente durante sessões de prática.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">2. Como usamos suas informações</h2>
    <p className="text-muted-foreground">Utilizamos suas informações para:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Fornecer, manter e melhorar nossos serviços.</li>
      <li>Personalizar sua experiência de aprendizado.</li>
      <li>Enviar notificações e lembretes de prática (quando autorizados).</li>
      <li>Gerar análises e estatísticas agregadas (não identificáveis).</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">3. Compartilhamento de dados</h2>
    <p className="text-muted-foreground">
      Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:
    </p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Provedores de serviço essenciais ao funcionamento da plataforma (hospedagem, processamento de pagamento).</li>
      <li>Quando exigido por lei ou ordem judicial.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">4. Armazenamento e segurança</h2>
    <p className="text-muted-foreground">
      Seus dados são armazenados em servidores seguros com criptografia. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">5. Seus direitos (LGPD)</h2>
    <p className="text-muted-foreground">De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Acessar seus dados pessoais.</li>
      <li>Corrigir dados incompletos ou desatualizados.</li>
      <li>Solicitar a exclusão de seus dados.</li>
      <li>Revogar consentimento a qualquer momento.</li>
      <li>Solicitar a portabilidade dos seus dados.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">6. Cookies e tecnologias semelhantes</h2>
    <p className="text-muted-foreground">
      Utilizamos cookies e armazenamento local para manter sua sessão, preferências e melhorar a experiência de uso. Você pode gerenciar cookies nas configurações do seu navegador.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">7. Contato</h2>
    <p className="text-muted-foreground">
      Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato pelo WhatsApp: +55 11 93447-6935.
    </p>
  </>
);

const PrivacyContentEn = () => (
  <>
    <p className="text-muted-foreground text-sm">Last updated: February 20, 2026</p>

    <h2 className="text-lg font-semibold text-foreground mt-6">1. Information we collect</h2>
    <p className="text-muted-foreground">When using Fluency AI, we collect the following information:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Name, email and registration data provided during sign-up.</li>
      <li>Usage data such as conversations, scores and progress.</li>
      <li>Technical data such as device type, browser and IP address.</li>
      <li>Audio recordings voluntarily submitted during practice sessions.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">2. How we use your information</h2>
    <p className="text-muted-foreground">We use your information to:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Provide, maintain and improve our services.</li>
      <li>Personalise your learning experience.</li>
      <li>Send notifications and practice reminders (when authorised).</li>
      <li>Generate aggregated, non-identifiable analytics and statistics.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">3. Data sharing</h2>
    <p className="text-muted-foreground">
      We do not sell, rent or share your personal data with third parties, except:
    </p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Essential service providers for platform operations (hosting, payment processing).</li>
      <li>When required by law or court order.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">4. Storage and security</h2>
    <p className="text-muted-foreground">
      Your data is stored on secure, encrypted servers. We adopt technical and organisational measures to protect your information against unauthorised access, loss or destruction.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">5. Your rights (LGPD)</h2>
    <p className="text-muted-foreground">Under the Brazilian General Data Protection Law (LGPD), you have the right to:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Access your personal data.</li>
      <li>Correct incomplete or outdated data.</li>
      <li>Request deletion of your data.</li>
      <li>Revoke consent at any time.</li>
      <li>Request data portability.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">6. Cookies and similar technologies</h2>
    <p className="text-muted-foreground">
      We use cookies and local storage to maintain your session, preferences and improve the user experience. You can manage cookies in your browser settings.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">7. Contact</h2>
    <p className="text-muted-foreground">
      For questions about this policy or to exercise your rights, contact us via WhatsApp: +55 11 93447-6935.
    </p>
  </>
);

export default PrivacyPolicy;
