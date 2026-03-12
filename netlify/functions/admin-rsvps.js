// GET  /api/admin/rsvps       — paginated list with search/filter
// DELETE /api/admin/rsvps/:id — remove one RSVP

const { requireAuth, json } = require('./_auth');
const { getDB, saveDB } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({}, 200);

  const user = requireAuth(event);
  if (!user) return json({ error: 'No autorizado.' }, 401);

  const db = await getDB();

  // ─── DELETE ──────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    // Extract id from path: /api/admin/rsvps/5  →  5
    const parts = (event.path || '').split('/');
    const id    = parseInt(parts[parts.length - 1]);
    if (!id) return json({ error: 'ID inválido.' }, 400);

    const before = db.rsvps.length;
    db.rsvps     = db.rsvps.filter(r => r.id !== id);
    if (db.rsvps.length === before) return json({ error: 'No encontrado.' }, 404);

    await saveDB(db);
    return json({ success: true });
  }

  // ─── GET list ────────────────────────────────────
  const p          = event.queryStringParameters || {};
  const search     = (p.search || '').toLowerCase();
  const attendance = p.attendance || 'all';
  const page       = Math.max(1, parseInt(p.page  || '1'));
  const lim        = Math.min(200, parseInt(p.limit || '50'));

  let list = [...db.rsvps];

  if (attendance !== 'all') list = list.filter(r => r.attendance === attendance);
  if (search) list = list.filter(r =>
    r.first_name.toLowerCase().includes(search) ||
    r.last_name.toLowerCase().includes(search)  ||
    r.email.toLowerCase().includes(search)
  );

  list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const total      = list.length;
  const totalPages = Math.ceil(total / lim) || 1;
  const rsvps      = list.slice((page - 1) * lim, page * lim);

  return json({ rsvps, total, page, totalPages });
};
