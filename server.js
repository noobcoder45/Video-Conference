const express = require('express')
const app = express()
const session=require('express-session')
const PORT = process.env.PORT || 3030;
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
const passport = require('passport');

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  // res.render('home')
  res.render('pages/auth')
  // res.redirect(`/${uuidV4()}`)
})

app.get('/room', (req,res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/board/:room', (_, res) => {
  res.render('whiteBoard')
})

app.get('/logout', (req, res) => {
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

    // socket.on('closeBoard',()=>{
    //   connections.forEach((con)=>{
    //     con.emit('boardClose')
    //   })
    // })
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

//authentication
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET' 
}));

// app.get(`/${uuidV4()}`, function(req, res) {
//   res.render('pages/auth');
// });

var userProfile;

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.get('/success', (req, res) => res.send(userProfile));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '912338031006-042ul6dqblg2p88efp2m3evmrj3s4fk9.apps.googleusercontent.com';

const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3030/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    //res.redirect('/success');
    res.render('home')
  });

server.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
