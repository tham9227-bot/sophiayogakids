/* Bài Thủ ấn (mudra): bàn tay năm đại, chọn ấn theo trạng thái, giữ ấn cùng nhịp thở */
(function () {
  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function bell(soft) { if (window.cbBell) window.cbBell(soft); }

  // 1. Bàn tay năm đại
  var DAI = {
    cai: ['Ngón cái · Lửa (Agni)', 'Lửa làm ấm, chuyển hóa, soi sáng. Ngón cái đứng riêng, chạm được mọi ngón khác, nên trong hầu hết các ấn, ngón cái là ngón “gặp gỡ”. Truyền thống còn xem ngón cái là ý thức lớn, cái chung của muôn loài.'],
    tro: ['Ngón trỏ · Khí, gió (Vayu)', 'Khí là chuyển động: hơi thở, nhịp tim, suy nghĩ. Ngón trỏ là ngón hay chỉ trỏ, gắn với cái tôi nhỏ. Chạm ngón trỏ vào ngón cái là Gyan mudra, cái tôi nhỏ quay về với cái lớn.'],
    giua: ['Ngón giữa · Không gian (Akasha)', 'Không gian là khoảng trống để mọi thứ có chỗ xảy ra. Ngón giữa dài nhất, đứng ở giữa. Chạm ngón giữa vào ngón cái là Shuni mudra, ấn của kiên nhẫn: cho mình thêm khoảng trống trước khi phản ứng.'],
    apu: ['Ngón áp út · Đất (Prithvi)', 'Đất là sự vững, nặng, nuôi dưỡng. Chạm áp út vào ngón cái là Prithvi mudra, ấn tiếp đất. Gập áp út dưới ngón cái là Surya mudra, lửa đè lên đất cho bớt nặng nề.'],
    ut: ['Ngón út · Nước (Jala)', 'Nước mềm, chảy, kết nối. Chạm ngón út vào ngón cái là Varuna mudra, ấn nước. Út và áp út cùng chạm ngón cái là Prana mudra, ấn sinh lực.']
  };
  var out = $('muNguDaiOut');
  each(document.querySelectorAll('.mu-ngudai .mu-f'), function (g) {
    function show() {
      each(document.querySelectorAll('.mu-ngudai .mu-f'), function (x) { x.classList.toggle('on', x === g); });
      var d = DAI[g.getAttribute('data-k')]; out.innerHTML = '<b>' + d[0] + '</b><p>' + d[1] + '</p>';
    }
    g.addEventListener('click', show);
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });

  // 2. Chọn ấn theo trạng thái
  var ST = {
    roi: ['Chin mudra, úp tay', 'gyan', 'Úp hai bàn tay xuống gối, trỏ chạm cái. Hít vào 4 nhịp, thở ra 6 nhịp, để ý hơi thở ra đi xuống bụng. Năm phút. Úp tay là gom vào, tiếp đất.'],
    met: ['Prana mudra', 'prana', 'Ngồi thẳng, áp út và út chạm ngón cái, ngửa tay. Hít 4, thở ra 4, đều. Ba đến năm phút, rồi đứng dậy đi lại, uống một cốc nước. Mệt kéo dài nhiều tuần thì nên đi khám.'],
    tap: ['Hakini mudra', 'hakini', 'Năm cặp đầu ngón tay chạm nhau trước ngực. Mở mắt nhìn vào đầu ngón một phút, rồi nhắm lại hai phút, thở đều. Xong thì bắt tay vào việc ngay.'],
    gian: ['Shuni mudra', 'shuni', 'Ngón giữa chạm ngón cái. Mười hơi thở, thở ra dài hơn hít vào. Chưa nói, chưa nhắn tin, chưa trả lời cho đến hết mười hơi.'],
    bung: ['Apana mudra', 'apana', 'Ngón giữa và áp út chạm ngón cái. Thở bụng chậm, thở ra để ý đi xuống bụng dưới. Ba phút, rồi đi bộ nhẹ mười phút. Đau bụng kéo dài thì đi khám.'],
    buon: ['Anjali mudra', 'anjali', 'Chắp hai tay trước ngực, ngón cái chạm nhẹ xương ức. Cúi đầu một chút. Thở chậm. Nghĩ về một điều nhỏ mình biết ơn hôm nay. Hoặc đặt một tay lên ngực, một tay lên bụng. Buồn kéo dài trên hai tuần, hãy tìm người để nói chuyện và gặp bác sĩ.'],
    ngu: ['Dhyana mudra', 'dhyana', 'Ngồi trên giường, hai tay chồng nhau trong lòng, ngón cái chạm nhẹ. Hít 4, thở ra 6, năm phút. Rồi nằm xuống, hai tay đặt trên bụng, thở tiếp.'],
    chong: ['Prithvi mudra', 'prithvi', 'Áp út chạm ngón cái, úp tay xuống gối. Hai bàn chân đặt chắc xuống sàn, tốt nhất là chân trần. Thở ra, để ý xuống lòng bàn chân. Năm phút.']
  };
  var so = $('muStateOut');
  each(document.querySelectorAll('#muStateChips button'), function (b) {
    b.addEventListener('click', function () {
      each(document.querySelectorAll('#muStateChips button'), function (x) { x.classList.toggle('on', x === b); });
      var d = ST[b.getAttribute('data-s')];
      so.innerHTML = '<b>Gợi ý: ' + d[0] + '</b><br>' + d[2] + ' <button type="button" class="mu-go" data-k="' + d[1] + '">⏱ Giữ ấn này cùng nhịp thở</button>';
      so.querySelector('.mu-go').addEventListener('click', function () { pick(d[1]); $('muPlayer').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });
  });

  // 3. Giữ ấn cùng nhịp thở
  var big = $('muBig'), ring = document.querySelector('.mu-ring'), word = $('muWord'), left = $('muLeft'), name = $('muName'), go = $('muGo');
  var IN = 4, OUT = 6, MIN = 3, timer = null, endAt = 0, phase = 0, cnt = 0;
  function pick(k) {
    var t = document.querySelector('#muTpl [data-k="' + k + '"]'); if (!t) return;
    big.innerHTML = t.innerHTML; name.textContent = t.getAttribute('data-n');
    each(document.querySelectorAll('#muPick button'), function (x) { x.classList.toggle('on', x.getAttribute('data-k') === k); });
  }
  function chips(id, fn) {
    each(document.querySelectorAll('#' + id + ' button'), function (b) {
      b.addEventListener('click', function () { each(document.querySelectorAll('#' + id + ' button'), function (x) { x.classList.toggle('on', x === b); }); fn(b); });
    });
  }
  chips('muPick', function (b) { pick(b.getAttribute('data-k')); });
  chips('muTempo', function (b) { IN = +b.getAttribute('data-i'); OUT = +b.getAttribute('data-o'); });
  chips('muMin', function (b) { MIN = +b.getAttribute('data-m'); if (!timer) left.textContent = MIN + ' phút'; });
  left.textContent = MIN + ' phút';
  function setPhase(p) {
    phase = p; cnt = p === 0 ? IN : OUT;
    ring.style.transition = 'transform ' + cnt + 's ease-in-out, opacity ' + cnt + 's';
    ring.className = 'mu-ring ' + (p === 0 ? 'in' : 'out');
    word.innerHTML = (p === 0 ? 'Hít vào' : 'Thở ra') + ' <em>' + cnt + '</em>';
  }
  function tick() {
    var rest = Math.round((endAt - Date.now()) / 1000);
    if (rest <= 0) { stop(true); return; }
    left.textContent = 'Còn ' + Math.floor(rest / 60) + ':' + ('0' + rest % 60).slice(-2);
    cnt--; if (cnt <= 0) setPhase(phase === 0 ? 1 : 0); else word.innerHTML = (phase === 0 ? 'Hít vào' : 'Thở ra') + ' <em>' + cnt + '</em>';
  }
  function start() { bell(true); endAt = Date.now() + MIN * 60000; setPhase(0); timer = setInterval(tick, 1000); go.textContent = '⏹ Dừng'; go.classList.add('on'); }
  function stop(done) {
    clearInterval(timer); timer = null; ring.className = 'mu-ring'; go.textContent = '▶ Bắt đầu'; go.classList.remove('on');
    if (done) { bell(); word.textContent = 'Xong rồi 🌿'; left.textContent = 'Thả tay lên đùi, ngồi yên thêm vài hơi.'; }
    else { word.textContent = 'Sẵn sàng'; left.textContent = MIN + ' phút'; }
  }
  go.addEventListener('click', function () { if (timer) stop(false); else start(); });

  // 4. Nút nhảy tới ấn
  each(document.querySelectorAll('.mu-card .mu-try'), function (b) {
    b.addEventListener('click', function () { pick(b.getAttribute('data-k')); $('muPlayer').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });
})();
