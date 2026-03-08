import { useState, useRef, useCallback } from "react";
import { Upload, Link, X, Loader2 } from "lucide-react";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">(value ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/images/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            (data as { error?: string } | null)?.error ?? "Upload failed",
          );
        }
        const { url } = (await res.json()) as { url: string };
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0] as File | undefined;
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  if (mode === "url") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-secondary-1">
            Image URL
          </label>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="flex items-center gap-1 text-xs text-primary-1"
          >
            <Upload size={12} /> Upload instead
          </button>
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
        {value && (
          <div className="relative mt-2 inline-block">
            <img
              src={value}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-secondary-1">
          Image
        </label>
        <button
          type="button"
          onClick={() => setMode("url")}
          className="flex items-center gap-1 text-xs text-primary-1"
        >
          <Link size={12} /> Use URL instead
        </button>
      </div>

      {value ? (
        <div className="relative mt-1 inline-block">
          <img
            src={value}
            alt="Recipe"
            className="h-32 w-32 rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-error-1 text-white shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-primary-1 bg-primary-4/50"
              : "border-border-1 bg-surface-2 hover:border-primary-1/50"
          }`}
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-primary-1" />
          ) : (
            <>
              <Upload size={24} className="text-secondary-3" />
              <p className="mt-2 text-sm text-secondary-3">
                Drop an image or click to browse
              </p>
              <p className="text-xs text-secondary-3">
                JPEG, PNG, WebP, GIF up to 10MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {error && <p className="mt-1 text-sm text-error-1">{error}</p>}
    </div>
  );
}
