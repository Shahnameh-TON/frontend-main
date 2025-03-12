const mongoose = require('mongoose');
const common = require('../../helpers/common');
const express = require('express');
const moment = require('moment');

let router = express.Router();

const level = require('../../model/level');
var bankdata = require('../../model/bankdata');
const userPoints = require('../../model/userPoints');
const dailyReward = require('../../model/dailyReward');
const multiTap = require('../../model/multiTap');
const video = require('../../model/videomanage');
const dailycombo = require('../../model/dailyCombo');
const energyLevel = require('../../model/energyLevel');
const dailyword = require('../../model/dailyWords');
const cipherMatch = require('../../model/cipherMatch');
const rewards = require('../../model/reward');
const manageRewards = require('../../model/reward');
const skins = require('../../model/skins');
const miniGame = require('../../model/miniGame');
const userSkins = require('../../model/user_skins');
const userCards = require('../../model/user_cards');
const userWallet = require('../../model/userWallets');
const selectedCombo = require('../../model/selectedCombo');

const { updateSkin } = require('./skin.js');


router.post('/getLevelInfo', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
   	let project = {_id : 0, created_at : 0, updated_at : 0,reward_start_date : 0,last_claimed_date : 0 , next_day : 0, prev_day : 0};
		let user = await userPoints.findOne({$and:[{chatId:info.chatId}]},project).exec();
		if(user) {
			user.username = await common.decryptParams(user.username);
        	user.chatId = await common.decryptParams(user.chatId);
			res.json({status : 1, userLevel : user});
		} else {
			res.json({status : 0, msg:'User Not Exists'});	
		}
	} catch(error) {
		console.log("Error Getting Level Info",error);		
		res.json({status:0, msg:error.message});
	}
})

router.get('/getLevel', async (req,res) => {
	try{
		let project = {_id  : 0 ,tap_level : 0};
	  	let levels = await level.find({},project).exec();
	  	if(levels) {
	   		res.json({status : 1, levels : levels});
	  	} else {
	    	res.json({status : 0, msg:'Levels Not Exists'}); 
	   	}
	} catch(error) {
		res.json({status:0, msg:"Something went wrong"});
	}
})

router.post('/getAllUser', common.originMiddle, async (req,res) => {
	try{
		let info = req.body;
		let level = info.level;
		let project = {_id : 0, created_at : 0, updated_at : 0,reward_start_date : 0,last_claimed_date : 0 , next_day : 0, prev_day : 0, tap_energy_level : 0,tap_energy : 0};
		let sort = {combo_profit : "desc"};
		let userList = await userPoints.find({level : level},project).sort(sort).limit(15).exec();
		if(userList) {
			userList.map((user) => {
				user.username = common.decryptParams(user.username)
				user.chatId = common.decryptParams(user.chatId)
			})
			res.json({status : 1, levelUser : userList});
		} else {
			res.json({status : 0, msg:'User Not Exists'});	
		}
	} catch(error) {
		console.log("Error Getting All User",error);
		res.json({status:0, msg:error.message});
	}
})

module.exports = router;

