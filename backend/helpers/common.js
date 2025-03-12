const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const adminActivity = require('../model/adminActivity');
const fiveLetterWords = require('../words');

const bip39 = require('bip39');
const crypto = require('crypto');

let Key = 'N4^rU@lOs%#Y@eW!7Fc9S>';
let iv  = "DkJdYdPIQxsEgMcbGkaJr";
Key = CryptoJS.enc.Base64.parse(Key);
iv = CryptoJS.enc.Base64.parse(iv);

let socket = 0;

exports.SocketInit = function (socketIO) { socket = socketIO; }

// var orgArrVal = ["http://localhost:4200","http://192.168.1.122:4200", 'http://192.168.1.108:4200',"https://ichigeki.hivelancetech.com","https://ichigekiad.hivelancetech.com","http://192.168.1.177:4200"];


var orgArrVal = ["http://localhost:4200","http://192.168.1.122:4200", "https://khabat.hivelancetech.com","https://khabatad.hivelancetech.com", "https://game.shahnameh-bot.io", "https://admin.shahnameh-bot.io", "http://192.168.1.177:4200" ,"http://3.7.57.218" , "http://13.234.77.219","https://khabatprod.hivelancetech.com" , "https://khabatprodad.hivelancetech.com","https://game.shahnameh-bot.io","https://admin.shahnameh-bot.io"];

exports.randomString = function(len){
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function getFiveLetterWordsFromMnemonic() {
  const mnemonic = bip39.entropyToMnemonic(crypto.randomBytes(32));
  const mnemonicWords = mnemonic.split(' ');
  const fiveLetterWords = mnemonicWords.filter(word => word.length === 5);
  return fiveLetterWords;
}
exports.getFiveLetterWordsFromMnemonic =getFiveLetterWordsFromMnemonic;



function getRandomFiveLetterWord() {
  const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
  return fiveLetterWords[randomIndex];
}
exports.getRandomFiveLetterWord =getRandomFiveLetterWord;

decryptParams = exports.decryptParams = (param) => {
  try{
    if(param){
      let decodedParam = decodeURIComponent(param);

      let ciphertext = CryptoJS.AES.decrypt(param.toString(), Key, {iv : iv});
      let originalText = ciphertext.toString(CryptoJS.enc.Utf8);
      if (!originalText) {
        throw new Error("Decryption failed");
      }    
      return originalText;
    } else{
      return null
    }
  } catch (error) {
    return null;
  }
}

decodeParams = exports.decodeParams = (param) => {
    return decodeURIComponent(param);
}

encryptParams= exports.encryptParams = (param) => {
  let ciphertext = CryptoJS.AES.encrypt(param, Key, {iv : iv}).toString();
  let encodedCipherText = encodeURIComponent(ciphertext);
  return encodedCipherText;
}
 
exports.originMiddle = (req, res, next) => {
  try{
  	let origin = req.headers['origin'];
  	let index = orgArrVal.indexOf(origin);
  	if(index > -1) {
    	next();
  	} else {
	    return res.json({status:401, msg:"Access Denied"});
  	}
  }catch(error){
    return res.json({status:401, msg:"Access Denied"});
  }
}


exports.tokenMiddleware = (req, res, next) => {
  var key2 = 'Zysyf2r571t#4*!dk3Md7m';
    try {
        const origin = req.headers['origin'];
        const index = orgArrVal.indexOf(origin);

        if (index > -1) {
            let token = req.headers['x-access-token'] || req.headers['authorization'];
            if (!token) {
                return res.status(401).json({ msg: "Please login to continue" });
            }

            token = token.split(' ')[1];

            if (token === 'null') {
                return res.status(401).json({ msg: "Please login to continue" });
            } else {
                try {
                    const payload = jwt.verify(token, key2);
                    if (payload.WigrNvGUomqlDeK === "Fux3NiHaRidfaSuDhanPOsfnfaoISF21") {
                        req.userId = payload.secret;
                        next();
                    } else {
                        return res.status(401).json({ msg: "Please login to continue" });
                    }
                } catch (e) {
                    console.error("Token verification error:", e);
                    return res.status(401).json({ msg: "Please login to continue" });
                }
            }
        } else {
            return res.status(401).json({ msg: "Please login to continue" });
        }
    } catch (error) {
        console.error("Middleware error:", error);
        return res.status(401).json({ msg: "Access Denied" });
    }
};


// exports.tokenMiddleware = (req,res,next) => {
//   try{
//   	let origin = req.headers['origin'];
//   	let index = orgArrVal.indexOf(origin);
//   	if(index > -1) {
//     	let token = req.headers['x-access-token'] || req.headers['authorization'];
//     	if(!token){
//       		return res.json({status:401, msg:"please login to continue"});
//     	}
//     	token = token.split(' ')[1];
//     	if(token === 'null'){
//       		return res.json({status:401, msg:"please login to continue"});
//     	} else {
//       		try {
//         		let payload = jwt.verify(token, Key);
//         		if(!payload){
//           			return res.json({status:401, msg:"please login to continue"});
//         		}
//         		if(payload.WigrNvGUomqlDeK == "Fux3NiHaRidfaSuDhanPOsfnfaoISF21") {
//           			req.userId = payload.secret;
//           			next();
//         		} else {
//           			return res.json({status:401, msg:"please login to continue"});
//         		}
//       		} catch(e) {
//         		return res.json({status:401, msg:"please login to continue"});
//       		}
//     	}
//   	} else {
//     	return res.json({status:401, msg:"please login to continue"});
//   	}
//   }catch(error){
//     return res.json({status:401, msg:"Access Denied"});
//   }
// }


exports.userVerify = (req,res,next) => {
  try{
  	let origin = req.headers['origin'];
  	let index = orgArrVal.indexOf(origin);

  	if(index > -1) {
    	let token = req.headers['x-access-token'] || req.headers['authorization'];
    	if(!token){
      		return res.json({status:401, msg:"please login to continue"});
    	}
    	token = token.split(' ')[1];
	    if(token === 'null'){
      		return res.json({status:401, msg:"please login to continue"});
    	} else {
      		try {
        		let payload = jwt.verify(token, Key)
        		if(!payload){
          			return res.json({status:401, msg:"please login to continue"});
        		}
        		if(payload.WigrNvGUomqlDeK == "Fux3NiHaRidfaSuDhanPOsfnfaoISF21") {
          			req.userId = payload.secret;
          			next();
        		} else {
          			return res.json({status:401, msg:"please login to continue"});
        		}
      		} catch(e) {
        		return res.json({status:401, msg:"please login to continue"});
      		}
    	}
  	} else {
    	return res.json({status:401, msg:"please login to continue"});
  	}
  }catch(error){
    return res.json({status:401, msg:"Access Denied"});
  }
}


exports.createPayload = (key) => {
    const Key = 'Zysyf2r571t#4*!dk3Md7m'; 
    let payload = {
        secret: key,
        WigrNvGUomqlDeK: "Fux3NiHaRidfaSuDhanPOsfnfaoISF21"
    };
    try {
        let token = jwt.sign(payload, Key, { expiresIn: 180 * 60 });
        return token;
    } catch (error) {
        console.error('Error signing token:', error);
        throw error;
    }
  // try{
  // 	let payload = { secret:key, WigrNvGUomqlDeK: "Fux3NiHaRidfaSuDhanPOsfnfaoISF21" }
  // 	let token = jwt.sign(payload, Key, { expiresIn:180 * 60 });
  // 	return token; 
  // }catch(error){
  //   return res.json({status:401, msg:"Access Denied"});
  // }   
}


exports.adminact = function(admin_id, id,action,callback){
 	var obj={ admin_id : admin_id , M2T_Id : id , action : action }
  	adminActivity.create(obj).then((result) =>{
		if(result){
  			callback(1)
  		}else{
  			callback(o)
  		}
  	}).catch((error) => {
  		callback(0)
  	})
}

