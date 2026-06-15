import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  establishAuthSessionFromUrl,
  getAuthCallbackType,
} from "@/lib/auth/auth-flow";
import { setPasswordFlow } from "@/lib/auth/password-flow";

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
      const result = await establishAuthSessionFromUrl();

      if (result.status === "invalid") {
        void navigate({
          to: "/login",
          search: {
            error:
              result.reason === "user_not_found"
                ? "session_invalid"
                : "callback_failed",
          },
        });
        return;
      }

      if (result.status === "no_session") {
        void navigate({
          to: "/login",
          search: { error: "callback_failed" },
        });
        return;
      }

      if (result.passwordSetup) {
        if (callbackType === "recovery") {
          setPasswordFlow("recovery");
        }
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
