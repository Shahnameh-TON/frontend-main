const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rewardSchema = new Schema({
  "telegramAccount": {
    title: { type: String,},
    points: { type: Number}
  },
  "xAccount": {
    title: { type: String, },
    points: { type: Number, }
  },
  "exchangeAccount": {
    title: { type: String,},
    points: { type: Number}
  },
    "bankAccount": {
    title: { type: String,},
    points: { type: Number}
  },
  "invite": [{
    title: { type: String},
    referCount: { type: Number},
    points: { type: Number}
  }],
  "minigame": {
    title: { type: String},
    waitingTime: { hours: Number, minutes : Number, seconds : Number },
    gameTime: { hours: Number, minutes : Number, seconds : Number }
  },
  "created_at"     : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('Reward', rewardSchema, 'Reward');
