import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { NavItem } from "./nav-item";
import { usePrivacyMode } from "./privacy-mode";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/expenses", key: "navExpenses" },
  { href: "/budgets", key: "navBudgets" },
  { href: "/income", key: "navIncome" },
  { href: "/projections", key: "navProjections" },
  { href: "/savings", key: "navSavings" },
  { href: "/settings", key: "navSettings" },
];

export function Sidebar() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { privacyMode, togglePrivacyMode } = usePrivacyMode();

  async function handleLogout() {
    await signOut();
    void navigate({ to: "/login" });
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="border-b border-border px-4 py-5">
        <p className="font-mono text-xs text-muted">incm-mgmt v0.1</p>
        <h1 className="mt-1 font-mono text-sm text-accent-glow">
          $ ./dashboard
        </h1>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={t(item.key)} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-4">
        <ThemeSwitcher className="w-full" />
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
          {privacyMode ? t("privacyOn") : t("privacyOff")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          {t("logout")}
        </Button>
      </div>
    </motion.aside>
  );
}
