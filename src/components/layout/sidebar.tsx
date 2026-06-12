"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavItem } from "./nav-item";
import { usePrivacyMode } from "./privacy-mode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authFetchHeaders } from "@/lib/auth/csrf";

const navItems = [
  { href: "/expenses", label: "~/expenses" },
  { href: "/budgets", label: "~/budgets" },
  { href: "/income", label: "~/income" },
  { href: "/projections", label: "~/projections" },
  { href: "/savings", label: "~/savings" },
  { href: "/settings", label: "~/settings" },
];

export function Sidebar() {
  const router = useRouter();
  const { privacyMode, togglePrivacyMode } = usePrivacyMode();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: authFetchHeaders,
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="border-b border-border px-4 py-5">
        <p className="font-mono text-xs text-muted">money-mgmt v0.1</p>
        <h1 className="mt-1 font-mono text-sm text-accent-glow">
          $ ./dashboard
        </h1>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full",
            privacyMode && "border-accent/50 text-accent-glow",
          )}
          onClick={togglePrivacyMode}
          aria-pressed={privacyMode}
        >
          {privacyMode ? "privacy: on" : "privacy: off"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          logout
        </Button>
      </div>
    </motion.aside>
  );
}
