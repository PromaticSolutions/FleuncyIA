import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { InstagramBrowserModal } from './InstagramBrowserModal';
import { PushNotificationModal } from './PushNotificationModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useApp } from '@/contexts/AppContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { authUserId } = useApp();
  const { shouldShowModal, subscribe, dismiss: dismissPushModal } = usePushNotifications(authUserId || undefined);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
        <InstagramBrowserModal />
        <PushNotificationModal
          open={shouldShowModal}
          onActivate={async () => { await subscribe(); }}
          onDismiss={dismissPushModal}
        />
      </div>
    </SidebarProvider>
  );
}
