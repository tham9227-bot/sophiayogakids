/* Hình động điều khí: chấm sáng đi theo hơi thở và sự chú ý */
(function () {
  var P = document.getElementById('dkPlayer'); if (!P) return;
  var svg = P.querySelector('svg'), chest = svg.querySelector('.dk-chest'), endsG = svg.querySelector('.dk-ends'), dotsG = svg.querySelector('.dk-dots');
  var cue = P.querySelector('.dk-cue'), goBtn = document.getElementById('dkGo'), left = document.getElementById('dkLeft'), hint = left.textContent;
  var NS = 'http://www.w3.org/2000/svg';
  var COL = { bung: '#c98a12', dinh: '#7a6cc0', chan: '#3f8f5a', tay: '#d9682b' };
  var TXT = { bung: 'thở ra, ý trượt xuống bụng', dinh: 'thở ra, ý nhẹ lên đỉnh đầu', chan: 'thở ra, xả qua lòng bàn chân', tay: 'thở ra, tỏa ra lòng bàn tay' };
  var st = { r: 'bung', i: 4, o: 6, m: 5 }, run = false, raf = 0, endAt = 0, n = 0, t0 = 0, phase = 0, segs = [], dots = [];
  var pIn = svg.querySelector('#dkp-in');
  function part(breath) { return st.r === 'chantay' ? (breath % 2 ? 'tay' : 'chan') : st.r; }
  function paths(k) { return [0, 1].map(function (i) { return svg.querySelector('#dkp-' + k + '-' + i); }).filter(Boolean); }
  function el(tag, a) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function showRoute() {
    Array.prototype.forEach.call(svg.querySelectorAll('.dk-routes path'), function (p) { p.classList.remove('on'); });
    pIn.classList.add('on');
    endsG.innerHTML = '';
    var ks = st.r === 'chantay' ? ['chan', 'tay'] : [st.r];
    ks.forEach(function (k) {
      paths(k).forEach(function (p) {
        p.classList.add('on'); p.style.stroke = COL[k];
        var e = p.getPointAtLength(p.getTotalLength());
        var c = el('circle', { cx: e.x, cy: e.y, r: 13, fill: COL[k], opacity: .18, 'data-k': k }); endsG.appendChild(c);
      });
    });
  }
  function setDots(list, col) {
    dotsG.innerHTML = ''; dots = list.map(function (p) {
      var g = el('circle', { r: 16, fill: col, opacity: .25 }), d = el('circle', { r: 6.5, fill: col });
      dotsG.appendChild(g); dotsG.appendChild(d); return [p, d, g];
    });
  }
  function place(f) {
    dots.forEach(function (x) { var L = x[0].getTotalLength(), pt = x[0].getPointAtLength(L * f); x[1].setAttribute('cx', pt.x); x[1].setAttribute('cy', pt.y); x[2].setAttribute('cx', pt.x); x[2].setAttribute('cy', pt.y); });
  }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function startPhase(p) {
    phase = p; t0 = performance.now();
    if (p === 0) { setDots([pIn], '#5b93bf'); }
    else { var k = part(n); setDots(paths(k), COL[k]); }
  }
  function frame(now) {
    var dur = (phase === 0 ? st.i : st.o) * 1000, f = Math.min(1, (now - t0) / dur), e = ease(f);
    place(e);
    var s = phase === 0 ? .6 + .7 * e : 1.3 - .7 * e;
    chest.style.transform = 'scale(' + s + ')'; chest.style.opacity = phase === 0 ? .5 + .5 * e : 1 - .5 * e;
    var k = part(n);
    Array.prototype.forEach.call(endsG.children, function (c) { var on = phase === 1 && c.getAttribute('data-k') === k; c.setAttribute('opacity', on ? .18 + .5 * e : .18); c.setAttribute('r', on ? 13 + 7 * e : 13); });
    var secs = Math.ceil((dur - (now - t0)) / 1000);
    cue.innerHTML = phase === 0 ? '<b>Hít vào, ý ở lồng ngực</b><span>' + secs + '</span>' : '<b>' + TXT[k].charAt(0).toUpperCase() + TXT[k].slice(1) + '</b><span>' + secs + '</span>';
    if (f >= 1) {
      if (phase === 0) startPhase(1);
      else { n++; if (Date.now() >= endAt) { finish(); return; } startPhase(0); }
      left.textContent = 'Còn khoảng ' + Math.max(1, Math.ceil((endAt - Date.now()) / 60000)) + ' phút · hơi thở thứ ' + (n + 1);
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (window.cbBell) cbBell(true); run = true; n = 0; endAt = Date.now() + st.m * 60000; startPhase(0); raf = requestAnimationFrame(frame); goBtn.textContent = '⏸ Dừng'; goBtn.classList.add('on'); }
  function stop() { run = false; cancelAnimationFrame(raf); dotsG.innerHTML = ''; chest.style.transform = 'scale(.6)'; chest.style.opacity = .5; goBtn.textContent = '▶ Bắt đầu'; goBtn.classList.remove('on'); cue.innerHTML = '<b>Sẵn sàng</b><span>🌿</span>'; left.textContent = hint; showRoute(); }
  function finish() { stop(); if (window.cbBell) cbBell(); cue.innerHTML = '<b>Xong rồi. Hai tay ôm bụng, thở tự nhiên.</b><span>🌿</span>'; left.textContent = 'Nếu vừa tập đường đỉnh đầu, thêm vài hơi thở xuống bụng hoặc lòng bàn chân trước khi đứng dậy.'; }
  goBtn.addEventListener('click', function () { if (run) stop(); else start(); });
  function chips(id, fn) {
    var box = document.getElementById(id);
    Array.prototype.forEach.call(box.children, function (b) {
      b.addEventListener('click', function () { Array.prototype.forEach.call(box.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); fn(b.getAttribute('data-v')); });
    });
  }
  function setRoute(r) { st.r = r; if (run) stop(); showRoute(); }
  chips('dkRoute', setRoute);
  chips('dkTempo', function (v) { v = v.split('-'); st.i = +v[0]; st.o = +v[1]; });
  chips('dkMin', function (v) { st.m = +v; });
  function goRoute(r) {
    Array.prototype.forEach.call(document.getElementById('dkRoute').children, function (x) { x.classList.toggle('on', x.getAttribute('data-v') === r); });
    setRoute(r); P.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.dk-go'), function (b) { b.addEventListener('click', function () { goRoute(b.getAttribute('data-r')); }); });
  var S = {
    lo: ['bung', 'Lo âu, bồn chồn: thở ra xuống bụng. Mở mắt nếu nhắm mắt làm mình lo hơn. Hít 3, thở 5 cho dễ.'],
    ngu: ['chan', 'Khó ngủ: nằm ngửa, thở ra xả qua lòng bàn chân, rồi kết thúc bằng vài hơi xuống bụng. Tránh đường đỉnh đầu.'],
    gian: ['chan', 'Nóng giận: đứng hoặc ngồi, hai bàn chân chạm sàn, thở ra xả qua lòng bàn chân. Năm hơi là đủ để qua cơn.'],
    dau: ['chan', 'Đầu nặng, nghĩ nhiều: đưa khí xuống. Thở ra qua lòng bàn chân, xen vài hơi xuống bụng.'],
    met: ['dinh', 'Uể oải, buồn ngủ: hai phút thở ra lên đỉnh đầu, ngồi thẳng, mắt mở. Rồi kết thúc bằng vài hơi xuống bụng. Huyết áp cao, hay đau đầu thì chọn lòng bàn tay thay vì đỉnh đầu.'],
    lanh: ['tay', 'Tay chân lạnh: thở ra tỏa qua lòng bàn tay, rồi chân rồi tay. Xoa hai bàn tay cho ấm trước khi tập.'],
    roi: ['chantay', 'Người rời rạc: một hơi xuống chân, một hơi ra tay, cho cả thân được tưới đều.']
  };
  var out = document.getElementById('dkStateOut');
  chips('dkState', function () {});
  Array.prototype.forEach.call(document.getElementById('dkState').children, function (b) {
    b.addEventListener('click', function () {
      var v = S[b.getAttribute('data-s')];
      out.innerHTML = '🌿 ' + v[1] + ' <button type="button" class="dk-go">▶ Tập ngay</button>';
      out.querySelector('button').addEventListener('click', function () { goRoute(v[0]); });
    });
  });
  showRoute();
})();
