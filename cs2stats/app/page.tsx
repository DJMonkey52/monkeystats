"use client";

import { useState } from "react";
import Image from "next/image";
import RadarBackdrop from "@/components/RadarBackdrop";
import { Panel } from "@/components/Panel";
import { Stat, StatGrid } from "@/components/StatGrid";
import { RankBadge } from "@/components/RankBadge";

interface LookupResult {
  steamid64: string;
  profile: {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatarfull: string;
    personastate: number;
    communityvisibilitystate: number;
    timecreated?: number;
    loccountrycode?: string;
  };
  bans: {
    VACBanned: boolean;
    NumberOfVACBans: number;
    NumberOfGameBans: number;
    DaysSinceLastBan: number;
    CommunityBanned: boolean;
  } | null;
  steamLevel: number | null;
  playtime: { forever_minutes: number; recent_minutes: number; visible: boolean };
  faceit: {
    nickname: string;
    avatar: string;
    country: string;
    url?: string;
    cs2: { skill_level: number; faceit_elo: number; region: string } | null;
    stats: {
      matches: number;
      winRate: number;
      avgKd: number;
      avgHsPercent: number;
      currentWinStreak: number;
      longestWinStreak: number;
      recentResults: ("W" | "L")[];
    } | null;
  } | null;
}

function hoursFromMinutes(min: number) {
  return Math.round(min / 60);
}

function formatDate(unix?: number) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

const PLACEHOLDER_EXAMPLES = [
  "https://steamcommunity.com/id/donk",
  "76561198252283240",
  "STEAM_0:0:12345678"
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось выполнить поиск.");
        return;
      }
      setResult(data as LookupResult);
    } catch {
      setError("Сеть недоступна или сервер не ответил. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen">
      <div className="relative">
        <RadarBackdrop />

        <div className="relative mx-auto max-w-3xl px-6 pt-24 pb-10 text-center sm:pt-32">
          <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest2 text-t">
            <span className="h-1.5 w-1.5 rounded-full bg-t" />
            Live Steam &amp; FACEIT lookup
          </div>
          <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide text-ink sm:text-6xl">
            Найди досье
            <br />
            <span className="text-t">на любого игрока</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm text-muted sm:text-base">
            Вставь ссылку на Steam-профиль, SteamID64/32 или ник — получишь профиль, FACEIT
            уровень и ELO, статус банов и наигранное время в CS2.
          </p>

          <form onSubmit={handleSearch} className="relative mx-auto mt-10 max-w-xl">
            <div className="flex items-center gap-0 border border-line2 bg-panel clip-notch focus-within:border-t/70">
              <span className="pl-4 font-mono text-dim">›</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="steamcommunity.com/id/... или SteamID64"
                className="w-full bg-transparent px-3 py-4 font-mono text-sm text-ink placeholder:text-dim focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 bg-t px-6 py-4 font-display text-sm font-semibold uppercase tracking-wide text-void transition hover:bg-gold disabled:opacity-50"
              >
                {loading ? "Поиск…" : "Найти"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-dim">
              <span>Примеры:</span>
              {PLACEHOLDER_EXAMPLES.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="underline decoration-line2 underline-offset-2 hover:text-t"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        {error && (
          <div className="animate-rise border border-loss/60 bg-loss/10 px-5 py-4 font-mono text-sm text-loss">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-6">
            <Panel eyebrow="Steam" title="Профиль" accent="ct">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <Image
                    src={result.profile.avatarfull}
                    alt={result.profile.personaname}
                    width={88}
                    height={88}
                    className="border border-line2"
                  />
                  {result.steamLevel !== null && (
                    <div className="absolute -bottom-2 -right-2 border border-line2 bg-void px-1.5 py-0.5 font-mono text-[10px] text-gold">
                      LVL {result.steamLevel}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={result.profile.profileurl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-display text-2xl font-semibold text-ink hover:text-ct"
                  >
                    {result.profile.personaname}
                  </a>
                  <div className="mt-1 font-mono text-xs text-dim">{result.steamid64}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.profile.communityvisibilitystate !== 3 && (
                      <Badge tone="loss">Приватный профиль</Badge>
                    )}
                    {result.bans?.VACBanned && (
                      <Badge tone="loss">
                        VAC ×{result.bans.NumberOfVACBans}
                      </Badge>
                    )}
                    {result.bans && result.bans.NumberOfGameBans > 0 && (
                      <Badge tone="loss">Игровой бан ×{result.bans.NumberOfGameBans}</Badge>
                    )}
                    {result.bans && !result.bans.VACBanned && result.bans.NumberOfGameBans === 0 && (
                      <Badge tone="win">Чист</Badge>
                    )}
                    {result.profile.loccountrycode && (
                      <Badge tone="muted">{result.profile.loccountrycode}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <StatGrid>
                  <Stat label="Аккаунт создан" value={formatDate(result.profile.timecreated)} />
                  <Stat
                    label="Часов в CS2"
                    value={
                      result.playtime.visible
                        ? String(hoursFromMinutes(result.playtime.forever_minutes))
                        : "скрыто"
                    }
                  />
                  <Stat
                    label="За 2 недели"
                    value={
                      result.playtime.visible
                        ? `${hoursFromMinutes(result.playtime.recent_minutes)} ч`
                        : "скрыто"
                    }
                  />
                </StatGrid>
              </div>
            </Panel>

            {result.faceit ? (
              <Panel
                eyebrow="FACEIT"
                title="Статистика"
                accent="t"
                right={
                  result.faceit.cs2 && <RankBadge level={result.faceit.cs2.skill_level} />
                }
              >
                <div className="flex items-center gap-4">
                  {result.faceit.avatar ? (
                    <Image
                      src={result.faceit.avatar}
                      alt={result.faceit.nickname}
                      width={56}
                      height={56}
                      className="border border-line2"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center border border-line2 bg-panel font-display text-lg text-dim">
                      {result.faceit.nickname.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <a
                      href={result.faceit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-display text-lg font-semibold text-ink hover:text-t"
                    >
                      {result.faceit.nickname}
                    </a>
                    <div className="font-mono text-xs text-dim">
                      {result.faceit.cs2?.region ?? "—"} · ELO{" "}
                      <span className="text-t">{result.faceit.cs2?.faceit_elo ?? "—"}</span>
                    </div>
                  </div>
                </div>

                {result.faceit.stats ? (
                  <div className="mt-5">
                    <StatGrid>
                      <Stat label="Матчи" value={String(result.faceit.stats.matches)} />
                      <Stat
                        label="Винрейт"
                        value={`${result.faceit.stats.winRate}%`}
                        accent="win"
                      />
                      <Stat label="K/D" value={result.faceit.stats.avgKd.toFixed(2)} />
                      <Stat label="HS%" value={`${result.faceit.stats.avgHsPercent}%`} />
                      <Stat
                        label="Тек. серия побед"
                        value={String(result.faceit.stats.currentWinStreak)}
                        accent="gold"
                      />
                      <Stat
                        label="Лучшая серия"
                        value={String(result.faceit.stats.longestWinStreak)}
                      />
                    </StatGrid>

                    {result.faceit.stats.recentResults.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest2 text-dim">
                          Последние матчи
                        </span>
                        <div className="flex gap-1">
                          {result.faceit.stats.recentResults.map((r, i) => (
                            <span
                              key={i}
                              className={`flex h-6 w-6 items-center justify-center font-mono text-[11px] font-bold ${
                                r === "W" ? "bg-win/20 text-win" : "bg-loss/20 text-loss"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 font-mono text-xs text-dim">
                    Статистика матчей недоступна.
                  </p>
                )}
              </Panel>
            ) : (
              <Panel eyebrow="FACEIT" title="Статистика" accent="t">
                <p className="font-mono text-sm text-dim">
                  Аккаунт FACEIT не привязан к этому Steam-профилю или скрыт.
                </p>
              </Panel>
            )}

            <p className="text-center font-mono text-[11px] text-dim">
              Официального публичного API для рейтинга Premier / рангов конкурентного режима
              не существует — Valve его не предоставляет, поэтому здесь показаны только данные
              из официальных Steam Web API и FACEIT Data API.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Badge({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "win" | "loss" | "muted";
}) {
  const cls = {
    win: "border-win/50 text-win",
    loss: "border-loss/50 text-loss",
    muted: "border-line2 text-muted"
  }[tone];
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}
