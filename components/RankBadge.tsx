const LEVEL_COLORS: Record<number, string> = {
  1: "#8B939A",
  2: "#8B939A",
  3: "#E8B94A",
  4: "#E8B94A",
  5: "#D89A4E",
  6: "#D89A4E",
  7: "#BD5C4E",
  8: "#BD5C4E",
  9: "#B0598C",
  10: "#B0598C"
};

export function RankBadge({ level, size = 40 }: { level: number; size?: number }) {
  const color = LEVEL_COLORS[level] ?? "#8B939A";
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} className="absolute inset-0">
        <polygon
          points="20,2 36,11 36,29 20,38 4,29 4,11"
          fill="rgba(23,28,33,0.9)"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="relative font-display text-sm font-bold"
        style={{ color }}
      >
        {level}
      </span>
    </div>
  );
}
