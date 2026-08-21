/** @type {import('tailwindcss').Config} */
module.exports = {
    // Quét toàn bộ index.html (kể cả các class nằm trong chuỗi JavaScript nội tuyến)
    content: ['./index.html'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', '"Segoe UI"', 'sans-serif'],
            },
            colors: {
                // Trích từ logo BVĐK Hùng Vương: navy #1F4E9C, thép #4A7EB5,
                // sky #4FC3F0, chữ thập đỏ #E32219. Cùng hệ với trang AI-edu.
                // Namespace "brand" để không ghi đè bảng màu mặc định của
                // Tailwind — các class sky-*/slate-* cũ trong form vẫn chạy.
                canvas: { DEFAULT: '#F4F9FE', deep: '#E6EFF9' },
                line: { DEFAULT: '#D8E4F2', soft: '#E6EDF6' },
                ink: { DEFAULT: '#0C1A2B', 2: '#243A52', 3: '#4A5C72', 4: '#6B7E95' },
                brand: {
                    'sky-light': '#A8E1F9',
                    sky: '#4FC3F0',
                    'sky-deep': '#2E86C8',
                    steel: '#4A7EB5',
                    navy: '#1F4E9C',
                    'navy-deep': '#14336E',
                    'navy-night': '#0B2350',
                },
                // Vàng lễ nghi — chỉ dùng cho dấu "lần thứ II", mốc trao giải
                // và hạng nhà tài trợ Vàng. Không dùng để trang trí chỗ khác.
                gold: { light: '#EBD07A', DEFAULT: '#C9A227', deep: '#8C6D12' },
                cross: '#E32219',
            },
            borderRadius: {
                field: '8px',
                card: '10px',
                shell: '16px',
            },
            boxShadow: {
                // Bóng đổ mang màu navy chứ không phải đen xám
                card: '0 1px 2px rgb(12 26 43 / 0.05), 0 22px 44px -20px rgb(20 51 110 / 0.42)',
                tile: '0 1px 2px rgb(12 26 43 / 0.05), 0 16px 32px -18px rgb(20 51 110 / 0.40)',
                pop: '0 30px 70px -30px rgb(20 51 110 / 0.60)',
            },
            keyframes: {
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-up': 'fade-up .5s cubic-bezier(.16,1,.3,1) both',
            },
        },
    },
    plugins: [],
};
