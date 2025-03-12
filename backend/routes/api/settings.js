const mongoose = require('mongoose');
const common = require('../../helpers/common');
const express = require('express');

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


let router = express.Router();


router.post('/DeleteAcc', async (req, res) => {
  const { chatId } = req.body;
  console.log(chatId);
  
  if (!chatId) {
    return res.status(400).json({ success: 0, message: 'Account ID is required' });
  }

  try {
    const user = await userPoints.findOne({ chatId });
    
    if (!user) {
      return res.status(404).json({ success: 0, message: 'User not found' });
    }
    
    const referralId = user.refferal_id;
        if (referralId) {
      await userPoints.updateMany({refferer_id : referralId}, { $set: { refferer_id: '' } });
    }

    const result = await userPoints.deleteOne({ chatId });
    const result1 = await miniGame.deleteOne({ chatId });
    const result2 = await userSkins.deleteOne({ chatId });
    const result3 = await userCards.deleteOne({ chatId });
    const result4 = await userWallet.deleteOne({ chatId });

    if (result.deletedCount === 0 && result1.deletedCount === 0 && result2.deletedCount === 0 && result3.deletedCount === 0 && result4.deletedCount === 0) {
      return res.status(404).json({ success: 0, message: 'Account not found' });
    }

    res.status(200).json({ success: 1, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ success: 0, message: 'Internal server error' });
  }
});


router.post('/getCryptoList', async (req, res) => {
    try {
        const info = req.body;
        let project = {created_at : 0, _id : 0, type : 0};

        const exchangeData = await bankdata.find({ type: info.type },project).exec();

        if(exchangeData){
        	return res.json({success : 1, data : exchangeData})
        }else{
        	return res.json({success : 0, msg : "Exchange Data not found"})
        }

    } catch (error) {
        console.error("Error getting bank or exchange status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/updateUserBankOrExchange', async (req, res) => {
    try {
        const info = req.body;

        const user = await userPoints.findOne({ chatId: info.chatId }).exec();

        if (!user) {
            return res.json({ success: 0, msg: "User not found" });
        }

        if (user.bnkSts === 2) {
        	  let updateUserExchange = await userPoints.updateOne(
	            {chatId: info.chatId},  
	            { 
	                $set: {
	                    bankOrExchangeImg: info.bankOrExchange,
	                    banktype: info.type,
	                    bankname: info.bankname,
	                } 
	            }
	        ).exec();

        	if (updateUserExchange) {
	            return res.json({ success: 1, msg: "Bank or Exchange Updated Successfully" });
	        } else {
	            return res.json({ success: 1, msg: "Update failed or no changes made" });
	        }
        }

        let updateUserExchange = await userPoints.updateOne(
            { chatId: info.chatId, bnkSts: { $ne: 2 } },  
            { 
                $set: {
                    bankOrExchangeImg: info.bankOrExchange,
                    banktype: info.type,
                    bankname: info.bankname,
                    bnkSts: 1 
                } 
            }
        ).exec();

        if (updateUserExchange) {
            return res.json({ success: 1, msg: "Bank or Exchange Updated Successfully" });
        } else {
            return res.json({ success: 1, msg: "Update failed or no changes made" });
        }

    } catch (error) {
        console.error("Error updating bank or exchange status!", error);
        res.json({ success: 0, msg: error.message });
    }
});


router.post('/getuserInfo1', async (req, res) => {
  const { chatId, username } = req.body;

  try {
    // Query the userinfo collection
    const userInfo = await userPoints.findOne({ chatId });

    if (userInfo) {
      return res.json({ success: 1, data: userInfo });
    } else {
      return res.json({ success: 0, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: 0, message: 'Server error' });
  }
});

module.exports = router;
