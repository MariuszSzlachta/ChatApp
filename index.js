const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const UserService = require('./UserService');

const userService = new UserService();

app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
})

io.on('connection', function(socket){
  //funkcje wykonane po podłączeniu kleinta
  socket.on('join', function(name){
    //odczyt z LS a jak nie ma to addUser
    userService.addUser({
      id: socket.id,
      name
    });
    io.emit('update', {
      users: userService.getAllUsers()
    });
  });

  // socket.on('disconnect', () => {
  //   userService.removeUser(socket.id);
  //   socket.broadcast.emit('update', {
  //     // zapisywanie do LS 
  //     users: userService.getAllUsers()
  //   });
  // });

  io.on('connection', function(socket){
    socket.on('message', function(message){
      const {name} = userService.getUserById(socket.id);
      socket.broadcast.emit('message', {
        text: message.text,
        from: name
      })
    })
  })
});

server.listen(3000, function(){
  console.log('listening on *:3000');
})