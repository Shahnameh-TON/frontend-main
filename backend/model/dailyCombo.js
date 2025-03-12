const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let dailyComboSchema = new Schema({
  "level_name"   : { type:String,default :''},
  "category"     : {type:String,default:''},
  "image"        : { type:String ,default:''},
  "description"  : {type:String,default:''},
  "card_levels"  : [{
    level : {type : Number, default : 0},
    overall_profit : {type : Number , default : 0},
    profit_per_hour : {type: Number, default: 0},
    description: {type:String,default:''}
  }],
  "created_at"     : { type: Date, default: Date.now },
  "updated_at"     : { type: Date, default: Date.now },
}, {"versionKey" : false});

module.exports = mongoose.model('daily_combo', dailyComboSchema, 'daily_combo');