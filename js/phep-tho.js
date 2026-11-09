/* Sophia Yoga: vòng tròn tập thở dùng chung cho các bài phép thở.
   PhepTho.svg(kind) tạo hình; PhepTho.draw(root, cfg, ph, frac, count) vẽ một khoảnh khắc;
   PhepTho.player(wrap, cfg) gắn nút Bắt đầu / Tạm dừng / Chậm hơn / Âm thanh. */
(function (g) {
  var NS = 'http://www.w3.org/2000/svg';
  function face(kind) {
    var s = '<g class="pt-face" transform="translate(300,82) scale(1.3)">' +
      '<ellipse cx="0" cy="0" rx="46" ry="56" class="pt-head"/>' +
      '<path d="M-24 -12 q8 6 16 0 M8 -12 q8 6 16 0" class="pt-line"/>' +
      '<path d="M0 -6 q-5 18 -10 26 q10 5 20 0 q-5 -8 -10 -26" class="pt-line pt-nose"/>' +
      '<ellipse cx="-6" cy="19" rx="3.2" ry="2.2" class="pt-nos pt-nos-R"/>' +
      '<ellipse cx="6" cy="19" rx="3.2" ry="2.2" class="pt-nos pt-nos-L"/>';
    if (kind === 'tongue') {
      s += '<path d="M-10 33 q10 6 20 0" class="pt-line"/>' +
        '<rect x="-7" y="32" width="14" height="22" rx="7" class="pt-tongue"/>' +
        '<ellipse cx="0" cy="54" rx="7" ry="3" class="pt-tongue-end"/>';
    } else if (kind === 'hum') {
      s += '<path d="M-11 34 h22" class="pt-line"/>' +
        '<rect x="-60" y="-12" width="12" height="30" rx="6" class="pt-finger"/>' +
        '<rect x="48" y="-12" width="12" height="30" rx="6" class="pt-finger"/>' +
        '<g class="pt-waves"><path d="M-74 -14 q-12 18 0 36 M-86 -22 q-18 26 0 52 M74 -14 q12 18 0 36 M86 -22 q18 26 0 52"/></g>';
    } else {
      s += '<path d="M-10 34 q10 6 20 0" class="pt-line"/>';
    }
    if (kind === 'nostril') {
      s += '<rect x="-34" y="4" width="11" height="28" rx="5.5" class="pt-thumb pt-thumb-R"/>' +
        '<rect x="23" y="4" width="11" height="28" rx="5.5" class="pt-thumb pt-thumb-L"/>' +
        '<text x="-62" y="62" class="pt-side">phải</text><text x="62" y="62" class="pt-side">trái</text>';
    }
    s += '<g class="pt-arrow"><path d="M0 0 v-18 m-6 6 l6 -6 l6 6"/></g></g>';
    return s;
  }
  function svg(kind) {
    return '<svg class="pt-svg" viewBox="0 0 600 600" xmlns="' + NS + '" role="img" aria-label="Vòng tròn tập thở">' +
      '<circle cx="300" cy="375" r="200" class="pt-ring"/>' +
      '<circle cx="300" cy="375" r="120" class="pt-ball"/>' +
      '<circle cx="300" cy="375" r="200" class="pt-prog" transform="rotate(-90 300 375)"/>' +
      face(kind) +
      '<text x="300" y="350" class="pt-name"></text>' +
      '<text x="300" y="414" class="pt-count"></text>' +
      '<text x="300" y="450" class="pt-sub"></text>' +
      '</svg>';
  }
  function ease(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function radius(cfg, ph, frac) {
    var r0 = 88, r1 = 176, P = cfg.phases;
    if (ph < 0) return r0;
    var k = P[ph].k;
    if (k === 'in') return r0 + (r1 - r0) * ease(frac);
    if (k === 'out') return r1 - (r1 - r0) * ease(frac);
    if (k === 'hold') { var prev = P[(ph + P.length - 1) % P.length].k; return prev === 'in' ? r1 : r0; }
    return r0 + 10 * Math.sin(frac * Math.PI);
  }
  function draw(root, cfg, ph, frac, count) {
    var q = function (c) { return root.querySelector(c); };
    var P = cfg.phases, p = ph >= 0 ? P[ph] : null;
    q('.pt-ball').setAttribute('r', radius(cfg, ph, frac).toFixed(1));
    var C = 2 * Math.PI * 200, prog = q('.pt-prog');
    prog.style.strokeDasharray = C; prog.style.strokeDashoffset = p ? C * (1 - frac) : C;
    q('.pt-name').textContent = p ? p.name : (cfg.ready || 'Sẵn sàng');
    q('.pt-count').textContent = p && p.k !== 'rest' && p.t >= 2 ? count : (p && p.t < 2 ? '•' : '');
    q('.pt-sub').textContent = p ? (p.sub || '') : (cfg.readySub || 'Ngồi thẳng lưng, vai thả lỏng');
    var svgEl = q('.pt-svg');
    ['in', 'out', 'hold', 'rest'].forEach(function (k) { svgEl.classList.toggle('k-' + k, !!p && p.k === k); });
    var ch = p ? (p.ch || 'both') : 'none';
    ['R', 'L'].forEach(function (s) {
      var open = ch === 'both' || ch === s;
      var n = q('.pt-nos-' + s); if (n) n.classList.toggle('on', !!p && open && p.k !== 'hold' && p.k !== 'rest' && ch !== 'tongue');
      var th = q('.pt-thumb-' + s); if (th) th.classList.toggle('on', !!p && (ch === 'R' || ch === 'L' || p.block === 'both') && (!open || p.block === 'both'));
    });
    var ar = q('.pt-arrow');
    if (ar) {
      var show = p && (p.k === 'in' || p.k === 'out');
      ar.style.display = show ? '' : 'none';
      if (show) {
        var x = ch === 'R' ? -6 : ch === 'L' ? 6 : 0, y = ch === 'tongue' ? 70 : 34;
        if (cfg.kind === 'tongue' && p.k === 'out') y = 34;
        var rot = p.k === 'in' ? 0 : 180, off = (p.k === 'in' ? 1 - frac : frac) * 14;
        ar.setAttribute('transform', 'translate(' + x + ',' + (y + (p.k === 'in' ? off : -off + 18)) + ') rotate(' + rot + ')');
      }
    }
    var w = q('.pt-waves'); if (w) w.classList.toggle('on', !!p && !!p.hum);
    var tg = q('.pt-tongue'); if (tg) { var tout = !!p && p.ch === 'tongue'; tg.style.display = tout ? '' : 'none'; q('.pt-tongue-end').style.display = tout ? '' : 'none'; }
  }
  // Âm thanh: tiếng ngân "mmm" khi thở ra (Bhramari), hoặc tiếng chuông nhỏ khi đổi pha.
  function Sound() { this.ctx = null; this.hum = null; }
  Sound.prototype.ensure = function () { this.ctx = this.ctx || new (g.AudioContext || g.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; };
  Sound.prototype.bell = function (k) {
    try {
      var a = this.ensure(), o = a.createOscillator(), gn = a.createGain();
      o.frequency.value = { 'in': 528, hold: 440, out: 396, rest: 330 }[k] || 440;
      gn.gain.setValueAtTime(0.0001, a.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.16, a.currentTime + 0.03);
      gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
      o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + 0.55);
    } catch (e) {}
  };
  Sound.prototype.humOn = function (secs) {
    try {
      var a = this.ensure(), gn = a.createGain(), f = a.createBiquadFilter(), t = a.currentTime;
      f.type = 'lowpass'; f.frequency.value = 700; gn.connect(a.destination); f.connect(gn);
      [140, 280, 420].forEach(function (fr, i) { var o = a.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = fr; var og = a.createGain(); og.gain.value = [1, .35, .15][i]; o.connect(og); og.connect(f); o.start(t); o.stop(t + secs); });
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
      gn.gain.setValueAtTime(0.12, t + Math.max(0.5, secs - 0.6));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    } catch (e) {}
  };
  function player(wrap, cfg) {
    wrap.querySelector('.pt-stage').innerHTML = svg(cfg.kind);
    var go = wrap.querySelector('.pt-go'), info = wrap.querySelector('.pt-info');
    var slowBtn = wrap.querySelector('.pt-slow'), sndBtn = wrap.querySelector('.pt-snd');
    var slow = 1, sound = false, running = false, start = 0, paused = 0, raf = 0, last = -1, snd = new Sound();
    function durs() { return cfg.phases.map(function (p) { return p.t * (p.k === 'rest' || p.t < 2 ? 1 : slow); }); }
    function fmt(s) { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function frame(now) {
      var t = (now - start) / 1000, d = durs(), cyc = d.reduce(function (a, b) { return a + b; }, 0);
      var round = Math.floor(t / cyc), r = t - round * cyc, ph = 0;
      while (ph < d.length - 1 && r >= d[ph]) { r -= d[ph]; ph++; }
      var key = round * 100 + ph;
      if (key !== last) {
        last = key;
        if (sound) { var p = cfg.phases[ph]; if (p.hum) snd.humOn(d[ph]); else if (p.t >= 2 || ph === 0) snd.bell(p.k); }
      }
      draw(wrap, cfg, ph, Math.min(r / d[ph], 1), Math.floor(r / (d[ph] / Math.round(cfg.phases[ph].t))) + 1);
      info.textContent = (cfg.roundWord || 'Vòng') + ' ' + (round + 1) + ' · ' + fmt(t);
      raf = requestAnimationFrame(frame);
    }
    function reset() { cancelAnimationFrame(raf); running = false; paused = 0; last = -1; go.textContent = '▶ Bắt đầu'; draw(wrap, cfg, -1, 0, 0); info.textContent = cfg.hint || 'Bấm Bắt đầu và thở theo vòng tròn.'; }
    go.addEventListener('click', function () {
      if (sound) snd.ensure();
      if (running) { running = false; cancelAnimationFrame(raf); paused = performance.now() - start; go.textContent = '▶ Tập tiếp'; return; }
      running = true; go.textContent = '⏸ Tạm dừng'; start = performance.now() - paused; raf = requestAnimationFrame(frame);
    });
    if (slowBtn) slowBtn.addEventListener('click', function () { slow = slow === 1 ? 1.25 : 1; this.classList.toggle('on', slow !== 1); reset(); });
    if (sndBtn) sndBtn.addEventListener('click', function () { sound = !sound; if (sound) snd.ensure(); this.classList.toggle('on', sound); this.textContent = sound ? '🔔 Âm thanh: bật' : '🔕 Âm thanh: tắt'; });
    reset();
  }
  g.PhepTho = { svg: svg, draw: draw, player: player };
})(window);
