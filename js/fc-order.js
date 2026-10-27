// Flashcards: order popup with a VietQR code (amount + order code), then the buyer reports the transfer to cô Sophia on Zalo.
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

  var box = document.createElement('div');
  box.className = 'fco'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Đặt mua flashcards');
  document.body.appendChild(box);

  var o = null;
  function close() { box.hidden = true; if (document.getElementById('fc-lb') && !document.getElementById('fc-lb').hidden) return; document.body.style.overflow = ''; }

  function render() {
    var total = o.price * o.qty, hard = o.type === 'hard';
    var note = o.code + (hard ? ' THE CUNG' : ' PDF');
    box.innerHTML = '<div class="fco-box">' +
      '<div class="fco-top"><b>' + (hard ? '🃏 Mua bộ thẻ cứng' : '📄 Mua thẻ PDF') + '</b><button type="button" class="fco-x" aria-label="Đóng">✕</button></div>' +
      '<p class="fco-deck">' + esc(o.deck) + ' · ' + o.cards + ' thẻ</p>' +
      (hard ? '<div class="fco-qty"><span>Số bộ:</span><button type="button" data-q="-1" aria-label="Bớt 1 bộ">−</button><b>' + o.qty + '</b><button type="button" data-q="1" aria-label="Thêm 1 bộ">+</button></div>' : '') +
      '<p class="fco-total">Số tiền: <b>' + vnd(total) + '</b></p>' +
      '<ol class="fco-steps">' +
      (hard ? '<li><b>Điền nơi nhận thẻ</b><div class="fco-form">' +
        '<input type="text" name="ten" placeholder="Họ và tên người nhận" autocomplete="name" value="' + esc(o.ten || '') + '">' +
        '<input type="tel" name="sdt" placeholder="Số điện thoại" autocomplete="tel" value="' + esc(o.sdt || '') + '">' +
        '<textarea name="dc" rows="2" placeholder="Địa chỉ nhận thẻ" autocomplete="street-address">' + esc(o.dc || '') + '</textarea></div></li>' : '') +
      '<li><b>Quét mã QR</b> bằng ứng dụng ngân hàng. Số tiền và nội dung đã điền sẵn.' +
      '<div class="fco-qr">' + qrSvg(vietqr(total, note)) + '</div>' +
      '<table class="fco-bank">' +
      '<tr><td>Ngân hàng</td><td>' + BANK.name + '</td></tr>' +
      '<tr><td>Số tài khoản</td><td><b>' + BANK.acct + '</b> <button type="button" class="fco-copy" data-c="' + BANK.acct + '">Sao chép</button></td></tr>' +
      '<tr><td>Chủ tài khoản</td><td>Nguyễn Thị Thắm</td></tr>' +
      '<tr><td>Số tiền</td><td><b>' + vnd(total) + '</b></td></tr>' +
      '<tr><td>Nội dung</td><td><b>' + note + '</b> <button type="button" class="fco-copy" data-c="' + note + '">Sao chép</button></td></tr>' +
      '</table></li>' +
      '<li><b>Chuyển khoản xong, báo cô Sophia qua Zalo.</b> Bấm nút dưới, thông tin đơn được chép sẵn: chỉ cần dán vào Zalo và gửi kèm ảnh chụp biên lai.' +
      '<button type="button" class="fco-zalo">💬 Báo đã chuyển khoản qua Zalo</button><p class="fco-msg" hidden></p></li>' +
      '</ol>' +
      '<p class="fco-after">' + (hard
        ? 'Cô Sophia kiểm tra tiền về rồi in thẻ màu A5 hai mặt và gửi đến địa chỉ của anh/chị. Phí giao hàng (nếu có) cô sẽ báo qua Zalo.'
        : 'Cô Sophia kiểm tra tiền về rồi gửi file PDF bản in nét qua Zalo để anh/chị tải về và tự in.') + '</p>' +
      '</div>';
    box.querySelector('.fco-x').onclick = close;
  }

  function orderText() {
    var hard = o.type === 'hard', t = o.price * o.qty;
    var s = 'Chào cô Sophia, em đã chuyển khoản đơn ' + o.code + '\n' +
      '• Bộ thẻ: ' + o.deck + ' (' + o.cards + ' thẻ)\n' +
      '• Loại: ' + (hard ? 'Thẻ cứng, ' + o.qty + ' bộ' : 'Thẻ PDF') + '\n' +
      '• Số tiền: ' + vnd(t);
    if (hard) s += '\n• Người nhận: ' + (o.ten || '') + '\n• SĐT: ' + (o.sdt || '') + '\n• Địa chỉ: ' + (o.dc || '');
    return s;
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
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
    if (e.target.closest('.fco-zalo')) {
      var msg = box.querySelector('.fco-msg');
      if (o.type === 'hard' && (!o.ten || !o.sdt || !o.dc)) {
        msg.hidden = false; msg.className = 'fco-msg err'; msg.textContent = 'Anh/chị điền giúp họ tên, số điện thoại và địa chỉ nhận thẻ nhé.';
        return;
      }
      copy(orderText()).then(function () {
        msg.hidden = false; msg.className = 'fco-msg';
        msg.innerHTML = 'Đã chép thông tin đơn ' + o.code + '. Mở Zalo, dán vào ô chat và gửi kèm ảnh biên lai nhé. <a href="' + ZALO + '" target="_blank" rel="noopener">Mở Zalo cô Sophia</a>';
      });
      window.open(ZALO, '_blank', 'noopener');
    }
  });
  document.addEventListener('keydown', function (e) { if (!box.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);

  // sequential order number from the Worker (SY0001, SY0002…); random 5-digit code if it can't be reached
  function newCode(order) {
    var fallback = function () { return 'SY' + String(Math.floor(10000 + Math.random() * 90000)); };
    var timer = new Promise(function (r) { setTimeout(function () { r(null); }, 5000); });
    var req = fetch('/api/don-hang', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deck: order.deck, type: order.type }) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.race([req, timer]).then(function (d) {
      return d && d.so ? 'SY' + ('000' + d.so).slice(-Math.max(4, String(d.so).length)) : fallback();
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('a[data-order]');
    if (!b || typeof qrcode !== 'function') return; // no QR library → fall back to the Zalo link
    e.preventDefault();
    o = { type: b.dataset.order, deck: b.dataset.deck, cards: +b.dataset.cards, price: +b.dataset.price, qty: 1 };
    box.innerHTML = '<div class="fco-box"><p class="fco-wait">Đang tạo mã đơn…</p></div>';
    box.hidden = false; document.body.style.overflow = 'hidden';
    var mine = o;
    newCode(o).then(function (code) {
      if (o !== mine) return;
      o.code = code; render(); box.querySelector('.fco-x').focus();
    });
  });
})();
