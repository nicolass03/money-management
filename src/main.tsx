import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "@/lib/query/query-client";
import { msUntilLocalMidnight } from "@/lib/date/local-today";
import { queryKeys } from "@/lib/query/query-keys";
// Imported from JS (not via `@import` in globals.css): the Tailwind PostCSS pass inlines CSS
// imports without rebasing their `url()`s, so the font files were never bundled.
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@/globals.css";

const queryClient = createQueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// After a deploy, a tab opened on the previous build requests route chunks that no longer exist.
// Reload once to pick up the new index.html; the timestamp guard prevents a reload loop if the
// chunk is genuinely broken.
const PRELOAD_RELOAD_KEY = "incm-mgmt-preload-reload";
window.addEventListener("vite:preloadError", () => {
  const last = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

function App() {
  // Tab-focus refresh is TanStack Query's built-in `refetchOnWindowFocus` (stale queries only).
  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    function scheduleMidnightRollover() {
      midnightTimer = setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expensePeriodViews(),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.upcomingPayableAll(),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projectionsAll(),
        });
        scheduleMidnightRollover();
      }, msUntilLocalMidnight());
    }
    scheduleMidnightRollover();

    return () => {
      if (midnightTimer !== undefined) {
        clearTimeout(midnightTimer);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
