/* Mầm - phần giao diện dùng chung của đăng nhập: thanh trên cùng, chặn trang, thông báo. */
(function () {
  'use strict';
  var A = window.MamAuth;
  if (!A) return;
  var COURSES = window.MAM_COURSES || [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  function money(n) { return n > 0 ? Number(n).toLocaleString('vi-VN') + ' đ' : '[Giá]'; }
  function courseOf(id) { return COURSES.filter(function (c) { return c.id === id; })[0]; }
  function courseName(id) { return id === '*' ? 'Tất cả khóa học' : (courseOf(id) || { title: id }).title; }
  function planName(p) { return p === 'pro' ? 'Gói Pro · Học mọi khóa' : (A.LEVELS[p] || p); }

  /* toast */
  var toastEl, toastTimer;
  window.MamToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3600);
  };

  function copyText(text, okMsg) {
    function done() { window.MamToast(okMsg || 'Đã sao chép'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { window.MamToast('Không sao chép được, hãy bôi đen và copy thủ công.'); });
    else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t); }
  }

  window.MamUI = { esc: esc, fmtDate: fmtDate, money: money, courseName: courseName, planName: planName, copy: copyText, gate: gate };

  function gate(opts) { // khung thông báo khi chưa đủ quyền
    return '<div class="gate"><img src="' + (opts.img || 'mam-study.svg') + '" alt="" width="140" height="140"><h1>' + esc(opts.title) + '</h1><p class="muted">' + opts.text + '</p><div class="btn-row" style="justify-content:center">' + opts.buttons + '</div></div>';
  }

  /* thanh trên cùng */
  function renderHeader() {
    var me = A.current();
    var box = document.querySelector('.head-actions');
    if (!box) {
      var host = document.querySelector('.site-header .wrap') || document.querySelector('.bar .right');
      if (!host) return;
      if (!me) return;
      box = document.createElement('div'); box.className = 'head-actions'; host.appendChild(box);
    }
    if (!me) {
      box.innerHTML = '<a class="btn btn-ghost btn-sm" href="dang-ky.html#dang-nhap">Đăng nhập</a><a class="btn btn-primary btn-sm" href="dang-ky.html">Đăng ký</a>';
      return;
    }
    var first = (me.name || me.email).trim().split(/\s+/).pop();
    box.innerHTML = '<div class="user-menu"><button type="button" class="user-btn" aria-haspopup="true" aria-expanded="false" aria-controls="userMenu"><span class="avatar" aria-hidden="true">' + esc(first.charAt(0).toUpperCase()) + '</span><span class="uname">' + esc(first) + '</span><span aria-hidden="true">▾</span></button>' +
      '<div class="menu" id="userMenu" hidden><div class="menu-head"><strong>' + esc(me.name) + '</strong><span class="small muted">' + esc(me.email) + '</span></div>' +
      '<a href="khoa-cua-toi.html">Khóa của tôi</a><a href="ho-so.html">Hồ sơ và mật khẩu</a>' + (me.role === 'admin' ? '<a href="quan-tri.html">Khu quản trị</a>' : '') +
      '<button type="button" id="btnLogout">Đăng xuất</button></div></div>';
    var btn = box.querySelector('.user-btn'), menu = box.querySelector('.menu');
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
    box.querySelector('#btnLogout').addEventListener('click', function () { A.logout(); location.href = 'index.html'; });
  }

  /* chặn trang theo quyền: admin / access */
  function guards() {
    var html = document.documentElement, req = html.getAttribute('data-require'), me = A.current();
    if (!req || !me) return;
    var main = document.getElementById('main');
    if (req === 'admin' && me.role !== 'admin') {
      var host = document.querySelector('.admin') || main;
      host.innerHTML = '<main id="main" class="wrap" style="padding:56px 16px">' + gate({ title: 'Khu vực dành cho quản trị viên', text: 'Tài khoản <strong>' + esc(me.email) + '</strong> chưa có quyền quản trị.', buttons: '<a class="btn btn-primary" href="index.html">Về trang chủ</a><button type="button" class="btn btn-outline" id="gateOut">Đăng nhập tài khoản khác</button>' }) + '</main>';
      var out = document.getElementById('gateOut'); if (out) out.addEventListener('click', function () { A.logout(); location.href = A.loginUrl(); });
    }
    if (req === 'access') {
      var q = new URLSearchParams(location.search), cid = q.get('khoa') || html.getAttribute('data-course') || 'beginner';
      if (!courseOf(cid)) cid = html.getAttribute('data-course') || 'beginner';
      var acc = A.accessFor(cid);
      if (!acc) {
        var expired = A.myEntitlements().filter(function (e) { return (e.course === cid || e.course === '*') && e.end <= Date.now(); })[0];
        var txt = expired ? 'Quyền học <strong>' + esc(courseName(cid)) + '</strong> của bạn đã hết hạn ngày ' + fmtDate(expired.end) + '. Gia hạn để học tiếp nhé.' : 'Bạn chưa mua <strong>' + esc(courseName(cid)) + '</strong>. Chọn gói phù hợp, chuyển khoản xong là học được ngay khi thầy cô xác nhận.';
        main.className = 'wrap'; main.style.padding = '56px 16px';
        main.innerHTML = gate({ title: expired ? 'Khóa học đã hết hạn' : 'Bạn chưa có quyền xem bài này', text: txt, buttons: '<a class="btn btn-primary" href="mua-khoa.html?khoa=' + encodeURIComponent(cid) + '&goi=2">' + (expired ? 'Gia hạn khóa này' : 'Mua khóa này') + '</a><a class="btn btn-outline" href="khoa-cua-toi.html">Khóa của tôi</a>' });
      } else {
        $bind(acc, cid, me);
      }
    }
  }
  function $bind(acc, cid, me) {
    [].forEach.call(document.querySelectorAll('[data-bind]'), function (el) {
      var k = el.getAttribute('data-bind');
      if (k === 'email') el.textContent = me.email;
      else if (k === 'plan') el.textContent = acc.label;
      else if (k === 'days') el.textContent = acc.admin ? 'Quản trị viên' : 'Còn ' + acc.daysLeft + ' ngày';
      else if (k === 'course') el.textContent = courseName(cid);
    });
    [].forEach.call(document.querySelectorAll('[data-min-level]'), function (el) {
      var need = Number(el.getAttribute('data-min-level'));
      if (acc.level < need) {
        el.innerHTML = '<div class="lock"><strong>Tính năng của ' + esc(A.LEVELS[need]) + ' trở lên</strong><span class="muted small">Gói hiện tại của bạn: ' + esc(acc.label) + '.</span><a class="btn btn-gold btn-sm" href="mua-khoa.html?khoa=' + encodeURIComponent(cid) + '&goi=' + need + '">Nâng cấp lên ' + esc(A.LEVELS[need]) + '</a></div>';
      }
    });
    document.documentElement.setAttribute('data-lesson-ok', '1');
  }

  function warnStorage() {
    if (A.persistent()) return;
    var b = document.createElement('div'); b.className = 'notice'; b.setAttribute('role', 'alert');
    b.textContent = 'Trình duyệt đang chặn lưu dữ liệu (có thể do chế độ riêng tư). Tài khoản sẽ mất khi đóng trang.';
    document.body.insertBefore(b, document.body.firstChild);
  }

  function boot() {
    renderHeader(); guards(); warnStorage();
    document.documentElement.setAttribute('data-ok', '1');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { A.ready.then(boot); });
  else A.ready.then(boot);
})();
