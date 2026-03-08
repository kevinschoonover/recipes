import { authClient } from "#/lib/auth-client";
import { Link } from "@tanstack/react-router";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-primary-4" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-3 text-sm font-bold text-white">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <button
          onClick={() => void authClient.signOut()}
          className="rounded-xl border border-border-1 px-3 py-1.5 text-xs font-medium text-secondary-2 transition-colors hover:border-error-1 hover:text-error-1"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/auth/signin"
      className="rounded-xl border border-border-1 px-3 py-1.5 text-sm font-medium text-secondary-2 transition-colors hover:bg-primary-4 hover:text-secondary-1"
    >
      Sign in
    </Link>
  );
}
