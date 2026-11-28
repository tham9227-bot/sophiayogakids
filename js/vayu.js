/* Bài Luyện thở theo 5 dòng khí: sơ đồ bấm được, chọn dòng khí theo trạng thái, đồng hồ nhịp thở có hình dòng khí chuyển động */
(function () {
  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function bell(soft) { if (window.cbBell) window.cbBell(soft); }

  var VAYU = {
    prana: { n: 'Prana vayu', v: 'Dòng đi vào', c: '#e0683a', t: [4, 4, 0],
      i: 'Hít vào, khí mát vào mũi, ngực nở ra hai bên', o: 'Thở ra êm, ngực vẫn mở, giữ hơi ấm ở tim', h: '' },
    apana: { n: 'Apana vayu', v: 'Dòng đi xuống', c: '#8a6a3a', t: [4, 6, 0],
      i: 'Hít vào nhẹ xuống bụng', o: 'Thở ra dài, xuống bụng dưới, xuống hai chân', h: '' },
    samana: { n: 'Samana vayu', v: 'Dòng về giữa', c: '#c98a12', t: [4, 4, 2],
      i: 'Hít vào, bụng nở đều quanh rốn', o: 'Thở ra, gom về một điểm ở rốn', h: 'Nghỉ tự nhiên, ấm ở giữa bụng' },
    udana: { n: 'Udana vayu', v: 'Dòng đi lên', c: '#5b93bf', t: [4, 6, 0],
      i: 'Hít vào, gom từ bụng lên ngực', o: 'Thở ra ngân nhẹ, lên cổ họng, lên đỉnh đầu', h: '' },
    vyana: { n: 'Vyana vayu', v: 'Dòng lan tỏa', c: '#3f8f5a', t: [4, 6, 0],
      i: 'Hít vào, gom từ khắp người về tim', o: 'Thở ra, lan tỏa ra tay, chân, khắp da', h: '' }
  };
  var ORDER = ['apana', 'samana', 'prana', 'udana', 'vyana'];

  // Vẽ một khung: dòng k, pha ph ('i' hít, 'o' thở ra, 'h' nghỉ, '' đứng yên), tiến độ p (0..1)
  function draw(svg, k, ph, p) {
    if (!svg) return;
    var only = svg.getAttribute('data-only');
    if (only) k = only;
    each(svg.querySelectorAll('.pv-f'), function (f) {
      var mine = f.getAttribute('data-k') === k, cur = mine && f.getAttribute('data-ph') === ph;
      f.style.opacity = !mine ? 0 : cur ? 0.95 : (ph === '' ? 0.55 : 0.14);
      f.style.strokeDashoffset = cur ? String(-p * 36) : '0';
      var pt = f._pt;
      if (!pt) {
        pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pt.setAttribute('r', '6.5'); pt.setAttribute('fill', f.getAttribute('stroke')); pt.setAttribute('class', 'pv-pt');
        f.parentNode.appendChild(pt); f._pt = pt; f._len = f.getTotalLength();
      }
      if (cur) {
        var q = f.getPointAtLength(f._len * Math.min(1, p * 1.05));
        pt.setAttribute('cx', q.x); pt.setAttribute('cy', q.y); pt.style.opacity = p > 0.96 ? (1 - p) * 20 : 0.95;
      } else pt.style.opacity = 0;
    });
    each(svg.querySelectorAll('.pv-z'), function (z) {
      var mine = z.getAttribute('data-k') === k, s = 1;
      if (ph === 'i') s = 0.75 + 0.5 * p; else if (ph === 'o') s = 1.25 - 0.5 * p; else if (ph === 'h') s = 0.75 + 0.06 * Math.sin(p * Math.PI * 2);
      if (z.tagName.toLowerCase() === 'ellipse') {
        var e = ph === 'o' ? 0.86 + 0.14 * p : ph === 'i' ? 1 - 0.14 * p : 0.92;
        z.style.transform = 'scale(' + e + ')'; z.style.opacity = mine ? 0.95 : 0.22;
      } else {
        z.style.transform = 'scale(' + (mine ? s : 0.7) + ')'; z.style.opacity = mine ? 1 : 0.22;
      }
    });
  }
  window.PV = { VAYU: VAYU, ORDER: ORDER, draw: draw };

  // Hình nhỏ trong thẻ từng dòng: chuyển động nhẹ liên tục khi nhìn thấy
  var minis = document.querySelectorAll('.pv-mini');
  if (minis.length) {
    var t0 = Date.now();
    (function loop() {
      var t = (Date.now() - t0) / 1000;
      each(minis, function (m) {
        var k = m.getAttribute('data-only'), T = VAYU[k].t, per = T[0] + T[1] + T[2], x = t % per, ph, p;
        if (x < T[0]) { ph = 'i'; p = x / T[0]; } else if (x < T[0] + T[1]) { ph = 'o'; p = (x - T[0]) / T[1]; } else { ph = 'h'; p = (x - T[0] - T[1]) / T[2]; }
        var r = m.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) draw(m, k, ph, p);
      });
      requestAnimationFrame(loop);
    })();
  }

  // 1. Sơ đồ năm dòng khí bấm được
  var INFO = {
    udana: ['Udana · Dòng đi lên', 'Ở cổ họng, đi từ ngực lên đầu. Lo việc nói, nuốt, nét mặt, sự tỉnh táo, ý chí vươn lên. Kinh điển nói Udana là dòng đưa ta đi lên khi rời thân xác. Hình ảnh: hơi ấm bốc lên như khói hương.'],
    prana: ['Prana · Dòng đi vào', 'Ở lồng ngực, quanh tim và phổi, hướng vào trong và lên trên. Lo việc hít vào, nhịp tim, tiếp nhận mọi thứ đi vào qua mũi, mắt, tai. Hình ảnh: đón ánh nắng sáng vào ngực.'],
    samana: ['Samana · Dòng về giữa', 'Ở quanh rốn, giữa tim và rốn. Gom từ hai phía về trung tâm, như lửa trong bếp. Lo việc tiêu hóa và hấp thu, cả thức ăn lẫn cảm xúc, ý nghĩ. Hình ảnh: ngọn lửa nhỏ, đều.'],
    apana: ['Apana · Dòng đi xuống', 'Ở bụng dưới, vùng chậu, hướng xuống và ra ngoài. Lo việc thải bỏ: thở ra, bài tiết, kinh nguyệt, sinh nở. Ở tầng tâm là khả năng buông. Hình ảnh: rễ cây cắm xuống đất.'],
    vyana: ['Vyana · Dòng lan tỏa', 'Không ở một chỗ, mà thấm khắp cơ thể, từ trung tâm ra tay chân, ra da. Lo việc tuần hoàn, phối hợp cử động, giữ cho các dòng kia gắn với nhau. Hình ảnh: nước thấm đều ra mọi ngả.']
  };
  var mo = $('pvMapOut');
  function showMap(k) {
    each(document.querySelectorAll('.pv-map .pv-lab'), function (x) { x.classList.toggle('on', x.getAttribute('data-k') === k); });
    each(document.querySelectorAll('.pv-map .pv-z'), function (z) { z.classList.toggle('on', z.getAttribute('data-k') === k); });
    var d = INFO[k]; if (mo) { mo.style.setProperty('--c', VAYU[k].c); mo.innerHTML = '<b>' + d[0] + '</b><p>' + d[1] + '</p><a href="#dong-' + k + '">Xem cách thở cho dòng này ↓</a>'; }
  }
  each(document.querySelectorAll('.pv-map .pv-lab, .pv-map .pv-z'), function (g) {
    var k = g.getAttribute('data-k');
    g.addEventListener('click', function () { showMap(k); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showMap(k); } });
  });

  // 2. Chọn dòng khí theo trạng thái
  var ST = {
    sang: ['prana', 'Sáng dậy còn uể oải, nặng đầu: Prana. Mở cửa sổ, ngồi thẳng, ngửa tay. Hít 4, thở ra 4, chín hơi. Rồi uống một cốc nước ấm, ra nắng sớm vài phút.'],
    boc: ['apana', 'Đầu óc bốc lên, nóng ruột, nói nhanh: Apana. Úp tay xuống đùi, hai bàn chân chạm sàn. Thở ra dài hơn hít vào, đưa ý xuống bụng dưới, xuống chân. Năm phút.'],
    roi: ['samana', 'Nhiều việc, rối, bụng thắt lại vì lo: Samana. Hai tay đặt quanh rốn. Hít vào bụng nở đều, thở ra gom về rốn, nghỉ một chút tự nhiên. Ba đến năm phút.'],
    nghen: ['udana', 'Sắp phải nói điều khó, thấy nghẹn ở cổ: Udana. Ngồi thẳng, cằm thu nhẹ. Thở ra ngân “mmm” thật khẽ, cảm giác rung ở họng, lên đầu. Sáu hơi.'],
    roirac: ['vyana', 'Ngồi máy tính lâu, tay chân lạnh, thấy rời rạc: Vyana. Đứng dậy nếu được. Hít vào gom về tim, thở ra lan ra hai bàn tay, hai bàn chân. Chín hơi, rồi đi lại vài bước.'],
    ngu: ['apana', 'Nằm mãi không ngủ được: Apana rồi Vyana, nằm ngửa. Năm phút thở ra dài xuống chân, rồi để hơi thở lan đều khắp người, không cần đếm nữa.'],
    buon: ['prana', 'Buồn, co người lại: Prana thật nhẹ. Một tay đặt lên ngực. Hít vào cảm nhận ngực nở dưới bàn tay, thở ra chậm, không cố. Năm hơi, rồi đi ra ngoài trời một lúc. Buồn kéo dài trên hai tuần thì nên tìm người để nói chuyện và gặp bác sĩ.'],
    an: ['samana', 'Sau bữa ăn thấy nặng: chưa tập vội. Đi bộ chậm mười phút. Khoảng hai giờ sau mới tập Samana, thật nhẹ. Đầy bụng, ợ nóng kéo dài thì nên đi khám.']
  };
  var so = $('pvStateOut');
  each(document.querySelectorAll('#pvState button'), function (b) {
    b.addEventListener('click', function () {
      each(document.querySelectorAll('#pvState button'), function (x) { x.classList.toggle('on', x === b); });
      var d = ST[b.getAttribute('data-s')];
      so.innerHTML = d[1] + ' <button type="button" class="pv-go">⏱ Thở cùng ' + VAYU[d[0]].n + '</button>';
      so.querySelector('.pv-go').addEventListener('click', function () { pick(d[0]); $('pvPlayer').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });
  });

  // 3. Đồng hồ nhịp thở
  var stage = document.querySelector('#pvPlayer .pv-play');
  if (!stage) return;
  var K = 'apana', MODE = 'goi-y', MIN = 3, run = false, raf = 0, startAt = 0, endAt = 0, lastK = '';
  var word = $('pvWord'), cue = $('pvCue'), left = $('pvLeft'), name = $('pvName'), go = $('pvGo');
  function tempo(k) {
    var T = VAYU[k].t;
    if (MODE === 'nhe') return [3, 4, 0];
    if (MODE === 'cham') return [5, 5, T[2] ? 2 : 0];
    return T;
  }
  function pick(k) {
    K = k;
    each(document.querySelectorAll('#pvPick button'), function (x) { x.classList.toggle('on', x.getAttribute('data-k') === k); });
    if (!run) idle();
  }
  function idle() {
    var k = K === 'ca5' ? 'apana' : K;
    draw(stage, k, '', 0);
    name.textContent = K === 'ca5' ? 'Cả năm dòng, nối nhau' : VAYU[k].n + ' · ' + VAYU[k].v;
    name.style.color = K === 'ca5' ? '#6b4423' : VAYU[k].c;
    word.textContent = 'Sẵn sàng'; cue.textContent = K === 'ca5' ? 'Apana, Samana, Prana, Udana, Vyana, mỗi dòng chia đều thời gian' : 'Mũi tên chỉ hướng của dòng khí';
    left.textContent = '';
  }
  function chips(id, fn) {
    each(document.querySelectorAll('#' + id + ' button'), function (b) {
      b.addEventListener('click', function () { each(document.querySelectorAll('#' + id + ' button'), function (x) { x.classList.toggle('on', x === b); }); fn(b); });
    });
  }
  chips('pvPick', function (b) { pick(b.getAttribute('data-k')); });
  chips('pvTempo', function (b) { MODE = b.getAttribute('data-m'); });
  chips('pvMin', function (b) { MIN = +b.getAttribute('data-m'); if (!run) idle(); });
  function frame() {
    var now = Date.now(), el = (now - startAt) / 1000, total = MIN * 60;
    if (el >= total) { stop(true); return; }
    var k = K;
    if (K === 'ca5') { var idx = Math.min(4, Math.floor(el / (total / 5))); k = ORDER[idx]; el = el - idx * (total / 5); }
    if (k !== lastK) { if (lastK) bell(true); lastK = k; name.textContent = VAYU[k].n + ' · ' + VAYU[k].v; name.style.color = VAYU[k].c; }
    var T = tempo(k), per = T[0] + T[1] + T[2], x = el % per, ph, p, cnt;
    if (x < T[0]) { ph = 'i'; p = x / T[0]; cnt = T[0] - Math.floor(x); }
    else if (x < T[0] + T[1]) { ph = 'o'; p = (x - T[0]) / T[1]; cnt = T[1] - Math.floor(x - T[0]); }
    else { ph = 'h'; p = (x - T[0] - T[1]) / T[2]; cnt = T[2] - Math.floor(x - T[0] - T[1]); }
    draw(stage, k, ph, p);
    word.innerHTML = (ph === 'i' ? 'Hít vào' : ph === 'o' ? 'Thở ra' : 'Nghỉ') + ' <em>' + cnt + '</em>';
    cue.textContent = VAYU[k][ph];
    var r = Math.ceil(total - (now - startAt) / 1000); left.textContent = 'Còn ' + Math.floor(r / 60) + ':' + ('0' + r % 60).slice(-2);
    raf = requestAnimationFrame(frame);
  }
  function start() { bell(true); run = true; lastK = ''; startAt = Date.now(); go.textContent = '⏸ Dừng'; go.classList.add('on'); frame(); }
  function stop(done) {
    cancelAnimationFrame(raf); run = false; go.textContent = '▶ Bắt đầu'; go.classList.remove('on'); idle();
    if (done) { bell(); word.textContent = 'Xong rồi 🌿'; cue.textContent = 'Ngồi yên thêm vài hơi, thở tự nhiên, cảm nhận cả cơ thể.'; }
  }
  go.addEventListener('click', function () { if (run) stop(false); else start(); });
  each(document.querySelectorAll('.pv-try'), function (b) {
    b.addEventListener('click', function () { pick(b.getAttribute('data-k')); $('pvPlayer').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });
  idle();
})();
