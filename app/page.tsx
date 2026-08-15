"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

interface MatchRow {
  id: string; date: string; map: string; mode: string; result: "win" | "loss" | "tie" | "unknown";
  score: string; banned: boolean; kills: number; deaths: number; assists: number; headshots: number;
  hsPercent: number; kd: number; adr: number; damage: number; rounds: number; rating: number;
  ctRating: number; tRating: number; scorePoints: number; mvps: number; accuracy: number; preaim: number;
  reaction: number; sprayAccuracy: number; survived: number; multi1k: number; multi2k: number;
  multi3k: number; multi4k: number; multi5k: number; tradeKills: number; tradeKillSuccess: number;
  tradedDeaths: number; tradedDeathSuccess: number; flashAssists: number; flashThrown: number;
  heThrown: number; molotovThrown: number; smokeThrown: number;
}

interface Analytics {
  matches: MatchRow[]; sampleSize: number; totalTrackedMatches: number; firstMatchDate: string | null;
  totals: Record<string, number>; ratings: Record<string, number | null>; lifetimeStats: Record<string, number | null>;
  ranks: Record<string, unknown>; source: string;
}

interface LookupResult {
  steamid64: string;
  profile: { steamid: string; personaname: string; profileurl: string; avatarfull: string; personastate: number; communityvisibilitystate: number; timecreated?: number; loccountrycode?: string };
  bans: { VACBanned: boolean; NumberOfVACBans: number; NumberOfGameBans: number; DaysSinceLastBan: number; CommunityBanned: boolean } | null;
  steamLevel: number | null;
  playtime: { forever_minutes: number; recent_minutes: number; visible: boolean };
  premier: { rating: number; previousRating: number | null; ratingChange: number | null; season: number | null; recentGames: { gameId: string; mapName: string; matchResult: string; skillLevel: number; rankType: number | null; elo: number | null }[]; source: string; sourceUrl: string; fetchedAt: string } | null;
  leetify: Analytics | null;
  faceit: null | { nickname: string; avatar: string; country: string; url?: string; cs2: { skill_level: number; faceit_elo: number; region: string } | null; stats: { matches: number; winRate: number; avgKd: number; avgHsPercent: number; currentWinStreak: number; longestWinStreak: number; recentResults: ("W" | "L")[] } | null };
}

const examples = ["76561197971307841", "https://steamcommunity.com/id/donk"];

function n(v: unknown, digits = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("ru-RU", { maximumFractionDigits: digits }) : "—";
}
function pct(v: unknown, digits = 1) { return typeof v === "number" && Number.isFinite(v) ? `${v.toFixed(digits)}%` : "—"; }
function date(v?: string | number | null) { if (!v) return "—"; const d = typeof v === "number" ? new Date(v * 1000) : new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }); }
function hours(min: number) { return Math.round(min / 60).toLocaleString("ru-RU"); }

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="stat-card"><div className="label">{label}</div><div className="value">{value}</div>{sub && <div className="sub">{sub}</div>}</div>;
}
function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return <section className="section"><div className="section-head"><div><div className="kicker">{kicker}</div><h2>{title}</h2></div></div>{children}</section>;
}
function BarStat({ label, value, max = 100, suffix = "" }: { label: string; value: number; max?: number; suffix?: string }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="bar-row"><div className="bar-top"><span>{label}</span><b>{value.toFixed(1)}{suffix}</b></div><div className="bar"><span style={{ width: `${width}%` }} /></div></div>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "matches" | "performance">("overview");

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка запроса");
      setResult(data); setTab("overview");
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось загрузить статистику"); }
    finally { setLoading(false); }
  }

  const a = result?.leetify;
  const t = a?.totals;
  const recent = a?.matches ?? [];
  const latestRating = result?.premier?.rating ?? (typeof a?.ranks?.premier === "number" ? a.ranks.premier : null);
  const ratingChange = result?.premier?.ratingChange ?? null;
  const performance = useMemo(() => {
    if (!recent.length) return null;
    const sorted = [...recent].sort((x, y) => y.rating - x.rating);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  }, [recent]);

  return <main>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">R</span><div><strong>RADAR</strong><small>CS2 PLAYER INTELLIGENCE</small></div></div>
      <div className="live"><i /> LIVE DATA</div>
    </header>

    <div className="hero">
      <div className="hero-grid" />
      <div className="hero-inner">
        <div className="eyebrow">PLAYER DATABASE / CS2</div>
        <h1>Полная статистика<br /><span>любого игрока</span></h1>
        <p>Premier rating, последние 30 матчей, K/D, ADR, HS%, Leetify performance, оружие и игровые показатели — в одном профиле.</p>
        <form onSubmit={search} className="search">
          <div className="search-icon">⌕</div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="SteamID64, Steam URL или vanity URL" />
          <button disabled={loading}>{loading ? "ЗАГРУЗКА" : "ANALYZE"}</button>
        </form>
        <div className="examples">Быстрый поиск: {examples.map(x => <button key={x} onClick={() => { setQuery(x); }}>{x}</button>)}</div>
      </div>
    </div>

    <div className="container">
      {error && <div className="error">{error}</div>}
      {!result && !loading && <div className="empty"><div className="empty-number">01</div><h2>Введите Steam-профиль</h2><p>Сайт получит профиль Steam и расширенную статистику CS2 из доступных источников.</p></div>}

      {result && <>
        <section className="profile-head">
          <Image src={result.profile.avatarfull} alt="" width={96} height={96} className="avatar" />
          <div className="identity">
            <div className="identity-line"><h2>{result.profile.personaname}</h2>{result.profile.personastate === 1 && <span className="online">ONLINE</span>}</div>
            <div className="steamid">{result.steamid64}</div>
            <div className="badges">
              {result.bans?.VACBanned ? <span className="badge danger">VAC ×{result.bans.NumberOfVACBans}</span> : <span className="badge good">CLEAN</span>}
              {result.profile.loccountrycode && <span className="badge">{result.profile.loccountrycode}</span>}
              {result.steamLevel !== null && <span className="badge">STEAM LVL {result.steamLevel}</span>}
            </div>
          </div>
          <a className="profile-link" href={result.profile.profileurl} target="_blank" rel="noreferrer">STEAM PROFILE ↗</a>
        </section>

        <nav className="tabs">
          {([["overview", "Обзор"], ["matches", "30 матчей"], ["performance", "Performance"]] as const).map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}
        </nav>

        {tab === "overview" && <div className="stack">
          <Section kicker="PREMIER" title="Рейтинг сезона">
            <div className="rating-layout">
              <div className="rating-main"><span>CURRENT RATING</span><strong>{latestRating !== null ? n(latestRating) : "—"}</strong><div className="rating-meta">{ratingChange !== null ? <b className={ratingChange >= 0 ? "positive" : "negative"}>{ratingChange >= 0 ? "+" : ""}{n(ratingChange)} после последней игры</b> : "Рейтинг из доступного источника"}</div></div>
              <div className="rating-side"><div><span>SEASON</span><b>{result.premier?.season ? `S${result.premier.season}` : "—"}</b></div><div><span>TRACKED</span><b>{n(a?.totalTrackedMatches)}</b></div><div><span>30-MATCH WINRATE</span><b>{pct(t?.winRate)}</b></div></div>
            </div>
          </Section>

          <Section kicker="LAST 30" title="Основные показатели">
            <div className="stats-grid">
              <StatCard label="K/D" value={n(t?.kd, 2)} sub={`${n(t?.kills)} K / ${n(t?.deaths)} D`} />
              <StatCard label="ADR" value={n(t?.adr, 1)} sub={`${n(t?.damage)} damage`} />
              <StatCard label="HS%" value={pct(t?.hsPercent)} sub={`${n(t?.headshots)} headshots`} />
              <StatCard label="WIN RATE" value={pct(t?.winRate)} sub={`${n(t?.wins)}W / ${n(t?.losses)}L`} />
              <StatCard label="RATING" value={n(t?.rating, 2)} sub="Leetify Rating" />
              <StatCard label="ROUNDS" value={n(t?.rounds)} sub={`${n(t?.matches ?? a?.sampleSize)} tracked matches`} />
            </div>
          </Section>

          <div className="two-col">
            <Section kicker="LEETIFY" title="Performance">
              <div className="bars">
                <BarStat label="Aim" value={Number(a?.ratings.aim ?? 0)} />
                <BarStat label="Positioning" value={Number(a?.ratings.positioning ?? 0)} />
                <BarStat label="Utility" value={Number(a?.ratings.utility ?? 0)} />
                <BarStat label="Clutch" value={Number(a?.ratings.clutch ?? 0)} />
                <BarStat label="Opening" value={Number(a?.ratings.opening ?? 0)} />
              </div>
            </Section>
            <Section kicker="MATCH QUALITY" title="Лучшие / худшие">
              {performance ? <div className="best-list"><div><span>BEST GAME</span><b>{performance.best.map}</b><strong>{n(performance.best.rating, 2)}</strong><small>{performance.best.score} · {performance.best.kills}/{performance.best.deaths}/{performance.best.assists}</small></div><div><span>LOWEST RATING</span><b>{performance.worst.map}</b><strong>{n(performance.worst.rating, 2)}</strong><small>{performance.worst.score} · {performance.worst.kills}/{performance.worst.deaths}/{performance.worst.assists}</small></div></div> : <div className="muted">Нет обработанных матчей.</div>}
            </Section>
          </div>

          <Section kicker="ADVANCED" title="Механика и utility">
            <div className="stats-grid six">
              <StatCard label="Accuracy" value={pct(t?.accuracy)} />
              <StatCard label="Preaim" value={n(t?.preaim, 2)} />
              <StatCard label="Reaction" value={`${n(t?.reaction, 0)} ms`} />
              <StatCard label="Spray" value={pct(t?.sprayAccuracy)} />
              <StatCard label="Trade Kills" value={pct(t?.tradeKillSuccess)} />
              <StatCard label="Traded Deaths" value={pct(t?.tradedDeathSuccess)} />
            </div>
          </Section>

          <Section kicker="STEAM" title="Аккаунт">
            <div className="stats-grid">
              <StatCard label="CS2 PLAYTIME" value={result.playtime.visible ? `${hours(result.playtime.forever_minutes)} ч` : "скрыто"} />
              <StatCard label="2 WEEKS" value={result.playtime.visible ? `${hours(result.playtime.recent_minutes)} ч` : "скрыто"} />
              <StatCard label="ACCOUNT CREATED" value={date(result.profile.timecreated)} />
              <StatCard label="FIRST TRACKED" value={date(a?.firstMatchDate)} />
              <StatCard label="FACEIT ELO" value={n(result.faceit?.cs2?.faceit_elo)} />
              <StatCard label="FACEIT LEVEL" value={n(result.faceit?.cs2?.skill_level)} />
            </div>
          </Section>
        </div>}

        {tab === "matches" && <Section kicker="MATCH HISTORY" title="Последние 30 игр">
          <div className="match-table-wrap"><table><thead><tr><th>DATE</th><th>MAP</th><th>RESULT</th><th>SCORE</th><th>K/D/A</th><th>ADR</th><th>HS%</th><th>RATING</th></tr></thead><tbody>{recent.map(m => <tr key={m.id}><td>{date(m.date)}</td><td><b>{m.map.replace("de_", "")}</b><small>{m.mode}</small></td><td><span className={`result ${m.result}`}>{m.result === "win" ? "WIN" : m.result === "loss" ? "LOSS" : m.result === "tie" ? "TIE" : "—"}</span></td><td>{m.score}</td><td>{m.kills}/{m.deaths}/{m.assists}</td><td>{n(m.adr, 1)}</td><td>{pct(m.hsPercent)}</td><td><strong>{n(m.rating, 2)}</strong></td></tr>)}</tbody></table></div>
        </Section>}

        {tab === "performance" && <div className="stack">
          <Section kicker="30 MATCH SAMPLE" title="Детальная статистика">
            <div className="stats-grid six">
              <StatCard label="1K" value={n(recent.reduce((x, m) => x + m.multi1k, 0))} />
              <StatCard label="2K" value={n(recent.reduce((x, m) => x + m.multi2k, 0))} />
              <StatCard label="3K" value={n(recent.reduce((x, m) => x + m.multi3k, 0))} />
              <StatCard label="4K" value={n(recent.reduce((x, m) => x + m.multi4k, 0))} />
              <StatCard label="5K" value={n(recent.reduce((x, m) => x + m.multi5k, 0))} />
              <StatCard label="MVPS" value={n(recent.reduce((x, m) => x + m.mvps, 0))} />
              <StatCard label="FLASH ASSISTS" value={n(recent.reduce((x, m) => x + m.flashAssists, 0))} />
              <StatCard label="HE THROWN" value={n(recent.reduce((x, m) => x + m.heThrown, 0))} />
              <StatCard label="MOLOTOV" value={n(recent.reduce((x, m) => x + m.molotovThrown, 0))} />
              <StatCard label="SMOKES" value={n(recent.reduce((x, m) => x + m.smokeThrown, 0))} />
              <StatCard label="TRADE KILLS" value={n(recent.reduce((x, m) => x + m.tradeKills, 0))} />
              <StatCard label="TRADED DEATHS" value={n(recent.reduce((x, m) => x + m.tradedDeaths, 0))} />
            </div>
          </Section>
          <Section kicker="LIFETIME / LEETIFY" title="Доступные lifetime metrics">
            <div className="stats-grid six">{Object.entries(a?.lifetimeStats ?? {}).map(([key, value]) => <StatCard key={key} label={key.replaceAll("_", " ")} value={typeof value === "number" ? n(value, 2) : "—"} />)}</div>
          </Section>
        </div>}

        <footer className="footer">Data provided by Leetify · Premier данные получаются через сторонние источники и могут измениться. <a href="https://leetify.com/" target="_blank" rel="noreferrer">View on Leetify ↗</a> · <a href="https://csstats.gg/" target="_blank" rel="noreferrer">CSStats reference ↗</a></footer>
      </>}
    </div>
  </main>;
}
