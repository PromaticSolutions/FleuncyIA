import React from 'react';
import { MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  trialEndsAt: Date | null;
  isExpired: boolean;
  hasUnlimitedCredits: boolean;
  className?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  totalCredits,
  usedCredits,
  remainingCredits,
  trialEndsAt,
  isExpired,
  hasUnlimitedCredits,
  className,
}) => {
  if (hasUnlimitedCredits) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm", className)}>
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">Mensagens ilimitadas</span>
      </div>
    );
  }

  const percentage = Math.round((remainingCredits / totalCredits) * 100);
  const isLow = remainingCredits <= 10;
  const isCritical = remainingCredits <= 3;

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
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
        isCritical ? "bg-destructive/10 text-destructive" : 
        isLow ? "bg-warning/10 text-warning" : 
        "bg-muted text-foreground"
      )}>
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">{remainingCredits}/{totalCredits} mensagens</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mx-1">
        <div 
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            isCritical ? "bg-destructive" : 
            isLow ? "bg-warning" : 
            "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {trialEndsAt && daysRemaining > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
          <Clock className="w-3 h-3" />
          <span>{daysRemaining} dias restantes no trial</span>
        </div>
      )}
    </div>
  );
};
