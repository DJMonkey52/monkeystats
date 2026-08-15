export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3">
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: "t" | "ct" | "win" | "loss" | "gold";
}) {
  const accentClass = accent
    ? {
        t: "text-t",
        ct: "text-ct",
        win: "text-win",
        loss: "text-loss",
        gold: "text-gold"
      }[accent]
    : "text-ink";

  return (
    <div className="bg-panel px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest2 text-dim">{label}</div>
      <div className={`mt-1 font-mono text-xl font-medium ${accentClass}`}>{value}</div>
    </div>
  );
}
