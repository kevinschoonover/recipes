"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export function ImportRecipe() {
  const router = useRouter();
  const [url, setURL] = useState("");

  const importRecipe = api.recipe.import.useMutation({
    onSuccess: () => {
      router.refresh();
      setURL("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        importRecipe.mutate({ url });
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="text"
        placeholder="URL"
        value={url}
        onChange={(e) => setURL(e.target.value)}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={importRecipe.isLoading}
      >
        {importRecipe.isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
