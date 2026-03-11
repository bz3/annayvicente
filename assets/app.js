/* ═══════════════════════════════════════════════════
   ANNA & VICENTE — Frontend App
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────────────

let content = {};
let lang    = 'es';

// ─── Init ─────────────────────────────────────────

async function init() {
  try {
    const res = await fetch('/data/content.json');
    content = await res.json();
  } catch {
    console.warn('Could not load content.json');
    content = {};
  }

  lang = detectLang();
  applyContent();
  setupLangNav();
  setupCountdown();
  setupTimeline();
  setupHotels();
  setupVenueMap();
  setupRSVP();
  setupScrollReveal();
}

// ─── Language ─────────────────────────────────────

function detectLang() {
  const stored = localStorage.getItem('wedding-lang');
  if (stored && ['es','en','hu'].includes(stored)) return stored;
  const browser = (navigator.language || '').slice(0,2).toLowerCase();
  if (['en','hu'].includes(browser)) return browser;
  return 'es';
}

function t(key) {
  const keys = key.split('.');
  let node = content;
  for (const k of keys) {
    if (!node || typeof node !== 'object') return key;
    node = node[k];
  }
  if (node && typeof node === 'object' && node[lang] !== undefined) return node[lang];
  if (node && typeof node === 'object' && node.es !== undefined) return node.es;
  if (typeof node === 'string') return node;
  return key;
}

function applyContent() {
  document.documentElement.lang = lang;

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val !== el.dataset.i18n) el.textContent = val;
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const val = t(el.dataset.i18nPh);
    if (val !== el.dataset.i18nPh) el.placeholder = val;
  });

  // Set form placeholders manually
  const phs = [
    ['firstName',  'rsvp.firstName'],
    ['lastName',   'rsvp.lastName'],
    ['email',      'rsvp.email'],
    ['allergies',  'rsvp.allergiesPlaceholder'],
    ['comments',   'rsvp.commentsPlaceholder'],
  ];
  phs.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  });

  // Page title
  const title = t('meta.title');
  if (title && title !== 'meta.title') document.title = title;
}

function setupLangNav() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.dataset.lang === lang) btn.classList.add('active');
    else btn.classList.remove('active');

    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      localStorage.setItem('wedding-lang', lang);
      document.querySelectorAll('.lang-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === lang)
      );
      applyContent();
      setupTimeline();
      setupHotels();
    });
  });
}

// ─── Countdown ────────────────────────────────────

function setupCountdown() {
  const targetStr = content?.countdown?.targetDateTime || '2026-07-03T18:00:00+02:00';
  const target    = new Date(targetStr).getTime();

  const elDays  = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins  = document.getElementById('cd-minutes');
  const elSecs  = document.getElementById('cd-seconds');
  const elMsg   = document.getElementById('countdownMessage');
  const elGrid  = document.getElementById('countdownGrid');

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function tick() {
    const now  = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      if (elGrid) elGrid.hidden = true;
      if (elMsg) {
        elMsg.hidden = false;
        elMsg.textContent = diff === 0 ? t('countdown.today') : t('countdown.passed');
      }
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    if (elDays)  elDays.textContent  = String(days).padStart(3, '0');
    if (elHours) elHours.textContent = pad(hours);
    if (elMins)  elMins.textContent  = pad(mins);
    if (elSecs)  elSecs.textContent  = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
}

// ─── Timeline ─────────────────────────────────────

function setupTimeline() {
  const container = document.getElementById('timeline');
  if (!container) return;

  const events = content?.schedule?.events || [];

  container.innerHTML = events.map((ev, i) => `
    <div class="timeline__item reveal" role="listitem">
      <div class="timeline__time">${ev.time}</div>
      <div class="timeline__connector">
        <div class="timeline__dot"></div>
        ${i < events.length - 1 ? '<div class="timeline__vline"></div>' : ''}
      </div>
      <div class="timeline__body">
        <p class="timeline__event">${ev.event?.[lang] || ev.event?.es || ''}</p>
        <p class="timeline__loc">${ev.location?.[lang] || ev.location?.es || ''}</p>
      </div>
    </div>
  `).join('');

  setupScrollReveal();
}

// ─── Hotels ───────────────────────────────────────

function setupHotels() {
  const container = document.getElementById('hotelsGrid');
  if (!container) return;

  const hotels = content?.accommodation?.hotels || [];
  if (!hotels.length) {
    container.innerHTML = '<p class="body-text">Información de alojamiento próximamente.</p>';
    return;
  }

  container.innerHTML = hotels.map(h => {
    const name     = h.name?.[lang]     || h.name?.es     || '';
    const distance = h.distance?.[lang] || h.distance?.es || '';
    const note     = h.note?.[lang]     || h.note?.es     || '';
    const url      = h.url;

    return `
      <div class="hotel-card reveal">
        <p class="hotel-card__name">${name}</p>
        ${distance ? `<p class="hotel-card__distance">${distance}</p>` : ''}
        ${note ? `<p class="hotel-card__note">${note}</p>` : ''}
        ${url ? `<a class="hotel-card__link" href="${url}" target="_blank" rel="noopener">Reservar</a>` : ''}
      </div>
    `;
  }).join('');

  setupScrollReveal();
}

// ─── Venue map ────────────────────────────────────

function setupVenueMap() {
  const mapUrl = content?.venue?.mapUrl;
  const mapEl  = document.getElementById('venueMap');
  const mapBtn = document.getElementById('venueMapLink');

  if (!mapEl) return;

  if (mapUrl && mapUrl !== 'null' && mapUrl !== null) {
    // Embed iframe if it's an embed URL, else show link
    if (mapUrl.includes('maps/embed') || mapUrl.includes('embed?')) {
      mapEl.innerHTML = `<iframe src="${mapUrl}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }
    if (mapBtn) mapBtn.href = mapUrl.replace('/embed', '').replace('output=embed&', '');
  }
}

// ─── RSVP Form ────────────────────────────────────

function setupRSVP() {
  const form          = document.getElementById('rsvpForm');
  const attendingBox  = document.getElementById('attendingFields');
  const submitBtn     = document.getElementById('submitBtn');
  const submitText    = document.getElementById('submitText');
  const successEl     = document.getElementById('formSuccess');
  const errorEl       = document.getElementById('formError');

  if (!form) return;

  // Attendance radios → show/hide extra fields
  form.querySelectorAll('input[name="attendance"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const yes = radio.value === 'yes' && radio.checked;
      if (attendingBox) {
        attendingBox.classList.toggle('open', yes);
        attendingBox.setAttribute('aria-hidden', String(!yes));
      }
      if (!yes) {
        const mc = document.getElementById('mainCourse');
        if (mc) mc.value = '';
        const al = document.getElementById('allergies');
        if (al) al.value = '';
      }
      clearError('attendance');
    });
  });

  // Live validation on blur
  ['firstName','lastName','email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateField(id));
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateAll()) return;

    // Honeypot check
    const botField = form.querySelector('input[name="bot-field"]');
    if (botField?.value) return;

    submitBtn.disabled = true;
    submitText.textContent = t('rsvp.sending');
    if (successEl) successEl.hidden = true;
    if (errorEl)   errorEl.hidden   = true;

    const data = {
      firstName:  form.firstName.value.trim(),
      lastName:   form.lastName.value.trim(),
      email:      form.email.value.trim(),
      attendance: form.attendance.value,
      mainCourse: form.mainCourse?.value || '',
      allergies:  form.allergies?.value?.trim() || '',
      comments:   form.comments?.value?.trim()  || '',
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        form.hidden = true;
        if (successEl) {
          const p = successEl.querySelector('p');
          if (p) p.textContent = json.updated ? t('rsvp.alreadySent') : t('rsvp.success');
          successEl.hidden = false;
          successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        throw new Error(json.error || 'Error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (errorEl) {
        const p = errorEl.querySelector('p');
        if (p) p.textContent = err.message || t('rsvp.error');
        errorEl.hidden = false;
      }
      submitBtn.disabled = false;
      submitText.textContent = t('rsvp.submit');
    }
  });
}

function validateField(id) {
  const el   = document.getElementById(id);
  const errEl = document.getElementById(id + 'Error');
  if (!el || !errEl) return true;

  let msg = '';

  if (!el.value.trim()) {
    msg = t('rsvp.validation.required');
  } else if (id === 'email') {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(el.value.trim())) msg = t('rsvp.validation.email');
  }

  errEl.textContent = msg;
  el.classList.toggle('error', !!msg);
  return !msg;
}

function clearError(name) {
  const errEl = document.getElementById(name + 'Error');
  if (errEl) errEl.textContent = '';
}

function validateAll() {
  let ok = true;
  ok = validateField('firstName') && ok;
  ok = validateField('lastName')  && ok;
  ok = validateField('email')     && ok;

  // Attendance
  const form = document.getElementById('rsvpForm');
  const att  = form?.attendance?.value;
  const attErr = document.getElementById('attendanceError');
  if (!att) {
    if (attErr) attErr.textContent = t('rsvp.validation.attendance');
    ok = false;
  } else {
    if (attErr) attErr.textContent = '';
  }

  // Menu (if attending)
  if (att === 'yes') {
    const mc = document.getElementById('mainCourse');
    const mcErr = document.getElementById('mainCourseError');
    if (mc && !mc.value) {
      if (mcErr) mcErr.textContent = t('rsvp.validation.required');
      mc.classList.add('error');
      ok = false;
    } else {
      if (mcErr) mcErr.textContent = '';
      if (mc) mc.classList.remove('error');
    }
  }

  return ok;
}

// ─── Scroll reveal ────────────────────────────────

function setupScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// ─── Start ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
