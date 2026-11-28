/* Bài Những tầng nghĩa của mantra: ngân Om, nhấn nhá âm nặng nhẹ, vòng tròn gọi và đáp */
(function () {
  var AC = null;
  function ac() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function bell(f, vol) {
    var c = ac(); if (!c) return; var t = c.currentTime;
    [1, 2.76, 5.4].forEach(function (m, i) {
      var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((vol || 0.18) / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 / (i + 1));
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 4);
    });
  }
  function tone(f, dur, vol, type) {
    var c = ac(); if (!c) return; var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain(); o.type = type || 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + Math.max(0.05, dur - 0.12)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function chips(root, g, cb) {
    var box = root.querySelector('[data-g="' + g + '"]'); if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      cb(b.getAttribute('data-v'));
    });
  }

  /* ---------- 1. Ngân Om ---------- */
  var om = document.getElementById('omP');
  if (om) {
    var L = 12, N = 3, run = false, snd = true, raf = 0, t0 = 0, drone = null;
    var big = document.getElementById('omBig'), now = document.getElementById('omNow'), cnt = document.getElementById('omCount'), cur = document.getElementById('omCur');
    var Z = { a: document.getElementById('omZa'), u: document.getElementById('omZu'), m: document.getElementById('omZm') }, halo = document.getElementById('omHalo');
    var go = document.getElementById('omGo'), sb = document.getElementById('omSnd'), bar = document.getElementById('omBar');
    var IN = 4;
    function phases() { return [['in', IN], ['a', 0.22 * L], ['u', 0.22 * L], ['m', 0.42 * L], ['s', 0.14 * L]]; }
    function layout() {
      var p = phases(), T = p.reduce(function (s, x) { return s + x[1]; }, 0);
      p.forEach(function (x) { var el = bar.querySelector('[data-k="' + x[0] + '"]'); el.style.setProperty('--w', (x[1] / T * 100).toFixed(1)); });
    }
    var TXT = { in: ['…', 'Hít vào bằng mũi, chậm, đầy bụng.'], a: ['A', 'Miệng mở: “Aaa”. Rung ở bụng.'], u: ['U', 'Môi tròn lại: “Uuu”. Rung lên ngực.'], m: ['M', 'Môi khép: “Mmm”. Rung lên đầu, ngân dài nhất.'], s: ['', 'Im lặng. Nghe tiếng ngân tắt dần.'] };
    var VOW = { a: 1000, u: 480, m: 260 };
    function startDrone() {
      var c = ac(); if (!c || drone) return;
      var g = c.createGain(); g.gain.value = 0.0001; var f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 7; f.frequency.value = 600;
      var o1 = c.createOscillator(), o2 = c.createOscillator(); o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 110; o2.frequency.value = 110.6;
      o1.connect(f); o2.connect(f); f.connect(g).connect(c.destination); o1.start(); o2.start();
      drone = { g: g, f: f, o: [o1, o2] };
    }
    function stopDrone() { if (!drone) return; var d = drone, c = ac(); drone = null; d.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.1); setTimeout(function () { d.o.forEach(function (o) { o.stop(); }); }, 600); }
    var last = '';
    function setPhase(k) {
      if (k === last) return; last = k;
      big.textContent = TXT[k][0] || 'ॐ'; now.textContent = TXT[k][1];
      bar.querySelectorAll('i').forEach(function (i) { i.classList.toggle('on', i.getAttribute('data-k') === k); });
      if (drone && snd) {
        var c = ac(), t = c.currentTime;
        if (VOW[k]) { drone.f.frequency.setTargetAtTime(VOW[k], t, 0.15); drone.g.gain.setTargetAtTime(k === 'm' ? 0.09 : 0.06, t, 0.15); }
        else drone.g.gain.setTargetAtTime(0.0001, t, k === 's' ? 0.5 : 0.1);
      }
    }
    function frame() {
      if (!run) return;
      var p = phases(), T = p.reduce(function (s, x) { return s + x[1]; }, 0), el = (performance.now() - t0) / 1000, r = Math.floor(el / T);
      if (r >= N) { stop(true); return; }
      var x = el - r * T, k = 's', acc = 0, kx = 0;
      for (var i = 0; i < p.length; i++) { if (x < acc + p[i][1]) { k = p[i][0]; kx = (x - acc) / p[i][1]; break; } acc += p[i][1]; }
      setPhase(k); cnt.textContent = 'Tiếng Om ' + (r + 1) + ' / ' + N;
      cur.style.left = (x / T * 100) + '%';
      ['a', 'u', 'm'].forEach(function (z) {
        var v = 0; if (k === z) v = Math.min(1, kx * 3); else if (k === 's' && z === 'm') v = Math.max(0, 1 - kx * 1.5);
        Z[z].setAttribute('opacity', v.toFixed(2));
      });
      halo.setAttribute('opacity', k === 's' ? (1 - kx).toFixed(2) : '0');
      raf = requestAnimationFrame(frame);
    }
    function stop(done) {
      run = false; cancelAnimationFrame(raf); stopDrone(); last = '';
      go.textContent = '▶ Bắt đầu'; ['a', 'u', 'm'].forEach(function (z) { Z[z].setAttribute('opacity', 0); }); halo.setAttribute('opacity', 0);
      bar.querySelectorAll('i').forEach(function (i) { i.classList.remove('on'); }); cur.style.left = '0';
      big.textContent = 'Om';
      if (done) { now.textContent = 'Ngồi yên thêm một chút. Thở tự nhiên. Om Shanti.'; if (snd) bell(392, 0.2); }
    }
    go.addEventListener('click', function () {
      if (run) { stop(false); now.textContent = 'Đã dừng. Bấm bắt đầu để ngân lại.'; return; }
      ac(); if (snd) { bell(392, 0.2); startDrone(); }
      run = true; t0 = performance.now() + 1200; go.textContent = '■ Dừng'; now.textContent = 'Chuông ngân. Chuẩn bị hít vào…';
      setTimeout(function () { if (run) frame(); }, 1200);
    });
    sb.addEventListener('click', function () { snd = !snd; sb.textContent = snd ? '🔊 Âm nền: bật' : '🔇 Âm nền: tắt'; if (!snd) stopDrone(); else if (run) startDrone(); });
    chips(om, 'len', function (v) { L = +v; layout(); });
    chips(om, 'n', function (v) { N = +v; cnt.textContent = 'Tiếng Om 0 / ' + N; });
    layout(); cnt.textContent = 'Tiếng Om 0 / ' + N;
  }

  /* ---------- 2. Nhấn nhá âm nặng nhẹ ---------- */
  var M = [
    { n: 'Om Namah Shivaya', s: [['Ôm', 'om', 3], ['na', 'na', 1], ['mah', 'maḥ', 2], ['si', 'śi', 1], ['va', 'vā', 2], ['ya', 'ya', 1]] },
    { n: 'Om Shanti', s: [['Ôm', 'om', 3], ['san', 'śān', 2], ['ti', 'tiḥ', 2], ['san', 'śān', 2], ['ti', 'tiḥ', 2], ['san', 'śān', 2], ['ti', 'tiḥ', 2]] },
    { n: 'Lokah Samastah', s: [['lô', 'lo', 2], ['ka', 'kāḥ', 2], ['sa', 'sa', 1], ['mát', 'mas', 2], ['ta', 'tāḥ', 2], ['su', 'su', 1], ['khi', 'khi', 1], ['nô', 'no', 2], ['bha', 'bha', 1], ['van', 'van', 2], ['tu', 'tu', 1]] },
    { n: 'Om Namo Guru Dev Namo', s: [['Ông', 'ong', 3], ['na', 'na', 1], ['mô', 'mo', 2], ['gu', 'gu', 1], ['ru', 'ru', 1], ['đêv', 'dev', 3], ['na', 'na', 1], ['mô', 'mo', 3]] },
    { n: 'Om Mani Padme Hum', s: [['Ôm', 'om', 3], ['ma', 'ma', 1], ['ni', 'ṇi', 1], ['pát', 'pad', 2], ['mê', 'me', 2], ['hum', 'hūṃ', 3]] },
    { n: 'Asato Ma', s: [['a', 'a', 1], ['sa', 'sa', 1], ['tô', 'to', 2], ['ma', 'mā', 2], ['sát', 'sad', 2], ['ga', 'ga', 1], ['ma', 'ma', 1], ['ya', 'ya', 1]] },
    { n: 'Om Saha Navavatu', s: [['Ôm', 'om', 3], ['sa', 'sa', 1], ['ha', 'ha', 1], ['na', 'nā', 2], ['va', 'va', 1], ['va', 'va', 1], ['tu', 'tu', 1]] }
  ];
  var nh = document.getElementById('nhP');
  if (nh) {
    var pick = document.getElementById('nhPick'), syl = document.getElementById('nhSyl'), nNow = document.getElementById('nhNow'), nGo = document.getElementById('nhGo'), nSb = document.getElementById('nhSnd');
    var mi = 0, beat = 520, nRun = false, nSnd = true, timers = [];
    pick.innerHTML = M.map(function (m, i) { return '<button type="button" data-v="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>' + m.n + '</button>'; }).join('');
    function draw() {
      syl.innerHTML = M[mi].s.map(function (x) { return '<span class="b' + Math.min(x[2], 3) + (x[2] > 1 ? ' hv' : '') + '" style="--n:' + x[2] + '"><b>' + x[0] + '</b><small>' + x[1] + '</small><em>' + (x[2] > 1 ? 'nặng' : 'nhẹ') + '</em></span>'; }).join('');
    }
    function clear() { timers.forEach(clearTimeout); timers = []; syl.querySelectorAll('span').forEach(function (s) { s.classList.remove('on'); }); }
    function nStop(msg) { nRun = false; clear(); nGo.textContent = '▶ Đọc theo'; if (msg) nNow.textContent = msg; }
    function play() {
      clear(); var t = 0, spans = syl.querySelectorAll('span'), s = M[mi].s;
      for (var r = 0; r < 3; r++) {
        (function (r, t) { timers.push(setTimeout(function () { nNow.textContent = 'Lần ' + (r + 1) + ' / 3. Hít vào…'; spans.forEach(function (x) { x.classList.remove('on'); }); }, t)); })(r, t);
        t += 2200;
        s.forEach(function (x, i) {
          (function (i, t, d) {
            timers.push(setTimeout(function () {
              spans.forEach(function (y, j) { y.classList.toggle('on', j === i); });
              if (i === 0) nNow.textContent = 'Lần ' + (r + 1) + ' / 3. Đọc theo ô đang sáng.';
              if (nSnd) tone(d > 1 ? 220 : 294, Math.min(0.9, d * beat / 1000 * 0.9), d > 1 ? 0.16 : 0.11);
            }, t));
          })(i, t, x[2]);
          t += x[2] * beat;
        });
        t += beat;
      }
      timers.push(setTimeout(function () { nStop('Xong ba lần. Ngồi yên một hơi thở.'); if (nSnd) bell(392, 0.15); }, t));
    }
    nGo.addEventListener('click', function () { if (nRun) { nStop('Đã dừng.'); return; } ac(); nRun = true; nGo.textContent = '■ Dừng'; play(); });
    pick.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; pick.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); mi = +b.getAttribute('data-v'); if (nRun) nStop(''); draw(); nNow.textContent = 'Bấm “Đọc theo” để bắt đầu.'; });
    chips(nh, 't', function (v) { beat = +v; });
    nSb.addEventListener('click', function () { nSnd = !nSnd; nSb.textContent = nSnd ? '🔊 Tiếng gõ nhịp: bật' : '🔇 Tiếng gõ nhịp: tắt'; });
    draw();
  }

  /* ---------- 3. Vòng tròn gọi và đáp ---------- */
  var ki = document.getElementById('kiP');
  if (ki) {
    var K = [{ t: 'Om Namah Shivaya', m: 0 }, { t: 'Lokah Samastah Sukhino Bhavantu', m: 2 }, { t: 'Om Shanti Shanti Shanti', m: 1 }];
    var MUL = [1.25, 1.1, 0.95, 0.8, 0.68, 0.6, 0.6, 0.66, 0.8, 0.95, 1.15, 1.35];
    var STAGE = ['Rất chậm. Nghe rõ từng âm.', 'Chậm. Hòa giọng với người bên cạnh.', 'Nhịp nhanh dần, cơ thể có thể đung đưa nhẹ.', 'Đỉnh của vòng hát. Hát nhỏ hơn người bên cạnh một chút.', 'Chậm lại dần.', 'Rất chậm, gần như thì thầm.'];
    var who = document.getElementById('kiWho'), line = document.getElementById('kiLine'), st = document.getElementById('kiStage'), kGo = document.getElementById('kiGo'), kSb = document.getElementById('kiSnd');
    var lead = document.getElementById('kiLead'), ring = document.getElementById('kiRing'), dot = document.getElementById('kiDot'), curve = ki.querySelector('.ym-curve path');
    var people = ki.querySelectorAll('.ki-p'), ksel = 0, kRun = false, kSnd = true, kt = [];
    var MEL = [0, 0, 3, 5, 3, 0, 7, 5, 3, 0, 0];
    function hz(semi) { return 293.66 * Math.pow(2, semi / 12); }
    function sing(mIdx, dur, chorus) {
      if (!kSnd) return; var s = M[mIdx].s, tot = s.reduce(function (a, x) { return a + x[2]; }, 0), t = 0;
      s.forEach(function (x, i) {
        var d = x[2] / tot * dur, f = hz(MEL[i % MEL.length] - (i === s.length - 1 ? 0 : 0));
        kt.push(setTimeout(function () { tone(f, d * 0.95, chorus ? 0.07 : 0.12, 'sine'); if (chorus) { tone(f / 2, d * 0.95, 0.06, 'sine'); tone(f * 1.5, d * 0.95, 0.04, 'sine'); } }, t * 1000));
        t += d;
      });
    }
    function setWho(mode) {
      lead.classList.toggle('on', mode === 'lead'); people.forEach(function (p) { p.classList.toggle('on', mode === 'all'); });
      ring.setAttribute('opacity', mode === 'all' ? '.45' : '0');
      who.textContent = mode === 'lead' ? '🎙️ Cô gọi' : mode === 'all' ? '🙌 Cả vòng đáp' : mode === 'quiet' ? '🤫 Im lặng' : 'Sẵn sàng';
    }
    function moveDot(f) { var L = curve.getTotalLength(), p = curve.getPointAtLength(L * f); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); }
    function kStop(msg) { kRun = false; kt.forEach(clearTimeout); kt = []; setWho(''); kGo.textContent = '▶ Bắt đầu vòng hát'; moveDot(0); if (msg) st.textContent = msg; }
    function kPlay() {
      var base = K[ksel].m === 2 ? 5.2 : 4.2, t = 1.5, n = MUL.length, total = 0;
      MUL.forEach(function (m) { total += 2 * base * m + 0.4; }); total += 1.5;
      if (kSnd) bell(392, 0.2);
      MUL.forEach(function (m, i) {
        var d = base * m;
        (function (i, t, d) {
          kt.push(setTimeout(function () { setWho('lead'); st.textContent = STAGE[Math.min(5, Math.floor(i / 2))]; moveDot((t) / (total + 20)); sing(K[ksel].m, d, false); }, t * 1000));
          kt.push(setTimeout(function () { setWho('all'); moveDot((t + d) / (total + 20)); sing(K[ksel].m, d, true); }, (t + d + 0.2) * 1000));
        })(i, t, d);
        t += 2 * d + 0.4;
      });
      kt.push(setTimeout(function () { setWho('quiet'); st.textContent = 'Ngồi im. Hai tay đặt lên tim. Cảm nhận rung động còn lại trong người.'; moveDot(0.93); }, t * 1000));
      kt.push(setTimeout(function () { if (kSnd) bell(392, 0.2); moveDot(1); kStop('Om Shanti. Cúi chào người bên trái, bên phải, người đối diện. Namaste.'); }, (t + 20) * 1000));
    }
    kGo.addEventListener('click', function () { if (kRun) { kStop('Đã dừng.'); return; } ac(); kRun = true; kGo.textContent = '■ Dừng'; st.textContent = 'Chuông ngân. Thở cùng nhau…'; kPlay(); });
    chips(ki, 'k', function (v) { ksel = +v; line.textContent = K[ksel].t; if (kRun) kStop('Đã đổi câu. Bấm bắt đầu.'); });
    kSb.addEventListener('click', function () { kSnd = !kSnd; kSb.textContent = kSnd ? '🔊 Âm thanh: bật' : '🔇 Âm thanh: tắt'; });
  }
})();
