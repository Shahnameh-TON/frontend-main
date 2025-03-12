const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let miniGameSchema = new Schema({
	"chatId" : {type : String, ref : "user_points",index:true },
	"username" : {type : String, ref : "user_points"},
	"game_start_time" : {type : Date, default : ""},
	"game_end_time" : {type : Date, default : ""},
	"game_status" : {type : Number , default : 0},
	"created_at" : {type : Date, default: Date.now},
	"updated_at" : {type : Date, default: Date.now},
}, {"versionKey" : false});

module.exports = mongoose.model("minigame", miniGameSchema);
