import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
}

export function NavItem({ href, label }: NavItemProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link to={href} className="block">
      <span
        className={cn(
          "block border px-4 py-3 font-mono text-sm transition-colors",
          isActive
            ? "border-accent/50 bg-accent/10 text-accent-glow"
            : "border-transparent text-muted hover:text-text",
        )}
      >
        {isActive ? "> " : "  "}
        {label}
      </span>
    </Link>
  );
}
