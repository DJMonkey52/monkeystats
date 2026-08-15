const RANK_NAMES = [
  "Silver I","Silver II","Silver III","Silver IV","Silver Elite","Silver Elite Master","Gold Nova I","Gold Nova II","Gold Nova III","Gold Nova Master",
  "Master Guardian I","Master Guardian II","Master Guardian Elite","Distinguished Master Guardian","Legendary Eagle","Legendary Eagle Master","Supreme Master First Class","The Global Elite"
];

export function RankBadge({ level, size = 76, label = true }: { level: number; size?: number; label?: boolean }) {
  const safe = Math.max(1, Math.min(18, Math.round(level)));
  return <div className="rank-badge-wrap">
    <img src={`https://static.csstats.gg/images/ranks/${safe}.png`} alt={RANK_NAMES[safe - 1] ?? `Rank ${safe}`} width={size} height={Math.round(size * .52)} className="rank-icon" loading="lazy" />
    {label && <span>{RANK_NAMES[safe - 1] ?? `Rank ${safe}`}</span>}
  </div>;
}

export function RankIcon({ level, size = 58 }: { level: number; size?: number }) {
  const safe = Math.max(1, Math.min(18, Math.round(level)));
  return <img src={`https://static.csstats.gg/images/ranks/${safe}.png`} alt="" width={size} height={Math.round(size * .52)} className="rank-icon" loading="lazy" />;
}
