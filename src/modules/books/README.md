# Books API

Yêu cầu database đã có bảng users, books, categories, wallets từ database/schema.sql.
synchronize=false: module không tự tạo hoặc thay đổi bảng. Foreign key do SQL schema quản lý.

Tất cả endpoint yêu cầu Authorization: Bearer <accessToken>.

- POST /api/books với body {"name":"Sổ cá nhân"} trả 201, gồm sổ và mảng categories/wallets.
  Tên được trim, dài 1–120 ký tự. Chỉ nhận name; ownerId lấy từ JWT, currency luôn VND,
  timezone luôn Asia/Ho_Chi_Minh. Tạo sổ + 6 danh mục + 2 ví trong một transaction.
  Nếu một bước lỗi, toàn bộ thao tác rollback. Mỗi POST tạo một sổ mới; không tự retry POST.
- GET /api/books trả danh sách sổ của user, hoặc [] nếu chưa có sổ.
- GET /api/books/:bookId trả sổ kèm danh mục và ví (bao gồm cả mục không hoạt động).
  UUID không hợp lệ trả 400. Sổ không tồn tại hoặc thuộc user khác trả cùng lỗi 404.

Luồng frontend: đăng nhập -> GET /api/books -> nếu rỗng, POST /api/books ->
dùng id để GET /api/books/:bookId. Với sổ tạo qua API, không cần chạy seed-defaults.sql.
Không tự tạo sổ khi đăng ký, không sửa dữ liệu localStorage của frontend.
Ví mới chưa có biến động; response ví chưa có trường số dư.

Kiểm tra: npm run build và node --test test/books.test.cjs.
Các bài kiểm tra dùng dependency giả lập, không kết nối MySQL.

Chế độ khách: frontend hiện dùng localStorage và tiếp tục hoạt động không cần đăng nhập.
API Books chỉ dành cho dữ liệu tài khoản đã đăng nhập. Không gửi dữ liệu khách lên server
và không tự gộp dữ liệu localStorage vào tài khoản. Kết nối frontend/chuyển chế độ sẽ làm ở bước tích hợp.

## Response tại controller

Các endpoint Books bọc kết quả thành { "success": true, "message": "...", "data": ... }.
POST giữ HTTP 201; GET giữ HTTP 200. Dữ liệu được mô tả ở trên nằm trong data.
BaseResponse<T> dùng chung tại src/common/dto/base-response.dto.ts.
Controller await service trước khi bọc response, không catch rồi trả lỗi dưới HTTP 200.
Exception đi qua HttpExceptionFilter toàn cục, giữ HTTP status 400/401/404/500...
Mọi response lỗi HTTP trả { "success": false, "message": "Đã xảy ra lỗi. Vui lòng thử lại sau.", "data": null }; không trả chi tiết lỗi hoặc validation. Lỗi server được log tại backend. Response thành công của Auth giữ định dạng hiện tại.