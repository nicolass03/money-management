import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  clearAuthParamsFromUrl,
  getAuthCallbackType,
  isPasswordSetupFlow,
} from "@/lib/auth/auth-flow";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      const callbackType = getAuthCallbackType();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError = params.get("error_description") ?? params.get("error");

      if (authError) {
        clearAuthParamsFromUrl();
        void navigate({
          to: "/login",
          search: { error: "callback_failed" },
        });
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          clearAuthParamsFromUrl();
          void navigate({
            to: "/login",
            search: { error: "callback_failed" },
          });
          return;
        }
      }

      clearAuthParamsFromUrl();

      if (isPasswordSetupFlow(callbackType)) {
        void navigate({ to: "/set-password" });
        return;
      }

      void navigate({ to: "/expenses" });
    }

    void handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LoadingIndicator label={t("completingAuth")} />
    </div>
  );
}
