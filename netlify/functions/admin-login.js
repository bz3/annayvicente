// POST /api/admin/login — authenticate and return JWT

const jwt = require('jsonwebtoken');
const { SECRET, ADMIN_USER, ADMIN_PASS, json } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({}, 200);
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { username, password } = body;

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return json({ error: 'Credenciales incorrectas.' }, 401);
  }

  const token = jwt.sign({ sub: username, role: 'admin' }, SECRET, { expiresIn: '8h' });
  return json({ token });
};
