const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const databaseUrl = process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL não configurado');
const pool = mysql.createPool(databaseUrl);

function json(res, status, payload) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(payload)); }
function ok(res, payload) { json(res, 200, payload); }
function fail(res, status, message) { json(res, status, { error: message }); }
function token() { return crypto.randomBytes(24).toString('hex'); }
function roomCode() { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
function safeName(value, fallback = 'Aventureiro') { return String(value || fallback).trim().slice(0, 40) || fallback; }
function parseBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => { raw += chunk; if (raw.length > 1_000_000) req.destroy(); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON inválido')); } }); req.on('error', reject); }); }
function publicPlayer(row, includeSheet = true, providedToken = '') { return { id: row.id, name: row.name, sheet: includeSheet && row.sheet_json && (includeSheet === true || row.player_token === providedToken) ? (typeof row.sheet_json === 'string' ? JSON.parse(row.sheet_json) : row.sheet_json) : null, lastSeen: row.last_seen }; }

async function findRoom(code) {
  const [rows] = await pool.query('SELECT id, code, name, master_token, created_at FROM rooms WHERE code = ? LIMIT 1', [String(code || '').toUpperCase()]);
  return rows[0] || null;
}
async function authenticateRoom(room, providedToken, role) {
  if (!room || !providedToken) return false;
  if (role === 'master') return providedToken === room.master_token;
  const [rows] = await pool.query('SELECT id FROM room_players WHERE room_id = ? AND player_token = ? LIMIT 1', [room.id, providedToken]);
  return rows.length > 0;
}
async function roomSnapshot(room, role, providedToken) {
  const [rows] = await pool.query('SELECT id, player_token, name, sheet_json, last_seen FROM room_players WHERE room_id = ? ORDER BY created_at ASC', [room.id]);
  return { code: room.code, name: room.name, players: rows.map((row) => publicPlayer(row, role === 'master' || row.player_token === providedToken, providedToken)) };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return ok(res, { ok: true, service: 'crisol-rpg' });
    if (req.method === 'POST' && url.pathname === '/api/rooms') {
      const body = await parseBody(req);
      let code; let room;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        code = roomCode();
        const [existing] = await pool.query('SELECT id FROM rooms WHERE code = ?', [code]);
        if (!existing.length) break;
      }
      const masterToken = token();
      await pool.query('INSERT INTO rooms (code, name, master_token) VALUES (?, ?, ?)', [code, safeName(body.name, 'Mesa de Crisol'), masterToken]);
      room = await findRoom(code);
      return ok(res, { role: 'master', code: room.code, name: room.name, token: masterToken, room: { code: room.code, name: room.name, players: [] } });
    }
    if (req.method === 'POST' && url.pathname === '/api/rooms/join') {
      const body = await parseBody(req);
      const room = await findRoom(body.code);
      if (!room) return fail(res, 404, 'Sala não encontrada. Confira o código com o Mestre.');
      const playerToken = token();
      const name = safeName(body.name);
      const [result] = await pool.query('INSERT INTO room_players (room_id, player_token, name) VALUES (?, ?, ?)', [room.id, playerToken, name]);
      return ok(res, { role: 'player', code: room.code, name: room.name, token: playerToken, playerId: result.insertId, room: { code: room.code, name: room.name, players: [] } });
    }
    const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)(?:\/players\/([^/]+))?$/i);
    if (!roomMatch) return fail(res, 404, 'Rota não encontrada.');
    const room = await findRoom(roomMatch[1]);
    if (!room) return fail(res, 404, 'Sala não encontrada.');
    const providedToken = url.searchParams.get('token') || req.headers['x-room-token'];
    const role = url.searchParams.get('role') || (roomMatch[2] ? 'player' : 'master');
    if (!(await authenticateRoom(room, providedToken, role))) return fail(res, 401, 'Sessão da sala inválida.');

    if (req.method === 'GET' && !roomMatch[2]) {
      if (role === 'player') await pool.query('UPDATE room_players SET last_seen = CURRENT_TIMESTAMP WHERE room_id = ? AND player_token = ?', [room.id, providedToken]);
      return ok(res, { room: await roomSnapshot(room, role, providedToken) });
    }
    if (req.method === 'PATCH' && roomMatch[2] && role === 'master') {
      const body = await parseBody(req);
      const playerId = Number(roomMatch[2]);
      const [currentRows] = await pool.query('SELECT id, sheet_json, name FROM room_players WHERE room_id = ? AND id = ? LIMIT 1', [room.id, playerId]);
      if (!currentRows.length) return fail(res, 404, 'Jogador não encontrado.');
      const previous = currentRows[0].sheet_json ? (typeof currentRows[0].sheet_json === 'string' ? JSON.parse(currentRows[0].sheet_json) : currentRows[0].sheet_json) : null;
      const incoming = body.sheet || {};
      
      // Somente o Mestre pode alterar level, status e pendingLevelUps
      if (previous) {
        const previousLevel = Number(previous.level) || 1;
        const nextLevel = Number(incoming.level) || previousLevel;
        const previousPending = Number(previous.pendingLevelUps) || 0;
        const nextPending = Number(incoming.pendingLevelUps) || 0;
        const levelDelta = nextLevel - previousLevel;
        const validLevelState = levelDelta === 0 && nextPending === previousPending;
        if (!validLevelState) return fail(res, 403, 'Somente o Mestre pode alterar level e status.');
      }
      
      const updates = [];
      const params = [];
      if (body.name !== undefined) {
        updates.push('name = ?');
        params.push(safeName(body.name, currentRows[0].name));
      }
      if (body.sheet !== undefined) {
        updates.push('sheet_json = ?');
        params.push(JSON.stringify(body.sheet || null));
      }
      if (updates.length === 0) return fail(res, 400, 'Nenhum campo para atualizar.');
      updates.push('last_seen = CURRENT_TIMESTAMP');
      params.push(room.id, playerId);
      const [result] = await pool.query(`UPDATE room_players SET ${updates.join(', ')} WHERE room_id = ? AND id = ?`, params);
      if (!result.affectedRows) return fail(res, 404, 'Jogador não encontrado.');
      return ok(res, { saved: true });
    }
    if (req.method === 'PUT' && roomMatch[2]) {
      const body = await parseBody(req);
      const incoming = body.sheet || {};
      const [currentRows] = await pool.query('SELECT sheet_json FROM room_players WHERE room_id = ? AND player_token = ? LIMIT 1', [room.id, roomMatch[2]]);
      const previous = currentRows[0]?.sheet_json ? (typeof currentRows[0].sheet_json === 'string' ? JSON.parse(currentRows[0].sheet_json) : currentRows[0].sheet_json) : null;
      let nextSheet = incoming;
      if (previous) {
        const previousLevel = Number(previous.level) || 1;
        const nextLevel = Number(incoming.level) || previousLevel;
        const previousPending = Number(previous.pendingLevelUps) || 0;
        const nextPending = Number(incoming.pendingLevelUps) || 0;
        const levelDelta = nextLevel - previousLevel;
        const validLevelState = levelDelta === 0 && nextPending === previousPending;
        if (!validLevelState) return fail(res, 403, 'Somente o Mestre pode alterar level e status.');
        nextSheet = { ...previous, name: safeName(body.name, previous.name) };
        const previousUlt = Number(previous.ultUsedAt) || 0;
        const incomingUlt = Number(incoming.ultUsedAt) || previousUlt;
        if (incomingUlt !== previousUlt) {
          if (previousUlt && Date.now() - previousUlt < 30 * 60 * 1000) return fail(res, 403, 'A Ult ainda está em cooldown.');
          nextSheet.ultUsedAt = Date.now();
        }
      }
      const [result] = await pool.query('UPDATE room_players SET name = ?, sheet_json = ?, last_seen = CURRENT_TIMESTAMP WHERE room_id = ? AND player_token = ?', [safeName(body.name, nextSheet.name), JSON.stringify(nextSheet), room.id, roomMatch[2]]);
      if (!result.affectedRows) return fail(res, 404, 'Jogador não encontrado.');
      return ok(res, { saved: true });
    }
    return fail(res, 405, 'Método não permitido.');
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Não foi possível concluir a operação da sala.');
  }
}

async function initDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS rooms (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, code VARCHAR(8) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL, master_token CHAR(48) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS room_players (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, room_id INT UNSIGNED NOT NULL, player_token CHAR(48) NOT NULL UNIQUE, name VARCHAR(40) NOT NULL, sheet_json JSON NULL, last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_room_players_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE, INDEX idx_room_players_room (room_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return fail(res, 404, 'Arquivo não encontrado.');
  res.writeHead(200, { 'content-type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

initDatabase().then(() => server.listen(PORT, '0.0.0.0', () => console.log(`Crisol server listening on ${PORT}`))).catch((error) => { console.error('Database initialization failed', error); process.exit(1); });
