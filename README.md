# RADAR — CS2 Player Lookup

Сайт статистики CS2: вставляешь ссылку на Steam-профиль, SteamID64/32 или
собственный URL — получаешь профиль игрока, статус банов, наигранное время
и статистику FACEIT (уровень, ELO, K/D, HS%, винрейт).

Сделан на Next.js (App Router), разворачивается на Vercel одним кликом.

## Важно про источники данных

Официального публичного API для **Premier rating** и рангов конкурентного
матчмейкинга **у Valve не существует** — этих данных нет ни в Steam Web API,
ни где-либо ещё официально. Сайты вроде csstats.gg получают их
недокументированными способами. Поэтому здесь используются только два
официальных источника:

- **Steam Web API** — профиль, баны (VAC/игровые), уровень Steam, наигранное
  время в CS2 (если статистика игрока публична).
- **FACEIT Data API** — уровень, ELO, матчи, K/D, HS%, винрейт, серии побед
  (если Steam-аккаунт привязан к FACEIT).

## Получение ключей API

1. **Steam API key** — бесплатно на https://steamcommunity.com/dev/apikey
   (нужен любой Steam-аккаунт, домен можно указать `localhost` или свой).
2. **FACEIT API key** — https://developers.faceit.com/apps → создать
   приложение → вкладка **API keys** → создать ключ типа **Server-side**.

Скопируйте `.env.example` в `.env.local` и впишите оба ключа:

```bash
cp .env.example .env.local
```

## Запуск локально

```bash
npm install
npm run dev
```

Откроется на http://localhost:3000

## Деплой на Vercel

1. Залейте эту папку в GitHub-репозиторий.
2. На https://vercel.com → **Add New → Project** → выберите репозиторий.
   Vercel сам определит Next.js, ничего менять в настройках сборки не нужно.
3. Во вкладке **Settings → Environment Variables** добавьте:
   - `STEAM_API_KEY`
   - `FACEIT_API_KEY`
4. Нажмите **Deploy**. Через минуту сайт будет доступен на `*.vercel.app`.

Это статический фронтенд + пара serverless API-роутов (`/api/lookup`) —
именно то, для чего Vercel предназначен, в отличие от Discord-бота, которому
нужен постоянно работающий процесс (см. отдельный README бота).

## Что принимает поле поиска

- Полный SteamID64: `76561198252283240`
- SteamID32 / legacy: `STEAM_0:0:12345678`
- Steam3 ID: `[U:1:12345678]`
- Ссылка на профиль: `https://steamcommunity.com/id/donk` или
  `https://steamcommunity.com/profiles/7656119...`
- Vanity-имя без ссылки: `donk`

## Структура проекта

- `app/page.tsx` — главная страница (поиск + отрисовка результатов).
- `app/api/lookup/route.ts` — серверный роут, который резолвит ввод и
  дёргает Steam + FACEIT API.
- `lib/steam.ts`, `lib/faceit.ts` — клиенты API.
- `lib/resolveInput.ts` — парсинг SteamID64/32/ссылок/vanity.
- `components/` — UI-компоненты (радар-фон, панели, бейджи, сетка статов).

## Ограничения

- Если Steam-профиль приватный, часть данных (наигранное время) будет
  недоступна — это ограничение самого Steam API, не сайта.
- Если игрок не привязал FACEIT к Steam или у него нет матчей в CS2,
  блок FACEIT покажет соответствующее сообщение.


## CS2 Premier Rating

The project includes a Premier rating block.

Lookup order:
1. Unofficial Leetify profile endpoint (`rankType === 11`) for the current Premier rating and recent Premier games.
2. Public CSStats profile scraping as a fallback if the Leetify endpoint is unavailable.

The result uses short Next.js caching to reduce upstream requests, and the UI shows which unofficial source supplied the value.

`LEETIFY_KEY` is optional. Add it to Vercel Environment Variables if you have one; the public endpoint is still attempted when it is not set.

Premier is not exposed by the official Steam Web API, so unofficial sources can change or stop working without notice.
