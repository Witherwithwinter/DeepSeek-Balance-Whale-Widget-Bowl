# DeepSeek Balance Whale Widget Bowl

[中文说明 / Chinese README](README.md)

![DSH whale widget](assets/DSH2.png)

A fixed-corner balance widget for the [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) web GUI. It is a modified version of [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) that adds **three switchable character skins** (default / bowl-on-head / bowl-in-hand) and a **steel-pipe sound set**; everything else works like upstream (balance, today usage, per-turn cost, draggable squishy doll, random talk lines). It ships as a standard DSH bundle plugin.

## Features

- **Always on** — loads with the DSH web GUI as a bundle plugin, no manual script injection.
- **Skins** — first row of the menu switches between `default`, `bowl` (bowl on head) and `hold` (bowl in hand); the choice is persisted and survives a restart.
- **Balance** — refreshed every 60 s and on click, with a rolling-number animation; a transient network error keeps serving the last known balance instead of showing an error.
- **Today usage** — two modes:
  - *Whale ledger* (default, no token needed): the widget derives spending from the observed balance drop and keeps a local ledger (`.dshw-usage.json`, reset daily, 30 days of history).
  - *Live / token*: with a DeepSeek platform session token it reads the platform usage API and converts tokens to CNY using peak/off-peak pricing (peak = weekdays 09:00–12:00 and 14:00–18:00 Beijing time; weekends are off-peak from 2026-08-23).
- **Per-turn cost** — listens to local session events and shows the exact cost of the turn that just finished (real usage, not an estimate); auto-close delay is configurable.
- **Drag and snap** to any of the four screen edges, mirroring horizontally when snapped left.
- **Press animation and sound** — rubber-duck / sfx-1 / steel-pipe sets, silently degrading when an mp3 is missing.
- **Menu** (hover the top-right corner of the whale): skin, size slider (0.6–2.5x), sound set, volume, usage mode, peak-hour wording, speech bubble, per-turn cost toggle and auto-close delay, scrollbar gap.

## Install

```powershell
dsh plugin --profile web add github:Witherwithwinter/DeepSeek-Balance-Whale-Widget-Bowl
```

Local development install, from the repository root:

```powershell
dsh plugin --profile web add link:.
```

Restart DSH; the whale appears in the bottom-right corner. The upstream widget can be installed alongside this one — the route prefixes differ (`/dsh-whale/` vs `/dsh-whale-bowl/`).

## Configuration

- `DEEPSEEK_API_KEY` — required, used to read the account balance.
- `DEEPSEEK_PLATFORM_TOKEN` — optional, only for the *live / token* usage mode. It is the platform **web session** token, not an `sk-` API key.

Settings are stored next to the DSH home directory in `.dshw-size.json`; the ledger lives in `.dshw-usage.json`.

## HTTP routes (host side)

All routes are served under `/dsh-whale-bowl/`:

| Route | Purpose |
|---|---|
| `GET image.png?skin=default\|bowl\|hold` | the skin PNG (cached per skin in memory) |
| `GET balance.json` | balance + today usage (always 200 + JSON) |
| `GET last-turn.json` | cost of the most recent finished turn |
| `GET size.json` / `PUT` | widget settings; PUT persists them |
| `GET sound/press.mp3?set=…`, `release.mp3?set=…` | press / release sound for a sound set |
| `GET widget.js` | the browser-side widget source, injected as `<script defer>` |

## Development

```powershell
npm test   # pure-function self-check, no DSH runtime required
```

The full specification and visual parameters are kept in `whale-widget-prompt.md` (Chinese).

## License

MIT — see [LICENSE](LICENSE). Original work by [MeteorNOX](https://github.com/MeteorNOX); this repository is a modified redistribution under the same license.
