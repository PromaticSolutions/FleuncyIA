import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfUse: React.FC = () => {
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
            {isPt ? 'Termos de Uso' : 'Terms of Use'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 prose prose-sm dark:prose-invert">
        {isPt ? <TermsContentPt /> : <TermsContentEn />}
      </main>
    </div>
  );
};

const TermsContentPt = () => (
  <>
    <p className="text-muted-foreground text-sm">Última atualização: 20 de fevereiro de 2026</p>

    <h2 className="text-lg font-semibold text-foreground mt-6">1. Aceitação dos termos</h2>
    <p className="text-muted-foreground">
      Ao acessar e utilizar o Fluency IA, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize a plataforma.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">2. Descrição do serviço</h2>
    <p className="text-muted-foreground">
      O Fluency IA é uma plataforma de aprendizado de idiomas baseada em inteligência artificial que oferece prática conversacional em cenários simulados, com feedback e análises de desempenho.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">3. Cadastro e conta</h2>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Você deve fornecer informações verdadeiras e atualizadas durante o cadastro.</li>
      <li>Você é responsável pela segurança de sua conta e senha.</li>
      <li>Cada conta é pessoal e intransferível.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">4. Planos e pagamentos</h2>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>O período de trial gratuito tem duração de 7 dias.</li>
      <li>Assinaturas são renovadas automaticamente, salvo cancelamento prévio.</li>
      <li>Cancelamentos podem ser feitos a qualquer momento pelo painel de assinatura.</li>
      <li>Não há reembolso proporcional para períodos já pagos.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">5. Uso aceitável</h2>
    <p className="text-muted-foreground">Ao utilizar o Fluency IA, você concorda em não:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Usar a plataforma para fins ilegais ou não autorizados.</li>
      <li>Tentar acessar contas de outros usuários.</li>
      <li>Enviar conteúdo ofensivo, abusivo ou que viole direitos de terceiros.</li>
      <li>Realizar engenharia reversa ou tentar extrair o código-fonte.</li>
      <li>Automatizar interações com bots ou scripts sem autorização.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">6. Propriedade intelectual</h2>
    <p className="text-muted-foreground">
      Todo o conteúdo, design, código e materiais do Fluency IA são de propriedade exclusiva da plataforma e protegidos por leis de direitos autorais. O uso não autorizado é proibido.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">7. Limitação de responsabilidade</h2>
    <p className="text-muted-foreground">
      O Fluency IA é fornecido "como está". Não garantimos resultados específicos de aprendizado. Não nos responsabilizamos por interrupções temporárias do serviço ou perda de dados causada por fatores externos.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">8. Exclusão de conta</h2>
    <p className="text-muted-foreground">
      Você pode solicitar a exclusão da sua conta a qualquer momento nas configurações. Ao excluir sua conta, todos os dados serão permanentemente removidos.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">9. Alterações nos termos</h2>
    <p className="text-muted-foreground">
      Reservamo-nos o direito de alterar estes termos a qualquer momento. Alterações significativas serão comunicadas por email ou notificação no app.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">10. Contato</h2>
    <p className="text-muted-foreground">
      Para dúvidas sobre estes termos, entre em contato pelo WhatsApp: +55 11 93447-6935.
    </p>
  </>
);

const TermsContentEn = () => (
  <>
    <p className="text-muted-foreground text-sm">Last updated: February 20, 2026</p>

    <h2 className="text-lg font-semibold text-foreground mt-6">1. Acceptance of terms</h2>
    <p className="text-muted-foreground">
      By accessing and using Fluency AI, you agree to these Terms of Use. If you do not agree with any part of these terms, do not use the platform.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">2. Service description</h2>
    <p className="text-muted-foreground">
      Fluency AI is an AI-based language learning platform that offers conversational practice in simulated scenarios, with feedback and performance analytics.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">3. Registration and account</h2>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>You must provide truthful and up-to-date information during registration.</li>
      <li>You are responsible for the security of your account and password.</li>
      <li>Each account is personal and non-transferable.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">4. Plans and payments</h2>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>The free trial period lasts 7 days.</li>
      <li>Subscriptions are renewed automatically unless cancelled in advance.</li>
      <li>Cancellations can be made at any time through the subscription panel.</li>
      <li>There is no pro-rated refund for periods already paid.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">5. Acceptable use</h2>
    <p className="text-muted-foreground">By using Fluency AI, you agree not to:</p>
    <ul className="text-muted-foreground list-disc pl-5 space-y-1">
      <li>Use the platform for illegal or unauthorised purposes.</li>
      <li>Attempt to access other users' accounts.</li>
      <li>Submit offensive, abusive content or content that violates third-party rights.</li>
      <li>Reverse-engineer or attempt to extract the source code.</li>
      <li>Automate interactions with bots or scripts without authorisation.</li>
    </ul>

    <h2 className="text-lg font-semibold text-foreground mt-6">6. Intellectual property</h2>
    <p className="text-muted-foreground">
      All content, design, code and materials of Fluency AI are the exclusive property of the platform and protected by copyright laws. Unauthorised use is prohibited.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">7. Limitation of liability</h2>
    <p className="text-muted-foreground">
      Fluency AI is provided "as is". We do not guarantee specific learning outcomes. We are not responsible for temporary service interruptions or data loss caused by external factors.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">8. Account deletion</h2>
    <p className="text-muted-foreground">
      You may request the deletion of your account at any time in settings. Upon deletion, all data will be permanently removed.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">9. Changes to terms</h2>
    <p className="text-muted-foreground">
      We reserve the right to change these terms at any time. Significant changes will be communicated via email or in-app notification.
    </p>

    <h2 className="text-lg font-semibold text-foreground mt-6">10. Contact</h2>
    <p className="text-muted-foreground">
      For questions about these terms, contact us via WhatsApp: +55 11 93447-6935.
    </p>
  </>
);

export default TermsOfUse;
