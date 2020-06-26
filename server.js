const nodemon = require("nodemon");
const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'TrebilCord Bot'

//when the root url is visited it will run the code bellow
io.on('connection', socket => {

  //

  socket.on('joinRoom', ({ username, room }) => {

    const user = userJoin(socket.id, username, room)

    socket.join(user.room);

    // runs when a client connects and only for the current connection
    socket.emit('message', formatMessage(botName, 'Welcome to Trebilcord'));

    // Broadcast to all, but the one that broadcasts, when a user connects
    socket.broadcast
    .to(user.room)
    .emit(
      'message',
       formatMessage(botName, `${user.username} has joined the chat`)); 
       
    //send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  //runs when client disconnects
  socket.on('disconnect', () => {

    const user = userLeaves(socket.id);

    if (user) {
      // this is for all the clients including the one that connects
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)    
      );

      //send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }   
  });

  //Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });
})
  


const PORT = 3000 || process.env.PORT

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});