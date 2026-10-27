// Flashcards: order popup with a VietQR code (amount + order code SYxxxx). PDF: the download button appears here once cô Sophia confirms the payment; hard cards: the buyer sends name/phone/address.
(function () {
  var BANK = { bin: '970407', name: 'Techcombank', acct: '9349270304', holder: 'NGUYEN THI THAM' };
  var ZALO = 'https://zalo.me/0349270304';

  function vnd(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đồng'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // VietQR (EMVCo) payload: account + amount + transfer note
  function tlv(id, v) { return id + (v.length < 10 ? '0' : '') + v.length + v; }
  function crc16(s) {
    var c = 0xFFFF;
    for (var i = 0; i < s.length; i++) {
      c ^= s.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1;
      c &= 0xFFFF;
    }
    return ('000' + c.toString(16).toUpperCase()).slice(-4);
  }
  function vietqr(amount, note) {
    var s = tlv('00', '01') + tlv('01', '12') +
      tlv('38', tlv('00', 'A000000727') + tlv('01', tlv('00', BANK.bin) + tlv('01', BANK.acct)) + tlv('02', 'QRIBFTTA')) +
      tlv('53', '704') + tlv('54', String(amount)) + tlv('58', 'VN') + tlv('62', tlv('08', note)) + '6304';
    return s + crc16(s);
  }
  function qrSvg(text) {
    var q = qrcode(0, 'M'); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
  var TV = window.SophiaTaiVe;

  var box = document.createElement('div');
  box.className = 'fco'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Đặt mua flashcards');
  document.body.appendChild(box);

  var o = null, stopWatch = null;
  function close() {
    box.hidden = true; if (stopWatch) { stopWatch(); stopWatch = null; }
    if (document.getElementById('fc-lb') && !document.getElementById('fc-lb').hidden) return;
    document.body.style.overflow = '';
  }

  // remember the open order per deck + type, so reopening the popup keeps the same code and download link
  function memKey(x) { return 'fc-don-' + x.slug + '-' + x.type; }
  function remember(x) { try { localStorage.setItem(memKey(x), JSON.stringify({ so: x.so, token: x.token })); } catch (e) {} }
  function recall(x) { try { return JSON.parse(localStorage.getItem(memKey(x)) || 'null'); } catch (e) { return null; } }
  function forget(x) { try { localStorage.removeItem(memKey(x)); } catch (e) {} }

  function zaloText() {
    var hard = o.type === 'hard';
    var s = 'Chào cô Sophia, em đã chuyển khoản đơn ' + o.code + '\n' +
      '• Bộ thẻ: ' + o.deck + ' (' + o.cards + ' thẻ)\n' +
      '• Loại: ' + (hard ? 'Thẻ cứng, ' + o.qty + ' bộ' : 'Thẻ PDF') + '\n' +
      '• Số tiền: ' + vnd(o.price * o.qty);
    if (hard) s += '\n• Người nhận: ' + (o.ten || '') + '\n• SĐT: ' + (o.sdt || '') + '\n• Địa chỉ: ' + (o.dc || '');
    return s;
  }

  function render() {
    var total = o.price * o.qty, hard = o.type === 'hard', online = !!o.token;
    var note = o.code + (hard ? ' THE CUNG' : ' PDF');
    var zalo = '<a class="fco-zalo-link" href="' + ZALO + '" target="_blank" rel="noopener">💬 Nhắn Zalo cô Sophia</a>';
    box.innerHTML = '<div class="fco-box">' +
      '<div class="fco-top"><b>' + (hard ? '🃏 Mua bộ thẻ cứng' : '📄 Mua thẻ PDF') + '</b><button type="button" class="fco-x" aria-label="Đóng">✕</button></div>' +
      '<p class="fco-deck">' + esc(o.deck) + ' · ' + o.cards + ' thẻ · Mã đơn <b>' + o.code + '</b></p>' +
      (hard ? '<div class="fco-qty"><span>Số bộ:</span><button type="button" data-q="-1" aria-label="Bớt 1 bộ">−</button><b>' + o.qty + '</b><button type="button" data-q="1" aria-label="Thêm 1 bộ">+</button></div>' : '') +
      '<p class="fco-total">Số tiền: <b>' + vnd(total) + '</b></p>' +
      '<div class="fco-status" hidden></div>' +
      '<ol class="fco-steps">' +
      (hard ? '<li><b>Điền nơi nhận thẻ</b><div class="fco-form">' +
        '<input type="text" name="ten" placeholder="Họ và tên người nhận" autocomplete="name" value="' + esc(o.ten || '') + '">' +
        '<input type="tel" name="sdt" placeholder="Số điện thoại" autocomplete="tel" value="' + esc(o.sdt || '') + '">' +
        '<textarea name="dc" rows="2" placeholder="Địa chỉ nhận thẻ" autocomplete="street-address">' + esc(o.dc || '') + '</textarea></div></li>' : '') +
      '<li><b>Quét mã QR</b> bằng ứng dụng ngân hàng. Số tiền và nội dung đã điền sẵn, anh/chị giữ nguyên nội dung <b>' + note + '</b> nhé.' +
      '<div class="fco-qr">' + qrSvg(vietqr(total, note)) + '</div>' +
      '<table class="fco-bank">' +
      '<tr><td>Ngân hàng</td><td>' + BANK.name + '</td></tr>' +
      '<tr><td>Số tài khoản</td><td><b>' + BANK.acct + '</b> <button type="button" class="fco-copy" data-c="' + BANK.acct + '">Sao chép</button></td></tr>' +
      '<tr><td>Chủ tài khoản</td><td>Nguyễn Thị Thắm</td></tr>' +
      '<tr><td>Số tiền</td><td><b>' + vnd(total) + '</b></td></tr>' +
      '<tr><td>Nội dung</td><td><b>' + note + '</b> <button type="button" class="fco-copy" data-c="' + note + '">Sao chép</button></td></tr>' +
      '</table></li>' +
      (hard
        ? '<li><b>Chuyển khoản xong, bấm gửi đơn.</b> Cô Sophia nhận được thông tin, kiểm tra tiền về rồi in thẻ màu A5 hai mặt và gửi đến địa chỉ của anh/chị. Phí giao hàng (nếu có) cô sẽ báo qua Zalo.' +
          '<button type="button" class="fco-send">✅ Tôi đã chuyển khoản, gửi đơn</button><p class="fco-msg" hidden></p></li>'
        : '<li><b>Chuyển khoản xong, chờ cô Sophia xác nhận.</b> Nút <b>Tải file PDF</b> sẽ tự hiện ở đây (trang tự kiểm tra, không cần tải lại).' +
          (online ? '<div class="fco-wait-dl">⏳ Đang chờ xác nhận chuyển khoản…' + (o.bao ? '' : '<button type="button" class="fco-send fco-send-pdf">✅ Tôi đã chuyển khoản</button>') + '</div>' +
            '<p class="fco-link">Link tải riêng của anh/chị (lưu lại để tải sau):<br><span>' + esc(TV.link(o.so, o.token)) + '</span> <button type="button" class="fco-copy" data-c="' + esc(TV.link(o.so, o.token)) + '">Sao chép</button></p>'
            : '<p class="fco-msg err">Chưa kết nối được máy chủ, anh/chị chuyển khoản xong nhắn Zalo cô Sophia để nhận file nhé.</p>') +
          '</li>') +
      '</ol>' +
      '<p class="fco-after">Cần hỗ trợ? ' + zalo + ' (0349 270 304)</p>' +
      '</div>';
    box.querySelector('.fco-x').onclick = close;
    if (!hard && online && !stopWatch) stopWatch = TV.watch(o.so, o.token, showStatus);
    if (o.file) showStatus({ status: 'da-tra', file: o.file });
  }

  function showStatus(d) {
    if (!o) return;
    if (d.status === 'huy') { forget(o); }
    if (!d.file) return;
    o.file = d.file;
    var w = box.querySelector('.fco-wait-dl');
    if (!w) return;
    w.className = 'fco-ready';
    w.innerHTML = '🎉 Cô Sophia đã nhận được tiền. Cảm ơn anh/chị!<button type="button" class="fco-dl">⬇️ Tải file PDF gốc</button><span class="fco-prog"></span>';
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () {});
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); return Promise.resolve();
  }

  box.addEventListener('input', function (e) { if (e.target.name) o[e.target.name] = e.target.value; });
  box.addEventListener('click', function (e) {
    if (e.target === box) return close();
    var q = e.target.closest('[data-q]');
    if (q) { o.qty = Math.min(20, Math.max(1, o.qty + +q.dataset.q)); return render(); }
    var c = e.target.closest('.fco-copy');
    if (c) { copy(c.dataset.c).then(function () { c.textContent = 'Đã chép ✓'; setTimeout(function () { c.textContent = 'Sao chép'; }, 1500); }); return; }
    if (e.target.closest('.fco-zalo-link')) { copy(zaloText()); return; } // the link itself opens the Zalo chat
    var dl = e.target.closest('.fco-dl');
    if (dl && o.file) {
      var prog = box.querySelector('.fco-prog');
      dl.disabled = true; prog.textContent = 'Đang tải…';
      TV.download(o.file, function (p) { prog.textContent = 'Đang tải… ' + p + '%'; })
        .then(function () { prog.textContent = 'Đã tải xong ✓ (xem trong mục Tải về / Files của máy)'; dl.disabled = false; })
        .catch(function () { prog.textContent = 'Chưa tải được, anh/chị bấm lại hoặc mở link tải riêng nhé.'; dl.disabled = false; });
      return;
    }
    var sp = e.target.closest('.fco-send-pdf');
    if (sp) {
      sp.disabled = true;
      fetch('/api/don-hang/info', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ so: o.so, t: o.token }) })
        .then(function (r) { if (!r.ok) throw 0; o.bao = 1; sp.outerHTML = '<span class="fco-prog">Đã báo cô Sophia ✓ Nút tải sẽ hiện ra khi cô xác nhận.</span>'; })
        .catch(function () { sp.disabled = false; });
      return;
    }
    if (e.target.closest('.fco-send')) {
      var msg = box.querySelector('.fco-msg');
      if (!o.ten || !o.sdt || !o.dc) {
        msg.hidden = false; msg.className = 'fco-msg err'; msg.textContent = 'Anh/chị điền giúp họ tên, số điện thoại và địa chỉ nhận thẻ ở bước 1 nhé.';
        return;
      }
      var ok = function () {
        msg.hidden = false; msg.className = 'fco-msg';
        msg.innerHTML = 'Đã gửi đơn ' + o.code + ' cho cô Sophia. Cô sẽ liên hệ khi gửi thẻ. Muốn báo nhanh hơn, anh/chị bấm <a class="fco-zalo-link" href="' + ZALO + '" target="_blank" rel="noopener">nhắn Zalo</a> (thông tin đơn được chép sẵn, chỉ cần dán).';
      };
      if (!o.token) return ok();
      fetch('/api/don-hang/info', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ so: o.so, t: o.token, qty: o.qty, ten: o.ten, sdt: o.sdt, dc: o.dc }) })
        .then(function (r) { if (!r.ok) throw 0; ok(); forget(o); })
        .catch(function () { msg.hidden = false; msg.className = 'fco-msg err'; msg.innerHTML = 'Chưa gửi được, anh/chị bấm <a class="fco-zalo-link" href="' + ZALO + '" target="_blank" rel="noopener">nhắn Zalo</a> để báo cô Sophia nhé (thông tin đơn được chép sẵn).'; });
    }
  });
  document.addEventListener('keydown', function (e) { if (!box.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);

  // new order on the Worker (sequential code SY0001…), or reuse the one this browser already opened for the deck
  function getOrder(x) {
    var timer = function () { return new Promise(function (r) { setTimeout(function () { r(null); }, 6000); }); };
    var old = recall(x);
    var check = old ? Promise.race([TV.status(old.so, old.token), timer()]).then(function (d) {
      return d && d.status !== 'huy' ? { so: old.so, token: old.token, file: d.file } : null;
    }) : Promise.resolve(null);
    return check.then(function (reuse) {
      if (reuse) return reuse;
      var req = fetch('/api/don-hang', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: x.slug, deck: x.deck, type: x.type }) })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return Promise.race([req, timer()]);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('a[data-order]');
    if (!b || typeof qrcode !== 'function' || !TV) return; // no QR library → fall back to the Zalo link
    e.preventDefault();
    if (stopWatch) { stopWatch(); stopWatch = null; }
    o = { type: b.dataset.order, slug: b.dataset.slug, deck: b.dataset.deck, cards: +b.dataset.cards, price: +b.dataset.price, qty: 1 };
    box.innerHTML = '<div class="fco-box"><p class="fco-wait">Đang tạo mã đơn…</p></div>';
    box.hidden = false; document.body.style.overflow = 'hidden';
    var mine = o;
    getOrder(o).then(function (d) {
      if (o !== mine) return;
      if (d && d.so) { o.so = d.so; o.token = d.token; o.file = d.file; o.code = TV.code(d.so); remember(o); }
      else o.code = 'SY' + String(Math.floor(10000 + Math.random() * 90000));
      render(); box.querySelector('.fco-x').focus();
    });
  });
})();
