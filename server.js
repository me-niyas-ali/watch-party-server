const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // serve HTML in "public" folder

const rooms = {};

io.on('connection', socket => {
  console.log('New client connected');

  socket.on('joinRoom', room => {
    socket.join(room);
    if(!rooms[room]) rooms[room] = new Set();
    rooms[room].add(socket.id);

    io.to(room).emit('updateCount', rooms[room].size);
    console.log(`Room ${room} connected: ${rooms[room].size}`);
  });

  socket.on('play', data => socket.to(data.room).emit('play'));
  socket.on('pause', data => socket.to(data.room).emit('pause'));
  socket.on('videoURL', data => socket.to(data.room).emit('videoURL', data));
  socket.on('timeSync', data => socket.to(data.room).emit('timeSync', data));

  socket.on('disconnect', () => {
    for(let room in rooms){
      rooms[room].delete(socket.id);
      io.to(room).emit('updateCount', rooms[room].size);
    }
  });
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
