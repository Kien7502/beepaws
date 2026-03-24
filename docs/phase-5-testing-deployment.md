# Phase 5: Testing, Optimization & Deployment

## Mục tiêu

Đảm bảo ứng dụng ổn định, có tốc độ load nhanh, chuẩn SEO thương mại điện tử và tổ chức setup đưa lên môi trường server public.

## Nhóm công việc

1. **Chuẩn SEO (Search Engine Optimization)**
   - Dynamic Metadata: Inject các meta tags tối ưu cho Trang Sản phẩm, sử dụng dữ liệu sản phẩm Shopify (Title, Description).
   - Open Graph Tags & Twitter cards để chia sẻ link cửa hàng lên mạng xã hội hiển thị giao diện đẹp, có ảnh bìa lấy từ sản phẩm tương ứng.
   - Hỗ trợ Schema Markup (JSON-LD) cho Product Schema để Google index giá tiền và rating tốt hơn.

2. **Tối ưu hóa hiệu suất (Performance Optimization)**
   - Sử dụng React Server Components (Nếu theo Next.js App Router) kết hợp API Caching từ Shopify để rút ngắn thời gian load trang (Load Time).
   - Hình ảnh (Images) phải được tải lười (Lazy loading) nếu nằm ngoài màn hình và sử dụng `next/image` component để tự động resize.

3. **Kiểm thử (Quality Assurance & Testing)**
   - **Mobile Verification**: Đảm bảo layout Responsive 100%, UX bấm bằng ngón tay trên điện thoại thuận lợi vì 70% khách mua đồ thú cưng lướt web trên di động.
   - Build và kiểm tra lỗi type của Typescript/ESLint để đảm bảo không lỗi code tiềm ẩn.
   - Đặt hàng thử nghiệm nghiệm nghiệm thu (End-to-end Test with Bogus Gateway trên Shopify).

4. **Triển khai (Deployment & Go Live)**
   - Thiết lập Project liên kết với GitHub Repo.
   - Triển khai website Node.js/Headless lên Vercel Serverless. Nền tảng này hỗ trợ tốt nhất cho quy trình build NextJS.
   - Gắn biến môi trường Production (`.env` trên server).
   - Gắn Custom Domain của brand cho Vercel frontend.
   - Cấu hình trang quản lý Shopify (Primary Domain, Setup redirect nếu cần).
