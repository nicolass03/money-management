"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavItem } from "./nav-item";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/expenses", label: "~/expenses" },
  { href: "/income", label: "~/income" },
  { href: "/projections", label: "~/projections" },
  { href: "/savings", label: "~/savings" },
  { href: "/settings", label: "~/settings" },
];

export function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface"
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

      <div className="border-t border-border p-4">
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
