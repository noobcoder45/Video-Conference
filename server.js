const express = require('express')
const app = express()
const session=require('express-session')
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

const passport = require('passport');

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))
//authentication code

//
app.get('/', (req, res) => {
  res.render('pages/auth')
  // res.redirect(`/${uuidV4()}`)
})
app.get('/logout', (req, res) => {
  res.render('logout')
})
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
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
    res.redirect(`/${uuidV4()}`)
  });

server.listen(3030)
