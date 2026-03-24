# Prompt Phase 1: Project Setup & Architecture

**Mục tiêu của lệnh này:** Khởi tạo dự án Next.js kết hợp TypeScript, Tailwind CSS và thiết lập bộ khung giao tiếp API với Shopify Storefront.

**Hãy copy và dán nội dung bên dưới cho AI để bắt đầu thực hiện Phase 1:**

```text
Bạn đóng vai trò là một chuyên gia lập trình Next.js (App Router) và Headless Shopify. Hãy giúp tôi thực hiện Phase 1 của dự án e-commerce bán đồ thú cưng. Dự án này sẽ sử dụng TypeScript, Tailwind CSS.

Yêu cầu thực hiện tuần tự các bước sau, hãy viết code hoặc câu lệnh chi tiết cho từng bước:

1. Định hướng cho tôi tập tin khởi tạo: Cung cấp lệnh `npx create-next-app` chính xác để tạo app Next.js phiên bản mới nhất (App Router, có TypeScript, Tailwind CSS, ESLint) vào thư mục hiện tại.
2. Cấu hình biến môi trường: Tạo file hướng dẫn `.env.example` và thiết lập file `.env.local` với các biến cần thiết cho Shopify Storefront API (ví dụ: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`). Không lưu token thực tế vào code.
3. Cấu hình Shopify GraphQL Client:
   - Hãy tạo thư mục `lib/shopify`.
   - Viết một file `lib/shopify/index.ts` chứa hàm `shopifyFetch`. Hàm này sử dụng `fetch` API tiêu chuẩn (không cài thêm Apollo hay graphql-request để tối ưu) thực hiện các request dạng POST tới endpoint GraphQL của Shopify, và đính kèm access token ở Header.
   - Hàm này phải return kết quả an toàn và xử lý lỗi cơ bản (error handling) khi API bị sập.
4. Thiết lập Typography và Màu sắc trong Tailwind CSS:
   - Cấu hình file `tailwind.config.ts`.
   - Thêm font Google `Inter` hoặc `Quicksand` làm font mặc định.
   - Thêm bộ màu pastel nhẹ nhàng phù hợp shop thú cưng (như peach-orange, nhạt, baby-blue) làm màu root (`primary`, `secondary`, `accent`, `background`).
5. Tạo cấu trúc thư mục tiêu chuẩn:
   - Hãy liệt kê yêu cầu cho tôi để tạo các thư mục trống chuẩn bị cho các phase sau (ví dụ: `components/ui`, `components/product`, `types`).
   - Tạo file `types/shopify.ts` khai báo interface cơ bản phản hồi từ Shopify (ví dụ: `Product`, `Collection`, `Image`).

Vui lòng cung cấp toàn bộ code và giải thích ngắn gọn, đừng đi lan man. Sau khi tôi thực thi xong, chúng ta sẽ qua Phase 2.
```
