const mongoose = require('mongoose');
const common = require('../../helpers/common');
const express = require('express');

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

let getCurrentDate = () => {
    let currentDate = new Date();
    return currentDate;
}


router.post('/updateFullEnergy', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
   	let project = {_id : 0, created_at : 0, updated_at : 0};
		let user = await userPoints.findOne({$and:[{chatId:info.chatId}]},project).exec();
		if(user) {
			if(user.full_energy_count > 0){
				var cur_energy = user.tap_energy_level;
				let updation = { current_energy: cur_energy, full_energy_count : user.full_energy_count -1 , full_energy_created_at : getCurrentDate() };
				let updateScore = await userPoints.updateOne({chatId : info.chatId},updation).exec();
				res.json({status : 1, msg: "Updated" ,data : updateScore});
			} else{
				res.json({status : 0, msg: "Full Energy Count Exceeded"});
			}
		} 
	} catch(error) {
		console.log("Error updating Full Energy", error);
		res.json({status:0, msg:error.message});
	}
});


router.post('/checkFullEnergy', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
   	let project = {_id : 0, created_at : 0, updated_at : 0};
		let user = await userPoints.findOne({$and:[{chatId:info.chatId}]},project).exec();
		if(user) {
			let currDate = getCurrentDate();
			currDate = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
			let refilledDate = new Date(user.full_energy_refilled_at.getFullYear(), user.full_energy_refilled_at.getMonth(), user.full_energy_refilled_at.getDate());
			if(refilledDate.getTime() != currDate.getTime()){
				let updation = { full_energy_count : 6 , full_energy_refilled_at : getCurrentDate() };
				let updateScore = await userPoints.updateOne({chatId : info.chatId},updation).exec();
				res.json({status : 1, msg: "Today's Full Energy Credited"});
			}else{
				res.json({status :0 , msg : "Today's Full Energy Already Credited"})
			}
		} else{
			res.json({status : 0, msg: "Full Energy Count Exceeded"});
		}
	} catch(error) {
		console.log("Error checking Full Energy", error);		
		res.json({status:0, msg:error.message});
	}
});

router.post('/getUserInfo', common.originMiddle, async (req,res) => {
	try{
    let info = req.body;
		let project = {_id : 0, created_at : 0, updated_at : 0};
		let user = await userPoints.findOne({$and:[{chatId:info.chatId}]},project).exec();
		if(user) {
			user.username = await common.decryptParams(user.username)
			user.chatId = await common.decryptParams(user.chatId)
			let userLevel = await level.aggregate([{'$match': {'$expr': { '$and': [ { '$gte': [user.points, '$points_from'] }, {'$lte': [ user.points, '$points_upto' ] }]}}},{'$project' : {_id : 0}}]).exec();
			
			var next_level = user.multitap_level + 1;
			let multi_tap = await multiTap.findOne({level: next_level}).exec();
			var up_next_level = multi_tap?.level || 0;
			var next_level_energy = user.multienergy_level + 1;			
			var energy_lvl = await energyLevel.findOne({level: next_level_energy}).exec();
			var up_next_level_energy = energy_lvl?.level || 0;

			res.json({	status : 1, 
						current_level: user.multitap_level, 
						next_level:up_next_level, 
						needed_points:multi_tap?.needed_points || null,
						current_level_energy:user.multienergy_level,
						next_level_energy : up_next_level_energy,
						needed_points_energy : energy_lvl?.needed_points || null
					}); 	

		}    
	} catch(error) {
		console.log("Error Getting User Info",error);
		res.json({status:0, msg:error.message});
	}
});


router.post('/upgradeNextLevelEnergy', common.originMiddle, async (req, res) => {
    try {
        let info = req.body;
        let project = { _id: 0, created_at: 0, updated_at: 0 };

        let user = await userPoints.findOne({ $and: [{  chatId: info.formData.chatId }] }, project).exec();

        if (user) {
            var next_level = user.multienergy_level + 1;
            let energy_lvl = await energyLevel.findOne({ level: next_level }).exec();
            // let multi_tap = await multiTap.findOne({ level: next_level }).exec();

            if (user.points >= energy_lvl.needed_points) {
                var updated_points = user.points - energy_lvl.needed_points;
                var updated_energy = user.tap_energy_level + 500;

                var data = {
                    points: updated_points,
                    tap_energy_level: updated_energy,
                    current_energy : updated_energy,
                    multienergy_level: next_level
                };

                await userPoints.updateOne({  chatId: info.formData.chatId }, data).exec();
                next_level = next_level + 1;
                energy_lvl = await energyLevel.findOne({ level: next_level }).exec();

                user = await userPoints.findOne({ $and: [{ chatId: info.formData.chatId }] }, project).exec();

                user.username = await common.decryptParams(user.username);
                user.chatId = await common.decryptParams(user.chatId);

	            res.json({
                    status: 1,
                    userScore: user,
                    // current_level: user.multienergy_level,
                    // next_level: next_level,
                    // needed_points: energy_lvl.needed_points
                });
            } else {
                res.json({ status: 0, msg: "Insufficient Points" });
            }
        }
    } catch (error) {
        console.error("Error upgrade Next Level Energy",error);
        res.json({ status: 0, msg: error.message });
    }
});


router.post('/upgradeNextLevelTap', common.originMiddle, async (req, res) => {
    try {
        let info = req.body;
        info.chatId = req.chatId;
        info.username = req.username;
        let project = { _id: 0, created_at: 0, updated_at: 0 };
        let user = await userPoints.findOne({ $and: [{ chatId: info.formData.chatId }] }, project).exec();
        if (user) {
            var next_level = user.multitap_level + 1;
            let multi_tap = await multiTap.findOne({ level: next_level }).exec();
            if (user.points >= multi_tap.needed_points) {

                var updated_points = user.points - multi_tap.needed_points;
                var updated_energy = user.tap_energy + 1;

                var data = {
                    points: updated_points,
                    tap_energy: updated_energy,
                    multitap_level: next_level
                };

                await userPoints.updateOne({  chatId: info.formData.chatId }, data).exec();
                next_level = next_level + 1;

                multi_tap = await multiTap.findOne({ level: next_level }).exec();

                user = await userPoints.findOne({ $and: [{ chatId: info.formData.chatId }] }, project).exec();

                user.username = await common.decryptParams(user.username);
                user.chatId = await common.decryptParams(user.chatId);

                let userLevel = await level.aggregate([
                    { '$match': { '$expr': { '$and': [{ '$gte': [user.points, '$points_from'] }, { '$lte': [user.points, '$points_upto'] }] } } },
                    { '$project': { _id: 0 } }
                ]).exec();

                res.json({
                    status: 1,
                    userScore: user,
                    // current_level: user.multitap_level,
                    // next_level: next_level,
                    // needed_points: multi_tap.needed_points
                });
            } else {
                res.json({ status: 0, msg: "Insufficient Points" });
            }
        }
    } catch (error) {
        console.error(error);
        res.json({ status: 0, msg: "Something went wrong" });
    }
});


router.post('/getlvl', async (req, res) => {
    try {
        let chatId = req.body.data.chatId;

        let user = await userPoints.findOne({ chatId: chatId }).exec();
        
        user.username = await common.decryptParams(user.username)
        user.chatId = await common.decryptParams(user.chatId)

        if (!user) {
            return res.json({ status: 0, msg: "No user found!" });
        }

        const userlvl = user.level
        let level1 = await level.findOne({level_name:userlvl}).exec();

        if (!level1) {
            return res.json({ status: 0, msg: "No levels found!" });
        }

        res.json({ status: 1, user: user, level: level1 });

    } catch (error) {
        console.error(error);
        res.json({ status: 0, msg: "Something went wrong" });
    }
});


module.exports = router;
