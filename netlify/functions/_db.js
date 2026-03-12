// Shared blob storage helper for Netlify Functions.
// Uses @netlify/blobs — works automatically on Netlify (no setup required).
// For local dev, use `node server.js` instead (file-based storage).

const { getStore } = require('@netlify/blobs');

const STORE = 'wedding-rsvps';
const KEY   = 'db';

async function getDB() {
  try {
    const store = getStore(STORE);
    const data  = await store.get(KEY, { type: 'json' });
    return data ?? { rsvps: [], nextId: 1 };
  } catch {
    return { rsvps: [], nextId: 1 };
  }
}

async function saveDB(db) {
  const store = getStore(STORE);
  await store.setJSON(KEY, db);
}

module.exports = { getDB, saveDB };
