// ============================================
// STATE & INIT
// ============================================

let content = {};
let currentLang = 'es';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  await loadContent();
  detectLanguage();
  setupLanguageSwitcher();
  setupCountdown();
  setupRSVP();
  renderDynamicContent();
  updateContent();
}

// ============================================
// CONTENT LOADING
// ============================================

async function loadContent() {
  try {
    const response = await fetch('/data/content.json');
    if (!response.ok) throw new Error('Failed to load content');
    content = await response.json();
  } catch (error) {
    console.error('Error loading content:', error);
    // Fallback content could go here
  }
}

// ============================================
// LANGUAGE DETECTION & SWITCHING
// ============================================

function detectLanguage() {
  // Check localStorage first
  const savedLang = localStorage.getItem('wedding-lang');
  if (savedLang && ['es', 'en', 'hu'].includes(savedLang)) {
    currentLang = savedLang;
    return;
  }
  
  // Detect from browser
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('es')) {
    currentLang = 'es';
  } else if (browserLang.startsWith('en')) {
    currentLang = 'en';
  } else if (browserLang.startsWith('hu')) {
    currentLang = 'hu';
  } else {
    currentLang = 'es'; // Default
  }
  
  localStorage.setItem('wedding-lang', currentLang);
}

function setupLanguageSwitcher() {
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang && ['es', 'en', 'hu'].includes(lang)) {
        currentLang = lang;
        localStorage.setItem('wedding-lang', currentLang);
        updateActiveLanguageButton();
        updateContent();
        updateCountdownLabels();
        updateFormPlaceholders();
      }
    });
  });
  
  updateActiveLanguageButton();
}

function updateActiveLanguageButton() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// ============================================
// CONTENT UPDATES
// ============================================

function updateContent() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = getNestedValue(content, key, currentLang);
    if (value !== undefined) {
      if (el.tagName === 'INPUT' && el.type === 'text' || el.tagName === 'INPUT' && el.type === 'email') {
        // Don't overwrite user input
        if (!el.value || el.dataset.initialized !== 'true') {
          el.value = value;
          el.dataset.initialized = 'true';
        }
      } else if (el.tagName === 'TEXTAREA') {
        if (!el.value || el.dataset.initialized !== 'true') {
          el.textContent = value;
          el.dataset.initialized = 'true';
        }
      } else {
        el.textContent = value;
      }
    }
  });
  
  // Update meta tags
  if (content.meta) {
    document.title = content.meta.title?.[currentLang] || document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && content.meta.description?.[currentLang]) {
      metaDesc.content = content.meta.description[currentLang];
    }
  }
  
  // Update form placeholders
  updateFormPlaceholders();
}

function updateFormPlaceholders() {
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const value = getNestedValue(content, key, currentLang);
    if (value !== undefined) {
      el.placeholder = value;
    }
  });
  
  // Update select options
  document.querySelectorAll('select option[data-i18n]').forEach(option => {
    const key = option.dataset.i18n;
    const value = getNestedValue(content, key, currentLang);
    if (value !== undefined) {
      option.textContent = value;
    }
  });
}

function getNestedValue(obj, path, lang) {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  if (value && typeof value === 'object' && lang in value) {
    return value[lang];
  }
  
  return value;
}

// ============================================
// DYNAMIC CONTENT RENDERING
// ============================================

function renderDynamicContent() {
  renderTimeline();
  renderHotels();
  renderMap();
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline || !content.sections?.theDay?.timeline) return;
  
  timeline.innerHTML = '';
  
  content.sections.theDay.timeline.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    
    const time = document.createElement('div');
    time.className = 'timeline-time';
    time.textContent = item.time;
    
    const event = document.createElement('div');
    event.className = 'timeline-event';
    event.setAttribute('data-i18n', `sections.theDay.timeline.${index}.event`);
    
    const location = document.createElement('div');
    location.className = 'timeline-location';
    location.setAttribute('data-i18n', `sections.theDay.timeline.${index}.location`);
    
    div.appendChild(time);
    div.appendChild(event);
    div.appendChild(location);
    timeline.appendChild(div);
  });
  
  updateContent(); // Re-update to translate new elements
}

function renderHotels() {
  const hotelsList = document.getElementById('hotels-list');
  if (!hotelsList || !content.sections?.accommodation?.hotels) return;
  
  hotelsList.innerHTML = '';
  
  content.sections.accommodation.hotels.forEach((hotel, index) => {
    const div = document.createElement('div');
    div.className = 'hotel-item';
    
    const name = document.createElement('h3');
    name.className = 'hotel-name';
    
    if (hotel.url && hotel.url !== 'TODO: añadir URL del hotel') {
      const link = document.createElement('a');
      link.href = hotel.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('data-i18n', `sections.accommodation.hotels.${index}.name`);
      name.appendChild(link);
    } else {
      name.setAttribute('data-i18n', `sections.accommodation.hotels.${index}.name`);
    }
    
    const distance = document.createElement('p');
    distance.className = 'hotel-distance';
    distance.setAttribute('data-i18n', `sections.accommodation.hotels.${index}.distance`);
    
    const notes = document.createElement('p');
    notes.className = 'hotel-notes';
    notes.setAttribute('data-i18n', `sections.accommodation.hotels.${index}.notes`);
    
    div.appendChild(name);
    if (hotel.distance && hotel.distance !== `TODO: distancia desde la finca`) {
      div.appendChild(distance);
    }
    if (hotel.notes && hotel.notes[currentLang]) {
      div.appendChild(notes);
    }
    
    hotelsList.appendChild(div);
  });
  
  updateContent(); // Re-update to translate new elements
}

function renderMap() {
  const mapContainer = document.getElementById('venue-map');
  if (!mapContainer || !content.sections?.venue?.mapUrl) return;
  
  const mapUrl = content.sections.venue.mapUrl;
  if (mapUrl && mapUrl !== 'TODO: añadir URL de Google Maps embebido o coordenadas') {
    const iframe = document.createElement('iframe');
    iframe.src = mapUrl;
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.title = content.sections.venue.name?.[currentLang] || 'Mapa';
    mapContainer.appendChild(iframe);
  }
}

// ============================================
// COUNTDOWN
// ============================================

let countdownInterval = null;

function setupCountdown() {
  if (!content.countdown?.targetDateTime) return;
  
  const targetDate = new Date(content.countdown.targetDateTime);
  updateCountdown(targetDate);
  
  countdownInterval = setInterval(() => {
    updateCountdown(targetDate);
  }, 1000);
}

function updateCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const displayEl = document.getElementById('countdown-display');
  
  if (!displayEl) return;
  
  if (diff <= 0) {
    // Event has passed or is today
    const isToday = targetDate.toDateString() === now.toDateString();
    const message = isToday 
      ? content.countdown?.labels?.today?.[currentLang] || '¡Hoy es el día!'
      : content.countdown?.labels?.passed?.[currentLang] || 'El evento ya ha pasado';
    
    displayEl.innerHTML = `<p style="font-family: var(--font-serif); font-size: 1.5rem;">${message}</p>`;
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    return;
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

function updateCountdownLabels() {
  const labels = document.querySelectorAll('.countdown-label');
  labels.forEach((label, index) => {
    const keys = ['days', 'hours', 'minutes', 'seconds'];
    if (keys[index] && content.countdown?.labels?.[keys[index]]) {
      label.textContent = content.countdown.labels[keys[index]][currentLang];
    }
  });
}

// ============================================
// RSVP FORM
// ============================================

function setupRSVP() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  
  // Handle attendance radio buttons
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', handleAttendanceChange);
  });
  
  // Form submission
  form.addEventListener('submit', handleFormSubmit);
  
  // Real-time validation
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    field.addEventListener('blur', validateField);
    field.addEventListener('input', clearFieldError);
  });
  
  // Email validation
  const emailField = document.getElementById('email');
  if (emailField) {
    emailField.addEventListener('blur', validateEmail);
  }
}

function handleAttendanceChange(e) {
  const attendanceYesGroup = document.getElementById('attendance-yes-group');
  const attendanceYesGroup2 = document.getElementById('attendance-yes-group-2');
  const mainCourseField = document.getElementById('mainCourse');
  
  if (e.target.value === 'yes') {
    if (attendanceYesGroup) attendanceYesGroup.style.display = 'block';
    if (attendanceYesGroup2) attendanceYesGroup2.style.display = 'block';
    if (mainCourseField) mainCourseField.setAttribute('required', 'required');
  } else {
    if (attendanceYesGroup) attendanceYesGroup.style.display = 'none';
    if (attendanceYesGroup2) attendanceYesGroup2.style.display = 'none';
    if (mainCourseField) {
      mainCourseField.removeAttribute('required');
      mainCourseField.value = '';
    }
    const allergiesField = document.getElementById('allergies');
    if (allergiesField) allergiesField.value = '';
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const messageEl = document.getElementById('form-message');
  
  // Validate form
  if (!validateForm(form)) {
    return;
  }
  
  // Disable submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = content.rsvp?.sending?.[currentLang] || 'Enviando...';
  }
  
  // Clear previous messages
  if (messageEl) {
    messageEl.textContent = '';
    messageEl.className = 'form-message';
  }
  
  // Prepare form data - get all form fields
  const formData = new FormData(form);
  
  // Ensure form-name is included (required by Netlify)
  formData.set('form-name', 'rsvp');
  
  // Clean up conditional fields if attendance is "no"
  const attendance = formData.get('attendance');
  if (attendance === 'no') {
    formData.delete('mainCourse');
    formData.delete('allergies');
  }
  
  // Build URL-encoded string manually to ensure all fields are included
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  }
  
  // Ensure form-name is always first
  if (!params.has('form-name')) {
    params.set('form-name', 'rsvp');
  }
  
  const encodedData = params.toString();
  
  try {
    // Submit to Netlify Forms - use the correct endpoint
    const response = await fetch('/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedData
    });
    
    // Netlify Forms returns 200 on success, even if it's HTML
    if (response.ok) {
      // Check response - Netlify returns HTML with success message
      const responseText = await response.text();
      
      // Netlify Forms success page contains these indicators
      const isSuccess = responseText.includes('Thank you') || 
                       responseText.includes('Gracias') ||
                       responseText.includes('success') ||
                       response.status === 200;
      
      if (isSuccess || response.status === 200) {
        // Success
        if (messageEl) {
          messageEl.textContent = content.rsvp?.success?.[currentLang] || '¡Gracias! Hemos recibido tu confirmación.';
          messageEl.className = 'form-message success';
        }
        
        // Reset form
        form.reset();
        handleAttendanceChange({ target: { value: 'no' } });
        
        // Clear all initialized flags
        form.querySelectorAll('[data-initialized]').forEach(el => {
          el.removeAttribute('data-initialized');
        });
        
        // Scroll to message
        messageEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        throw new Error('Unexpected response format');
      }
    } else {
      // Get error details
      const responseText = await response.text().catch(() => '');
      console.error('Form submission failed:', {
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 500)
      });
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Form submission error:', error);
    console.error('Form data that was sent:', encodedData);
    
    if (messageEl) {
      const errorMsg = content.rsvp?.error?.[currentLang] || 'Hubo un error al enviar. Por favor, inténtalo de nuevo.';
      messageEl.textContent = errorMsg + ' (Error: ' + error.message + ')';
      messageEl.className = 'form-message error';
    }
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = content.rsvp?.submit?.[currentLang] || 'Enviar confirmación';
    }
  }
}

function validateForm(form) {
  let isValid = true;
  
  // Validate all required fields
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (!validateField({ target: field })) {
      isValid = false;
    }
  });
  
  // Validate email if present
  const emailField = document.getElementById('email');
  if (emailField && emailField.value) {
    if (!validateEmail({ target: emailField })) {
      isValid = false;
    }
  }
  
  // Validate main course if attending
  const attendanceYes = document.getElementById('attendance-yes');
  if (attendanceYes && attendanceYes.checked) {
    const mainCourse = document.getElementById('mainCourse');
    if (mainCourse && !mainCourse.value) {
      showFieldError(mainCourse, content.rsvp?.validation?.required?.[currentLang] || 'Este campo es obligatorio');
      isValid = false;
    }
  }
  
  return isValid;
}

function validateField(e) {
  const field = e.target;
  const errorEl = document.getElementById(`${field.id}-error`);
  
  if (field.hasAttribute('required') && !field.value.trim()) {
    showFieldError(field, content.rsvp?.validation?.required?.[currentLang] || 'Este campo es obligatorio');
    return false;
  }
  
  clearFieldError({ target: field });
  return true;
}

function validateEmail(e) {
  const field = e.target;
  const errorEl = document.getElementById(`${field.id}-error`);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (field.value && !emailRegex.test(field.value)) {
    showFieldError(field, content.rsvp?.validation?.email?.[currentLang] || 'Por favor, introduce un email válido');
    return false;
  }
  
  clearFieldError({ target: field });
  return true;
}

function showFieldError(field, message) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
  }
  field.setAttribute('aria-invalid', 'true');
}

function clearFieldError(e) {
  const field = e.target;
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
  }
  field.removeAttribute('aria-invalid');
}
