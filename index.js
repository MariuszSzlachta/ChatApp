const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const UserService = require('./UserService');

const userService = new UserService();
//for session storage

const session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
});
const sharedsession = require("express-socket.io-session");

app.use(session);

io.use(sharedsession(session));

app.use(express.static(__dirname + '/public'));

// ghdyby były przekierowania tutaj byłby może odczytywał cookie i od razu przekierowywał na czat gdzie ustawiałbym nazwe uzytkownia 
// tyle ze jest to zapytanie GET a nie POST więc ja nic nie wysyłam do serwera prócz prośby o zwrócenie index.html
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
})

io.on('connection', function(socket){
  //funkcje wykonane po podłączeniu kleinta
  socket.on('join', function(name){
    // sprawdzam czy nicka już nie ma w sesji jesli nie ma to tworze sesje i dodaje użytkownika do userService
    if (socket.handshake.session.userdata !== name){
      socket.handshake.session.userName = name;
      socket.handshake.session.userSessionID = session.id;
      socket.handshake.session.save();
      userService.addUser({
        id: socket.id,
        name: name
      });
    } else {

      //niby spoko ale powiela użytkownika tylko
      userService.addUser({
        id: socket.handshake.session.userSessionID,
        name: socket.handshake.session.userName
      });
    }
    console.log(userService.users)
    //Musze przeszukać UserService.users czy jest tam name taki jak usedata jeśli jest to ustawiam nick taki jak z userservice a nie ten z name
    

    
    

    //odczyt z LS a jak nie ma to addUser
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