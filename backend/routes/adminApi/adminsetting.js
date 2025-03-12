var express = require('express');
var router = express.Router();
var useragent = require('useragent');
var async = require('async');
var validator = require('validator');
var moment = require('moment');
// var multer  = require('multer');
// const axios = require('axios');
const mongoose = require('mongoose');

// helpers
var common = require('../../helpers/common');
var encdec = require('../../helpers/encrypt');

// model
var admin = require('../../model/admin');
var settings = require('../../model/siteSettings');

// SITE SETTING
router.get('/settings', async (req,res) => {
	var resData = await settings.findOne({}).exec();
	if(resData){
		res.json({status : true, data : resData });
	} else {
		return res.json({status : false});
	}
})

// UPDATE SITE SETTING
router.post('/site_settings', common.originMiddle, async (req, res, next) => {
	let info = req.body;var admId=req.userId;
	info.updated_at=updatedDate();
	info.site_mode = (info.sitemode == "true") ? 0 : 1 ;
	delete info.sitemode

	var resData = await settings.updateOne({},{$set : info}).exec();
	if(resData){
		common.adminact(admId,'','Updating site settings',function(details) {
				if(details==1){ res.json({ status : true, msg : "Succesfully updated", data:info }); 
				}else{ res.json({status:false,msg:"Invalid Request"}) }
			})	
	} else {
		res.json({ status : false, msg : "Something went wrong. Please try again" });
	}
})

let updatedDate = ()=>{
	return new Date();
};


router.post("/patternOld", common.tokenMiddleware,async (req, res) => {
	console.log(req.body)
    let pattern = req.body.pattern;
    let adminId= req.body.adminId;
    let AdminId = req.userId;

    console.log(`Received pattern: ${pattern}`);
    console.log(`Admin ID: ${AdminId}`);

    try {
        var oldData = await admin.findOne({_id: AdminId}).exec();
        console.log(`Retrieved Admin Data: ${JSON.stringify(oldData)}`);

        if (oldData) {
            var decptPattern = encdec.decryptNew(oldData.pattern);
            console.log(`Decrypted Pattern from DB: ${decptPattern}`);

            if (pattern == decptPattern) {
                console.log('Old pattern matched');
                res.json({status: 1, msg: "Old pattern is matched"});
            } else {
                console.log('Old pattern did not match');
                res.json({status: 0, msg: "Old pattern is not matched"});
            }
        } else {
            console.log('Admin data not found');
            res.json({status: 0, msg: "Try again"});
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        res.status(500).send(err);
    }
});

// router.post("/patternOld", common.originMiddle,async (req, res) => {
// 	let pattern = req.body.pattern;
// 	let AdminId = req.userId;
// 	var oldData = await admin.findOne({_id: AdminId}).exec();
// 	if(oldData){
// 		var decptPattern=encdec.decryptNew(oldData.pattern);
// 		console.log(decptPattern)
// 		if(pattern==decptPattern){
// 			res.json({status : 1, msg:"old patterm is matched"});
// 		}else {
// 			res.json({status : 0, msg:"old password is not-matched"});
// 		}
// 	} else {
// 		res.json({status : 0,msg:"Try again"});
// 	}	
// });

router.post("/changepattern", common.tokenMiddleware,async (req, res) => {
	let id = req.userId;let info = req.body; var admId=req.userId

	var resData = await admin.findOne({_id:id}).exec();
	if(resData) {
		if(info.confirmPattern!==null &&  info.confirmPattern!==undefined){
			let pattern=encdec.decryptNew(resData.pattern);
			if(pattern === info.confirmPattern){
				return  res.json({status:0,msg:"old pattern is equal to new match"});
			} else {
				let ptn=encdec.encryptNew(info.confirmPattern)
				let obj={ "pattern" : ptn ,modifiedDate:updatedDate()};
				var respat = await admin.updateOne({"_id":id},{$set:obj}).exec();
					if(respat){
						common.adminact(admId,'','change pattern',function(details) {
								if(details==1){
									res.json({status : 1, msg:"Admin password changed Successfully"});
								}else{
									res.json({status:0,msg:"Try Again Later"})
								}
							})
					} else {
						res.json({status : 0, msg:"Somthing wents wrong !"});
					}
			}
		} else {
			res.json({status:0, msg : "change-pattern is invalid !"});
		}
	}else {
		res.json({status:0, msg : "admin undefined !"});
	}
})

// PASSWORD

router.post("/oldpassCheck", common.tokenMiddleware,async (req, res) => {
	let oldpassword = encdec.encryptNew(req.body.password);
	var oldData = await admin.findOne({_id:req.userId,ownerkey: oldpassword}).exec();
	if(oldData) {
		return res.json({status : 1, msg:"old password is matched"});
	} else {
		return res.json({status : 0});
	}
	
});

router.post("/changePassword", common.tokenMiddleware, async (req, res) =>{
	let id = req.userId;var admId=req.userId;var info = req.body;

	var resData = await admin.findOne({_id:id}).exec();
	if(resData){

		if(resData){
		    if(info.confirmPassword !== undefined && info.newPassword !== undefined && info.oldPassword !== undefined && info.confirmPassword !== null && info.newPassword !== null && info.oldPassword !== null){
		      	if(info.confirmPassword.toString().length > 0 && info.newPassword.toString().length > 0 && info.oldPassword.toString().length > 0){
					let oldPass = encdec.encryptNew(info.oldPassword);
					var oldData = await admin.findOne({ownerkey: oldPass}).exec()
						if(oldData){
						    let lowerChars = /[a-z]/g; let upperChars = /[A-Z]/g; let numbers = /[0-9]/g; let specials = /\W|_/g;						    
						    if(info.newPassword.toString().length >= 8 && info.newPassword.match(lowerChars) && info.newPassword.match(upperChars) && info.newPassword.match(numbers) && info.newPassword.match(specials)){
								if(info.newPassword == info.confirmPassword){
									let newPass = encdec.encryptNew(info.newPassword);
									var newData = await admin.findOne({ownerkey: newPass}).exec();
										if(newData){
											res.json({status : 0, msg:"The new password is already use"});
										}else{
											let obj = { "ownerkey" : newPass,modifiedDate:updatedDate()};
											var resetPass = await admin.updateOne({_id:id},{ "$set": obj }).exec();
												if(resetPass){
													common.adminact(admId,'','change password',function(details) {
														if(details==1){
															res.json({status : 1, msg:"Admin password changed Successfully"});
														}else{
															res.json({status:0,msg:"Try Again Later"})
														}
													})
												}else{
													res.json({status : 0, msg:"Somthing wents wrong !"});
												}
											
										}
									
								}else{
									res.json({status : 0, msg:"Password does not match"});
								}
						    }else{
						    	res.json({status : 0, msg:"Invalid password"});
							}
						}else{
							res.json({status : 0, msg:"The old password is wrong"});
						}
					
		      	}else{
		      		res.json({status:0, msg : "change-password is invalid !"});
		      	}
		  	}else{
				res.json({status:0, msg : "change-password is invalid !"});
		  	}
		}else{
			res.json({status:0, msg : "admin undefined !"});
		}


	}
})

router.post("/changePassword", common.userVerify, (req, res) => {
	let id = req.userId;var admId=req.userId;var info = req.body;

	admin.findOne({_id:id}).exec(function(resErr,resData){
		if(resData){
		    if(info.confirmPassword !== undefined && info.newPassword !== undefined && info.oldPassword !== undefined && info.confirmPassword !== null && info.newPassword !== null && info.oldPassword !== null){
		      	if(info.confirmPassword.toString().length > 0 && info.newPassword.toString().length > 0 && info.oldPassword.toString().length > 0){
					let oldPass = encdec.encryptNew(info.oldPassword);
					admin.findOne({ownerkey: oldPass}).exec(function(oldErr, oldData){
						if(oldData){
						    let lowerChars = /[a-z]/g; let upperChars = /[A-Z]/g; let numbers = /[0-9]/g; let specials = /\W|_/g;						    
						    if(info.newPassword.toString().length >= 8 && info.newPassword.match(lowerChars) && info.newPassword.match(upperChars) && info.newPassword.match(numbers) && info.newPassword.match(specials)){
								if(info.newPassword == info.confirmPassword){
									let newPass = encdec.encryptNew(info.newPassword);
									admin.findOne({ownerkey: newPass}).exec(function(newErr, newData){
										if(newData){
											res.json({status : 0, msg:"The new password is already use"});
										}else{
											let obj = { "ownerkey" : newPass,modifiedDate:updatedDate()};
											admin.updateOne({_id:id},{ "$set": obj }).exec(function(resetErr, resetPass){
												if(resetPass){
													common.adminact(admId,'','change password',function(details) {
														if(details==1){
															res.json({status : 1, msg:"Admin password changed Successfully"});
														}else{
															res.json({status:0,msg:"Try Again Later"})
														}
													})
												}else{
													res.json({status : 0, msg:"Somthing wents wrong !"});
												}
											})
										}
									})
								}else{
									res.json({status : 0, msg:"Password does not match"});
								}
						    }else{
						    	res.json({status : 0, msg:"Invalid password"});
							}
						}else{
							res.json({status : 0, msg:"The old password is wrong"});
						}
					})
		      	}else{
		      		res.json({status:0, msg : "change-password is invalid !"});
		      	}
		  	}else{
				res.json({status:0, msg : "change-password is invalid !"});
		  	}
		}else{
			res.json({status:0, msg : "admin undefined !"});
		}
	})
});

module.exports = router;