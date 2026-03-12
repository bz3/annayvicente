// GET /api/admin/stats — dashboard summary stats

const { requireAuth, json } = require('./_auth');
const { getDB } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({}, 200);

  const user = requireAuth(event);
  if (!user) return json({ error: 'No autorizado.' }, 401);

  const { rsvps } = await getDB();

  const attending     = rsvps.filter(r => r.attendance === 'yes').length;
  const notAttending  = rsvps.filter(r => r.attendance === 'no').length;
  const withAllergies = rsvps.filter(r => r.attendance === 'yes' && r.allergies).length;

  const courseCounts = ['meat', 'fish', 'vegan', 'kids']
    .map(c => ({ course: c, count: rsvps.filter(r => r.main_course === c).length }))
    .filter(c => c.count > 0);

  const recentRsvps = [...rsvps]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(({ first_name, last_name, attendance, created_at }) => ({ first_name, last_name, attendance, created_at }));

  return json({ total: rsvps.length, attending, notAttending, withAllergies, courseCounts, recentRsvps });
};
