# Phase 1: Project Setup & Architecture

## Mục tiêu

Thiết lập nền tảng dự án để xây dựng giao diện bán hàng Headless cho Shopify, sử dụng TypeScript và Tailwind CSS.

## Các bước thực hiện

1. **Khởi tạo dự án**
   - Sử dụng Next.js (App Router) hoặc Remix để tối ưu SEO và hiệu suất tải trang. Next.js là lựa chọn phổ biến nhất hiện nay cho Headless Shopify.
   - Lệnh khởi tạo dự án: `npx create-next-app@latest beepaws --typescript --tailwind --eslint`
2. **Cấu hình biến môi trường (Environment Variables)**
   - Thiết lập `.env.local` (xem `.env.example`):
     - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`: `your-store.myshopify.com`.
     - **Catalog (GraphQL Admin)**: `SHOPIFY_ADMIN_ACCESS_TOKEN` (server-only) hoặc cặp client id/secret — dùng trong `lib/shopify/queries.ts`.
     - **Tuỳ chọn — Cart Storefront**: `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` nếu cần Cart GraphQL / route checkout JSON.
   - Tuỳ chọn: `NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL` cho domain storefront khách thấy (link giỏ).
   - Sản phẩm cần **published** / trạng thái phù hợp trên Admin để Admin API đọc được (theo scope app).
3. **Thiết lập GraphQL Client**
   - Không cần dùng thư viện quá nặng, cấu hình hàm fetch cơ bản để thực hiện GraphQL requests tới Shopify API.
   - Tạo thư mục `lib/shopify/` để chứa các query/mutation strings và helper functions.
4. **Cấu hình ban đầu cho Tailwind CSS**
   - Tinh chỉnh file `tailwind.config.ts` để thêm các mảng màu chủ đạo, phông chữ (fonts) và border radius phù hợp với phong cách của pet shop.
5. **Định hình Cấu trúc thư mục (Folder Structure)**
   - `/app`: Chứa cấu trúc routing của dự án.
   - `/components`: Chứa UI components (Header, Footer, Product, Cart).
   - `/lib`: Helper functions và Shopify API requests.
   - `/types`: Định nghĩa strict types/interfaces cho TypeScript để tăng tính ổn định của mã nguồn.
