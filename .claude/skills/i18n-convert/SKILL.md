---
name: i18n-convert
description: >-
  Apply or re-apply the project's 3-language i18n (zh-CN/en/vi) to system and bpm,
  and the English-only string replacement for bpmnProcessDesigner and
  SimpleProcessDesignerV2, using the AST-based tools in scripts/i18n/. Use whenever
  the user asks to localize/internationalize this codebase, convert Chinese UI text
  to i18n keys or to English, re-run i18n after pulling a new upstream
  yudao-ui-admin-vue3 version (Chinese text reappears because upstream overwrites
  local source), or mentions "đa ngôn ngữ", "i18n", "convert i18n", "dịch tiếng
  Anh cho BPMN/Simple designer", "nâng cấp upstream mất bản dịch".
---

# i18n Convert / Upgrade Playbook

This project already has a working AST-based i18n toolkit at `scripts/i18n/` (see
`scripts/i18n/README.md` for the full tool reference — read it before running anything).
This file is the **orchestration playbook**: when to invoke which tool, in what order,
and the gotchas that don't show up until runtime.

## Two different sub-workflows — pick the right one

| Target | Method | Why |
|---|---|---|
| `src/views/system/**`, `src/views/bpm/**` (and any other business module) | Full i18n via `convert.mjs` + `t('key')` + `gen-locale.mjs` | Needs 3 languages (zh-CN/en/vi), user-switchable at runtime. |
| `src/components/bpmnProcessDesigner/**`, `src/components/SimpleProcessDesignerV2/**` | Direct string replace via `to-en.mjs` + `*-en-map.mjs` | Requirement here is English-only display, not real i18n — these are vendored/forked designer libraries, not worth the key-based machinery. |

Never mix them: don't run `convert.mjs` on the two designer directories, and don't hand-roll
`t()` calls there — follow the existing pattern in `ProcessDesigner.vue` /
`SimpleProcessModel.vue` instead.

## Before touching anything

1. `git status` — if the working tree already has unrelated uncommitted changes, stash or
   note them; never let this workflow's edits get mixed into an unrelated diff silently.
2. Snapshot the directories you're about to touch to a scratch dir (`cp -R`) — this repo's
   safety net is `.i18nbak` per-file backups from `convert.mjs`, but a directory-level
   snapshot is cheap insurance and makes it trivial to diff "what did this workflow change"
   independently of unrelated concurrent edits (this repo has been observed to have another
   process/session auto-committing on top of the working tree — check `git log` for
   surprise commits before assuming your edits are the only ones in flight).
3. Confirm the AST parsers resolve: `node -e "import('@vue/compiler-sfc')"`. If
   `node_modules` is missing or `pnpm install` fails with a supply-chain / tarball-URL
   policy error (this repo's lockfile points at `registry.npmmirror.com`), do **not** fight
   the policy — install just the 3 parsers needed from `registry.npmjs.org` into a scratch
   dir and symlink them into `node_modules/@vue` and `node_modules/@babel`. Full recipe in
   `scripts/i18n/README.md` under "Môi trường". This unblocks every tool in this playbook
   without needing a working dev server.

## Full i18n (system, bpm, or any new module)

1. **Scan with `--reuse`, always**, even for a module you think has never been converted —
   if it has generated locale files under `src/locales/generated/<name>.zh-CN.ts`, `--reuse`
   is what keeps existing keys (including `_todoN`) stable instead of renumbering and
   orphaning every hand-translated en/vi string:
   ```bash
   node scripts/i18n/convert.mjs src/views/<module> --reuse <name>[,<name2>...]
   ```
   Read the `Reuse: N key cũ...` log line. Cross-check `locale-delta-<name>.json` against
   the old `<name>.zh-CN.ts` to see how many keys are genuinely NEW vs recovered — a large
   "new" count on a module you thought was already localized usually means the reuse source
   name is wrong (module was split/renamed) or upstream restructured that section.
2. Skim `report-<name>.json`'s `review` entries (comparison / object-key / string-concat /
   template-literal-dynamic / defineProps-default / vue-attr-unlisted / html-or-long) —
   these are exactly the strings `convert.mjs` refuses to touch automatically because doing
   so mechanically would be unsafe. Handle them by hand after the apply step (see below).
3. `--apply --dry` to preview, then `--apply` for real.
4. `node scripts/i18n/gen-locale.mjs <name>` — regenerates all 3 locale files, pulling
   translations forward via translation memory. Check the `chưa dịch en:/vi:` counts and
   `untranslated-<name>.json` for genuinely new strings needing translation.
5. Translate the genuinely-new strings and add them via
   `node scripts/i18n/apply-translations.mjs <name> scripts/i18n/manual-<name>.json`
   (see README for the JSON shape, and the `extra` field for keys outside `convert.mjs`'s
   reach — `defineProps` defaults, concatenated strings needing placeholders).
6. Fix the `review` items by hand, in source:
   - **`defineProps`/`withDefaults` default with Chinese text** — the default is hoisted
     outside `setup()`, so `t()` isn't callable there. Pattern: set the default to `''`,
     then in the template use `:placeholder="placeholder || t('module.key')"`. Add that key
     via `apply-translations.mjs`'s `extra` (it won't exist in `locale-delta` since
     `convert.mjs` never touched it).
   - **String concatenation / dynamic template literals** (`'A' + b + 'C'`,
     `` `请选择${x.name}的审批人` ``) — replace with `t('module.key', { x: x.name })` and add
     a placeholder-bearing key via `extra`. Use `{name}` for real placeholders and
     `{'{'}`/`{'}'}` only where a literal brace must be *displayed*.
   - **Comparison / object-key strings** — almost always must stay untouched (they're
     compared against or persisted as data, e.g. `if (x === '已完成')`, BPMN XML attribute
     values). Confirm before changing; when in doubt, leave it and move on.
7. Verify — run all four, not just the ones that seem relevant:
   ```bash
   node scripts/i18n/check-zh.mjs src/views/<module>
   node scripts/i18n/compile-check.mjs src/views/<module>
   node scripts/i18n/check-keys.mjs src/views/<module>
   node scripts/i18n/check-tdz.mjs src
   ```
   All four catch bugs that are silent at runtime (vue-i18n is configured with
   `silentTranslationWarn: true`, so a missing key just prints the key itself — nothing
   throws until a specific screen is opened). `check-tdz.mjs` in particular catches a subtle
   crash: if upstream already declares `const { t } = useI18n()` but late in the file (after
   a top-level `const columns = [...]`), and `convert.mjs` inserts `t()` calls into that
   early constant (because it detected `useI18n` already present and skipped adding its own
   declaration), the module throws `ReferenceError: Cannot access 't' before
   initialization` the instant it's imported. Fix by moving the existing declaration up
   next to `defineOptions(...)`.
8. `find src/views/<module> -name "*.i18nbak" -delete` once verification is clean.

## English-only (bpmnProcessDesigner / SimpleProcessDesignerV2)

```bash
node scripts/i18n/to-en.mjs src/components/<dir> --map scripts/i18n/<map>.mjs               # scan
# add missing strings to the map file, rescan until missing = 0
node scripts/i18n/to-en.mjs src/components/<dir> --map scripts/i18n/<map>.mjs --apply --dry  # preview
node scripts/i18n/to-en.mjs src/components/<dir> --map scripts/i18n/<map>.mjs --apply        # write
```
- Never resurrect `replace-en.mjs` (deleted) or write a substring-based replacer — it
  previously corrupted ~605 spots with mixed Chinese-English strings by replacing inside
  comments and logic. `to-en.mjs` only replaces whole strings at AST-verified display
  positions.
- `report-en-<dir>.json`'s `review` list has the same categories as above, plus
  `vue-binding-expression` and `vue-attr-unlisted` — same manual-fix rules apply, translate
  to plain English literals instead of `t()` calls (no i18n key here).
- **Never translate values that get persisted** — e.g. `value="异步前"` / `value="异步后"` /
  `value="排除"` in bpmnProcessDesigner are stored into BPMN XML; changing them breaks
  existing saved process data. Only the paired `label` should be translated. Same rule for
  any enum-like value used both as `:label` and `:value` in a `v-for` (e.g. the process
  listener event picker) — if it's also the value persisted to the backend, leave it as-is
  even if that means the value stays in Chinese/the source language.
- For bpmnProcessDesigner specifically: check whether `ProcessDesigner.vue` still imports
  `plugins/translate/zh.js` (bpmn-js's own Chinese translation table for palette/canvas
  labels — separate from this repo's UI strings). If present, stop passing it to
  `customTranslate(...)` (pass `{}` or the `translations` prop instead) so bpmn-js falls
  back to its native English labels. Do not delete `zh.js` itself — just stop wiring it in.
- After apply, run `check-zh.mjs` on the directory (`--ignore` the untouched
  `translate/zh.js` / dead `template.js` files) — it catches the same interpolation-adjacent
  blind spot as the full-i18n path (`{{ x }}人为空时`-style text nodes).

## Known gotchas (condensed — see `scripts/i18n/README.md` for full detail)

- vue-i18n treats `{` `}` as placeholder syntax. A literal brace must be escaped as
  `{'{'}` / `{'}'}`, and that escape must be applied in a **single pass** — escaping `{`
  then `}` separately double-escapes the closing brace the first pass just produced.
- A locale key that is both a leaf value AND the namespace prefix of other keys
  (`bpm.processInstance.detail = "详情"` alongside `bpm.processInstance.detail.task = ...`)
  silently drops the entire child subtree when serialized to a nested object — the tooling
  now detects and renames the colliding leaf, but this is the kind of thing to sanity-check
  if a nested locale file looks unexpectedly small.
- `gen-locale.mjs` rewrites a locale file's key set to exactly match
  `locale-delta-<name>.json`. Manually-added keys (`apply-translations.mjs --extra`) live
  outside that set and get silently dropped if `gen-locale.mjs` runs again afterward —
  always re-apply the manual JSON as the last step, every time.
