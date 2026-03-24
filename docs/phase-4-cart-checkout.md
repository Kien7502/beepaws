# Phase 4: Cart & Context API (Giỏ hàng và Thanh toán)

## Mục tiêu

Xử lý logic giỏ hàng ở phía Client, quản lý vòng đời giỏ hàng thông qua Shopify Storefront API và triển khai quá trình chuyển hướng tới luồng thanh toán bảo mật.

## Chi tiết triển khai

1. **Quản lý biến trạng thái (Cart State Management)**
   - Sử dụng React Context API (hoặc thư viện Zustand cho nhẹ) để bọc toàn bộ App, giúp số lượng sản phẩm trên icon Cart ở Header luôn được cập nhật theo thời gian thực (Real-time).
   - Lưu trữ Storefront Cart ID liên kết với giỏ hàng của Shopify vào LocalStorage hoặc Cookie để đảm bảo khi khách hàng refresh trang, giỏ hàng không bị xóa mất.

2. **Giao diện Giỏ hàng (Cart Drawer / Mini Cart slider)**
   - **Luồng (Flow)**: Khi ấn Add to Cart ở bất kỳ đâu -> Mở Slide Cart trượt ra từ góc ngang màn hình phải (Cart Drawer) thay vì chuyển trang. Trải nghiệm này mang lại cảm giác mượt mà và premium như mẫu Pawthantics.
   - **Hiển thị giỏ hàng**: List các item đã thêm, hình thumbnail, giá tiền, số lượng.
   - **Cập nhật giỏ hàng thực thi API trực tiếp**:
     - Input/Button Tăng giảm số lượng (Tích hợp debounce khi gọi API update số lượng).
     - Nút xoá sản phẩm khỏi giỏ (Remove product).
   - Dòng tổng phụ (Subtotal) tạm tính tính tổng bằng API trả về.

3. **Shopify APIs Cần Dùng:**
   - `cartCreate`: Tạo Cart ID mới khi visitor chưa có giỏ.
   - `cartLinesAdd`: Gọi để đẩy item vào Cart.
   - `cartLinesUpdate`: Cập nhật Quantity của một Line Item.
   - `cartLinesRemove`: Xóa Line Item.

4. **Quá trình Checkout (Luồng thanh toán gốc)**
   - Vì xây dựng Headless Shopify, toàn bộ quá trình Nhập thẻ Credit, địa chỉ nhận hàng sẽ ĐƯỢC ỦY QUYỀN TRẢ CHO TRANg CHECKOUT GỐC CỦA SHOPIFY (checkout.shopify.com).
   - Trích xuất URL Thanh Toán (Checkout URL) từ response của Shopify Cart API.
   - Gắn URL này vào nút bấm ở Cart Drawer: Khách bấm "Thanh Toán" (`Checkout`) -> Redirect qua cổng bảo mật `https://[store].myshopify.com/checkout`.
