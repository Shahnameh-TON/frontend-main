const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let dailyRewardSchema = new Schema({
  "rewards"  : [{
    day : {type : String, default : ''},
    reward_short_name : {type : String , default : ''},
    reward_points : {type: Number, default: 0},
  }],
  "created_at"     : { type: Date, default: Date.now },
  "updated_at"     : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('daily_rewards', dailyRewardSchema, 'daily_rewards');