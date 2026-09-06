#!/usr/bin/env node
/**
 * Ghi bản dịch tay vào file locale đã sinh.
 *
 * Usage: node scripts/i18n/apply-translations.mjs <name> <file.json>
 *   <name>      tên module locale, vd `bpm` -> src/locales/generated/bpm.{en,vi}.ts
 *   <file.json> { "en": { "<key>": "<bản dịch>" }, "vi": { ... } }
 *
 * Chỉ ghi đè key ĐÃ CÓ trong file locale (key lạ được báo là bỏ qua) để tránh
 * đưa key rác vào bundle khi source đã đổi.
 *
 * Sau khi chạy, các bản dịch này trở thành nguồn của translation memory trong
 * gen-locale.mjs, nên lần regenerate sau sẽ tự giữ lại.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGeneratedLocale, renderLocaleFile } from './locale-io.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..', '..')

const [name, jsonArg] = process.argv.slice(2)
if (!name || !jsonArg) {
  console.error('Usage: node scripts/i18n/apply-translations.mjs <name> <file.json>')
  process.exit(1)
}

const data = JSON.parse(readFileSync(join(ROOT, jsonArg), 'utf8'))
const outDir = join(ROOT, 'src', 'locales', 'generated')
const CJK = /[一-龥]/

for (const lang of ['en', 'vi']) {
  const overrides = data[lang]
  if (!overrides) continue
  const file = join(outDir, `${name}.${lang}.ts`)
  const flat = loadGeneratedLocale(file)
  if (!Object.keys(flat).length) {
    console.error(`  ✗ không đọc được ${file}`)
    process.exit(1)
  }

  let applied = 0
  const skipped = []
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in flat)) {
      skipped.push(key)
      continue
    }
    flat[key] = value
    applied++
  }

  const note = 'Giữ lại bản dịch cũ qua translation memory; dòng còn tiếng Trung là chưa dịch.'
  writeFileSync(file, renderLocaleFile(flat, name, note), 'utf8')

  const left = Object.entries(flat).filter(([, v]) => CJK.test(v)).length
  console.log(
    `  ✎ ${name}.${lang}.ts — áp dụng ${applied}` +
      (skipped.length ? `, bỏ qua ${skipped.length} key lạ` : '') +
      ` | còn tiếng Trung: ${left}`
  )
  for (const k of skipped) console.log(`      · key lạ: ${k}`)
}
