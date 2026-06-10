"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("$ auth failed: invalid credentials");
        return;
      }

      router.push("/expenses");
      router.refresh();
    } catch {
      setError("$ auth failed: connection error");
    } finally {
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
            <span className="text-accent">user@local</span>
            <span className="text-muted">:</span>
            <span className="text-accent-glow">~</span>
            <span className="text-muted">$</span> auth --login
            <span className="animate-blink text-accent">_</span>
          </p>
        </div>

        <Card className="animate-glow-pulse">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-mono text-xs text-muted"
              >
                enter password:
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "authenticating..." : "authenticate"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
