const express = require('express');
const jwt     = require('jsonwebtoken');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const PORT   = process.env.PORT   || 3000;
const SECRET = process.env.JWT_SECRET  || 'boda-anna-vicente-2026-secret';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'boda2026';
const DB_PATH = path.join(__dirname, 'data', 'rsvps.json');

// ─── JSON "database" ──────────────────────────────
// Lightweight storage perfect for ~100-200 wedding guests.
// Replace with a real DB when needed.

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ rsvps: [], nextId: 1 }, null, 2));
}

function readDB()  { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

// ─── Middleware ───────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ─── RSVP submission ──────────────────────────────

app.post('/api/rsvp', (req, res) => {
  const { firstName, lastName, email, attendance, mainCourse, allergies, comments } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !attendance) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos.' });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Email inválido.' });
  }

  if (!['yes', 'no'].includes(attendance)) {
    return res.status(400).json({ success: false, error: 'Valor de asistencia inválido.' });
  }

  const normalEmail = email.toLowerCase().trim();
  const now         = new Date().toISOString();

  try {
    const db  = readDB();
    const idx = db.rsvps.findIndex(r => r.email === normalEmail);

    const record = {
      first_name:  firstName.trim(),
      last_name:   lastName.trim(),
      email:       normalEmail,
      attendance,
      main_course: attendance === 'yes' ? (mainCourse || null) : null,
      allergies:   attendance === 'yes' ? (allergies?.trim() || null) : null,
      comments:    comments?.trim() || null,
      updated_at:  now,
    };

    if (idx >= 0) {
      // Update existing
      db.rsvps[idx] = { ...db.rsvps[idx], ...record };
      writeDB(db);
      return res.json({ success: true, updated: true });
    }

    // Insert new
    record.id         = db.nextId++;
    record.created_at = now;
    db.rsvps.push(record);
    writeDB(db);
    res.json({ success: true, updated: false });

  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// ─── Admin auth ───────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
});

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado.' });
  try { jwt.verify(auth.slice(7), SECRET); next(); }
  catch { res.status(401).json({ error: 'Token expirado o inválido.' }); }
};

// ─── Admin: Stats ─────────────────────────────────

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const { rsvps } = readDB();

  const total        = rsvps.length;
  const attending    = rsvps.filter(r => r.attendance === 'yes').length;
  const notAttending = rsvps.filter(r => r.attendance === 'no').length;
  const withAllergies = rsvps.filter(r => r.attendance === 'yes' && r.allergies).length;

  const courseCounts = ['meat','fish','vegan','kids'].map(c => ({
    course: c,
    count:  rsvps.filter(r => r.main_course === c).length,
  })).filter(c => c.count > 0);

  const recentRsvps = [...rsvps]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(({ first_name, last_name, attendance, created_at }) => ({ first_name, last_name, attendance, created_at }));

  res.json({ total, attending, notAttending, withAllergies, courseCounts, recentRsvps });
});

// ─── Admin: List RSVPs ────────────────────────────

app.get('/api/admin/rsvps', requireAuth, (req, res) => {
  const { search = '', attendance: att, page = 1, limit = 100 } = req.query;
  const { rsvps } = readDB();

  let filtered = rsvps;

  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(r =>
      r.first_name.toLowerCase().includes(s) ||
      r.last_name.toLowerCase().includes(s)  ||
      r.email.toLowerCase().includes(s)
    );
  }
  if (att === 'yes' || att === 'no') {
    filtered = filtered.filter(r => r.attendance === att);
  }

  filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total      = filtered.length;
  const lim        = parseInt(limit);
  const pg         = parseInt(page);
  const paginated  = filtered.slice((pg - 1) * lim, pg * lim);

  res.json({ rsvps: paginated, total, page: pg, totalPages: Math.ceil(total / lim) });
});

// ─── Admin: Delete RSVP ───────────────────────────

app.delete('/api/admin/rsvps/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const idx = db.rsvps.findIndex(r => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'No encontrado.' });
  db.rsvps.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// ─── Admin: Export CSV ────────────────────────────

app.get('/api/admin/export', requireAuth, (req, res) => {
  const { rsvps } = readDB();
  const escape    = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const labels    = { meat: 'Carne', fish: 'Pescado', vegan: 'Vegano', kids: 'Infantil' };
  const header    = ['ID','Nombre','Apellidos','Email','Asistencia','Menú','Alergias','Comentarios','Fecha'];

  const lines = rsvps.map(r => [
    r.id,
    escape(r.first_name),
    escape(r.last_name),
    escape(r.email),
    r.attendance === 'yes' ? 'Sí' : 'No',
    labels[r.main_course] || '',
    escape(r.allergies),
    escape(r.comments),
    escape(r.created_at),
  ].join(','));

  const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="invitados-anna-vicente.csv"');
  res.send(csv);
});

// ─── Fallback ─────────────────────────────────────

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*',      (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ─── Start ────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌸 Servidor:   http://localhost:${PORT}`);
  console.log(`🔐 Admin:      http://localhost:${PORT}/admin`);
  console.log(`📦 Base datos: ${DB_PATH}\n`);
});
