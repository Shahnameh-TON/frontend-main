const mongoose = require('mongoose');

let videoSchema = new mongoose.Schema({
  "title"    : { type:String, default:"", index:true },
  "points"    : { type:String, default:"", index:true },
  "video"    : { type:String, default:"", index:true },
  "duration"    : { type:Number, default: 0.00, index:true },
  "created_at": { type:Date, default:Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('videoManage', videoSchema, 'videoManage');