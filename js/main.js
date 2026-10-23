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

// Form đăng ký (tạm thời chỉ hiện lời cảm ơn; sau này nối với Google Form / Formspree)
const form = document.getElementById('signup-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.querySelector('.form-msg').hidden = false;
    form.reset();
  });
}

// Nút lên đầu trang
const toTop = document.querySelector('.to-top');
if (toTop) {
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 600));
}

// Năm hiện tại ở chân trang
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
