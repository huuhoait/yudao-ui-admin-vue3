#!/usr/bin/env node
/**
 * i18n scan tool (READ-ONLY).
 * Quét các chuỗi tiếng Trung hardcode trong phạm vi được chỉ định.
 * KHÔNG sửa bất kỳ file source nào. Chỉ ghi ra report JSON + in tổng kết.
 *
 * Usage: node scripts/i18n/scan.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

// Phạm vi scan: system, bpm và các component/hook hỗ trợ dùng chung.
const SCAN_DIRS = [
  'src/views/system',
  'src/views/bpm',
  'src/components',
  'src/hooks',
  'src/utils'
]

const EXTS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx'])

// Regex phát hiện ký tự Trung (CJK Unified Ideographs).
const CJK = /[\u4e00-\u9fa5]/

// Bắt cụm chuỗi có chứa ký tự Trung (liên tục gồm chữ Trung + ký tự thường đi kèm).
const CJK_RUN = /[\u4e00-\u9fa5][\u4e00-\u9fa5A-Za-z0-9 、，。（）()：:%,.!?！？\-\/]*/g

function walk(dir, out) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
      walk(full, out)
    } else if (EXTS.has(extname(name))) {
      out.push(full)
    }
  }
}

/**
 * Phân loại ngữ cảnh của 1 dòng chứa chuỗi Trung (heuristic, để ước lượng độ khó).
 */
function classifyContext(line, isVue) {
  const trimmed = line.trim()
  // Comment
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('<!--')
  ) {
    return 'comment'
  }
  // Template literal có biến ${...}
  if (/`[^`]*\$\{[^}]*\}[^`]*`/.test(line) && CJK.test(line)) {
    return 'template-literal-dynamic'
  }
  // Attribute trong template vue: placeholder="中文" hoặc label="中文"
  if (isVue && /[\w-]+="[^"]*[\u4e00-\u9fa5][^"]*"/.test(line)) {
    return 'vue-attribute'
  }
  // Nội dung text giữa tag: >中文<
  if (isVue && />[^<>]*[\u4e00-\u9fa5][^<>]*</.test(line)) {
    return 'vue-text'
  }
  // Chuỗi trong object/JS: 'xxx' hoặc "xxx"
  if (/['"][^'"]*[\u4e00-\u9fa5][^'"]*['"]/.test(line)) {
    return 'js-string'
  }
  return 'other'
}

const files = []
for (const d of SCAN_DIRS) {
  walk(join(ROOT, d), files)
}

const report = {
  scannedAt: new Date().toISOString(),
  scanDirs: SCAN_DIRS,
  totalFiles: 0,
  filesWithChinese: 0,
  totalOccurrences: 0,
  uniqueStrings: 0,
  byContext: {},
  byDir: {},
  files: []
}

const uniqueSet = new Set()

for (const file of files) {
  report.totalFiles++
  const rel = relative(ROOT, file)
  const isVue = extname(file) === '.vue'
  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  if (!CJK.test(content)) continue

  const lines = content.split('\n')
  const fileHits = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!CJK.test(line)) continue
    const ctx = classifyContext(line, isVue)
    const matches = line.match(CJK_RUN) || []
    for (const m of matches) {
      const s = m.trim()
      if (!s || !CJK.test(s)) continue
      report.totalOccurrences++
      uniqueSet.add(s)
      report.byContext[ctx] = (report.byContext[ctx] || 0) + 1
      fileHits.push({ line: i + 1, context: ctx, text: s })
    }
  }
  if (fileHits.length) {
    report.filesWithChinese++
    // Gom theo thư mục cấp module (src/views/system, src/views/bpm, src/components...)
    const topDir = SCAN_DIRS.find((d) => rel.startsWith(d)) || 'other'
    report.byDir[topDir] = (report.byDir[topDir] || 0) + fileHits.length
    report.files.push({ file: rel, count: fileHits.length, hits: fileHits })
  }
}

report.uniqueStrings = uniqueSet.size
report.files.sort((a, b) => b.count - a.count)

const outPath = join(__dirname, 'i18n-report.json')
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

// In tổng kết
console.log('===== i18n SCAN SUMMARY (READ-ONLY) =====')
console.log('Scan dirs:', SCAN_DIRS.join(', '))
console.log('Tổng file quét:', report.totalFiles)
console.log('File có chuỗi Trung:', report.filesWithChinese)
console.log('Tổng số lần xuất hiện:', report.totalOccurrences)
console.log('Số chuỗi khác nhau (unique):', report.uniqueStrings)
console.log('\n--- Theo ngữ cảnh ---')
for (const [k, v] of Object.entries(report.byContext).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`)
}
console.log('\n--- Theo thư mục ---')
for (const [k, v] of Object.entries(report.byDir).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`)
}
console.log('\n--- Top 15 file nhiều chuỗi nhất ---')
for (const f of report.files.slice(0, 15)) {
  console.log(`  ${f.count.toString().padStart(4)}  ${f.file}`)
}
console.log('\nReport chi tiết:', relative(ROOT, outPath))
