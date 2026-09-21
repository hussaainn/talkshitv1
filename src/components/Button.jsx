import { clsx } from "clsx";

// Minimal shadcn-style button. Single restrained accent (lime) for primary actions.
export default function Button({
  children,
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl font-bold tracking-tight transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 min-h-[52px] text-base";
  const variants = {
    primary: "bg-lime-300 text-black hover:bg-lime-200 disabled:hover:bg-lime-300",
    secondary:
      "bg-zinc-900 text-zinc-50 border border-zinc-800 hover:bg-zinc-800",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 min-h-[44px]",
    danger: "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20",
  };
  const sizes = {
    lg: "px-6 py-4",
    md: "px-5 py-3 min-h-[48px] text-[15px]",
    sm: "px-4 py-2 min-h-[40px] text-sm rounded-xl",
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {typeof loading === "string" ? loading : "Loading..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
