const mongoose = require('mongoose');

let activitySchema = new mongoose.Schema({
  "admin_id"  : { type:mongoose.Schema.Types.ObjectId, ref:'admin',index:true },
  "M2T_Id"  : { type:String, default:"", index:true },
  "action"    : String,
  "created_at": { type:Date, default:Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('admin_activity', activitySchema, 'admin_activity');