// Flashcards: cards are stored XOR-encoded (.dat) and drawn on <canvas> so there is no image file to save.
(function () {
  var KEY = 'SophiaYoga-flashcards', cache = {};
  function load(url) {
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var b = new Uint8Array(buf);
      for (var i = 0; i < b.length; i++) b[i] ^= KEY.charCodeAt(i % KEY.length);
      return createImageBitmap(new Blob([b], { type: 'image/jpeg' }));
    });
    return cache[url];
  }
  function draw(cv, url) {
    cv.dataset.src = url;
    return load(url).then(function (bm) {
      if (cv.dataset.src !== url) return;
      cv.width = bm.width; cv.height = bm.height;
      var g = cv.getContext('2d');
      g.drawImage(bm, 0, 0);
      g.save(); g.globalAlpha = .12; g.fillStyle = '#6b4423';
      g.font = 'bold ' + Math.round(bm.width / 16) + 'px sans-serif';
      g.translate(bm.width / 2, bm.height / 2); g.rotate(-Math.PI / 5);
      for (var y = -bm.height; y < bm.height; y += bm.height / 4) g.fillText('sophiayogakids.com', -bm.width / 2, y);
      g.restore();
    });
  }
  var cards = [].slice.call(document.querySelectorAll('.fc-card'));
  function paint(c) {
    if (c.dataset.drawn) return; c.dataset.drawn = 1;
    draw(c.querySelector('.fc-f'), c.dataset.front);
    draw(c.querySelector('.fc-b'), c.dataset.back);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { paint(e.target); io.unobserve(e.target); } }); }, { rootMargin: '400px' });
    cards.forEach(function (c) { io.observe(c); });
  } else cards.forEach(paint);

  var lb = document.getElementById('fc-lb'), cur = 0;
  if (lb) {
    var fi = lb.querySelector('.fc-lb-front'), bi = lb.querySelector('.fc-lb-back'), cap = lb.querySelector('.fc-lb-cap');
    var show = function (i) {
      cur = (i + cards.length) % cards.length; var c = cards[cur];
      draw(fi, c.dataset.front); draw(bi, c.dataset.back);
      fi.setAttribute('aria-label', c.dataset.name + ' – mặt trước'); bi.setAttribute('aria-label', c.dataset.name + ' – mặt sau');
      cap.textContent = (cur + 1) + ' / ' + cards.length + ' · ' + c.dataset.name;
      fi.classList.remove('zoom'); bi.classList.remove('zoom');
      lb.querySelector('.fc-lb-sides').scrollTop = 0;
    };
    var close = function () { lb.hidden = true; document.body.style.overflow = ''; };
    cards.forEach(function (c, i) { c.addEventListener('click', function () { show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; }); });
    lb.querySelector('.fc-lb-close').onclick = close;
    lb.querySelector('.fc-lb-prev').onclick = function () { show(cur - 1); };
    lb.querySelector('.fc-lb-next').onclick = function () { show(cur + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    [fi, bi].forEach(function (m) { m.addEventListener('click', function () { m.classList.toggle('zoom'); }); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }
  [].forEach.call(document.querySelectorAll('.fc-side-btn'), function (b) {
    b.onclick = function () {
      [].forEach.call(document.querySelectorAll('.fc-side-btn'), function (x) { x.classList.toggle('on', x === b); });
      document.querySelector('.fc-grid').dataset.side = b.dataset.side;
    };
  });
  // block right-click, drag and save/print/view-source shortcuts on flashcard pages
  document.addEventListener('contextmenu', function (e) { if (e.target.closest('.fc-page canvas, .fc-page img, .fc-lb')) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.closest('.fc-page')) e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p' || k === 'u')) e.preventDefault();
  });
})();
