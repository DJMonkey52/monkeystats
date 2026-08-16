# CS2 Radar Stats — real data build

## Required Vercel variables

```env
STEAM_API_KEY=...
CS2SPACE_API_KEY=...
FACEIT_API_KEY=...
LEETIFY_API_KEY=...
```

`CS2SPACE_API_KEY` is the primary source for real CS2 player data. It aggregates Steam, FACEIT and Leetify and exposes Premier, matchmaking ranks, FACEIT Elo and recent match/performance data through one server-side request. The free tier is currently advertised as 500 calls/month.

FACEIT and Leetify keys remain as fallbacks/direct sources. CSStats scraping is used only when CS2.SPACE is not configured, because CSStats currently places detailed player statistics behind authentication.

Player routes:

- `/player/<steamid64>`
- `/` for search

Never expose API keys with `NEXT_PUBLIC_`.
