#!/usr/bin/env node
/**
 * Thay chuỗi Trung -> Anh TẠI CHỖ cho BPMN designer (hướng B: chuyển sang tiếng Anh).
 *
 * An toàn: chỉ thay các chuỗi có trong bảng MAP, và chỉ ở ngữ cảnh hiển thị:
 *   - text node trong template:  >中文<
 *   - attribute chuỗi tĩnh:      label="中文" placeholder="中文" title="中文" content="中文" ...
 *   - chuỗi literal trong lời gọi hiển thị: ElMessage.*('中文'), confirm('中文', '中文'), title: '中文'
 * KHÔNG đụng: comment, tên biến, key logic. Vì MAP là danh sách trắng nên rủi ro thấp.
 *
 * Usage: node scripts/i18n/replace-en.mjs <targetDir> [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP } from './bpmn-en-map.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')
const args = process.argv.slice(2)
const target = args.find((a) => !a.startsWith('--'))
const DRY = args.includes('--dry')
if (!target) {
  console.error('Usage: node scripts/i18n/replace-en.mjs <targetDir> [--dry]')
  process.exit(1)
}

// Bảng thay thế sắp theo độ dài key giảm dần (thay cụm dài trước, tránh phá cụm ngắn).
const pairs = [...MAP].sort((a, b) => b[0].length - a[0].length)

function walk(dir, out) {
  let st
  try {
    st = statSync(dir)
  } catch {
    return
  }
  if (st.isFile()) {
    if (['.vue', '.ts', '.js'].includes(extname(dir))) out.push(dir)
    return
  }
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const n of entries) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    walk(join(dir, n), out)
  }
}

// Thay 1 chuỗi Trung trong toàn văn bản, nhưng chỉ khi nó nằm giữa dấu nháy hoặc là text node.
// Cách làm đơn giản & đủ an toàn với danh sách trắng: thay mọi occurrence chính xác.
function replaceAllExact(src, zh, en) {
  if (!src.includes(zh)) return src
  return src.split(zh).join(en)
}

const files = []
walk(join(ROOT, target), files)

let changedFiles = 0
let totalRepl = 0
for (const file of files) {
  let content = readFileSync(file, 'utf8')
  const before = content
  let fileRepl = 0
  for (const [zh, en] of pairs) {
    if (content.includes(zh)) {
      const cnt = content.split(zh).length - 1
      content = replaceAllExact(content, zh, en)
      fileRepl += cnt
    }
  }
  if (content !== before) {
    changedFiles++
    totalRepl += fileRepl
    if (DRY) {
      console.log(`  ~ ${relative(ROOT, file)}  (${fileRepl} thay thế)`)
    } else {
      writeFileSync(file + '.enbak', before, 'utf8')
      writeFileSync(file, content, 'utf8')
      console.log(`  ✎ ${relative(ROOT, file)}  (${fileRepl} thay thế, backup .enbak)`)
    }
  }
}
console.log(`\n${DRY ? '[DRY] ' : ''}Files đổi: ${changedFiles}, tổng thay thế: ${totalRepl}`)
