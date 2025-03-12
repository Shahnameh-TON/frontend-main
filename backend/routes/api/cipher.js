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


router.post('/updateCipherSts', async (req, res) => {
    try {
        const info = req.body;
        let updation = {reward_status : 0};
		let updatedUser = await userPoints.updateOne({$and:[{ chatId:info.chatId}]},updation).exec();
        if (updatedUser) {
            return res.json({ success: 1, msg: "reward status updated"});
        }else{
            return res.json({success: 0,  msg: "something went wrong"});
        }
    } catch (error) {
        console.error("Error updating cipher status!", error);
        res.json({ success: 0, msg: "Error fetching list!" });
    }
});


router.post('/addreward', common.originMiddle,async (req, res) => {
  try {
    const { chatId, username, points } = req.body;

    if (!chatId || !username || !points) {
      return res.json({ success: 0, msg: 'Invalid input' });
    }

    const user = await userPoints.findOne({ chatId }).exec();
    if (!user) {
      return res.json({ success: 0, msg: 'User not found' });
    }

    const previousLevel = user.level; 

    const claimedDate = new Date(user.cipher_claimed_date);
    const today = new Date();

    claimedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if(claimedDate.getTime() !== today.getTime()){
    	return res.json({success : 0, msg : "Find Cipher First"});
    }
    // const currentDate = new Date().toISOString().slice(0, 10); 
    // const claimedDate = user.cipher_claimed_date ? user.cipher_claimed_date.toISOString().slice(0, 10) : null;

    // if (currentDate === claimedDate) {
    //   return res.json({ success: 0, msg: 'Points already claimed today' });
    // }

    user.points += points;
    user.reward_status = 1;

    let userLevel = await level.aggregate([
	    { '$match': { '$expr': { '$and': [{ '$gte': [user.points, '$points_from'] }, { '$lte': [user.points, '$points_upto'] }] } } },
	    { '$project': { _id: 0 } }
	]).exec();

	if (userLevel.length > 0) {

        let newLevel = userLevel[0];
        if (previousLevel !== newLevel?.level_name) {
			let project = {_id : 0};
	    	let multi_tap = await multiTap.find({},project).exec();
			let energy_level = await energyLevel.find({},project).exec();

        	// console.log("before tap_energy", user.tap_energy);			

		    // if(user.tap_energy < newLevel?.tap_level ) {
				user.tap_energy = newLevel?.tap_level;
			// } else if(user.tap_energy >= newLevel?.tap_level){
				// user.tap_energy = user.tap_energy;
			// } else {
				// user.tap_energy = user.tap_energy + 1;
			// }

        	console.log("after tap_energy", user.tap_energy);			

        	// console.log("before tap_energy_level", user.tap_energy_level);			

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

        	console.log("after tap_energy_level", user.tap_energy_level);			

		    for (let i = 2; i <= user.multitap_level; i++) {
		      let matchedMultiTap = multi_tap.find(mt => mt.level === i);
		      if (matchedMultiTap) {
		        user.tap_energy += matchedMultiTap.tap_level; 
		      } else {
		        user.tap_energy += 1;  
		      }
		    }

        	console.log("after multiTap tap_energy", user.tap_energy);			


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

        	console.log("after energy_level tap_energy_level", user.tap_energy_level);			

			await updateSkin(user, userLevel[0]);
	        user.level = newLevel?.level_name;
		}
	}
    // user.cipher_claimed_date = new Date();
    await user.save();

    res.status(200).json({ success: 1, msg: 'Points credited successfully', data: user });
  } catch (error) {
    console.error('Error crediting points:', error);
    res.status(500).json({ success: 0, msg: 'Internal server error' });
  }
});


router.get('/getclaim',common.originMiddle,async(req,res)=>{

	try{
	    const { chatId, username } = req.body;

	    const user = await userPoints.findOne({ chatId }).exec();
	    if (!user) {
	      return res.json({ success: 0, msg: 'User not found' });
	    }
	    const currentDate = new Date().toISOString().slice(0, 10); 
	    const claimedDate = user.cipher_claimed_date ? user.cipher_claimed_date.toISOString().slice(0, 10) : null;

	    if (currentDate === claimedDate) {
	      return res.json({ success: 0, msg: 'Points already claimed today' });
	    }
	}
	catch(err){
		console.error("Error Fetching Status",err);
	    res.json({ success: 0, msg: err.message });
	}
})


module.exports = router;

