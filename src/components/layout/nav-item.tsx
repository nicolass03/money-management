"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
}

export function NavItem({ href, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className="relative block">
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 border border-accent/50 bg-accent/10"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span
        className={cn(
          "relative z-10 block px-4 py-3 font-mono text-sm transition-colors",
          isActive ? "text-accent-glow" : "text-muted hover:text-text",
        )}
      >
        {isActive ? "> " : "  "}
        {label}
      </span>
    </Link>
  );
}
