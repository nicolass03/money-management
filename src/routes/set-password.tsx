import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import {
  canSetPassword,
  establishAuthSessionFromUrl,
} from "@/lib/auth/auth-flow";
import { useSession } from "@/lib/auth/session-store";

export const Route = createFileRoute("/set-password")({
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { session, isBootstrapping, updatePassword } = useSession();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const establishing = useRef(false);

  useEffect(() => {
    if (isBootstrapping || establishing.current) return;
    establishing.current = true;

    async function prepareSession() {
      const result = await establishAuthSessionFromUrl();

      if (result.status === "invalid") {
        void navigate({
          to: "/login",
          replace: true,
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
        void navigate({ to: "/login", replace: true });
        return;
      }

      setSessionReady(true);
    }

    void prepareSession();
  }, [isBootstrapping, navigate]);

  useEffect(() => {
    if (!sessionReady || isBootstrapping) return;

    if (!session?.access_token) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (!canSetPassword(session)) {
      void navigate({ to: "/expenses", replace: true });
      return;
    }

    passwordRef.current?.focus();
  }, [sessionReady, isBootstrapping, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth:passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth:passwordMismatch"));
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    if (result.error) {
      if (result.error === "session_invalid") {
        void navigate({
          to: "/login",
          replace: true,
          search: { error: "session_invalid" },
        });
        return;
      }
      setError(
        result.error === "password_too_short"
          ? t("auth:passwordTooShort")
          : t("auth:setPasswordFailed"),
      );
      setLoading(false);
      return;
    }

    void navigate({ to: "/expenses" });
  }

  if (isBootstrapping || !sessionReady || !session?.access_token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingIndicator label={t("common:authenticating")} />
      </div>
    );
  }

  if (!canSetPassword(session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingIndicator label={t("common:authenticating")} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg p-4">
      <ThemeSwitcher className="absolute top-4 right-4" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 font-mono">
          <p className="text-xs text-muted">incm-mgmt v0.1.0</p>
          <p className="mt-2 text-sm text-text">
            <span className="text-accent">guest</span>
            <span className="text-muted">:</span>
            <span className="text-accent-glow">~</span>
            <span className="text-muted">$</span> auth --set-password
            <span className="animate-blink text-accent">_</span>
          </p>
        </div>

        <Card className="relative animate-glow-pulse">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center border border-accent/20 bg-surface/90">
              <LoadingIndicator
                variant="inline"
                label={t("auth:settingPassword")}
                className="text-sm text-text"
              />
            </div>
          )}

          <p className="mb-4 font-mono text-xs text-muted">
            {t("auth:setPasswordHint")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-mono text-xs text-muted"
              >
                {t("auth:newPassword")}
              </label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block font-mono text-xs text-muted"
              >
                {t("auth:confirmPassword")}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-danger"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? t("auth:settingPassword") : t("auth:setPassword")}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
