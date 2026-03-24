# Prompt Phase 2: UI/UX Design System & Core Components

**Mục tiêu của lệnh này:** Xây dựng hệ thống UI kit và cấu hình giao diện chuẩn mực, đẹp và đáng yêu dành cho pet shop theo hướng Cuddlesmeow/Pawthantics.

**Hãy copy và dán nội dung bên dưới cho AI để bắt đầu thực hiện Phase 2:**

```text
Chúng ta đang ở Phase 2 của dự án Pet E-commerce. Dự án của chúng ta đã có Next.js, Typescript và Tailwind CSS. Bây giờ hãy xây dựng bộ thư viện UI Components gốc rễ và cấu phần layout trang. Thiết kế cần mang cảm giác cao cấp, cute với các góc bo tròn (rounded-2xl) và micro-animations.

Yêu cầu thực hiện tuần tự và cung cấp mã code React (TypeScript) chi tiết:

1. Xây dựng các UI Kit siêu sử dụng lại (Reusable Components) trong thư mục `components/ui/`:
   - `Button.tsx`: Component Button có nhiều variant (primary, secondary, outline) hỗ trợ loading state, icon. Tailwind class bo góc mượt mà, hover có đổi màu hoặc scale nhẹ.
   - `Input.tsx`: Component cho text field, cần xử lý border đẹp mắt khi `:focus`.
2. Xây dựng Header & Footer (`components/layout/`):
   - `Header.tsx`: Một thanh navigation cố định phía trên màn hình (sticky header).
     + Chứa Top Announcement bar mỏng (ví dụ: "Free Shipping on orders over $50!").
     + Có Logo ở giữa.
     + Icon Giỏ hàng (Cart) ở góc phải màn hình, có con số nhỏ báo hiệu số lượng (hiện tạo text tĩnh là "0" để chờ tích hợp sau).
   - `Footer.tsx`: Cung cấp section đăng ký email (newsletter), list các links nhanh hỗ trợ khách hàng, icon mạng xã hội.
3. Xây dựng Product Card UI (`components/product/ProductCard.tsx`):
   - Thẻ sản phẩm tối giản:
     + Khối ảnh (tỷ lệ 1:1, khi hover vào ảnh sẽ zoom in nhẹ).
     + Tên sản phẩm, giá tiền (chỗ cho compare-at price bị gạch ngang nếu có giảm giá).
     + Nút `Add to Cart` bo tròn.
   - Cung cấp component này dạng dumb component (chỉ nhận props từ ngoài vào như `title`, `price`, `imageUrl`).
4. Khung trang chủ (`app/page.tsx`):
   - Lắp ráp `Header` và `Footer`.
   - Tạo một `HeroBanner` component để trong trang chủ: Cần có một ảnh lớn (placeholder), dòng headline nổi bật ("Your pet deserves the best"), và nút CTA ("Shop Now").
   - Nhúng thử 1 grid render ra 4 cái `ProductCard` mẫu dùng dữ liệu tĩnh (mockup data).

Vui lòng viết code Tailwind class sạch và sử dụng Semantic HTML.
```
