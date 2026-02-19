import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

interface PushNotificationModalProps {
  open: boolean;
  onActivate: () => Promise<void>;
  onDismiss: () => void;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  open,
  onActivate,
  onDismiss,
}) => {
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await onActivate();
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Ative os lembretes diários
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Não perca sua sequência! Receba lembretes para praticar todos os dias e acompanhe suas conquistas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            size="lg"
            className="w-full"
          >
            <Bell className="w-5 h-5 mr-2" />
            {isActivating ? 'Ativando...' : 'Ativar lembretes'}
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            disabled={isActivating}
            size="lg"
            className="w-full text-muted-foreground"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
