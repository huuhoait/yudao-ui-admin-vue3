#!/usr/bin/env node
/**
 * Chuyển chuỗi hiển thị tiếng Trung -> tiếng Anh TẠI CHỖ (không dùng i18n key).
 *
 * Khác `replace-en.mjs` (đã gây lỗi chuỗi lai Trung-Anh): script này
 *  - dùng AST (@vue/compiler-sfc + @babel) để chỉ đụng vào vị trí HIỂN THỊ,
 *  - khớp NGUYÊN chuỗi (whole string), KHÔNG bao giờ thay chuỗi con,
 *  - KHÔNG đụng comment, chuỗi so sánh, object key, tên file, HTML markup.
 *
 * Usage:
 *   node scripts/i18n/to-en.mjs <targetDir> --map <mapFile.mjs>            # scan
 *   node scripts/i18n/to-en.mjs <targetDir> --map <mapFile.mjs> --apply --dry
 *   node scripts/i18n/to-en.mjs <targetDir> --map <mapFile.mjs> --apply
 *
 * File map export `EN = { '中文': 'English' }`.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'

const traverse = _traverse.default || _traverse
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const args = process.argv.slice(2)
const targetArg = args.find((a) => !a.startsWith('--'))
const mapIdx = args.indexOf('--map')
const mapArg = mapIdx >= 0 ? args[mapIdx + 1] : null
const APPLY = args.includes('--apply')
const DRY = args.includes('--dry')
if (!targetArg || !mapArg) {
  console.error('Usage: node scripts/i18n/to-en.mjs <targetDir> --map <mapFile.mjs> [--apply] [--dry]')
  process.exit(1)
}
const TARGET = join(ROOT, targetArg)
const { EN } = await import(new URL(`file://${join(ROOT, mapArg)}`).href)

const CJK = /[一-龥]/
const HTML_MARKUP = /<[a-zA-Z/][^>]*>|&nbsp;|&[a-z]+;|data-w-e-|style="/
const FILE_EXT_IN_STRING = /\.(xls|xlsx|csv|pdf|zip|png|jpg|jpeg|json|txt|doc|docx)\b/i
const MAX_UI_LEN = 200

// Attribute tĩnh được phép dịch (giá trị là nhãn hiển thị, không phải dữ liệu/logic).
const TRANSLATABLE_ATTRS = new Set([
  'label', 'title', 'placeholder', 'content', 'header', 'description', 'text',
  'empty-text', 'confirm-button-text', 'cancel-button-text', 'active-text',
  'inactive-text', 'tooltip', 'alt', 'sub-title', 'check-strictly-text'
])

// ---------- walk ----------
function walk(dir, out) {
  let st
  try { st = statSync(dir) } catch { return }
  if (st.isFile()) {
    if (['.vue', '.ts', '.tsx', '.js', '.jsx'].includes(extname(dir))) out.push(dir)
    return
  }
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    walk(join(dir, name), out)
  }
}

// ---------- Vue template ----------
function analyzeVueTemplate(tpl) {
  const candidates = []
  const reviews = []
  const attrRe = /(\s)([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/g
  let m
  while ((m = attrRe.exec(tpl)) !== null) {
    const [full, ws, attr, val] = m
    if (!CJK.test(val)) continue
    if (!TRANSLATABLE_ATTRS.has(attr)) {
      reviews.push({ kind: 'vue-attr-unlisted', attr, text: val })
      continue
    }
    if (HTML_MARKUP.test(val) || val.length > MAX_UI_LEN) {
      reviews.push({ kind: 'html-or-long', attr, text: val })
      continue
    }
    candidates.push({
      type: 'vue-attr', attr, text: val,
      start: m.index, end: m.index + full.length,
      mk: (en) => `${ws}${attr}="${en}"`
    })
  }
  const textRe = />([^<>{}]*[一-龥][^<>{}]*)</g
  while ((m = textRe.exec(tpl)) !== null) {
    const inner = m[1]
    const trimmed = inner.trim()
    if (!trimmed) continue
    if (HTML_MARKUP.test(inner) || trimmed.length > MAX_UI_LEN) {
      reviews.push({ kind: 'html-or-long', text: trimmed })
      continue
    }
    const leading = inner.match(/^\s*/)[0]
    const trailing = inner.match(/\s*$/)[0]
    candidates.push({
      type: 'vue-text', text: trimmed,
      start: m.index, end: m.index + m[0].length,
      mk: (en) => `>${leading}${en}${trailing}<`
    })
  }
  // Chuỗi Trung trong biểu thức binding (:label="`${x}人`", v-if="a === '中文'"...) -> review tay.
  const bindRe = /(\s)(:[a-zA-Z][\w-]*|v-[a-zA-Z][\w-]*)="([^"]*)"/g
  while ((m = bindRe.exec(tpl)) !== null) {
    if (CJK.test(m[3])) reviews.push({ kind: 'vue-binding-expression', attr: m[2], text: m[3] })
  }
  // Interpolation {{ ... }} có chữ Trung.
  const mustacheRe = /\{\{([^}]*)\}\}/g
  while ((m = mustacheRe.exec(tpl)) !== null) {
    if (CJK.test(m[1])) reviews.push({ kind: 'vue-interpolation', text: m[1].trim() })
  }
  return { candidates, reviews }
}

// ---------- Script ----------
function quote(raw, en) {
  const q = raw[0] === '"' ? '"' : "'"
  const body = en.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q)
  return q + body + q
}

function analyzeScript(code, isTsx) {
  const candidates = []
  const reviews = []
  let ast
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', ...(isTsx ? ['jsx'] : []), 'decorators-legacy']
    })
  } catch (e) {
    return { candidates, reviews: [{ kind: 'parse-error', text: String(e.message) }] }
  }
  traverse(ast, {
    StringLiteral(path) {
      const val = path.node.value
      if (!CJK.test(val)) return
      const parent = path.parent
      if (parent.type === 'ImportDeclaration') return
      if (
        parent.type === 'BinaryExpression' &&
        ['===', '!==', '==', '!=', '>', '<', '>=', '<='].includes(parent.operator)
      ) return void reviews.push({ kind: 'comparison', text: val })
      if (
        (parent.type === 'ObjectProperty' && parent.key === path.node) ||
        (parent.type === 'MemberExpression' && parent.property === path.node)
      ) return void reviews.push({ kind: 'object-key', text: val })
      if (parent.type === 'BinaryExpression' && parent.operator === '+')
        return void reviews.push({ kind: 'string-concat', text: val })
      if (FILE_EXT_IN_STRING.test(val)) return void reviews.push({ kind: 'filename', text: val })
      if (HTML_MARKUP.test(val) || val.length > MAX_UI_LEN)
        return void reviews.push({ kind: 'html-or-long', text: val })
      const raw = code.slice(path.node.start, path.node.end)
      candidates.push({
        type: 'script-string', text: val,
        start: path.node.start, end: path.node.end,
        mk: (en) => quote(raw, en)
      })
    },
    TemplateLiteral(path) {
      const raw = code.slice(path.node.start, path.node.end)
      if (!CJK.test(raw)) return
      if (path.node.expressions.length > 0)
        return void reviews.push({ kind: 'template-literal-dynamic', text: raw })
      const cooked = path.node.quasis.map((q) => q.value.cooked).join('')
      if (HTML_MARKUP.test(cooked) || cooked.length > MAX_UI_LEN)
        return void reviews.push({ kind: 'html-or-long', text: cooked })
      candidates.push({
        type: 'script-template', text: cooked,
        start: path.node.start, end: path.node.end,
        mk: (en) => '`' + en.replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`'
      })
    }
  })
  return { candidates, reviews }
}

function applyEdits(src, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start)
  let out = src
  for (const e of sorted) out = out.slice(0, e.start) + e.replacement + out.slice(e.end)
  return out
}

// ---------- main ----------
const files = []
walk(TARGET, files)

const report = {
  mode: APPLY ? (DRY ? 'apply-dry' : 'apply') : 'scan',
  target: targetArg, map: mapArg,
  scannedAt: new Date().toISOString(),
  totalFiles: files.length,
  replaced: 0, missing: 0, review: 0,
  missingStrings: {}, files: []
}

function handle(candidates, fileEntry) {
  const edits = []
  for (const c of candidates) {
    const en = EN[c.text]
    if (en === undefined) {
      report.missing++
      report.missingStrings[c.text] = (report.missingStrings[c.text] || 0) + 1
      fileEntry.missing.push({ type: c.type, attr: c.attr, text: c.text })
      continue
    }
    if (en === null || en === '') continue // cố ý bỏ qua
    report.replaced++
    fileEntry.replaced.push({ type: c.type, attr: c.attr, zh: c.text, en })
    edits.push({ start: c.start, end: c.end, replacement: c.mk(en) })
  }
  return edits
}

for (const file of files) {
  const rel = relative(ROOT, file)
  const ext = extname(file)
  const content = readFileSync(file, 'utf8')
  if (!CJK.test(content)) continue
  const fileEntry = { file: rel, replaced: [], missing: [], review: [] }

  if (ext === '.vue') {
    const { descriptor } = parseSFC(content)
    const tplBlock = descriptor.template
    const scriptBlocks = [descriptor.scriptSetup, descriptor.script].filter(Boolean)
    const blocks = []

    if (tplBlock) {
      const { candidates, reviews } = analyzeVueTemplate(tplBlock.content)
      const edits = handle(candidates, fileEntry)
      for (const r of reviews) fileEntry.review.push({ where: 'template', ...r })
      if (edits.length) {
        blocks.push({
          s: tplBlock.loc.start.offset, e: tplBlock.loc.end.offset,
          c: applyEdits(tplBlock.content, edits)
        })
      }
    }
    for (const sb of scriptBlocks) {
      const isJsx = /(tsx|jsx)/.test(sb.lang || '')
      const { candidates, reviews } = analyzeScript(sb.content, isJsx)
      const edits = handle(candidates, fileEntry)
      for (const r of reviews) fileEntry.review.push({ where: 'script', ...r })
      if (edits.length) {
        blocks.push({ s: sb.loc.start.offset, e: sb.loc.end.offset, c: applyEdits(sb.content, edits) })
      }
    }
    if (APPLY && blocks.length) {
      blocks.sort((a, b) => b.s - a.s)
      let out = content
      for (const b of blocks) out = out.slice(0, b.s) + b.c + out.slice(b.e)
      writeFileOrDiff(file, content, out)
    }
  } else {
    const { candidates, reviews } = analyzeScript(content, ext === '.tsx' || ext === '.jsx')
    const edits = handle(candidates, fileEntry)
    for (const r of reviews) fileEntry.review.push(r)
    if (APPLY && edits.length) writeFileOrDiff(file, content, applyEdits(content, edits))
  }

  if (fileEntry.replaced.length || fileEntry.missing.length || fileEntry.review.length) {
    report.review += fileEntry.review.length
    report.files.push(fileEntry)
  }
}

const reportPath = join(__dirname, `report-en-${basename(targetArg)}.json`)
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

function writeFileOrDiff(file, before, after) {
  if (before === after) return
  if (DRY) {
    console.log(`\n----- DIFF ${relative(ROOT, file)} -----`)
    const a = before.split('\n'), b = after.split('\n')
    let shown = 0
    for (let i = 0; i < Math.max(a.length, b.length) && shown < 30; i++) {
      if (a[i] !== b[i]) {
        if (a[i] !== undefined) console.log(`  - ${a[i]}`)
        if (b[i] !== undefined) console.log(`  + ${b[i]}`)
        shown++
      }
    }
  } else {
    writeFileSync(file, after, 'utf8')
    console.log(`  ✎ ${relative(ROOT, file)}`)
  }
}

console.log('===== ZH -> EN (AST, thay nguyên chuỗi) =====')
console.log('Mode:', report.mode, '| Target:', targetArg, '| Map:', mapArg)
console.log('Files:', report.totalFiles, '| replaced:', report.replaced,
  '| missing:', report.missing, '(unique', Object.keys(report.missingStrings).length + ')',
  '| review:', report.review)
console.log('Report:', relative(ROOT, reportPath))
