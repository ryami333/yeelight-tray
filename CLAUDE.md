# Yeelight Tray

Headless Electron tray app for controlling Yeelight lights on the local network. macOS only. No visible window — runs entirely from the system tray.

## Commands

- `yarn dev` — start dev mode (Vite HMR via Electron Forge)
- `yarn lint` — run ESLint
- `yarn tsc` — type-check (no emit)
- `yarn prettier . --check` — check formatting
- `yarn package` — production build + package
- `yarn make` — production build + distribute (ZIP for macOS)

CI runs all four checks: `yarn package`, `yarn lint`, `yarn tsc`, `yarn prettier . --check`.

## Architecture

- **Build:** Vite via `@electron-forge/plugin-vite`. Config split across `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`. Forge config lives in `package.json` under `config.forge`.
- **Main process:** `src/main.ts` — creates tray, discovers devices via `yeelight-service`, builds context menu for power/brightness/color control.
- **State:** `src/helpers/state.ts` — persists to `db.json` in app data dir, validated with Zod.
- **Preload/Renderer:** `src/preload.ts`, `src/renderer.ts`, `index.html` — boilerplate, not actively used (tray-only app).

## Style

- TypeScript with strict mode
- Prettier defaults for formatting. Please always format every changed file with `yarn prettier . --write`.
- No test framework — CI validates via lint, typecheck, format, and successful packaging
