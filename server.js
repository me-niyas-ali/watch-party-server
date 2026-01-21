const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

const rooms = {};

io.on('connection', socket => {
  console.log('New connection:', socket.id);

  socket.on('joinRoom', room => {
    socket.join(room);
    if(!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    // Send all users to new user
    const otherUsers = rooms[room].filter(id => id !== socket.id);
    socket.emit('allUsers', otherUsers);

    // Broadcast count
    io.to(room).emit('updateCount', rooms[room].length);
  });

  // WebRTC signaling
  socket.on('offer', payload => io.to(payload.target).emit('offer', { sdp: payload.sdp, callerID: socket.id }));
  socket.on('answer', payload => io.to(payload.target).emit('answer', { sdp: payload.sdp, callerID: socket.id }));
  socket.on('ice-candidate', payload => io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, id: socket.id }));

  // Play/Pause
  socket.on('play', data => io.to(data.room).emit('play'));
  socket.on('pause', data => io.to(data.room).emit('pause'));

  socket.on('disconnect', () => {
    for(const room in rooms){
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      io.to(room).emit('updateCount', rooms[room].length);
    }
  });
});

http.listen(PORT, () => console.log('Server running on port', PORT));
