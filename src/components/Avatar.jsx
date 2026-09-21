const GRADIENTS = [
  "from-lime-300 to-emerald-500",
  "from-rose-400 to-orange-500",
  "from-indigo-400 to-violet-600",
  "from-sky-400 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-amber-300 to-red-500",
];

function gradientFor(name) {
  let h = 0;
  for (const c of (name || "?").toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ name, size = "md", ring = false }) {
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display font-bold text-black ${
        sizes[size]
      } ${gradientFor(name)} ${ring ? "ring-2 ring-lime-300/70 ring-offset-2 ring-offset-[#0b0b10]" : ""}`}
    >
      {initials(name)}
    </span>
  );
}
