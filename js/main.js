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

// Form đăng ký: soạn sẵn tin nhắn, chép vào bộ nhớ, mở Zalo của Sophia để khách dán và gửi.
// FORM_ENDPOINT: khi có địa chỉ nhận (email / Google Sheet) thì điền vào đây, form sẽ gửi thêm về đó.
const FORM_ENDPOINT = '';
const form = document.getElementById('signup-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const text = 'Chào Sophia, mình đăng ký tư vấn:\n' +
      'Họ tên: ' + d.get('ten') + '\n' +
      'SĐT: ' + d.get('sdt') + '\n' +
      'Quan tâm: ' + d.get('khoa') +
      (d.get('loinhan') ? '\nLời nhắn: ' + d.get('loinhan') : '');
    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } }).catch(() => {});
    }
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    form.querySelector('.form-copy').value = text;
    form.querySelector('.form-msg').hidden = false;
    form.querySelector('.form-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
