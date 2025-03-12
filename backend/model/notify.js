const mongoose = require('mongoose');

let activitySchema = new mongoose.Schema({
  "message"    : { type:String, default:"", index:true },
  "created_at": { type:Date, default:Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('userNotify', activitySchema, 'userNotify');