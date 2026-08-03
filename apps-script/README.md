# Backend Google Apps Script

`Code.gs` là API và lớp truy cập dữ liệu duy nhất của ứng dụng. Code tự tạo các sheet còn thiếu và nối thêm header thiếu; không xóa dữ liệu hiện có. Riêng thao tác “Hủy kết quả bốc thăm” đã được Admin xác nhận sẽ xóa nội dung `DoiThiDau` và `TranDau` theo đúng nghiệp vụ.

## 1. Tạo Google Sheet

1. Tạo một Google Sheet trống, ví dụ `Đấu Trường Cầu Lông - Giải 2026`.
2. Lấy `SPREADSHEET_ID` trong URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
3. Đặt múi giờ của bảng tính là `(GMT+07:00) Ho Chi Minh City`.
4. Không cần tự tạo sheet/header. `Code.gs` sẽ tạo `GiaiDau`, `NguoiChoi`, `DoiThiDau`, `TranDau`, `NguoiDung`, `NhatKy` ở request đầu tiên. `NguoiChoi` có thêm cột `DaChuyenKhoan` để chặn đăng ký chưa thanh toán và hỗ trợ Admin đối soát.

## 2. Tạo Apps Script và Script Properties

1. Trong Google Sheet chọn **Tiện ích mở rộng → Apps Script**.
2. Thay toàn bộ nội dung `Code.gs` bằng file [Code.gs](./Code.gs).
3. Trong **Project Settings**, bật V8 runtime và chọn múi giờ `Asia/Ho_Chi_Minh`.
4. Vào **Script Properties** và thêm:

| Property | Giá trị |
| --- | --- |
| `SPREADSHEET_ID` | ID của Google Sheet |
| `APP_SHARED_SECRET` | Chuỗi ngẫu nhiên tối thiểu 32 ký tự |
| `INITIAL_ADMIN_USERNAME` | Tài khoản Admin ban đầu, ví dụ `admin` |
| `INITIAL_ADMIN_PASSWORD` | Mật khẩu mạnh dùng một lần |
| `INITIAL_ADMIN_NAME` | Họ tên người quản trị |

`INITIAL_ADMIN_PASSWORD` được hash bằng HMAC-SHA256 có pepper và tự xóa khỏi Script Properties sau khi tài khoản được tạo. Plaintext không được ghi vào Sheet. Request đầu tiên tới deployment sẽ tạo schema và Admin ban đầu; cũng có thể chọn hàm `ensureDatabase` trong editor rồi bấm **Run** một lần và cấp quyền.

Nếu cần khôi phục mật khẩu Admin, đặt lại `INITIAL_ADMIN_PASSWORD` rồi chạy thủ công hàm `khoiTaoHoacDatLaiAdminTuProperties` trong editor. Hàm này tạo mới hoặc đặt lại user Admin, ghi hash vào Sheet và xóa property plaintext ngay sau đó.

## 3. Deploy Web App

1. Chọn **Deploy → New deployment → Web app**.
2. **Execute as:** Me.
3. **Who has access:** Anyone. API vẫn yêu cầu `APP_SHARED_SECRET`; secret chỉ được proxy server Next.js gửi.
4. Deploy, cấp quyền truy cập Sheet và sao chép URL kết thúc bằng `/exec`.
5. Khi sửa `Code.gs`, tạo **New version** và cập nhật deployment. Không dùng URL `/dev` trên Vercel.

Có thể mở URL `/exec` trên trình duyệt để kiểm tra health response. Các API nghiệp vụ chỉ nhận `POST`.

## 4. Quy tắc an toàn dữ liệu

- Action công khai vẫn phải đi qua proxy có shared secret.
- Action Admin cần token ký HMAC, thời hạn 8 giờ; token được frontend giữ trong cookie HttpOnly.
- `bocThamGiaiDau` và `capNhatKetQuaTranDau` dùng `LockService.getScriptLock()`.
- Ghi dữ liệu bốc thăm/trận đấu được thực hiện theo lô trong một critical section.
- Đội được chia bảng vòng tròn linh hoạt; nhất nhì mỗi bảng tự động được xếp chéo bảng vào vòng loại trực tiếp.
- Mọi action ghi tăng `CACHE_VERSION`, làm vô hiệu ngay cache công khai cũ.
- Không có seed chạy tự động hoặc nằm trong API production.
- Khi cần kiểm thử thủ công, có thể chạy `tao31NguoiChoiMauSauKhiXacNhan` trong editor. Hàm chỉ chạy khi giải đã được tạo, danh sách người chơi trống và chưa bốc thăm; toàn bộ 31 dòng có nhãn `[TEST-31]`. Dùng `xoaNguoiChoiMauSauKhiXacNhan` để xóa riêng các dòng mẫu này.
- Form công khai chỉ nhận tên, số điện thoại, giới tính sau khi người chơi xác nhận đã chuyển khoản. Người chơi vẫn ở trạng thái chờ; Admin phải đối soát giao dịch trước khi chuyển sang `DA_XAC_NHAN`.

## 5. Tạo giải đầu tiên

Sau khi deploy frontend, đăng nhập `/admin/login`, mở `/admin/cai-dat`, nhập tên giải, địa điểm, thời gian, hạn đăng ký và tùy chọn tranh hạng ba. Giải mới mặc định ở trạng thái `DANG_DANG_KY`.

Nếu quên mật khẩu Admin, không đặt lại bằng plaintext trong Sheet. Cách an toàn là tạo password hash mới bằng một hàm quản trị tạm thời trong Apps Script, chạy thủ công rồi xóa hàm; hoặc triển khai luồng đổi mật khẩu riêng trước khi đưa cho nhiều quản trị viên.
