# Prompt Phase 4: Cart & Checkout

**Mục tiêu của lệnh này:** Tạo trải nghiệm giỏ hàng trượt mượt mà bằng React Context và tích hợp API tạo checkout/cart của Shopify.

**Hãy copy và dán nội dung bên dưới cho AI để bắt đầu thực hiện Phase 4:**

```text
Chuyển sang Phase 4: Quản lý Giỏ hàng (Cart) và tích hợp Shopify Checkout. Trải nghiệm mong muốn là có một slide drawer trượt ngang màn hình, không phải chuyển tải nguyên trang giỏ hàng.

Thực hiện viết code Next.js Typescript cho các việc sau:

1. GraphQL Mutations (`lib/shopify/mutations.ts`):
   - `createCart`: Đưa vào mảng line items đầu tiên và tạo ID giỏ hàng.
   - `addToCart`: Đưa ID giỏ hàng (`cartId`) và `lines` (variantId, quantity) vào.
   - `updateCart`: Đổi số lượng một line trong giỏ hàng (`cartId`, `lineId`, `quantity`).
   - `removeFromCart`: Xóa phần tử khỏi giỏ hàng.
   - `getCart` (Đây là Query bên `queries.ts`): Lấy thông tin chi tiết giỏ qua `cartId`.

2. State Management cho Giỏ Hàng (`components/cart/CartContext.tsx`):
   - Tạo React Context (hoặc hook) để lưu giữ State của Giỏ: Tổng tiền, Số lượng thẻ nhớ, Items.
   - Tạo các useEffect để check xem trong Cookie/Local Storage đã lưu `cartId` chưa. Nếu có rồi thì fetch lại data giỏ hàng đó lên.

3. Xây dựng Cart Drawer (`components/cart/CartDrawer.tsx`):
   - Slide bar trượt từ sát mép phải vào khi User ấn icon Giỏ Hàng trên Header.
   - Render list các món hàng đang có, đính kèm các nút [+] [-] để điều chỉnh số lượng mua nhanh (gọi API updateCart ngay lập tức nhưng nhớ thêm debounce để không spam request).
   - Nút xoá Remove product [x].
   - Phần dưới chứa Subtotal Price chuẩn theo API trả về.

4. Xử lý nút Add to Cart trên trang Sản Phẩm:
   - Gắn sự kiện `onClick` vào Component nút "Add to Cart" tại trang Product Detail. Gọi `addToCart` mutation kết nối với Client state để vừa update API vừa update số lượng góc trên màn hình. Mở CartDrawer ra tự động sau khi thêm thành công.

5. Luồng Thanh toán (Checkout):
   - API `getCart` luôn luôn trả về trường `checkoutUrl`.
   - Chặn nút "Checkout" (Thanh toán) ở phần Cart Drawer làm nhiệm vụ `window.location.href = checkoutUrl` đẩy khách đi thanh toán trên hosting gốc bảo mật của Shopify.

Lưu ý: Chú trọng tính đồng bộ State giữa UI và API nhé, đừng để User bấm Add to Cart rồi mà giỏ không cập nhật số nhé.
```
