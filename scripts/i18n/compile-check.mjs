#!/usr/bin/env node
/**
 * Kiểm tra các file sau khi codemod vẫn BIÊN DỊCH được, không cần chạy dev server.
 *
 * - .vue : parse SFC + compileScript + compileTemplate (bắt được lỗi kiểu
 *          "default của defineProps không tham chiếu được t()" mà README đã nêu).
 * - .ts/.js/.tsx : parse bằng @babel/parser.
 *
 * Usage: node scripts/i18n/compile-check.mjs <dir|file> [<dir|file> ...]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseSFC, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { parse as babelParse } from '@babel/parser'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const targets = process.argv.slice(2)
if (!targets.length) {
  console.error('Usage: node scripts/i18n/compile-check.mjs <dir|file> ...')
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
    if (['.vue', '.ts', '.tsx', '.js', '.jsx'].includes(extname(d))) files.push(d)
    return
  }
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    walk(join(d, n))
  }
}
for (const t of targets) walk(join(ROOT, t))

const errors = []

for (const file of files) {
  const rel = relative(ROOT, file)
  const src = readFileSync(file, 'utf8')
  const ext = extname(file)
  try {
    if (ext === '.vue') {
      const { descriptor, errors: parseErrors } = parseSFC(src, { filename: rel })
      if (parseErrors.length) throw new Error(parseErrors[0].message)

      const id = basename(file)
      if (descriptor.scriptSetup || descriptor.script) {
        compileScript(descriptor, { id })
      }
      if (descriptor.template) {
        const r = compileTemplate({
          source: descriptor.template.content,
          filename: rel,
          id,
          compilerOptions: { expressionPlugins: ['typescript'] }
        })
        if (r.errors.length) throw new Error(String(r.errors[0].message || r.errors[0]))
      }
    } else {
      babelParse(src, {
        sourceType: 'module',
        plugins: ['typescript', ...(/x$/.test(ext) ? ['jsx'] : []), 'decorators-legacy']
      })
    }
  } catch (e) {
    errors.push({ rel, msg: String(e.message).split('\n')[0] })
  }
}

for (const e of errors) console.log(`  ✗ ${e.rel}\n      ${e.msg}`)
console.log(`\n${files.length} file kiểm tra, ${errors.length} lỗi`)
process.exit(errors.length ? 1 : 0)
