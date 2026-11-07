/* Mầm - trang đăng ký / đăng nhập / quên mật khẩu. */
(function () {
  'use strict';
  var A = window.MamAuth, U = window.MamUI, S = window.SITE || {};
  if (!A) return;
  function $(s) { return document.querySelector(s); }
  function $all(s) { return [].slice.call(document.querySelectorAll(s)); }

  var form = $('#authForm'); if (!form) return;
  var mode = 'signup', busy = false;
  var next = (new URLSearchParams(location.search).get('next') || '');
  if (!/^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(next)) next = 'khoa-cua-toi.html';

  var TXT = {
    signup: { title: 'Tạo tài khoản', sub: 'Chỉ cần vài thông tin cơ bản.', btn: 'Đăng ký' },
    login: { title: 'Đăng nhập', sub: 'Chào mừng bạn quay lại!', btn: 'Đăng nhập' },
    forgot: { title: 'Quên mật khẩu', sub: 'Nhập email, mã khôi phục (nhận lúc đăng ký) và mật khẩu mới.', btn: 'Đặt lại mật khẩu' }
  };
  function showErr(m) { var e = $('#authErr'); e.textContent = m || ''; e.hidden = !m; }
  function set(m) {
    mode = m; showErr('');
    $all('.auth-switch button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
    $('#authTitle').textContent = TXT[m].title; $('#authSub').textContent = TXT[m].sub; $('#authSubmit').textContent = TXT[m].btn;
    $all('[data-m]').forEach(function (el) {
      var on = el.getAttribute('data-m').split(' ').indexOf(m) >= 0;
      el.hidden = !on;
      [].forEach.call(el.querySelectorAll('input'), function (i) { i.disabled = !on; });
    });
    $('#mk').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('#mk').placeholder = m === 'login' ? 'Mật khẩu của bạn' : 'Ít nhất 8 ký tự';
    $('#mkLabel').textContent = m === 'forgot' ? 'Mật khẩu mới' : 'Mật khẩu';
    var tabs = $('.auth-switch'); if (tabs) tabs.hidden = m === 'forgot';
    $('#authSwap').innerHTML = m === 'signup' ? 'Đã có tài khoản? <a href="#dang-nhap" data-go="login"><strong>Đăng nhập</strong></a>' :
      m === 'login' ? 'Chưa có tài khoản? <a href="#dang-ky" data-go="signup"><strong>Đăng ký</strong></a>' : '<a href="#dang-nhap" data-go="login"><strong>← Quay lại đăng nhập</strong></a>';
  }
  $all('.auth-switch button').forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-mode')); }); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (a) { e.preventDefault(); set(a.getAttribute('data-go')); }
  });

  $('#togglePw').addEventListener('click', function () {
    var i = $('#mk'), show = i.type === 'password'; i.type = show ? 'text' : 'password';
    this.textContent = show ? 'Ẩn' : 'Hiện'; this.setAttribute('aria-pressed', String(show));
  });

  function goNext() { location.href = next; }
  function showRecovery(code, title) {
    form.hidden = true;
    var p = $('#recoveryPanel'); p.hidden = false;
    $('#recTitle').textContent = title; $('#recCode').textContent = code;
    $('#recGo').focus();
  }
  $('#recCopy').addEventListener('click', function () { U.copy($('#recCode').textContent, 'Đã sao chép mã khôi phục'); });
  $('#recGo').addEventListener('click', goNext);

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    showErr('');
    var v = function (id) { return ($('#' + id).value || ''); };
    var p;
    if (mode === 'signup') {
      if (!$('#dongy').checked) return showErr('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      p = A.signup({ name: v('ten'), email: v('email'), phone: v('sdt'), password: v('mk'), remember: true }).then(function (r) { showRecovery(r.recoveryCode, 'Tạo tài khoản thành công!'); });
    } else if (mode === 'login') {
      p = A.login(v('email'), v('mk'), $('#nho').checked).then(goNext);
    } else {
      p = A.resetWithCode(v('email'), v('code'), v('mk')).then(function (r) { showRecovery(r.recoveryCode, 'Đã đặt lại mật khẩu!'); });
    }
    busy = true; $('#authSubmit').disabled = true;
    p.catch(function (err) { showErr(err.message || 'Có lỗi xảy ra, thử lại nhé.'); }).then(function () { busy = false; $('#authSubmit').disabled = false; });
  });

  /* tài khoản mẫu */
  var demo = $('#demoBox');
  if (S.demo === false) { demo.remove(); }
  else {
    $all('[data-fill]').forEach(function (b) {
      b.addEventListener('click', function () {
        set('login'); $('#email').value = b.getAttribute('data-fill'); $('#mk').value = b.getAttribute('data-pw');
        $('#authSubmit').focus();
      });
    });
  }

  A.ready.then(function () {
    var me = A.current();
    if (me) {
      form.hidden = true; if (demo) demo.hidden = true;
      var al = $('#already'); al.hidden = false;
      $('#alreadyName').textContent = me.name;
      $('#alreadyGo').setAttribute('href', next);
      $('#alreadyOut').addEventListener('click', function () { A.logout(); location.reload(); });
      return;
    }
    set(location.hash === '#dang-nhap' ? 'login' : location.hash === '#quen-mat-khau' ? 'forgot' : 'signup');
  });
  set('signup');
})();
