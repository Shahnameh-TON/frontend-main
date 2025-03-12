const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let cipherMatchSchema = new Schema({
	"match" : [{
		letter : {type : String, default : ""},
		cipher : {type : String, default : ""}
	}],
	"created_at" : {type : Date, default: Date.now},
	"updated_at" : {type : Date, default: Date.now},
}, {"versionKey" : false});	

module.exports = mongoose.model("cipher_match", cipherMatchSchema);							
