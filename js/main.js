// Menu trên điện thoại
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// Lọc bài viết theo chủ đề
document.querySelectorAll('.filter[data-cat]').forEach(btn => {
  btn.addEventListener('click', () => {
    // Bấm lại nút đang chọn thì bỏ lọc, hiện lại tất cả bài
    const wasActive = btn.classList.contains('active');
    document.querySelectorAll('.filter[data-cat]').forEach(b => b.classList.remove('active'));
    if (!wasActive) btn.classList.add('active');
    const cat = wasActive ? 'all' : btn.dataset.cat;
    document.querySelectorAll('.post').forEach(post => {
      // Bài có data-only-filter chỉ hiện khi bấm đúng mục của nó
      const hide = cat === 'all' ? post.hasAttribute('data-only-filter') : post.dataset.cat !== cat;
      post.classList.toggle('hide', hide);
    });
  });
});

// Form đăng ký: gửi thẳng về Gmail của Sophia (qua FormSubmit).
// Nếu gửi lỗi (mất mạng, chưa kích hoạt...) thì soạn sẵn tin nhắn để khách gửi qua Zalo, không mất thông tin.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/tham9227@gmail.com';
const form = document.getElementById('signup-form');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = new FormData(form);
    const btn = form.querySelector('button[type=submit]');
    const ok = form.querySelector('.form-ok');
    const zalo = form.querySelector('.form-msg');
    ok.hidden = true; zalo.hidden = true;
    btn.disabled = true; btn.textContent = 'Đang gửi...';
    const text = 'Chào Sophia, mình đăng ký tư vấn:\n' +
      'Họ tên: ' + d.get('ten') + '\n' +
      'SĐT: ' + d.get('sdt') + '\n' +
      'Quan tâm: ' + d.get('khoa') +
      (d.get('loinhan') ? '\nLời nhắn: ' + d.get('loinhan') : '');
    d.append('_subject', 'Đăng ký mới: ' + d.get('ten') + ' - ' + d.get('khoa'));
    d.append('_template', 'table');
    d.append('_captcha', 'false');
    let sent = false;
    try {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } });
      const j = await r.json();
      sent = r.ok && String(j.success) === 'true';
    } catch (err) { sent = false; }
    btn.disabled = false; btn.textContent = 'Gửi đăng ký';
    if (sent) {
      form.reset();
      ok.hidden = false;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      form.querySelector('.form-copy').value = text;
      zalo.hidden = false;
      zalo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// Nút lên đầu trang
const toTop = document.querySelector('.to-top');
if (toTop) {
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 600));
}

// Hàng tài liệu: nút kéo sang trái / phải
document.querySelectorAll('.dl-slider').forEach(slider => {
  const track = slider.querySelector('.dl-grid');
  const prev = slider.querySelector('.dl-prev');
  const next = slider.querySelector('.dl-next');
  const step = () => track.querySelector('.dl-card').offsetWidth + 24;
  const update = () => {
    prev.disabled = track.scrollLeft < 5;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 5;
  };
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
});

// Năm hiện tại ở chân trang
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
