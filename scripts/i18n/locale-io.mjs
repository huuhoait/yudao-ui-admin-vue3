/**
 * Đọc file locale đã sinh (`src/locales/generated/<name>.<lang>.ts`) thành map phẳng.
 *
 * Dùng cho 2 việc:
 *  - `convert.mjs --reuse`: giữ nguyên key cũ khi source thay đổi (nâng cấp upstream).
 *  - `merge-locale.mjs`: chuyển bản dịch en/vi cũ sang bộ key mới.
 *
 * Parse bằng @babel/parser (không eval) để lấy đúng giá trị chuỗi, sau đó gỡ
 * escape của vue-i18n do `gen-locale.mjs` thêm vào (`{'{'}` -> `{`, `{'@'}` -> `@`).
 */
import { readFileSync, existsSync } from 'node:fs'
import { parse as babelParse } from '@babel/parser'

/** Gỡ escape vue-i18n: `{'{'}` -> `{`, `{'}'}` -> `}`, `{'@'}` -> `@`. */
export function unescapeI18n(s) {
  return String(s)
    .replace(/\{'\{'\}/g, '{')
    .replace(/\{'\}'\}/g, '}')
    .replace(/\{'@'\}/g, '@')
}

/**
 * Thêm escape vue-i18n trước khi ghi ra file locale: vue-i18n coi `{...}` là placeholder
 * nên `{` `}` literal phải bọc thành `{'{'}` `{'}'}`; `@` cũng phải escape vì vue-i18n
 * coi nó là ký tự mở đầu "linked message" (`@:key`, `@.modifier:key`) — một `@` KHÔNG
 * theo sau bởi `:`/`.` vẫn khiến message-compiler ném lỗi biên dịch runtime
 * `SyntaxError: Invalid linked format` (không phải lỗi lúc build, chỉ lộ khi màn hình
 * đó được mở). Bọc thành `{'@'}`.
 *
 * PHẢI thay 1 lượt duy nhất. Nếu thay nhiều lượt riêng biệt (`{` trước rồi `}` sau...)
 * thì `{`/`}` do lượt trước sinh ra (kể cả từ escape `@` -> `{'@'}`) sẽ bị lượt sau thay
 * tiếp -> chuỗi hỏng, vd '共{n}条' -> "共{'{'{'}'}n{'}'}条". Dùng 1 regex với character
 * class gộp cả 3 ký tự, callback chỉ nhìn ký tự gốc trong chuỗi ĐẦU VÀO (replace không
 * quét lại chuỗi kết quả) nên an toàn.
 */
export function escapeI18n(s) {
  return String(s).replace(/[{}@]/g, (ch) => (ch === '{' ? "{'{'}" : ch === '}' ? "{'}'}" : "{'@'}"))
}

/**
 * @param {string} file đường dẫn tuyệt đối tới file locale generated
 * @returns {Record<string,string>} map key phẳng ("system.user.nickname") -> giá trị
 */
export function loadGeneratedLocale(file) {
  return loadGeneratedLocaleImpl(file, true)
}

/**
 * Như loadGeneratedLocale nhưng KHÔNG unescape — trả về đúng chuỗi đã ghi trên đĩa.
 *
 * Dùng khi cần GHI LẠI giá trị y nguyên (translation memory): unescape rồi escape lại
 * không phải phép biến đổi 1-1 khi chuỗi trộn lẫn placeholder thật (`{param}`) với dấu
 * ngoặc nhọn literal đã escape (`{'{'}`) — escape lại sẽ escape luôn cả `{param}`,
 * biến placeholder thành text hiển thị nguyên văn thay vì được thay giá trị.
 */
export function loadGeneratedLocaleRaw(file) {
  return loadGeneratedLocaleImpl(file, false)
}

function loadGeneratedLocaleImpl(file, unescape) {
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
      else if (prop.value.type === 'StringLiteral') {
        flat[path] = unescape ? unescapeI18n(prop.value.value) : prop.value.value
      }
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

/**
 * Dựng object lồng nhau từ map key phẳng. `transform(value, key)` tuỳ biến giá trị.
 *
 * Báo lỗi thay vì im lặng khi key lá đụng namespace (`a.b = 'x'` cùng với `a.b.c = 'y'`):
 * kiểu đụng độ này từng nuốt trọn 80 key con mà không có dấu hiệu gì.
 */
export function nestKeys(flat, transform = (v) => v) {
  const root = {}
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.')
    let cur = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (typeof cur[seg] === 'string') {
        throw new Error(
          `Key đụng độ: "${parts.slice(0, i + 1).join('.')}" vừa là chuỗi vừa là namespace (khi thêm "${k}")`
        )
      }
      cur[seg] = cur[seg] || {}
      cur = cur[seg]
    }
    const last = parts[parts.length - 1]
    if (cur[last] && typeof cur[last] === 'object') {
      throw new Error(`Key đụng độ: "${k}" vừa là chuỗi vừa là namespace`)
    }
    cur[last] = transform(v, k)
  }
  return root
}

/**
 * Serialize object lồng nhau thành mã TS.
 *
 * `escape = true`  : giá trị là VĂN BẢN THUẦN -> escape `{` `}` cho vue-i18n.
 * `escape = false` : giá trị ĐÃ là message vue-i18n (có thể chứa placeholder
 *                    `{name}`) -> ghi nguyên văn, escape nữa sẽ hỏng placeholder.
 */
export function serializeLocale(obj, indent = 2, escape = true) {
  const pad = ' '.repeat(indent)
  const entries = Object.entries(obj).map(([k, v]) => {
    const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)
    if (v && typeof v === 'object') return `${pad}${key}: ${serializeLocale(v, indent + 2, escape)}`
    return `${pad}${key}: ${JSON.stringify(escape ? escapeI18n(v) : v)}`
  })
  return `{\n${entries.join(',\n')}\n${' '.repeat(indent - 2)}}`
}

/**
 * Nội dung đầy đủ 1 file locale generated.
 *
 * `rawKeys`: các key mà giá trị đã là message vue-i18n viết tay (có placeholder).
 * Những key này được giữ nguyên; phần còn lại vẫn được escape như thường.
 */
export function renderLocaleFile(flat, name, note, rawKeys = new Set()) {
  const nested = nestKeys(flat, (v, k) => (rawKeys.has(k) ? v : escapeI18n(v)))
  return `// AUTO-GENERATED by scripts/i18n — bổ sung i18n cho "${name}".\n// ${note}\nexport default ${serializeLocale(nested, 2, false)}\n`
}
