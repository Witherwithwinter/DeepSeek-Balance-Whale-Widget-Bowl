# DeepSeek Balance Whale Widget — Bowl Edition

[中文说明 / Chinese README](README.md)

![DSH whale widget](assets/DSH2.png)

A fixed-corner balance widget for [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) — the web GUI **and the official desktop client (Electron)**. This repository integrates [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) **v0.3.18** in full — every duplicated feature follows the upstream implementation, including upstream's official-desktop support — and adds two things on top:

- **Two built-in "iron-bowl" whale-girl skins**: *bowl-on-head* (`bowl`) and *bowl-in-hand* (`hold`), registered as **built-in roles** in the upstream role system. They appear in the menu's **Role** dropdown next to the default whale, cannot be deleted, can be pinned, and the pinned choice survives a restart. Existing `roles.json` files are back-filled with them automatically.
- **A steel-pipe sound set** (`assets/P1.mp3` / `P2.mp3`) as a third built-in preset group next to *duck* and *sfx-1*: press plays the impact + early ring-out, release plays the fade-out tail. It is also selectable as the task-end / question / approval sound.

Everything else — ledger accounting, customizable bubbles (click sequences, weighted A/B, modular rows), per-turn cost with real usage, balance alerts / daily budget, multi-vendor balance & quota (33 provider templates), custom characters, importable sound groups, task-end sounds, snap & flip settings, Codex local-session stats — works exactly like upstream v0.3.18. It ships as a standard DSH bundle plugin.

## Install

### Web (`dsh web`)

```powershell
dsh plugin --profile web add dsh-whale-widget-bowl
```

Local development install, from the repository root:

```powershell
dsh plugin --profile web add link:.
```

Restart DSH; the widget appears in the bottom-right corner.

### Official desktop client (Electron)

The desktop client reads the **`desktop` profile**, not `web` — and `dsh plugin` refuses to touch it by design:

```
error: profile "desktop" is managed exclusively by the Electron application
```

So the correct way is to **let DSH inside the desktop client install it**: just ask it in a desktop session (e.g. "install dsh-whale-widget-bowl"). It calls the built-in `plugin_manager`, whose scope is the current profile (`desktop`), installs with the client's bundled pnpm, and writes the package into that profile's `dsh.profile.bundles`.

A new plugin usually hot-applies; **upgrading to another version requires restarting the client**. If the widget still does not show up after a fresh install (issue #162), **restart the client first** before debugging.

Verification (desktop): `%USERPROFILE%\.dsh\.dshw-turn.json` exists and its `seq` grows with each turn (host half); `dshw-pos` / `dshw-last-seq` appear in the desktop client's Local Storage leveldb (client half).

> Note: the route prefix is the same as upstream (`/dsh-whale/`), so this plugin and the upstream `dsh-whale-widget` must **not** be enabled in the same profile at the same time — routes and ledger files would collide.

Upstream also ships a `For-Codex` branch (a Codex desktop port); **this fork does not maintain it**.

## Skins

The menu's **Role** dropdown switches between three characters instantly; pin (📌) your choice to keep it across restarts.

| Default | Bowl on head | Bowl in hand |
|:---:|:---:|:---:|
| <img src="assets/DSniang1.png" width="200" alt="default"/> | <img src="assets/DSniang-bowl.png" width="200" alt="bowl"/> | <img src="assets/DSniang-hold.png" width="200" alt="hold"/> |
| `assets/DSniang1.png` | `assets/DSniang-bowl.png` | `assets/DSniang-hold.png` |

Both bowl skins are high-resolution cut-outs on a 1179×1179 square transparent canvas, subject-aligned to the default skin by face width. To replace one, overwrite the matching png and restart DSH.

## Configuration

- `DEEPSEEK_API_KEY` — used to read the account balance. Ledger mode needs no other token.
- Other providers / optional tokens are configured in the widget's own menus, keys stored via the DSH credential service.

Settings live under the DSH home directory (`.dshw-size.json`, `.dshw-usage.json`, `whale-roles/`, `whale-audio/`, …).

## Development

```powershell
npm test   # pure functions + fork invariants; no DSH runtime required
```

The self-check also asserts the fork invariants (built-in roles, steel-pipe sound set, the desktop `webserver/index-inject` row, and package-name / patch-id / version consistency), because this repository is maintained by **re-applying its increments on top of each upstream release** — that is exactly where an increment can silently disappear.

Zero-dependency static audits (the same ones CI runs):

```powershell
node tools/ci-audit.mjs --no-pack
node tools/z-layer-audit.mjs assets/whale-widget.js
node tools/check-dead-settings.mjs
```

- `lib/index.js` is the host side (routes, ledger, sound/role services, desktop injection row); `assets/whale-widget.js` is the browser side. Frontend changes take effect on a hard refresh; host changes need a `dsh web` restart.
- The full specification and visual parameters are kept in `whale-widget-prompt.md` (Chinese).
- See [CHANGELOG.md](CHANGELOG.md) for the release history.

## License

MIT — see [LICENSE](LICENSE). Original work by [MeteorNOX](https://github.com/MeteorNOX); this repository is a modified redistribution under the same license. Artwork under `assets/` is **not** covered by MIT — see [PROVENANCE.md](PROVENANCE.md).
