import { Link, useMatches } from "@tanstack/react-router";
import {
  BookOpen,
  ShoppingCart,
  Import,
  Settings,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { authClient } from "#/lib/auth-client";
import { appStore } from "#/lib/store";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Recipes", icon: BookOpen },
  { to: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
  { to: "/import", label: "Import", icon: Import },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export default function Sidebar() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "/";
  const { data: session, isPending } = authClient.useSession();
  const chatOpen = useStore(appStore, (s) => s.chatOpen);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-1 bg-primary-4/30 lg:flex lg:flex-col">
      {/* Logo / brand */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-1 text-sm font-bold text-white">
          R
        </div>
        <span className="text-lg font-bold text-secondary-1">Recipes</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? currentPath === "/" || currentPath.startsWith("/recipes")
              : currentPath.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-1 text-white"
                  : "text-secondary-2 hover:bg-primary-4 hover:text-secondary-1"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* AI Chat toggle */}
        <button
          onClick={() =>
            appStore.setState((s) => ({ ...s, chatOpen: !s.chatOpen }))
          }
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            chatOpen
              ? "bg-primary-1 text-white"
              : "text-secondary-2 hover:bg-primary-4 hover:text-secondary-1"
          }`}
        >
          <MessageCircle size={20} strokeWidth={chatOpen ? 2.2 : 1.8} />
          <span>AI Chat</span>
        </button>
      </nav>

      {/* Bottom: theme + user */}
      <div className="border-t border-border-1 p-3">
        <div className="mb-2 flex justify-end">
          <ThemeToggle />
        </div>
        {isPending ? (
          <div className="h-12 animate-pulse rounded-xl bg-primary-4" />
        ) : session?.user ? (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-3 text-sm font-bold text-white">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-secondary-1">
                {session.user.name}
              </p>
            </div>
            <button
              onClick={() => void authClient.signOut()}
              className="text-xs text-secondary-3 hover:text-secondary-1"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/auth/signin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary-2 transition-colors hover:bg-primary-4 hover:text-secondary-1"
          >
            <LogIn size={20} strokeWidth={1.8} />
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
