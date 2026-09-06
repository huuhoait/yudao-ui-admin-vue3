#!/usr/bin/env node
/**
 * Dò chuỗi tiếng Trung CÒN SÓT ở vị trí hiển thị, sau khi chạy to-en.mjs / convert.mjs.
 *
 * Cần thiết vì to-en.mjs có điểm mù: text node vừa có interpolation vừa có chữ Trung
 * (`{{ x }}人为空时`) không khớp regex text node, cũng không bị báo ở mục review.
 *
 * Đã LOẠI bỏ comment (//, /* *\/, <!-- -->) vì comment không hiển thị ra UI.
 *
 * Usage:
 *   node scripts/i18n/check-zh.mjs <dir> [--ignore a,b]   # a,b: chuỗi con của đường dẫn cần bỏ qua
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const args = process.argv.slice(2)
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--ignore')
const ignIdx = args.indexOf('--ignore')
const IGNORE = ignIdx >= 0 ? args[ignIdx + 1].split(',').filter(Boolean) : []
if (!target) {
  console.error('Usage: node scripts/i18n/check-zh.mjs <dir> [--ignore a,b]')
  process.exit(1)
}

const CJK = /[一-龥]/
const files = []
;(function walk(d) {
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
})(join(ROOT, target))

/** Thay nội dung comment bằng khoảng trắng, GIỮ nguyên số dòng để báo đúng vị trí. */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)))
}

let hits = 0
for (const file of files) {
  const rel = relative(ROOT, file)
  if (IGNORE.some((s) => rel.includes(s))) continue
  const src = readFileSync(file, 'utf8')
  if (!CJK.test(src)) continue
  stripComments(src)
    .split('\n')
    .forEach((line, i) => {
      if (!CJK.test(line)) return
      hits++
      console.log(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`)
    })
}

console.log(`\n--- ${hits} dòng còn tiếng Trung ngoài comment (${files.length} file đã quét)`)
process.exit(hits ? 1 : 0)
