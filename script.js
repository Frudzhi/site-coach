// nav scroll state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, {passive:true});

// mobile menu
const burger = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true':'false');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  burger.setAttribute('aria-expanded','false');
}));

// ===== TELEGRAM BOOKING BOT =====
// Заявка идёт не напрямую в Telegram (браузер блокирует такие запросы через CORS),
// а через прокси-сервер (Cloudflare Worker). Вставь сюда URL своего воркера
// после того, как задеплоишь telegram-proxy-worker.js.
const PROXY_URL = 'https://tg-coach.bagavievalexe.workers.dev';

// form handling
const form = document.getElementById('bookingForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name')||'').toString().trim();
  const phone = (data.get('phone')||'').toString().trim();
  const method = (data.get('method')||'').toString().trim();
  const goal = (data.get('goal')||'').toString().trim();

  if(!name || !phone || !method){
    status.textContent = 'Заполни имя, телефон и способ связи.';
    status.className = 'form-status err';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  status.textContent = 'Отправляю заявку…';
  status.className = 'form-status';

  const text = [
    '📩 Новая заявка с сайта',
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Способ связи: ${method}`,
    goal ? `Цель: ${goal}` : null
  ].filter(Boolean).join('\n');

  try {
    if (PROXY_URL.includes('ВСТАВЬ')) {
      throw new Error('not-configured');
    }
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || 'proxy-error');

    status.textContent = 'Заявка отправлена. Свяжусь с тобой в ближайшее время.';
    status.className = 'form-status ok';
    form.reset();
  } catch (err) {
    status.textContent = 'Не получилось отправить заявку. Позвони или напиши напрямую.';
    status.className = 'form-status err';
  } finally {
    submitBtn.disabled = false;
  }
});

// only close mobile menu on escape
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }
});

// ===== TESTIMONIALS (carousel + admin-fed data) =====
const TESTIMONIALS_KEY = 'nikita_testimonials';
const PER_VIEW = 3;

const DEFAULT_TESTIMONIALS = [
  { quote: 'Текст отзыва клиента — добавится после первых завершённых циклов тренировок', name: 'Имя клиента', goal: 'Цель, например: похудение' },
  { quote: 'Текст отзыва клиента', name: 'Имя клиента', goal: 'Цель' },
  { quote: 'Текст отзыва клиента', name: 'Имя клиента', goal: 'Цель' }
];

function loadTestimonials() {
  try {
    const raw = localStorage.getItem(TESTIMONIALS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (e) {}
  return DEFAULT_TESTIMONIALS;
}

const ICON_MALE = `<svg viewBox="0 0 24 24" fill="none" stroke="#B7F34A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`;
const ICON_FEMALE = `<svg viewBox="0 0 24 24" fill="none" stroke="#B7F34A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/><path d="M7.2 6.5c-1 2.6-.6 5.6-1.8 8.5M16.8 6.5c1 2.6.6 5.6 1.8 8.5"/></svg>`;
const ICON_NEUTRAL = `<svg viewBox="0 0 24 24" fill="none" stroke="#777D78" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`;

function testimonialCardHTML(t) {
  const quote = (t.quote || '').toString();
  const name = (t.name || '').toString();
  const goal = (t.goal || '').toString();
  const icon = t.gender === 'male' ? ICON_MALE : t.gender === 'female' ? ICON_FEMALE : ICON_NEUTRAL;
  return `<div class="testimonial-card">
    <div class="testimonial-avatar">${icon}</div>
    <p class="testimonial-quote">«${quote}»</p>
    <div class="testimonial-name">${name}</div>
    <div class="testimonial-goal">${goal}</div>
  </div>`;
}

function initTestimonials() {
  const grid = document.getElementById('testimonialGrid');
  const controls = document.getElementById('testimonialControls');
  if (!grid) return;

  const all = loadTestimonials();
  let start = 0;

  function render() {
    const visible = all.length <= PER_VIEW ? all : all.slice(start, start + PER_VIEW).concat(
      start + PER_VIEW > all.length ? all.slice(0, (start + PER_VIEW) - all.length) : []
    );
    grid.innerHTML = visible.map(testimonialCardHTML).join('');
  }

  function renderAnimated() {
    grid.classList.add('fading');
    setTimeout(() => {
      render();
      grid.classList.remove('fading');
    }, 220);
  }

  render();

  if (all.length > PER_VIEW) {
    controls.hidden = false;
    const prevBtn = document.getElementById('testPrev');
    const nextBtn = document.getElementById('testNext');
    prevBtn.addEventListener('click', () => {
      start = (start - PER_VIEW + all.length) % all.length;
      renderAnimated();
    });
    nextBtn.addEventListener('click', () => {
      start = (start + PER_VIEW) % all.length;
      renderAnimated();
    });
  }

  const showAllBtn = document.getElementById('testShowAll');
  const modal = document.getElementById('testimonialModal');
  const modalList = document.getElementById('testimonialModalList');
  const modalClose = document.getElementById('testimonialModalClose');
  if (showAllBtn && modal) {
    showAllBtn.addEventListener('click', () => {
      modalList.innerHTML = all.map(testimonialCardHTML).join('');
      modal.hidden = false;
    });
    modalClose.addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.hidden = true; });
  }
}

initTestimonials();

// ===== FAQ SMOOTH ACCORDION =====
document.querySelectorAll('.faq-item').forEach((item) => {
  const summary = item.querySelector('summary');
  const answer = item.querySelector('.faq-answer');
  if (!summary || !answer) return;

  summary.addEventListener('click', (e) => {
    e.preventDefault();

    if (item.hasAttribute('open')) {
      // плавно закрываем
      answer.style.maxHeight = answer.scrollHeight + 'px';
      requestAnimationFrame(() => {
        answer.style.maxHeight = '0px';
      });
      answer.addEventListener('transitionend', function handler() {
        item.removeAttribute('open');
        answer.removeEventListener('transitionend', handler);
      }, { once: true });
    } else {
      // плавно открываем (каждый вопрос независим)
      item.setAttribute('open', '');
      answer.style.maxHeight = '0px';
      requestAnimationFrame(() => {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      });
      answer.addEventListener('transitionend', function handler() {
        answer.style.maxHeight = 'none';
        answer.removeEventListener('transitionend', handler);
      }, { once: true });
    }
  });
});
