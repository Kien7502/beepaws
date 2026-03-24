# Prompt Phase 3: Core E-commerce Features

**Mục tiêu của lệnh này:** Viết các query GraphQL để kéo dữ liệu từ Shopify và hiển thị danh mục, chi tiết sản phẩm.

**Hãy copy và dán nội dung bên dưới cho AI để bắt đầu thực hiện Phase 3:**

```text
Chúng ta tiếp tục với Phase 3. Ở bước này, bạn sẽ giúp tôi trực tiếp kết nối ứng dụng với dữ liệu thực tế từ Shopify API. Thư viện `lib/shopify/index.ts` đã có hàm `shopifyFetch`.

Hãy viết code chi tiết cho các công việc sau:

1. Shopify Queries (`lib/shopify/queries.ts`):
   - Viết query GraphQL `getCollections` để lấy danh sách các tệp bộ sưu tập.
   - Viết query GraphQL `getProducts` (nhận tham số `collectionHandle`, `sortKey`, `reverse`) để lấy mảng dữ liệu sản phẩm.
   - Viết query GraphQL `getProduct` (nhận tham số `handle`) lấy thông tin cực kỳ chi tiết của 1 sản phẩm: title, description, images, variants (id, price, title, availableForSale), options và SEO.

2. Cập nhật trang danh mục sản phẩm (Shop All page - `app/collections/all/page.tsx`):
   - Tạo trang lấy danh sách toàn bộ sản phẩm thông qua hàm fetch `getProducts` bạn vừa viết.
   - Render grid sử dụng vòng lặp các `ProductCard` (từ Phase 2) truyền dữ liệu thực vào.
   - (Tùy chọn) Thêm 1 thanh sidebar hoặc dropdown bên cạnh để sắp xếp (Sort by Price: Low to High).

3. Xây dựng trang chi tiết sản phẩm (PDP - `app/products/[handle]/page.tsx`):
   - Tạo Server Component fetch dữ liệu qua `getProduct` dựa theo URL param `handle`.
   - Grid giao diện 2 cột cho desktop (1 bên màn hình điện thoại):
     + Cột trái: `ProductGallery` (Image chính to, và 1 list thumbnail nhỏ bên dưới).
     + Cột phải: `ProductInfo` (Tên, Giá tiền).
   - Component `VariantSelector.tsx` (Client component): Xử lý hiển thị các options (ví dụ: Size M, L; Màu sắc Đỏ, Xanh). Cần update URL với query param (ví dụ `?variant=123`) mỗi khi người dùng click chọn loại.
   - Cập nhật giá tiền thay đổi theo Variant đang được chọn.

Vui lòng cung cấp chính xác cấu trúc GraphQL request để đảm bảo nó tương thích với Shopify Storefront API mới nhất.
```
