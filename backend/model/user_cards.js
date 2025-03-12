const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userCardsSchema = new Schema({
  "chatId"   : { type:String,default :'',index:true },
  "username"     : {type:String,default:''},
  "user_cards"  : [{
    level_acquired : {type : Number, default : 1},
    card_name : {type : String , default : "Test 1"},
  }],
  "created_at"     : { type: Date, default: Date.now },
  "updated_at"     : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('user_cards', userCardsSchema, 'user_cards');
