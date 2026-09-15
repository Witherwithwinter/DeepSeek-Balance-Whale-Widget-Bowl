# DeepSeek Balance Whale Widget Bowl

[中文说明 / Chinese README](README.md)

![DSH whale widget](assets/DSH2.png)

A fixed-corner balance widget for the [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) web GUI. This repository integrates [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) **v0.3.0** in full — all duplicated features follow the upstream implementation — and adds two things on top:

- **Two built-in "iron-bowl" whale-girl skins**: *bowl-on-head* (`bowl`) and *bowl-in-hand* (`hold`), listed in the menu's **Role** dropdown alongside the default whale. They cannot be deleted, can be pinned, and the pinned choice survives a restart. Existing `roles.json` files pick them up automatically.
- **A steel-pipe sound set** (`assets/P1.mp3` / `P2.mp3`) as a third built-in preset group next to *duck* and *sfx-1*: press plays the impact + early ring-out, release plays the fade-in tail. It is also available as a task-end sound.

Everything else — ledger accounting, customizable bubbles (click sequences, weighted A/B, modular rows), per-turn cost with real usage, balance alerts / daily budget, multi-vendor balance & quota (33 provider templates), custom characters, importable sound groups, task-end sounds, snap & flip settings, Codex local-session stats — works exactly like upstream v0.3.0. It ships as a standard DSH bundle plugin.

## Install

```powershell
dsh plugin --profile web add github:Witherwithwinter/DeepSeek-Balance-Whale-Widget-Bowl
```

Local development install, from the repository root:

```powershell
dsh plugin --profile web add link:.
```

Restart DSH; the widget appears in the bottom-right corner.

> Note: the route prefix is the same as upstream (`/dsh-whale/`), so this plugin and the upstream one must **not** be installed into the same web profile at the same time.

## Configuration

- `DEEPSEEK_API_KEY` — required, used to read the account balance. Ledger mode needs no other token.
- Other providers / optional tokens are configured in the widget's own menus, keys stored via the DSH credential service.

Settings live under the DSH home directory (`.dshw-size.json`, `.dshw-usage.json`, `whale-roles/`, `whale-audio/`, …).

## Skins

The menu's **Role** dropdown switches between three characters instantly; pin (📌) your choice to keep it across restarts.

| Default | Bowl on head | Bowl in hand |
|:---:|:---:|:---:|
| <img src="assets/DSniang1.png" width="200" alt="default"/> | <img src="assets/DSniang-bowl.png" width="200" alt="bowl"/> | <img src="assets/DSniang-hold.png" width="200" alt="hold"/> |
| `assets/DSniang1.png` | `assets/DSniang-bowl.png` | `assets/DSniang-hold.png` |

Both bowl skins are high-resolution cut-outs on a 1179×1179 square transparent canvas, subject-aligned to the default skin by face width. To replace one, overwrite the matching png and restart DSH. New artwork should use a fully transparent square canvas, bottom-aligned subject filling the canvas height, aligned across skins by face width.

## Development

```powershell
npm test   # pure-function self-check, no DSH runtime required
```

- `lib/index.js` is the host side (routes, ledger, sound/role services); `assets/whale-widget.js` is the browser side. Frontend changes take effect on a hard refresh; host changes need a `dsh web` restart.
- The full specification and visual parameters are kept in `whale-widget-prompt.md` (Chinese).
- See [CHANGELOG.md](CHANGELOG.md) for the release history.

## License

MIT — see [LICENSE](LICENSE). Original work by [MeteorNOX](https://github.com/MeteorNOX); this repository is a modified redistribution under the same license.
