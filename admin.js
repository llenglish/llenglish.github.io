/* Mầm - khu quản trị (chạy trong trình duyệt). */
(function () {
  'use strict';
  var A = window.MamAuth, U = window.MamUI;
  if (!A || !U) return;
  var esc = U.esc, COURSES = window.MAM_COURSES || [];
  function $(s) { return document.querySelector(s); }
  var ST = { pending: ['Chờ xác nhận', 'pill-gold'], paid: ['Đã xác nhận', ''], cancelled: ['Đã hủy', 'pill-rose'] };
  var NOTE_ONCE = null;

  function showResult(title, code, extra) {
    var b = $('#result'); b.hidden = false;
    $('#resultTitle').textContent = title; $('#resultCode').value = code || '';
    $('#resultCodeRow').hidden = !code; $('#resultExtra').textContent = extra || '';
    b.scrollIntoView({ block: 'nearest' });
  }
  function err(e) { window.MamToast(e.message || String(e)); }

  function render() {
    if (!A.isAdmin()) return;
    var orders = A.admin.orders(), users = A.admin.users(), ents = A.admin.ents(), now = Date.now();
    var pend = orders.filter(function (o) { return o.status === 'pending'; });
    var proActive = ents.filter(function (e) { return e.plan === 'pro' && e.end > now; }).length;
    var learners = {}; ents.forEach(function (e) { if (e.end > now) learners[e.email] = 1; });
    $('#stUsers').textContent = users.length; $('#stPending').textContent = pend.length;
    $('#stLearn').textContent = Object.keys(learners).length; $('#stPro').textContent = proActive;
    $('#navPending').textContent = pend.length; $('#navPending').hidden = !pend.length;

    $('#pendBody').innerHTML = pend.map(function (o) {
      return '<tr><td><strong>#' + esc(o.no) + '</strong></td><td>' + esc(o.name) + '<br><span class="small muted">' + esc(o.email) + '</span></td><td>' + esc(U.courseName(o.plan === 'pro' ? '*' : o.course)) + '<br><span class="small muted">' + esc(U.planName(o.plan)) + '</span></td><td class="mono">' + esc(o.memo) + '</td><td>' + U.money(o.amount) + '</td>' +
        '<td><div class="t-actions"><button type="button" class="btn btn-primary btn-xs" data-act="confirm" data-id="' + esc(o.id) + '">Xác nhận</button><button type="button" class="btn btn-line btn-xs" data-act="cancel" data-id="' + esc(o.id) + '">Hủy</button></div></td></tr>';
    }).join('');
    $('#pendEmpty').hidden = pend.length > 0;

    $('#userBody').innerHTML = users.map(function (u) {
      return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.phone || '—') + '</td><td><span class="pill ' + (u.role === 'admin' ? 'pill-gold' : '') + '">' + (u.role === 'admin' ? 'Quản trị' : 'Học viên') + '</span></td>' +
        '<td><div class="t-actions"><button type="button" class="btn btn-outline btn-xs" data-act="reset" data-email="' + esc(u.email) + '">Đặt lại mật khẩu</button><button type="button" class="btn btn-line btn-xs" data-act="rmuser" data-email="' + esc(u.email) + '">Xóa</button></div></td></tr>';
    }).join('');

    $('#entBody').innerHTML = ents.map(function (e) {
      var on = e.end > now;
      return '<tr><td>' + esc(e.email) + '</td><td>' + esc(U.courseName(e.course)) + '</td><td>' + esc(e.plan === 'pro' ? 'Gói Pro' : A.LEVELS[e.level]) + '</td><td>' + U.fmtDate(e.end) + ' <span class="pill ' + (on ? '' : 'pill-rose') + '">' + (on ? 'Đang hiệu lực' : 'Hết hạn') + '</span></td>' +
        '<td><div class="t-actions"><button type="button" class="btn btn-outline btn-xs" data-act="code" data-id="' + esc(e.id) + '">Mã kích hoạt</button><button type="button" class="btn btn-line btn-xs" data-act="revoke" data-id="' + esc(e.id) + '">Thu hồi</button></div></td></tr>';
    }).join('');
    $('#entEmpty').hidden = ents.length > 0;

    var done = orders.filter(function (o) { return o.status !== 'pending'; });
    $('#doneBody').innerHTML = done.map(function (o) {
      var st = ST[o.status]; return '<tr><td>#' + esc(o.no) + '</td><td>' + esc(o.email) + '</td><td class="mono">' + esc(o.memo) + '</td><td><span class="pill ' + st[1] + '">' + st[0] + '</span></td></tr>';
    }).join('');
    $('#doneEmpty').hidden = done.length > 0;
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || !A.isAdmin()) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), email = b.getAttribute('data-email');
    try {
      if (act === 'confirm') {
        var r = A.admin.confirm(id);
        showResult('Đã xác nhận đơn #' + r.order.no, r.activationCode, 'Nếu học viên đăng ký trên CHÍNH trình duyệt này, quyền học đã có hiệu lực. Nếu họ dùng máy khác, hãy gửi mã kích hoạt trên cho họ (Zalo/email) để dán vào mục Khóa của tôi.');
        render();
      } else if (act === 'cancel') { if (confirm('Hủy đơn này?')) { A.admin.cancel(id); render(); } }
      else if (act === 'code') { U.copy(A.admin.codeFor(id), 'Đã sao chép mã kích hoạt'); }
      else if (act === 'revoke') { if (confirm('Thu hồi quyền học này? Học viên sẽ không vào học được nữa.')) { A.admin.revoke(id); render(); } }
      else if (act === 'reset') {
        if (!confirm('Đặt lại mật khẩu cho ' + email + '? Mật khẩu cũ sẽ không dùng được.')) return;
        A.admin.resetPassword(email).then(function (tmp) { showResult('Mật khẩu tạm của ' + email, tmp, 'Gửi mật khẩu này cho học viên và nhắc họ đổi lại ở mục Hồ sơ.'); }).catch(err);
      } else if (act === 'rmuser') { if (confirm('Xóa tài khoản ' + email + '? Việc này không hoàn tác được.')) { A.admin.removeUser(email); render(); } }
    } catch (x) { err(x); }
  });

  function init() {
    if (!A.isAdmin() || !$('#pendBody')) return;
    var sel = $('#gCourse'); sel.innerHTML = COURSES.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('');
    $('#gPlan').addEventListener('change', function () { sel.disabled = this.value === 'pro'; });
    $('#grantForm').addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        var r = A.admin.grant({ email: $('#gEmail').value, course: sel.value, plan: $('#gPlan').value, days: $('#gDays').value });
        showResult('Đã cấp quyền cho ' + r.ent.email, r.activationCode, 'Có hiệu lực ngay nếu học viên dùng trình duyệt này; nếu dùng máy khác, gửi mã kích hoạt cho họ.');
        $('#gEmail').value = ''; render();
      } catch (x) { err(x); }
    });
    $('#importForm').addEventListener('submit', function (e) {
      e.preventDefault();
      try { var o = A.admin.importOrder($('#importCode').value); $('#importCode').value = ''; window.MamToast('Đã nhập đơn #' + o.no + ' của ' + o.email); render(); } catch (x) { err(x); }
    });
    $('#resultCopy').addEventListener('click', function () { U.copy($('#resultCode').value, 'Đã sao chép'); });
    $('#resultClose').addEventListener('click', function () { $('#result').hidden = true; });
    render();
  }
  A.ready.then(init);
})();
