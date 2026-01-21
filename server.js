// server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

const rooms = {}; // { roomCode: Set of clients }

wss.on('connection', ws => {
  ws.roomCode = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'join') {
      const code = data.room;
      ws.roomCode = code;
      if (!rooms[code]) rooms[code] = new Set();
      rooms[code].add(ws);

      const count = rooms[code].size;
      rooms[code].forEach(c => c.send(JSON.stringify({ type: 'count', count })));
    }
    else if (['offer','answer','candidate'].includes(data.type)) {
      const code = ws.roomCode;
      if (!rooms[code]) return;
      rooms[code].forEach(c => {
        if (c !== ws) c.send(JSON.stringify(data));
      });
    }
  });

  ws.on('close', () => {
    if (ws.roomCode && rooms[ws.roomCode]) {
      rooms[ws.roomCode].delete(ws);
      const count = rooms[ws.roomCode].size;
      rooms[ws.roomCode].forEach(c => c.send(JSON.stringify({ type: 'count', count })));
      if (rooms[ws.roomCode].size === 0) delete rooms[ws.roomCode];
    }
  });
});

console.log('WebSocket signaling server running...');
