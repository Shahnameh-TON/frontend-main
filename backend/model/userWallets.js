const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userWalletsSchema = new Schema({
  "chatId" : {type : String, default:"", ref : "user_points",index:true },
  "username" : {type : String, default:"", ref : "user_points"},
  "walletSts"      :{ type:Number,default:0},
  "walletAddress"  :{ type:String,default:""},
  "balance"     :{ type:Number,default:0},
  "vesting"     :{ type:Number,default:0},
  "created_at" : {type : Date, default: Date.now}  
}, {"versionKey" : false});

module.exports = mongoose.model('user_wallets', userWalletsSchema, 'user_wallets');
