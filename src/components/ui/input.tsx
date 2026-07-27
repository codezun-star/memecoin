import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const FIELD_BASE =
  "w-full rounded-input border border-line bg-sunken px-4 text-ink placeholder:text-ink-faint " +
  "transition-colors duration-[180ms] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/25 " +
  "disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, "h-11", className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(FIELD_BASE, "min-h-24 resize-y py-3", className)} {...props} />
  );
});

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {/* El error se comunica con texto, no solo con el color del borde */}
      {error ? (
        <p className="text-sm text-down">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
