const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let energyLevelSchema = new Schema({
  "level"            : {type: Number, default: 1},
  "needed_points"    : {type: Number, default: 2000},
  "energy_level"        : {type: Number, default: 500}
}, {"versionKey" : false});

module.exports = mongoose.model('energy_limit', energyLevelSchema, 'energy_limit');