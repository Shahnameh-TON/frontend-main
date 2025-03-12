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
const moment = require('moment');

router.get('/getcomboData', common.originMiddle, async(req,res) => {
	try{
		let reward = await dailycombo.find().exec();
		if(reward){
          res.json({ status: 1, data: reward });
		}else{
      		res.json({ status: 0, msg: "Something went wrong" });
		}
	} catch (error) {
    	console.error('Error getting rewards data', error);
    	res.json({ status: 0, msg: error.message });
  }
})



router.post('/reducePoints', async (req, res) => {
  try {
    const { chatId, combo_points, username, profit, combo_lvl, combo_lvlname } = req.body;
    const user = await userPoints.findOne({ chatId });
    if (!user) {
      return res.status(404).json({ status: 0, msg: 'User not found' });
    }

    if (user.points < combo_points) {
      return res.json({ status: 0, msg: 'Insufficient balance' });
    }

    user.points -= combo_points;
    user.combo_points = (user.combo_points || 0) + combo_points;
    user.combo_profit = (user.combo_profit || 0) + (profit || 0);
    user.lastRewardTime = new Date();

    const currentDate = moment().startOf('day').toDate();

    const selectedComboDoc = await selectedCombo.findOne({
      'combos.level_name': combo_lvlname,
      'createdAt': {
        $gte: currentDate,
        $lt: moment(currentDate).endOf('day').toDate()
      }
    });

    if (selectedComboDoc) {
      const matchingCombo = selectedComboDoc.combos.find(combo => combo.level_name === combo_lvlname);

      if (matchingCombo && !user.selected_cards?.some(card => card.level_name === matchingCombo.level_name)) {
        user.selected_cards = [...(user.selected_cards || []), {
          level_name: matchingCombo.level_name,
          level: matchingCombo.level,
          overall_profit: matchingCombo.overall_profit,
          profit_per_hour: matchingCombo.profit_per_hour,
          created_at: matchingCombo.created_at,
          updated_at: matchingCombo.updated_at,
          image: matchingCombo.image,
          category: matchingCombo.category
        }];

        const selectedCardsCount = user.selected_cards.length;

        if (selectedCardsCount <= 2) {
          return res.json({
            status: 1,
            match: 1,
            card: selectedCardsCount,
            msg: `Match found and ${selectedCardsCount === 1 ? 'first' : 'second'} card selected successfully`,
            matchingCard: matchingCombo,
            selected_cards: user.selected_cards
          });
        }
      }
    }

    if (user.selected_cards?.length === 3 && user.combo_rwd_sts !== 2) {
      user.combo_rwd_sts = 1;
    }
    await updateUserCardDocument(chatId, combo_lvlname, combo_lvl);
    await user.save();
    res.json({
      status: 1,
      msg: 'Points reduced and combo processed successfully',
      combo_points: user.combo_points,
      selected_cards: user.selected_cards
    });
  } catch (error) {
    console.error('Error reducing points:', error);
    res.status(500).json({ status: 0, msg: 'Error reducing points' });
  }
});

async function updateUserCardDocument(chatId, combo_lvlname, combo_lvl) {
  const userCardsDoc = await userCards.findOne({ chatId });
  if (userCardsDoc) {
    const cardToUpdate = userCardsDoc.user_cards.find(card => card.card_name === combo_lvlname);
    if (cardToUpdate) {
      cardToUpdate.level_acquired = combo_lvl;
    } else {
      userCardsDoc.user_cards.push({
        card_name: combo_lvlname,
        level_acquired: combo_lvl
      });
    }
    await userCardsDoc.save();
  }
}

router.post('/claimpoints', async (req, res) => {
  try {
    const { chatId, username, comboPoints } = req.body;
    const user = await userPoints.findOne({ chatId: chatId });

    if (!user) {
      return res.status(404).json({ status: 0, msg: 'User not found' });
    }
    const previousLevel = user.level; 

    user.points += 5000000;
    user.combo_rwd_sts = 2;
    user.combo_reward_date = new Date();

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
  		}
    }

    await user.save();

    res.status(200).json({ status: 1, msg: 'Points credited successfully' });
  } catch (error) {
    console.error('Error claiming points:', error);
    res.status(500).json({ status: 0, msg: 'Error claiming points' });
  }
});


router.post('/getUserCards', async (req, res) => {
    try {
        const info = req.body;
        let project = {chatId : 0, username : 0, created_at : 0, updated_at : 0, _id : 0, "user_cards._id" : 0}

        const user_cards = await userCards.findOne({ chatId: info.chatId },project).exec();

        if(user_cards){
        	return res.json({success : 1, data : user_cards})
        }else{
        	return res.json({success : 0, msg : "user card not found"})
        }

    } catch (error) {
        console.error("Error updating bank or exchange status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.get('/getcombobasedData', async (req, res) => {
  const category = req.query.category; 

  try {
    if (!category) {
      return res.status(400).json({ status: 0, msg: "Category is required." });
    }
    const combos = await dailycombo.find({ category: category }).exec();
    
    if (combos.length === 0) {
      return res.status(404).json({ status: 0, msg: "No combos found for this category." });
    }

    return res.status(200).json({ status: 1, data: combos });
  } catch (error) {
    console.error('Error fetching combo data:', error);
    return res.status(500).json({ status: 0, msg: "Internal server error." });
  }
});


module.exports = router;
