# Phase 3: Core E-commerce Features

## Mục tiêu

Tích hợp dữ liệu thực từ nền tảng Shopify thông qua Storefront API (GraphQL) và xây dựng các trang chức năng bán hàng cốt lõi (Trang chủ, Danh mục sản phẩm, Chi tiết sản phẩm).

## Chi tiết các trang chức năng

1. **Trang Chủ (Home Page)**
   - Gọi API lấy danh sách Collections nổi bật, Carousel các sản phẩm "Best Seller" hoặc sản phẩm mới để thu hút khách hàng.
   - Trưng bày các khối ảnh/banner Lifestyle của thú cưng cùng sản phẩm.
   - **Tham chiếu Pawthantics/Cuddlesmeow**: Sử dụng các ảnh thật lớn, thiết kế các banner chia làm 2 cột (1 bên ảnh pet, 1 bên chữ và nút mua).

2. **Trang Danh mục Sản phẩm (Collection / Shop All Page)**
   - URL: `/collections/all` hoặc `/collections/[collection-handle]`.
   - Grid hiển thị thẻ sản phẩm (Ví dụ: 3-4 cột trên desktop, 2 cột trên điện thoại).
   - **Tính năng lọc (Filtering) & Sắp xếp (Sorting)**:
     - Lọc sản phẩm theo tình trạng (In Stock).
     - Lọc theo loại hình (Chó, mèo, đồ grooming, v.v.).
     - Sắp xếp (Sort) theo giá (Tăng/Giảm), bảng chữ cái, hoặc bán chạy nhất.
   - Hỗ trợ Phân trang (Pagination) hoặc tải thêm (Load more) bằng con trỏ cursor của GraphQL.

3. **Trang Chi tiết Sản phẩm (Product Details Page - PDP)**
   - Lấy chi tiết thông tin sản phẩm qua Product Handle.
   - Hiển thị Image Gallery (Trình chiếu ảnh/video, ảnh to ở trên, thumbnails ở dưới).
   - Hiển thị tiêu đề, Giá (hiển thị giá đã giảm nếu có compareAtPrice), và mô tả sản phẩm (Rich text HTML format).
   - **Tùy chọn Variant (Option Selection)**: Lựa chọn màu sắc, kích thước (ví dụ: size M, L) điều chỉnh giá trị và cập nhật URL params.
   - Nút `Add to Cart` lớn, nổi bật. Cảnh báo hết hàng nếu tồn kho = 0.
   - Cross-sell/Upsell: Mục "Gợi ý mua kèm" hoặc "Sản phẩm liên quan".
