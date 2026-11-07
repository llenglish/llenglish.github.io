/* Mầm - trang "Khóa của tôi" và "Hồ sơ". */
(function () {
  'use strict';
  var A = window.MamAuth, U = window.MamUI;
  if (!A || !U) return;
  var esc = U.esc;
  function $(s) { return document.querySelector(s); }
  var STATUS = { pending: ['Chờ xác nhận', 'pill-gold'], paid: ['Đã xác nhận', ''], cancelled: ['Đã hủy', 'pill-rose'] };

  function renderEnts() {
    var box = $('#entList'); if (!box) return;
    var ents = A.myEntitlements(), now = Date.now();
    $('#entEmpty').hidden = ents.length > 0;
    box.innerHTML = ents.map(function (e) {
      var active = e.end > now, left = Math.max(0, Math.ceil((e.end - now) / 86400000));
      var learn = e.course === '*' ? 'beginner' : e.course;
      return '<article class="ent-card' + (active ? '' : ' off') + '"><div><span class="pill ' + (e.plan === 'pro' ? 'pill-gold' : 'pill-solid') + '">' + esc(e.plan === 'pro' ? 'Gói Pro' : A.LEVELS[e.level]) + '</span>' +
        '<h3>' + esc(U.courseName(e.course)) + '</h3>' +
        '<p class="small muted">' + (active ? 'Còn <strong>' + left + ' ngày</strong> · hết hạn ' + U.fmtDate(e.end) : 'Đã hết hạn ngày ' + U.fmtDate(e.end)) + '</p></div>' +
        (active ? '<a class="btn btn-primary btn-sm" href="hoc.html?khoa=' + encodeURIComponent(learn) + '">Vào học</a>' : '<a class="btn btn-outline btn-sm" href="mua-khoa.html?khoa=' + encodeURIComponent(learn) + '&goi=' + (e.plan === 'pro' ? 'pro' : e.plan) + '">Gia hạn</a>') + '</article>';
    }).join('');
  }

  function renderOrders() {
    var box = $('#orderList'); if (!box) return;
    var os = A.myOrders();
    $('#orderEmpty').hidden = os.length > 0;
    box.innerHTML = os.map(function (o) {
      var st = STATUS[o.status] || STATUS.pending;
      return '<tr><td><strong>#' + esc(o.no) + '</strong></td><td>' + esc(U.courseName(o.plan === 'pro' ? '*' : o.course)) + '<br><span class="small muted">' + esc(U.planName(o.plan)) + '</span></td>' +
        '<td class="mono">' + esc(o.memo) + '</td><td>' + U.money(o.amount) + '</td><td><span class="pill ' + st[1] + '">' + st[0] + '</span></td>' +
        '<td>' + (o.status === 'pending' ? '<button type="button" class="btn btn-outline btn-xs" data-ocode="' + esc(o.id) + '">Sao chép mã đơn</button>' : '') + '</td></tr>';
    }).join('');
    [].forEach.call(box.querySelectorAll('[data-ocode]'), function (b) {
      b.addEventListener('click', function () { U.copy(A.orderCode(b.getAttribute('data-ocode')), 'Đã sao chép mã đơn. Hãy gửi cho thầy cô kèm ảnh biên lai.'); });
    });
  }

  function newOrderBanner() {
    var id = new URLSearchParams(location.search).get('order'), box = $('#newOrder'); if (!box || !id) return;
    var o = A.myOrders().filter(function (x) { return x.id === id; })[0]; if (!o) return;
    box.hidden = false;
    $('#newOrderNo').textContent = '#' + o.no;
    $('#newOrderCode').value = A.orderCode(o.id);
    $('#newOrderCopy').addEventListener('click', function () { U.copy($('#newOrderCode').value, 'Đã sao chép mã đơn'); });
  }

  function activation() {
    var f = $('#actForm'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#actMsg'); msg.hidden = true;
      A.activate($('#actCode').value).then(function () {
        $('#actCode').value = ''; renderEnts(); renderOrders(); window.MamToast('Đã kích hoạt khóa học. Chúc bạn học vui!');
      }).catch(function (err) { msg.textContent = err.message; msg.hidden = false; });
    });
  }

  function profile() {
    var f = $('#profForm'); if (!f) return;
    var me = A.current();
    $('#pEmail').value = me.email; $('#pTen').value = me.name; $('#pSdt').value = me.phone;
    $('#pRole').textContent = me.role === 'admin' ? 'Quản trị viên' : 'Học viên';
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var m = $('#profMsg');
      try { A.updateProfile({ name: $('#pTen').value, phone: $('#pSdt').value }); m.hidden = true; window.MamToast('Đã lưu hồ sơ'); setTimeout(function () { location.reload(); }, 600); }
      catch (err) { m.textContent = err.message; m.hidden = false; }
    });
    $('#pwForm').addEventListener('submit', function (e) {
      e.preventDefault(); var m = $('#pwMsg'); m.hidden = true;
      A.changePassword($('#pwOld').value, $('#pwNew').value).then(function (code) {
        $('#pwOld').value = ''; $('#pwNew').value = '';
        $('#recBox').hidden = false; $('#recCode').textContent = code; window.MamToast('Đã đổi mật khẩu');
      }).catch(function (err) { m.textContent = err.message; m.hidden = false; });
    });
    $('#recCopy').addEventListener('click', function () { U.copy($('#recCode').textContent, 'Đã sao chép mã khôi phục'); });
  }

  A.ready.then(function () {
    if (!A.current()) return;
    renderEnts(); renderOrders(); newOrderBanner(); activation(); profile();
  });
})();
