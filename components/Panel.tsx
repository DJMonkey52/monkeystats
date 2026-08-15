export function Panel({
  eyebrow,
  title,
  right,
  children,
  accent = "t"
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  accent?: "t" | "ct";
}) {
  const accentColor = accent === "t" ? "border-t/60" : "border-ct/60";
  return (
    <section className={`animate-rise border ${accentColor} bg-panel2 clip-notch`}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <div
            className={`font-mono text-[10px] uppercase tracking-widest2 ${
              accent === "t" ? "text-t" : "text-ct"
            }`}
          >
            {eyebrow}
          </div>
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
            {title}
          </h2>
        </div>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
