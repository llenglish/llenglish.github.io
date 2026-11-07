/*
  Mầm - Lõi đăng nhập và phân quyền KHÔNG CẦN MÁY CHỦ.
  Mọi dữ liệu nằm trong localStorage của CHÍNH trình duyệt đang dùng.
  => Chỉ phù hợp để chạy thử. Không bảo mật thật, không đồng bộ giữa các máy.
  Các trang chỉ gọi window.MamAuth; sau này thay file này bằng bản dùng Supabase là xong.
*/
(function () {
  'use strict';
  var S = window.SITE || {};
  var DB_KEY = 'mam_db_v1', SES_KEY = 'mam_session_v1';
  var DAY = 86400000;
  var LEVELS = { 1: 'Cấp 1 · Tự học', 2: 'Cấp 2 · Có kèm bài', 3: 'Cấp 3 · Kèm trực tiếp' };
  var PERSISTENT = true;
  var mem = null;

  /* ---------- lưu trữ ---------- */
  function emptyDb() { return { users: [], orders: [], ents: [], seq: 0 }; }
  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (raw) { var d = JSON.parse(raw); d.users = d.users || []; d.orders = d.orders || []; d.ents = d.ents || []; return d; }
      return emptyDb();
    } catch (e) { PERSISTENT = false; return mem || (mem = emptyDb()); }
  }
  function save(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { PERSISTENT = false; mem = db; }
  }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function norm(email) { return String(email || '').trim().toLowerCase(); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
  function fail(msg) { return Promise.reject(new Error(msg)); }

  /* ---------- băm mật khẩu ---------- */
  function bytesToHex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function randHex(n) {
    var a = new Uint8Array(n);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return bytesToHex(a);
  }
  function fallbackHash(s) { // chỉ dùng khi trình duyệt thiếu WebCrypto (không an toàn)
    var h1 = 0x811c9dc5, h2 = 0x1b873593;
    for (var r = 0; r < 200; r++) for (var i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = Math.imul(h2 + s.charCodeAt(i) + r, 2246822519);
    }
    return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }
  function hashPw(pw, salt) {
    var hasSubtle = window.crypto && crypto.subtle && window.TextEncoder;
    if (!hasSubtle) return Promise.resolve('f1:' + fallbackHash(salt + pw));
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, k, 256);
    }).then(function (bits) { return 'p1:' + bytesToHex(bits); });
  }
  function makeRecovery() {
    var alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a = new Uint8Array(12), s = '';
    crypto.getRandomValues(a);
    for (var i = 0; i < 12; i++) { s += alpha[a[i] % alpha.length]; if (i % 4 === 3 && i < 11) s += '-'; }
    return s;
  }
  function cleanCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  /* ---------- mã trao đổi giữa các máy (đơn hàng / kích hoạt) ---------- */
  function b64e(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }
  function chk(s) { // chỉ để phát hiện gõ nhầm/cắt dở, KHÔNG phải chữ ký bảo mật
    var h = 0x811c9dc5, t = s + '|' + (S.codeSalt || 'mam');
    for (var i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
  }
  function pack(prefix, obj) { var p = b64e(obj); return prefix + '.' + p + '.' + chk(p); }
  function unpack(prefix, code) {
    var parts = String(code || '').trim().split('.');
    if (parts.length !== 3 || parts[0] !== prefix || chk(parts[1]) !== parts[2]) throw new Error('Mã không đúng hoặc bị cắt thiếu. Hãy dán lại nguyên văn.');
    try { return b64d(parts[1]); } catch (e) { throw new Error('Mã không đọc được. Hãy dán lại nguyên văn.'); }
  }

  /* ---------- phiên ---------- */
  function getSession() {
    try {
      var s = sessionStorage.getItem(SES_KEY) || localStorage.getItem(SES_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function setSession(email, remember) {
    try {
      localStorage.removeItem(SES_KEY); sessionStorage.removeItem(SES_KEY);
      (remember ? localStorage : sessionStorage).setItem(SES_KEY, JSON.stringify({ email: email, t: Date.now() }));
    } catch (e) { /* không lưu được: phiên chỉ sống trong trang */ }
  }
  function publicUser(u) { return u ? { id: u.id, email: u.email, name: u.name, phone: u.phone || '', role: u.role, created: u.created } : null; }
  function current() {
    var s = getSession(); if (!s) return null;
    var u = load().users.filter(function (x) { return x.email === s.email; })[0];
    return publicUser(u);
  }
  function isAdmin() { var u = current(); return !!u && u.role === 'admin'; }
  function needAdmin() { if (!isAdmin()) throw new Error('Chỉ quản trị viên mới làm được việc này.'); }
  function needUser() { var u = current(); if (!u) throw new Error('Bạn cần đăng nhập.'); return u; }

  /* ---------- quyền học ---------- */
  function planDays(plan) {
    var d = (S.validityDays || {})['c' + plan];
    return plan === 'pro' ? 30 : (d > 0 ? d : 30);
  }
  function activeEnts(email) {
    var now = Date.now();
    return load().ents.filter(function (e) { return e.email === email && e.end > now && e.start <= now; });
  }
  function accessFor(courseId) {
    var u = current(); if (!u) return null;
    if (u.role === 'admin') return { level: 3, plan: 'admin', end: null, daysLeft: null, admin: true, label: 'Quản trị viên' };
    var best = null;
    activeEnts(u.email).forEach(function (e) {
      if (e.course !== '*' && e.course !== courseId) return;
      if (!best || e.level > best.level || (e.level === best.level && e.end > best.end)) best = e;
    });
    if (!best) return null;
    return { level: best.level, plan: best.plan, end: best.end, daysLeft: Math.max(0, Math.ceil((best.end - Date.now()) / DAY)), label: best.plan === 'pro' ? 'Gói Pro' : LEVELS[best.level] };
  }
  function addEntitlement(db, o) { // gia hạn nối tiếp nếu đang còn hạn cùng khóa và gói
    var now = Date.now(), start = now;
    db.ents.forEach(function (e) {
      if (e.email === o.email && e.course === o.course && e.plan === o.plan && e.end > start) start = e.end;
    });
    var ent = { id: uid('e'), email: o.email, course: o.course, level: o.level, plan: o.plan, start: now, end: start + o.days * DAY, orderNo: o.orderNo || '', note: o.note || '' };
    db.ents.push(ent);
    return ent;
  }

  /* ---------- khởi tạo + tài khoản mẫu ---------- */
  var ready = (function () {
    var db = load(), chain = Promise.resolve();
    if (S.demo !== false && !db.users.some(function (u) { return u.demo; })) {
      [
        { name: 'Quản trị Demo', email: 'admin@mam.demo', pw: 'Admin@123', role: 'admin' },
        { name: 'Học viên Demo', email: 'hocvien@mam.demo', pw: 'Hocvien@123', role: 'student' }
      ].forEach(function (d) {
        chain = chain.then(function () {
          var salt = randHex(16);
          return hashPw(d.pw, salt).then(function (h) {
            var db2 = load();
            if (db2.users.some(function (u) { return u.email === d.email; })) return;
            db2.users.push({ id: uid('u'), email: d.email, name: d.name, phone: '', role: d.role, salt: salt, hash: h, rsalt: '', rhash: '', created: Date.now(), demo: true });
            if (d.role === 'student') addEntitlement(db2, { email: d.email, course: 'beginner', level: 2, plan: '2', days: 30, note: 'Quyền mẫu' });
            save(db2);
          });
        });
      });
    }
    return chain.catch(function () {});
  })();

  /* ---------- tài khoản ---------- */
  function signup(o) {
    var email = norm(o.email), name = String(o.name || '').trim(), pw = String(o.password || '');
    if (name.length < 2) return fail('Hãy nhập họ và tên.');
    if (!validEmail(email)) return fail('Email chưa đúng định dạng.');
    if (pw.length < 8) return fail('Mật khẩu cần ít nhất 8 ký tự.');
    if (load().users.some(function (u) { return u.email === email; })) return fail('Email này đã có tài khoản. Hãy đăng nhập.');
    var salt = randHex(16), rsalt = randHex(16), code = makeRecovery();
    return Promise.all([hashPw(pw, salt), hashPw(cleanCode(code), rsalt)]).then(function (h) {
      var db = load();
      if (db.users.some(function (u) { return u.email === email; })) throw new Error('Email này đã có tài khoản. Hãy đăng nhập.');
      var admins = (S.adminEmails || []).map(norm);
      var u = { id: uid('u'), email: email, name: name, phone: String(o.phone || '').trim(), role: admins.indexOf(email) >= 0 ? 'admin' : 'student', salt: salt, hash: h[0], rsalt: rsalt, rhash: h[1], created: Date.now() };
      db.users.push(u); save(db);
      setSession(email, o.remember !== false);
      return { user: publicUser(u), recoveryCode: code };
    });
  }
  function login(email, password, remember) {
    email = norm(email);
    var u = load().users.filter(function (x) { return x.email === email; })[0];
    var wrong = 'Email hoặc mật khẩu chưa đúng.';
    if (!u) return hashPw(String(password), 'x').then(function () { throw new Error(wrong); });
    return hashPw(String(password), u.salt).then(function (h) {
      if (h !== u.hash) throw new Error(wrong);
      setSession(email, remember !== false);
      return publicUser(u);
    });
  }
  function logout() { try { localStorage.removeItem(SES_KEY); sessionStorage.removeItem(SES_KEY); } catch (e) {} }
  function setPassword(u, pw, db) { // trả Promise<recoveryCode>
    var salt = randHex(16), rsalt = randHex(16), code = makeRecovery();
    return Promise.all([hashPw(pw, salt), hashPw(cleanCode(code), rsalt)]).then(function (h) {
      u.salt = salt; u.hash = h[0]; u.rsalt = rsalt; u.rhash = h[1]; save(db); return code;
    });
  }
  function resetWithCode(email, code, newPw) {
    email = norm(email);
    if (String(newPw || '').length < 8) return fail('Mật khẩu mới cần ít nhất 8 ký tự.');
    var db = load(), u = db.users.filter(function (x) { return x.email === email; })[0];
    var bad = 'Email hoặc mã khôi phục chưa đúng.';
    if (!u || !u.rhash) return fail(bad);
    return hashPw(cleanCode(code), u.rsalt).then(function (h) {
      if (h !== u.rhash) throw new Error(bad);
      return setPassword(u, newPw, db);
    }).then(function (newCode) { setSession(email, true); return { recoveryCode: newCode, user: publicUser(u) }; });
  }
  function changePassword(oldPw, newPw) {
    var me = needUser();
    if (String(newPw).length < 8) return fail('Mật khẩu mới cần ít nhất 8 ký tự.');
    var db = load(), u = db.users.filter(function (x) { return x.email === me.email; })[0];
    return hashPw(String(oldPw), u.salt).then(function (h) {
      if (h !== u.hash) throw new Error('Mật khẩu hiện tại chưa đúng.');
      return setPassword(u, newPw, db);
    });
  }
  function updateProfile(o) {
    var me = needUser(), db = load(), u = db.users.filter(function (x) { return x.email === me.email; })[0];
    var name = String(o.name || '').trim();
    if (name.length < 2) throw new Error('Hãy nhập họ và tên.');
    u.name = name; u.phone = String(o.phone || '').trim(); save(db); return publicUser(u);
  }

  /* ---------- đơn hàng ---------- */
  function pendingNo() {
    var db = load(), n = null;
    try { n = sessionStorage.getItem('mam_order'); } catch (e) {}
    function taken(x) { return db.orders.some(function (o) { return o.no === x; }); }
    if (!n || taken(n)) {
      do { n = String(Math.floor(1000 + Math.random() * 9000)); } while (taken(n));
      try { sessionStorage.setItem('mam_order', n); } catch (e) {}
    }
    return n;
  }
  function createOrder(o) {
    var me = needUser(), db = load(), no = pendingNo();
    var order = { id: uid('o'), no: no, email: me.email, name: me.name, course: o.course, plan: String(o.plan), amount: Number(o.amount) || 0, memo: o.memoPrefix + '-' + no, status: 'pending', created: Date.now() };
    db.orders.push(order); save(db);
    try { sessionStorage.removeItem('mam_order'); } catch (e) {}
    return Promise.resolve(order);
  }
  function myOrders() { var me = current(); return me ? load().orders.filter(function (o) { return o.email === me.email; }).sort(function (a, b) { return b.created - a.created; }) : []; }
  function myEnts() { var me = current(); return me ? load().ents.filter(function (e) { return e.email === me.email; }).sort(function (a, b) { return b.end - a.end; }) : []; }
  function orderCode(id) {
    var o = load().orders.filter(function (x) { return x.id === id; })[0]; if (!o) throw new Error('Không thấy đơn.');
    return pack('MAMD', { no: o.no, email: o.email, name: o.name, course: o.course, plan: o.plan, amount: o.amount, memo: o.memo, created: o.created });
  }
  function entFromOrder(db, o) {
    var plan = o.plan, level = plan === 'pro' ? 3 : Number(plan);
    return addEntitlement(db, { email: o.email, course: plan === 'pro' ? '*' : o.course, level: level, plan: plan, days: planDays(plan), orderNo: o.no });
  }
  function activationFor(ent) {
    return pack('MAMK', { email: ent.email, course: ent.course, level: ent.level, plan: ent.plan, days: Math.round((ent.end - ent.start) / DAY), orderNo: ent.orderNo });
  }
  function activate(code) {
    var me = needUser(), d;
    try { d = unpack('MAMK', code); } catch (e) { return fail(e.message); }
    if (d.email !== me.email) return fail('Mã này dành cho tài khoản ' + d.email + ', không phải tài khoản bạn đang dùng.');
    var db = load();
    if (db.ents.some(function (e) { return e.email === d.email && e.orderNo && e.orderNo === d.orderNo && e.course === d.course; })) return fail('Mã này đã được kích hoạt rồi.');
    var ent = addEntitlement(db, { email: d.email, course: d.course, level: d.level, plan: d.plan, days: d.days, orderNo: d.orderNo });
    db.orders.forEach(function (o) { if (o.email === d.email && o.no === d.orderNo) o.status = 'paid'; });
    save(db);
    return Promise.resolve(ent);
  }

  /* ---------- quản trị ---------- */
  var admin = {
    orders: function () { needAdmin(); return load().orders.slice().sort(function (a, b) { return b.created - a.created; }); },
    users: function () { needAdmin(); return load().users.map(publicUser); },
    ents: function () { needAdmin(); return load().ents.slice().sort(function (a, b) { return b.end - a.end; }); },
    importOrder: function (code) {
      needAdmin();
      var d = unpack('MAMD', code), db = load();
      if (db.orders.some(function (o) { return o.no === d.no && o.email === d.email; })) throw new Error('Đơn #' + d.no + ' đã có trong danh sách.');
      var o = { id: uid('o'), no: d.no, email: d.email, name: d.name, course: d.course, plan: d.plan, amount: d.amount, memo: d.memo, status: 'pending', created: d.created, imported: true };
      db.orders.push(o); save(db); return o;
    },
    confirm: function (id) {
      needAdmin();
      var db = load(), o = db.orders.filter(function (x) { return x.id === id; })[0];
      if (!o) throw new Error('Không thấy đơn.');
      if (o.status === 'paid') throw new Error('Đơn này đã được xác nhận.');
      var ent = entFromOrder(db, o);
      o.status = 'paid'; o.confirmed = Date.now(); save(db);
      return { order: o, ent: ent, activationCode: activationFor(ent) };
    },
    codeFor: function (entId) { needAdmin(); var e = load().ents.filter(function (x) { return x.id === entId; })[0]; if (!e) throw new Error('Không thấy quyền học.'); return activationFor(e); },
    cancel: function (id) {
      needAdmin(); var db = load(), o = db.orders.filter(function (x) { return x.id === id; })[0];
      if (!o) throw new Error('Không thấy đơn.'); if (o.status === 'paid') throw new Error('Đơn đã xác nhận, hãy thu hồi quyền học ở bảng bên dưới.');
      o.status = 'cancelled'; save(db); return o;
    },
    grant: function (o) {
      needAdmin();
      var email = norm(o.email), plan = String(o.plan), days = Number(o.days) || planDays(plan), db = load();
      if (!validEmail(email)) throw new Error('Email chưa đúng định dạng.');
      if (['1', '2', '3', 'pro'].indexOf(plan) < 0) throw new Error('Gói không hợp lệ.');
      if (plan !== 'pro' && !(window.MAM_COURSES || []).some(function (c) { return c.id === o.course; })) throw new Error('Hãy chọn khóa học.');
      var ent = addEntitlement(db, { email: email, course: plan === 'pro' ? '*' : o.course, level: plan === 'pro' ? 3 : Number(plan), plan: plan, days: days, orderNo: 'G' + Date.now().toString(36), note: 'Cấp tay' });
      save(db); return { ent: ent, activationCode: activationFor(ent) };
    },
    revoke: function (entId) { needAdmin(); var db = load(); db.ents = db.ents.filter(function (e) { return e.id !== entId; }); save(db); },
    resetPassword: function (email) {
      needAdmin(); email = norm(email);
      var db = load(), u = db.users.filter(function (x) { return x.email === email; })[0];
      if (!u) throw new Error('Không thấy tài khoản.');
      var tmp = 'Mam-' + randHex(4);
      return setPassword(u, tmp, db).then(function () { return tmp; });
    },
    removeUser: function (email) {
      needAdmin(); email = norm(email);
      if (email === current().email) throw new Error('Không thể xóa chính bạn.');
      var db = load(); db.users = db.users.filter(function (u) { return u.email !== email; }); save(db);
    }
  };

  /* ---------- chặn trang theo quyền ---------- */
  function pageName() { var p = location.pathname.split('/').pop(); return p || 'index.html'; }
  function loginUrl() { return 'dang-ky.html?next=' + encodeURIComponent(pageName() + location.search) + '#dang-nhap'; }
  var html = document.documentElement, req = html.getAttribute('data-require');
  if (req) {
    var me = current();
    if (!me) { location.replace(loginUrl()); }
    else if (req === 'login') html.setAttribute('data-ok', '1');
    /* 'admin' và 'access' được auth-ui.js xử lý tiếp (cần DOM để hiện thông báo) */
  }

  window.MamAuth = {
    ready: ready, LEVELS: LEVELS, persistent: function () { return PERSISTENT; },
    current: current, isAdmin: isAdmin, signup: signup, login: login, logout: logout,
    resetWithCode: resetWithCode, changePassword: changePassword, updateProfile: updateProfile,
    accessFor: accessFor, myEntitlements: myEnts, myOrders: myOrders,
    nextOrderNo: pendingNo, createOrder: createOrder, orderCode: orderCode, activate: activate,
    admin: admin, loginUrl: loginUrl, planDays: planDays
  };
})();
