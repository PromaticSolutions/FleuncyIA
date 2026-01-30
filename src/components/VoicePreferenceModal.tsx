import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, MessageSquare } from 'lucide-react';

interface VoicePreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVoice: (enabled: boolean) => void;
}

export const VoicePreferenceModal: React.FC<VoicePreferenceModalProps> = ({
  open,
  onOpenChange,
  onSelectVoice,
}) => {
  const { t } = useTranslation();

  const handleSelect = (enabled: boolean) => {
    onSelectVoice(enabled);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            {t('chat.voiceModal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('chat.voiceModal.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => handleSelect(true)}
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('chat.voiceModal.enable')}</p>
              <p className="text-xs opacity-80">{t('chat.voiceModal.enableDesc')}</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSelect(false)}
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">{t('chat.voiceModal.textOnly')}</p>
              <p className="text-xs text-muted-foreground">{t('chat.voiceModal.textOnlyDesc')}</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
