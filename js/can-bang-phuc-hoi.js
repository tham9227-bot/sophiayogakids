/* Đồng hồ thở và chuỗi tập có hẹn giờ dùng chung cho các bài Yoga cân bằng phục hồi */
(function () {
  var AC = null;
  function bell(soft) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      [528, 792].forEach(function (f, i) {
        var o = AC.createOscillator(), g = AC.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, AC.currentTime);
        g.gain.exponentialRampToValueAtTime((soft ? 0.12 : 0.25) / (i + 1), AC.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 2.5);
        o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + 2.6);
      });
    } catch (e) {}
  }
  window.cbBell = bell;
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  // Đồng hồ thở: <div class="cb-breath" data-in="4" data-out="6" data-min="3" data-done="..."></div>
  Array.prototype.forEach.call(document.querySelectorAll('.cb-breath'), function (box) {
    var IN = +box.getAttribute('data-in') || 4, OUT = +box.getAttribute('data-out') || 6, HOLD = +box.getAttribute('data-hold') || 0, MIN = +box.getAttribute('data-min') || 3;
    var done = box.getAttribute('data-done') || 'Xong rồi. Ngồi yên thêm một chút.';
    var LBL = (box.getAttribute('data-labels') || 'Hít vào|Giữ nhẹ|Thở ra').split('|');
    box.className += ' hd-timer';
    box.innerHTML = '<div class="hd-stage"><div class="hd-ring"></div><div class="hd-ball"></div><div class="hd-word">Sẵn sàng<span>🌿</span></div></div>' +
      '<div class="hd-btns" style="justify-content:center"><button type="button">▶ Bắt đầu ' + MIN + ' phút</button></div>' +
      '<p class="hd-small">' + LBL[0] + ' ' + IN + ' nhịp' + (HOLD ? ', ' + LBL[1].toLowerCase() + ' ' + HOLD + ' nhịp' : '') + ', ' + LBL[2].toLowerCase() + ' ' + OUT + ' nhịp. Hết giờ có tiếng chuông nhỏ.</p>';
    var ball = box.querySelector('.hd-ball'), word = box.querySelector('.hd-word'), go = box.querySelector('button'), left = box.querySelector('.hd-small');
    var hint = left.textContent, timer = null, phase = 0, count = 0, endAt = 0;
    var LEN = [IN, HOLD, OUT];
    function setPhase(p) { phase = p; count = LEN[p]; ball.style.transition = 'transform ' + count + 's ease-in-out'; if (p === 0) ball.style.transform = 'scale(1)'; if (p === 2) ball.style.transform = 'scale(.45)'; show(); }
    function show() { word.innerHTML = LBL[phase] + '<span>' + count + '</span>'; }
    function next() { if (phase === 0) setPhase(HOLD ? 1 : 2); else if (phase === 1) setPhase(2); else setPhase(0); }
    function tick() {
      count--;
      if (count <= 0) {
        if (Date.now() >= endAt && phase === 2) { stop(); bell(); word.innerHTML = 'Xong rồi<span>🌿</span>'; left.textContent = done; return; }
        next();
      } else show();
      left.textContent = 'Còn khoảng ' + Math.max(1, Math.ceil((endAt - Date.now()) / 60000)) + ' phút';
    }
    function start() { bell(true); endAt = Date.now() + MIN * 60000; setPhase(0); timer = setInterval(tick, 1000); go.textContent = '⏸ Dừng'; go.classList.add('on'); }
    function stop() { clearInterval(timer); timer = null; ball.style.transition = 'transform 1.5s ease'; ball.style.transform = 'scale(.45)'; go.textContent = '▶ Bắt đầu ' + MIN + ' phút'; go.classList.remove('on'); word.innerHTML = 'Sẵn sàng<span>🌿</span>'; left.textContent = hint; }
    go.addEventListener('click', function () { if (timer) stop(); else start(); });
  });

  // Chuỗi tập có hẹn giờ: <div class="cb-seq"><h3>..</h3><ol><li data-s="60"><b>Tên</b> lời nhắc</li>...</ol></div>
  Array.prototype.forEach.call(document.querySelectorAll('.cb-seq'), function (box) {
    var items = box.querySelectorAll('li'), S = [], total = 0;
    Array.prototype.forEach.call(items, function (li, i) {
      var s = +li.getAttribute('data-s'); S.push(s); total += s;
      li.insertAdjacentHTML('beforeend', ' <em>' + mmss(s) + '</em>');
      li.addEventListener('click', function () { go(i, true); });
    });
    var ol = box.querySelector('ol');
    ol.insertAdjacentHTML('beforebegin', '<div class="cb-now" aria-live="polite"><b>Sẵn sàng</b><i>Tổng cộng khoảng ' + Math.round(total / 60) + ' phút. Bấm bắt đầu, hoặc bấm vào một bước bất kỳ.</i></div><div class="cb-clock">' + mmss(total) + '</div><div class="cb-bar"><div></div></div>' +
      '<div class="hd-btns"><button type="button" class="p">▶ Bắt đầu</button><button type="button" class="n">⏭ Bước sau</button></div>');
    var now = box.querySelector('.cb-now'), clock = box.querySelector('.cb-clock'), bar = box.querySelector('.cb-bar div'), bp = box.querySelector('.p'), bn = box.querySelector('.n');
    var cur = -1, rest = 0, timer = null;
    function render() {
      Array.prototype.forEach.call(items, function (li, i) { li.classList.toggle('on', i === cur); li.classList.toggle('done', i < cur); });
      if (cur >= 0) {
        var li = items[cur], b = li.querySelector('b');
        var cue = li.textContent.replace(b.textContent, '').replace(/\s*\d+:\d\d\s*$/, '').trim();
        now.innerHTML = '<b>' + (cur + 1) + '. ' + b.textContent + '</b><i>' + cue + '</i>';
        clock.textContent = mmss(rest); bar.style.width = (100 * (1 - rest / S[cur])) + '%';
      }
    }
    function go(i, manual) {
      if (i >= items.length) { finish(); return; }
      cur = i; rest = S[i]; bell(true); render();
      if (manual && !timer) play();
    }
    function finish() { pause(); cur = items.length; render(); bell(); now.innerHTML = '<b>Xong rồi 🌿</b><i>Nằm hoặc ngồi yên thêm một lúc. Cảm ơn cơ thể đã đi cùng mình hôm nay.</i>'; clock.textContent = '0:00'; bar.style.width = '100%'; cur = -1; bp.textContent = '▶ Tập lại'; }
    function tick() { rest--; if (rest <= 0) go(cur + 1); else render(); }
    function play() { if (cur < 0) { go(0); } timer = setInterval(tick, 1000); bp.textContent = '⏸ Tạm dừng'; bp.classList.add('on'); }
    function pause() { clearInterval(timer); timer = null; bp.textContent = '▶ Tiếp tục'; bp.classList.remove('on'); }
    bp.addEventListener('click', function () { if (timer) pause(); else play(); });
    bn.addEventListener('click', function () { if (cur < 0) go(0, true); else go(cur + 1); });
  });
})();
