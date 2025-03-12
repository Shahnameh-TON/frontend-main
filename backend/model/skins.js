const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skinsSchema = new Schema({
  "skin": [{
    gender : { type : String, default : ""},
    image: { type: String, default : ""},
    level_needed: { type: Number},
    required_points: { type: Number},
    character_name : {type : String, default : ""}, 
    description : {type :String , default : ""}
  }]
}, {"versionKey" : false});

module.exports = mongoose.model('Skins', skinsSchema, 'Skins');

