/**
 * ─────────────────────────────────────────────────────────────────
 *  Food Connect — IoT Smart Box API Server (Zero-Config Mode)
 *  Run with: node iot-server.cjs
 *  Listens on http://localhost:3001
 * ─────────────────────────────────────────────────────────────────
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT        = 3001;
const API_KEY     = 'food-connect-iot-2024';
const DB_FILE     = path.join(__dirname, 'iot-deposits.json');

// ── BOX REGISTRY ────────────────────────────────────────────────
const BOX_LOCATIONS = {
  'BOX-01': 'Main Hall, Hyderabad',
  'BOX-02': 'Community Centre, Secunderabad',
};

// ── INIT DATABASE ───────────────────────────────────────────────
function loadDeposits() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[IoT] Error loading DB file:', e.message);
  }
  return [];
}

function saveDeposit(deposit) {
  const deposits = loadDeposits();
  deposits.push(deposit);
  // Keep last 50 for local memory
  if (deposits.length > 50) deposits.shift();
  fs.writeFileSync(DB_FILE, JSON.stringify(deposits, null, 2));
}

// ── SERVER ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. GET /api/iot/status -> Returns all recent sensor deposits
  if (req.method === 'GET' && req.url === '/api/iot/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      server: 'Food Connect IoT Proxy',
      uptime: Math.floor(process.uptime()),
      deposits: loadDeposits(),
    }));
    return;
  }

  // 2. POST /api/iot/food-detected -> Receives sensor data
  if (req.method === 'POST' && req.url === '/api/iot/food-detected') {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API Key' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { box_id, distance } = data;

        if (!box_id) throw new Error('box_id is required');
        if (distance === undefined) throw new Error('distance is required');

        const deposit = {
          id: `iot-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          box_id,
          location: BOX_LOCATIONS[box_id] || 'Unknown Location',
          temperature: 25, // Default room temp since sensor is removed
          humidity: 50,    // Default humidity
          distance: distance,
          timestamp: new Date().toISOString()
        };

        saveDeposit(deposit);
        console.log(`[IoT] 📦 Food detected at ${deposit.box_id} (Distance: ${deposit.distance}cm)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Sensor data logged locally', deposit }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nIoT Server listening on http://localhost:${PORT}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Database: ${DB_FILE}\n`);
});
