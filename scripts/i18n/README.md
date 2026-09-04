# Bộ công cụ i18n (AST-based)

Công cụ tự động trích xuất chuỗi tiếng Trung hardcode trong mã nguồn, thay bằng lời gọi `t('key')`, và sinh file bản dịch cho 3 ngôn ngữ: `zh-CN`, `en`, `vi`.

Công cụ dùng **AST** (`@vue/compiler-sfc` + `@babel/parser`) để hiểu đúng ngữ cảnh từng chuỗi, nên chỉ đụng vào chuỗi UI an toàn và tự tránh các chuỗi logic dễ vỡ. Không cần cài thêm dependency — các parser đã có sẵn trong `node_modules`.

## Thành phần

| File | Vai trò |
|---|---|
| `convert.mjs` | Bộ não. Scan / apply: tìm chuỗi Trung, phân loại bằng AST, chèn `t()`. |
| `dict.mjs` | Từ điển ánh xạ chuỗi Trung → key tiếng Anh ngữ nghĩa (phương án đặt key kiểu B). |
| `gen-locale.mjs` | Sinh file locale `generated/<name>.{zh-CN,en,vi}.ts` từ dữ liệu convert. |
| `scan.mjs` | Bản scan thô (regex) để ước lượng khối lượng nhanh. |

Các file dữ liệu tạm sinh ra khi chạy (có thể xóa):
- `report-<name>.json` — chi tiết từng chuỗi + phân loại convert/review.
- `locale-delta-<name>.json` — danh sách key mới + chuỗi Trung.

## Quy trình 4 bước

Giả sử convert module `src/views/system/role`.

### Bước 1 — Scan (chỉ đọc)
```bash
node scripts/i18n/convert.mjs src/views/system/role
```
Không sửa file nào. In tổng kết: số chuỗi convert được, số cần review tay, số key `_todo`. Xem `report-role.json` và `locale-delta-role.json` để kiểm tra trước.

Nếu nhiều key `_todo` (chuỗi không map được sang tên key đẹp), cân nhắc bổ sung từ vựng vào `dict.mjs` rồi scan lại (xem mục "Bổ sung từ vựng").

### Bước 2 — Apply dry-run (xem diff, chưa ghi)
```bash
node scripts/i18n/convert.mjs src/views/system/role --apply --dry
```
In diff từng dòng sẽ đổi. KHÔNG ghi đè file. Dùng để soát trước.

### Bước 3 — Apply thật
```bash
node scripts/i18n/convert.mjs src/views/system/role --apply
```
- Chèn `t('...')` vào `.vue`/`.ts`.
- Tự thêm `const { t } = useI18n()` vào `<script setup>` nếu chưa có.
- Tạo backup `<file>.i18nbak` cạnh mỗi file bị sửa (repo không dùng git nên đây là lưới an toàn).

### Bước 4 — Sinh locale + merge + dịch
```bash
node scripts/i18n/gen-locale.mjs role
```
Sinh `src/locales/generated/role.{zh-CN,en,vi}.ts`.
- `zh-CN`: giá trị = chuỗi Trung gốc (đúng ngay).
- `en` / `vi`: tạm để chuỗi Trung, chờ dịch.

Sau đó **merge thủ công** vào 3 file locale chính (một lần cho mỗi module mới):

`src/locales/zh-CN.ts`
```ts
import roleGenerated from './generated/role.zh-CN'
// ... cuối file:
export default merge({}, messages, userGenerated, bpmGenerated, roleGenerated)
```

`src/locales/en.ts` — tương tự, import `./generated/role.en` và thêm vào `merge(...)`.

`src/locales/vi.ts` — import `./generated/role.vi` và thêm vào `merge(...)`.

Cuối cùng, dịch nội dung `en`/`vi` (thay chuỗi Trung bằng bản dịch).

### Verify
Chạy dev server rồi kiểm tra các file đã sửa biên dịch được (trả 200), không đợi mù:
```bash
npm run dev              # chạy nền, cổng có thể là 80/81
curl -s -o /dev/null -w "%{http_code}" "http://localhost:81/src/views/system/role/index.vue"
```
Sau khi verify OK, xóa backup:
```bash
find src/views/system/role -name "*.i18nbak" -delete
```

## Cơ chế an toàn (điều tool TỰ tránh)

Tool đưa các chuỗi sau vào danh sách **review** (không tự convert), liệt kê trong `report-*.json`:

- **Comment** — bỏ qua hoàn toàn.
- **Chuỗi so sánh** — `if (x === '已完成')`, `case '中文'`. Convert sẽ làm vỡ logic.
- **Object key** — `{ '中文': ... }`, `obj['名称']`.
- **Ghép chuỗi** `'A' + b + 'C'` — cần placeholder, xử lý tay.
- **Template literal có biến** — `` `共${n}条` `` — cần `t(key, { n })`.
- **Tên file** — `'用户数据.xls'`.
- **defineProps / withDefaults default** — giá trị mặc định bị hoist ra ngoài `setup()`, KHÔNG dùng được `t()`. Nếu cần dịch, để default rỗng rồi fallback `t()` ở template.
- **Chuỗi HTML / `&nbsp;` / quá dài** — thường là dữ liệu/markup (vd template in ấn wangEditor), không phải label.

## Các bẫy đã gặp và cách xử lý

1. **`defineProps` default không dùng được `t()`**
   Lỗi biên dịch `@vue/compiler-sfc`: default value bị hoist ngoài `setup()`.
   Cách sửa: đặt default rỗng (`''`), thêm fallback ở template: `:placeholder="placeholder || t('...')"`.

2. **Dấu `{` `}` trong chuỗi làm vỡ vue-i18n**
   Lỗi runtime `Unterminated single quote in placeholder`. vue-i18n coi `{...}` là placeholder.
   Cách sửa: escape thành `{'{'}` / `{'}'}`. `gen-locale.mjs` đã tự động escape khi sinh locale.

3. **Menu title từ backend**
   Tool chỉ xử lý chuỗi trong mã nguồn frontend. Tên menu lưu ở database (bảng `system_menu`) không nằm trong phạm vi — cần xử lý ở backend hoặc bảng dịch riêng.

## Bổ sung từ vựng (giảm `_todo`)

Key `_todoN` xuất hiện khi chuỗi không map được sang tên tiếng Anh. Để có key đẹp, thêm vào `dict.mjs`:

- `PHRASE`: cụm cố định → tên key. VD `角色: 'role'`.
- `NOUN`: danh từ để ghép với prefix. VD `角色: 'Role'` → tự sinh `请输入角色 = inputRole`, `角色不能为空 = roleRequired`.
- `REUSE`: chuỗi khớp key locale có sẵn (`common.*`, `action.*`) để tái dùng, không tạo key mới.

Sau khi thêm từ vựng, chạy lại Bước 1 để xem `_todo` giảm.

Lưu ý: các câu dài / thông báo lỗi nên để `_todo` — ép thành tên key ngắn không có ý nghĩa.

## Chiến lược key (phương án B)

Key theo ngữ nghĩa tiếng Anh, gom theo namespace lấy từ đường dẫn file:
`src/views/system/role/index.vue` → namespace `system.role` → key kiểu `system.role.roleName`.

Chuỗi trùng trong cùng namespace được gom về một key. Chuỗi khớp `REUSE` dùng lại key chung (`common.query`, `common.ok`...).

## Rollback

Mỗi file bị apply có backup `<file>.i18nbak`. Để hoàn tác một file:
```bash
mv src/views/system/role/index.vue.i18nbak src/views/system/role/index.vue
```
Để hoàn tác cả thư mục, khôi phục lần lượt rồi xóa các entry generated + import trong file locale.
