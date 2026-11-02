# Vun Vén — NestJS API

Nền backend gồm NestJS, TypeORM và MySQL/InnoDB. `AppModule` ghép ConfigModule, DatabaseModule, UsersModule và AuthModule; `main.ts` chỉ bootstrap HTTP. Đây là nền xác thực, chưa cung cấp API ví, giao dịch hoặc ngân sách và chưa kết nối frontend.

## Chuẩn bị

Cần Node.js 20 trở lên và MySQL. Cấu hình múi giờ server/session MySQL là UTC để các cột thời gian tự động có cùng quy ước với API; tùy chọn `timezone: Z` của driver chỉ quy định chuyển đổi dữ liệu, không tự đổi múi giờ server. Tạo database UTF-8 và tài khoản có quyền trên database đó, sau đó sao chép `.env.example` thành `.env`, điền cấu hình. Đặt `JWT_SECRET` bằng ít nhất 32 ký tự ngẫu nhiên. Không commit `.env`.

```bash
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

`migration:run` build TypeScript rồi thực thi migration qua TypeORM. `synchronize` bị tắt: thay đổi schema phải đi qua migration. Xóa migration bằng `migration:revert` sẽ xóa bảng users và dữ liệu trong bảng, chỉ dùng khi đã hiểu tác động. Server lắng nghe cổng `PORT`, tiền tố `/api`.

## Luồng xác thực

1. `POST /api/auth/register`: `{ "displayName": "An", "email": "an@example.com", "password": "mat-khau-dai-12-ky-tu" }`. Password tối thiểu 12 ký tự; lưu hash scrypt có salt, không lưu mật khẩu gốc.
2. `POST /api/auth/login`: `{ "email": "an@example.com", "password": "..." }`. Trả `{ "accessToken": "...", "tokenType": "Bearer" }`.
3. `GET /api/auth/me` với header `Authorization: Bearer <accessToken>` trả `id`, `displayName`, `email`. JWT hết hạn mặc định sau 900 giây; không có refresh token hoặc thu hồi token trong nền hiện tại.
4. `GET /api/health` là endpoint công khai báo tiến trình HTTP đang chạy, không phải kiểm tra sức khỏe DB liên tục.

Guard JWT áp dụng mặc định; chỉ route có `@Public()` được bỏ qua. Passport JWT strategy xác minh chữ ký và hạn token, sau đó tải user từ DB; `@CurrentUser()` lấy user đã xác thực. Middleware gắn `X-Request-Id`; interceptor log phương thức, route và thời gian, không log body hay token. ValidationPipe loại và từ chối các trường ngoài DTO.

JWT trả qua response body để client quyết định cách giữ token; cách lưu token, đăng xuất/thu hồi, giới hạn đăng nhập và chính sách triển khai cần được thiết kế trước khi tích hợp frontend hoặc public service.

## Kiểm tra

```bash
npm run build
```

DB config được xác thực lúc khởi động. Migration hiện chỉ tạo bảng `users`; các bảng trong sơ đồ được thêm khi làm module nghiệp vụ tương ứng. Chưa có cơ chế import dữ liệu localStorage của frontend.
