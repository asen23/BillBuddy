# BillBuddy — Design

**Status**: shipped · 2026-10-13 (workstreams #2–#9 under [#1](https://github.com/asen23/BillBuddy/issues/1))
**Decisions of record**: [ADR-0001](adr/0001-client-only-byo-key-gemini.md), [ADR-0002](adr/0002-e2e-only-mocked-gemini.md) · **Vocabulary**: [GLOSSARY.md](../GLOSSARY.md)

## 1. Vision & principles

One job, done exactly: photograph a receipt, pick who shared what, show every member their exact total.

1. **Exact to the rupiah.** Member totals always reconcile with the receipt; rounding is explicit (see §5), never silent.
2. **Phone-first.** Splitting happens at the table. One thumb, one flow, big touch targets.
3. **Nothing disappears silently.** Unassigned items, failed extractions, and stuck jobs all surface in the UI with a next action.
4. **BYO key, client-only.** No backend, no accounts, no shared secret. The user's own Gemini key stays in their browser (ADR-0001).
5. **Tiny surface.** Three screens and a dialog; no state, feature, or abstraction that the flow does not need.

## 2. Product flows

**Happy path**: key gate → upload & crop → extraction ("Processing…" with the option to cancel) → members (add, name, color) → bill (edit items; tap member chips to assign; unassigned items flagged) → result (per-item breakdown per member + totals; New bill).

**Key gate**: on first visit with no stored key, a non-dismissable dialog asks for the Gemini API key. Reachable again anytime from the header ("Settings") to change it.

**Refresh anytime**: the wizard is route-based and the bill is persisted; a refresh mid-flow resumes on the same step with the same data.

**Extraction failure**: the bill screen shows what failed and offers Retry; no items are partially added; the uploaded file is always deleted from Gemini's store, success or failure.

## 3. Starting point (before this work)

A single 197-line client component (`src/app/page.tsx`) renders five pseudo-pages through nested ternaries; all state lives in three Zustand stores (`src/util/index.ts`) whose setters mutate arrays in place, one of which (`clearItem`) is broken and silently does nothing. Item `count` is captured but ignored by the result math, which divides unit price by member count; deleting a member then viewing the result crashes; Gemini failures leave a stuck "Processing…" screen and orphaned uploaded files. The Gemini model is hardcoded to `gemini-2.5-flash`, which is being retired. Dependencies date from July 2025; there are no tests, no CI, and the README is create-next-app boilerplate. (Detailed inventory in the modernization parent issue.)

## 4. Target architecture

### Routes (Next.js App Router, client-rendered)

| Route      | Screen  | Contents                                                                        |
| ---------- | ------- | ------------------------------------------------------------------------------- |
| `/`        | Upload  | Receipt picker, crop canvas, extract action, error/empty state                  |
| `/members` | Members | Member list (name + color), add/remove, continue                                |
| `/bill`    | Bill    | Item editor (count/name/unit price), assignment chips, unassigned flags, finish |
| `/result`  | Result  | Per-member shares and totals, receipt-tape styling, New bill                    |

A shared shell (route group) renders the header (theme toggle, key settings, New bill) and the step indicator. The key gate is a dialog owned by the shell, not a route.

### Modules

```
src/
├── app/                 # routes above + layout, globals.css
├── components/
│   ├── ui/              # shadcn/ui components, vendored
│   └── …                # shell pieces: AppShell, ApiKeyDialog, HydrationGate,
│                        # ThemeToggle, ThemeProvider, Logo
└── lib/
    ├── types.ts         # Bill, Item, Member, Share, MemberResult (domain types)
    ├── split.ts         # pure split math — no React, no store
    ├── receipt.ts       # Gemini extraction (upload → generate → cleanup)
    ├── stores.ts        # bill + apiKey Zustand stores (persisted, versioned)
    └── format.ts        # rupiah formatting (Intl, id-ID, no decimals)
```

### State

Two persisted, versioned stores replace the current three:

- `billbuddy.bill` — members, items. Immutable updates only. Explicit `resetBill` action (the "New bill" header action). Items now survive refresh.
- `billbuddy.apiKey` — the Gemini key. Named clearly; the old `secret`/`member` keys are abandoned (data is disposable, no migration).

### Data flow

```
receipt image ──crop──▶ Blob ──▶ Gemini (extract items JSON)
                                     │  validated
                                     ▼
                     bill store: items[] ──assign──▶ members[] ──▶
                     split.ts: shares + totals (per member, per item)
```

### Error handling

Extraction is an explicit state machine: `idle → uploading → extracting → idle | error`. An `error` carries a message and a Retry action (the cropped blob is kept so retrying needs no re-upload); while uploading or extracting, Cancel aborts the run. A 45-second timeout bounds every request. The uploaded file is deleted in `finally`, success or failure. The model name lives in one constant (`gemini-3.8-flash`); the Gemini API response is shape-checked before touching the store.

## 5. Domain model

Canonical terms live in [GLOSSARY.md](../GLOSSARY.md). Relationships:

- A **Bill** has many **Items** and many **Members**.
- An **Item** has an **Assignment**: zero or more Members. No members = **Unassigned** (flagged in Bill, shown separately in Result).
- An Item's **Line total** = **Unit price** × **Count**.
- A **Share** = Line total ÷ |Assignment|, in whole rupiah:
  `base = floor(lineTotal / n)`; the **Remainder** `r = lineTotal − base × n` is handed out one rupiah each to the first `r` members in list order.
- A **Member's Total** = Σ shares. Totals always sum exactly to the receipt.

Worked example: "Nasi Goreng", count 2, unit price Rp15.000 → line total Rp30.000; members A + B → base Rp15.000, no remainder. If the line total were Rp30.001, A would pay Rp15.001 and B Rp15.000.

## 6. UI direction

**Foundation**: shadcn/ui on Tailwind v4 — components vendored into `src/components/ui`, restyled with project tokens; Radix primitives underneath (accessible focus, keyboard, dialogs).

**Identity — "table receipt"**: warm paper background, ink-dark text, monospace (Geist Mono) for money and receipt-style rows, soft rounded cards, member colors as the only saturated accents. The Result screen reads like a printed receipt with dashed separators and a total block. Subtle motion only (fades/slides on step change, chip toggles); no confetti, no bounce.

**Tokens** (CSS variables, light + dark): `paper`, `ink`, `muted`, `accent`, plus shadcn semantic slots (`background`, `foreground`, `primary`, `destructive`, `border`…). Member colors come from a fixed 8-swatch palette chosen for contrast in both themes.

**Dark mode**: included. Class-based (`dark` on `<html>`), defaults to the system preference, toggled from the header, persisted.

**Mobile-first**: single-column, thumb-height controls; desktop is the same column, centered with a comfortable max width. Money is always formatted `Rp 30.000` (whole rupiah).

**Key screens**: Upload — a big "Take / choose photo" target and the crop surface. Members — chip rows with color swatch, name field, delete. Bill — receipt-like rows: count × name × unit price, member color dots that toggle assignment, an "Unassigned" flag on the row. Result — per-member cards with per-item lines ("2 × Rp15.000 — split 2 ways") and a bold Total.

## 7. Testing & CI

**Playwright, end to end** (ADR-0002): Chromium, mobile viewport, run against a production build (`next build && next start`). Gemini is mocked by intercepting `generativelanguage.googleapis.com` with fixture responses — no key, no cost, deterministic.

Specs: key-gate flow; upload → crop → extraction (mocked) → items appear; member CRUD; item editing; assignment toggling; split math (count > 1, remainder distribution, shared items); unassigned item flag + result section; per-member totals; extraction failure → Retry, cancel mid-run; New bill reset.

**CI** (GitHub Actions, Node 24): on PRs — lint → typecheck → build → e2e. E2e artifacts (trace, screenshot) uploaded on failure. No unit-test layer — the math is covered through the flow.

## 8. Delivery plan

Each workstream shipped as its own PR (squash-merged, signed); `main` stayed green after every merge.

1. **Design docs** — this file, GLOSSARY.md, ADR-0001/0002.
2. **Tooling & dependency modernization** — Next 16, React 19.3, newest supported TS/ESLint (flat config; `next lint` is gone), Prettier + Tailwind plugin, Node 24 pin, delete `tesseract.js` (dead) and default create-next-app assets.
3. **Core extraction** — `lib/types.ts`, `lib/split.ts` (pure, as §5), `lib/stores.ts` (single persisted bill store, immutable, `resetBill`), bug fixes.
4. **Routes & shell** — App Router pages, key-gate dialog, stepper, refresh-safe state.
5. **UI redesign** — shadcn foundation + tokens, then Upload, Members, Bill, Result; favicon + wordmark; dark mode toggle.
6. **Gemini pipeline** — `@google/genai` v2, `gemini-3.8-flash` constant, extraction state machine, cancel/timeout/retry, guaranteed file cleanup, response validation.
7. **E2e + CI** — Playwright specs and workflow as §7.
8. **Final docs pass** — README rewrite, page metadata, reconcile this document with what shipped.

## 9. Out of scope

No new product features beyond the above: no multi-currency, no language toggle (UI stays English), no accounts, no server proxy, no PWA/offline, no shareable result links, no analytics. No unit tests (ADR-0002), no cross-browser e2e beyond Chromium, no Docker/deploy configuration changes.
