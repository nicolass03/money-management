import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SessionProvider } from "@/lib/auth/session-store";

function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
