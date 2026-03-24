# Phase 2: UI/UX Design System & Core Components

## Mục tiêu

Xây dựng hệ thống UI nhất quán, mang lại cảm giác cao cấp, đáng yêu và thân thiện cho người dùng dựa trên phong cách của 2 trang web mẫu (Cuddlesmeow và Pawthantics).

## Yêu cầu thiết kế (Design Guidelines)

- **Màu sắc (Colors)**: Sử dụng các gam màu ấm áp hoặc pastel (cam, hồng đào, xanh dương nhạt, xám nhạt) làm màu nhấn giúp tạo cảm giác dễ chịu.
- **Typography**: Sử dụng font chữ hiện đại, bo tròn nhẹ, ví dụ Google Font `Inter`, `Nunito` hoặc `Quicksand`.
- **Thẩm mỹ chung**: Tối giản, nội dung hiển thị to, rõ nét, tập trung vào hình ảnh sản phẩm thú cưng chất lượng cao. Các khối và nút bấm (buttons) thường sẽ được bo góc mềm mại (rounded-lg, rounded-full).

## Danh sách Core Components Cần Build

1. **Layout Components**
   - `Header`: Thanh điều hướng cố định (Sticky/Fixed), kèm Banner thông báo (Announcement bar), menu logo góc trái/trung tâm, tìm kiếm, account và icon giỏ hàng góc phải.
   - `Footer`: Links chính sách về thú cưng, chính sách hoàn tiền, đăng ký nhận bản tin email (newsletter) form, link social media.
2. **UI Kit Elements**
   - `Button`: Tạo các dạng buttons tái sử dụng (Primary - màu nổi bật, Secondary - màu nền nhẹ, Outline - viền, Ghost - chỉ chữ).
   - `Input & Select`: Các trường nhập liệu tìm kiếm, form nhập địa chỉ giao hàng chuyên nghiệp, dễ sử dụng.
   - `ProductCard`: Thẻ hiển thị sản phẩm thu gọn bao gồm: Hình ảnh (zoom khi hover), tên sản phẩm, giá tiền, rating, và nút "Thêm vào giỏ" nhanh.
3. **Sections Trang Chủ**
   - `Hero/HeroBanner`: Khối ảnh bìa cỡ lớn với Call-to-action (CTA).
   - `Feature List`: Các đặc tính của shop (ví dụ: Free shipping, chất lượng hàng đầu, v.v.).
