"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  clearRememberedEmail,
  getRememberedEmail,
  setRememberedEmail,
} from "@/lib/auth/remember-email";

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("$ auth failed: invalid credentials");
        setLoading(false);
        return;
      }

      if (rememberMe) {
        setRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }

      router.push("/expenses");
      router.refresh();
    } catch {
      setError("$ auth failed: connection error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 font-mono">
          <p className="text-xs text-muted">money-mgmt v0.1.0</p>
          <p className="mt-2 text-sm text-text">
            <span className="text-accent">guest</span>
            <span className="text-muted">:</span>
            <span className="text-accent-glow">~</span>
            <span className="text-muted">$</span> auth --login
            <span className="animate-blink text-accent">_</span>
          </p>
        </div>

        <Card className="relative animate-glow-pulse">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center border border-accent/20 bg-surface/90">
              <LoadingIndicator
                variant="inline"
                label="authenticating"
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
                enter email:
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
              <label
                htmlFor="password"
                className="mb-2 block font-mono text-xs text-muted"
              >
                enter password:
              </label>
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
              remember me
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

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? "authenticating..." : "authenticate"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
