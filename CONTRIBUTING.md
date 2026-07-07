
### File: `CONTRIBUTING.md`
```markdown
# Contributing to VoxelForge

Thanks for your interest in improving VoxelForge! This is a community-driven project
and all contributions are welcome.

## Getting Started

1. Fork the repo and clone your fork.
2. Run `cp .env.example .env` and set a dev `JWT_SECRET`.
3. Follow the Local Development section in `README.md`.
4. Create a feature branch: `git checkout -b feat/my-feature`.

## Code Style

- ESLint config is in `.eslintrc.json`. Run `npm run lint` before committing.
- 2-space indentation, single quotes, semicolons required.
- No unused variables (warn-level allowed for `_`-prefixed args).
- Comment non-obvious logic. Public functions get JSDoc.

## Commit Messages

Use Conventional Commits:
- `feat: add spruce tree variant`
- `fix: chunk boundary mesh seam`
- `docs: update CasaOS install steps`
- `perf: cache noise generator per world`

## Pull Requests

- Keep PRs focused — one feature or fix per PR.
- Include screenshots/GIFs for UI changes.
- Ensure `docker compose up -d --build` works cleanly.
- Update `CHANGELOG.md` under the `[Unreleased]` section.

## Reporting Bugs

Open an issue with:
- Server OS / architecture (e.g. Ubuntu 22.04 ARM64).
- Browser + version.
- Steps to reproduce.
- Console logs (frontend) and `voxelforge.log` (backend).

## Roadmap

- [ ] Survival mode: crafting, mob spawning, day/night cycle.
- [ ] Drag-and-drop inventory UI.
- [ ] Web Worker terrain generation on the client.
- [ ] Modding API for custom blocks/items.

Thank you! 🟫
