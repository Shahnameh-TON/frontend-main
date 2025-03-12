const mongoose = require( 'mongoose' );
const path = require('path');


//node packages

const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require("fs");
const http = require('http');
const https = require('https')
const socketio = require('socket.io');
const port = process.env.PORT;
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//db connection
const datas = require("./model/datas");


// user api routes
const userApi = require('./routes/api/userApi');
const airdrop =  require('./routes/api/airdrop');
const boost = require('./routes/api/boost');
const cipher =  require('./routes/api/cipher');
const commonApi =  require('./routes/api/commonApi');
const combo = require('./routes/api/combo');
const miniGame =  require('./routes/api/minigame');
const morecoins =  require('./routes/api/morecoins');
const referral =  require('./routes/api/referral');
const settings =  require('./routes/api/settings');
const { router } =  require('./routes/api/skin');
const level =  require('./routes/api/level');

//admin api
const admin = require('./routes/adminApi/admin');
const users = require('./routes/adminApi/users');
const adm_sett = require('./routes/adminApi/adminsetting');




var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.set('port', port);

app.use('/basic', userApi);
app.use('/airdrop', airdrop);
app.use('/boost', boost);
app.use('/cipher', cipher);
app.use('/combo', combo);
app.use('/common', commonApi);
app.use('/minigame', miniGame);
app.use('/morecoins', morecoins);
app.use('/referral', referral);
app.use('/settings', settings);
app.use('/skin', router);
app.use('/level', level);

app.use('/admin',admin)
app.use('/users',users)
app.use('/adm',adm_sett)

var server;


//process envi
if(process.env.NODE_ENV == 'production'){
  var credentials = {
    key: fs.readFileSync('config/wcx_exchange.key'),
    cert: fs.readFileSync('config/wcx_exchange.crt')
  };

  var server = https.createServer(credentials, app);
  server.listen(port, () => {
    console.log('Checks - HTTPS Server running on port '+port);
  });
} else {
  var server = http.createServer(app);
  server.listen(port, () => {
    console.log('HTTP Server running on port '+port);
  });
}


app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.json = err.message;
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
});

/*------------- SOCKET --------------------*/
var io = require('socket.io')(server,{
  cors: {
    origin: ['http://192.168.1.122:4200','http://localhost:4200',"https://khabat.hivelancetech.com","https://khabatad.hivelancetech.com", "https://game.shahnameh-bot.io", "https://admin.shahnameh-bot.io", "http://192.168.1.177:4200" ,"http://3.7.57.218" , "http://13.234.77.219","https://khabatprod.hivelancetech.com" , "https://khabatprodad.hivelancetech.com","https://game.shahnameh-bot.io","https://admin.shahnameh-bot.io"],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

let userHelper = require('./helpers/userScore');
userHelper.SocketInit(io);
const userIntervals = {};

 
io.on('connection', function (socket) {

  socket.handshake.headers['Access-Control-Allow-Origin'] = ['http://192.168.1.122:4200', 'http://localhost:4200',"https://khabat.hivelancetech.com","https://khabatad.hivelancetech.com" , "https://game.shahnameh-bot.io", "https://admin.shahnameh-bot.io", "http://192.168.1.177:4200","http://3.7.57.218" , "http://13.234.77.219" , "https://khabatprod.hivelancetech.com" , "https://khabatprodad.hivelancetech.com","https://game.shahnameh-bot.io","https://admin.shahnameh-bot.io"];
  socket.on('updateUserScore', function (data) {
    userHelper.updateUserScore(data, socket);
  })

  socket.on('updateEnergy', function (data) {
    userHelper.updateEnergy(data, socket);
  })

  socket.on('checkCipher', function (data) {
    userHelper.checkCipher(data, socket);
  })

  socket.on('startAwardingPoints', (data) => {
    const { username, chatId } = data;

    if (userIntervals[username]) {
      clearInterval(userIntervals[username]);
    }

    userIntervals[username] = setInterval(() => {
     userHelper.awardOnePoint({ username, chatId }, socket);
    }, 3000);
  });

  socket.on('stopAwardingPoints', (data) => {
    const { username } = data;

    if (userIntervals[username]) {
      clearInterval(userIntervals[username]);
      delete userIntervals[username];
    }
  });

});


module.exports = app;
