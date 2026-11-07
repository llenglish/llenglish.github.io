/*
  FILE CẤU HÌNH - CHỈ CẦN SỬA FILE NÀY ĐỂ ĐỔI THÔNG TIN TRÊN TOÀN WEB
  Sửa xong, lưu lại, đưa lên GitHub là web cập nhật.
  Để trống ('' hoặc 0) thì web hiển thị [ngoặc vuông] chờ bạn điền.
*/
window.SITE = {
  // Bản chạy thử: true = có sẵn 2 tài khoản mẫu (admin@mam.demo, hocvien@mam.demo).
  // KHI MỞ BÁN THẬT hãy đổi thành false.
  demo: true,

  // Email của bạn (quản trị viên). Ai đăng ký bằng email nằm trong danh sách này sẽ là quản trị.
  // Ví dụ: ['ban@gmail.com']
  adminEmails: [],

  // Chuỗi bất kỳ để mã đơn / mã kích hoạt khó đoán hơn. Đổi tùy ý (đổi xong các mã cũ sẽ không dùng được).
  codeSalt: 'mam',

  // Thông tin liên hệ
  email: '',            // ví dụ: 'xinchao@ten-mien.com'
  zalo: '',             // ví dụ: '0900000000'

  // Tài khoản nhận học phí (hiện ở trang Mua khóa)
  bank: {
    name: '',           // Tên ngân hàng, ví dụ: 'Vietcombank'
    bin: '',            // Mã BIN VietQR của ngân hàng, ví dụ: '970436' (để trống thì không hiện mã QR)
    number: '',         // Số tài khoản
    owner: ''           // Tên chủ tài khoản, VIẾT HOA KHÔNG DẤU
  },

  // Giá (đồng). Để 0 thì hiện [Giá]
  prices: {
    c1: 0,              // Cấp 1 - Tự học (mỗi khóa)
    c2: 0,              // Cấp 2 - Có kèm bài (mỗi khóa)
    c3: 0,              // Cấp 3 - Kèm trực tiếp (mỗi khóa)
    pro: 0              // Gói Pro (mỗi tháng)
  },

  // Thời hạn học (số ngày). Để 0 thì hiện [Số ngày]
  validityDays: { c1: 0, c2: 0, c3: 0 }
};
