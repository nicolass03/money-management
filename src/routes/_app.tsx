import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { needsPasswordSetup } from "@/lib/auth/auth-flow";
import { requireAuth } from "@/lib/auth/route-guards";
import { useSession } from "@/lib/auth/session-store";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    await requireAuth();
  },
  pendingComponent: AuthPending,
  component: AppLayout,
});

function AuthPending() {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LoadingIndicator label={t("authenticating")} />
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const { canAccessApp, isBootstrapping, session } = useSession();

  useEffect(() => {
    if (isBootstrapping) return;

    if (!session?.access_token) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (!canAccessApp || needsPasswordSetup(session)) {
      void navigate({ to: "/set-password", replace: true });
    }
  }, [isBootstrapping, session, canAccessApp, navigate]);

  if (isBootstrapping || !canAccessApp) {
    return <AuthPending />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
