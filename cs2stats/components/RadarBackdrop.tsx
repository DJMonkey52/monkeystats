export default function RadarBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-fade bg-void" />
      <div className="relative mt-[-120px] h-[720px] w-[720px] shrink-0 opacity-70">
        {/* concentric rings */}
        {[1, 0.72, 0.46, 0.22].map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-line2/70"
            style={{
              inset: `${(1 - s) * 50}%`
            }}
          />
        ))}
        {/* crosshair lines */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line2/50" />
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-line2/50" />

        {/* rotating sweep */}
        <div className="absolute inset-0 animate-sweep">
          <div
            className="absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-top-left"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(216,154,78,0.28), rgba(216,154,78,0) 32%)"
            }}
          />
        </div>

        {/* blips */}
        <span className="absolute left-[62%] top-[38%] h-1.5 w-1.5 animate-blip rounded-full bg-t" />
        <span
          className="absolute left-[35%] top-[58%] h-1.5 w-1.5 animate-blip rounded-full bg-ct"
          style={{ animationDelay: "0.8s" }}
        />
        <span
          className="absolute left-[70%] top-[68%] h-1 w-1 animate-blip rounded-full bg-muted"
          style={{ animationDelay: "1.6s" }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-void/40 to-void" />
    </div>
  );
}
