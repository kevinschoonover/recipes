import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";
import PostHogProvider from "#/integrations/posthog/provider";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools";
import BottomNav from "#/components/BottomNav";
import Sidebar from "#/components/Sidebar";
import MobileHeader from "#/components/MobileHeader";
import AIAssistant from "#/components/AIAssistant";
import { ToastProvider } from "#/components/Toast";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

export interface RouterContext {
  queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Recipes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="overflow-x-hidden bg-surface-1 font-sans text-secondary-1 antialiased [overflow-wrap:anywhere]">
        <PostHogProvider>
          <TanStackQueryProvider>
            <ToastProvider>
            {children}
            <TanStackDevtools
              config={{ position: "bottom-right" }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
                {
                  name: "TanStack AI",
                  render: <AiDevtoolsPanel />,
                },
              ]}
            />
          </ToastProvider>
          </TanStackQueryProvider>
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AIAssistant />
    </div>
  );
}
