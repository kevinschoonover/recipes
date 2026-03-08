import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "#/hooks/form-context";

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>;
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === "string" ? error : error.message}
          className="mt-1 text-sm font-medium text-error-1"
        >
          {typeof error === "string" ? error : error.message}
        </div>
      ))}
    </>
  );
}

export function TextField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
        <input
          type={type}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
      </label>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function TextArea({
  label,
  placeholder,
  rows = 3,
}: {
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
        <textarea
          value={field.state.value}
          placeholder={placeholder}
          rows={rows}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
      </label>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function NumberField({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  const field = useFieldContext<number | undefined>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
        <input
          type="number"
          inputMode="decimal"
          value={field.state.value ?? ""}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) =>
            field.handleChange(
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
      </label>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function Select({
  label,
  values,
}: {
  label: string;
  values: Array<{ label: string; value: string }>;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
      </label>
      <select
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
      >
        {values.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-2 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : label}
        </button>
      )}
    </form.Subscribe>
  );
}

export function ImageUpload({ label }: { label: string }) {
  const field = useFieldContext<string>();

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
      </label>
      {field.state.value && (
        <img
          src={field.state.value}
          alt="Preview"
          className="mt-2 h-48 w-full rounded-xl object-cover"
        />
      )}
      <input
        type="url"
        value={field.state.value}
        placeholder="Image URL"
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className="mt-2 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
      />
    </div>
  );
}
