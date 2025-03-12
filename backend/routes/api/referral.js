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

router.post('/getreferal' ,async(req,res)=>{
	const Id= req.body.chatId;
		try{
	  const user = await userPoints.findOne({chatId:Id}).exec();
		if(user) {
			user.username = await common.decryptParams(user.username)
			user.chatId = await common.decryptParams(user.chatId)
			res.json({status : 1, levelUser : user});
		} else {
			res.json({status : 0, msg:'User Not foundd'});	
		} 
	}
	catch(err){ 
	  console.error(err);
      res.json({status:0, msg:"Something went wrong"});	
    }
});



router.post('/getUsers', async (req, res) => {
  const { refId } = req.body;

  try {
    const referredUsers = await userPoints.find({ refferer_id: refId.ref }).exec();

    if (referredUsers.length > 0) {
      const usersDetails = referredUsers.map(user => ({
        username: common.decryptParams(user.username),
        points: user.points,
        tap_energy: user.tap_energy,
        level :user.level
      }));

      res.status(200).json({
        status: 1,
        users: usersDetails
      });
    } else {
      res.json({ status: 0, msg: 'No referred users found' });
    }
  } catch (error) {
    console.error('Error fetching referred users:', error);
    res.status(500).json({ status: 0, msg: 'Server error' });
  }
});


module.exports = router;
