# Changelog

## v0.6.0 — Infinia Creative Studio

First public release of *Infinia Creative Studio*, rebranded from Infinia
Office and published under the Infinia Labs product family.

### Added

- **Markdown editor** — Tiptap block editing over a Markdown document model,
  Mermaid diagrams and KaTeX math, a raw source pane, and exports to PDF and
  Word. Untouched blocks serialize byte-for-byte so diffs stay clean.
- **HTML editor** — CodeMirror source pane with a live, sandboxed preview,
  click-to-restyle of preview elements, a design-brief flow for AI-authored
  pages, and single-file HTML export.
- **Infinia Studio document-AI service** (`@infinia/doc-ai`) — sign in to
  <https://agenticocr.oneinfinia.ai>, mint a long-lived `pv_…` API key, and
  run OCR, PDF operations, conversions and generation. The key is stored
  encrypted with the OS keychain.
- **PDF document-AI actions** — OCR (fast/premium), Smart Extract, PDF → Word
  and Markdown, compress, merge, split, rotate, extract pages, and PDF → images
  surfaced in the PDF editor.

### Changed

- Product renamed from **Infinia Office** to **Infinia Creative Studio**;
  `appId` is now `ai.infinialabs.creative-studio`. Existing Office user data
  (settings, recents, encrypted tokens) is migrated on first launch.
- Help menu adds **User Guides**, opening
  <https://creative-studio.infinialabs.ai/guides/>.

### Notes

- macOS builds are ad-hoc signed and not notarized. Windows installers are
  unsigned.

