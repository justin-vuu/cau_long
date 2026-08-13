# Đấu Trường Cầu Lông

Ứng dụng quản lý giải cầu lông đôi bằng Next.js và Google Apps Script/Google Sheets. Mô hình là **đăng ký cá nhân rồi bốc thăm ghép đôi**, thi đấu vòng bảng trước khi vào loại trực tiếp. Người chơi không đăng ký sẵn theo cặp; kiến trúc tách `NguoiChoi` và `DoiThiDau` để sau này có thể bổ sung chế độ đăng ký đôi.

## Chức năng MVP

- Trang công khai: thông tin giải, QR chuyển khoản, đăng ký bằng tên/SĐT/giới tính, danh sách người chơi (ẩn SĐT), danh sách đội, bracket và tỷ số trực tiếp.
- Admin: phiên đăng nhập HttpOnly, tạo/cấu hình giải, CRUD/xác nhận người chơi, CSV, khóa/mở đăng ký.
- Bốc thăm backend bằng Fisher–Yates hai lần, ghép đôi và chia bảng cân bằng. 28 người được bốc ngẫu nhiên thành 14 đội, chia 4 bảng 4–4–3–3 và lấy hai đội đầu mỗi bảng vào tứ kết.
- Mỗi trận thắng được 1 điểm; vòng bảng xếp hạng theo điểm, hiệu số điểm rồi đối đầu trực tiếp. Bracket được tạo tự động sau khi vòng bảng hoàn tất.
- Nhập một set theo luật từng giai đoạn, chọn đội thắng, bỏ cuộc, tự đẩy đội thắng; bảo vệ kết quả phụ thuộc và hỗ trợ tranh hạng ba.
- Google Sheet là nguồn dữ liệu production duy nhất; không có mock fallback.

## Chạy local

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Điền URL Apps Script `/exec` và shared secret thật vào `.env.local`. File này đã nằm trong `.gitignore`.

## Cấu hình backend

Làm theo [hướng dẫn Apps Script](./apps-script/README.md) để tạo Sheet, Script Properties, tài khoản Admin ban đầu và deployment Web App.

Biến môi trường frontend/server:

```text
APPS_SCRIPT_API_URL=https://script.google.com/macros/s/.../exec
APPS_SCRIPT_SHARED_SECRET=...
```

Secret chỉ được đọc trong route server `/api/apps-script`; không có biến nào dùng tiền tố `NEXT_PUBLIC_`.

## Deploy Vercel

1. Đẩy source lên GitHub/GitLab/Bitbucket, bảo đảm không commit `.env.local`.
2. Import repo vào Vercel, framework preset **Next.js**.
3. Trong **Project Settings → Environment Variables**, thêm `APPS_SCRIPT_API_URL` và `APPS_SCRIPT_SHARED_SECRET` cho Production (và Preview nếu cần).
4. Deploy. Sau khi đổi env, redeploy project.
5. Mô hình khuyến nghị: **1 giải hoặc 1 đơn vị = 1 Sheet + 1 Apps Script deployment + 1 Vercel project**.

## Kiểm thử

```bash
npm run typecheck
npm run test:core
npm run build
```

`test:core` chạy thuật toán và handler thật trong `Code.gs`: kiểm tra bracket 18 đội/32 vị trí với 14 BYE, cùng luồng 28 đăng ký đã thanh toán → 14 đội → nhập tỷ số → đội thắng đi tiếp.

Smoke test với deployment thật:

1. Tạo giải trong `/admin/cai-dat`.
2. Đăng ký hoặc thêm đúng 28 người, xác nhận đủ và bảo đảm số chẵn.
3. Khóa đăng ký, vào `/admin/boc-tham`, xác nhận bốc thăm.
4. Kiểm tra 14 đội chia bảng 4–4–3–3 trên trang công khai.
5. Vào `/admin/tran-dau`, nhập `21-18` ở vòng bảng hoặc `25-18` ở vòng trong, chọn đội 1 và lưu.
6. Mở `/bang-dau`: đội thắng phải xuất hiện ở vòng tiếp theo.
7. Reload cả Admin và trang công khai để xác nhận dữ liệu vẫn còn trong Sheet.
8. Dùng `git grep -nE '(script.google.com/macros/s/[^D]|APP_SHARED_SECRET=.{32})'` để rà soát trước khi push; `.env.example` chỉ chứa placeholder.

## Cấu trúc chính

```text
app/                    Next.js App Router và route proxy
components/             Layout công khai/Admin và bracket động
lib/                    Kiểu dữ liệu, API client
apps-script/Code.gs     Backend + schema + nghiệp vụ
tests/                  Kiểm thử thuật toán Apps Script
```
