# Mầm - Web khóa học ngôn ngữ (bản tĩnh để chạy thử trên GitHub Pages)

Đây là bản **giao diện tĩnh có đăng nhập chạy thử** (HTML + CSS + JS, không cần máy chủ hay cơ sở dữ liệu), mở bằng trình duyệt là chạy, không cần cài gì thêm.

## Cách đưa lên github.io (làm một lần, khoảng 5 phút)

**Cách 1: tải lên bằng trình duyệt (dễ nhất, không cần cài phần mềm)**

1. Đăng nhập https://github.com (chưa có thì đăng ký miễn phí).
2. Bấm dấu **+** ở góc trên bên phải, chọn **New repository**.
3. Ô *Repository name*: đặt tên, ví dụ `mam-web` (chữ thường, không dấu, không khoảng trắng). Chọn **Public**. Bấm **Create repository**.
4. Giải nén file zip này trên máy. Ở trang repository vừa tạo, bấm **uploading an existing file**.
5. Mở thư mục đã giải nén, **chọn tất cả file bên trong** (index.html, style.css, app.js, ...) rồi kéo thả vào trang GitHub. Lưu ý: kéo cả nội dung bên trong, không kéo chính thư mục chứa nó, để `index.html` nằm ngay ở ngoài cùng.
   - File `.nojekyll` bị ẩn trên một số máy. Không có cũng không sao, web vẫn chạy.
6. Kéo xuống cuối, bấm **Commit changes**.
7. Vào tab **Settings** > **Pages** (menu bên trái). Mục *Build and deployment* > *Source* chọn **Deploy from a branch**. Mục *Branch* chọn **main** và thư mục **/ (root)**, bấm **Save**.
8. Chờ 1 đến 3 phút, tải lại trang Settings > Pages sẽ hiện địa chỉ web, dạng:
   `https://TEN-GITHUB-CUA-BAN.github.io/mam-web/`

**Cách 2: dùng tên repo đặc biệt** `TEN-GITHUB.github.io` thì địa chỉ web sẽ là `https://TEN-GITHUB.github.io/` (không có đuôi tên repo). Các bước giống Cách 1.

## Điền thông tin của bạn

Mở file `config.js` bằng Notepad (hoặc sửa trực tiếp trên GitHub: bấm vào file > biểu tượng cây bút). Điền email, ngân hàng, số tài khoản, giá, thời hạn học.

- `adminEmails: ['email-cua-ban@gmail.com']`: ai đăng ký bằng email này sẽ là **quản trị viên**.
- `demo: true` tạo sẵn 2 tài khoản mẫu (`admin@mam.demo` / `Admin@123`, `hocvien@mam.demo` / `Hocvien@123`). **Đổi thành `false` khi mở bán thật.**
- Muốn có mã QR chuyển khoản: điền đủ `bank.bin`, `bank.number` và giá.

## Đăng nhập hoạt động thế nào (không cần cơ sở dữ liệu)

- Đăng ký, đăng nhập, quên mật khẩu (bằng **mã khôi phục** hiện một lần lúc đăng ký), đổi mật khẩu, hồ sơ.
- 3 cấp + Pro: trang học kiểm tra quyền theo khóa, cấp và ngày hết hạn. Cấp 1 không dùng được Nộp bài và Đặt câu hỏi.
- Mua khóa: học viên bấm "Tôi đã chuyển khoản" để tạo đơn, rồi gửi **mã đơn** cho bạn (Zalo/email).
- Bạn vào `quan-tri.html` (đăng nhập quản trị), dán mã đơn vào "Nhập đơn", bấm **Xác nhận** và gửi lại **mã kích hoạt**. Học viên dán mã vào "Khóa của tôi" là học được.
- Quản trị còn có: cấp quyền thủ công, thu hồi quyền, đặt lại mật khẩu học viên, xóa tài khoản.

## Giới hạn quan trọng (hãy đọc)

Dữ liệu chỉ nằm trong **trình duyệt của từng người** (localStorage):

- Tài khoản tạo ở máy này **không đăng nhập được ở máy khác**. Xóa dữ liệu trình duyệt là mất.
- **Không bảo mật thật**: người rành kỹ thuật có thể tự sửa dữ liệu trong trình duyệt của họ, và mã kích hoạt không chống làm giả. Vì vậy **đừng đặt video hay bài giảng trả phí thật** trên bản này.
- Chưa có nộp bài, chấm bài, tiến trình thật; các trang đó là dữ liệu minh họa.
- Khi bán thật: chuyển sang cơ sở dữ liệu (Supabase theo checklist). Các trang chỉ gọi `MamAuth` trong `auth.js`, nên chỉ cần thay file này.

## Cấu trúc file (tất cả nằm ngang hàng, không thư mục con)

```
index.html, khoa-hoc.html, goi-hoc.html, chinh-sach.html   Trang công khai
dang-ky.html        Đăng ký / đăng nhập / quên mật khẩu
khoa-cua-toi.html   Khóa, đơn hàng, kích hoạt (cần đăng nhập)
ho-so.html          Hồ sơ, đổi mật khẩu
mua-khoa.html       Chọn gói, chuyển khoản, tạo đơn
hoc.html            Trang học mẫu (chặn theo quyền)
tien-trinh.html     Tiến trình mẫu (cần đăng nhập)
quan-tri.html       Quản trị (chỉ admin)
config.js           Cấu hình: sửa file này
courses.js          Danh sách khóa học
auth.js, auth-ui.js, auth-page.js, account.js, admin.js, app.js   Mã chạy
style.css, mam-*.svg
```

## Việc nên làm trước khi chia sẻ link công khai

- Điền email liên hệ; đặt `demo: false`; đặt `adminEmails`, rồi tự đăng ký bằng email đó.
- Xóa hoặc thay các khung `[Số học viên]`, `[Kết quả thật]` ở trang chủ. Chỉ đăng thành tích thật.
- Soát lại `chinh-sach.html` và nhờ người có chuyên môn pháp lý xem trước khi bán.
