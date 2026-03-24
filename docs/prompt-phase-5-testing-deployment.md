# Prompt Phase 5: Testing, Optimization & Deployment

**Mục tiêu của lệnh này:** Cấu hình SEO tĩnh/động, tối ưu hóa điểm số trang web và hướng dẫn cách triển khai (hosting) lên Vercel.

**Hãy copy và dán nội dung bên dưới cho AI để bắt đầu thực hiện Phase 5:**

```text
Phase 5 cũng là Phase cuối: Tối ưu hoá SEO thẻ Meta, Tối ưu ảnh và Hướng dẫn Deploy dự án Headless Shopify NextJS.

Xin hãy thực hiện các yêu cầu kỹ thuật sau:

1. Tối ưu SEO cho sản phẩm (`app/products/[handle]/page.tsx`):
   - Hướng dẫn tôi sử dụng tính năng `generateMetadata` của Next.js Server Components.
   - Chèn thẻ tham số `title`, `description` dựa vào payload của Shopify Product.
   - Thêm thẻ `OpenGraph` (og:title, og:image) để khi paste URL sản phẩm vào Facebook, Zalo, Twitter sẽ hiện hình ảnh mô tả chuẩn đẹp.
   - Bổ sung cấu trúc dữ liệu JSON-LD Schema (`@type: "Product"`) render vào file bằng Script tag.

2. Tối ưu ảnh Product (Next Image):
   - Chỉ ra cách để mọi thẻ `<img>` sử dụng để render sản phẩm đều phải dùng `next/image` component.
   - Cấu hình domain ảnh trên file `next.config.mjs` cho phép image loading trực tiếp từ domain `cdn.shopify.com`. Cung cấp file config đó cho tôi.
   - Các components ngoài màn hình viewport phải xài mặc định lazy load (mặc định của Next/Image).

3. Quản lý Route Caching / Revalidate:
   - Viết webhook handler nhỏ tại `app/api/revalidate/route.ts` để nhận push tín hiệu mỗi khi trên Shop Admin tôi đổi giá tiền sản phẩm.
   - Hoặc cung cấp lệnh fetch API có Tag (`next: { tags: ['products'] }`) để tối ưu request tới Shopify mà vẫn giữ load nhanh.

4. Hướng dẫn quy trình Deployment & Go live:
   - Viết cho tôi bảng quy trình liệt kê 5 bước để đẩy code này lên nền tảng **Vercel** miễn phí.
   - Giải thích cho tôi cần chuyển các thông số nào vào bảng Environment Variables trên màn hình Setting của Vercel (đặc biệt nhấn mạnh vào token Shopify public, lưu ý sự khác biệt giữa development và production URL).

Code sạch, tập trung vào hiệu suất. Cảm ơn bạn.
```
