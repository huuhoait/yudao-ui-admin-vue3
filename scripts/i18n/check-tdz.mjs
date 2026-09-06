#!/usr/bin/env node
/**
 * Bắt lỗi TDZ: gọi `t(...)` ở TOP-LEVEL của <script setup> TRƯỚC dòng
 * `const { t } = useI18n()`.
 *
 * Vì sao có lỗi này: convert.mjs chỉ chèn `const { t } = useI18n()` khi file CHƯA có.
 * Nếu upstream đã khai báo sẵn nhưng ở CUỐI file, mà convert.mjs lại chèn t() vào
 * một biến top-level ở đầu file (vd `const columns = [{ title: t('...') }]`) thì
 * biến đó chạy ngay lúc setup -> ReferenceError: Cannot access 't' before initialization.
 *
 * Chỉ tính lời gọi NGOÀI mọi function: trong function thì tới lúc gọi `t` đã khởi tạo,
 * và <template> cũng an toàn vì nó biên dịch thành render function.
 *
 * Usage: node scripts/i18n/check-tdz.mjs <dir> [<dir> ...]
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
  console.error('Usage: node scripts/i18n/check-tdz.mjs <dir> ...')
  process.exit(1)
}

const files = []
function walk(d) {
  let st
  try {
    st = statSync(d)
  } catch {
    return
  }
  if (st.isFile()) {
    if (extname(d) === '.vue') files.push(d)
    return
  }
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    walk(join(d, n))
  }
}
for (const t of targets) walk(join(ROOT, t))

const FN = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ObjectMethod',
  'ClassMethod'
])

const bad = []
for (const file of files) {
  const rel = relative(ROOT, file)
  const raw = readFileSync(file, 'utf8')
  let descriptor
  try {
    ;({ descriptor } = parseSFC(raw, { filename: rel }))
  } catch {
    continue
  }
  const block = descriptor.scriptSetup || descriptor.script
  if (!block) continue
  const code = block.content
  if (!/useI18n\s*\(/.test(code)) continue

  let ast
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', ...(/(tsx|jsx)/.test(block.lang || '') ? ['jsx'] : []), 'decorators-legacy']
    })
  } catch {
    continue
  }

  // vị trí khai báo `const { t } = useI18n()`
  let declEnd = -1
  traverse(ast, {
    VariableDeclarator(path) {
      const { node } = path
      if (node.init?.type !== 'CallExpression') return
      if (node.init.callee?.name !== 'useI18n') return
      if (node.id.type !== 'ObjectPattern') return
      const hasT = node.id.properties.some(
        (p) => p.type === 'ObjectProperty' && p.value?.name === 't'
      )
      if (hasT) declEnd = node.end
    }
  })
  if (declEnd < 0) continue

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee?.name !== 't') return
      if (path.node.start > declEnd) return
      if (path.findParent((p) => FN.has(p.node.type))) return // trong function -> an toàn
      const lineInBlock = code.slice(0, path.node.start).split('\n').length
      bad.push({
        rel,
        line: block.loc.start.line + lineInBlock - 1,
        snippet: code.split('\n')[lineInBlock - 1].trim().slice(0, 80)
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
  console.log(`  ✗ ${rel} — ${list.length} lời gọi t() trước khai báo`)
  for (const b of list.slice(0, 3)) console.log(`      dòng ${b.line}: ${b.snippet}`)
}
console.log(`\n${files.length} file .vue, ${byFile.size} file lỗi TDZ, ${bad.length} lời gọi`)
process.exit(byFile.size ? 1 : 0)
