import { clsx } from "clsx";

// Game-grade button: heavy primary with glow, glassy secondary, danger rose.
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
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl font-display font-bold tracking-tight transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 min-h-[54px] text-base";
  const variants = {
    primary:
      "bg-gradient-to-b from-lime-200 to-lime-300 text-black shadow-[0_8px_30px_-6px_rgba(190,242,100,0.5)] hover:brightness-105",
    secondary:
      "bg-white/[0.06] text-zinc-100 border border-white/10 hover:bg-white/[0.1] backdrop-blur",
    danger:
      "bg-gradient-to-b from-rose-400 to-rose-500 text-black shadow-[0_8px_30px_-6px_rgba(244,63,94,0.5)] hover:brightness-105",
    ghost:
      "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5 min-h-[44px]",
  };
  const sizes = {
    lg: "px-6 py-4",
    md: "px-5 py-3 min-h-[50px] text-[15px]",
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
