const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let bankSchemadata = new Schema({
  "bank_name"            : {type: String, default: ''},
  "bank_image"    : {type: String, default: ''},
  "type"          : {type:String,default:''},
  "created_at": { type:Date, default:Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('bank_data', bankSchemadata, 'bank_data');