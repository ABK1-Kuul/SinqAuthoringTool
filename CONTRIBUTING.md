# Contributing to SINQ Authoring Tool

Thank you for your interest in contributing. SINQ is building the future of accessible, responsive e-learning authoring—and we welcome developers who share that vision.

---

## Onboarding

We've designed a clear path from clone to merged PR. Follow the **Contributor Journey** on our website:

**[Contribute → Contributor Journey](https://sinq-authoring.vercel.app/contribute)**

In short:

1. **Fork & Clone** — Fork the repo, clone your fork, add the upstream remote.
2. **Install Dependencies** — `npm install` (Node 18+).
3. **Run Dev Mode** — `npm run dev` (uses cross-env for Windows and Unix).
4. **Branch & Pull Request** — Create a descriptive branch and open a PR.

---

## Code Standards

- **ESLint** — We use ESLint for consistency. Run `npm run lint` before submitting.

- **No Global State** — Avoid `process.chdir()` and other global mutations. Use explicit paths and dependency injection. This keeps the codebase predictable and testable.

- **Tests** — Run `npm test` to ensure nothing is broken. Add tests for new behavior when appropriate.

---

## Workflow

### Branch Naming

Use descriptive prefixes:

- `feature/` — New functionality (e.g., `feature/plugin-marketplace`)
- `fix/` — Bug fixes (e.g., `fix/mongodb-startup`)
- `docs/` — Documentation only (e.g., `docs/installation-guide`)

### Pull Requests

- **Descriptive titles** — "Add dark mode toggle" over "Fix stuff".
- **Clear descriptions** — What changed, why, and how to test.
- **Link issues** — Reference related issues when applicable.

We review PRs promptly. First-time contributors are especially welcome.

---

## Vision

SINQ exists to make Adapt authoring accessible. Every contribution—whether a typo fix, a performance improvement, or a new feature—helps educators and instructional designers create better e-learning experiences.

Thank you for being part of it.
