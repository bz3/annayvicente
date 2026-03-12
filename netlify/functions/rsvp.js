// POST /api/rsvp — save a guest's RSVP

const { json } = require('./_auth');
const { getDB, saveDB } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({}, 200);
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json({ success: false, error: 'JSON inválido.' }, 400);
  }

  const { firstName, lastName, email, attendance, mainCourse, allergies, comments } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !attendance) {
    return json({ success: false, error: 'Faltan campos requeridos.' }, 400);
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.trim())) {
    return json({ success: false, error: 'Email inválido.' }, 400);
  }

  if (!['yes', 'no'].includes(attendance)) {
    return json({ success: false, error: 'Valor de asistencia inválido.' }, 400);
  }

  const normalEmail = email.toLowerCase().trim();
  const now         = new Date().toISOString();

  const db  = await getDB();
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
    db.rsvps[idx] = { ...db.rsvps[idx], ...record };
    await saveDB(db);
    return json({ success: true, updated: true });
  }

  record.id         = db.nextId++;
  record.created_at = now;
  db.rsvps.push(record);
  await saveDB(db);

  return json({ success: true, updated: false });
};
