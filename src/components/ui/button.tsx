import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Variantes y tamaños definidos en DESIGN.md §6
const VARIANTS = {
  primary:
    "bg-hype text-ink-950 font-semibold shadow-inset-top hover:brightness-110 active:brightness-95",
  secondary:
    "bg-ink-700 text-cream border border-white/[0.08] hover:border-white/20 hover:bg-ink-600",
  ghost: "text-sand hover:text-cream hover:bg-white/[0.06]",
  danger: "bg-down-soft text-down-500 border border-down-500/30 hover:bg-down-500/20",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-[180ms] ease-out",
        "hover:-translate-y-px active:translate-y-0",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
