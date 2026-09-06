#!/usr/bin/env node
/**
 * Đối chiếu mọi `t('...')` trong mã nguồn với bộ key locale thực tế.
 *
 * Bắt lỗi mà compile-check không thấy: key gõ sai / key bị mất khi regenerate
 * -> vue-i18n im lặng in ra chính chuỗi key trên UI (silentTranslationWarn: true).
 *
 * Usage: node scripts/i18n/check-keys.mjs <dir> [<dir> ...]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as babelParse } from '@babel/parser'
import { loadGeneratedLocale } from './locale-io.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const targets = process.argv.slice(2)
if (!targets.length) {
  console.error('Usage: node scripts/i18n/check-keys.mjs <dir> ...')
  process.exit(1)
}

// ---------- tập key có sẵn ----------
const known = new Set()

// 1. file locale chính: lấy object gán cho `const messages = {...}`
function loadMainLocale(file) {
  if (!existsSync(file)) return
  const ast = babelParse(readFileSync(file, 'utf8'), {
    sourceType: 'module',
    plugins: ['typescript']
  })
  const collect = (obj, prefix) => {
    for (const p of obj.properties) {
      if (p.type !== 'ObjectProperty') continue
      const name = p.key.type === 'Identifier' ? p.key.name : p.key.value
      const path = prefix ? `${prefix}.${name}` : String(name)
      if (p.value.type === 'ObjectExpression') collect(p.value, path)
      else known.add(path)
    }
  }
  for (const node of ast.program.body) {
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) {
        if (d.id.name === 'messages' && d.init?.type === 'ObjectExpression') collect(d.init, '')
      }
    }
    if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'ObjectExpression') {
      collect(node.declaration, '')
    }
  }
}
loadMainLocale(join(ROOT, 'src/locales/zh-CN.ts'))

// 2. các file generated
const genDir = join(ROOT, 'src/locales/generated')
if (existsSync(genDir)) {
  for (const f of readdirSync(genDir).filter((f) => f.endsWith('.zh-CN.ts'))) {
    for (const k of Object.keys(loadGeneratedLocale(join(genDir, f)))) known.add(k)
  }
}

// ---------- quét t('...') ----------
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

const TCALL = /\bt\(\s*'([^']+)'\s*\)/g
const missing = new Map()
let total = 0

for (const file of files) {
  const rel = relative(ROOT, file)
  const src = readFileSync(file, 'utf8')
  let m
  while ((m = TCALL.exec(src)) !== null) {
    total++
    const key = m[1]
    if (known.has(key)) continue
    if (!missing.has(key)) missing.set(key, [])
    missing.get(key).push(rel)
  }
}

for (const [key, where] of missing) {
  console.log(`  ✗ ${key}\n      ${[...new Set(where)].slice(0, 3).join(', ')}`)
}
console.log(
  `\n${total} lời gọi t(), ${known.size} key locale, ${missing.size} key THIẾU (${files.length} file)`
)
process.exit(missing.size ? 1 : 0)
