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


router.post('/getSkinsData', common.originMiddle, async(req,res) => {
	try{
		let project = {_id : 0};
		let skin = await skins.find({},project).exec();

		if(skin){
          res.json({ status: 1, data: skin[0]});
		}else{
      		res.json({ status: 0, msg: "Something went wrong" });
		}
	} catch (error) {
    	console.error('Error getting skins data', error);
    	res.json({ status: 0, msg: error.message });
  }
})


router.post('/buySkin', common.originMiddle, async(req,res) => {
	try{
    	const info = req.body;
    	let userPointReduce = await userPoints.findOneAndUpdate(
    		{ chatId: info.chatId },
    		{ $inc : {points : -info.required_points}},
    		{ new: true }
    		).exec();

    	if(userPointReduce){
    		let user_skins = await userSkins.findOneAndUpdate(
    			{ chatId: info.chatId, "user_skins.is_selected": 1 },
    			{ $set: { "user_skins.$.is_selected": 0 } }
    		).exec();

    		let newSkin = {
		        image: info.image, 
		        is_selected: 1,
		        is_acquired: 1,
		        name : info.character_name,
		    };

          	let skinUpdate = await userSkins.findOneAndUpdate(
	        	{ chatId: info.chatId },
	        	{ $push: { user_skins: newSkin } },
	        	{ new: true } 
	      	).exec();

	      	if(skinUpdate){
	      		res.json({status : 1, msg : "Skin Updated Successfully"});
	      	}else{
	      		res.json({status : 0, msg : "Something Went Wrong"});
	      	}
    	}else{
    		res.json({status : 0, msg : "User Not Found"});
    	}
	} catch (error) {
    	console.error('Error buying skin ', error);
    	res.json({ status: 0, msg: error.message });
  	}
});


router.post('/chooseSkin', common.originMiddle, async(req,res) => {
	try{
    	const info = req.body;

  		let user_skins = await userSkins.findOneAndUpdate(
  			{ chatId: info.chatId, "user_skins.is_selected": 1 },
  			{ $set: { "user_skins.$.is_selected": 0 } }
  		).exec();

  		let newSkin = {
	        image: info.image, 
	        is_selected: 1,
	        is_acquired: 1,
	    };

      let skinUpdate = await userSkins.findOneAndUpdate(
      	{ chatId: info.chatId, "user_skins.image" : info.image },
      	{ $set: { "user_skins.$.is_selected": 1 } },
      	{ new: true } 
    	).exec();

    	if(skinUpdate){
    		res.json({status : 1, msg : "Skin Updated Successfully"});
    	}else{
    		res.json({status : 0, msg : "Something Went Wrong"});
    	}
		} catch (error) {
	    	console.error('Error buying skin ', error);
	    	res.json({ status: 0, msg: error.message });
	  	}
});


function convertTitle(input) {
  return input.replace(/\s+/g, '').toLowerCase();
}

async function updateSkin(user, newLevel) {

    let userLevelName = await level.find({}, { image_name: 1, formatted_name :1, _id: 0 });

    let user_skins = await userSkins.aggregate([
        {
            $match: {
                chatId: user.chatId
            }
        },
        {
            $project: {
                user_skins: {
                    $filter: {
                        input: "$user_skins",
                        as: "skin",
                        cond: {
                            $and: [
                                { $eq: ["$$skin.is_selected", 1] },
                                { $eq: ["$$skin.is_acquired", 1] }
                            ]
                        }
                    }
                }
            }
        }
    ]).exec();

    let matchFound = user_skins[0].user_skins.some(skin =>
        userLevelName.some(level => level.formatted_name === skin.name)
    );

    let currentUserSkin = user_skins[0].user_skins[0]?.name;

    let newLevelImageName = newLevel?.image_name.toLowerCase();
    let newLevelName = newLevel?.formatted_name;
    let prevLevel = convertTitle(user.level);
	
	  let updateQuery = {
        chatId: user.chatId,
        "user_skins.name": prevLevel
    };

    let updateData = matchFound
        ? { 
            $set: { 
                "user_skins.$.image": newLevelImageName,
                "user_skins.$.name": newLevelName,
                "user_skins.$.is_selected": 1,
                "user_skins.$.is_acquired": 1 
            }
        }
        : { 
            $set: { 
                "user_skins.$.image": newLevelImageName,
                "user_skins.$.name": newLevelName,
                "user_skins.$.is_selected": 0,
                "user_skins.$.is_acquired": 1 
            }
        };

    return await userSkins.findOneAndUpdate(updateQuery, updateData, { new: true }).exec();
}


module.exports = {
	router,
	updateSkin
};
