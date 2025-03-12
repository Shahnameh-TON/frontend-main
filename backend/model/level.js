const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let levelSchema = new Schema({
  "level"            : {type: Number, default: 1},
  "level_name"       : {type: String, default: ''},
  "image_name"       : {type: String, default: ''},
  "formatted_name"   : {type: String, default: ''},
  "points_from"      : {type: Number, default: 0},
  "points_upto"      : {type: Number, default: 0},
  "energy_level"     : {type: Number, default: 0},
  "tap_level"        : {type: Number, default: 0}
}, {"versionKey" : false});

module.exports = mongoose.model('levels', levelSchema, 'levels');