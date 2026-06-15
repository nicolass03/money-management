import { createRootRoute, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SessionProvider } from "@/lib/auth/session-store";
import i18n from "@/lib/i18n";
import { LanguageProvider } from "@/lib/i18n/language-provider";

function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SessionProvider>
          <LanguageProvider>
            <Outlet />
          </LanguageProvider>
        </SessionProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
