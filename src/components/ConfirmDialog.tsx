import { useEffect, useRef, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when opened
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="animate-rise-in relative w-full max-w-sm rounded-2xl border border-border-1 bg-surface-1 p-6 shadow-xl"
      >
        <div className="flex items-start gap-4">
          {isDanger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-2">
              <AlertTriangle size={20} className="text-error-1" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-secondary-1"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-secondary-2">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-border-1 px-4 text-sm font-semibold text-secondary-2 transition-colors hover:bg-surface-2 active:bg-surface-2"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex min-h-[40px] flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-colors ${
              isDanger
                ? "bg-error-1 hover:bg-error-1/90 active:bg-error-1/80"
                : "bg-primary-1 hover:bg-primary-2 active:bg-primary-2"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
