// Shared auth + CORS helpers for Netlify Functions.

const jwt = require('jsonwebtoken');

const SECRET     = process.env.JWT_SECRET  || 'boda-anna-vicente-2026-secret';
const ADMIN_USER = process.env.ADMIN_USER  || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS  || 'boda2026';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function json(body, status = 200, extraHeaders = {}) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function requireAuth(event) {
  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), SECRET);
  } catch {
    return null;
  }
}

module.exports = { SECRET, ADMIN_USER, ADMIN_PASS, CORS_HEADERS, json, requireAuth };
