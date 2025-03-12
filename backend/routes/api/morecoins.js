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

const { getChatMember } = require('../../test');

router.post('/getDailyRewards', common.originMiddle, async (req,res) => {
	try{
		let project = {_id : 0, created_at : 0, updated_at : 0, "rewards._id": 0};
		let dailyRewards = await dailyReward.findOne({},project).exec();
		if(dailyRewards) {
			res.json({status : 1, dailyReward : dailyRewards});
		} else {
			res.json({status : 0, msg:'Daily Rewards Not Exists'});	
		}

	} catch(error) {
		res.json({status:0, msg:"Something went wrong"});
	}
})


router.get('/getVieos', common.originMiddle, async (req,res) => {
	try{
		let project = {_id : 0, created_at : 0, updated_at : 0};
		let videos = await video.find({}).exec();
		if(videos) {
			res.json({status : 1, videoS : videos});
		} else {
			res.json({status : 0, msg:'Video Not Exists'});	
		}

	} catch(error) {
		console.error(error)
		res.json({status:0, msg:"Something went wrong"});
	}
});


router.post('/channelJoined', common.originMiddle, async (req,res) => {
	try{
		let info = req.body;

	   	let project = {_id : 0, created_at : 0, updated_at : 0};
		let user = await userPoints.findOne({chatId:info.chatId},project).exec();

		if(user && user.tele_channel_joined){
			return res.json({status : 0, msg:'Reward Already Credited', joined : true});
		}

        let previousLevel = user.level;

	   	const channelUsername = '@Shahnameh_news';
	   	let decryptChatId = common.decryptParams(info.chatId);
	    const member = await getChatMember(channelUsername, decryptChatId);

	    if (member && member.status === 'member') {
    	    if(!user){
    	        return res.json({ status: 0, msg: 'User not found' });
    	    }

    		if(!user.tele_channel_joined){
    			let points = user.points;
    			let rewardPoints = info.points;
    			let totalPoints = points + rewardPoints;

        		let userLevel = await level.aggregate([
                    { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
                    { '$project': { _id: 0 } }
                ]).exec();

                let updation;

                if (userLevel.length > 0) {

                    let newLevel = userLevel[0];
                    if (previousLevel !== newLevel?.level_name) {

                        let project = {_id : 0};
                        let multi_tap = await multiTap.find({},project).exec();
                        let energy_level = await energyLevel.find({},project).exec();

                        // if(user.tap_energy < newLevel?.tap_level ) {
                            user.tap_energy = newLevel?.tap_level;
                        // } else if(user.tap_energy >= newLevel?.tap_level){
                        //     user.tap_energy = user.tap_energy;
                        // } else {
                        //     user.tap_energy = user.tap_energy + 1;
                        // }

                        // if(user.tap_energy_level < newLevel?.energy_level ) {
                            user.tap_energy_level = newLevel?.energy_level;
                            user.current_energy = newLevel?.energy_level;
                        // } else if(user.tap_energy_level >= newLevel?.energy_level){
                        //     user.tap_energy_level = user.tap_energy_level;
                        //     user.current_energy = user.tap_energy_level;
                        // }else {
                        //     user.tap_energy_level = user.tap_energy_level + 500;
                        //     user.current_energy = user.tap_energy_level + 500;
                        // }

                        for (let i = 2; i <= user.multitap_level; i++) {
                          let matchedMultiTap = multi_tap.find(mt => mt.level === i);
                          if (matchedMultiTap) {
                            user.tap_energy += matchedMultiTap.tap_level; 
                          } else {
                            user.tap_energy += 1;  
                          }
                        }

                        for (let i = 2; i <= user.multienergy_level; i++) {
                          let matchedEnergyLevel = energy_level.find(el => el.level === i);
                          if (matchedEnergyLevel) {
                            user.tap_energy_level += matchedEnergyLevel.energy_level; 
                            user.current_energy += matchedEnergyLevel.energy_level; 
                          } else {
                            user.tap_energy_level += 500;  
                            user.current_energy += 500;  
                          }
                        }

                        await updateSkin(user, userLevel[0]);

                        user.level = newLevel?.level_name;
                        user.tele_channel_joined = 1;
                        user.points = totalPoints; 
                    }
                }

                await user.save();
                return res.json({ success: 1, msg:'User Joined and reward credited'});
    		}
		}else{
			return res.json({status : 0, msg:'User is not a member'});
		} 
	} catch(error) {
        console.error("Error updating channel Joined", error);
		res.json({status:0, msg:"Something went wrong"});
	}
});


router.post('/updateRewardStatus', common.originMiddle, async (req, res) => {
    try {
        let info = req.body;

        let project = { _id: 0, created_at: 0, updated_at: 0 };
        
        let userPoint = await userPoints.findOne({ chatId: info.chatId }, project).exec();

        if (!userPoint) {
            return res.json({ status: 0, msg: 'User not found' });
        }

        let previousLevel = userPoint.level;        

        let dynamicStatusField = null;

        Object.keys(info).forEach(key => {
            if (info[key] === 1 || info[key] === 2) {
                dynamicStatusField = key;
                // console.log('Found status field:', dynamicStatusField);
            }
        });

        if (!dynamicStatusField) {
            return res.json({ status: 0, msg: 'No valid status field found' });
        }

        let videoIdField = '';
        if (dynamicStatusField === 'you_video_sts1') {
            videoIdField = 'videoId1';
        } else if (dynamicStatusField === 'you_video_sts2') {
            videoIdField = 'videoId2';
        } else if (dynamicStatusField === 'you_video_sts3') {
            videoIdField = 'videoId3';
        }

        const newStatusValue = info[dynamicStatusField];
        let updateObject = { [dynamicStatusField]: newStatusValue };

        if (newStatusValue === 1 || newStatusValue === 2) {
            updateObject[videoIdField] = info.videoId;
        }

        if (newStatusValue === 2) {
            const pointsToAdd = parseInt(info.points, 10);
            updateObject.points = (userPoint.points || 0) + pointsToAdd;

            let userLevel = await level.aggregate([
                { '$match': { '$expr': { '$and': [{ '$gte': [updateObject.points, '$points_from'] }, { '$lte': [updateObject.points, '$points_upto'] }] } } },
                { '$project': { _id: 0 } }
            ]).exec();

            if (userLevel.length > 0) {

                let newLevel = userLevel[0];

                if (previousLevel !== newLevel?.level_name) {
                    let project = {_id : 0};
                    let multi_tap = await multiTap.find({},project).exec();
                    let energy_level = await energyLevel.find({},project).exec();

                    // if(userPoint.tap_energy < newLevel?.tap_level ) {
                        updateObject.tap_energy = newLevel?.tap_level;
                    // } else if(userPoint.tap_energy >= newLevel?.tap_level){
                    //     updateObject.tap_energy = userPoint.tap_energy;
                    // } else {
                    //     updateObject.tap_energy = userPoint.tap_energy + 1;
                    // }

                    // if(userPoint.tap_energy_level < newLevel?.energy_level ) {
                        updateObject.tap_energy_level = newLevel?.energy_level;
                        updateObject.current_energy = newLevel?.energy_level;
                    // } else if(userPoint.tap_energy_level >= newLevel?.energy_level){
                    //     updateObject.tap_energy_level = userPoint.tap_energy_level;
                    //     updateObject.current_energy = userPoint.tap_energy_level;
                    // }else {
                    //     updateObject.tap_energy_level = userPoint.tap_energy_level + 500;
                    //     updateObject.current_energy = userPoint.tap_energy_level + 500;
                    // }

                    for (let i = 2; i <= userPoint.multitap_level; i++) {
                      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
                      if (matchedMultiTap) {
                        updateObject.tap_energy += matchedMultiTap.tap_level; 
                      } else {
                        updateObject.tap_energy += 1;  
                      }
                    }

                    for (let i = 2; i <= userPoint.multienergy_level; i++) {
                      let matchedEnergyLevel = energy_level.find(el => el.level === i);
                      if (matchedEnergyLevel) {
                        updateObject.tap_energy_level += matchedEnergyLevel.energy_level; 
                        updateObject.current_energy += matchedEnergyLevel.energy_level; 
                      } else {
                        updateObject.tap_energy_level += 500;  
                        updateObject.current_energy += 500;  
                      }
                    }

                    await updateSkin(userPoint, userLevel[0]);

                    updateObject.level = newLevel?.level_name; 
                }
            }
        }   

        const updateRewardSts = await userPoints.updateOne(
            { chatId: info.chatId },
            { $set: updateObject }
        ).exec();

        if (updateRewardSts.modifiedCount > 0) {
            return res.json({ status: 1, msg: 'Reward Status and Points Updated Successfully', reward: false });
        } else {
            return res.json({ status: 0, msg: 'Failed to update reward status' });
        }

    } catch (error) {
        console.error("Error updating reward status", error);
        res.json({ status: 0, msg: error.message });
    }
});



router.post('/chkrewards', async (req, res) => {
  const { chatId, username ,points} = req.body;

  try {
    let user = await userPoints.findOne({ chatId:chatId });

    if (!user) {
        res.status(404).json({ status: 0, message: "User Not Found" });
    } else {
      user.points += 10000;
      user.you_video_sts1= 2;
    }

  	let userLevel = await level.aggregate([
	    { '$match': { '$expr': { '$and': [{ '$gte': [user.points, '$points_from'] }, { '$lte': [user.points, '$points_upto'] }] } } },
	    { '$project': { _id: 0 } }
	]).exec();

	if (userLevel.length > 0) {
		let project = {_id : 0};
    	let multi_tap = await multiTap.find({},project).exec();
		let energy_level = await energyLevel.find({},project).exec();

        let newLevel = userLevel[0];

	    // if(user.tap_energy < newLevel?.tap_level ) {
			user.tap_energy = newLevel?.tap_level;
		// } else if(user.tap_energy >= newLevel?.tap_level){
		// 	user.tap_energy = user.tap_energy;
		// } else {
		// 	user.tap_energy = user.tap_energy + 1;
		// }

		// if(user.tap_energy_level < newLevel?.energy_level ) {
			user.tap_energy_level = newLevel?.energy_level;
			user.current_energy = newLevel?.energy_level;
		// } else if(user.tap_energy_level >= newLevel?.energy_level){
		// 	user.tap_energy_level = user.tap_energy_level;
		// 	user.current_energy = user.tap_energy_level;
		// }else {
		// 	user.tap_energy_level = user.tap_energy_level + 500;
		// 	user.current_energy = user.tap_energy_level + 500;
		// }

		let matchedMultiTap = multi_tap.find(mt => mt.level > 1 && mt.level == user.multitap_level);
	    if (matchedMultiTap) {
	        user.tap_energy += matchedMultiTap.tap_level;
	    }

	    let matchedEnergyLevel = energy_level.find(el => el.level > 1 && el.level == user.multienergy_level);
	    if (matchedEnergyLevel) {
	        user.tap_energy_level += matchedEnergyLevel.energy_level;
	        user.current_energy += matchedEnergyLevel.energy_level;
	    }

	    await updateSkin(user, userLevel[0]);

        user.level = newLevel?.level_name;
	}

    await user.save();

    res.status(200).json({ status: 1, message: 'Points updated successfully', user });
  } catch (error) {
    console.error("Error updating check rewards", error);
    res.status(500).json({ status: 0, message:  error.message });
  }
});


router.post('/subscribe', async (req, res) => {
    try {
        const info = req.body;
        const userdata = await userPoints.findOne({ chatId: info.chatId}).exec();

        if (userdata) {
            const updatedUser = await userPoints.findOneAndUpdate(
                { chatId: info.chatId },
                { 
                    $set: { subs: 1 },              
                },
                { new: true } 
            ).exec();

            return res.json({ success: 1, data: updatedUser });
        } else {
            return res.json({ success: 0, msg: "User data not found" });
        }

    } catch (error) {
        console.error("Error updating subscription status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/subXAcc', async (req, res) => {
    try {
        const info = req.body;
        const userdata = await userPoints.findOne({ chatId: info.chatId}).exec();

        if (userdata) {
            const updatedUser = await userPoints.findOneAndUpdate(
                { chatId: info.chatId },
                { 
                    $set: { insts: 1 },              
                },
                { new: true } 
            ).exec();

            return res.json({ success: 1, data: updatedUser });
        } else {
            return res.json({ success: 0, msg: "User data not found" });
        }

    } catch (error) {
        console.error("Error updating subscription status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/clmXaccRwd', async (req, res) => {
    try {
        const info = req.body;
        const user = await userPoints.findOne({ chatId: info.chatId}).exec();

        if (user) {
            let previousLevel = user.level;        

            const updatedUser = await userPoints.findOneAndUpdate(
                { chatId: info.chatId},
                { 
                    // $set: { insts: 2 },              
                    $inc: { points: info.points }          
                },
                { new: true } 
            ).exec();

            let points = user.points;
			let rewardPoints = info.points;
			let totalPoints = points + rewardPoints;

    		let userLevel = await level.aggregate([
                { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
                { '$project': { _id: 0 } }
            ]).exec();

            let updation;

            if (userLevel.length > 0) {
                let newLevel = userLevel[0];

                if (previousLevel !== newLevel?.level_name) {                
                    let project = {_id : 0};
                    let multi_tap = await multiTap.find({},project).exec();
                    let energy_level = await energyLevel.find({},project).exec();

                    // if(user.tap_energy < newLevel?.tap_level ) {
                        user.tap_energy = newLevel?.tap_level;
                    // } else if(user.tap_energy >= newLevel?.tap_level){
                    //     user.tap_energy = user.tap_energy;
                    // } else {
                    //     user.tap_energy = user.tap_energy + 1;
                    // }

                    // if(user.tap_energy_level < newLevel?.energy_level ) {
                        user.tap_energy_level = newLevel?.energy_level;
                        user.current_energy = newLevel?.energy_level;
                    // } else if(user.tap_energy_level >= newLevel?.energy_level){
                    //     user.tap_energy_level = user.tap_energy_level;
                    //     user.current_energy = user.tap_energy_level;
                    // }else {
                    //     user.tap_energy_level = user.tap_energy_level + 500;
                    //     user.current_energy = user.tap_energy_level + 500;
                    // }

                    for (let i = 2; i <= user.multitap_level; i++) {
                      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
                      if (matchedMultiTap) {
                        user.tap_energy += matchedMultiTap.tap_level; 
                      } else {
                        user.tap_energy += 1;  
                      }
                    }

                    for (let i = 2; i <= user.multienergy_level; i++) {
                      let matchedEnergyLevel = energy_level.find(el => el.level === i);
                      if (matchedEnergyLevel) {
                        user.tap_energy_level += matchedEnergyLevel.energy_level; 
                        user.current_energy += matchedEnergyLevel.energy_level; 
                      } else {
                        user.tap_energy_level += 500;  
                        user.current_energy += 500;  
                      }
                    }

                    await updateSkin(user, userLevel[0]);

                    user.level = newLevel?.level_name;
                    user.insts = 2;
                    user.points = totalPoints; 
                }
            }

            await user.save();
            return res.json({ success: 1, data: user });

        }else{
            return res.json({ success: 0, msg: "User data not found" });
        }
    } catch (error) {
        console.error("Error updating subscription status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/clmRwd', async (req, res) => {
    try {
        const info = req.body;
        const user = await userPoints.findOne({ chatId: info.chatId}).exec();

        if (user) {
            let previousLevel = user.level;     

            const updatedUser = await userPoints.findOneAndUpdate(
                { chatId: info.chatId },
                { 
                    $set: { subs: 2 },              
                    $inc: { points: info.points }          
                },
                { new: true } 
            ).exec();

            let points = user.points;
			let rewardPoints = info.points;
			let totalPoints = points + rewardPoints;

    		let userLevel = await level.aggregate([
                { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
                { '$project': { _id: 0 } }
            ]).exec();

            let updation;

            if (userLevel.length > 0) {
                let newLevel = userLevel[0];

                if (previousLevel !== newLevel?.level_name) {              

                    let project = {_id : 0};
                    let multi_tap = await multiTap.find({},project).exec();
                    let energy_level = await energyLevel.find({},project).exec();

                    // if(user.tap_energy < newLevel?.tap_level ) {
                        user.tap_energy = newLevel?.tap_level;
                    // } else if(user.tap_energy >= newLevel?.tap_level){
                    //     user.tap_energy = user.tap_energy;
                    // } else {
                    //     user.tap_energy = user.tap_energy + 1;
                    // }

                    // if(user.tap_energy_level < newLevel?.energy_level ) {
                        user.tap_energy_level = newLevel?.energy_level;
                        user.current_energy = newLevel?.energy_level;
                    // } else if(user.tap_energy_level >= newLevel?.energy_level){
                    //     user.tap_energy_level = user.tap_energy_level;
                    //     user.current_energy = user.tap_energy_level;
                    // }else {
                    //     user.tap_energy_level = user.tap_energy_level + 500;
                    //     user.current_energy = user.tap_energy_level + 500;
                    // }

                    for (let i = 2; i <= user.multitap_level; i++) {
                      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
                      if (matchedMultiTap) {
                        user.tap_energy += matchedMultiTap.tap_level; 
                      } else {
                        user.tap_energy += 1;  
                      }
                    }

                    for (let i = 2; i <= user.multienergy_level; i++) {
                      let matchedEnergyLevel = energy_level.find(el => el.level === i);
                      if (matchedEnergyLevel) {
                        user.tap_energy_level += matchedEnergyLevel.energy_level; 
                        user.current_energy += matchedEnergyLevel.energy_level; 
                      } else {
                        user.tap_energy_level += 500;  
                        user.current_energy += 500;  
                      }
                    }

                    await updateSkin(user, userLevel[0]);

                    user.level = newLevel?.level_name;
                    user.subs = 2;
                    user.points = totalPoints; 
                }
            }
            await user.save();
            return res.json({ success: 1, data: user });
        } else {
            return res.json({ success: 0, msg: "User data not found" });
        }

    } catch (error) {
        console.error("Error updating subscription status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/BnkRws', async (req, res) => {
    try {
        const info = req.body;
        const user = await userPoints.findOne({ chatId: info.chatId }).exec();

        if (user) {
            let previousLevel = user.level;

            const updatedUser = await userPoints.findOneAndUpdate(
                { chatId: info.chatId },
                { 
                    $set: { bnkSts: 2 },              
                    $inc: { points: info.points }          
                },
                { new: true } 
            ).exec();


            let points = user.points;
			let rewardPoints = info.points;
			let totalPoints = points + rewardPoints;
            let userLevel = await level.aggregate([
                { '$match': { '$expr': { '$and': [{ '$gte': [totalPoints, '$points_from'] }, { '$lte': [totalPoints, '$points_upto'] }] } } },
                { '$project': { _id: 0 } }
            ]).exec();

            let updation;

            if (userLevel.length > 0) {
                let project = {_id : 0};
                let multi_tap = await multiTap.find({},project).exec();
                let energy_level = await energyLevel.find({},project).exec();

                let newLevel = userLevel[0];
                if (previousLevel !== newLevel?.level_name) {          

                    // if(user.tap_energy < newLevel?.tap_level ) {
                        user.tap_energy = newLevel?.tap_level;
                    // } else if(user.tap_energy >= newLevel?.tap_level){
                    //     user.tap_energy = user.tap_energy;
                    // } else {
                    //     user.tap_energy = user.tap_energy + 1;
                    // }

                    // if(user.tap_energy_level < newLevel?.energy_level ) {
                        user.tap_energy_level = newLevel?.energy_level;
                        user.current_energy = newLevel?.energy_level;
                    // } else if(user.tap_energy_level >= newLevel?.energy_level){
                    //     user.tap_energy_level = user.tap_energy_level;
                    //     user.current_energy = user.tap_energy_level;
                    // }else {
                    //     user.tap_energy_level = user.tap_energy_level + 500;
                    //     user.current_energy = user.tap_energy_level + 500;
                    // }

                    for (let i = 2; i <= user.multitap_level; i++) {
                      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
                      if (matchedMultiTap) {
                        user.tap_energy += matchedMultiTap.tap_level; 
                      } else {
                        user.tap_energy += 1;  
                      }
                    }

                    for (let i = 2; i <= user.multienergy_level; i++) {
                      let matchedEnergyLevel = energy_level.find(el => el.level === i);
                      if (matchedEnergyLevel) {
                        user.tap_energy_level += matchedEnergyLevel.energy_level; 
                        user.current_energy += matchedEnergyLevel.energy_level; 
                      } else {
                        user.tap_energy_level += 500;  
                        user.current_energy += 500;  
                      }
                    }

                    await updateSkin(user, userLevel[0]);

                    user.level = newLevel?.level_name;
                    user.bnkSts = 2;
                    user.points = totalPoints; 
                }
            }

            await user.save();
            return res.json({ success: 1, data: user });
        } else {
            return res.json({ success: 0, msg: "User data not found" });
        }

    } catch (error) {
        console.error("Error updating subscription status!", error);
        res.json({ success: 0, msg: error.message });
    }

});



const extractVideoId = (url) => {
	const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
	const match = url.match(regex);
	return match ? match[1] : null;
};


router.post('/CheckVideosts', common.originMiddle, async (req, res) => {
    try {
        const { chatId, username } = req.body;

        const user = await userPoints.findOne({ chatId: chatId}).exec();

        if (!user) {
            return res.json({ success: 0, msg: 'User not found' });
        }

        const userVideoIds = [user.videoId1, user.videoId2, user.videoId3];

        const videos = await video.find({}).exec();

        const videoIdsFromCollection = videos.map(video => extractVideoId(video.video));

        let updateFields = {};

        if (!videoIdsFromCollection.includes(user.videoId1)) {
            updateFields['you_video_sts1'] = 0; 
        }

        if (!videoIdsFromCollection.includes(user.videoId2)) {
            updateFields['you_video_sts2'] = 0; 
        }

        if (!videoIdsFromCollection.includes(user.videoId3)) {
            updateFields['you_video_sts3'] = 0; 
        }

        if (Object.keys(updateFields).length > 0) {
            await userPoints.updateOne({ chatId: chatId}, { $set: updateFields }).exec();
            return res.json({ success: 1, msg: 'Video status updated successfully', updatedFields: updateFields });
        } else {
            return res.json({ success: 1, msg: 'No status fields needed an update' });
        }

    } catch (error) {
        console.error("Error checking video status", error);
        return res.json({ success: 0, msg: error.message });
    }
});


module.exports = router;
