const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let WordSchema = new Schema({
  "word"       : {type: String, default: ''},
  "createdAt"        :  {type: Date,default: Date.now}
}, {"versionKey" : false});

module.exports = mongoose.model('DailyWords', WordSchema, 'DailyWords');