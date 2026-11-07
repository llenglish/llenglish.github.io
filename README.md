# Mầm - Web khóa học ngôn ngữ (bản tĩnh để chạy thử trên GitHub Pages)

Đây là bản **giao diện tĩnh** (HTML + CSS + JS), mở bằng trình duyệt là chạy, không cần cài gì thêm.

## Cách đưa lên github.io (làm một lần, khoảng 5 phút)

**Cách 1: tải lên bằng trình duyệt (dễ nhất, không cần cài phần mềm)**

1. Đăng nhập https://github.com (chưa có thì đăng ký miễn phí).
2. Bấm dấu **+** ở góc trên bên phải, chọn **New repository**.
3. Ô *Repository name*: đặt tên, ví dụ `mam-web` (chữ thường, không dấu, không khoảng trắng). Chọn **Public**. Bấm **Create repository**.
4. Giải nén file zip này trên máy. Ở trang repository vừa tạo, bấm **uploading an existing file**.
5. Mở thư mục đã giải nén, **chọn tất cả file và thư mục bên trong** (index.html, assets, ...) rồi kéo thả vào trang GitHub. Lưu ý: kéo cả nội dung bên trong, không kéo chính thư mục chứa nó, để `index.html` nằm ngay ở ngoài cùng.
   - File `.nojekyll` bị ẩn trên một số máy. Không có cũng không sao, web vẫn chạy.
6. Kéo xuống cuối, bấm **Commit changes**.
7. Vào tab **Settings** > **Pages** (menu bên trái). Mục *Build and deployment* > *Source* chọn **Deploy from a branch**. Mục *Branch* chọn **main** và thư mục **/ (root)**, bấm **Save**.
8. Chờ 1 đến 3 phút, tải lại trang Settings > Pages sẽ hiện địa chỉ web, dạng:
   `https://TEN-GITHUB-CUA-BAN.github.io/mam-web/`

**Cách 2: dùng tên repo đặc biệt** `TEN-GITHUB.github.io` thì địa chỉ web sẽ là `https://TEN-GITHUB.github.io/` (không có đuôi tên repo). Các bước giống Cách 1.

## Điền thông tin của bạn

Mở file `assets/js/config.js` bằng Notepad (hoặc sửa trực tiếp trên GitHub: bấm vào file > biểu tượng cây bút). Điền email, ngân hàng, số tài khoản, giá, thời hạn học. Lưu lại, web tự cập nhật sau 1 đến 2 phút.

- Để trống thì web hiện chữ `[ngoặc vuông]`.
- Muốn có **mã QR chuyển khoản**: điền đủ `bank.bin` (mã BIN VietQR của ngân hàng), `bank.number`, giá, rồi kiểm tra lại bằng cách quét thử bằng app ngân hàng. Mã QR được tạo qua dịch vụ img.vietqr.io; bạn nên đọc điều khoản và cách dùng hiện hành của dịch vụ này trước khi bán thật.

## Cấu trúc file

```
index.html        Trang chủ
khoa-hoc.html     Danh sách khóa học (lọc theo ngôn ngữ, cấp độ)
goi-hoc.html      Gói học và bảng giá
dang-ky.html      Đăng ký / đăng nhập (giao diện)
mua-khoa.html     Mua khóa, hướng dẫn chuyển khoản
hoc.html          Trang học mẫu (video, flashcard, bài tập, nộp bài)
tien-trinh.html   Đánh giá tiến trình mẫu
quan-tri.html     Giao diện quản trị mẫu
chinh-sach.html   Chính sách và điều khoản (bản nháp)
assets/           CSS, JS, ảnh mascot
```

## Rất quan trọng: đây chỉ là bản giao diện

GitHub Pages chỉ chứa file tĩnh, **không có máy chủ**. Vì vậy trong bản này:

- Đăng ký, đăng nhập, nộp bài, xác nhận đơn **chưa hoạt động thật** (bấm sẽ hiện thông báo demo).
- **Chưa có phân quyền thật.** Ai biết đường dẫn cũng mở được trang `hoc.html`, `quan-tri.html`. Không đặt video, bài giảng hay nội dung trả phí thật lên bản này.
- Dữ liệu trong `hoc.html`, `tien-trinh.html`, `quan-tri.html` (tên học viên, điểm số, đơn hàng) là **dữ liệu giả để minh họa**.
- Khi mở bán thật, hãy **xóa `quan-tri.html`** và các trang demo không dùng, rồi làm tiếp phần có máy chủ (Supabase theo checklist, việc 2.x đến 3.x).

Bạn có thể dùng bản này để: xem thử giao diện trên điện thoại, gửi link cho người quen góp ý, và làm trang giới thiệu khóa học (trang chủ, khóa học, gói học).

## Việc nên làm trước khi chia sẻ link công khai

- Điền email liên hệ và thông tin thương hiệu thật; đổi chữ "Mầm" nếu bạn dùng tên khác (tìm và thay trong các file .html).
- Xóa hoặc thay các khung `[Số học viên]`, `[Kết quả thật]`, `[Lời chia sẻ]` ở trang chủ. Chỉ đăng thành tích thật.
- Soát lại `chinh-sach.html` và nhờ người có chuyên môn pháp lý xem trước khi bán.
