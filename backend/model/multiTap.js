const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let multiTapSchema = new Schema({
  "level"            : {type: Number, default: 1},
  "needed_points"    : {type: Number, default: 2000},
  "tap_level"        : {type: Number, default: 1}
}, {"versionKey" : false});

module.exports = mongoose.model('multitap', multiTapSchema, 'multitap');