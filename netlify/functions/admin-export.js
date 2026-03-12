// GET /api/admin/export — download CSV of all RSVPs

const { requireAuth, CORS_HEADERS } = require('./_auth');
const { getDB } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const user = requireAuth(event);
  if (!user) {
    return { statusCode: 401, headers: CORS_HEADERS, body: 'No autorizado.' };
  }

  const { rsvps } = await getDB();

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const header = ['ID','Nombre','Apellidos','Email','Asistencia','Menú','Alergias','Comentarios','Creado','Actualizado'].join(',');
  const rows   = rsvps.map(r => [
    r.id,
    esc(r.first_name),
    esc(r.last_name),
    esc(r.email),
    r.attendance === 'yes' ? 'Sí' : 'No',
    esc(r.main_course || ''),
    esc(r.allergies   || ''),
    esc(r.comments    || ''),
    r.created_at || '',
    r.updated_at || '',
  ].join(','));

  const csv = '\uFEFF' + [header, ...rows].join('\n');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="invitados.csv"',
      ...CORS_HEADERS,
    },
    body: csv,
  };
};
