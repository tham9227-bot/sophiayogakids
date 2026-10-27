// /flashcards/tai-ve/?don=7&t=token : the buyer's own download page.
(function () {
  var q = new URLSearchParams(location.search), so = q.get('don'), t = q.get('t'), el = document.getElementById('fc-tv');
  var TV = window.SophiaTaiVe;
  if (!so || !t) { el.innerHTML = '<p>Link chưa đúng. Anh/chị mở lại link tải riêng được cấp khi đặt mua, hoặc nhắn Zalo cô Sophia.</p>'; return; }
  var code = TV.code(so), shown = false;
  TV.watch(so, t, function (d) {
    if (d.error) { el.innerHTML = '<p>Không tìm thấy đơn ' + code + '. Anh/chị nhắn Zalo cô Sophia nhé.</p>'; return; }
    if (d.status === 'huy') { el.innerHTML = '<p>Đơn ' + code + ' đã bị hủy. Anh/chị nhắn Zalo cô Sophia nếu cần hỗ trợ.</p>'; return; }
    if (!d.file) { el.innerHTML = '<p class="fco-wait-dl">⏳ Đơn <b>' + code + '</b> đang chờ cô Sophia xác nhận chuyển khoản. Trang tự kiểm tra, khi xác nhận xong nút tải sẽ hiện ra.</p>'; return; }
    if (shown) return; shown = true;
    el.innerHTML = '<div class="fco-ready">🎉 Đơn <b>' + code + '</b> đã thanh toán. Cảm ơn anh/chị!<button type="button" class="fco-dl">⬇️ Tải file PDF gốc</button><span class="fco-prog"></span></div>';
    var btn = el.querySelector('.fco-dl'), prog = el.querySelector('.fco-prog');
    btn.onclick = function () {
      btn.disabled = true; prog.textContent = 'Đang tải…';
      TV.download(d.file, function (p) { prog.textContent = 'Đang tải… ' + p + '%'; })
        .then(function () { prog.textContent = 'Đã tải xong ✓ (xem trong mục Tải về / Files của máy)'; btn.disabled = false; })
        .catch(function () { prog.textContent = 'Chưa tải được, anh/chị bấm lại nhé.'; btn.disabled = false; });
    };
  });
})();
