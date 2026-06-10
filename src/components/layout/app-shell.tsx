"use client";

import { motion } from "framer-motion";
import { PrivacyModeProvider } from "./privacy-mode";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <PrivacyModeProvider>
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8"
      >
        {children}
      </motion.main>
    </div>
    </PrivacyModeProvider>
  );
}
