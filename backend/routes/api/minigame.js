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

// miniGame.collection.dropIndex('chatId_1')
//   .then(result => {
//     console.log('Index dropped:', result);
//   })
//   .catch(err => {
//     console.error('Error dropping index:', err);
//   });


router.post("/createUserGame",common.originMiddle, async (req, res) => {
	try{
		let seconds = 40;
		const info = req.body;
		let currentDate = new Date();

		let miniGames = await miniGame.findOne({chatId:info.chatId}).exec();
		if(!miniGames){
			info.game_start_time = new Date(currentDate);
			currentDate.setSeconds(currentDate.getSeconds() + seconds);
			info.game_end_time = new Date(currentDate);

			let userMiniGame = await miniGame.create(info);
			if(userMiniGame){
				res.json({status : 1, msg : "Minigame Inserted Successfully"});
			}else{
				res.json({status : 0, msg : "Something went wrong"});
			}
		}else{
			let startdate = new Date(currentDate);
			currentDate.setSeconds(currentDate.getSeconds() + seconds);
			addedTime = new Date(currentDate);
			let updation = {
				game_start_time : startdate,
				game_end_time : addedTime,
				game_status : info.game_status 
			}
			let updateMinigame = await miniGame.updateOne({chatId:info.chatId},updation).exec();
			if(updateMinigame){
				res.json({status : 1, msg : "Minigame Updated Successfully"});
			}else{
				res.json({status : 0, msg : "Something went wrong"});
			}
		}
	}catch(error){
    	console.error('Error creating user minigame', error);
		res.json({status : 0, msg : error.message})
	}
})


router.post("/updateGameSts",common.originMiddle, async (req, res) => {
	try{
		const info = req.body;

		let updation = {game_status : info.gameSts};
		let miniGames = await miniGame.updateOne({chatId:info.chatId},updation).exec();
		if(miniGames){
			if(info.gameSts == 2){
				let updateKey = await userPoints.updateOne({chatId:info.chatId}, {$inc : {key : 1}});
				if(updateKey){
					res.json({status : 1, msg : "Key Rewarded Successfully", keyCredited : true});
				}else{
					res.json({status : 0, msg : "Something went wrong"});
				}
			}else{
				res.json({status : 1, msg : "Game Status Updated Successfully"});
			}
		}else{
			res.json({status : 0, msg : "Something went wrong"});
		}
	}catch(error){
    	console.error('Error updating minigame status', error);
		res.json({status : 0, msg : "Something Went Wrong"})
	}
})

module.exports = router;
