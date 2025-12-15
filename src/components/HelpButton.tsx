import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { SupportChat } from './SupportChat';

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full gradient-primary shadow-fluency-lg flex items-center justify-center text-white hover:scale-105 transition-transform md:bottom-6 md:right-6"
        aria-label="Preciso de Ajuda"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
      
      <SupportChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
