import React from 'react';
import { MessageSquare, Clock, AlertTriangle, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  totalAudioCredits?: number;
  usedAudioCredits?: number;
  remainingAudioCredits?: number;
  trialEndsAt: Date | null;
  isExpired: boolean;
  hasUnlimitedCredits: boolean;
  className?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  totalCredits,
  usedCredits,
  remainingCredits,
  totalAudioCredits = 14,
  usedAudioCredits = 0,
  remainingAudioCredits = 14,
  trialEndsAt,
  isExpired,
  hasUnlimitedCredits,
  className,
}) => {
  if (hasUnlimitedCredits) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">Mensagens ilimitadas</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
          <Mic className="w-4 h-4" />
          <span className="font-medium">Áudios ilimitados</span>
        </div>
      </div>
    );
  }

  const percentage = Math.round((remainingCredits / totalCredits) * 100);
  const audioPercentage = Math.round((remainingAudioCredits / totalAudioCredits) * 100);
  const isLow = remainingCredits <= 10;
  const isCritical = remainingCredits <= 3;
  const isAudioLow = remainingAudioCredits <= 3;
  const isAudioCritical = remainingAudioCredits <= 1;

  const daysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isExpired) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm", className)}>
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">Trial expirado</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Messages counter */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          isCritical ? "bg-destructive/10 text-destructive" : 
          isLow ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
          "bg-muted text-foreground"
        )}>
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">{remainingCredits}/{totalCredits} msgs</span>
        </div>
        
        {/* Audio counter */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          isAudioCritical ? "bg-destructive/10 text-destructive" : 
          isAudioLow ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
          "bg-muted text-foreground"
        )}>
          <Mic className="w-4 h-4" />
          <span className="font-medium">{remainingAudioCredits}/{totalAudioCredits} áudios</span>
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isCritical ? "bg-destructive" : 
                isLow ? "bg-amber-500" : 
                "bg-primary"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isAudioCritical ? "bg-destructive" : 
                isAudioLow ? "bg-amber-500" : 
                "bg-blue-500"
              )}
              style={{ width: `${audioPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {trialEndsAt && daysRemaining > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{daysRemaining} dias restantes no trial</span>
        </div>
      )}
    </div>
  );
};