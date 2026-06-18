import { createRootRoute, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SessionProvider } from "@/lib/auth/session-store";
import i18n from "@/lib/i18n";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { ThemeManagerProvider } from "@/lib/theme/theme-manager";

function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SessionProvider>
          <ThemeManagerProvider>
            <LanguageProvider>
              <Outlet />
            </LanguageProvider>
          </ThemeManagerProvider>
        </SessionProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
