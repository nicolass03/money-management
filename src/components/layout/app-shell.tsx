import { SubscriptionReminderBanner } from "@/components/expenses/subscription-reminder-banner";
import { PrivacyModeProvider } from "./privacy-mode";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <PrivacyModeProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar />
        <main className="animate-fade-up min-h-0 flex-1 overflow-y-auto p-6 [animation-delay:100ms] md:p-8">
          <SubscriptionReminderBanner />
          {children}
        </main>
      </div>
    </PrivacyModeProvider>
  );
}
