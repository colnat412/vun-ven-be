# Database Vun Vén

## Cài đặt

Yêu cầu MySQL 8.0.16 trở lên để thực thi CHECK constraints. Database mặc định là `vunven`, khớp DB_NAME hiện tại. Script dùng InnoDB và utf8mb4.

1. Mở `schema.sql` trong MySQL Workbench hoặc công cụ SQL đang dùng, chạy toàn bộ trên database mới.
2. Khởi động backend và đăng ký qua `POST /api/auth/register` với displayName, email, password. Backend tạo UUID và hash scrypt đúng định dạng.
3. Trong `seed-defaults.sql`, thay `@owner_email` bằng email vừa đăng ký, rồi chạy để tạo sổ, cài đặt giao diện, 6 danh mục và 2 ví. Không tạo mật khẩu/tài khoản mẫu.
4. Có thể chạy lại seed tuần tự; seed bổ sung các mặc định còn thiếu vào sổ đầu tiên và giữ dữ liệu đã có.

Nếu dùng mysql CLI, mở client với UTF-8 và chạy:

```sql
SOURCE D:/COLNAT/vun-ven/vun-ven-be/database/schema.sql;
-- Chỉnh email trong file trước bước sau:
SOURCE D:/COLNAT/vun-ven/vun-ven-be/database/seed-defaults.sql;
```

Schema dành cho database mới: không DROP/TRUNCATE và không tự sửa bảng cũ. CREATE TABLE sẽ báo lỗi nếu bảng đã tồn tại; không dùng chế độ bỏ qua lỗi. DDL MySQL không rollback toàn bộ file; nếu chạy bị lỗi giữa chừng, kiểm tra các bảng đã tạo trước khi chạy lại. Nếu database đang có dữ liệu, cần migration riêng sau khi đối chiếu schema thực tế.

## Đối chiếu project

- Đủ 9 bảng trong sơ đồ, thêm view `wallet_balances`.
- `users` khớp entity hiện tại: UUID VARCHAR(36), display_name VARCHAR(120), email VARCHAR(254), password_hash VARCHAR(255), DATETIME(3).
- Email có UNIQUE để logic bắt ER_DUP_ENTRY của UsersService hoạt động. Entity hiện tại chưa khai báo unique; khi bổ sung migration/entity sau này cần giữ ràng buộc này.
- Các mã danh mục là food, transport, shopping, bills, entertainment, other; tên hiển thị tương ứng 6 danh mục frontend. Không lưu màu vì màu đến từ theme.
- Ví dùng kind cash/bank; giao dịch dùng income/expense/transfer. Transfer được chuẩn bị trong schema, chưa có API/UI tương ứng.
- Theme light/dark; tiền lưu BIGINT nguyên đồng. Giới hạn nhập 1.000.000.000.000 của frontend cần được kiểm tra ở API khi xây module; schema cho phép toàn dải BIGINT dương.
- Khóa ngoại ghép book_id bảo đảm giao dịch, danh mục, ví và ngân sách cùng sổ. DELETE mặc định RESTRICT để tránh tự động xóa lịch sử.
- Tổng ngân sách độc lập với hạn mức danh mục. NULL là chưa đặt tổng hạn mức; 0 là hạn mức bằng 0.
- Chưa có migration nào được đăng ký trong database-options.ts. `npm run migration:run` hiện không thay thế việc chạy script này.
- Backend hiện chỉ có auth/users, synchronize=false. Script không bổ sung API nghiệp vụ hoặc tự khởi tạo sổ sau đăng ký. Frontend vẫn dùng localStorage, chưa tự nhận dữ liệu SQL.

## Quy tắc cần thực hiện ở backend

CHECK/FK chỉ kiểm tra từng dòng và tham chiếu. Backend phải ghi giao dịch và wallet_entries trong cùng DB transaction:
- Thu: đúng 1 biến động bằng +amount_vnd.
- Chi: đúng 1 biến động bằng -amount_vnd.
- Chuyển ví: đúng 2 ví khác nhau, một -amount_vnd và một +amount_vnd.
- Sửa/xóa giao dịch phải sửa/xóa biến động cùng transaction. Kiểm tra version cũ và tăng version khi cập nhật.
- Kiểm tra owner_id theo người dùng đã xác thực; các FK không thay thế phân quyền.
- Trả tiền ở dạng chuỗi; cấu hình driver trả BIGINT dưới dạng chuỗi khi bổ sung entity nghiệp vụ.

Số dư view chỉ đúng khi các quy tắc ghi biến động trên được bảo đảm. Không có trigger tự tạo biến động hoặc ràng buộc liên dòng trong script.

Tất cả DATETIME lưu UTC; occurred_on là ngày nghiệp vụ theo Asia/Ho_Chi_Minh. SET SESSION trong script chỉ áp dụng kết nối chạy script. Cần cấu hình MySQL server/kết nối backend dùng UTC; timezone: 'Z' của driver không tự đặt timezone server.

## Kiểm tra sau cài đặt

```sql
USE vunven;
SHOW TABLES;
SHOW CREATE TABLE transactions;
SHOW CREATE TABLE wallet_entries;
SELECT * FROM wallet_balances;
```

Đã đối chiếu tĩnh với source backend/frontend và sơ đồ. Chưa thực thi trên MySQL trong môi trường tạo script.
