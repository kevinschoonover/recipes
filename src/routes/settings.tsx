import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  getKitchenStaples,
  addStaple,
  removeStaple,
  seedDefaultStaples,
} from "#/server/functions/kitchen-staples";
import { authClient } from "#/lib/auth-client";
import ThemeToggle from "#/components/ThemeToggle";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [newStaple, setNewStaple] = useState("");

  const { data: staples } = useQuery({
    queryKey: ["kitchen-staples"],
    queryFn: () => getKitchenStaples(),
    enabled: !!session?.user,
  });

  const addStapleMutation = useMutation({
    mutationFn: (name: string) => addStaple({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-staples"] });
      setNewStaple("");
    },
  });

  const removeStapleMutation = useMutation({
    mutationFn: (id: number) => removeStaple({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["kitchen-staples"] }),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDefaultStaples(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["kitchen-staples"] }),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="animate-rise-in">
        <h1 className="text-2xl font-bold text-secondary-1">Settings</h1>
        <p className="mt-2 text-secondary-2">
          Manage your kitchen staples, account, and preferences.
        </p>

        <div className="mt-8 space-y-6">
          {/* Theme */}
          <section>
            <h2 className="text-lg font-semibold text-secondary-1">
              Appearance
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-border-1 p-4">
              <span className="text-secondary-1">Theme</span>
              <ThemeToggle />
            </div>
          </section>

          {/* Kitchen Staples */}
          <section>
            <h2 className="text-lg font-semibold text-secondary-1">
              Kitchen Staples
            </h2>
            <p className="mt-1 text-sm text-secondary-2">
              Items you always have on hand will be excluded from shopping lists.
            </p>

            {session?.user ? (
              <>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newStaple}
                    onChange={(e) => setNewStaple(e.target.value)}
                    placeholder="e.g., salt, olive oil, butter…"
                    className="flex-1 rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newStaple.trim()) {
                        addStapleMutation.mutate(newStaple.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newStaple.trim()) {
                        addStapleMutation.mutate(newStaple.trim());
                      }
                    }}
                    disabled={!newStaple.trim()}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-1 text-white disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="mt-3 rounded-xl border border-primary-1 px-4 py-2.5 text-sm font-medium text-primary-1 active:bg-primary-4 disabled:opacity-50"
                >
                  {seedMutation.isPending
                    ? "Importing…"
                    : "Import Basic Staples"}
                </button>

                {staples && staples.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {staples.map((staple) => (
                      <span
                        key={staple.id}
                        className="flex items-center gap-1 rounded-full bg-primary-4 px-3 py-1.5 text-sm text-primary-1"
                      >
                        {staple.name}
                        <button
                          onClick={() => removeStapleMutation.mutate(staple.id)}
                          className="ml-0.5 rounded-full p-0.5 active:bg-primary-3"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-secondary-3">
                    No staples added yet
                  </p>
                )}
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-border-1 p-6 text-center text-sm text-secondary-3">
                Sign in to manage staples
              </div>
            )}
          </section>

          {/* Account */}
          <section>
            <h2 className="text-lg font-semibold text-secondary-1">Account</h2>
            <div className="mt-4 rounded-2xl border border-border-1 p-6">
              {session?.user ? (
                <div className="flex items-center gap-4">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-3 text-lg font-bold text-white">
                      {session.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-secondary-1">
                      {session.user.name}
                    </p>
                    <p className="text-sm text-secondary-2">
                      {session.user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => void authClient.signOut()}
                    className="rounded-xl border border-border-1 px-4 py-2 text-sm font-medium text-secondary-2 transition-colors active:border-error-1 active:text-error-1"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-secondary-3">
                    Sign in to sync your recipes across devices
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
