# BillBuddy

Split a restaurant receipt with friends: photograph the receipt, BillBuddy reads the items with Gemini, you assign them to the people who shared them, and everyone sees their exact total — to the last rupiah.

## How it works

1. **Upload** — take or choose a photo of the receipt and crop it.
2. **Members** — add everyone who shared the bill (name + color).
3. **Bill** — check the extracted items, then tap member colors to assign each item. Items nobody is assigned to are flagged, never silently dropped.
4. **Result** — a receipt-style summary: per-item shares and each member's total.

Money is Indonesian rupiah, in whole numbers. Splits are exact: when a line total doesn't divide evenly, the leftover rupiah are handed out one at a time in member order, so totals always reconcile with the receipt.

## Setup

BillBuddy runs entirely in your browser and uses **your own Gemini API key** — there is no backend, and the key never leaves this device ([ADR-0001](docs/adr/0001-client-only-byo-key-gemini.md)).

1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. `npm install`
3. `npm run dev` and open [http://localhost:3000](http://localhost:3000) — BillBuddy asks for the key on first launch and keeps it in this browser only.

## Deploy

BillBuddy is a static export (`output: "export"`), published to GitHub Pages at
<https://asen23.github.io/BillBuddy/>. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds `out/` and deploys it on every push to `main` (the repo's Pages source must be
set to **GitHub Actions**). Nothing else to configure. See [ADR-0003](docs/adr/0003-static-export-github-pages.md).

## Scripts

| Script              | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Dev server                        |
| `npm run build`     | Static export to `out/`           |
| `npm start`         | Serve the `out/` export locally   |
| `npm run lint`      | ESLint (flat config)              |
| `npm run typecheck` | `tsc --noEmit`                    |
| `npm run format`    | Prettier (sorts Tailwind classes) |
| `npm run e2e`       | Playwright end-to-end tests       |

## Testing

End to end only, on purpose ([ADR-0002](docs/adr/0002-e2e-only-mocked-gemini.md)). Playwright drives a production build on a mobile viewport, with the Gemini API mocked at the network layer — the suite is key-free, deterministic, and covers the key gate, the full upload-to-result flow, extraction failures (Retry, empty reads, cancel), and the split math including remainders and unassigned items.

```sh
npm run build && npm run e2e
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, typecheck, build, and the e2e suite on every PR.

## Docs

- [docs/designs.md](docs/designs.md) — the design: routes, modules, domain rules, UI direction
- [GLOSSARY.md](GLOSSARY.md) — canonical vocabulary (Item, Member, Share, Remainder, …)
- [docs/adr/](docs/adr) — decisions of record
