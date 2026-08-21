# Website Hội nghị Khoa học Điều dưỡng – Kỹ thuật y lần II (BVĐK Hùng Vương)

Trang tĩnh, deploy bằng GitHub Pages tại `hn2026.benhvienhungvuong.vn`.

## Hệ thiết kế "Khối thoi"

Trang dùng chung hệ token với trang đào tạo AI nội bộ của bệnh viện, để hai sản
phẩm nhìn ra một nhà. Toàn bộ token nằm trong [`src/tailwind-input.css`](src/tailwind-input.css)
và [`tailwind.config.js`](tailwind.config.js).

| Thành phần | Quy tắc |
|---|---|
| Chữ | Be Vietnam Pro (vẽ riêng cho tiếng Việt). Tiêu đề `font-extrabold` + `tracking-[-0.035em]` |
| Màu | Trích từ logo: navy `#1F4E9C`, thép `#4A7EB5`, sky `#4FC3F0`. Đặt trong namespace `brand-*` |
| Vàng lễ nghi | `gold-*` — **chỉ** dùng cho dấu "lần thứ II", mốc trao giải, hạng tài trợ Vàng. Không trang trí chỗ khác |
| Bề mặt | Không bao giờ phẳng: `.surface`, `.surface-tile`, `.surface-navy` đều là gradient |
| Bóng đổ | Ám navy (`shadow-card/tile/pop`), không dùng bóng đen xám |
| Motif | Khối thoi 45° từ logo: `.dia` (dấu đầu dòng), `.cut-corner` (góc vát), `.plate` (khung ảnh hero) |
| Nền trang | `.app-canvas` + `.diag-bands` — dải chéo 45° lấy từ ba vệt chéo trong logo |
| Nút | `.btn-primary` / `.btn-secondary` / `.btn-on-dark` / `.btn-light` |

Thanh điều hướng có hai trạng thái: trong suốt khi nằm trên hero navy, thêm class
`.nav-solid` (do hàm `syncNavbar()` gắn) khi đã cuộn hoặc khi đang ở màn hình biểu mẫu.

Ô nhập trong hai biểu mẫu được thống nhất diện mạo bằng CSS chọn theo
`#cme-form-view input`, `#report-form-view select`… ở cuối file input CSS, nên
**không cần** sửa class trên từng ô khi muốn đổi kiểu.

## ⚠️ Quan trọng: CSS Tailwind nay là file build sẵn

Trước đây trang dùng `cdn.tailwindcss.com` — script này tự sinh CSS ngay trong trình duyệt
của người xem, khiến trang **chặn hiển thị 1–2 giây** ở lần mở đầu tiên.

Nay CSS được build sẵn thành file [`tailwind.css`](tailwind.css) (~39 KB, ~7 KB sau nén).

**Hệ quả:** mỗi khi sửa `index.html` mà **thêm class Tailwind mới**
(ví dụ thêm `bg-teal-500`, `mt-14`, `lg:grid-cols-5`…), phải chạy lại lệnh build,
nếu không class mới sẽ **không có tác dụng**:

```bash
npm install        # chỉ cần chạy 1 lần đầu
npm run build:css  # chạy lại sau mỗi lần thêm class mới
```

Nếu đang sửa nhiều, mở một cửa sổ terminal chạy chế độ tự động build:

```bash
npm run watch:css
```

Chỉ sửa chữ, sửa số, đổi ảnh… mà **không thêm class mới** thì không cần build lại.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `index.html` | Toàn bộ trang (HTML + JS nội tuyến) |
| `tailwind.css` | CSS build sẵn — **không sửa tay**, file này bị ghi đè mỗi lần build |
| `src/tailwind-input.css` | Nguồn đầu vào của Tailwind |
| `tailwind.config.js` | Cấu hình Tailwind (quét class trong `index.html`) |
| `Dang_ky_tham_du.gs` | Google Apps Script xử lý form đăng ký |
| `sponsors/` | Logo nhà tài trợ |

## Ảnh

Ảnh đã được nén/thu nhỏ về đúng kích thước hiển thị. Khi thay ảnh mới, nhớ giảm
kích thước trước khi đưa lên (ảnh nền ≤ 1280px chiều ngang, logo ≤ 200px chiều cao).
Ảnh nền có 2 định dạng: `hungvuong1.webp` (trình duyệt hiện đại) và
`hungvuong1.jpg` (dự phòng) — thay thì thay cả hai.
