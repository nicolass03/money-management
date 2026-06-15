import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  clearRememberedEmail,
  getRememberedEmail,
  setRememberedEmail,
} from "@/lib/auth/remember-email";
import { redirectIfAuthenticated } from "@/lib/auth/route-guards";
import { useSession } from "@/lib/auth/session-store";
import type { AuthErrorCode } from "@/lib/auth/session-store";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

type LoginSearch = {
  error?: "callback_failed" | "session_invalid";
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    if (search.error === "session_invalid") {
      return { error: "session_invalid" };
    }
    if (search.error === "callback_failed") {
      return { error: "callback_failed" };
    }
    return {};
  },
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  component: LoginPage,
});

function authErrorMessage(
  t: (key: string) => string,
  code: AuthErrorCode | "callback_failed" | "session_invalid",
): string {
  switch (code) {
    case "invalid_credentials":
      return t("auth:authFailed");
    case "email_not_confirmed":
      return t("auth:emailNotConfirmed");
    case "rate_limited":
      return t("auth:rateLimited");
    case "network":
      return t("auth:networkError");
    case "callback_failed":
      return t("auth:callbackFailed");
    case "session_invalid":
      return t("auth:sessionInvalid");
    default:
      return t("auth:authFailed");
  }
}

function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { error: callbackError } = useSearch({ from: "/login" });
  const { signIn, isBootstrapping, resetPasswordForEmail } = useSession();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (callbackError) {
      setError(authErrorMessage(t, callbackError));
    }
  }, [callbackError, t]);

  useEffect(() => {
    const remembered = getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
      passwordRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(authErrorMessage(t, result.error));
      setLoading(false);
      return;
    }

    if (rememberMe) {
      setRememberedEmail(email);
    } else {
      clearRememberedEmail();
    }

    void navigate({ to: "/expenses" });
  }

  async function handleForgotPassword() {
    setError("");
    setInfo("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth:enterEmail"));
      emailRef.current?.focus();
      return;
    }

    setResetLoading(true);
    await resetPasswordForEmail(trimmedEmail);
    setResetLoading(false);
    setInfo(t("auth:resetPasswordSent"));
  }

  if (isBootstrapping) {
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
        <div className="mb-6 flex items-center justify-between gap-4 font-mono">
          <div>
            <p className="text-xs text-muted">incm-mgmt v0.1.0</p>
            <p className="mt-2 text-sm text-text">
              <span className="text-accent">guest</span>
              <span className="text-muted">:</span>
              <span className="text-accent-glow">~</span>
              <span className="text-muted">$</span> auth --login
              <span className="animate-blink text-accent">_</span>
            </p>
          </div>
        </div>

        <Card className="relative animate-glow-pulse">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center border border-accent/20 bg-surface/90">
              <LoadingIndicator
                variant="inline"
                label={t("common:authenticating")}
                className="text-sm text-text"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-mono text-xs text-muted"
              >
                {t("auth:enterEmail")}
              </label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="block font-mono text-xs text-muted"
                >
                  {t("auth:enterPassword")}
                </label>
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={resetLoading || loading}
                  className="font-mono text-xs text-accent hover:text-accent-glow disabled:opacity-50"
                >
                  {resetLoading ? t("auth:authenticating") : t("auth:forgotPassword")}
                </button>
              </div>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-3.5 accent-accent"
              />
              {t("auth:rememberMe")}
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-danger"
              >
                {error}
              </motion.p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-accent"
              >
                {info}
              </motion.p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? t("auth:authenticating") : t("auth:authenticate")}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
