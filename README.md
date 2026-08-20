# Website Hội nghị Khoa học Điều dưỡng – Kỹ thuật y lần II (BVĐK Hùng Vương)

Trang tĩnh, deploy bằng GitHub Pages tại `hn2026.benhvienhungvuong.vn`.

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
