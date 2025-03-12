const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const selectedComboSchema = new Schema({
  "combos": {type:Array} ,
  "createdAt": { type: Date, default: Date.now },
},{"versionKey":false});

module.exports = mongoose.model('selected_combo', selectedComboSchema, 'selected_combo');