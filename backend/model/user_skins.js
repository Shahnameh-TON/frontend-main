const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSkinsSchema = new Schema({
  "chatId" : {type : String, ref : "user_points",index:true},
  "username" : {type : String, ref : "user_points"},
  "user_skins": [{
    image: { type: String},
    name: { type: String},
    is_selected: { type: Number},
    is_acquired: { type: Number}
  }],
  "created_at" : {type : Date, default: Date.now}  
}, {"versionKey" : false});

module.exports = mongoose.model('user_skins', userSkinsSchema, 'user_skins');
