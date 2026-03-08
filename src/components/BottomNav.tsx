import { Link, useMatches } from "@tanstack/react-router";
import { BookOpen, ShoppingCart, Import, Settings } from "lucide-react";

const tabs = [
  { to: "/", label: "Recipes", icon: BookOpen },
  { to: "/shopping-list", label: "Shopping", icon: ShoppingCart },
  { to: "/import", label: "Import", icon: Import },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export default function BottomNav() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-1 bg-surface-1/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.to === "/"
              ? currentPath === "/" || currentPath.startsWith("/recipes")
              : currentPath.startsWith(tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-primary-1"
                  : "text-secondary-3 active:text-secondary-2"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
