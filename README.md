# RADAR // CS2 Player Intelligence

Next.js приложение для поиска игрока по SteamID64 / Steam URL.

## Что теперь показывает

- Premier rating и изменение рейтинга;
- последние 30 обработанных матчей;
- K/D, ADR, HS%, win rate, kills/deaths/assists;
- Leetify Rating, CT/T rating;
- Aim, Positioning, Utility, Clutch, Opening;
- Accuracy, Preaim, Reaction time, Spray accuracy;
- trade kills / traded deaths;
- multi-kills 1K–5K, MVP, flash/HE/molotov/smoke;
- Steam playtime, уровень, дату аккаунта, VAC/Game bans;
- FACEIT ELO/level, если FACEIT API доступен.

## Vercel

Добавьте Environment Variables:

- `STEAM_API_KEY` — обязателен для Steam Web API.
- `LEETIFY_API_KEY` — рекомендуется для стабильного доступа к Leetify Public API.
- `FACEIT_API_KEY` — необязателен.

Leetify Public API используется через `/v3/profile` и `/v3/profile/matches`. Если API недоступен, Premier rating пытается получить старым fallback-источником.

Не храните ключи в клиентском коде: они используются только в Next.js API route.
