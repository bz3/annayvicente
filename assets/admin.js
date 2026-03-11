/* ═══════════════════════════════════════════════════
   ANNA & VICENTE — Admin Panel JS
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────────────

let token       = null;
let allRsvps    = [];
let currentPage = 1;
let totalPages  = 1;
let filterAtt   = 'all';
let searchQuery = '';
let deleteId    = null;

const MENU_LABELS = { meat: 'Carne', fish: 'Pescado', vegan: 'Vegano', kids: 'Infantil' };

// ─── Init ─────────────────────────────────────────

function init() {
  token = sessionStorage.getItem('admin-token');
  if (token) showPanel();
  else showLogin();

  setupLogin();
  setupLogout();
  setupExport();
  setupRefresh();
  setupFilters();
  setupPagination();
  setupDeleteModal();
  setupDrawer();
}

// ─── Auth ─────────────────────────────────────────

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('adminPanel').hidden  = true;
}

function showPanel() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('adminPanel').hidden  = false;
  loadData();
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    try {
      const res  = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        token = data.token;
        sessionStorage.setItem('admin-token', token);
        showPanel();
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch {
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
}

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    token = null;
    sessionStorage.removeItem('admin-token');
    showLogin();
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
  });
}

// ─── API helpers ──────────────────────────────────

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

  if (res.status === 401) {
    token = null;
    sessionStorage.removeItem('admin-token');
    showLogin();
    throw new Error('Sesión expirada');
  }

  return res.json();
}

// ─── Load data ────────────────────────────────────

async function loadData() {
  await Promise.all([loadStats(), loadRsvps()]);
}

async function loadStats() {
  try {
    const data = await api('/api/admin/stats');
    document.getElementById('statTotal').textContent        = data.total ?? '—';
    document.getElementById('statAttending').textContent    = data.attending ?? '—';
    document.getElementById('statNotAttending').textContent = data.notAttending ?? '—';
    document.getElementById('statAllergies').textContent    = data.withAllergies ?? '—';

    renderMenuBreakdown(data.courseCounts || [], data.attending || 0);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderMenuBreakdown(courses, total) {
  const el    = document.getElementById('menuBreakdown');
  const bars  = document.getElementById('menuBars');
  if (!el || !bars) return;

  if (!courses.length || !total) { el.hidden = true; return; }

  el.hidden = false;
  bars.innerHTML = courses.map(c => {
    const pct   = Math.round((c.count / total) * 100);
    const label = MENU_LABELS[c.course] || c.course || 'Otro';
    return `
      <div class="menu-bar">
        <span class="menu-bar__label">${label}</span>
        <div class="menu-bar__track">
          <div class="menu-bar__fill" style="width:${pct}%"></div>
        </div>
        <span class="menu-bar__count">${c.count}</span>
      </div>
    `;
  }).join('');
}

async function loadRsvps() {
  const tbody   = document.getElementById('rsvpTableBody');
  const emptyEl = document.getElementById('emptyState');
  const tableEl = document.getElementById('rsvpTable');
  const countEl = document.getElementById('filterCount');

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">
      <span class="table-loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        Cargando…
      </span>
    </td></tr>`;
  }

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 50,
      ...(searchQuery && { search: searchQuery }),
      ...(filterAtt !== 'all' && { attendance: filterAtt }),
    });

    const data = await api(`/api/admin/rsvps?${params}`);

    allRsvps   = data.rsvps || [];
    totalPages = data.totalPages || 1;

    if (countEl) {
      const total = data.total || 0;
      countEl.textContent = total === 0 ? 'Sin resultados' : `${total} respuesta${total !== 1 ? 's' : ''}`;
    }

    if (!allRsvps.length) {
      if (tableEl) tableEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (tableEl) tableEl.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      renderTable(allRsvps);
    }

    renderPagination();
  } catch (err) {
    console.error('RSVPs error:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color:var(--a-red)">Error al cargar los datos. Por favor, recarga la página.</td></tr>`;
    }
  }
}

// ─── Table ────────────────────────────────────────

function renderTable(rows) {
  const tbody = document.getElementById('rsvpTableBody');
  if (!tbody) return;

  tbody.innerHTML = rows.map(r => {
    const attBadge = r.attendance === 'yes'
      ? '<span class="badge badge--yes">✓ Sí</span>'
      : '<span class="badge badge--no">✗ No</span>';

    const menuBadge = r.main_course
      ? `<span class="menu-badge">${MENU_LABELS[r.main_course] || r.main_course}</span>`
      : '<span style="color:var(--a-faint)">—</span>';

    const date = r.created_at
      ? new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—';

    const allergyText = r.allergies
      ? `<span class="cell-note" title="${escapeHtml(r.allergies)}">${escapeHtml(r.allergies)}</span>`
      : '<span style="color:var(--a-faint)">—</span>';

    const commentText = r.comments
      ? `<span class="cell-note" title="${escapeHtml(r.comments)}">${escapeHtml(r.comments)}</span>`
      : '<span style="color:var(--a-faint)">—</span>';

    return `
      <tr data-id="${r.id}">
        <td>
          <div class="cell-name">${escapeHtml(r.first_name)} ${escapeHtml(r.last_name)}</div>
        </td>
        <td><div class="cell-email">${escapeHtml(r.email)}</div></td>
        <td>${attBadge}</td>
        <td>${menuBadge}</td>
        <td style="min-width:160px">${allergyText}</td>
        <td style="min-width:160px">${commentText}</td>
        <td style="white-space:nowrap;font-size:.8rem;color:var(--a-faint)">${date}</td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn" title="Ver detalle" data-action="view" data-id="${r.id}" aria-label="Ver detalle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="row-action-btn row-action-btn--delete" title="Eliminar" data-action="delete" data-id="${r.id}" aria-label="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind row actions
  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      if (btn.dataset.action === 'delete') openDeleteModal(id);
      if (btn.dataset.action === 'view')   openDrawer(id);
    });
  });
}

// ─── Filters ──────────────────────────────────────

function setupFilters() {
  // Search (debounced)
  let timer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadRsvps();
    }, 300);
  });

  // Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterAtt = tab.dataset.filter;
      currentPage = 1;
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.filter === filterAtt);
        t.setAttribute('aria-selected', String(t.dataset.filter === filterAtt));
      });
      loadRsvps();
    });
  });
}

// ─── Pagination ───────────────────────────────────

function renderPagination() {
  const el      = document.getElementById('pagination');
  const infoEl  = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  if (!el) return;

  el.hidden = totalPages <= 1;
  if (infoEl)  infoEl.textContent  = `Página ${currentPage} de ${totalPages}`;
  if (prevBtn) prevBtn.disabled    = currentPage <= 1;
  if (nextBtn) nextBtn.disabled    = currentPage >= totalPages;
}

function setupPagination() {
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadRsvps(); }
  });
  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadRsvps(); }
  });
}

// ─── Refresh ──────────────────────────────────────

function setupRefresh() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadData());
}

// ─── Export ───────────────────────────────────────

function setupExport() {
  document.getElementById('exportBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `invitados-anna-vicente-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar: ' + err.message);
    }
  });
}

// ─── Delete modal ─────────────────────────────────

function setupDeleteModal() {
  const modal   = document.getElementById('deleteModal');
  const overlay = document.getElementById('modalOverlay');
  const cancel  = document.getElementById('cancelDelete');
  const confirm = document.getElementById('confirmDelete');

  function closeModal() { modal.hidden = true; deleteId = null; }

  overlay?.addEventListener('click', closeModal);
  cancel?.addEventListener('click', closeModal);

  confirm?.addEventListener('click', async () => {
    if (!deleteId) return;
    confirm.disabled = true;
    confirm.textContent = 'Eliminando…';
    try {
      await api(`/api/admin/rsvps/${deleteId}`, { method: 'DELETE' });
      closeModal();
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      confirm.disabled = false;
      confirm.textContent = 'Eliminar';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

function openDeleteModal(id) {
  deleteId = id;
  document.getElementById('deleteModal').hidden = false;
}

// ─── Detail drawer ────────────────────────────────

function setupDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');

  overlay?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
}

function openDrawer(id) {
  const rsvp = allRsvps.find(r => r.id === id);
  if (!rsvp) return;

  const drawer  = document.getElementById('detailDrawer');
  const nameEl  = document.getElementById('drawerName');
  const bodyEl  = document.getElementById('drawerBody');

  if (nameEl) nameEl.textContent = `${rsvp.first_name} ${rsvp.last_name}`;

  const date = rsvp.created_at
    ? new Date(rsvp.created_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : '—';

  const attText   = rsvp.attendance === 'yes' ? '✓ Sí, asistirá' : '✗ No asistirá';
  const menuText  = MENU_LABELS[rsvp.main_course] || (rsvp.main_course ?? '—');

  if (bodyEl) bodyEl.innerHTML = `
    <div class="detail-row">
      <span class="detail-row__label">Email</span>
      <span class="detail-row__value">${escapeHtml(rsvp.email)}</span>
    </div>
    <hr class="detail-divider" />
    <div class="detail-row">
      <span class="detail-row__label">Asistencia</span>
      <span class="detail-row__value">${attText}</span>
    </div>
    ${rsvp.attendance === 'yes' ? `
    <div class="detail-row">
      <span class="detail-row__label">Menú</span>
      <span class="detail-row__value">${menuText}</span>
    </div>
    <div class="detail-row">
      <span class="detail-row__label">Alergias / Intolerancias</span>
      <span class="detail-row__value">${escapeHtml(rsvp.allergies) || '—'}</span>
    </div>` : ''}
    <hr class="detail-divider" />
    <div class="detail-row">
      <span class="detail-row__label">Comentarios</span>
      <span class="detail-row__value">${escapeHtml(rsvp.comments) || '—'}</span>
    </div>
    <hr class="detail-divider" />
    <div class="detail-row">
      <span class="detail-row__label">Fecha de confirmación</span>
      <span class="detail-row__value">${date}</span>
    </div>
    <div style="margin-top:auto;padding-top:1rem">
      <button class="a-btn a-btn--danger" style="width:100%;justify-content:center" onclick="openDeleteFromDrawer(${rsvp.id})">
        Eliminar respuesta
      </button>
    </div>
  `;

  drawer.hidden = false;
}

function openDeleteFromDrawer(id) {
  closeDrawer();
  setTimeout(() => openDeleteModal(id), 250);
}

function closeDrawer() {
  document.getElementById('detailDrawer').hidden = true;
}

// ─── Utils ────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Start ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
