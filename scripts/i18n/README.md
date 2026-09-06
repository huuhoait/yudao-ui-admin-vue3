# Bộ công cụ i18n (AST-based)

Công cụ tự động trích xuất chuỗi tiếng Trung hardcode trong mã nguồn, thay bằng lời gọi `t('key')`, và sinh file bản dịch cho 3 ngôn ngữ: `zh-CN`, `en`, `vi`.

Công cụ dùng **AST** (`@vue/compiler-sfc` + `@babel/parser`) để hiểu đúng ngữ cảnh từng chuỗi, nên chỉ đụng vào chuỗi UI an toàn và tự tránh các chuỗi logic dễ vỡ. Không cần cài thêm dependency — các parser đã có sẵn trong `node_modules`.

## Thành phần

| File | Vai trò |
|---|---|
| `convert.mjs` | Bộ não. Scan / apply: tìm chuỗi Trung, phân loại bằng AST, chèn `t()`. Hỗ trợ `--reuse` (xem mục nâng cấp upstream). |
| `dict.mjs` | Từ điển ánh xạ chuỗi Trung → key tiếng Anh ngữ nghĩa (phương án đặt key kiểu B). |
| `gen-locale.mjs` | Sinh file locale `generated/<name>.{zh-CN,en,vi}.ts` từ dữ liệu convert, có translation memory. |
| `locale-io.mjs` | Thư viện dùng chung: đọc/ghi file locale generated (parse AST, escape/unescape placeholder, nest/serialize object, chặn key đụng namespace). |
| `apply-translations.mjs` | Ghi bản dịch tay (và key thêm tay ngoài delta) vào file locale generated đã sinh. |
| `scan.mjs` | Bản scan thô (regex) để ước lượng khối lượng nhanh. |
| `to-en.mjs` | Thay chuỗi hiển thị Trung → Anh tại chỗ (không qua i18n key) — dùng cho bpmnProcessDesigner / SimpleProcessDesignerV2. |
| `check-zh.mjs` | Dò chuỗi Trung còn sót ở vị trí hiển thị sau khi convert/to-en (bắt được điểm mù text-node lẫn interpolation). |
| `check-tdz.mjs` | Dò lỗi runtime TDZ: `t()` bị gọi ở top-level trước dòng khai báo `const { t } = useI18n()`. |
| `check-keys.mjs` | Đối chiếu mọi `t('key')` trong mã nguồn với key locale thực tế, báo key thiếu. |
| `compile-check.mjs` | Parse lại toàn bộ file đã sửa bằng `@vue/compiler-sfc`/`@babel/parser` để chắc chắn còn biên dịch được, không cần chạy dev server. |

Các file dữ liệu tạm sinh ra khi chạy (có thể xóa):
- `report-<name>.json` — chi tiết từng chuỗi + phân loại convert/review.
- `locale-delta-<name>.json` — danh sách key mới + chuỗi Trung.
- `report-en-<name>.json` — báo cáo của `to-en.mjs` (replaced/missing/review).
- `untranslated-<name>.json` — key mà `gen-locale.mjs` không tìm được bản dịch cũ, cần dịch tay rồi áp bằng `apply-translations.mjs`.

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

---

## Chuyển thẳng sang tiếng Anh (không dùng i18n key)

Dùng cho hai trình thiết kế quy trình — `bpmnProcessDesigner` và `SimpleProcessDesignerV2` —
nơi yêu cầu chỉ là hiển thị tiếng Anh, không cần đa ngôn ngữ.

```bash
# 1. Scan (chỉ đọc): xem chuỗi nào thay được, chuỗi nào còn thiếu bản dịch
node scripts/i18n/to-en.mjs src/components/SimpleProcessDesignerV2 --map scripts/i18n/en-map-simple.mjs

# 2. Bổ sung chuỗi còn thiếu vào file map, scan lại tới khi missing = 0

# 3. Xem diff trước khi ghi
node scripts/i18n/to-en.mjs src/components/SimpleProcessDesignerV2 --map scripts/i18n/en-map-simple.mjs --apply --dry

# 4. Ghi thật
node scripts/i18n/to-en.mjs src/components/SimpleProcessDesignerV2 --map scripts/i18n/en-map-simple.mjs --apply
```

| File | Vai trò |
|---|---|
| `to-en.mjs` | Thay chuỗi hiển thị Trung -> Anh tại chỗ, dùng AST. |
| `en-map-simple.mjs` | Bảng dịch cho SimpleProcessDesignerV2 (`EN`). |
| `bpmn-en-map.mjs` | Bảng dịch cho bpmnProcessDesigner (`EN`). |

### Vì sao KHÔNG dùng `replace-en.mjs` nữa (đã xóa)

Script cũ thay theo **chuỗi con** trên toàn file, kể cả trong comment và mã logic.
Nó đã sinh ra ~605 chỗ chuỗi lai kiểu `开始Hour间`, `芋道Source码`, `流程 name Name`
trong `bpmnProcessDesigner` (đã khôi phục từ commit `93a3d911`).

`to-en.mjs` khắc phục bằng cách:
- Chỉ khớp **nguyên chuỗi** (`EN[text]`), không bao giờ thay chuỗi con.
- Chỉ đụng vị trí hiển thị do AST xác định: text node, attribute trong danh sách trắng,
  string literal / template literal tĩnh trong script.
- KHÔNG đụng comment, vế so sánh (`x === '中文'`), object key, tên file, HTML markup,
  biểu thức binding (`:label="\`${x}人\`"`), interpolation.
- Chuỗi không có trong map thì **bỏ qua**, đồng thời liệt kê ở mục `missingStrings`
  của `report-en-<tên>.json` để bổ sung tay.

Các vị trí rủi ro được liệt kê ở mục `review` của report và phải sửa tay.
Sau khi apply, kiểm tra lại bằng:

```bash
# không còn chuỗi lai Trung-Anh ngoài comment
grep -rnP "(['\"\`])[^'\"\`]*[\x{4e00}-\x{9fa5}][^'\"\`]*[A-Za-z]{3,}[^'\"\`]*\1" <dir>
```

### Ghi chú riêng cho bpmnProcessDesigner

- `ProcessDesigner.vue` không còn nạp `plugins/translate/zh.js`; module translate
  mặc định nhận `{}` nên bpmn-js dùng **tiếng Anh gốc** của thư viện.
  File `zh.js` và `src/translations.ts` được giữ nguyên (không dùng tới).
- `value="异步前"` / `value="异步后"` / `value="排除"` **cố ý giữ tiếng Trung**:
  đây là giá trị được lưu vào BPMN XML, đổi sẽ vỡ dữ liệu cũ. Chỉ `label` được dịch.
- `penal/listeners/template.js` là mã chết (cú pháp Vue 2, không nơi nào import),
  vẫn dịch để đồng bộ.

---

## Nâng cấp upstream: giữ key ổn định qua `--reuse`

Khi kéo bản mới của `yudao-ui-admin-vue3`, thư mục nguồn bị **ghi đè bằng bản tiếng Trung
gốc** (upstream không biết gì về i18n của mình) — mọi `t('key')` đã chèn trước đó biến mất,
nhưng `src/locales/generated/*.zh-CN.ts` (đã commit) vẫn còn nguyên, tức là **key + bản dịch
en/vi cũ vẫn còn**, chỉ mất phần "chèn t() vào source".

Chạy lại `convert.mjs` bình thường (không `--reuse`) sẽ đánh số `_todoN` lại từ đầu và
sinh `locale-delta-<name>.json` MỚI — làm lệch hoàn toàn khỏi bản dịch en/vi cũ (762 dòng
dịch tay có thể mất trắng). `--reuse` khắc phục việc này:

```bash
node scripts/i18n/convert.mjs src/views/system --reuse system,user --apply
```

- Nạp `src/locales/generated/<name>.zh-CN.ts` (có thể liệt kê nhiều nguồn, phân tách bởi
  dấu phẩy — cần khi một số key nằm ở locale của module khác, vd `system.user.*` từng được
  convert riêng dưới tên `user`).
- Với mỗi (namespace, chuỗi Trung) đã có trong nguồn đó, **giữ nguyên key cũ** — kể cả key
  `_todoN`. Số đếm `_todo` cho key MỚI tiếp tục từ số lớn nhất đang dùng, không đụng key cũ.
- Chuỗi hoàn toàn mới (do upstream thêm tính năng) vẫn được sinh key mới bình thường.

Sau khi apply, chạy `gen-locale.mjs <name>` như thường — nó tự nối bản dịch cũ vào key
được giữ nguyên (xem mục Translation memory bên dưới), chỉ những chuỗi thật sự mới mới
cần dịch tay.

**Quy trình đầy đủ khi nâng cấp:**
1. `node scripts/i18n/convert.mjs <dir> --reuse <name>[,<name>...]` — scan, xem log
   `Reuse: N key cũ...`. Nếu N thấp bất thường so với số key cũ đang có, dừng lại kiểm tra
   (có thể chưa từng convert module này, hoặc namespace tính sai).
2. So sánh `locale-delta-<name>.json` mới với key cũ (script nhanh):
   ```js
   import { loadGeneratedLocale } from './scripts/i18n/locale-io.mjs'
   const old = loadGeneratedLocale('src/locales/generated/<name>.zh-CN.ts')
   const delta = JSON.parse(readFileSync('scripts/i18n/locale-delta-<name>.json'))
   // fresh = key trong delta nhưng không có trong old -> chuỗi THẬT SỰ mới
   ```
3. Apply thật: `--apply` (bỏ `--reuse` sẽ KHÔNG giữ key, đừng quên cờ này).
4. `node scripts/i18n/gen-locale.mjs <name>` — sinh lại 3 file locale, tự mang theo bản
   dịch cũ qua translation memory.
5. Dịch các key thật sự mới trong `untranslated-<name>.json` (dùng `apply-translations.mjs`).
6. Chạy bộ kiểm chứng (mục bên dưới).

## Translation memory (trong `gen-locale.mjs`)

Khi sinh lại `en`/`vi`, thay vì để trắng, tool tra bản dịch cũ theo 3 mức ưu tiên giảm dần:
1. đúng key, và chuỗi Trung của key đó KHÔNG đổi (an toàn nhất — key rename thì bị bỏ qua
   ở mức này, rơi xuống mức 2).
2. cùng namespace + cùng chuỗi Trung (bắt được trường hợp `_todoN` đổi số nhưng vẫn cùng chỗ).
3. cùng chuỗi Trung ở bất kỳ namespace nào (bắt được trường hợp string dùng chung nhiều nơi).

Nguồn tra cứu là **toàn bộ** `generated/*.zh-CN.ts` + `generated/*.<lang>.ts` hiện có, không
chỉ module đang sinh — nên một chuỗi từng dịch ở module `bpm` có thể tự động áp dụng lại
cho module `system` nếu trùng namespace hoặc trùng nguyên văn.

Giá trị nhớ được lấy ở dạng **RAW** (`loadGeneratedLocaleRaw`, không unescape) và ghi lại
y nguyên (`rawKeys` trong `renderLocaleFile`), KHÔNG escape lần 2. Lý do: bản dịch tay có
thể trộn dấu ngoặc nhọn literal đã escape (`{'{'}`) với placeholder thật vue-i18n (`{name}`)
— unescape rồi escape lại không phải phép biến đổi 1-1, sẽ escape nhầm luôn `{name}` thành
text hiển thị "{name}" thay vì được vue-i18n thay giá trị thật. (Bug này từng xảy ra và đã
sửa — xem lịch sử git file `gen-locale.mjs` nếu cần đối chiếu.)

**Giới hạn quan trọng**: `gen-locale.mjs` ghi đè TOÀN BỘ file dựa trên đúng tập key trong
`locale-delta-<name>.json` — key nào KHÔNG nằm trong delta (vd thêm tay qua
`apply-translations.mjs --extra`, xem mục dưới) sẽ **bị xóa** nếu `gen-locale.mjs` chạy lại
sau đó. Thứ tự chuẩn luôn là: `convert.mjs` → `gen-locale.mjs` → `apply-translations.mjs`
(key thêm tay áp SAU CÙNG, và phải áp lại mỗi lần `gen-locale.mjs` chạy lại).

## Key thêm tay ngoài phạm vi convert.mjs (`apply-translations.mjs`)

Một số chuỗi không đi qua được `convert.mjs` (chuỗi ghép, `defineProps` default, chuỗi
Trung truyền thẳng vào `t('...')` do lỗi gõ ở upstream...). Dùng file JSON riêng:

```jsonc
// scripts/i18n/manual-<name>.json
{
  "en": { "<key có sẵn>": "bản dịch mới" },       // ghi đè key ĐÃ CÓ trong delta
  "vi": { "...": "..." },
  "extra": {                                        // THÊM key MỚI, ngoài phạm vi delta
    "system.area.selectArea": {
      "zh-CN": "请选择地区", "en": "Please select area", "vi": "Vui lòng chọn khu vực"
    }
  }
}
```
```bash
node scripts/i18n/apply-translations.mjs <name> scripts/i18n/manual-<name>.json
```
Giá trị trong `extra` là message vue-i18n THÔ — viết `{name}` cho placeholder thật,
`{'{'}`/`{'}'}` nếu cần hiển thị dấu ngoặc nhọn literal. `apply-translations.mjs` tự đánh
dấu các key này là "raw" nên không bị escape lần 2.

Dùng `extra` chủ yếu cho 2 trường hợp:
- **`defineProps`/`withDefaults` default bị hoist** — không gọi được `t()` (xem mục "Các
  bẫy đã gặp"). Sửa: default rỗng (`''`) + template `:placeholder="placeholder || t('key')"`,
  key đó không nằm trong report của `convert.mjs` nên phải thêm tay qua `extra`.
- **Chuỗi ghép/nội suy** (`'A' + b + 'C'`, `` `${x} 意见` ``) mà `convert.mjs` cố ý để
  review — thêm key có placeholder rồi sửa source gọi `t('key', { x })`.

## Bộ kiểm chứng (không cần chạy dev server)

Repo có thể tạm thời không có `node_modules` hợp lệ (xem mục môi trường bên dưới) nên các
script này tự parse lại bằng AST thay vì dựa vào Vite biên dịch:

```bash
# 1. Còn chuỗi Trung ở vị trí hiển thị không (bắt cả điểm mù text-node lẫn interpolation,
#    vd `{{ x }}人为空时` mà to-en.mjs/convert.mjs không thấy)
node scripts/i18n/check-zh.mjs src/views/system --ignore "some/dir,other/file.js"

# 2. File còn parse/biên dịch được không (SFC + babel, không cần vite)
node scripts/i18n/compile-check.mjs src/views/system src/views/bpm

# 3. Mọi t('key') có key locale tương ứng không (key gõ sai/mất sẽ hiện thẳng lên UI vì
#    vue-i18n cấu hình silentTranslationWarn: true, không log lỗi)
node scripts/i18n/check-keys.mjs src/views/system src/views/bpm

# 4. t() có bị gọi TRƯỚC dòng `const { t } = useI18n()` không (TDZ runtime crash — xảy ra
#    khi upstream đã tự khai báo useI18n() nhưng ở CUỐI file, còn convert.mjs chèn t() vào
#    một hằng số top-level đầu file, vd mảng `columns` cấu hình bảng)
node scripts/i18n/check-tdz.mjs src
```

Chạy đủ cả 4 lệnh sau mỗi lần `--apply`, KHÔNG chỉ nhìn output của `convert.mjs`/`to-en.mjs`.
Cả 4 lỗi trên đều **im lặng lúc runtime** (không throw, không log) — chỉ lộ ra khi người
dùng bấm vào đúng màn hình đó.

## Môi trường: parser AST không cần `node_modules` đầy đủ

Nếu `node_modules` bị thiếu/hỏng (vd `pnpm install` bị supply-chain policy chặn vì
`pnpm-lock.yaml` trỏ tarball về `registry.npmmirror.com` trong khi policy chỉ chấp nhận
`registry.npmjs.org`), 3 tool sau vẫn chạy được — chúng chỉ cần `@vue/compiler-sfc`,
`@babel/parser`, `@babel/traverse`:

```bash
mkdir -p /tmp/i18n-deps && cd /tmp/i18n-deps
npm install --registry=https://registry.npmjs.org @vue/compiler-sfc @babel/parser @babel/traverse
cd -
mkdir -p node_modules/@vue node_modules/@babel
ln -sfn /tmp/i18n-deps/node_modules/@vue/compiler-sfc node_modules/@vue/compiler-sfc
ln -sfn /tmp/i18n-deps/node_modules/@babel/parser     node_modules/@babel/parser
ln -sfn /tmp/i18n-deps/node_modules/@babel/traverse    node_modules/@babel/traverse
```
Symlink nằm trong `node_modules` (đã gitignore) nên không ảnh hưởng gì tới commit. Sau khi
`pnpm install` chạy thành công trở lại, các symlink này bị ghi đè bình thường, không cần dọn.
