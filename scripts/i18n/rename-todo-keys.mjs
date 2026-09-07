#!/usr/bin/env node
/**
 * Đổi tên các key `_todoN` sang tên semantic ngắn gọn dựa trên bản dịch tiếng Anh đã có.
 * Chỉ đổi những chuỗi NGẮN (nhãn/label) — chuỗi dài (câu/thông báo) vẫn giữ `_todoN` đúng
 * như khuyến nghị của README (mục "Bổ sung từ vựng"): "các câu dài / thông báo lỗi nên để
 * _todo — ép thành tên key ngắn không có ý nghĩa".
 *
 * Usage: node scripts/i18n/rename-todo-keys.mjs <module1> [<module2> ...] [--apply]
 *   (không có --apply: chỉ in ra rename map để soát trước, không ghi file nào)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGeneratedLocale } from './locale-io.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const modules = args.filter((a) => !a.startsWith('--'))
if (!modules.length) {
  console.error('Usage: node scripts/i18n/rename-todo-keys.mjs <module1> [<module2> ...] [--apply]')
  process.exit(1)
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'for', 'is', 'are', 'to', 'in', 'on', 'at', 'and', 'or', 'with', 'your', 'this'])

function toCamel(words) {
  return words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join('')
}

function deriveName(en) {
  let s = (en || '').trim()
  s = s.replace(/[.:?!,;]+$/, '')
  let prefix = ''
  let m
  if ((m = /^Please enter (the )?/.exec(s))) {
    prefix = 'input'
    s = s.slice(m[0].length)
  } else if ((m = /^Please select (the )?/.exec(s))) {
    prefix = 'select'
    s = s.slice(m[0].length)
  } else if ((m = /^Select (the )?/.exec(s))) {
    prefix = 'select'
    s = s.slice(m[0].length)
  }
  const rawWords = s.split(/[\s/\-]+/).filter(Boolean)
  if (rawWords.length === 0 || rawWords.length > 5) return null
  if (s.length > 32) return null
  if (/["'{}%<>]/.test(s)) return null
  const cleaned = rawWords.map((w) => w.replace(/[^A-Za-z0-9]/g, '')).filter((w) => w.length > 0)
  let words = cleaned.filter((w) => !STOPWORDS.has(w.toLowerCase()))
  if (words.length === 0) words = cleaned // toàn stopword (hiếm) -> giữ nguyên, còn hơn rỗng
  if (words.length === 0) return null
  let name = prefix ? prefix + words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') : toCamel(words)
  if (!name) return null
  if (/^[0-9]/.test(name)) name = '_' + name
  return name
}

// ---------- build rename map cho 1 module ----------
function buildRenameMap(mod) {
  const zhPath = join(ROOT, `src/locales/generated/${mod}.zh-CN.ts`)
  const enPath = join(ROOT, `src/locales/generated/${mod}.en.ts`)
  const zh = loadGeneratedLocale(zhPath)
  const en = loadGeneratedLocale(enPath)
  const allKeys = Object.keys(zh)

  // used[namespace] = Set các leaf name đã dùng trong namespace đó
  const used = new Map()
  for (const k of allKeys) {
    const idx = k.lastIndexOf('.')
    const ns = k.slice(0, idx)
    const leaf = k.slice(idx + 1)
    if (!used.has(ns)) used.set(ns, new Set())
    used.get(ns).add(leaf)
  }

  const todoKeys = allKeys.filter((k) => /_todo\d+$/.test(k))
  const rename = [] // { oldKey, newKey, ns, leaf, en }
  for (const k of todoKeys) {
    const idx = k.lastIndexOf('.')
    const ns = k.slice(0, idx)
    const name = deriveName(en[k])
    if (!name) continue
    const usedSet = used.get(ns)
    if (usedSet.has(name)) continue // đụng tên -> giữ nguyên _todoN, an toàn
    usedSet.add(name)
    rename.push({ oldKey: k, newKey: `${ns}.${name}`, ns, leaf: name, en: en[k] })
  }
  return { mod, rename, totalTodo: todoKeys.length }
}

// ---------- áp dụng: sửa 3 file locale generated ----------
function applyToLocaleFile(mod, lang, renameMap) {
  const path = join(ROOT, `src/locales/generated/${mod}.${lang}.ts`)
  let content = readFileSync(path, 'utf8')
  let count = 0
  for (const { oldKey, newKey } of renameMap) {
    const oldLeaf = oldKey.slice(oldKey.lastIndexOf('.') + 1)
    const newLeaf = newKey.slice(newKey.lastIndexOf('.') + 1)
    // key nằm ở đầu dòng (thụt lề) dạng `  _todoN: "..."` hoặc `  _todoN: '...'`
    const re = new RegExp(`^(\\s*)${oldLeaf}:`, 'm')
    if (re.test(content)) {
      content = content.replace(re, `$1${newLeaf}:`)
      count++
    }
  }
  writeFileSync(path, content)
  return count
}

// ---------- áp dụng: sửa mọi t('key') trong toàn bộ src/ ----------
function walkSrc(dir, files) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    const p = join(dir, n)
    const st = statSync(p)
    if (st.isDirectory()) walkSrc(p, files)
    else if (['.vue', '.ts', '.tsx', '.js', '.jsx'].includes(extname(p))) files.push(p)
  }
}

function applyToSource(renameMap) {
  const files = []
  walkSrc(join(ROOT, 'src'), files)
  let filesChanged = 0
  let totalReplacements = 0
  for (const file of files) {
    let content = readFileSync(file, 'utf8')
    let changed = false
    for (const { oldKey, newKey } of renameMap) {
      // thay trong dấu nháy đơn hoặc kép, đúng nguyên chuỗi key
      const singleRe = new RegExp(`'${oldKey.replace(/\./g, '\\.')}'`, 'g')
      const doubleRe = new RegExp(`"${oldKey.replace(/\./g, '\\.')}"`, 'g')
      if (singleRe.test(content) || doubleRe.test(content)) {
        content = content.replace(singleRe, `'${newKey}'`).replace(doubleRe, `"${newKey}"`)
        changed = true
        totalReplacements++
      }
    }
    if (changed) {
      writeFileSync(file, content)
      filesChanged++
    }
  }
  return { filesChanged, totalReplacements }
}

// ---------- main ----------
for (const mod of modules) {
  const { rename, totalTodo } = buildRenameMap(mod)
  console.log(`\n===== ${mod}: ${rename.length}/${totalTodo} _todo key đổi tên được =====`)
  if (!APPLY) {
    for (const r of rename.slice(0, 15)) {
      console.log(`  ${r.oldKey} -> ${r.newKey}  (${r.en})`)
    }
    if (rename.length > 15) console.log(`  ... và ${rename.length - 15} key khác`)
    continue
  }
  for (const lang of ['zh-CN', 'en', 'vi']) {
    const n = applyToLocaleFile(mod, lang, rename)
    console.log(`  ✎ ${mod}.${lang}.ts — đổi ${n} key`)
  }
  const { filesChanged, totalReplacements } = applyToSource(rename)
  console.log(`  ✎ source: ${filesChanged} file, ${totalReplacements} lượt thay t('...')`)
}
