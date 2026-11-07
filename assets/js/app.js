/* Mầm - script giao diện (không cần máy chủ). */
(function () {
  'use strict';
  var S = window.SITE || {};
  var bank = S.bank || {};
  var prices = S.prices || {};
  var days = S.validityDays || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n) { return n > 0 ? Number(n).toLocaleString('vi-VN') + ' đ' : '[Giá]'; }
  function dayText(n) { return n > 0 ? n + ' ngày' : '[Số ngày]'; }

  /* ---------- Toast (định nghĩa trong auth-ui.js) ---------- */
  function toast(msg) { if (window.MamToast) window.MamToast(msg); }

  /* ---------- Điền cấu hình ---------- */
  function fillConfig() {
    $all('[data-cfg]').forEach(function (el) {
      var key = el.getAttribute('data-cfg');
      var v = '';
      if (key === 'email') v = S.email || '[email]';
      else if (key === 'zalo') v = S.zalo || '[Zalo]';
      else if (key === 'bank.name') v = bank.name || '[Tên ngân hàng]';
      else if (key === 'bank.number') v = bank.number || '[Số tài khoản]';
      else if (key === 'bank.owner') v = bank.owner || '[Tên chủ tài khoản]';
      else if (key.indexOf('price.') === 0) v = money(prices[key.slice(6)]);
      el.textContent = v;
    });
    $all('[data-cfg-mailto]').forEach(function (el) {
      if (S.email) el.setAttribute('href', 'mailto:' + S.email);
    });
    $all('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Sao chép ---------- */
  function initCopy() {
    $all('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-copy'));
        if (!target) return;
        var text = target.textContent.trim();
        function done() { toast('Đã sao chép: ' + text); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { toast('Không sao chép được, hãy bôi đen và copy thủ công.'); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) { toast('Hãy bôi đen và copy thủ công.'); }
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ---------- Form demo ---------- */
  function initDemoForms() {
    $all('form[data-demo]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        toast(f.getAttribute('data-demo'));
      });
    });
    $all('[data-demo-msg]').forEach(function (b) {
      b.addEventListener('click', function () { toast(b.getAttribute('data-demo-msg')); });
    });
  }

  /* ---------- Trang khóa học ---------- */
  var COURSES = window.MAM_COURSES || [];

  function initCourses() {
    var grid = $('#courseGrid');
    if (!grid) return;
    var empty = $('#courseEmpty');
    var langTabs = $all('#langTabs .tab');
    var chipBox = $('#levelChips');
    var levels = ['Tất cả', 'Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced'];
    var state = { lang: 'en', level: 'Tất cả' };

    chipBox.innerHTML = levels.map(function (l) {
      return '<button type="button" class="chip" data-level="' + l + '" aria-pressed="false">' + l + '</button>';
    }).join('');

    function render() {
      langTabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-lang') === state.lang)); });
      $all('.chip', chipBox).forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-level') === state.level)); });
      var list = state.lang === 'en' ? COURSES.filter(function (c) { return state.level === 'Tất cả' || c.level === state.level; }) : [];
      grid.innerHTML = list.map(function (c) {
        return '<article class="course">' +
          '<div class="course-thumb"><img src="' + c.img + '" alt="" width="150" height="150">' +
          '<span class="lv">' + c.level + '</span>' +
          '<a class="play" href="goi-hoc.html" aria-label="Xem video giới thiệu ' + c.title + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></a></div>' +
          '<div class="course-body"><h3>' + c.title + '</h3><p>' + c.desc + '</p>' +
          '<div class="course-tags"><span class="pill">Video bài giảng</span><span class="pill">Flashcard</span><span class="pill">Bài tập</span></div>' +
          '<div class="course-foot"><span class="small muted">Từ <strong style="color:var(--ink)">' + money(prices.c1) + '</strong></span>' +
          '<a class="btn btn-primary btn-sm" href="mua-khoa.html?khoa=' + c.id + '&goi=2">Chọn khóa này</a></div></div></article>';
      }).join('');
      var none = list.length === 0;
      empty.hidden = !none;
      grid.hidden = none;
    }

    langTabs.forEach(function (t) {
      t.addEventListener('click', function () { state.lang = t.getAttribute('data-lang'); state.level = 'Tất cả'; render(); });
    });
    chipBox.addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c) return;
      state.level = c.getAttribute('data-level');
      render();
    });
    render();
  }

  /* ---------- Trang mua khóa ---------- */
  function initCheckout() {
    var root = $('#checkout');
    if (!root) return;
    var q = new URLSearchParams(location.search);
    var selCourse = $('#selCourse'), selPlan = $('#selPlan');
    selCourse.innerHTML = COURSES.map(function (c) { return '<option value="' + c.id + '">' + c.title + '</option>'; }).join('');
    var plan = q.get('goi');
    selPlan.value = ['1', '2', '3', 'pro'].indexOf(plan) >= 0 ? plan : '2';
    var cid = q.get('khoa');
    if (COURSES.some(function (c) { return c.id === cid; })) selCourse.value = cid;

    var orderNo = window.MamAuth ? MamAuth.nextOrderNo() : '0123';
    var btnPaid = $('#btnPaid');
    if (btnPaid && window.MamAuth && !MamAuth.current()) btnPaid.textContent = 'Đăng nhập để tạo đơn';

    var names = { '1': 'Cấp 1 · Tự học', '2': 'Cấp 2 · Có kèm bài', '3': 'Cấp 3 · Kèm trực tiếp', 'pro': 'Gói Pro · Học mọi khóa' };
    function update() {
      var p = selPlan.value;
      var isPro = p === 'pro';
      selCourse.disabled = isPro;
      var course = COURSES.filter(function (c) { return c.id === selCourse.value; })[0] || COURSES[0];
      var amount = isPro ? prices.pro : prices['c' + p];
      var dur = isPro ? '1 tháng, gia hạn hằng tháng' : dayText(days['c' + p]);
      var memo = isPro ? 'EN-PRO-M1-' + orderNo : 'EN-' + course.code + '-C' + p + '-' + orderNo;
      $('#sumCourse').textContent = isPro ? 'Tất cả khóa học' : course.title;
      $('#sumPlan').textContent = names[p];
      $('#sumDur').textContent = dur;
      $('#sumOrder').textContent = '#' + orderNo;
      $('#sumTotal').textContent = money(amount);
      $('#bankAmount').textContent = money(amount);
      $('#memo').textContent = memo;
      var qr = $('#qrBox');
      if (bank.bin && bank.number && amount > 0) {
        var url = 'https://img.vietqr.io/image/' + encodeURIComponent(bank.bin) + '-' + encodeURIComponent(bank.number) + '-compact2.png?amount=' + amount + '&addInfo=' + encodeURIComponent(memo) + (bank.owner ? '&accountName=' + encodeURIComponent(bank.owner) : '');
        qr.innerHTML = '<img src="' + url + '" alt="Mã VietQR thanh toán ' + memo + '">';
      } else {
        qr.innerHTML = '<strong>Mã VietQR</strong><span>Sẽ hiện khi bạn điền ngân hàng, số tài khoản và giá trong file config.js</span>';
      }
    }
    function selection() {
      var p = selPlan.value, isPro = p === 'pro';
      var course = COURSES.filter(function (c) { return c.id === selCourse.value; })[0] || COURSES[0];
      return { p: p, isPro: isPro, course: course, amount: isPro ? prices.pro : prices['c' + p] };
    }
    if (btnPaid) btnPaid.addEventListener('click', function () {
      var A = window.MamAuth, sel = selection();
      if (!A) return;
      if (!A.current()) {
        var back = 'mua-khoa.html?khoa=' + encodeURIComponent(sel.course.id) + '&goi=' + sel.p;
        location.href = 'dang-ky.html?next=' + encodeURIComponent(back) + '#dang-nhap';
        return;
      }
      btnPaid.disabled = true;
      A.createOrder({ course: sel.isPro ? '*' : sel.course.id, plan: sel.p, amount: sel.amount, memoPrefix: sel.isPro ? 'EN-PRO-M1' : 'EN-' + sel.course.code + '-C' + sel.p })
        .then(function (o) { location.href = 'khoa-cua-toi.html?order=' + encodeURIComponent(o.id); })
        .catch(function (e) { btnPaid.disabled = false; toast(e.message); });
    });
    selCourse.addEventListener('change', update);
    selPlan.addEventListener('change', update);
    update();
  }

  /* ---------- Trang học ---------- */
  function initLearn() {
    var tabs = $all('[data-tab]');
    if (!tabs.length) return;
    function show(id) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === id)); });
      $all('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-tab')); }); });
    show('video');

    var flash = $('#flash');
    if (flash) flash.addEventListener('click', function () { flash.classList.toggle('flipped'); });

    var opts = $all('.opt');
    var fb = $('#feedback');
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        var ok = o.getAttribute('data-ok') === '1';
        opts.forEach(function (x) { x.classList.remove('ok', 'bad'); if (x.getAttribute('data-ok') === '1') x.classList.add('ok'); });
        if (!ok) o.classList.add('bad');
        fb.hidden = false;
        $('#fbImg').src = '' + (ok ? 'mam-celebrate.svg' : 'mam-study.svg');
        $('#fbTitle').textContent = ok ? 'Chính xác, tuyệt vời!' : 'Gần đúng rồi, thử xem đáp án nhé!';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillConfig();
    initCopy();
    initDemoForms();
    initCourses();
    (window.MamAuth ? MamAuth.ready : Promise.resolve()).then(initCheckout);
    initLearn();
  });
})();
