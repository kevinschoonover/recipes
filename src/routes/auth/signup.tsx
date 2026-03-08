import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/auth/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message ?? "Sign up failed");
      setLoading(false);
    } else {
      navigate({ to: "/" });
    }
  }

  async function handleDiscord() {
    await authClient.signIn.social({ provider: "discord" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-1 text-lg font-bold text-white">
            R
          </div>
          <h1 className="mt-4 text-2xl font-bold text-secondary-1">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-secondary-2">
            Start organizing your recipe collection.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl bg-error-2 px-4 py-3 text-sm text-error-1">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-1">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
                placeholder="Your name"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-1">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-1">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
                placeholder="8+ characters"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-2 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-1" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-1 px-2 text-secondary-3">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleDiscord}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#4752C4]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Discord
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-secondary-2">
          Already have an account?{" "}
          <Link
            to="/auth/signin"
            className="font-medium text-primary-1 hover:text-primary-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
