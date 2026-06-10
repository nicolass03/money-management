"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 overflow-auto p-6 md:p-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
