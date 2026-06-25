import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "@/lib/query/query-client";
import { msUntilLocalMidnight } from "@/lib/date/local-today";
import { queryKeys } from "@/lib/query/query-keys";
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

function App() {
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void queryClient.invalidateQueries();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    function scheduleMidnightRollover() {
      midnightTimer = setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expensePeriodViews(),
        });
        void queryClient.invalidateQueries({
          queryKey: ["upcomingPayable"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["projections"],
        });
        scheduleMidnightRollover();
      }, msUntilLocalMidnight());
    }
    scheduleMidnightRollover();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
