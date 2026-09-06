#!/usr/bin/env node
/**
 * Bắt lỗi THIẾU HẲN `const { t } = useI18n()`: file gọi `t(...)` (trong <template>
 * hoặc <script>, hoặc trong file .ts/.tsx thường) nhưng không có binding nào cho
 * định danh `t` trong phạm vi gọi đó.
 *
 * Khác với check-tdz.mjs: check-tdz.mjs CHỦ ĐỘNG bỏ qua file không có `useI18n(`
 * (dòng `if (!/useI18n\s*\(/.test(code)) continue`) vì nó chỉ quan tâm THỨ TỰ khai
 * báo. Script này bắt đúng phần check-tdz.mjs bỏ qua: file gọi `t()` mà KHÔNG hề có
 * `const { t } = useI18n()` (hay bất kỳ binding nào khác cho `t`) ở đâu cả — không
 * phải lỗi thứ tự, mà là thiếu hẳn.
 *
 * Vì sao lỗi này lọt lưới: dự án tự động import `useI18n` qua unplugin-auto-import
 * (xem build/vite/index.ts), nhưng KHÔNG tự động import `t` — luôn phải tự
 * `const { t } = useI18n()` rồi mới destructure ra `t`. Lỗi xảy ra khi:
 *   - convert.mjs chèn `t()` vào template nhưng vì lý do nào đó bước tự thêm
 *     `const { t } = useI18n()` vào <script setup> không chạy (file bị sửa tay sau
 *     đó, hoặc merge conflict khi nâng cấp upstream làm mất dòng khai báo).
 *   - File .ts/.tsx THƯỜNG (không phải .vue, không có <script setup>) gọi `t()`
 *     trực tiếp — ví dụ một hàm render dùng cho thư viện ngoài (snabbdom, class
 *     factory cho menu/plugin bên thứ ba). convert.mjs/to-en.mjs chỉ tự chèn
 *     `useI18n()` vào <script setup> của .vue, KHÔNG đụng tới .ts thường.
 *
 * Biểu hiện lúc chạy: KHÔNG throw lúc build, KHÔNG log cảnh báo. Với .vue: Vue ném
 * `_ctx.t is not a function` (crash render) hoặc cảnh báo "Property t was accessed
 * during render but is not defined" (render rỗng/im lặng). Với .ts thường:
 * `ReferenceError: t is not defined` khi hàm đó thực thi.
 *
 * Usage: node scripts/i18n/check-missing-i18n.mjs <dir> [<dir> ...]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'

const traverse = _traverse.default || _traverse
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const targets = process.argv.slice(2)
if (!targets.length) {
  console.error('Usage: node scripts/i18n/check-missing-i18n.mjs <dir> ...')
  process.exit(1)
}

const vueFiles = []
const plainFiles = []
function walk(d) {
  let st
  try {
    st = statSync(d)
  } catch {
    return
  }
  if (st.isFile()) {
    const ext = extname(d)
    if (ext === '.vue') vueFiles.push(d)
    else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) plainFiles.push(d)
    return
  }
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    walk(join(d, n))
  }
}
for (const t of targets) walk(join(ROOT, t))

const bad = [] // { rel, line, snippet, reason }
const TCALL_LOOSE = /(?<![\w.])t\(/ // 't(' không đứng sau chữ/số/gạch dưới/dấu chấm

function babelPluginsFor(lang) {
  return ['typescript', ...(/(tsx|jsx)/.test(lang || '') ? ['jsx'] : []), 'decorators-legacy']
}

// ---------- .vue: template hoặc script gọi t(), nhưng KHÔNG có `useI18n(` ở đâu trong script ----------
// Cố ý dùng check LỎNG (textual, không phân tích scope chính xác) giống hệt điều kiện
// gate của check-tdz.mjs (`if (!/useI18n\s*\(/.test(code)) continue`): nhiều component
// trong repo viết theo kiểu `defineComponent({ setup() { const { t } = useI18n() ... } })`
// (vd Verify.vue, Menu.vue) — `useI18n()` nằm TRONG hàm `setup()`, không ở top-level của
// block, nên kiểm tra scope kiểu Program-only sẽ báo sai (đã thử và bắt gặp 5 false
// positive). Đánh đổi: bỏ lọt trường hợp hiếm `useI18n()` được gọi nhưng không destructure
// `t`, đổi lấy không báo sai hàng loạt.
for (const file of vueFiles) {
  const rel = relative(ROOT, file)
  const raw = readFileSync(file, 'utf8')
  let descriptor
  try {
    ;({ descriptor } = parseSFC(raw, { filename: rel }))
  } catch {
    continue
  }
  const block = descriptor.scriptSetup || descriptor.script
  const templateSrc = descriptor.template?.content || ''
  const scriptSrc = block?.content || ''

  const usesT = TCALL_LOOSE.test(templateSrc) || TCALL_LOOSE.test(scriptSrc)
  if (!usesT) continue

  if (!block) {
    bad.push({ rel, line: 1, snippet: '<template> gọi t() nhưng không có <script>', reason: 'no-script' })
    continue
  }
  if (/useI18n\s*\(/.test(scriptSrc)) continue

  // tìm dòng t() đầu tiên để báo cáo (ưu tiên script, fallback template)
  let line = block.loc.start.line
  let snippet = 'const { t } = useI18n() — thiếu'
  const m = TCALL_LOOSE.exec(scriptSrc)
  if (m) {
    const lineInBlock = scriptSrc.slice(0, m.index).split('\n').length
    line = block.loc.start.line + lineInBlock - 1
    snippet = scriptSrc.split('\n')[lineInBlock - 1].trim().slice(0, 80)
  } else if (TCALL_LOOSE.test(templateSrc)) {
    snippet = '(t() chỉ xuất hiện trong <template>)'
    line = descriptor.template.loc.start.line
  }
  bad.push({ rel, line, snippet, reason: 'missing-useI18n' })
}

// ---------- .ts/.tsx thường: mỗi lời gọi t() tự kiểm tra scope ----------
for (const file of plainFiles) {
  const rel = relative(ROOT, file)
  const raw = readFileSync(file, 'utf8')
  if (!TCALL_LOOSE.test(raw)) continue
  if (rel.startsWith('src/locales/') || rel === 'src/hooks/web/useI18n.ts') continue

  let ast
  try {
    ast = babelParse(raw, { sourceType: 'module', plugins: babelPluginsFor(file) })
  } catch {
    continue
  }

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee?.type !== 'Identifier' || path.node.callee.name !== 't') return
      if (path.scope.getBinding('t')) return // có binding (dù từ useI18n(), import, hay tham số hàm) -> an toàn
      const line = raw.slice(0, path.node.start).split('\n').length
      bad.push({
        rel,
        line,
        snippet: raw.split('\n')[line - 1].trim().slice(0, 80),
        reason: 'missing-useI18n'
      })
    }
  })
}

const byFile = new Map()
for (const b of bad) {
  if (!byFile.has(b.rel)) byFile.set(b.rel, [])
  byFile.get(b.rel).push(b)
}
for (const [rel, list] of byFile) {
  console.log(`  ✗ ${rel} — thiếu binding cho t() (${list.length} chỗ)`)
  for (const b of list.slice(0, 3)) console.log(`      dòng ${b.line}: ${b.snippet}`)
}
console.log(
  `\n${vueFiles.length + plainFiles.length} file quét, ${byFile.size} file thiếu useI18n(), ${bad.length} lời gọi t() không có binding`
)
process.exit(byFile.size ? 1 : 0)
