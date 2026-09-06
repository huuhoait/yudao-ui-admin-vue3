/**
 * Đọc file locale đã sinh (`src/locales/generated/<name>.<lang>.ts`) thành map phẳng.
 *
 * Dùng cho 2 việc:
 *  - `convert.mjs --reuse`: giữ nguyên key cũ khi source thay đổi (nâng cấp upstream).
 *  - `merge-locale.mjs`: chuyển bản dịch en/vi cũ sang bộ key mới.
 *
 * Parse bằng @babel/parser (không eval) để lấy đúng giá trị chuỗi, sau đó gỡ
 * escape của vue-i18n do `gen-locale.mjs` thêm vào (`{'{'}` -> `{`).
 */
import { readFileSync, existsSync } from 'node:fs'
import { parse as babelParse } from '@babel/parser'

/** Gỡ escape vue-i18n: `{'{'}` -> `{`, `{'}'}` -> `}`. */
export function unescapeI18n(s) {
  return String(s).replace(/\{'\{'\}/g, '{').replace(/\{'\}'\}/g, '}')
}

/** Thêm escape vue-i18n (giống gen-locale.mjs) trước khi ghi ra file locale. */
export function escapeI18n(s) {
  return String(s).replace(/\{/g, "{'{'}").replace(/\}/g, "{'}'}")
}

/**
 * @param {string} file đường dẫn tuyệt đối tới file locale generated
 * @returns {Record<string,string>} map key phẳng ("system.user.nickname") -> giá trị
 */
export function loadGeneratedLocale(file) {
  if (!existsSync(file)) return {}
  const code = readFileSync(file, 'utf8')
  const ast = babelParse(code, { sourceType: 'module', plugins: ['typescript'] })

  const exportDefault = ast.program.body.find((n) => n.type === 'ExportDefaultDeclaration')
  if (!exportDefault || exportDefault.declaration.type !== 'ObjectExpression') return {}

  const flat = {}
  const walkObject = (objExpr, prefix) => {
    for (const prop of objExpr.properties) {
      if (prop.type !== 'ObjectProperty') continue
      const name = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
      const path = prefix ? `${prefix}.${name}` : String(name)
      if (prop.value.type === 'ObjectExpression') walkObject(prop.value, path)
      else if (prop.value.type === 'StringLiteral') flat[path] = unescapeI18n(prop.value.value)
    }
  }
  walkObject(exportDefault.declaration, '')
  return flat
}

/** Tách key phẳng thành [namespace, tên key cuối]. */
export function splitKey(key) {
  const i = key.lastIndexOf('.')
  return i < 0 ? ['', key] : [key.slice(0, i), key.slice(i + 1)]
}
