const express = require('express')
const app = express()
// const cors = require('cors')
// app.use(cors())
const server = require('http').Server(app)
const { Server } = require("socket.io");
const io = new Server(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

process.env.NODE_ENV = 'development';

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (_, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/board/:room', (_, res) => {
  res.render('whiteBoard')
})

app.get('/logout', (_, res) => {
  res.render('logout')
})
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

let connections = [];

io.on('connect', socket => {
  connections.push(socket)
  console.log(`${socket.id} connected`)

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
    })

    //whiteboardwindow
    socket.on('openBoard', () => {
      connections.forEach((con) => {
        con.emit('boardOpen')
      })
    })

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })

  socket.on('draw', (data) => {
    connections.forEach((con) => {
      if (con.id !== socket.id) {
        con.emit('onDraw', { x: data.x, y: data.y })
      }
    });
  });

  socket.on('erase', (data) => {
    connections.forEach((con) => {
      if(con.id !== socket.id) {
        con.emit('onErase', { x: data.x, y: data.y })
      }
    })
  })

  socket.on('clear', () => {
    connections.forEach((con) => {
      if(con.id !== socket.id) {
        con.emit('onClear')
      }
    })
  })

  socket.on('mouseDown', (data) => {
    connections.forEach((con) => {
      if (con.id != socket.id) {
        con.emit('onDown', { x: data.x, y: data.y })
      }
    })
  })

  socket.on('disconnect', () => {
    connections = connections.filter((con) => con.id !== socket.id)
  })
})

server.listen(3030, () => console.log('server started on http://localhost:3030'))
