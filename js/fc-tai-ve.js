// Flashcards paid download: ask the Worker about an order; once cô Sophia has confirmed payment it returns the file key,
// the browser fetches the encrypted parts from /tai-ve/, decrypts them and saves the original PDF.
window.SophiaTaiVe = (function () {
  function code(so) { return 'SY' + ('000' + so).slice(-Math.max(4, String(so).length)); }
  function status(so, t) {
    return fetch('/api/don-hang?so=' + encodeURIComponent(so) + '&t=' + encodeURIComponent(t), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function link(so, t) { return location.origin + '/flashcards/tai-ve/?don=' + so + '&t=' + t; }
  function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  // poll every 8s until the order is paid; cb(statusObject) on every answer, stop() to cancel
  function watch(so, t, cb) {
    var stop = false, tm;
    (function tick() {
      status(so, t).then(function (d) {
        if (stop) return;
        if (d) cb(d);
        if (!d || !d.file) tm = setTimeout(tick, 8000);
      });
    })();
    return function () { stop = true; clearTimeout(tm); };
  }
  function download(file, onProgress) {
    var got = [];
    return file.parts.reduce(function (p, url, i) {
      return p.then(function () {
        onProgress && onProgress(Math.round(i / file.parts.length * 90));
        return fetch(url).then(function (r) { if (!r.ok) throw new Error('fetch'); return r.arrayBuffer(); }).then(function (b) { got.push(new Uint8Array(b)); });
      });
    }, Promise.resolve()).then(function () {
      var n = got.reduce(function (a, b) { return a + b.length; }, 0), all = new Uint8Array(n), off = 0;
      got.forEach(function (b) { all.set(b, off); off += b.length; });
      return crypto.subtle.importKey('raw', unb64(file.key), 'AES-GCM', false, ['decrypt'])
        .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(file.iv) }, k, all); });
    }).then(function (pdf) {
      onProgress && onProgress(100);
      var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      var a = document.createElement('a'); a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    });
  }
  return { code: code, status: status, watch: watch, download: download, link: link };
})();
