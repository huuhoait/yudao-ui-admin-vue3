#!/usr/bin/env node
/**
 * i18n convert tool (AST-based) — chiến lược KEY NGỮ NGHĨA (phương án B).
 *
 * Chế độ:
 *   node scripts/i18n/convert.mjs <targetDir>              -> SCAN (chỉ đọc, ghi report)
 *   node scripts/i18n/convert.mjs <targetDir> --apply --dry -> APPLY dry-run (in diff, KHÔNG ghi)
 *   node scripts/i18n/convert.mjs <targetDir> --apply       -> APPLY thật (sửa file + locale)
 *
 * An toàn:
 *  - Bỏ comment.
 *  - Loại chuỗi so sánh / object-key / string-concat / template-động / filename -> report needReview.
 *  - Tái dùng key locale có sẵn (common.*, action.*) qua bảng REUSE.
 *  - Sinh key ngữ nghĩa qua PHRASE/PREFIX+NOUN; không map được -> _todoN (đánh dấu report).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'
import { REUSE, PHRASE, PREFIX, NOUN, REQUIRED_SUFFIX } from './dict.mjs'
import { loadGeneratedLocale, splitKey } from './locale-io.mjs'

const traverse = _traverse.default || _traverse
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const args = process.argv.slice(2)
// bỏ qua giá trị đứng sau --reuse khi dò targetDir
const targetArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--reuse')
const APPLY = args.includes('--apply')
const DRY = args.includes('--dry')
// --reuse <name>: nạp lại key từ src/locales/generated/<name>.zh-CN.ts để giữ key CŨ
// cho các chuỗi Trung đã từng convert. Cần thiết khi source đổi (nâng cấp upstream):
// không có nó, key _todoN bị đánh số lại và toàn bộ bản dịch en/vi cũ lệch key.
const reuseIdx = args.indexOf('--reuse')
const REUSE_NAME = reuseIdx >= 0 ? args[reuseIdx + 1] : null
if (!targetArg) {
  console.error(
    'Usage: node scripts/i18n/convert.mjs <targetDir> [--apply] [--dry] [--reuse <localeName>]'
  )
  process.exit(1)
}
const TARGET = join(ROOT, targetArg)
const CJK = /[\u4e00-\u9fa5]/

const TRANSLATABLE_ATTRS = new Set([
  'label',
  'placeholder',
  'title',
  'start-placeholder',
  'end-placeholder',
  'content',
  'description',
  'empty-text',
  'active-text',
  'inactive-text',
  'confirm-button-text',
  'cancel-button-text'
])
const FILE_EXT_IN_STRING = /\.(xls|xlsx|csv|pdf|zip|png|jpg|jpeg|json|txt|doc|docx)\b/i
// Chuỗi chứa HTML markup / entity -> KHÔNG dịch (là dữ liệu/markup, không phải label UI thuần).
const HTML_MARKUP = /<[a-zA-Z/][^>]*>|&nbsp;|&[a-z]+;|data-w-e-|style="/
const MAX_UI_LEN = 120 // chuỗi UI dài bất thường -> nghi ngờ là dữ liệu, đưa vào review

// ---------- namespace từ path ----------
function nsFromPath(relPath) {
  const parts = relPath.replace(/\\/g, '/').split('/')
  const idx = parts.indexOf('views')
  let segs = idx >= 0 ? parts.slice(idx + 1) : parts
  segs = segs.filter((s) => s && !/\.(vue|ts|tsx|js|jsx)$/.test(s))
  return segs.join('.')
}

// ---------- sinh key ngữ nghĩa ----------
// Cache gom trùng: cùng namespace + cùng chuỗi Trung -> cùng key.
const textKeyCache = new Map() // `${ns}::${text}` -> resolved

// Trả về { key, reuse, todo } cho 1 chuỗi Trung.
function resolveKey(ns, text, usedKeys) {
  const t = text.trim()

  // 0) gom trùng trong cùng namespace
  const cacheId = `${ns}::${t}`
  if (textKeyCache.has(cacheId)) return textKeyCache.get(cacheId)

  const resolved = resolveKeyInner(ns, t, usedKeys)
  textKeyCache.set(cacheId, resolved)
  return resolved
}

function resolveKeyInner(ns, t, usedKeys) {
  // 1) tái dùng key locale có sẵn
  if (REUSE[t]) return { key: REUSE[t], reuse: true }

  // 2) validation "xxx不能为空"
  if (t.endsWith(REQUIRED_SUFFIX)) {
    const stem = t.slice(0, -REQUIRED_SUFFIX.length)
    const noun = NOUN[stem] || PHRASE[stem]
    if (noun) {
      const base = typeof noun === 'string' ? noun : stem
      const name = lc(base) + 'Required'
      return uniq(ns, name, usedKeys)
    }
  }

  // 3) cụm cố định
  if (PHRASE[t]) return uniq(ns, PHRASE[t], usedKeys)

  // 4) prefix (请输入/请选择) + noun
  for (const [pre, preKey] of Object.entries(PREFIX)) {
    if (t.startsWith(pre)) {
      const rest = t.slice(pre.length)
      const noun = NOUN[rest] || (PHRASE[rest] ? cap(PHRASE[rest]) : null)
      if (noun) return uniq(ns, preKey + cap(noun), usedKeys)
    }
  }

  // 5) không map được -> _todo
  return uniq(ns, null, usedKeys, true)
}

function lc(s) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

let todoCounter = 0

// Tập TẤT CẢ namespace (và mọi prefix của chúng) sinh ra từ đường dẫn file.
// Dùng để CẤM sinh key lá trùng tên một namespace: locale là object lồng nhau nên
// `bpm.processInstance.detail = '详情'` và namespace `bpm.processInstance.detail.*`
// không thể cùng tồn tại — cái sau sẽ đè cái trước và NUỐT TOÀN BỘ key con.
const allNamespaces = new Set()

function isTaken(key, usedKeys) {
  return usedKeys.has(key) || allNamespaces.has(key)
}

function uniq(ns, name, usedKeys, isTodo = false) {
  if (isTodo || !name) {
    todoCounter++
    const key = `${ns}._todo${todoCounter}`
    return { key, todo: true }
  }
  let full = `${ns}.${name}`
  if (isTaken(full, usedKeys)) {
    let i = 2
    while (isTaken(`${ns}.${name}${i}`, usedKeys)) i++
    full = `${ns}.${name}${i}`
  }
  usedKeys.add(full)
  return { key: full }
}

// ---------- walk ----------
function walk(dir, out) {
  let st
  try {
    st = statSync(dir)
  } catch {
    return
  }
  if (st.isFile()) {
    if (['.vue', '.ts', '.tsx', '.js', '.jsx'].includes(extname(dir))) out.push(dir)
    return
  }
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    walk(join(dir, name), out)
  }
}

// ---------- Vue template analysis (trả về candidate có offset trong template) ----------
function analyzeVueTemplate(tpl) {
  const candidates = []
  const reviews = []
  const attrRe = /(\s)([a-zA-Z][a-zA-Z0-9-]*)="([^"]*)"/g
  let m
  while ((m = attrRe.exec(tpl)) !== null) {
    const [full, , attr, val] = m
    if (!CJK.test(val)) continue
    if (!TRANSLATABLE_ATTRS.has(attr)) {
      reviews.push({ kind: 'vue-attr-unlisted', attr, text: val })
      continue
    }
    if (HTML_MARKUP.test(val) || val.length > MAX_UI_LEN) {
      reviews.push({ kind: 'html-or-long', attr, text: val.slice(0, 60) })
      continue
    }
    candidates.push({
      type: 'vue-attr',
      attr,
      text: val,
      start: m.index,
      end: m.index + full.length,
      raw: full
    })
  }
  const textRe = />([^<>{}]*[\u4e00-\u9fa5][^<>{}]*)</g
  while ((m = textRe.exec(tpl)) !== null) {
    const inner = m[1]
    const trimmed = inner.trim()
    if (!trimmed || !CJK.test(trimmed)) continue
    if (HTML_MARKUP.test(inner) || trimmed.length > MAX_UI_LEN) {
      reviews.push({ kind: 'html-or-long', text: trimmed.slice(0, 60) })
      continue
    }
    candidates.push({
      type: 'vue-text',
      text: trimmed,
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
      leading: inner.match(/^\s*/)[0],
      trailing: inner.match(/\s*$/)[0]
    })
  }
  return { candidates, reviews }
}

// ---------- Script analysis ----------
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
    return {
      candidates,
      reviews: [{ kind: 'parse-error', text: String(e.message) }],
      parseError: true
    }
  }
  traverse(ast, {
    StringLiteral(path) {
      const val = path.node.value
      if (!CJK.test(val)) return
      const parent = path.parent

      // defineProps/withDefaults: default value bị hoist ra ngoài setup(),
      // KHÔNG được tham chiếu t() -> để review tay, không tự convert.
      const inPropsMacro = path.findParent(
        (p) =>
          p.isCallExpression() &&
          p.node.callee &&
          (p.node.callee.name === 'withDefaults' || p.node.callee.name === 'defineProps')
      )
      if (inPropsMacro) {
        reviews.push({ kind: 'defineProps-default', text: val })
        return
      }
      if (
        parent.type === 'BinaryExpression' &&
        ['===', '!==', '==', '!=', '>', '<', '>=', '<='].includes(parent.operator)
      ) {
        reviews.push({ kind: 'comparison', text: val })
        return
      }
      if (
        (parent.type === 'ObjectProperty' && parent.key === path.node) ||
        (parent.type === 'MemberExpression' && parent.property === path.node)
      ) {
        reviews.push({ kind: 'object-key', text: val })
        return
      }
      if (parent.type === 'BinaryExpression' && parent.operator === '+') {
        reviews.push({ kind: 'string-concat', text: val })
        return
      }
      if (parent.type === 'ImportDeclaration') return
      if (FILE_EXT_IN_STRING.test(val)) {
        reviews.push({ kind: 'filename', text: val })
        return
      }
      if (HTML_MARKUP.test(val) || val.length > MAX_UI_LEN) {
        reviews.push({ kind: 'html-or-long', text: val.slice(0, 60) })
        return
      }
      if (parent.type === 'CallExpression' && parent.callee && parent.callee.name === 't') return
      candidates.push({
        type: 'script-string',
        text: val,
        start: path.node.start,
        end: path.node.end
      })
    },
    TemplateLiteral(path) {
      const raw = code.slice(path.node.start, path.node.end)
      if (!CJK.test(raw)) return
      if (path.node.expressions.length > 0) {
        reviews.push({ kind: 'template-literal-dynamic', text: raw })
        return
      }
      const cooked = path.node.quasis.map((q) => q.value.cooked).join('')
      if (HTML_MARKUP.test(cooked) || cooked.length > MAX_UI_LEN) {
        reviews.push({ kind: 'html-or-long', text: cooked.slice(0, 60) })
        return
      }
      candidates.push({
        type: 'script-template',
        text: cooked,
        start: path.node.start,
        end: path.node.end
      })
    }
  })
  return { candidates, reviews }
}

// ---------- apply helpers ----------
// Thay thế trong 1 đoạn text theo danh sách edit {start,end,replacement}, xử lý từ cuối lên đầu.
function applyEdits(src, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start)
  let out = src
  for (const e of sorted) out = out.slice(0, e.start) + e.replacement + out.slice(e.end)
  return out
}

// Bảo đảm có `const { t } = useI18n()` trong <script setup>. Trả về nội dung script mới nếu cần thêm.
function ensureUseI18n(scriptContent) {
  if (/\buseI18n\s*\(/.test(scriptContent)) return { content: scriptContent, added: false }
  // chèn sau dòng defineOptions(...) nếu có, không thì sau import cuối.
  const lines = scriptContent.split('\n')
  let insertAt = 0
  let lastImport = -1
  let defineOptsAt = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImport = i
    if (/defineOptions\s*\(/.test(lines[i])) defineOptsAt = i
  }
  insertAt = defineOptsAt >= 0 ? defineOptsAt + 1 : lastImport + 1
  lines.splice(insertAt, 0, `const { t } = useI18n() // 国际化`)
  return { content: lines.join('\n'), added: true }
}

// ---------- main ----------
const files = []
walk(TARGET, files)

// Nạp trước mọi namespace + prefix của chúng để uniq() tránh đụng (xem allNamespaces).
for (const f of files) {
  const ns = nsFromPath(relative(ROOT, f))
  const parts = ns.split('.')
  for (let i = 1; i <= parts.length; i++) allNamespaces.add(parts.slice(0, i).join('.'))
}

const report = {
  mode: APPLY ? (DRY ? 'apply-dry' : 'apply') : 'scan',
  target: targetArg,
  scannedAt: new Date().toISOString(),
  totalFiles: files.length,
  toConvert: 0,
  needReview: 0,
  todoKeys: 0,
  files: []
}
const localeEntries = {} // key -> chuỗi Trung (chỉ cho key mới, không phải REUSE)
const usedKeys = new Set()

// ---------- seed key cũ (giữ key ổn định qua các lần nâng cấp upstream) ----------
// Nạp <name>.zh-CN.ts cũ: mỗi (namespace, chuỗi Trung) giữ lại đúng key đã dùng trước đó.
// Nhờ vậy bản dịch en/vi cũ vẫn khớp key, chỉ chuỗi MỚI mới sinh key mới.
if (REUSE_NAME) {
  // Cho phép nhiều nguồn: `--reuse system,user` (module user từng được convert riêng
  // nên key system.user.* nằm ở user.zh-CN.ts, không phải system.zh-CN.ts).
  const oldFlat = {}
  for (const nm of REUSE_NAME.split(',').map((s) => s.trim()).filter(Boolean)) {
    Object.assign(
      oldFlat,
      loadGeneratedLocale(join(ROOT, 'src', 'locales', 'generated', `${nm}.zh-CN.ts`))
    )
  }
  let maxTodo = 0
  for (const [key, zh] of Object.entries(oldFlat)) {
    const [ns, name] = splitKey(key)
    // Key cũ trùng tên namespace là key HỎNG (sinh ra bởi bản tool trước khi có
    // allNamespaces) — bỏ qua để nó được đặt lại tên, tránh nuốt cây key con.
    if (allNamespaces.has(key)) continue
    usedKeys.add(key)
    const m = /^_todo(\d+)$/.exec(name)
    if (m) maxTodo = Math.max(maxTodo, Number(m[1]))
    const cacheId = `${ns}::${zh}`
    if (!textKeyCache.has(cacheId)) textKeyCache.set(cacheId, { key, todo: !!m })
  }
  // key _todo mới phải bắt đầu sau số lớn nhất đang dùng, tránh đụng key cũ
  todoCounter = maxTodo
  report.reusedKeys = Object.keys(oldFlat).length
  console.log(`Reuse: ${report.reusedKeys} key cũ từ ${REUSE_NAME}.zh-CN.ts (_todo tiếp tục từ ${maxTodo + 1})`)
}

for (const file of files) {
  const rel = relative(ROOT, file)
  const ext = extname(file)
  let content = readFileSync(file, 'utf8')
  if (!CJK.test(content)) continue
  const ns = nsFromPath(rel)
  const fileEntry = { file: rel, ns, convert: [], review: [] }

  if (ext === '.vue') {
    const { descriptor } = parseSFC(content)
    const tplBlock = descriptor.template
    const scriptBlock = descriptor.scriptSetup || descriptor.script

    // build template edits
    let newTemplate = tplBlock ? tplBlock.content : null
    let scriptContent = scriptBlock ? scriptBlock.content : null

    if (tplBlock) {
      const { candidates, reviews } = analyzeVueTemplate(tplBlock.content)
      const edits = []
      for (const c of candidates) {
        const rk = resolveKey(ns, c.text, usedKeys)
        if (!rk.reuse) localeEntries[rk.key] = c.text
        if (rk.todo) report.todoKeys++
        fileEntry.convert.push({
          type: c.type,
          attr: c.attr,
          text: c.text,
          key: rk.key,
          reuse: !!rk.reuse,
          todo: !!rk.todo
        })
        if (c.type === 'vue-attr') {
          edits.push({
            start: c.start,
            end: c.end,
            replacement: `${c.raw[0]}:${c.attr}="t('${rk.key}')"`
          })
        } else {
          edits.push({
            start: c.start,
            end: c.end,
            replacement: `>${c.leading}{{ t('${rk.key}') }}${c.trailing}<`
          })
        }
      }
      for (const r of reviews) fileEntry.review.push({ where: 'template', ...r })
      if (APPLY) newTemplate = applyEdits(tplBlock.content, edits)
    }

    if (scriptBlock) {
      // script có thể lang="tsx"/"jsx" -> cần bật plugin jsx cho babel
      const scriptIsJsx = /(tsx|jsx)/.test(scriptBlock.lang || '')
      const { candidates, reviews } = analyzeScript(scriptBlock.content, scriptIsJsx)
      const edits = []
      for (const c of candidates) {
        const rk = resolveKey(ns, c.text, usedKeys)
        if (!rk.reuse) localeEntries[rk.key] = c.text
        if (rk.todo) report.todoKeys++
        fileEntry.convert.push({
          type: c.type,
          text: c.text,
          key: rk.key,
          reuse: !!rk.reuse,
          todo: !!rk.todo
        })
        edits.push({ start: c.start, end: c.end, replacement: `t('${rk.key}')` })
      }
      for (const r of reviews) fileEntry.review.push({ where: 'script', ...r })
      if (APPLY) {
        scriptContent = applyEdits(scriptBlock.content, edits)
        if (edits.length) {
          const ensured = ensureUseI18n(scriptContent)
          scriptContent = ensured.content
        }
      }
    }

    if (
      APPLY &&
      (newTemplate !== (tplBlock && tplBlock.content) ||
        scriptContent !== (scriptBlock && scriptBlock.content))
    ) {
      let out = content
      if (scriptBlock && scriptContent !== scriptBlock.content) {
        out =
          out.slice(0, scriptBlock.loc.start.offset) +
          scriptContent +
          out.slice(scriptBlock.loc.end.offset)
      }
      // template offset phải tính lại nếu script nằm trước template; ở SFC yudao script luôn sau template,
      // nên thay template trước rồi script sau sẽ lệch offset. Xử lý: thay theo offset giảm dần.
      // Đơn giản & an toàn: rebuild bằng cách thay từng block theo offset gốc, xử lý block có offset lớn trước.
      const blocks = []
      if (tplBlock && newTemplate !== tplBlock.content)
        blocks.push({ s: tplBlock.loc.start.offset, e: tplBlock.loc.end.offset, c: newTemplate })
      if (scriptBlock && scriptContent !== scriptBlock.content)
        blocks.push({
          s: scriptBlock.loc.start.offset,
          e: scriptBlock.loc.end.offset,
          c: scriptContent
        })
      blocks.sort((a, b) => b.s - a.s)
      out = content
      for (const b of blocks) out = out.slice(0, b.s) + b.c + out.slice(b.e)
      writeFileOrDiff(file, content, out)
    }
  } else {
    const isTsx = ext === '.tsx' || ext === '.jsx'
    const { candidates, reviews } = analyzeScript(content, isTsx)
    const edits = []
    for (const c of candidates) {
      const rk = resolveKey(ns, c.text, usedKeys)
      if (!rk.reuse) localeEntries[rk.key] = c.text
      if (rk.todo) report.todoKeys++
      fileEntry.convert.push({
        type: c.type,
        text: c.text,
        key: rk.key,
        reuse: !!rk.reuse,
        todo: !!rk.todo
      })
      edits.push({ start: c.start, end: c.end, replacement: `t('${rk.key}')` })
    }
    for (const r of reviews) fileEntry.review.push({ ...r })
    if (APPLY && edits.length) {
      const out = applyEdits(content, edits)
      writeFileOrDiff(file, content, out)
    }
  }

  if (fileEntry.convert.length || fileEntry.review.length) {
    report.toConvert += fileEntry.convert.length
    report.needReview += fileEntry.review.length
    report.files.push(fileEntry)
  }
}

// ghi report + locale delta
const reportPath = join(__dirname, `report-${basename(targetArg)}.json`)
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
const localePath = join(__dirname, `locale-delta-${basename(targetArg)}.json`)
writeFileSync(localePath, JSON.stringify(localeEntries, null, 2), 'utf8')

function writeFileOrDiff(file, before, after) {
  if (before === after) return
  if (DRY) {
    console.log(`\n----- DIFF ${relative(ROOT, file)} -----`)
    printMiniDiff(before, after)
  } else {
    // backup trước khi ghi đè (an toàn vì repo không dùng git)
    writeFileSync(file + '.i18nbak', before, 'utf8')
    writeFileSync(file, after, 'utf8')
    console.log(`  ✎ updated ${relative(ROOT, file)} (backup: ${relative(ROOT, file)}.i18nbak)`)
  }
}
function printMiniDiff(before, after) {
  const a = before.split('\n'),
    b = after.split('\n')
  const max = Math.max(a.length, b.length)
  let shown = 0
  for (let i = 0; i < max && shown < 40; i++) {
    if (a[i] !== b[i]) {
      if (a[i] !== undefined) console.log(`  - ${a[i]}`)
      if (b[i] !== undefined) console.log(`  + ${b[i]}`)
      shown++
    }
  }
}

console.log('===== i18n CONVERT (AST, key ngữ nghĩa) =====')
console.log('Mode:', report.mode, '| Target:', targetArg)
console.log(
  'Files:',
  report.totalFiles,
  '| convert:',
  report.toConvert,
  '| review:',
  report.needReview,
  '| _todo keys:',
  report.todoKeys
)
console.log('Report:', relative(ROOT, reportPath))
console.log(
  'Locale delta (key mới):',
  relative(ROOT, localePath),
  '=>',
  Object.keys(localeEntries).length,
  'keys'
)
