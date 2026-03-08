import { Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";

export default function MobileHeader() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-1 bg-surface-1/95 px-4 backdrop-blur-sm lg:hidden">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-1 text-xs font-bold text-white">
          R
        </div>
        <span className="text-base font-bold text-secondary-1">Recipes</span>
      </Link>

      {isPending ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary-4" />
      ) : session?.user ? (
        <Link to="/settings" className="flex items-center">
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
        </Link>
      ) : (
        <Link
          to="/auth/signin"
          className="text-sm font-medium text-primary-1"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
